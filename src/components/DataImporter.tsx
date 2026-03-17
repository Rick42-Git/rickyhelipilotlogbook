import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImportStatus {
  table: string;
  total: number;
  inserted: number;
  status: 'idle' | 'parsing' | 'importing' | 'done' | 'error';
  error?: string;
}

const CSV_CONFIGS: Record<string, { label: string; parser: (row: string[]) => Record<string, unknown> | null }> = {
  airports: {
    label: 'Airports',
    parser: (cols) => {
      const id = parseInt(cols[0]);
      if (isNaN(id)) return null;
      return {
        id,
        ident: cols[1] || '',
        type: cols[2] || '',
        name: cols[3] || '',
        latitude_deg: cols[4] ? parseFloat(cols[4]) : null,
        longitude_deg: cols[5] ? parseFloat(cols[5]) : null,
        elevation_ft: cols[6] ? parseInt(cols[6]) : null,
        continent: cols[7] || '',
        iso_country: cols[8] || '',
        iso_region: cols[9] || '',
        municipality: cols[10] || '',
        scheduled_service: cols[11] || 'no',
        icao_code: cols[12] || '',
        iata_code: cols[13] || '',
        gps_code: cols[14] || '',
        local_code: cols[15] || '',
      };
    },
  },
};

function parseCSV(text: string): string[][] {
  const lines = text.split('\n');
  const result: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Simple CSV parser that handles quoted fields
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current);
    result.push(cols);
  }
  return result;
}

export default function DataImporter() {
  const [statuses, setStatuses] = useState<Record<string, ImportStatus>>({});
  const fileRefs = {
    airports: useRef<HTMLInputElement>(null),
    runways: useRef<HTMLInputElement>(null),
    navaids: useRef<HTMLInputElement>(null),
  };

  const handleImport = async (table: string, file: File) => {
    const config = CSV_CONFIGS[table];
    if (!config) return;

    setStatuses(prev => ({
      ...prev,
      [table]: { table, total: 0, inserted: 0, status: 'parsing' },
    }));

    try {
      const text = await file.text();
      const rawRows = parseCSV(text);
      const rows = rawRows.map(config.parser).filter(Boolean) as Record<string, unknown>[];

      setStatuses(prev => ({
        ...prev,
        [table]: { table, total: rows.length, inserted: 0, status: 'importing' },
      }));

      // Send in chunks of 2000 rows to the edge function
      const chunkSize = 2000;
      let totalInserted = 0;

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { data, error } = await supabase.functions.invoke('import-csv', {
          body: { table, rows: chunk },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        totalInserted += data?.inserted || chunk.length;
        setStatuses(prev => ({
          ...prev,
          [table]: { ...prev[table], inserted: totalInserted, status: 'importing' },
        }));
      }

      setStatuses(prev => ({
        ...prev,
        [table]: { table, total: rows.length, inserted: totalInserted, status: 'done' },
      }));
      toast.success(`Imported ${totalInserted.toLocaleString()} ${config.label} records`);
    } catch (err: any) {
      setStatuses(prev => ({
        ...prev,
        [table]: { ...prev[table], status: 'error', error: err.message },
      }));
      toast.error(`Failed to import ${config.label}: ${err.message}`);
    }
  };

  return (
    <div className="glass-panel hud-border p-4 space-y-4">
      <div className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        Database Import
      </div>
      <p className="font-mono text-[10px] text-muted-foreground/60">
        Import airports, runways, and navaids CSV files from OurAirports.
      </p>
      <div className="space-y-3">
        {Object.entries(CSV_CONFIGS).map(([table, config]) => {
          const status = statuses[table];
          const isWorking = status?.status === 'parsing' || status?.status === 'importing';

          return (
            <div key={table} className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv"
                ref={fileRefs[table as keyof typeof fileRefs]}
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(table, file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={isWorking}
                onClick={() => fileRefs[table as keyof typeof fileRefs].current?.click()}
                className="font-mono text-xs gap-1.5 min-w-[140px]"
              >
                {isWorking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                {config.label}
              </Button>
              {status && (
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  {status.status === 'parsing' && (
                    <span className="text-muted-foreground">Parsing CSV...</span>
                  )}
                  {status.status === 'importing' && (
                    <span className="text-primary">
                      {status.inserted.toLocaleString()} / {status.total.toLocaleString()}
                    </span>
                  )}
                  {status.status === 'done' && (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      {status.inserted.toLocaleString()} imported
                    </span>
                  )}
                  {status.status === 'error' && (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertCircle className="h-3 w-3" />
                      {status.error}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
