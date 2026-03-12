import { useState, useMemo } from 'react';
import { LogbookEntry } from '@/types/logbook';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogbookBookViewProps {
  entries: LogbookEntry[];
  onEdit: (entry: LogbookEntry) => void;
  onDelete: (id: string) => void;
}

const ENTRIES_PER_PAGE = 6;

function fmtDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

function fmt(n: number) { return n > 0 ? n.toFixed(1) : '—'; }

function totalHours(e: LogbookEntry) {
  return e.seDayDual + e.seDayPilot + e.seNightDual + e.seNightPilot + e.instructorDay + e.instructorNight;
}

export function LogbookBookView({ entries, onEdit, onDelete }: LogbookBookViewProps) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [flipping, setFlipping] = useState<'forward' | 'backward' | null>(null);

  const sorted = useMemo(() =>
    [...entries].sort((a, b) => (a.date > b.date ? -1 : 1)),
    [entries]
  );

  const totalSpreads = Math.max(1, Math.ceil(sorted.length / (ENTRIES_PER_PAGE * 2)));

  const leftPageEntries = sorted.slice(
    currentSpread * ENTRIES_PER_PAGE * 2,
    currentSpread * ENTRIES_PER_PAGE * 2 + ENTRIES_PER_PAGE
  );
  const rightPageEntries = sorted.slice(
    currentSpread * ENTRIES_PER_PAGE * 2 + ENTRIES_PER_PAGE,
    currentSpread * ENTRIES_PER_PAGE * 2 + ENTRIES_PER_PAGE * 2
  );

  const goForward = () => {
    if (currentSpread >= totalSpreads - 1) return;
    setFlipping('forward');
    setTimeout(() => {
      setCurrentSpread(prev => prev + 1);
      setFlipping(null);
    }, 500);
  };

  const goBackward = () => {
    if (currentSpread <= 0) return;
    setFlipping('backward');
    setTimeout(() => {
      setCurrentSpread(prev => prev - 1);
      setFlipping(null);
    }, 500);
  };

  if (entries.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <p className="font-mono text-muted-foreground text-lg">NO ENTRIES LOGGED</p>
        <p className="text-sm text-muted-foreground mt-2">Add flights manually or upload logbook photos</p>
      </div>
    );
  }

  const renderPage = (pageEntries: LogbookEntry[], pageNum: number, side: 'left' | 'right') => (
    <div className={`flex-1 min-w-0 flex flex-col ${side === 'left' ? 'border-r border-border/30' : ''}`}>
      {/* Page header */}
      <div className="px-4 pt-3 pb-2 border-b border-border/20">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-[0.2em]">
            Pilot Logbook
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/40">
            Page {currentSpread * 2 + (side === 'left' ? 1 : 2)}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[80px_1fr_60px_50px_24px_24px] gap-1 px-3 py-1.5 border-b border-border/30 bg-muted/5">
        <span className="font-mono text-[8px] text-primary/70 uppercase">Date</span>
        <span className="font-mono text-[8px] text-primary/70 uppercase">Details</span>
        <span className="font-mono text-[8px] text-primary/70 uppercase">Type</span>
        <span className="font-mono text-[8px] text-primary/70 uppercase text-right">Hours</span>
        <span />
        <span />
      </div>

      {/* Entries */}
      <div className="flex-1 flex flex-col">
        {pageEntries.map((entry, i) => (
          <div
            key={entry.id}
            className={`grid grid-cols-[80px_1fr_60px_50px_24px_24px] gap-1 px-3 py-2 items-center transition-colors hover:bg-muted/10 ${
              i < pageEntries.length - 1 ? 'border-b border-border/10' : ''
            }`}
          >
            <span className="font-mono text-[11px] text-foreground/80">{fmtDate(entry.date)}</span>
            <div className="min-w-0">
              <span className="font-mono text-[11px] text-foreground block truncate">{entry.flightDetails || '—'}</span>
              <span className="font-mono text-[9px] text-accent/70">{entry.aircraftReg}</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground truncate">{entry.aircraftType}</span>
            <span className="font-mono text-[11px] text-primary font-semibold text-right">{fmt(totalHours(entry))}</span>
            <button onClick={() => onEdit(entry)} className="p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors">
              <Pencil className="h-3 w-3" />
            </button>
            <button onClick={() => onDelete(entry.id)} className="p-0.5 text-muted-foreground/50 hover:text-destructive transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {/* Empty rows to fill page */}
        {Array.from({ length: ENTRIES_PER_PAGE - pageEntries.length }).map((_, i) => (
          <div key={`empty-${i}`} className={`grid grid-cols-[80px_1fr_60px_50px_24px_24px] gap-1 px-3 py-2 ${
            i < ENTRIES_PER_PAGE - pageEntries.length - 1 ? 'border-b border-border/10' : ''
          }`}>
            <span className="font-mono text-[11px] text-border/30">——/——/——</span>
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>

      {/* Page footer */}
      <div className="px-4 py-1.5 border-t border-border/20">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[8px] text-muted-foreground/30 italic">
            {pageEntries.length > 0
              ? `${pageEntries.length} entr${pageEntries.length === 1 ? 'y' : 'ies'}`
              : 'No entries'}
          </span>
          {pageEntries.length > 0 && (
            <span className="font-mono text-[8px] text-primary/50">
              Σ {pageEntries.reduce((sum, e) => sum + totalHours(e), 0).toFixed(1)} hrs
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Book */}
      <div className="w-full perspective-[1200px]">
        <div
          className={`
            relative bg-card border border-border rounded-lg shadow-2xl
            shadow-black/20 overflow-hidden
            transition-transform duration-500 ease-in-out
            ${flipping === 'forward' ? 'animate-page-forward' : ''}
            ${flipping === 'backward' ? 'animate-page-backward' : ''}
          `}
          style={{
            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.95) 100%)',
          }}
        >
          {/* Book spine shadow */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 z-20"
            style={{
              background: 'linear-gradient(to right, hsl(var(--border) / 0.5), transparent, hsl(var(--border) / 0.5))',
              boxShadow: '0 0 12px 4px hsl(var(--border) / 0.15)',
            }}
          />

          {/* Pages */}
          <div className="flex min-h-[400px]">
            {renderPage(leftPageEntries, currentSpread * 2 + 1, 'left')}
            {renderPage(rightPageEntries, currentSpread * 2 + 2, 'right')}
          </div>

          {/* Page edge texture */}
          <div className="absolute right-0 top-2 bottom-2 w-[3px] flex flex-col gap-[1px]">
            {Array.from({ length: Math.min(totalSpreads, 8) }).map((_, i) => (
              <div key={i} className="flex-1 bg-border/20 rounded-r-sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBackward}
          disabled={currentSpread === 0 || flipping !== null}
          className="font-mono text-xs gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          PREV
        </Button>
        <span className="font-mono text-[10px] text-muted-foreground">
          {currentSpread + 1} / {totalSpreads}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={goForward}
          disabled={currentSpread >= totalSpreads - 1 || flipping !== null}
          className="font-mono text-xs gap-1"
        >
          NEXT
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
