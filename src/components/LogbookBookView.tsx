import { useState, useMemo, useCallback } from 'react';
import { LogbookEntry } from '@/types/logbook';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogbookBookViewProps {
  entries: LogbookEntry[];
  onEdit: (entry: LogbookEntry) => void;
  onDelete: (id: string) => void;
}

const ROWS_PER_SPREAD = 22;

function fmt(n: number) { return n > 0 ? n.toFixed(1) : ''; }

function getMonthDay(iso: string): { month: string; day: string; year: string } {
  if (!iso) return { month: '', day: '', year: '' };
  const [y, m, d] = iso.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return { month: months[parseInt(m)] || m, day: d || '', year: y || '' };
}

export function LogbookBookView({ entries, onEdit, onDelete }: LogbookBookViewProps) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [flipState, setFlipState] = useState<'idle' | 'flipping-forward' | 'flipping-backward'>('idle');

  const sorted = useMemo(() =>
    [...entries].sort((a, b) => (a.date > b.date ? -1 : 1)),
    [entries]
  );

  const totalSpreads = Math.max(1, Math.ceil(sorted.length / ROWS_PER_SPREAD));
  const spreadEntries = sorted.slice(
    currentSpread * ROWS_PER_SPREAD,
    currentSpread * ROWS_PER_SPREAD + ROWS_PER_SPREAD
  );

  // Compute page totals
  const pageTotals = useMemo(() => {
    return spreadEntries.reduce((t, e) => ({
      seDayPilot: t.seDayPilot + e.seDayPilot,
      seDayDual: t.seDayDual + e.seDayDual,
      seNightDual: t.seNightDual + e.seNightDual,
      seNightPilot: t.seNightPilot + e.seNightPilot,
      instrumentTime: t.instrumentTime + e.instrumentTime,
      instructorDay: t.instructorDay + e.instructorDay,
      instructorNight: t.instructorNight + e.instructorNight,
    }), {
      seDayPilot: 0, seDayDual: 0, seNightDual: 0, seNightPilot: 0,
      instrumentTime: 0, instructorDay: 0, instructorNight: 0,
    });
  }, [spreadEntries]);

  // Year for the header
  const spreadYear = spreadEntries.length > 0 ? getMonthDay(spreadEntries[0].date).year : '';

  const flip = useCallback((dir: 'forward' | 'backward') => {
    if (flipState !== 'idle') return;
    if (dir === 'forward' && currentSpread >= totalSpreads - 1) return;
    if (dir === 'backward' && currentSpread <= 0) return;

    setFlipState(dir === 'forward' ? 'flipping-forward' : 'flipping-backward');
    setTimeout(() => {
      setCurrentSpread(p => dir === 'forward' ? p + 1 : p - 1);
      setFlipState('idle');
    }, 900);
  }, [flipState, currentSpread, totalSpreads]);

  if (entries.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <p className="font-mono text-muted-foreground text-lg">NO ENTRIES LOGGED</p>
        <p className="text-sm text-muted-foreground mt-2">Add flights manually or upload logbook photos</p>
      </div>
    );
  }

  const emptyRows = ROWS_PER_SPREAD - spreadEntries.length;

  const thClass = "px-1.5 py-1 font-mono text-[8px] uppercase tracking-wide text-center whitespace-nowrap border-r border-b book-border-color";
  const thGroupClass = "px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-widest text-center border-r border-b book-border-color font-bold";
  const tdClass = "px-1.5 py-[3px] font-mono text-[10px] border-r book-border-color text-center whitespace-nowrap";
  const tdLeftClass = "px-1.5 py-[3px] font-mono text-[10px] border-r book-border-color whitespace-nowrap";

  return (
    <div className="flex flex-col items-center gap-3 -mx-4 md:-mx-8 lg:-mx-16">
      {/* Book container */}
      <div className="w-full" style={{ perspective: '2000px' }}>
        <div className="book-container relative">
          {/* Page turn animation layers */}
          {flipState !== 'idle' && (
            <>
              {/* Shadow cast on the underlying page */}
              <div className={`book-flip-shadow ${flipState}`} />
              {/* The turning page with front & back faces */}
              <div
                className={`book-flip-container ${flipState}`}
              >
                <div className="book-flip-front" />
                <div className="book-flip-back" />
              </div>
            </>
          )}

          {/* Book spread */}
          <div className="book-spread relative overflow-hidden rounded-md" style={{
            background: 'linear-gradient(135deg, hsl(45 30% 92%) 0%, hsl(42 25% 88%) 100%)',
            boxShadow: '0 8px 40px hsl(var(--background) / 0.6), 0 2px 8px hsl(var(--background) / 0.3), inset 0 1px 0 hsl(45 30% 95%)',
          }}>
            {/* Spine center shadow */}
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 z-20 pointer-events-none" style={{
              background: 'linear-gradient(to right, transparent, hsl(30 15% 35% / 0.15) 30%, hsl(30 15% 25% / 0.25) 50%, hsl(30 15% 35% / 0.15) 70%, transparent)',
            }} />

            {/* Page edge lines on right */}
            <div className="absolute right-0 top-1 bottom-1 w-[4px] z-10 pointer-events-none flex flex-col gap-[0.5px]">
              {Array.from({ length: Math.min(totalSpreads, 12) }).map((_, i) => (
                <div key={i} className="flex-1 rounded-r-sm" style={{ background: 'hsl(40 20% 82%)' }} />
              ))}
            </div>

            {/* Left page edge lines */}
            <div className="absolute left-0 top-1 bottom-1 w-[4px] z-10 pointer-events-none flex flex-col gap-[0.5px]">
              {Array.from({ length: Math.min(totalSpreads, 12) }).map((_, i) => (
                <div key={i} className="flex-1 rounded-l-sm" style={{ background: 'hsl(40 20% 82%)' }} />
              ))}
            </div>

            <div className="flex">
              {/* ========== LEFT PAGE ========== */}
              <div className="flex-1 min-w-0 border-r" style={{ borderColor: 'hsl(30 15% 70% / 0.3)' }}>
                {/* Header row */}
                <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b book-border-color">
                  <span className="font-mono text-[9px] tracking-[0.15em] uppercase" style={{ color: 'hsl(30 15% 35%)' }}>
                    Year <strong>{spreadYear}</strong>
                  </span>
                  <span className="font-mono text-[7px] tracking-widest uppercase" style={{ color: 'hsl(30 15% 55%)' }}>
                    Page {currentSpread * 2 + 1}
                  </span>
                </div>

                {/* Column headers */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={thClass} style={{ width: '50px', color: 'hsl(30 15% 35%)' }}>Month</th>
                      <th className={thClass} style={{ width: '36px', color: 'hsl(30 15% 35%)' }}>Day</th>
                      <th className={thClass} style={{ width: '64px', color: 'hsl(30 15% 35%)' }}>Type</th>
                      <th className={thClass} style={{ width: '56px', color: 'hsl(30 15% 35%)' }}>Reg</th>
                      <th className={thClass} style={{ width: '100px', color: 'hsl(30 15% 35%)' }}>Pilot in Command</th>
                      <th className={`${thClass} border-r-0`} style={{ color: 'hsl(30 15% 35%)' }}>Flight Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Totals carried forward row */}
                    <tr className="border-b book-border-color" style={{ background: 'hsl(40 20% 87%)' }}>
                      <td colSpan={6} className="px-2 py-[3px] font-mono text-[9px] italic border-r-0" style={{ color: 'hsl(30 15% 45%)' }}>
                        Totals Carried Forward
                      </td>
                    </tr>
                    {spreadEntries.map((entry, i) => {
                      const { month, day } = getMonthDay(entry.date);
                      const prevEntry = i > 0 ? spreadEntries[i - 1] : null;
                      const prevMonth = prevEntry ? getMonthDay(prevEntry.date).month : null;
                      const showMonth = month !== prevMonth;
                      return (
                        <tr key={entry.id} className="border-b book-row-border group hover:!bg-[hsl(38_80%_85%_/_0.3)] transition-colors cursor-default">
                          <td className={tdLeftClass} style={{ color: 'hsl(30 15% 30%)' }}>
                            <span className="text-[10px]">{showMonth ? month : '"'}</span>
                          </td>
                          <td className={tdClass} style={{ color: 'hsl(30 15% 30%)' }}>{day}</td>
                          <td className={tdLeftClass} style={{ color: 'hsl(30 15% 30%)' }}>
                            <span className="text-[9px]">{entry.aircraftType}</span>
                          </td>
                          <td className={tdClass} style={{ color: 'hsl(210 60% 40%)' }}>
                            <span className="text-[9px] font-semibold">{entry.aircraftReg}</span>
                          </td>
                          <td className={tdLeftClass} style={{ color: 'hsl(30 15% 30%)' }}>
                            <span className="text-[9px] truncate block max-w-[100px]">{entry.pilotInCommand}</span>
                          </td>
                          <td className={`${tdLeftClass} border-r-0 relative`} style={{ color: 'hsl(30 15% 30%)' }}>
                            <span className="text-[9px] truncate block max-w-[140px] pr-10">{entry.flightDetails}</span>
                            {/* Action buttons on hover */}
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5">
                              <button onClick={() => onEdit(entry)} className="p-0.5 rounded hover:bg-black/10 transition-colors" style={{ color: 'hsl(30 15% 45%)' }}>
                                <Pencil className="h-2.5 w-2.5" />
                              </button>
                              <button onClick={() => onDelete(entry.id)} className="p-0.5 rounded hover:bg-red-200/60 transition-colors" style={{ color: 'hsl(0 60% 45%)' }}>
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Empty rows */}
                    {Array.from({ length: emptyRows }).map((_, i) => (
                      <tr key={`e-${i}`} className="border-b book-row-border" style={{ height: '22px' }}>
                        <td className={tdClass}></td><td className={tdClass}></td><td className={tdClass}></td>
                        <td className={tdClass}></td><td className={tdClass}></td><td className={`${tdClass} border-r-0`}></td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ background: 'hsl(40 20% 87%)' }}>
                      <td colSpan={6} className="px-2 py-[3px] font-mono text-[9px] italic border-r-0" style={{ color: 'hsl(30 15% 45%)' }}>
                        Totals This Page
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ========== RIGHT PAGE ========== */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b book-border-color">
                  <span className="font-mono text-[7px] tracking-widest uppercase" style={{ color: 'hsl(30 15% 55%)' }}>
                    Single Engine Aircraft
                  </span>
                  <span className="font-mono text-[7px] tracking-widest uppercase" style={{ color: 'hsl(30 15% 55%)' }}>
                    Page {currentSpread * 2 + 2}
                  </span>
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    {/* Group headers */}
                    <tr>
                      <th colSpan={2} className={thGroupClass} style={{ color: 'hsl(200 50% 35%)' }}>Day</th>
                      <th colSpan={2} className={thGroupClass} style={{ color: 'hsl(0 50% 40%)' }}>Night</th>
                      <th className={thGroupClass} style={{ color: 'hsl(30 15% 35%)' }}>Instr</th>
                      <th colSpan={2} className={`${thGroupClass} border-r-0`} style={{ color: 'hsl(150 40% 30%)' }}>Instructor</th>
                    </tr>
                    {/* Sub headers */}
                    <tr>
                      <th className={thClass} style={{ color: 'hsl(200 50% 35%)' }}>Pilot</th>
                      <th className={thClass} style={{ color: 'hsl(200 50% 35%)' }}>Dual</th>
                      <th className={thClass} style={{ color: 'hsl(0 50% 40%)' }}>Dual</th>
                      <th className={thClass} style={{ color: 'hsl(0 50% 40%)' }}>Pilot</th>
                      <th className={thClass} style={{ color: 'hsl(30 15% 35%)' }}>Time</th>
                      <th className={thClass} style={{ color: 'hsl(150 40% 30%)' }}>Day</th>
                      <th className={`${thClass} border-r-0`} style={{ color: 'hsl(150 40% 30%)' }}>Night</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Totals carried forward row */}
                    <tr className="border-b book-border-color" style={{ background: 'hsl(40 20% 87%)' }}>
                      <td className={tdClass} style={{ color: 'hsl(30 15% 50%)' }}></td>
                      <td className={tdClass} style={{ color: 'hsl(30 15% 50%)' }}></td>
                      <td className={tdClass} style={{ color: 'hsl(30 15% 50%)' }}></td>
                      <td className={tdClass} style={{ color: 'hsl(30 15% 50%)' }}></td>
                      <td className={tdClass} style={{ color: 'hsl(30 15% 50%)' }}></td>
                      <td className={tdClass} style={{ color: 'hsl(30 15% 50%)' }}></td>
                      <td className={`${tdClass} border-r-0`} style={{ color: 'hsl(30 15% 50%)' }}></td>
                    </tr>
                    {spreadEntries.map((entry) => (
                      <tr key={entry.id} className="border-b book-row-border group hover:!bg-[hsl(38_80%_85%_/_0.3)] transition-colors">
                        <td className={tdClass} style={{ color: 'hsl(200 50% 35%)' }}>{fmt(entry.seDayPilot)}</td>
                        <td className={tdClass} style={{ color: 'hsl(200 50% 35%)' }}>{fmt(entry.seDayDual)}</td>
                        <td className={tdClass} style={{ color: 'hsl(0 50% 40%)' }}>{fmt(entry.seNightDual)}</td>
                        <td className={tdClass} style={{ color: 'hsl(0 50% 40%)' }}>{fmt(entry.seNightPilot)}</td>
                        <td className={tdClass} style={{ color: 'hsl(30 15% 35%)' }}>{fmt(entry.instrumentTime)}</td>
                        <td className={tdClass} style={{ color: 'hsl(150 40% 30%)' }}>{fmt(entry.instructorDay)}</td>
                        <td className={`${tdClass} border-r-0`} style={{ color: 'hsl(150 40% 30%)' }}>{fmt(entry.instructorNight)}</td>
                      </tr>
                    ))}
                    {/* Empty rows */}
                    {Array.from({ length: emptyRows }).map((_, i) => (
                      <tr key={`e-${i}`} className="border-b book-row-border" style={{ height: '22px' }}>
                        <td className={tdClass}></td><td className={tdClass}></td><td className={tdClass}></td>
                        <td className={tdClass}></td><td className={tdClass}></td><td className={tdClass}></td>
                        <td className={`${tdClass} border-r-0`}></td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ background: 'hsl(40 20% 87%)' }}>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(200 50% 30%)' }}>{fmt(pageTotals.seDayPilot)}</td>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(200 50% 30%)' }}>{fmt(pageTotals.seDayDual)}</td>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(0 50% 35%)' }}>{fmt(pageTotals.seNightDual)}</td>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(0 50% 35%)' }}>{fmt(pageTotals.seNightPilot)}</td>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(30 15% 30%)' }}>{fmt(pageTotals.instrumentTime)}</td>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(150 40% 25%)' }}>{fmt(pageTotals.instructorDay)}</td>
                      <td className={`${tdClass} font-bold text-[9px] border-r-0`} style={{ color: 'hsl(150 40% 25%)' }}>{fmt(pageTotals.instructorNight)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => flip('backward')}
          disabled={currentSpread === 0 || flipState !== 'idle'}
          className="font-mono text-xs gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          PREV PAGE
        </Button>
        <span className="font-mono text-[10px] text-muted-foreground">
          Spread {currentSpread + 1} of {totalSpreads}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => flip('forward')}
          disabled={currentSpread >= totalSpreads - 1 || flipState !== 'idle'}
          className="font-mono text-xs gap-1.5"
        >
          NEXT PAGE
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
