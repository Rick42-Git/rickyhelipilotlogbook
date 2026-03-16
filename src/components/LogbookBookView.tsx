import { useState, useMemo, useCallback } from 'react';
import { LogbookEntry } from '@/types/logbook';
import helicopterWatermark from '@/assets/helicopter-watermark.png';
import { ChevronLeft, ChevronRight, Pencil, Trash2, FileDown, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exportBookPagesPDF } from '@/lib/exportBookPages';

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
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [flipState, setFlipState] = useState<'idle' | 'flipping-forward' | 'flipping-backward'>('idle');
  const [exportOpen, setExportOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportFrom, setExportFrom] = useState(1);
  const [exportTo, setExportTo] = useState(1);

  const sorted = useMemo(() =>
    [...entries].sort((a, b) => (a.date > b.date ? 1 : -1)),
    [entries]
  );

  const totalSpreads = Math.max(1, Math.ceil(sorted.length / ROWS_PER_SPREAD));
  const [currentSpread, setCurrentSpread] = useState(() =>
    Math.max(0, Math.ceil(entries.length / ROWS_PER_SPREAD) - 1)
  );
  const spreadEntries = sorted.slice(
    currentSpread * ROWS_PER_SPREAD,
    currentSpread * ROWS_PER_SPREAD + ROWS_PER_SPREAD
  );

  // Compute cumulative totals from first entry up to last entry on current page
  const cumulativeTotals = useMemo(() => {
    const endIndex = currentSpread * ROWS_PER_SPREAD + spreadEntries.length;
    const entriesUpToHere = sorted.slice(0, endIndex);
    return entriesUpToHere.reduce((t, e) => ({
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
  }, [sorted, currentSpread, spreadEntries.length]);

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

  const bookContent = (
    <div className={`flex flex-col items-center gap-3 ${isFullscreen ? 'w-full h-full justify-center' : 'max-w-[96%] mx-auto'}`}>
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
            boxShadow: `
              0 30px 80px -10px hsl(30 50% 15% / 0.6),
              0 15px 35px -5px hsl(30 40% 10% / 0.5),
              0 5px 15px hsl(0 0% 0% / 0.4),
              0 0 0 1px hsl(30 20% 50% / 0.25),
              0 0 80px -20px hsl(38 95% 55% / 0.12),
              inset 0 1px 0 hsl(45 30% 95%)
            `,
            transform: 'translateY(-2px)',
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
              <div className="flex-1 min-w-0 border-r relative" style={{ borderColor: 'hsl(30 15% 70% / 0.3)' }}>
                {/* Helicopter watermark */}
                <img src={helicopterWatermark} alt="" className="absolute pointer-events-none z-[1]" style={{ width: '70%', left: '15%', top: '30%', opacity: 0.06, mixBlendMode: 'multiply' }} />
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
                        <tr
                          key={entry.id}
                          className={`border-b book-row-border cursor-default transition-colors ${hoveredRow === i ? 'book-row-highlight' : ''}`}
                          onMouseEnter={() => setHoveredRow(i)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
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
                            <span className="text-[9px] truncate block max-w-[260px] pr-10">{entry.flightDetails}</span>
                            {hoveredRow === i && (
                              <span className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                                <button onClick={() => onEdit(entry)} className="p-0.5 rounded hover:bg-black/10 transition-colors" style={{ color: 'hsl(30 15% 45%)' }}>
                                  <Pencil className="h-2.5 w-2.5" />
                                </button>
                                <button onClick={() => onDelete(entry.id)} className="p-0.5 rounded hover:bg-red-200/60 transition-colors" style={{ color: 'hsl(0 60% 45%)' }}>
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            )}
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
                      <td colSpan={6} className="px-2 py-[3px] font-mono text-[9px] italic border-r-0 font-bold" style={{ color: 'hsl(30 15% 40%)' }}>
                        Grand Totals
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ========== RIGHT PAGE ========== */}
              <div className="flex-1 min-w-0 relative">
                {/* Helicopter watermark */}
                <img src={helicopterWatermark} alt="" className="absolute pointer-events-none z-[1]" style={{ width: '70%', left: '15%', top: '30%', opacity: 0.06, mixBlendMode: 'multiply', transform: 'scaleX(-1)' }} />
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
                    {spreadEntries.map((entry, i) => (
                      <tr
                        key={entry.id}
                        className={`border-b book-row-border transition-colors ${hoveredRow === i ? 'book-row-highlight' : ''}`}
                        onMouseEnter={() => setHoveredRow(i)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
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
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(200 50% 30%)' }}>{fmt(cumulativeTotals.seDayPilot)}</td>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(200 50% 30%)' }}>{fmt(cumulativeTotals.seDayDual)}</td>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(0 50% 35%)' }}>{fmt(cumulativeTotals.seNightDual)}</td>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(0 50% 35%)' }}>{fmt(cumulativeTotals.seNightPilot)}</td>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(30 15% 30%)' }}>{fmt(cumulativeTotals.instrumentTime)}</td>
                      <td className={`${tdClass} font-bold text-[9px]`} style={{ color: 'hsl(150 40% 25%)' }}>{fmt(cumulativeTotals.instructorDay)}</td>
                      <td className={`${tdClass} font-bold text-[9px] border-r-0`} style={{ color: 'hsl(150 40% 25%)' }}>{fmt(cumulativeTotals.instructorNight)}</td>
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
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">Spread</span>
          <select
            value={currentSpread}
            onChange={e => setCurrentSpread(Number(e.target.value))}
            className="font-mono text-[10px] bg-transparent border border-border/50 rounded px-1.5 py-0.5 text-foreground appearance-none cursor-pointer"
          >
            {Array.from({ length: totalSpreads }).map((_, i) => (
              <option key={i} value={i}>{i + 1}</option>
            ))}
          </select>
          <span className="font-mono text-[10px] text-muted-foreground">of {totalSpreads}</span>
        </div>
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

        <div className="w-px h-4 bg-border/50 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="font-mono text-xs gap-1.5"
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {isFullscreen ? 'EXIT' : 'FULLSCREEN'}
        </Button>

        <div className="w-px h-4 bg-border/50 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setExportFrom(currentSpread + 1);
            setExportTo(totalSpreads);
            setExportOpen(true);
          }}
          className="font-mono text-xs gap-1.5"
        >
          <FileDown className="h-3.5 w-3.5" />
          EXPORT PDF
        </Button>
      </div>

      {/* Export dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">EXPORT PAGES TO PDF</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] text-muted-foreground">FROM SPREAD</Label>
              <Input
                type="number"
                min={1}
                max={totalSpreads}
                value={exportFrom}
                onChange={e => setExportFrom(Math.max(1, Math.min(totalSpreads, parseInt(e.target.value) || 1)))}
                className="font-mono h-9"
              />
              <span className="font-mono text-[9px] text-muted-foreground">Pages {(exportFrom - 1) * 2 + 1}–{exportFrom * 2}</span>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] text-muted-foreground">TO SPREAD</Label>
              <Input
                type="number"
                min={exportFrom}
                max={totalSpreads}
                value={exportTo}
                onChange={e => setExportTo(Math.max(exportFrom, Math.min(totalSpreads, parseInt(e.target.value) || exportFrom)))}
                className="font-mono h-9"
              />
              <span className="font-mono text-[9px] text-muted-foreground">Pages {(exportTo - 1) * 2 + 1}–{exportTo * 2}</span>
            </div>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            {exportTo - exportFrom + 1} spread{exportTo - exportFrom + 1 !== 1 ? 's' : ''} · {(exportTo - exportFrom + 1) * ROWS_PER_SPREAD} entry slots
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)} className="font-mono text-xs">CANCEL</Button>
            <Button
              onClick={() => {
                exportBookPagesPDF(entries, exportFrom - 1, exportTo - 1);
                setExportOpen(false);
              }}
              className="font-mono text-xs gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5" />
              GENERATE PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background p-4 overflow-auto flex items-center justify-center">
        {bookContent}
      </div>
    );
  }

  return bookContent;
}
