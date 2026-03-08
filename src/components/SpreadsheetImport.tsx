import { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FileSpreadsheet, Loader2, Check, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { LogbookEntry, NumericField } from '@/types/logbook';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

import { ColumnTemplate } from '@/hooks/useColumnTemplates';

interface SpreadsheetImportProps {
  onEntriesImported: (entries: Omit<LogbookEntry, 'id'>[]) => void;
  templates?: ColumnTemplate[];
}

const FIELD_KEYWORDS: { field: keyof Omit<LogbookEntry, 'id'>; keywords: string[]; priority: number }[] = [
  { field: 'date', keywords: ['date', 'flight date', 'day', 'datum', 'dd/mm/yyyy', 'dd mm yyyy'], priority: 3 },
  { field: 'aircraftType', keywords: ['aircraft type', 'a/c type', 'ac type', 'class or type', 'class type', 'type', 'helicopter type', 'heli type', 'acft type', 'machine'], priority: 5 },
  { field: 'aircraftReg', keywords: ['aircraft reg', 'a/c reg', 'ac reg', 'registration', 'registration marks', 'reg marks', 'reg', 'tail', 'tail number', 'rego', 'acft reg', 'call sign'], priority: 6 },
  { field: 'pilotInCommand', keywords: ['pilot in command', 'plt in command', 'plt command', 'pic', 'captain', 'pilot', 'commander', 'p1', 'pilot name', 'crew', 'name'], priority: 4 },
  { field: 'flightDetails', keywords: ['flight details', 'details of flight', 'details', 'route', 'remarks', 'from to', 'sector', 'notes', 'description', 'dep arr', 'departure arrival', 'place'], priority: 3 },
  { field: 'seDayDual', keywords: ['se day dual', 'single engine aircraft day dual', 'single engine day dual', 'single engine aircraft day co pilot', 'single engine day co pilot', 'multi engine aircraft day dual', 'multi engine day dual', 'day dual', 'dual day', 'dual', 'day co pilot', 'co pilot day'], priority: 8 },
  { field: 'seDayPilot', keywords: ['se day pilot', 'single engine aircraft day pic', 'single engine day pic', 'single engine aircraft day picus', 'single engine day picus', 'multi engine aircraft day pic', 'multi engine aircraft day picus', 'multi engine day pic', 'multi engine day picus', 'multi engine aircraft day co pilot', 'day pilot', 'day p1', 'pilot day', 'day pic', 'day picus', 'day command', 'command', 'p1 day', 'picus day'], priority: 8 },
  { field: 'seNightDual', keywords: ['se night dual', 'single engine aircraft night dual', 'single engine night dual', 'single engine aircraft night co pilot', 'single engine night co pilot', 'multi engine aircraft night dual', 'multi engine night dual', 'night dual', 'dual night', 'night co pilot', 'co pilot night'], priority: 8 },
  { field: 'seNightPilot', keywords: ['se night pilot', 'single engine aircraft night pic', 'single engine night pic', 'single engine aircraft night picus', 'single engine night picus', 'multi engine aircraft night pic', 'multi engine aircraft night picus', 'multi engine night pic', 'multi engine night picus', 'multi engine aircraft night co pilot', 'night pilot', 'night p1', 'pilot night', 'night pic', 'night picus', 'night command', 'picus night'], priority: 8 },
  { field: 'instrumentTime', keywords: ['instrument time', 'instr time', 'instrument actual time', 'actual tme', 'actual time', 'instrument time place co pilot', 'instrument time actual time co pilot', 'instrument time fstd time co pilot', 'instrument', 'ifr', 'ifr time', 'inst time', 'actual instrument', 'sim instrument', 'instrument flying', 'fstd time', 'fstd actual time', 'fstd actual time fstd time co pilot'], priority: 7 },
  { field: 'instructorDay', keywords: ['instructor day', 'instructor time se', 'instructor se', 'instr day', 'instr se', 'instructing day', 'day instructor', 'instructor time fstd time co pilot'], priority: 8 },
  { field: 'instructorNight', keywords: ['instructor night', 'instructor time me', 'instructor me', 'instr night', 'instr me', 'instructing night', 'night instructor'], priority: 8 },
];

const NUMERIC_FIELDS: NumericField[] = [
  'seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot',
  'instrumentTime', 'instructorDay', 'instructorNight',
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

function scoreMatch(normalizedHeader: string, keywords: string[]): number {
  let bestScore = 0;
  for (const kw of keywords) {
    if (normalizedHeader === kw) return 1;
    if (normalizedHeader.includes(kw)) {
      bestScore = Math.max(bestScore, Math.max(kw.length / normalizedHeader.length, 0.7));
      continue;
    }
    if (kw.includes(normalizedHeader)) {
      bestScore = Math.max(bestScore, Math.max(normalizedHeader.length / kw.length, 0.6));
      continue;
    }
    const headerWords = normalizedHeader.split(' ');
    const kwWords = kw.split(' ');
    const matchingWords = kwWords.filter(w => headerWords.includes(w));
    if (matchingWords.length > 0) {
      bestScore = Math.max(bestScore, matchingWords.length / Math.max(headerWords.length, kwWords.length));
    }
  }
  return bestScore;
}

const SECONDARY_HEADER_TOKENS = new Set([
  'day', 'night', 'dual', 'pic', 'picus', 'co pilot', 'co-pilot',
  'single engine aircraft', 'multi engine aircraft', 'instrument time', 'instructor time',
  'actual tme', 'actual time', 'fstd time', 'nav aids', 'place', 'se', 'me', 'remarks',
  'date', 'dd mm yyyy', 'class or type', 'registration marks', 'plt in command', 'details of flight',
  'fstd', 'fstd actual time', 'multi engine', 'single engine',
]);

function isHeaderContinuationRow(row: (string | number | null)[]): boolean {
  const values = row
    .map((cell) => normalizeHeader(String(cell ?? '').trim()))
    .filter(Boolean);

  if (values.length < 3) return false;

  const tokenHits = values.filter((v) => SECONDARY_HEADER_TOKENS.has(v)).length;
  const hasMostlyShortLabels = values.filter((v) => v.length <= 22).length >= Math.ceil(values.length * 0.7);
  const numericLike = row.filter((cell) => parseLocalizedNumber(cell) > 0).length;

  return tokenHits >= 3 && hasMostlyShortLabels && numericLike === 0;
}

function expandMergedRowValues(row: (string | number | null)[], maxCols: number): string[] {
  const expanded: string[] = [];
  let carry = '';

  for (let colIdx = 0; colIdx < maxCols; colIdx++) {
    const value = String(row[colIdx] ?? '').trim();
    if (value) carry = value;
    expanded.push(value || carry);
  }

  return expanded;
}

function buildCompositeHeaders(
  matrix: (string | number | null)[][],
  headerRows: number[],
  maxCols: number,
): string[] {
  const expandedRows = headerRows.map((rowIdx) => expandMergedRowValues(matrix[rowIdx] || [], maxCols));

  return Array.from({ length: maxCols }, (_, colIdx) => {
    const parts = expandedRows
      .map((row) => row[colIdx] || '')
      .filter(Boolean);

    const unique: string[] = [];
    const seen = new Set<string>();

    for (const part of parts) {
      const norm = normalizeHeader(part);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      unique.push(part);
    }

    return unique.join(' ').trim() || `Column ${colIdx + 1}`;
  });
}

// Known columns from EASA logbooks that we intentionally don't track
const KNOWN_SKIP_PATTERNS = [
  'multi engine', 'co pilot', 'co-pilot', 'copilot', 'picus',
  'nav aids', 'fstd', 'remarks', 'instrument time place',
  'instrument time actual time', 'instrument time fstd',
  'instructor time se', 'instructor time me', 'instructor time fstd',
];

function isKnownSkippableColumn(header: string): boolean {
  const norm = normalizeHeader(header);
  return KNOWN_SKIP_PATTERNS.some(pattern => norm.includes(pattern));
}

function mapHeaders(headers: string[]): { columnMap: Record<string, keyof Omit<LogbookEntry, 'id'>>; unmapped: string[] } {
  const columnMap: Record<string, keyof Omit<LogbookEntry, 'id'>> = {};
  const unmapped: string[] = [];
  const usedFields = new Set<string>();
  const candidates: { header: string; field: keyof Omit<LogbookEntry, 'id'>; score: number; priority: number }[] = [];

  for (const h of headers) {
    const norm = normalizeHeader(h);
    if (!norm) { unmapped.push(h); continue; }
    for (const { field, keywords, priority } of FIELD_KEYWORDS) {
      const score = scoreMatch(norm, keywords);
      if (score >= 0.3) candidates.push({ header: h, field, score, priority });
    }
  }

  candidates.sort((a, b) => b.score - a.score || b.priority - a.priority);

  const usedHeaders = new Set<string>();
  for (const { header, field } of candidates) {
    if (usedFields.has(field) || usedHeaders.has(header)) continue;
    columnMap[header] = field;
    usedFields.add(field);
    usedHeaders.add(header);
  }

  for (const h of headers) {
    if (!usedHeaders.has(h) && normalizeHeader(h) && !isKnownSkippableColumn(h)) {
      unmapped.push(h);
    }
  }

  return { columnMap, unmapped };
}

function mapHeadersWithTemplate(
  headers: string[],
  templateMapping: { sourceHeader: string; mappedField: string }[],
): { columnMap: Record<string, keyof Omit<LogbookEntry, 'id'>>; unmapped: string[] } | null {
  const validFields = new Set([
    'date', 'aircraftType', 'aircraftReg', 'pilotInCommand', 'flightDetails',
    'seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot',
    'instrumentTime', 'instructorDay', 'instructorNight',
  ]);
  const columnMap: Record<string, keyof Omit<LogbookEntry, 'id'>> = {};
  const unmapped: string[] = [];
  let matchCount = 0;

  for (const h of headers) {
    const normH = normalizeHeader(h);
    const match = templateMapping.find(m => {
      const normT = normalizeHeader(m.sourceHeader);
      return normT === normH || normH.includes(normT) || normT.includes(normH);
    });

    if (match && validFields.has(match.mappedField)) {
      columnMap[h] = match.mappedField as keyof Omit<LogbookEntry, 'id'>;
      matchCount++;
    } else if (normalizeHeader(h)) {
      unmapped.push(h);
    }
  }

  return matchCount >= 3 ? { columnMap, unmapped } : null;
}

function parseLocalizedNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let cleaned = String(value).trim().replace(/\s+/g, '').replace(/[^0-9,.\-:]/g, '');
  if (!cleaned) return 0;

  if (cleaned.includes(':')) {
    const [h, m] = cleaned.split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) return h + m / 60;
    return 0;
  }

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (lastComma !== -1) {
    cleaned = cleaned.replace(',', '.');
  }

  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function parseFlexibleDate(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';

  if (typeof val === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(val);
      if (d?.y && d?.m && d?.d) {
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      }
    } catch {
      return String(val);
    }
  }

  const str = String(val).trim();
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const dmy = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10);
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }

  return str;
}

