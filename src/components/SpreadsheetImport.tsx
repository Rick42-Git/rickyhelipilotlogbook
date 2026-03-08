import { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FileSpreadsheet, Upload, Loader2, Check, AlertTriangle } from 'lucide-react';
import { LogbookEntry, NumericField } from '@/types/logbook';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SpreadsheetImportProps {
  onEntriesImported: (entries: Omit<LogbookEntry, 'id'>[]) => void;
}

// Keywords that identify each field — scored by word overlap
const FIELD_KEYWORDS: { field: keyof Omit<LogbookEntry, 'id'>; keywords: string[]; priority: number }[] = [
  { field: 'date', keywords: ['date', 'flight date', 'day'], priority: 10 },
  { field: 'aircraftType', keywords: ['aircraft type', 'a/c type', 'ac type', 'type', 'helicopter type', 'heli type', 'acft type', 'machine'], priority: 5 },
  { field: 'aircraftReg', keywords: ['aircraft reg', 'a/c reg', 'ac reg', 'registration', 'reg', 'tail', 'tail number', 'rego', 'acft reg', 'call sign'], priority: 6 },
  { field: 'pilotInCommand', keywords: ['pilot in command', 'pic', 'captain', 'pilot', 'commander', 'p1', 'pilot name', 'crew', 'name'], priority: 4 },
  { field: 'flightDetails', keywords: ['flight details', 'details', 'route', 'remarks', 'from to', 'sector', 'notes', 'description', 'dep arr', 'departure arrival', 'place'], priority: 3 },
  { field: 'seDayDual', keywords: ['se day dual', 'day dual', 'single engine day dual', 'dual day'], priority: 8 },
  { field: 'seDayPilot', keywords: ['se day pilot', 'day pilot', 'single engine day pilot', 'day p1', 'pilot day', 'day pic', 'day command'], priority: 8 },
  { field: 'seNightDual', keywords: ['se night dual', 'night dual', 'single engine night dual', 'dual night'], priority: 8 },
  { field: 'seNightPilot', keywords: ['se night pilot', 'night pilot', 'single engine night pilot', 'night p1', 'pilot night', 'night pic', 'night command'], priority: 8 },
  { field: 'instrumentTime', keywords: ['instrument time', 'instr time', 'instrument', 'ifr', 'ifr time', 'inst time', 'actual instrument', 'sim instrument'], priority: 7 },
  { field: 'instructorDay', keywords: ['instructor day', 'instr day', 'instructing day', 'day instructor'], priority: 8 },
  { field: 'instructorNight', keywords: ['instructor night', 'instr night', 'instructing night', 'night instructor'], priority: 8 },
];

function normalizeHeader(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\-/().]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Calculate how well a header matches a set of keywords — returns 0-1 score */
function scoreMatch(normalizedHeader: string, keywords: string[]): number {
  let bestScore = 0;

  for (const kw of keywords) {
    // Exact match is perfect
    if (normalizedHeader === kw) return 1;

    // Check if header contains the keyword or vice versa
    if (normalizedHeader.includes(kw)) {
      const score = kw.length / normalizedHeader.length;
      bestScore = Math.max(bestScore, Math.max(score, 0.7));
      continue;
    }
    if (kw.includes(normalizedHeader)) {
      const score = normalizedHeader.length / kw.length;
      bestScore = Math.max(bestScore, Math.max(score, 0.6));
      continue;
    }

    // Word overlap scoring
    const headerWords = normalizedHeader.split(' ');
    const kwWords = kw.split(' ');
    const matchingWords = kwWords.filter(w => headerWords.includes(w));
    if (matchingWords.length > 0) {
      const score = matchingWords.length / Math.max(headerWords.length, kwWords.length);
      bestScore = Math.max(bestScore, score);
    }
  }

  return bestScore;
}

function mapHeaders(headers: string[]): { columnMap: Record<string, keyof Omit<LogbookEntry, 'id'>>; unmapped: string[] } {
  const columnMap: Record<string, keyof Omit<LogbookEntry, 'id'>> = {};
  const unmapped: string[] = [];
  const usedFields = new Set<string>();

  // Score every header against every field, then greedily assign best matches
  const candidates: { header: string; field: keyof Omit<LogbookEntry, 'id'>; score: number; priority: number }[] = [];

  for (const h of headers) {
    const norm = normalizeHeader(h);
    if (!norm) { unmapped.push(h); continue; }

    for (const { field, keywords, priority } of FIELD_KEYWORDS) {
      const score = scoreMatch(norm, keywords);
      if (score >= 0.3) {
        candidates.push({ header: h, field, score, priority });
      }
    }
  }

  // Sort: highest score first, then highest priority for ties
  candidates.sort((a, b) => b.score - a.score || b.priority - a.priority);

  const usedHeaders = new Set<string>();
  for (const { header, field } of candidates) {
    if (usedFields.has(field) || usedHeaders.has(header)) continue;
    columnMap[header] = field;
    usedFields.add(field);
    usedHeaders.add(header);
  }

  for (const h of headers) {
    if (!usedHeaders.has(h) && normalizeHeader(h)) unmapped.push(h);
  }

  return { columnMap, unmapped };
}

const NUMERIC_FIELDS: NumericField[] = [
  'seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot',
  'instrumentTime', 'instructorDay', 'instructorNight',
];

function parseLocalizedNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let cleaned = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^0-9,.-]/g, '');

  if (!cleaned) return 0;

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastComma > lastDot) {
    // EU style: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // US style: 1,234.56
    cleaned = cleaned.replace(/,/g, '');
  } else if (lastComma !== -1) {
    // 1,5 -> 1.5
    cleaned = cleaned.replace(',', '.');
  }

  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function parseRow(row: Record<string, unknown>, columnMap: Record<string, keyof Omit<LogbookEntry, 'id'>>): Omit<LogbookEntry, 'id'> | null {
  const entry: Record<string, unknown> = {
    date: '',
    aircraftType: '',
    aircraftReg: '',
    pilotInCommand: '',
    flightDetails: '',
    seDayDual: 0,
    seDayPilot: 0,
    seNightDual: 0,
    seNightPilot: 0,
    instrumentTime: 0,
    instructorDay: 0,
    instructorNight: 0,
  };

  for (const [col, field] of Object.entries(columnMap)) {
    const val = row[col];
    if (val === undefined || val === null || val === '') continue;

    if (NUMERIC_FIELDS.includes(field as NumericField)) {
      entry[field] = parseLocalizedNumber(val);
    } else if (field === 'date') {
      if (typeof val === 'number') {
        // Excel serial date
        const d = XLSX.SSF.parse_date_code(val);
        if (d?.y && d?.m && d?.d) {
          entry[field] = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        }
      } else {
        entry[field] = String(val).trim();
      }
    } else {
      entry[field] = String(val).trim();
    }
  }

  // Skip rows with no meaningful data
  const hasData = entry.date || entry.aircraftType || entry.aircraftReg ||
    NUMERIC_FIELDS.some(f => (entry[f] as number) > 0);
  if (!hasData) return null;

  return entry as unknown as Omit<LogbookEntry, 'id'>;
}

export function SpreadsheetImport({ onEntriesImported }: SpreadsheetImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [parsedEntries, setParsedEntries] = useState<Omit<LogbookEntry, 'id'>[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [unmappedCols, setUnmappedCols] = useState<string[]>([]);

  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array', cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, {
        header: 1,
        raw: true,
        defval: '',
      });

      if (matrix.length === 0) {
        toast.error('No data found in spreadsheet');
        setLoading(false);
        return;
      }

      // Detect likely header row from first rows by best field match score
      const scanRows = matrix.slice(0, Math.min(8, matrix.length));
      let headerRowIndex = 0;
      let bestScore = -1;

      scanRows.forEach((row, idx) => {
        const candidateHeaders = row.map(cell => String(cell ?? '').trim()).filter(Boolean);
        if (candidateHeaders.length < 2) return;
        const { columnMap } = mapHeaders(candidateHeaders);
        const score = Object.keys(columnMap).length;
        if (score > bestScore) {
          bestScore = score;
          headerRowIndex = idx;
        }
      });

      const rawHeaders = (matrix[headerRowIndex] || []).map(cell => String(cell ?? '').trim());
      const maxCols = Math.max(rawHeaders.length, ...matrix.slice(headerRowIndex + 1, headerRowIndex + 20).map(r => r.length));

      // Ensure unique/fallback header names
      const seen = new Map<string, number>();
      const headers = Array.from({ length: maxCols }, (_, i) => {
        const base = rawHeaders[i] || `Column ${i + 1}`;
        const count = (seen.get(base) || 0) + 1;
        seen.set(base, count);
        return count === 1 ? base : `${base} (${count})`;
      });

      const rows = matrix.slice(headerRowIndex + 1).map((row) => {
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] ?? '';
        });
        return obj;
      });

      if (rows.length === 0) {
        toast.error('No data rows found in spreadsheet');
        setLoading(false);
        return;
      }

      // Build column mapping from detected headers
      const { columnMap, unmapped } = mapHeaders(headers);
      setUnmappedCols(unmapped);

      // Parse rows
      const entries = rows
        .map(r => parseRow(r, columnMap))
        .filter((e): e is Omit<LogbookEntry, 'id'> => e !== null);

      if (entries.length === 0) {
        toast.error('No valid entries found. Check that column headers match expected format.');
        setLoading(false);
        return;
      }

      setParsedEntries(entries);
      setPreviewOpen(true);
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Failed to read spreadsheet file');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, []);

  const handleConfirm = () => {
    onEntriesImported(parsedEntries);
    toast.success(`Imported ${parsedEntries.length} flight entries`);
    setPreviewOpen(false);
    setParsedEntries([]);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.numbers"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
        }}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="font-mono gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        IMPORT
      </Button>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              IMPORT PREVIEW
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {fileName} — {parsedEntries.length} entries found
            </DialogDescription>
          </DialogHeader>

          {unmappedCols.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-border text-xs font-mono">
              <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">Unrecognised columns skipped: </span>
                <span className="text-foreground">{unmappedCols.join(', ')}</span>
              </div>
            </div>
          )}

          <ScrollArea className="max-h-[400px]">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Reg</th>
                  <th className="text-left p-2">PIC</th>
                  <th className="text-right p-2">Hours</th>
                </tr>
              </thead>
              <tbody>
                {parsedEntries.slice(0, 50).map((e, i) => {
                  const total = NUMERIC_FIELDS.reduce((s, f) => s + (e[f] || 0), 0);
                  return (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2">{e.date || '—'}</td>
                      <td className="p-2">{e.aircraftType || '—'}</td>
                      <td className="p-2">{e.aircraftReg || '—'}</td>
                      <td className="p-2">{e.pilotInCommand || '—'}</td>
                      <td className="p-2 text-right">{total > 0 ? total.toFixed(1) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {parsedEntries.length > 50 && (
              <p className="text-xs text-muted-foreground font-mono p-2 text-center">
                ... and {parsedEntries.length - 50} more entries
              </p>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)} className="font-mono">
              CANCEL
            </Button>
            <Button onClick={handleConfirm} className="font-mono gap-2">
              <Check className="h-4 w-4" />
              IMPORT {parsedEntries.length} ENTRIES
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
