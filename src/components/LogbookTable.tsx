import { useState, useMemo } from 'react';
import { LogbookEntry } from '@/types/logbook';
import { Pencil, Trash2, SlidersHorizontal, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import helicopterWatermark from '@/assets/helicopter-icon.png';
import { normalizeAircraftType } from '@/lib/normalizeAircraftType';
import { classifyAircraft } from '@/lib/aircraftCategories';
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
  className?: string;
};

function fmt(n: number) { return n > 0 ? n.toFixed(1) : ''; }

function fmtDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

function getEntryTotalHours(entry: LogbookEntry) {
  return (entry.seDayDual || 0) + (entry.seDayPilot || 0) + (entry.seNightDual || 0) + (entry.seNightPilot || 0);
}

function isUnknownEntry(entry: LogbookEntry) {
  return classifyAircraft(normalizeAircraftType(entry.aircraftType || '')) === 'unknown';
}

const columns: ColumnDef[] = [
  { key: 'date', label: 'Date', shortLabel: 'Date', className: 'w-[82px]', render: e => fmtDate(e.date) },
  {
    key: 'type',
    label: 'Class or Type',
    shortLabel: 'Type',
    render: (e: LogbookEntry) => {
      if (isUnknownEntry(e)) {
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-destructive">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {e.aircraftType || 'empty'}
          </span>
        );
      }
      return e.aircraftType;
    },
  },
  { key: 'reg', label: 'Registration', shortLabel: 'Reg', className: 'w-[70px]', render: e => <span className="text-accent">{e.aircraftReg}</span> },
  { key: 'pic', label: 'Pilot in Command', shortLabel: 'PIC', className: 'w-[100px]', render: e => e.pilotInCommand },
  {
    key: 'details',
    label: 'Flight Details',
    shortLabel: 'Details',
    className: 'w-[240px] min-w-[240px]',
    render: e => <span className="block w-full overflow-hidden truncate text-muted-foreground">{e.flightDetails}</span>,
  },
  { key: 'seDayDual', label: 'SE Day Dual', shortLabel: 'SE D-Dual', className: 'w-[70px]', render: e => <span className="text-primary font-semibold">{fmt(e.seDayDual)}</span> },
  { key: 'seDayPilot', label: 'SE Day Pilot', shortLabel: 'SE D-Pilot', className: 'w-[70px]', render: e => fmt(e.seDayPilot) },
  { key: 'seNightDual', label: 'SE Night Dual', shortLabel: 'SE N-Dual', className: 'w-[70px]', render: e => <span className="text-destructive font-semibold">{fmt(e.seNightDual)}</span> },
  { key: 'seNightPilot', label: 'SE Night Pilot', shortLabel: 'SE N-Pilot', className: 'w-[70px]', render: e => <span className="text-destructive font-semibold">{fmt(e.seNightPilot)}</span> },
  { key: 'instrTm', label: 'Instrument Time', shortLabel: 'IFR Time', className: 'w-[65px]', render: e => fmt(e.instrumentTime) },
  { key: 'instDay', label: 'Instructor Day', shortLabel: 'FI Day', className: 'w-[55px]', render: e => fmt(e.instructorDay) },
  { key: 'instNgt', label: 'Instructor Night', shortLabel: 'FI Ngt', className: 'w-[55px]', render: e => <span className="text-destructive font-semibold">{fmt(e.instructorNight)}</span> },
];

const defaultVisible = new Set(columns.map(c => c.key));

