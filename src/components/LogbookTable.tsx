import { LogbookEntry } from '@/types/logbook';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogbookTableProps {
  entries: LogbookEntry[];
  onEdit: (entry: LogbookEntry) => void;
  onDelete: (id: string) => void;
}

export function LogbookTable({ entries, onEdit, onDelete }: LogbookTableProps) {
  if (entries.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <p className="font-mono text-muted-foreground text-lg">NO ENTRIES LOGGED</p>
        <p className="text-sm text-muted-foreground mt-2">Add flights manually or upload logbook photos</p>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Date', 'Type', 'Reg', 'From', 'To', 'Total', 'PIC', 'SIC', 'Night', 'IFR', 'Ldg', 'Remarks', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left font-mono text-xs text-primary uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries
              .sort((a, b) => (a.date > b.date ? -1 : 1))
              .map(entry => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{entry.date}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.aircraftType}</td>
                  <td className="px-3 py-2 font-mono text-xs text-accent">{entry.aircraftReg}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.from}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.to}</td>
                  <td className="px-3 py-2 font-mono text-xs text-primary font-semibold">{entry.totalTime.toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.picTime.toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.sicTime.toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.nightTime.toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.ifrTime.toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.landings}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-[150px] truncate">{entry.remarks}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(entry)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(entry.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
