import { LogbookEntry } from '@/types/logbook';
import { Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileEntryCardProps {
  entry: LogbookEntry;
  onEdit: (entry: LogbookEntry) => void;
  onDelete: (id: string) => void;
}

function fmtDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m ? `${d}/${m}` : iso;
}

function fmtYear(iso: string) {
  if (!iso) return '';
  return iso.split('-')[0] || '';
}

function fmt(n: number) { return n > 0 ? n.toFixed(1) : ''; }

export function MobileEntryCard({ entry, onEdit, onDelete }: MobileEntryCardProps) {
  const totalHours = (entry.seDayDual || 0) + (entry.seDayPilot || 0) + (entry.seNightDual || 0) + (entry.seNightPilot || 0);
  const hasNight = (entry.seNightDual || 0) + (entry.seNightPilot || 0) > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-3 active:scale-[0.98] transition-transform">
      <div className="flex items-start justify-between gap-2">
        {/* Left: date + details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-foreground">{fmtDate(entry.date)}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{fmtYear(entry.date)}</span>
            {hasNight && (
              <span className="bg-destructive/20 text-destructive font-mono text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Night</span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-accent font-semibold">{entry.aircraftReg}</span>
            <span className="font-mono text-[10px] text-muted-foreground">•</span>
            <span className="font-mono text-[10px] text-muted-foreground">{entry.aircraftType}</span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground truncate">{entry.flightDetails || entry.pilotInCommand}</p>
        </div>

        {/* Right: total hours */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="text-right">
            <span className="font-mono text-lg font-bold text-primary leading-none">{totalHours.toFixed(1)}</span>
            <span className="font-mono text-[8px] text-muted-foreground ml-0.5">HRS</span>
          </div>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(entry); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hour breakdown mini-bar */}
      {totalHours > 0 && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
          {entry.seDayDual > 0 && <span className="font-mono text-[9px] text-primary/80">D-Dual {fmt(entry.seDayDual)}</span>}
          {entry.seDayPilot > 0 && <span className="font-mono text-[9px] text-foreground/70">D-PIC {fmt(entry.seDayPilot)}</span>}
          {entry.seNightDual > 0 && <span className="font-mono text-[9px] text-destructive/80">N-Dual {fmt(entry.seNightDual)}</span>}
          {entry.seNightPilot > 0 && <span className="font-mono text-[9px] text-destructive/80">N-PIC {fmt(entry.seNightPilot)}</span>}
          {entry.instrumentTime > 0 && <span className="font-mono text-[9px] text-accent/80">IFR {fmt(entry.instrumentTime)}</span>}
          {entry.instructorDay > 0 && <span className="font-mono text-[9px] text-muted-foreground">Inst-D {fmt(entry.instructorDay)}</span>}
          {entry.instructorNight > 0 && <span className="font-mono text-[9px] text-muted-foreground">Inst-N {fmt(entry.instructorNight)}</span>}
        </div>
      )}
    </div>
  );
}
