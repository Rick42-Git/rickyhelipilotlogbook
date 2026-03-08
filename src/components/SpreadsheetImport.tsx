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

// Map common header variations to our field names
const HEADER_MAP: Record<string, keyof Omit<LogbookEntry, 'id'>> = {
  'date': 'date',
  'aircraft type': 'aircraftType',
  'type': 'aircraftType',
  'a/c type': 'aircraftType',
  'registration': 'aircraftReg',
  'reg': 'aircraftReg',
  'a/c reg': 'aircraftReg',
  'aircraft reg': 'aircraftReg',
  'pilot in command': 'pilotInCommand',
  'pic': 'pilotInCommand',
  'captain': 'pilotInCommand',
  'pilot': 'pilotInCommand',
  'flight details': 'flightDetails',
  'details': 'flightDetails',
  'route': 'flightDetails',
  'remarks': 'flightDetails',
  'se day dual': 'seDayDual',
  'se day pilot': 'seDayPilot',
  'se night dual': 'seNightDual',
  'se night pilot': 'seNightPilot',
  'instr time': 'instrumentTime',
  'instrument time': 'instrumentTime',
  'instructor day': 'instructorDay',
  'instructor night': 'instructorNight',
};

const NUMERIC_FIELDS: NumericField[] = [
  'seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot',
  'instrumentTime', 'instructorDay', 'instructorNight',
];

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
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      entry[field] = isNaN(num) ? 0 : num;
    } else if (field === 'date') {
      if (typeof val === 'number') {
        // Excel serial date
        const d = XLSX.SSF.parse_date_code(val);
        entry[field] = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
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
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      if (rows.length === 0) {
        toast.error('No data found in spreadsheet');
        setLoading(false);
        return;
      }

      // Build column mapping from headers
      const headers = Object.keys(rows[0]);
      const columnMap: Record<string, keyof Omit<LogbookEntry, 'id'>> = {};
      const unmapped: string[] = [];

      for (const h of headers) {
        const normalized = h.toLowerCase().trim();
        if (HEADER_MAP[normalized]) {
          columnMap[h] = HEADER_MAP[normalized];
        } else {
          unmapped.push(h);
        }
      }

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
