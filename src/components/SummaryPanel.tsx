import { useMemo } from 'react';
import { LogbookEntry, numericFieldLabels, NumericField } from '@/types/logbook';
import { normalizeAircraftType } from '@/lib/normalizeAircraftType';

interface SummaryPanelProps {
  totals: Record<NumericField, number>;
  entryCount: number;
  entries: LogbookEntry[];
}

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

const PISTON_TYPES = new Set(['RH-22', 'RH-44', 'FNTP II']);

function getTurbineTotals(entries: LogbookEntry[]) {
  let hours = 0;
  let flights = 0;
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
  let hours = 0;
  let flights = 0;
  for (const e of entries) {
    if ((e.flightDetails || '').toLowerCase().includes('game')) {
      flights += 1;
      hours += (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
    }
  }
  return { hours, flights };
}

export function SummaryPanel({ totals, entryCount, entries }: SummaryPanelProps) {
  const groups = useMemo(() => [
    { title: 'Single Engine — Day', fields: ['seDayDual', 'seDayPilot'] as NumericField[] },
    { title: 'Single Engine — Night', fields: ['seNightDual', 'seNightPilot'] as NumericField[] },
    { title: 'Instrument', fields: ['instrumentTime'] as NumericField[] },
    { title: 'Instructor', fields: ['instructorDay', 'instructorNight'] as NumericField[] },
  ], []);

  const grandTotal = useMemo(() => (totals.seDayDual + totals.seDayPilot + totals.seNightDual + totals.seNightPilot), [totals]);
  const typeTotals = useMemo(() => getTypeTotals(entries), [entries]);
  const turbineTotals = useMemo(() => getTurbineTotals(entries), [entries]);
  const gameTotals = useMemo(() => getGameTotals(entries), [entries]);

  return (
    <div className="glass-panel p-5 glow-amber">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs text-primary uppercase tracking-widest">▸ Flight Totals</h2>
        <div className="font-mono text-xs text-muted-foreground">
          {entryCount} FLIGHTS
        </div>
      </div>
      <div className="flex items-center justify-center mb-4 py-3 rounded border border-success/20 bg-success/5">
        <div className="text-center">
          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.3em] mb-1">Total Flight Hours</p>
          <span className="font-mono text-3xl font-bold text-success tracking-wider drop-shadow-[0_0_10px_hsl(142_70%_45%/0.4)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {grandTotal.toFixed(1)}
          </span>
          <span className="font-mono text-xs text-primary/70 ml-1.5 uppercase tracking-widest">HRS</span>
        </div>
      </div>

      {/* Per-type totals */}
      {typeTotals.length > 0 && (
        <div className="mb-4">
          <p className="font-mono text-[9px] text-accent uppercase tracking-widest border-b border-border pb-1 mb-2">Hours by Aircraft Type</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
            {typeTotals.map(([type, data]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-muted-foreground truncate mr-2">{type}</span>
                <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                  {data.hours.toFixed(1)} <span className="text-muted-foreground font-normal text-[9px]">({data.flights})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {turbineTotals.flights > 0 && (
        <div className="mb-4 flex items-center justify-between rounded border border-accent/20 bg-accent/5 px-4 py-2">
          <p className="font-mono text-[9px] text-accent uppercase tracking-widest">Turbine</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold text-foreground">{turbineTotals.hours.toFixed(1)} <span className="text-muted-foreground font-normal text-[9px]">HRS</span></span>
            <span className="font-mono text-[10px] text-muted-foreground">({turbineTotals.flights} flights)</span>
          </div>
        </div>
      )}

      {gameTotals.flights > 0 && (
        <div className="mb-4 flex items-center justify-between rounded border border-accent/20 bg-accent/5 px-4 py-2">
          <p className="font-mono text-[9px] text-accent uppercase tracking-widest">Game Flights</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold text-foreground">{gameTotals.hours.toFixed(1)} <span className="text-muted-foreground font-normal text-[9px]">HRS</span></span>
            <span className="font-mono text-[10px] text-muted-foreground">({gameTotals.flights} flights)</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {groups.map(g => (
          <div key={g.title} className="space-y-1">
            <p className="font-mono text-[9px] text-accent uppercase tracking-widest border-b border-border pb-1">{g.title}</p>
            {g.fields.map(f => (
              <div key={f} className="flex justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">{numericFieldLabels[f].replace(/^(SE |Instr |Instructor )/, '')}</span>
                <span className="font-mono text-xs font-semibold text-foreground">{totals[f].toFixed(1)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
