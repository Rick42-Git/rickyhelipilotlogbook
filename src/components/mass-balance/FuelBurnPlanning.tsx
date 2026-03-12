import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';

interface FuelBurnPlanningProps {
  currentWeights: number[];
  stations: { label: string; station: number; buttline: number; defaultWeight: number; editable: boolean }[];
  fuelStationIndex: number;
  fuelWeightPerUnit: number;
  maxGrossWeight: number;
  cgEnvelope: { station: number; weight: number }[];
  lateralCGLimit: number;
  isPointInPolygon: (px: number, py: number, polygon: { station: number; weight: number }[]) => boolean;
}

export function FuelBurnPlanning({
  currentWeights,
  stations,
  fuelStationIndex,
  fuelWeightPerUnit,
  maxGrossWeight,
  cgEnvelope,
  lateralCGLimit,
  isPointInPolygon,
}: FuelBurnPlanningProps) {
  const [enabled, setEnabled] = useState(false);
  const [burnRate, setBurnRate] = useState(30);
  const [flightTime, setFlightTime] = useState(2);

  const burnSteps = useMemo(() => {
    if (!enabled) return [];
    const steps = [];
    const currentFuel = currentWeights[fuelStationIndex];
    const intervals = Math.min(Math.ceil(flightTime * 2), 10);

    for (let i = 0; i <= intervals; i++) {
      const elapsed = (flightTime / intervals) * i;
      const fuelBurned = Math.min(burnRate * elapsed, currentFuel);
      const remainingFuel = currentFuel - fuelBurned;

      let tw = 0, tm = 0, latMom = 0;
      stations.forEach((s, idx) => {
        const w = idx === fuelStationIndex ? remainingFuel : currentWeights[idx];
        tw += w;
        tm += w * s.station;
        latMom += w * s.buttline;
      });
      const cg = tw > 0 ? tm / tw : 0;
      const latCG = tw > 0 ? latMom / tw : 0;
      const longOk = tw <= maxGrossWeight && isPointInPolygon(cg, tw, cgEnvelope);
      const latOk = Math.abs(latCG) <= lateralCGLimit;

      steps.push({
        time: elapsed,
        fuelRemaining: Math.round(remainingFuel),
        weight: Math.round(tw),
        cg,
        latCG,
        withinLimits: longOk && latOk,
        latOk,
      });
    }
    return steps;
  }, [enabled, burnRate, flightTime, currentWeights, fuelStationIndex, stations, maxGrossWeight, cgEnvelope, lateralCGLimit, isPointInPolygon]);

  return (
    <div className="glass-panel hud-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-accent" />
          <h3 className="font-mono text-xs text-muted-foreground tracking-widest uppercase">Fuel Burn Planning</h3>
        </div>
        <Button
          variant={enabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => setEnabled(!enabled)}
          className="font-mono text-[10px] h-7 gap-1"
        >
          <Sparkles className="h-3 w-3" />
          {enabled ? 'ENABLED' : 'ENABLE'}
        </Button>
      </div>

      {!enabled && (
        <p className="font-mono text-[10px] text-muted-foreground">
          Enable to see CG shift during flight as fuel burns off
        </p>
      )}

      {enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase block mb-1">Burn Rate (lbs/hr)</label>
              <Input
                type="number"
                min={1}
                value={burnRate}
                onChange={(e) => setBurnRate(Number(e.target.value) || 1)}
                className="h-8 text-center font-mono text-xs bg-background/50 border-muted"
              />
            </div>
            <div>
              <label className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase block mb-1">Flight Time (hrs)</label>
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={flightTime}
                onChange={(e) => setFlightTime(Number(e.target.value) || 0.5)}
                className="h-8 text-center font-mono text-xs bg-background/50 border-muted"
              />
            </div>
          </div>

          {/* Burn table */}
          <div className="space-y-0.5">
            <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_36px] gap-1 font-mono text-[9px] text-muted-foreground tracking-widest uppercase px-1 mb-1">
              <span>Time</span>
              <span className="text-center">Fuel</span>
              <span className="text-center">Weight</span>
              <span className="text-center">Long CG</span>
              <span className="text-center">Lat CG</span>
              <span className="text-center">OK</span>
            </div>
            {burnSteps.map((step, i) => (
              <div key={i} className={`grid grid-cols-[50px_1fr_1fr_1fr_1fr_36px] gap-1 items-center px-1 py-1 rounded text-xs font-mono ${
                !step.withinLimits ? 'bg-destructive/10' : i === 0 ? 'bg-primary/5' : ''
              }`}>
                <span className="text-muted-foreground">{step.time.toFixed(1)}h</span>
                <span className="text-center">{step.fuelRemaining}</span>
                <span className="text-center">{step.weight.toLocaleString()}</span>
                <span className="text-center">{step.cg.toFixed(1)}"</span>
                <span className={`text-center ${!step.latOk ? 'text-destructive' : ''}`}>{step.latCG.toFixed(2)}"</span>
                <span className={`text-center ${step.withinLimits ? 'text-primary' : 'text-destructive'}`}>
                  {step.withinLimits ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
