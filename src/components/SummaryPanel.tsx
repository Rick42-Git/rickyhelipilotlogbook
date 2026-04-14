import { useMemo, useState } from 'react';
import { LogbookEntry, numericFieldLabels, NumericField } from '@/types/logbook';
import { normalizeAircraftType } from '@/lib/normalizeAircraftType';
import { classifyAircraft, AircraftCategory, CATEGORY_LABELS } from '@/lib/aircraftCategories';
import { LandingsMap } from '@/components/LandingsMap';
import { Sun, Moon, Gauge, GraduationCap, ChevronRight, X } from 'lucide-react';

interface SummaryPanelProps {
  totals: Record<NumericField, number>;
  entryCount: number;
  entries: LogbookEntry[];
}

function getEntryHours(e: LogbookEntry) {
  return (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
}

/**
 * Normalize aircraft registrations so variants like "RLU", "ZS-RLU", "ZS RLU", "ZSRLU"
 * all resolve to the same canonical form (e.g. "ZS-RLU").
 * Extracts the last 3+ letter suffix, groups by it, and picks the longest/most formal form.
 */
function normalizeRegistration(raw: string, allRegs: string[]): string {
  const upper = raw.toUpperCase().trim();
  if (upper.length < 3) return upper;

  // Strip separators to get core letters
  const stripped = upper.replace(/[\s\-./]/g, '');

  // Extract suffix: last 3 chars (the unique identifier part)
  const suffix = stripped.length >= 3 ? stripped.slice(-3) : stripped;

  // Find all registrations in the set that share this suffix
  const matches = allRegs.filter(r => {
    const s = r.toUpperCase().replace(/[\s\-./]/g, '');
    return s.length >= 3 && s.slice(-3) === suffix;
  });

  if (matches.length <= 1) return upper;

  // Pick the canonical form: prefer the longest variant with a dash (e.g. "ZS-RLU")
  const canonical = matches
    .map(r => r.toUpperCase().trim())
    .sort((a, b) => {
      const aDash = a.includes('-') ? 1 : 0;
      const bDash = b.includes('-') ? 1 : 0;
      if (aDash !== bDash) return bDash - aDash;
      return b.length - a.length;
    })[0];

  return canonical;
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

  // Collect all raw regs for normalization lookup
  const allRegs = entries.map(e => (e.aircraftReg || 'Unknown'));

  const regByType: Record<string, Record<string, { hours: number; flights: number }>> = {};

  for (const e of entries) {
    const type = normalizeAircraftType(e.aircraftType || 'Unknown');
    const cat = classifyAircraft(type);
    const hrs = getEntryHours(e);
    const reg = normalizeRegistration(e.aircraftReg || 'Unknown', allRegs);
    cats[cat].hours += hrs;
    cats[cat].flights += 1;
    if (!typeByCat[cat][type]) typeByCat[cat][type] = { hours: 0, flights: 0 };
    typeByCat[cat][type].hours += hrs;
    typeByCat[cat][type].flights += 1;
    if (!regByType[type]) regByType[type] = {};
    if (!regByType[type][reg]) regByType[type][reg] = { hours: 0, flights: 0 };
    regByType[type][reg].hours += hrs;
    regByType[type][reg].flights += 1;
  }

  return { cats, typeByCat, regByType };
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

function TypeRow({ type, data, regByType, expandedType, setExpandedType }: {
  type: string; data: { hours: number; flights: number };
  regByType: Record<string, Record<string, { hours: number; flights: number }>>;
  expandedType: string | null; setExpandedType: (t: string | null) => void;
}) {
  const isExpanded = expandedType === type;
  const regs = regByType[type] || {};
  const hasMultipleRegs = Object.keys(regs).length > 1;
  return (
    <div>
      <div
        className={`flex items-center justify-between cursor-pointer rounded px-1 -mx-1 transition-colors ${isExpanded ? 'bg-primary/10' : 'hover:bg-muted/30'}`}
        onClick={() => setExpandedType(isExpanded ? null : type)}
      >
        <span className="font-mono text-[9px] text-muted-foreground inline-flex items-center gap-1">
          {hasMultipleRegs && <ChevronRight className={`h-2.5 w-2.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
          {type || '(empty)'}
        </span>
        <span className="font-mono text-[9px] font-semibold text-foreground">{data.hours.toFixed(1)}</span>
      </div>
      {isExpanded && (
        <div className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l-2 border-primary/20 pl-2">
          {Object.entries(regs).sort((a, b) => b[1].hours - a[1].hours).map(([reg, rd]) => (
            <div key={reg} className="flex items-center justify-between">
              <span className="font-mono text-[8px] text-accent">{reg}</span>
              <span className="font-mono text-[8px] text-muted-foreground">{rd.hours.toFixed(1)}h <span className="opacity-60">({rd.flights})</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  const { cats, typeByCat, regByType } = useMemo(() => getCategoryTotals(entries), [entries]);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<string | null>(null);
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
                          <TypeRow key={type} type={type} data={data} regByType={regByType} expandedType={expandedType} setExpandedType={setExpandedType} />
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
                          <TypeRow key={type} type={type} data={data} regByType={regByType} expandedType={expandedType} setExpandedType={setExpandedType} />
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
                          <TypeRow key={type} type={type} data={data} regByType={regByType} expandedType={expandedType} setExpandedType={setExpandedType} />
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
                          <TypeRow key={type} type={type} data={data} regByType={regByType} expandedType={expandedType} setExpandedType={setExpandedType} />
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
                          <TypeRow key={type} type={type} data={data} regByType={regByType} expandedType={expandedType} setExpandedType={setExpandedType} />
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
                          <TypeRow key={type} type={type} data={data} regByType={regByType} expandedType={expandedType} setExpandedType={setExpandedType} />
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
                          <TypeRow key={type} type={type} data={data} regByType={regByType} expandedType={expandedType} setExpandedType={setExpandedType} />
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
        const barDefs = [
          { label: 'Day Dual', key: 'seDayDual', value: totals.seDayDual, color: 'from-amber-400 to-amber-500', glow: 'shadow-amber-400/30', fill: '#fbbf24', icon: <Sun className="h-4 w-4 text-amber-400" /> },
          { label: 'Day PIC', key: 'seDayPilot', value: totals.seDayPilot, color: 'from-yellow-400 to-yellow-600', glow: 'shadow-yellow-500/30', fill: '#eab308', icon: <Sun className="h-4 w-4 text-yellow-500" /> },
          { label: 'Night Dual', key: 'seNightDual', value: totals.seNightDual, color: 'from-indigo-400 to-indigo-600', glow: 'shadow-indigo-400/30', fill: '#818cf8', icon: <Moon className="h-4 w-4 text-indigo-400" /> },
          { label: 'Night PIC', key: 'seNightPilot', value: totals.seNightPilot, color: 'from-violet-400 to-violet-600', glow: 'shadow-violet-500/30', fill: '#8b5cf6', icon: <Moon className="h-4 w-4 text-violet-500" /> },
          { label: 'IFR', key: 'instrumentTime', value: totals.instrumentTime, color: 'from-cyan-400 to-cyan-600', glow: 'shadow-cyan-400/30', fill: '#22d3ee', icon: <Gauge className="h-4 w-4 text-cyan-400" /> },
          { label: 'Instructor', key: 'instructor', value: totalInstruction, color: 'from-emerald-400 to-emerald-600', glow: 'shadow-emerald-400/30', fill: '#34d399', icon: <GraduationCap className="h-4 w-4 text-emerald-400" /> },
        ];
        const maxVal = Math.max(...barDefs.map(b => b.value), 1);
        const chartHeight = 180;

        // Compute pie data for selected breakdown
        const selectedBar = selectedBreakdown ? barDefs.find(b => b.key === selectedBreakdown) : null;
        let pieData: { label: string; hours: number; color: string }[] = [];

        if (selectedBreakdown && selectedBar) {
          const getHoursForKey = (e: LogbookEntry, key: string): number => {
            if (key === 'seDayDual') return e.seDayDual || 0;
            if (key === 'seDayPilot') return e.seDayPilot || 0;
            if (key === 'seNightDual') return e.seNightDual || 0;
            if (key === 'seNightPilot') return e.seNightPilot || 0;
            if (key === 'instrumentTime') return e.instrumentTime || 0;
            if (key === 'instructor') return (e.instructorDay || 0) + (e.instructorNight || 0);
            return 0;
          };

          // Normalize detail strings for grouping
          const normalizeDetail = (d: string) => {
            return d.trim().toLowerCase()
              .replace(/\s+/g, ' ')
              .replace(/[→\->]+/g, '→')
              .replace(/\b(post|pre)\s+/gi, '$1 ')
              .replace(/\bflight\b/gi, '')
              .replace(/\s+/g, ' ')
              .trim();
          };

          const grouped: Record<string, { label: string; hours: number }> = {};
          for (const e of entries) {
            const hrs = getHoursForKey(e, selectedBreakdown);
            if (hrs <= 0) continue;
            const raw = (e.flightDetails || 'Unspecified').trim();
            const key = normalizeDetail(raw) || 'unspecified';
            if (!grouped[key]) grouped[key] = { label: raw || 'Unspecified', hours: 0 };
            grouped[key].hours += hrs;
          }

          const PIE_COLORS = [
            '#fbbf24', '#818cf8', '#34d399', '#f87171', '#a78bfa',
            '#22d3ee', '#fb923c', '#e879f9', '#38bdf8', '#4ade80',
            '#f472b6', '#facc15', '#94a3b8',
          ];

          pieData = Object.values(grouped)
            .sort((a, b) => b.hours - a.hours)
            .map((item, i) => ({
              ...item,
              color: PIE_COLORS[i % PIE_COLORS.length],
            }));

          // Collapse small slices into "Other"
          if (pieData.length > 8) {
            const top7 = pieData.slice(0, 7);
            const rest = pieData.slice(7);
            const otherHours = rest.reduce((s, d) => s + d.hours, 0);
            pieData = [...top7, { label: `Other (${rest.length})`, hours: otherHours, color: '#64748b' }];
          }
        }

        // SVG pie chart helper
        const renderPie = (data: typeof pieData, size: number) => {
          const total = data.reduce((s, d) => s + d.hours, 0);
          if (total === 0) return null;
          const cx = size / 2, cy = size / 2, r = size / 2 - 2;
          let cumAngle = -Math.PI / 2;
          const paths = data.map((d, i) => {
            const angle = (d.hours / total) * 2 * Math.PI;
            const x1 = cx + r * Math.cos(cumAngle);
            const y1 = cy + r * Math.sin(cumAngle);
            cumAngle += angle;
            const x2 = cx + r * Math.cos(cumAngle);
            const y2 = cy + r * Math.sin(cumAngle);
            const large = angle > Math.PI ? 1 : 0;
            if (data.length === 1) {
              return <circle key={i} cx={cx} cy={cy} r={r} fill={d.color} opacity={0.85} />;
            }
            return (
              <path
                key={i}
                d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
                fill={d.color}
                opacity={0.85}
                stroke="hsl(var(--card))"
                strokeWidth={1.5}
              />
            );
          });
          return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{paths}</svg>;
        };

        return (
          <div className="mb-4">
            <div className="flex items-center justify-between border-b border-border pb-1 mb-4">
              <p className="font-mono text-[9px] text-accent uppercase tracking-widest">Hours Breakdown</p>
              {selectedBreakdown && (
                <button
                  onClick={() => setSelectedBreakdown(null)}
                  className="font-mono text-[8px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                >
                  <X className="h-3 w-3" /> CLOSE
                </button>
              )}
            </div>
            <div className="flex items-end justify-between gap-2 px-1" style={{ height: chartHeight }}>
              {barDefs.map(b => {
                const pct = Math.max((b.value / maxVal) * 100, b.value > 0 ? 4 : 0);
                const isSelected = selectedBreakdown === b.key;
                return (
                  <div
                    key={b.label}
                    className={`flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer transition-opacity ${
                      selectedBreakdown && !isSelected ? 'opacity-40' : ''
                    }`}
                    onClick={() => setSelectedBreakdown(isSelected ? null : b.key)}
                  >
                    <span className="font-mono text-[11px] font-bold text-foreground tabular-nums opacity-80 group-hover:opacity-100 transition-opacity">
                      {b.value > 0 ? b.value.toFixed(1) : '—'}
                    </span>
                    <div
                      className={`w-full max-w-[44px] rounded-t-lg bg-gradient-to-t ${b.color} ${b.glow} shadow-lg transition-all duration-700 ease-out group-hover:scale-x-110 group-hover:brightness-110 ${
                        isSelected ? 'ring-2 ring-foreground/30 scale-x-110' : ''
                      }`}
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

            {/* Pie chart panel */}
            {selectedBar && pieData.length > 0 && (
              <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="font-mono text-[9px] text-foreground uppercase tracking-widest mb-3 text-center">
                  {selectedBar.label} — by Flight Details
                </p>
                <div className="flex gap-4 items-start">
                  <div className="shrink-0">
                    {renderPie(pieData, 120)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    {pieData.map((d, i) => {
                      const total = pieData.reduce((s, x) => s + x.hours, 0);
                      const pctVal = total > 0 ? ((d.hours / total) * 100).toFixed(0) : '0';
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="font-mono text-[9px] text-muted-foreground truncate flex-1 min-w-0">{d.label}</span>
                          <span className="font-mono text-[9px] font-semibold text-foreground tabular-nums shrink-0">{d.hours.toFixed(1)}</span>
                          <span className="font-mono text-[8px] text-muted-foreground tabular-nums shrink-0 w-7 text-right">{pctVal}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
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