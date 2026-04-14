import { useMemo } from 'react';
import { LogbookEntry, numericFieldLabels, NumericField } from '@/types/logbook';
import { normalizeAircraftType } from '@/lib/normalizeAircraftType';
import { classifyAircraft, AircraftCategory, CATEGORY_LABELS } from '@/lib/aircraftCategories';
import { LandingsMap } from '@/components/LandingsMap';
import { Sun, Moon, Gauge, GraduationCap } from 'lucide-react';

interface SummaryPanelProps {
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

export function SummaryPanel({ totals, entryCount, entries }: SummaryPanelProps) {
  const groups = useMemo(() => [
    { title: 'Single Engine — Day', fields: ['seDayDual', 'seDayPilot'] as NumericField[] },
    { title: 'Single Engine — Night', fields: ['seNightDual', 'seNightPilot'] as NumericField[] },
    { title: 'Instrument', fields: ['instrumentTime'] as NumericField[] },
    { title: 'Instructor', fields: ['instructorDay', 'instructorNight'] as NumericField[] },
  ], []);

  const grandTotal = useMemo(() => (totals.seDayDual + totals.seDayPilot + totals.seNightDual + totals.seNightPilot), [totals]);
  const totalDay = useMemo(() => totals.seDayDual + totals.seDayPilot, [totals]);
  const totalNight = useMemo(() => totals.seNightDual + totals.seNightPilot, [totals]);
  const totalInstruction = useMemo(() => totals.instructorDay + totals.instructorNight, [totals]);
  const { cats, typeByCat } = useMemo(() => getCategoryTotals(entries), [entries]);
  const gameTotals = useMemo(() => getPatternTotals(entries, GAME_PATTERNS), [entries]);
  const crossCountryTotals = useMemo(() => getPatternTotals(entries, CROSS_COUNTRY_PATTERNS), [entries]);

  const heliTotal = cats.heli_piston.hours + cats.heli_turbine.hours;
  const heliFlights = cats.heli_piston.flights + cats.heli_turbine.flights;
  const fwTotal = cats.fw_piston.hours + cats.fw_turbine.hours;
  const fwFlights = cats.fw_piston.flights + cats.fw_turbine.flights;

  const heliTypes = [
    ...Object.entries(typeByCat.heli_piston),
    ...Object.entries(typeByCat.heli_turbine),
  ].sort((a, b) => b[1].hours - a[1].hours);

  const fwTypes = [
    ...Object.entries(typeByCat.fw_piston),
    ...Object.entries(typeByCat.fw_turbine),
  ].sort((a, b) => b[1].hours - a[1].hours);

  return (
    <div className="glass-panel p-5 glow-amber">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs text-primary uppercase tracking-widest">▸ Flight Totals</h2>
        <div className="font-mono text-xs text-muted-foreground">
          {entryCount} FLIGHTS
        </div>
      </div>

      {/* Grand total */}
      <div className="flex items-center justify-center mb-4 py-3 rounded border border-success/20 bg-success/5">
        <div className="text-center">
          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.3em] mb-1">Total Flight Hours</p>
          <span className="font-mono text-3xl font-bold text-success tracking-wider drop-shadow-[0_0_10px_hsl(142_70%_45%/0.4)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {grandTotal.toFixed(1)}
          </span>
          <span className="font-mono text-xs text-primary/70 ml-1.5 uppercase tracking-widest">HRS</span>
        </div>
      </div>

      {/* Helicopter vs Fixed-Wing — adapts to single column when only one category exists */}
      {(heliFlights > 0 || fwFlights > 0) && (() => {
        const bothExist = heliFlights > 0 && fwFlights > 0;

        // Single category — simplified view without helicopter/fixed-wing label
        if (!bothExist) {
          const isSingleHeli = heliFlights > 0;
          const singlePiston = isSingleHeli ? cats.heli_piston : cats.fw_piston;
          const singleTurbine = isSingleHeli ? cats.heli_turbine : cats.fw_turbine;
          const pistonTypes = isSingleHeli ? typeByCat.heli_piston : typeByCat.fw_piston;
          const turbineTypes = isSingleHeli ? typeByCat.heli_turbine : typeByCat.fw_turbine;
          const singleTotal = (isSingleHeli ? heliTotal : fwTotal) + cats.unknown.hours;
          const singleFlights = (isSingleHeli ? heliFlights : fwFlights) + cats.unknown.flights;
          const borderColor = isSingleHeli ? 'border-primary/20' : 'border-success/20';
          const bgColor = isSingleHeli ? 'bg-primary/5' : 'bg-success/5';

          return (
            <div className={`rounded-lg border ${borderColor} ${bgColor} overflow-hidden mb-4`}>
              <div className={`flex items-center justify-between px-3 py-2 border-b ${borderColor}`}>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Aircraft Breakdown</span>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-foreground">{singleTotal.toFixed(1)}</span>
                  <span className="font-mono text-[9px] text-muted-foreground ml-1">HRS</span>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {singlePiston.flights > 0 && (
                  <div className="px-3 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-primary/70 uppercase tracking-wider font-semibold">Piston</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{singlePiston.hours.toFixed(1)} <span className="text-[8px] text-muted-foreground">({singlePiston.flights})</span></span>
                    </div>
                    {Object.entries(pistonTypes).length > 0 && (
                      <div className="mt-1 pl-2 space-y-0.5">
                        {Object.entries(pistonTypes).sort((a, b) => b[1].hours - a[1].hours).map(([type, data]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-muted-foreground">{type}</span>
                            <span className="font-mono text-[9px] font-semibold text-foreground">{data.hours.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {singleTurbine.flights > 0 && (
                  <div className="px-3 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-accent/80 uppercase tracking-wider font-semibold">Turbine</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{singleTurbine.hours.toFixed(1)} <span className="text-[8px] text-muted-foreground">({singleTurbine.flights})</span></span>
                    </div>
                    {Object.entries(turbineTypes).length > 0 && (
                      <div className="mt-1 pl-2 space-y-0.5">
                        {Object.entries(turbineTypes).sort((a, b) => b[1].hours - a[1].hours).map(([type, data]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-muted-foreground">{type}</span>
                            <span className="font-mono text-[9px] font-semibold text-foreground">{data.hours.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {cats.unknown.flights > 0 && (
                  <div className="px-3 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-destructive/70 uppercase tracking-wider font-semibold">Uncategorised</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{cats.unknown.hours.toFixed(1)} <span className="text-[8px] text-muted-foreground">({cats.unknown.flights})</span></span>
                    </div>
                    {Object.entries(typeByCat.unknown).length > 0 && (
                      <div className="mt-1 pl-2 space-y-0.5">
                        {Object.entries(typeByCat.unknown).sort((a, b) => b[1].hours - a[1].hours).map(([type, data]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-muted-foreground">{type || '(empty)'}</span>
                            <span className="font-mono text-[9px] font-semibold text-foreground">{data.hours.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className={`flex items-center justify-between px-3 py-1 border-t ${borderColor} ${bgColor}`}>
                <span className="font-mono text-[8px] text-muted-foreground">{singleFlights} flights</span>
              </div>
            </div>
          );
        }

        // Both categories — show split view
        return (
          <div className="grid gap-3 mb-4 grid-cols-1 md:grid-cols-2">
            {/* Helicopter column */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10">
                <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-bold">🚁 Helicopter</span>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-foreground">{heliTotal.toFixed(1)}</span>
                  <span className="font-mono text-[9px] text-muted-foreground ml-1">HRS</span>
                </div>
              </div>
              <div className="divide-y divide-primary/10">
                {cats.heli_piston.flights > 0 && (
                  <div className="px-3 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-primary/70 uppercase tracking-wider">Piston</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{cats.heli_piston.hours.toFixed(1)} <span className="text-[8px] text-muted-foreground">({cats.heli_piston.flights})</span></span>
                    </div>
                    {Object.entries(typeByCat.heli_piston).length > 0 && (
                      <div className="mt-1 pl-2 space-y-0.5">
                        {Object.entries(typeByCat.heli_piston).sort((a, b) => b[1].hours - a[1].hours).map(([type, data]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-muted-foreground">{type}</span>
                            <span className="font-mono text-[9px] font-semibold text-foreground">{data.hours.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {cats.heli_turbine.flights > 0 && (
                  <div className="px-3 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-accent/80 uppercase tracking-wider">Turbine</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{cats.heli_turbine.hours.toFixed(1)} <span className="text-[8px] text-muted-foreground">({cats.heli_turbine.flights})</span></span>
                    </div>
                    {Object.entries(typeByCat.heli_turbine).length > 0 && (
                      <div className="mt-1 pl-2 space-y-0.5">
                        {Object.entries(typeByCat.heli_turbine).sort((a, b) => b[1].hours - a[1].hours).map(([type, data]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-muted-foreground">{type}</span>
                            <span className="font-mono text-[9px] font-semibold text-foreground">{data.hours.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-3 py-1 border-t border-primary/10 bg-primary/5">
                <span className="font-mono text-[8px] text-muted-foreground">{heliFlights} flights</span>
              </div>
            </div>

            {/* Fixed-Wing column */}
            <div className="rounded-lg border border-success/20 bg-success/5 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-success/10">
                <span className="font-mono text-[10px] text-success uppercase tracking-widest font-bold">✈ Fixed-Wing</span>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-foreground">{fwTotal.toFixed(1)}</span>
                  <span className="font-mono text-[9px] text-muted-foreground ml-1">HRS</span>
                </div>
              </div>
              <div className="divide-y divide-success/10">
                {cats.fw_piston.flights > 0 && (
                  <div className="px-3 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-success/70 uppercase tracking-wider">Piston</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{cats.fw_piston.hours.toFixed(1)} <span className="text-[8px] text-muted-foreground">({cats.fw_piston.flights})</span></span>
                    </div>
                    {Object.entries(typeByCat.fw_piston).length > 0 && (
                      <div className="mt-1 pl-2 space-y-0.5">
                        {Object.entries(typeByCat.fw_piston).sort((a, b) => b[1].hours - a[1].hours).map(([type, data]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-muted-foreground">{type}</span>
                            <span className="font-mono text-[9px] font-semibold text-foreground">{data.hours.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {cats.fw_turbine.flights > 0 && (
                  <div className="px-3 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-destructive/70 uppercase tracking-wider">Turbine/Jet</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{cats.fw_turbine.hours.toFixed(1)} <span className="text-[8px] text-muted-foreground">({cats.fw_turbine.flights})</span></span>
                    </div>
                    {Object.entries(typeByCat.fw_turbine).length > 0 && (
                      <div className="mt-1 pl-2 space-y-0.5">
                        {Object.entries(typeByCat.fw_turbine).sort((a, b) => b[1].hours - a[1].hours).map(([type, data]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-muted-foreground">{type}</span>
                            <span className="font-mono text-[9px] font-semibold text-foreground">{data.hours.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-3 py-1 border-t border-success/10 bg-success/5">
                <span className="font-mono text-[8px] text-muted-foreground">{fwFlights} flights</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Simulator */}
      {cats.simulator.flights > 0 && (
        <div className="rounded border border-muted-foreground/20 bg-muted/10 px-3 py-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">🖥 Simulator</span>
            <span className="font-mono text-xs font-semibold text-foreground">{cats.simulator.hours.toFixed(1)} <span className="text-[8px] text-muted-foreground">HRS ({cats.simulator.flights})</span></span>
          </div>
        </div>
      )}

      {/* Game & Cross Country */}
      {(gameTotals.flights > 0 || crossCountryTotals.flights > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {gameTotals.flights > 0 && (
            <div className="flex items-center justify-between rounded border border-accent/20 bg-accent/5 px-3 py-2">
              <p className="font-mono text-[9px] text-accent uppercase tracking-widest">Game</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">{gameTotals.hours.toFixed(1)} <span className="text-muted-foreground font-normal text-[9px]">HRS</span></span>
                <span className="font-mono text-[10px] text-muted-foreground">({gameTotals.flights})</span>
              </div>
            </div>
          )}
          {crossCountryTotals.flights > 0 && (
            <div className="flex items-center justify-between rounded border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="font-mono text-[9px] text-primary uppercase tracking-widest">X-Country</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">{crossCountryTotals.hours.toFixed(1)} <span className="text-muted-foreground font-normal text-[9px]">HRS</span></span>
                <span className="font-mono text-[10px] text-muted-foreground">({crossCountryTotals.flights})</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Bar Graph — Vertical */}
      {(() => {
        const bars = [
          { label: 'Day Dual', value: totals.seDayDual, color: 'from-amber-400 to-amber-500', glow: 'shadow-amber-400/30', icon: <Sun className="h-4 w-4 text-amber-400" /> },
          { label: 'Day PIC', value: totals.seDayPilot, color: 'from-yellow-400 to-yellow-600', glow: 'shadow-yellow-500/30', icon: <Sun className="h-4 w-4 text-yellow-500" /> },
          { label: 'Night Dual', value: totals.seNightDual, color: 'from-indigo-400 to-indigo-600', glow: 'shadow-indigo-400/30', icon: <Moon className="h-4 w-4 text-indigo-400" /> },
          { label: 'Night PIC', value: totals.seNightPilot, color: 'from-violet-400 to-violet-600', glow: 'shadow-violet-500/30', icon: <Moon className="h-4 w-4 text-violet-500" /> },
          { label: 'IFR', value: totals.instrumentTime, color: 'from-cyan-400 to-cyan-600', glow: 'shadow-cyan-400/30', icon: <Gauge className="h-4 w-4 text-cyan-400" /> },
          { label: 'Instructor', value: totalInstruction, color: 'from-emerald-400 to-emerald-600', glow: 'shadow-emerald-400/30', icon: <GraduationCap className="h-4 w-4 text-emerald-400" /> },
        ];
        const maxVal = Math.max(...bars.map(b => b.value), 1);
        const chartHeight = 180;
        return (
          <div className="mb-4">
            <p className="font-mono text-[9px] text-accent uppercase tracking-widest border-b border-border pb-1 mb-4">Hours Breakdown</p>
            <div className="flex items-end justify-between gap-2 px-1" style={{ height: chartHeight }}>
              {bars.map(b => {
                const pct = Math.max((b.value / maxVal) * 100, b.value > 0 ? 4 : 0);
                return (
                  <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="font-mono text-[11px] font-bold text-foreground tabular-nums opacity-80 group-hover:opacity-100 transition-opacity">
                      {b.value > 0 ? b.value.toFixed(1) : '—'}
                    </span>
                    <div
                      className={`w-full max-w-[44px] rounded-t-lg bg-gradient-to-t ${b.color} ${b.glow} shadow-lg transition-all duration-700 ease-out group-hover:scale-x-110 group-hover:brightness-110`}
                      style={{ height: `${pct}%`, minHeight: b.value > 0 ? 6 : 0 }}
                    />
                    <div className="flex flex-col items-center gap-0.5 pt-1 border-t border-border/50 w-full">
                      {b.icon}
                      <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-wide text-center leading-tight">{b.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Quick totals row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total Day', value: totalDay },
          { label: 'Total Night', value: totalNight },
          { label: 'Total Instruction', value: totalInstruction },
        ].map(t => (
          <div key={t.label} className="flex items-center justify-between rounded border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="font-mono text-[9px] text-primary uppercase tracking-widest">{t.label}</p>
            <span className="font-mono text-xs font-semibold text-foreground">{t.value.toFixed(1)} <span className="text-muted-foreground font-normal text-[9px]">HRS</span></span>
          </div>
        ))}
      </div>

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

      {/* Landings Map */}
      <div className="mt-4">
        <LandingsMap entries={entries} />
      </div>
    </div>
  );
}