function parseRow(row: Record<string, unknown>, columnMap: Record<string, keyof Omit<LogbookEntry, 'id'>>): Omit<LogbookEntry, 'id'> | null {
  const entry: Record<string, unknown> = {
    date: '', aircraftType: '', aircraftReg: '', pilotInCommand: '', flightDetails: '',
    seDayDual: 0, seDayPilot: 0, seNightDual: 0, seNightPilot: 0,
    instrumentTime: 0, instructorDay: 0, instructorNight: 0,
  };

  for (const [col, field] of Object.entries(columnMap)) {
    const val = row[col];
    if (val === undefined || val === null || val === '') continue;

    if (NUMERIC_FIELDS.includes(field as NumericField)) entry[field] = parseLocalizedNumber(val);
    else if (field === 'date') entry[field] = parseFlexibleDate(val);
    else entry[field] = String(val).trim();
  }

  const hasHours = NUMERIC_FIELDS.some(f => (entry[f] as number) > 0);
  const hasText = entry.aircraftType || entry.aircraftReg || entry.pilotInCommand || entry.flightDetails;
  if (!hasHours && !hasText && !entry.date) return null;

  return entry as Omit<LogbookEntry, 'id'>;
}

function matrixToText(matrix: (string | number | null)[][]): string {
  return matrix
    .slice(0, 1500)
    .map((row, index) => `Row ${index + 1}: ${row.map(cell => String(cell ?? '').trim()).join(' | ')}`)
    .join('\n');
}

