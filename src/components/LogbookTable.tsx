import { useState, useMemo } from 'react';
import { LogbookEntry } from '@/types/logbook';
import { Pencil, Trash2, SlidersHorizontal, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import helicopterWatermark from '@/assets/helicopter-icon.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LogbookTableProps {
  entries: LogbookEntry[];
  onEdit: (entry: LogbookEntry) => void;
  onDelete: (id: string) => void;
  onClearAll?: () => void;
}

type ColumnDef = {
  key: string;
  label: string;
  shortLabel: string;
  render: (entry: LogbookEntry) => React.ReactNode;
};

function fmt(n: number) { return n > 0 ? n.toFixed(1) : ''; }

const columns: ColumnDef[] = [
  { key: 'date', label: 'Date', shortLabel: 'Date', render: e => e.date },
  { key: 'type', label: 'Class or Type', shortLabel: 'Type', render: e => e.aircraftType },
  { key: 'reg', label: 'Registration', shortLabel: 'Reg', render: e => <span className="text-accent">{e.aircraftReg}</span> },
  { key: 'pic', label: 'Pilot in Command', shortLabel: 'PIC', render: e => e.pilotInCommand },
  { key: 'details', label: 'Flight Details', shortLabel: 'Details', render: e => <span className="text-muted-foreground max-w-[120px] truncate block">{e.flightDetails}</span> },
  { key: 'seDayDual', label: 'SE Day Dual', shortLabel: 'SE D-Dual', render: e => <span className="text-primary font-semibold">{fmt(e.seDayDual)}</span> },
  { key: 'seDayPilot', label: 'SE Day Pilot', shortLabel: 'SE D-Pilot', render: e => fmt(e.seDayPilot) },
  { key: 'seNightDual', label: 'SE Night Dual', shortLabel: 'SE N-Dual', render: e => fmt(e.seNightDual) },
  { key: 'seNightPilot', label: 'SE Night Pilot', shortLabel: 'SE N-Pilot', render: e => fmt(e.seNightPilot) },
  { key: 'instrTm', label: 'Instrument Time', shortLabel: 'Instr Tm', render: e => fmt(e.instrumentTime) },
  { key: 'instDay', label: 'Instructor Day', shortLabel: 'Inst Day', render: e => fmt(e.instructorDay) },
  { key: 'instNgt', label: 'Instructor Night', shortLabel: 'Inst Ngt', render: e => fmt(e.instructorNight) },
];

const defaultVisible = new Set(columns.map(c => c.key));

export function LogbookTable({ entries, onEdit, onDelete }: LogbookTableProps) {
  const [visibleCols, setVisibleCols] = useState<Set<string>>(defaultVisible);
  const [search, setSearch] = useState('');

  const toggleCol = (key: string) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activeCols = columns.filter(c => visibleCols.has(c.key));

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.date.toLowerCase().includes(q) ||
      e.aircraftType.toLowerCase().includes(q) ||
      e.aircraftReg.toLowerCase().includes(q) ||
      e.pilotInCommand.toLowerCase().includes(q) ||
      e.flightDetails.toLowerCase().includes(q)
    );
  }, [entries, search]);

  if (entries.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <p className="font-mono text-muted-foreground text-lg">NO ENTRIES LOGGED</p>
        <p className="text-sm text-muted-foreground mt-2">Add flights manually or upload logbook photos</p>
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg">
      <div className="flex items-center justify-between gap-2 p-2 border-b border-border/50">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="h-8 pl-8 font-mono text-xs bg-background/50"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="font-mono text-xs gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              COLUMNS
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 w-[320px]">
            {columns.map(col => (
              <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={visibleCols.has(col.key)}
                  onCheckedChange={() => toggleCol(col.key)}
                />
                <span className="font-mono text-xs">{col.label}</span>
              </label>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="relative">
        <img src={helicopterWatermark} alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-auto opacity-[0.04] pointer-events-none select-none" />
        <table className="w-full text-sm relative z-10">
          <thead className="sticky z-30 top-[37px]">
            <tr className="border-b border-border bg-card">
              {activeCols.map(col => (
                <th key={col.key} className="px-2 py-2 text-left font-mono text-[10px] text-primary uppercase tracking-wider whitespace-nowrap">{col.shortLabel}</th>
              ))}
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {filteredEntries
              .sort((a, b) => (a.date > b.date ? -1 : 1))
              .map(entry => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  {activeCols.map(col => (
                    <td key={col.key} className="px-2 py-2 font-mono text-xs whitespace-nowrap">{col.render(entry)}</td>
                  ))}
                  <td className="px-2 py-2 whitespace-nowrap">
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
