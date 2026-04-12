import { useMemo } from 'react';
import { LogbookEntry, NumericField } from '@/types/logbook';
import { normalizeAircraftType } from '@/lib/normalizeAircraftType';

interface MobileSummaryPanelProps {
  totals: Record<NumericField, number>;
  entryCount: number;
  entries: LogbookEntry[];
}

const PISTON_TYPES = new Set(['RH-22', 'RH-44', 'H269', 'FNTP II', 'FSTD I', 'FSTD II']);

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

const GAME_PATTERNS = ['game', 'sgp', 'capture', 'darting', 'zebra', 'eland', 'buffalo', 'rhino', 'elephant', 'giraffe', 'hippo', 'lion', 'leopard', 'cheetah', 'wildebeest', 'kudu', 'impala', 'nyala', 'sable', 'roan', 'waterbuck', 'warthog', 'crocodile', 'wild dog', 'hyena', 'springbok', 'gemsbok', 'oryx', 'tsessebe', 'blesbok', 'bontebok', 'bushbuck', 'duiker', 'steenbok', 'klipspringer', 'hartebeest'];

function getGameTotals(entries: LogbookEntry[]) {
  let hours = 0, flights = 0;
  for (const e of entries) {
    const details = (e.flightDetails || '').toLowerCase();
    if (GAME_PATTERNS.some(p => details.includes(p))) {
      flights += 1;
      hours += (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
    }
  }
  return { hours, flights };
}

const CROSS_COUNTRY_PATTERNS = [' to ', '->', '→', '-', 'nav', 'transnet', 'pipeline'];

function getCrossCountryTotals(entries: LogbookEntry[]) {
  let hours = 0, flights = 0;
  for (const e of entries) {
    const details = (e.flightDetails || '').toLowerCase();
    if (CROSS_COUNTRY_PATTERNS.some(p => details.includes(p))) {
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
  const crossCountryTotals = useMemo(() => getCrossCountryTotals(entries), [entries]);

  return (
    <div className="flex flex-col gap-2 overflow-y-auto pb-14">
      {/* Hero total — compact */}
      <div className="bg-card border border-success/20 rounded-lg px-3 py-2 flex items-center justify-between">
        <div>
          <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">Total Hours</p>
          <span className="font-mono text-2xl font-bold text-success leading-none">{grandTotal.toFixed(1)}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">{entryCount} flights</span>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Day', value: totalDay, color: 'text-primary' },
          { label: 'Night', value: totalNight, color: 'text-destructive' },
          { label: 'Instr', value: totalInstruction, color: 'text-accent' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded px-2 py-1.5 text-center">
            <p className="font-mono text-[7px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <span className={`font-mono text-sm font-bold ${s.color} leading-none`}>{s.value.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="bg-card border border-border rounded-lg px-3 py-2">
        <h3 className="font-mono text-[8px] text-primary uppercase tracking-widest mb-1.5">Breakdown</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          {[
            { label: 'SE Day Dual', value: totals.seDayDual },
            { label: 'SE Day PIC', value: totals.seDayPilot },
            { label: 'SE Night Dual', value: totals.seNightDual },
            { label: 'SE Night PIC', value: totals.seNightPilot },
            { label: 'Instrument', value: totals.instrumentTime },
            { label: 'Inst Day', value: totals.instructorDay },
            { label: 'Inst Night', value: totals.instructorNight },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-muted-foreground">{row.label}</span>
              <span className="font-mono text-[10px] font-semibold text-foreground">{row.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aircraft types */}
      {typeTotals.length > 0 && (
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <h3 className="font-mono text-[8px] text-accent uppercase tracking-widest mb-1.5">By Type</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {typeTotals.map(([type, data]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground truncate mr-1">{type}</span>
                <span className="font-mono text-[10px] font-semibold text-foreground shrink-0">{data.hours.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Turbine & Game in one row */}
      {(turbineTotals.flights > 0 || gameTotals.flights > 0 || crossCountryTotals.flights > 0) && (
        <div className="grid grid-cols-3 gap-1.5">
          {turbineTotals.flights > 0 && (
            <div className="bg-card border border-accent/20 rounded px-2 py-1.5 flex items-center justify-between">
              <span className="font-mono text-[8px] text-accent uppercase">Turbine</span>
              <span className="font-mono text-xs font-bold text-foreground">{turbineTotals.hours.toFixed(1)}</span>
            </div>
          )}
          {gameTotals.flights > 0 && (
            <div className="bg-card border border-accent/20 rounded px-2 py-1.5 flex items-center justify-between">
              <span className="font-mono text-[8px] text-accent uppercase">Game</span>
              <span className="font-mono text-xs font-bold text-foreground">{gameTotals.hours.toFixed(1)}</span>
            </div>
          )}
          {crossCountryTotals.flights > 0 && (
            <div className="bg-card border border-primary/20 rounded px-2 py-1.5 flex items-center justify-between">
              <span className="font-mono text-[8px] text-primary uppercase">X-Country</span>
              <span className="font-mono text-xs font-bold text-foreground">{crossCountryTotals.hours.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