export function SpreadsheetImport({ onEntriesImported, templates = [] }: SpreadsheetImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [parsedEntries, setParsedEntries] = useState<Omit<LogbookEntry, 'id'>[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [unmappedCols, setUnmappedCols] = useState<string[]>([]);

  const extractViaAi = useCallback(async (file: File, matrix: (string | number | null)[][]) => {
    const spreadsheetText = matrixToText(matrix);
    const { data, error } = await supabase.functions.invoke('extract-logbook', {
      body: { spreadsheetText, fileName: file.name },
    });

    if (error || data?.error) return [] as Omit<LogbookEntry, 'id'>[];

    const aiEntries = (data?.entries || []) as Array<Partial<Omit<LogbookEntry, 'id'>> & { confidence?: number }>;
    return aiEntries
      .map((e) => ({
        date: String(e.date || ''),
        aircraftType: String(e.aircraftType || ''),
        aircraftReg: String(e.aircraftReg || ''),
        pilotInCommand: String(e.pilotInCommand || ''),
        flightDetails: String(e.flightDetails || ''),
        seDayDual: Number(e.seDayDual) || 0,
        seDayPilot: Number(e.seDayPilot) || 0,
        seNightDual: Number(e.seNightDual) || 0,
        seNightPilot: Number(e.seNightPilot) || 0,
        instrumentTime: Number(e.instrumentTime) || 0,
        instructorDay: Number(e.instructorDay) || 0,
        instructorNight: Number(e.instructorNight) || 0,
      }))
      .filter((entry) => {
        const hasHours = NUMERIC_FIELDS.some(f => (entry[f] || 0) > 0);
        return hasHours || entry.date || entry.aircraftType || entry.aircraftReg;
      });
  }, []);

  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array', cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, { header: 1, raw: true, defval: '' });

      if (matrix.length === 0) {
        toast.error('No data found in spreadsheet');
        setLoading(false);
        return;
      }

      // NEW: first try AI extraction by treating spreadsheet content like OCR text
      const aiEntries = await extractViaAi(file, matrix);
      if (aiEntries.length > 0) {
        setUnmappedCols([]);
        setParsedEntries(aiEntries);
        setEditingIndex(null);
        setPreviewOpen(true);
        toast.success(`AI extracted ${aiEntries.length} entries from spreadsheet`);
        return;
      }

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

      const candidateHeaderRows = [headerRowIndex];

      for (let i = 1; i <= 2; i++) {
        const prevIdx = headerRowIndex - i;
        if (prevIdx < 0) break;
        const prevRow = matrix[prevIdx] || [];
        const prevHasText = prevRow.some(cell => String(cell ?? '').trim().length > 0);
        const prevLooksNumeric = prevRow.filter(cell => parseLocalizedNumber(cell) > 0).length > 2;
        if (prevHasText && !prevLooksNumeric) {
          candidateHeaderRows.unshift(prevIdx);
        } else {
          break;
        }
      }

      let dataStartRow = headerRowIndex + 1;
      for (let i = 1; i <= 2; i++) {
        const nextIdx = headerRowIndex + i;
        const nextRow = matrix[nextIdx] || [];
        if (isHeaderContinuationRow(nextRow)) {
          candidateHeaderRows.push(nextIdx);
          dataStartRow = nextIdx + 1;
          continue;
        }
        break;
      }

      const compositeHeaders = buildCompositeHeaders(matrix, candidateHeaderRows, maxCols);
      const seen = new Map<string, number>();
      const headers = compositeHeaders.map((header, i) => {
        const base = header || `Column ${i + 1}`;
        const count = (seen.get(base) || 0) + 1;
        seen.set(base, count);
        return count === 1 ? base : `${base} (${count})`;
      });

      const rows = matrix.slice(dataStartRow).map((row) => {
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

      // Try template-based mapping first
      let mappingResult: { columnMap: Record<string, keyof Omit<LogbookEntry, 'id'>>; unmapped: string[] } | null = null;

      for (const template of templates) {
        mappingResult = mapHeadersWithTemplate(headers, template.columnMapping);
        if (mappingResult) {
          toast.info(`Using template "${template.name}"`);
          break;
        }
      }

      // Fall back to keyword-based mapping
      if (!mappingResult) {
        mappingResult = mapHeaders(headers);
      }

      const { columnMap, unmapped } = mappingResult;
      setUnmappedCols(unmapped);

      const entries = rows
        .map(r => parseRow(r, columnMap))
        .filter((e): e is Omit<LogbookEntry, 'id'> => e !== null);

      if (entries.length === 0) {
        toast.error('No valid entries found. Please use the AI extraction upload instead.');
        setLoading(false);
        return;
      }

      setParsedEntries(entries);
      setEditingIndex(null);
      setPreviewOpen(true);
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Failed to read spreadsheet file');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [extractViaAi]);

  const updateEntry = (index: number, field: keyof Omit<LogbookEntry, 'id'>, value: string) => {
    setParsedEntries(prev => prev.map((e, i) => {
      if (i !== index) return e;
      if (NUMERIC_FIELDS.includes(field as NumericField)) {
        return { ...e, [field]: parseFloat(value) || 0 };
      }
      return { ...e, [field]: value };
    }));
  };

  const deleteEntry = (index: number) => {
    setParsedEntries(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleConfirm = () => {
    const valid = parsedEntries.filter(e => {
      const hasHours = NUMERIC_FIELDS.some(f => (e[f] || 0) > 0);
      return hasHours || e.aircraftType || e.aircraftReg || e.date;
    });

    if (valid.length === 0) {
      toast.error('No entries to import');
      return;
    }

    onEntriesImported(valid);
    toast.success(`Imported ${valid.length} flight entries`);
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
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              IMPORT PREVIEW
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {fileName} — {parsedEntries.length} entries found. Click a row to edit before importing.
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

          <ScrollArea className="flex-1 max-h-[50vh]">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Reg</th>
                  <th className="text-left p-2">PIC</th>
                  <th className="text-right p-2">Hours</th>
                  <th className="p-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {parsedEntries.slice(0, 100).map((e, i) => {
                  const total = NUMERIC_FIELDS.reduce((s, f) => s + (e[f] || 0), 0);
                  const isEditing = editingIndex === i;

                  if (isEditing) {
                    return (
                      <tr key={i} className="border-b border-primary/30 bg-primary/5">
                        <td className="p-1 text-muted-foreground align-top pt-2">{i + 1}</td>
                        <td colSpan={6} className="p-1">
                          <div className="grid grid-cols-2 gap-2 p-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Date</label>
                              <Input type="date" value={e.date} onChange={ev => updateEntry(i, 'date', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Class or Type</label>
                              <Input value={e.aircraftType} onChange={ev => updateEntry(i, 'aircraftType', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Registration</label>
                              <Input value={e.aircraftReg} onChange={ev => updateEntry(i, 'aircraftReg', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">PIC</label>
                              <Input value={e.pilotInCommand} onChange={ev => updateEntry(i, 'pilotInCommand', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] text-muted-foreground uppercase">Flight Details</label>
                              <Input value={e.flightDetails} onChange={ev => updateEntry(i, 'flightDetails', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Day Dual</label>
                              <Input type="number" step="0.1" value={e.seDayDual || ''} onChange={ev => updateEntry(i, 'seDayDual', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Day Pilot</label>
                              <Input type="number" step="0.1" value={e.seDayPilot || ''} onChange={ev => updateEntry(i, 'seDayPilot', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Night Dual</label>
                              <Input type="number" step="0.1" value={e.seNightDual || ''} onChange={ev => updateEntry(i, 'seNightDual', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Night Pilot</label>
                              <Input type="number" step="0.1" value={e.seNightPilot || ''} onChange={ev => updateEntry(i, 'seNightPilot', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Instrument</label>
                              <Input type="number" step="0.1" value={e.instrumentTime || ''} onChange={ev => updateEntry(i, 'instrumentTime', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Instr Day</label>
                              <Input type="number" step="0.1" value={e.instructorDay || ''} onChange={ev => updateEntry(i, 'instructorDay', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Instr Night</label>
                              <Input type="number" step="0.1" value={e.instructorNight || ''} onChange={ev => updateEntry(i, 'instructorNight', ev.target.value)} className="h-7 text-xs font-mono" />
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <Button size="sm" variant="outline" onClick={() => setEditingIndex(null)} className="font-mono text-xs h-7">
                                DONE
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/30 cursor-pointer group" onClick={() => setEditingIndex(i)}>
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2">{e.date || '—'}</td>
                      <td className="p-2">{e.aircraftType || '—'}</td>
                      <td className="p-2">{e.aircraftReg || '—'}</td>
                      <td className="p-2">{e.pilotInCommand || '—'}</td>
                      <td className="p-2 text-right">{total > 0 ? total.toFixed(1) : '—'}</td>
                      <td className="p-2">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(ev) => { ev.stopPropagation(); setEditingIndex(i); }} className="text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={(ev) => { ev.stopPropagation(); deleteEntry(i); }} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {parsedEntries.length > 100 && (
              <p className="text-xs text-muted-foreground font-mono p-2 text-center">
                ... and {parsedEntries.length - 100} more entries
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