export function LogbookTable({ entries, onEdit, onDelete, onClearAll }: LogbookTableProps) {
  const [visibleCols, setVisibleCols] = useState<Set<string>>(defaultVisible);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const numericKeys = new Set(['seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot', 'instrTm', 'instDay', 'instNgt']);
  const filterFieldMap: Record<string, keyof LogbookEntry> = {
    seDayDual: 'seDayDual', seDayPilot: 'seDayPilot',
    seNightDual: 'seNightDual', seNightPilot: 'seNightPilot',
    instrTm: 'instrumentTime', instDay: 'instructorDay', instNgt: 'instructorNight',
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.date.toLowerCase().includes(q) ||
        e.aircraftType.toLowerCase().includes(q) ||
        e.aircraftReg.toLowerCase().includes(q) ||
        e.pilotInCommand.toLowerCase().includes(q) ||
        e.flightDetails.toLowerCase().includes(q)
      );
    }
    if (activeFilter && filterFieldMap[activeFilter]) {
      const field = filterFieldMap[activeFilter];
      result = result.filter(e => (e[field] as number) > 0);
    }
    return result;
  }, [entries, search, activeFilter]);

  const sortedEntries = useMemo(() => {
    return filteredEntries.slice().sort((a, b) => {
      const aUnknown = isUnknownEntry(a);
      const bUnknown = isUnknownEntry(b);

      if (aUnknown && bUnknown) {
        const hoursDiff = getEntryTotalHours(b) - getEntryTotalHours(a);
        if (hoursDiff !== 0) return hoursDiff;
      }

      if (aUnknown !== bUnknown) return aUnknown ? -1 : 1;
      if (a.date === b.date) return 0;
      return a.date > b.date ? -1 : 1;
    });
  }, [filteredEntries]);

  const flaggedEntries = useMemo(() => {
    return entries
      .filter(isUnknownEntry)
      .sort((a, b) => {
        const hoursDiff = getEntryTotalHours(b) - getEntryTotalHours(a);
        if (hoursDiff !== 0) return hoursDiff;
        if (a.date === b.date) return 0;
        return a.date > b.date ? -1 : 1;
      });
  }, [entries]);

  const visibleFlaggedCount = useMemo(
    () => sortedEntries.filter(isUnknownEntry).length,
    [sortedEntries]
  );

  const totals = useMemo(() => {
    const src = filteredEntries;
    return {
      seDayDual: src.reduce((s, e) => s + (e.seDayDual || 0), 0),
      seDayPilot: src.reduce((s, e) => s + (e.seDayPilot || 0), 0),
      seNightDual: src.reduce((s, e) => s + (e.seNightDual || 0), 0),
      seNightPilot: src.reduce((s, e) => s + (e.seNightPilot || 0), 0),
      instrumentTime: src.reduce((s, e) => s + (e.instrumentTime || 0), 0),
      instructorDay: src.reduce((s, e) => s + (e.instructorDay || 0), 0),
      instructorNight: src.reduce((s, e) => s + (e.instructorNight || 0), 0),
    };
  }, [filteredEntries]);

  const totalMapping: Record<string, number> = {
    seDayDual: totals.seDayDual,
    seDayPilot: totals.seDayPilot,
    seNightDual: totals.seNightDual,
    seNightPilot: totals.seNightPilot,
    instrTm: totals.instrumentTime,
    instDay: totals.instructorDay,
    instNgt: totals.instructorNight,
  };

  if (entries.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <p className="font-mono text-muted-foreground text-lg">NO ENTRIES LOGGED</p>
        <p className="text-sm text-muted-foreground mt-2">Add flights manually or upload logbook photos</p>
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg relative">
      {flaggedEntries.length > 0 && (
        <div className="border-b border-destructive/20 bg-destructive/5 px-3 py-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-destructive">Uncategorised aircraft pinned to the top</p>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                {flaggedEntries.length} flagged {flaggedEntries.length === 1 ? 'entry is' : 'entries are'} shown first for review and deletion.
                {flaggedEntries.length > visibleFlaggedCount ? ` Clear search to see ${flaggedEntries.length - visibleFlaggedCount} hidden flagged ${flaggedEntries.length - visibleFlaggedCount === 1 ? 'entry' : 'entries'}.` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {flaggedEntries.slice(0, 3).map(entry => (
                  <span
                    key={entry.id}
                    className="inline-flex items-center gap-1 rounded-md border border-destructive/25 bg-background/60 px-2 py-1 font-mono text-[10px]"
                  >
                    <span className="text-destructive">{entry.aircraftType || 'empty'}</span>
                    <span className="text-muted-foreground">{fmtDate(entry.date) || 'no date'}</span>
                    <span className="text-foreground">{getEntryTotalHours(entry).toFixed(1)}h</span>
                  </span>
                ))}
                {flaggedEntries.length > 3 && (
                  <span className="inline-flex items-center rounded-md border border-border/60 bg-background/40 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                    +{flaggedEntries.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex items-center gap-1.5">
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
          {onClearAll && entries.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="font-mono text-[10px] gap-1 h-6 px-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3" />
                  CLEAR
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-mono">CLEAR ALL ENTRIES?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {entries.length} flight entries. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-mono">CANCEL</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearAll} className="font-mono bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    DELETE ALL
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      <div className="relative overflow-x-auto">
        <img src={helicopterWatermark} alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-auto opacity-[0.04] pointer-events-none select-none" />
        <table className="w-full min-w-[1100px] text-sm table-fixed relative z-10">
          <thead className="sticky top-[52px] z-30 bg-card">
            <tr className="border-b border-border">
              {activeCols.map(col => {
                const isNumeric = numericKeys.has(col.key);
                const isActive = activeFilter === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={isNumeric ? () => setActiveFilter(isActive ? null : col.key) : undefined}
                    className={`px-2 py-2 text-left font-mono text-[10px] uppercase tracking-wider whitespace-nowrap transition-colors ${col.className ?? ''} ${
                      isNumeric ? 'cursor-pointer hover:text-accent-foreground hover:bg-muted/40 select-none' : ''
                    } ${isActive ? 'text-accent-foreground bg-primary/15 ring-1 ring-inset ring-primary/30' : 'text-primary'}`}
                  >
                    {col.shortLabel}
                    {isActive && <span className="ml-1 text-[8px] opacity-60">✕</span>}
                  </th>
                );
              })}
              <th className="px-2 py-2 w-[72px]" />
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map(entry => {
              const unknown = isUnknownEntry(entry);

              return (
                <tr
                  key={entry.id}
                  onClick={() => toggleSelect(entry.id)}
                  className={`border-b border-border/50 cursor-pointer transition-all duration-200 ${
                    selectedIds.has(entry.id)
                      ? 'bg-primary/10 scale-[1.01] shadow-sm ring-1 ring-primary/30 z-10 relative'
                      : unknown
                        ? 'bg-destructive/5 hover:bg-destructive/10 ring-1 ring-inset ring-destructive/15 relative'
                        : 'hover:bg-muted/20'
                  }`}
                >
                  {activeCols.map(col => (
                    <td key={col.key} className={`px-2 py-2 font-mono text-xs whitespace-nowrap ${col.className ?? ''}`}>{col.render(entry)}</td>
                  ))}
                  <td className="px-2 py-2 whitespace-nowrap w-[72px]" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(entry)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(entry.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-primary/30 bg-muted/30">
              {activeCols.map(col => (
                <td key={col.key} className={`px-2 py-2 font-mono text-xs font-bold whitespace-nowrap text-primary ${col.className ?? ''}`}>
                  {col.key === 'date' ? `${filteredEntries.length} flights` : totalMapping[col.key] !== undefined ? fmt(totalMapping[col.key]) : ''}
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
