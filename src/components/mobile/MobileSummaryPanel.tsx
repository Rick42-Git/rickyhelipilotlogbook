import { useMemo } from 'react';
import { LogbookEntry, NumericField } from '@/types/logbook';
import { normalizeAircraftType } from '@/lib/normalizeAircraftType';
import { classifyAircraft, AircraftCategory, CATEGORY_SHORT } from '@/lib/aircraftCategories';

interface MobileSummaryPanelProps {
  totals: Record<NumericField, number>;
  entryCount: number;
  entries: LogbookEntry[];
}

function getEntryHours(e: LogbookEntry) {
  return (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
}

function getCategoryTotals(entries: LogbookEntry[]) {
  const cats: Record<AircraftCategory, { hours: number; flights: number }> = {
    heli_piston: { hours: 0, flights: 0 },
    heli_turbine: { hours: 0, flights: 0 },
    fw_piston: { hours: 0, flights: 0 },
    fw_turbine: { hours: 0, flights: 0 },
    simulator: { hours: 0, flights: 0 },
    unknown: { hours: 0, flights: 0 },
  };
  const typeByCat: Record<AircraftCategory, Record<string, { hours: number; flights: number }>> = {
    heli_piston: {}, heli_turbine: {}, fw_piston: {}, fw_turbine: {}, simulator: {}, unknown: {},
  };
  for (const e of entries) {
    const type = normalizeAircraftType(e.aircraftType || 'Unknown');
    const cat = classifyAircraft(type);
    const hrs = getEntryHours(e);
    cats[cat].hours += hrs;
    cats[cat].flights += 1;
    if (!typeByCat[cat][type]) typeByCat[cat][type] = { hours: 0, flights: 0 };
    typeByCat[cat][type].hours += hrs;
    typeByCat[cat][type].flights += 1;
  }
  return { cats, typeByCat };
}

const GAME_PATTERNS = ['game', 'sgp', 'capture', 'darting', 'zebra', 'eland', 'buffalo', 'rhino', 'elephant', 'giraffe', 'hippo', 'lion', 'leopard', 'cheetah', 'wildebeest', 'kudu', 'impala', 'nyala', 'sable', 'roan', 'waterbuck', 'warthog', 'crocodile', 'wild dog', 'hyena', 'springbok', 'gemsbok', 'oryx', 'tsessebe', 'blesbok', 'bontebok', 'bushbuck', 'duiker', 'steenbok', 'klipspringer', 'hartebeest'];
const CROSS_COUNTRY_PATTERNS = [' to ', '->', '→', '-', 'nav', 'transnet', 'pipeline'];

function getPatternTotals(entries: LogbookEntry[], patterns: string[]) {
  let hours = 0, flights = 0;
  for (const e of entries) {
    const details = (e.flightDetails || '').toLowerCase();
    if (patterns.some(p => details.includes(p))) {
      flights += 1;
      hours += getEntryHours(e);
    }
  }
  return { hours, flights };
}

const CAT_ORDER: AircraftCategory[] = ['heli_piston', 'heli_turbine', 'fw_piston', 'fw_turbine', 'simulator', 'unknown'];
const CAT_BORDER: Record<AircraftCategory, string> = {
  heli_piston: 'border-primary/30',
  heli_turbine: 'border-accent/30',
  fw_piston: 'border-success/30',
  fw_turbine: 'border-destructive/30',
  simulator: 'border-muted-foreground/30',
  unknown: 'border-border',
};
const CAT_TEXT: Record<AircraftCategory, string> = {
  heli_piston: 'text-primary',
  heli_turbine: 'text-accent',
  fw_piston: 'text-success',
  fw_turbine: 'text-destructive',
  simulator: 'text-muted-foreground',
  unknown: 'text-muted-foreground',
};

export function MobileSummaryPanel({ totals, entryCount, entries }: MobileSummaryPanelProps) {
  const grandTotal = totals.seDayDual + totals.seDayPilot + totals.seNightDual + totals.seNightPilot;
  const totalDay = totals.seDayDual + totals.seDayPilot;
  const totalNight = totals.seNightDual + totals.seNightPilot;
  const totalInstruction = totals.instructorDay + totals.instructorNight;
  const { cats, typeByCat } = useMemo(() => getCategoryTotals(entries), [entries]);
  const gameTotals = useMemo(() => getPatternTotals(entries, GAME_PATTERNS), [entries]);
  const crossCountryTotals = useMemo(() => getPatternTotals(entries, CROSS_COUNTRY_PATTERNS), [entries]);

  const heliTotal = cats.heli_piston.hours + cats.heli_turbine.hours;
  const heliFlights = cats.heli_piston.flights + cats.heli_turbine.flights;
  const fwTotal = cats.fw_piston.hours + cats.fw_turbine.hours;
  const fwFlights = cats.fw_piston.flights + cats.fw_turbine.flights;

  return (
    <div className="flex flex-col gap-2 overflow-y-auto pb-14">
      {/* Hero total */}
      <div className="bg-card border border-success/20 rounded-lg px-3 py-2 flex items-center justify-between">
        <div>
          <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">Total Hours</p>
          <span className="font-mono text-2xl font-bold text-success leading-none">{grandTotal.toFixed(1)}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">{entryCount} flights</span>
      </div>

      {/* Helicopter vs Fixed-Wing */}
      <div className="grid grid-cols-2 gap-1.5">
        {heliFlights > 0 && (
          <div className="bg-card border border-primary/20 rounded px-2 py-1.5 text-center">
            <p className="font-mono text-[7px] text-primary uppercase tracking-wider">🚁 Helicopter</p>
            <span className="font-mono text-sm font-bold text-foreground leading-none">{heliTotal.toFixed(1)}</span>
            <p className="font-mono text-[7px] text-muted-foreground">{heliFlights} flights</p>
          </div>
        )}
        {fwFlights > 0 && (
          <div className="bg-card border border-success/20 rounded px-2 py-1.5 text-center">
            <p className="font-mono text-[7px] text-success uppercase tracking-wider">✈ Fixed-Wing</p>
            <span className="font-mono text-sm font-bold text-foreground leading-none">{fwTotal.toFixed(1)}</span>
            <p className="font-mono text-[7px] text-muted-foreground">{fwFlights} flights</p>
          </div>
        )}
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

      {/* Category cards */}
      {CAT_ORDER.filter(c => cats[c].flights > 0).map(cat => {
        const typeEntries = Object.entries(typeByCat[cat]).sort((a, b) => b[1].hours - a[1].hours);
        return (
          <div key={cat} className={`bg-card border ${CAT_BORDER[cat]} rounded-lg px-3 py-2`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`font-mono text-[8px] ${CAT_TEXT[cat]} uppercase tracking-widest font-semibold`}>
                {CATEGORY_SHORT[cat]}
              </span>
              <span className="font-mono text-xs font-bold text-foreground">{cats[cat].hours.toFixed(1)}<span className="text-[8px] text-muted-foreground ml-0.5">({cats[cat].flights})</span></span>
            </div>
            {typeEntries.length > 1 && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-border/30 pt-1">
                {typeEntries.map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-muted-foreground truncate mr-1">{type}</span>
                    <span className="font-mono text-[9px] font-semibold text-foreground shrink-0">{data.hours.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

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

      {/* Game & X-Country */}
      {(gameTotals.flights > 0 || crossCountryTotals.flights > 0) && (
        <div className="grid grid-cols-2 gap-1.5">
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
