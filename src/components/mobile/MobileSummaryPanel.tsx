import { useMemo } from 'react';
import { LogbookEntry, numericFieldLabels, NumericField } from '@/types/logbook';
import { normalizeAircraftType } from '@/lib/normalizeAircraftType';

interface MobileSummaryPanelProps {
  totals: Record<NumericField, number>;
  entryCount: number;
  entries: LogbookEntry[];
}

const PISTON_TYPES = new Set(['RH-22', 'RH-44', 'FNTP II', 'FSTD I', 'FSTD II']);

function getTypeTotals(entries: LogbookEntry[]) {
  const map: Record<string, { hours: number; flights: number }> = {};
  for (const e of entries) {
    const type = normalizeAircraftType(e.aircraftType || 'Unknown');
    if (!map[type]) map[type] = { hours: 0, flights: 0 };
    map[type].flights += 1;
    map[type].hours += (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
  }
  return Object.entries(map).sort((a, b) => b[1].hours - a[1].hours);
}

function getTurbineTotals(entries: LogbookEntry[]) {
  let hours = 0, flights = 0;
  for (const e of entries) {
    const type = normalizeAircraftType(e.aircraftType || '');
    if (!PISTON_TYPES.has(type.toUpperCase()) && !PISTON_TYPES.has(type)) {
      flights += 1;
      hours += (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
    }
  }
  return { hours, flights };
}

function getGameTotals(entries: LogbookEntry[]) {
  let hours = 0, flights = 0;
  for (const e of entries) {
    if ((e.flightDetails || '').toLowerCase().includes('game')) {
      flights += 1;
      hours += (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
    }
  }
  return { hours, flights };
}

export function MobileSummaryPanel({ totals, entryCount, entries }: MobileSummaryPanelProps) {
  const grandTotal = totals.seDayDual + totals.seDayPilot + totals.seNightDual + totals.seNightPilot;
  const totalDay = totals.seDayDual + totals.seDayPilot;
  const totalNight = totals.seNightDual + totals.seNightPilot;
  const totalInstruction = totals.instructorDay + totals.instructorNight;
  const typeTotals = useMemo(() => getTypeTotals(entries), [entries]);
  const turbineTotals = useMemo(() => getTurbineTotals(entries), [entries]);
  const gameTotals = useMemo(() => getGameTotals(entries), [entries]);

  return (
    <div className="space-y-3 pb-20">
      {/* Hero total */}
      <div className="bg-card border border-success/20 rounded-xl p-5 text-center">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-2">Total Flight Hours</p>
        <span className="font-mono text-5xl font-bold text-success tracking-wider drop-shadow-[0_0_15px_hsl(142_70%_45%/0.4)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {grandTotal.toFixed(1)}
        </span>
        <p className="font-mono text-xs text-muted-foreground mt-2">{entryCount} flights logged</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Day', value: totalDay, color: 'text-primary' },
          { label: 'Night', value: totalNight, color: 'text-destructive' },
          { label: 'Instruction', value: totalInstruction, color: 'text-accent' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <span className={`font-mono text-lg font-bold ${s.color}`}>{s.value.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h3 className="font-mono text-[10px] text-primary uppercase tracking-widest">Hour Breakdown</h3>
        {[
          { label: 'SE Day Dual', value: totals.seDayDual },
          { label: 'SE Day PIC', value: totals.seDayPilot },
          { label: 'SE Night Dual', value: totals.seNightDual },
          { label: 'SE Night PIC', value: totals.seNightPilot },
          { label: 'Instrument', value: totals.instrumentTime },
          { label: 'Instructor Day', value: totals.instructorDay },
          { label: 'Instructor Night', value: totals.instructorNight },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">{row.label}</span>
            <span className="font-mono text-sm font-semibold text-foreground">{row.value.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Aircraft types */}
      {typeTotals.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <h3 className="font-mono text-[10px] text-accent uppercase tracking-widest">By Aircraft Type</h3>
          {typeTotals.map(([type, data]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">{type}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-foreground">{data.hours.toFixed(1)}</span>
                <span className="font-mono text-[9px] text-muted-foreground">({data.flights})</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Turbine & Game */}
      {(turbineTotals.flights > 0 || gameTotals.flights > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {turbineTotals.flights > 0 && (
            <div className="bg-card border border-accent/20 rounded-lg p-3 text-center">
              <p className="font-mono text-[9px] text-accent uppercase tracking-wider mb-1">Turbine</p>
              <span className="font-mono text-lg font-bold text-foreground">{turbineTotals.hours.toFixed(1)}</span>
              <p className="font-mono text-[9px] text-muted-foreground">{turbineTotals.flights} flights</p>
            </div>
          )}
          {gameTotals.flights > 0 && (
            <div className="bg-card border border-accent/20 rounded-lg p-3 text-center">
              <p className="font-mono text-[9px] text-accent uppercase tracking-wider mb-1">Game</p>
              <span className="font-mono text-lg font-bold text-foreground">{gameTotals.hours.toFixed(1)}</span>
              <p className="font-mono text-[9px] text-muted-foreground">{gameTotals.flights} flights</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
