import { LogbookEntry } from '@/types/logbook';
import { Pencil, Trash2 } from 'lucide-react';

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

function fmt(n: number) { return n > 0 ? n.toFixed(1) : ''; }

export function MobileEntryCard({ entry, onEdit, onDelete }: MobileEntryCardProps) {
  const totalHours = (entry.seDayDual || 0) + (entry.seDayPilot || 0) + (entry.seNightDual || 0) + (entry.seNightPilot || 0);
  const hasNight = (entry.seNightDual || 0) + (entry.seNightPilot || 0) > 0;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 border-b border-border/40 active:bg-muted/30 transition-colors"
      onClick={() => onEdit(entry)}
    >
      {/* Date */}
      <span className="font-mono text-[10px] text-muted-foreground w-[38px] shrink-0">{fmtDate(entry.date)}</span>

      {/* Reg + Type */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-accent font-semibold">{entry.aircraftReg}</span>
          <span className="font-mono text-[9px] text-muted-foreground truncate">{entry.aircraftType}</span>
          {hasNight && <span className="bg-destructive/20 text-destructive font-mono text-[7px] px-1 rounded">N</span>}
        </div>
        <p className="font-mono text-[9px] text-muted-foreground/70 truncate leading-none mt-0.5">
          {entry.flightDetails || entry.pilotInCommand}
        </p>
      </div>

      {/* Hours */}
      <span className="font-mono text-sm font-bold text-primary shrink-0 w-[36px] text-right">{totalHours.toFixed(1)}</span>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
        className="shrink-0 p-1 text-muted-foreground/40 active:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
