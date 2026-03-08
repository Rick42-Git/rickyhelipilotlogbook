import { AircraftStation } from '@/data/aircraftData';
import { Input } from '@/components/ui/input';

interface LoadingSheetProps {
  stations: AircraftStation[];
  weights: number[];
  onWeightChange: (index: number, value: number) => void;
  totalWeight: number;
  totalMoment: number;
  maxGrossWeight: number;
}

export function LoadingSheet({ stations, weights, onWeightChange, totalWeight, totalMoment, maxGrossWeight }: LoadingSheetProps) {
  const weightPercent = (totalWeight / maxGrossWeight) * 100;
  return (
    <div className="glass-panel hud-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-accent" />
        <h3 className="font-mono text-xs text-muted-foreground tracking-widest uppercase">Loading Sheet</h3>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_50px_90px] gap-2 mb-2 font-mono text-[10px] text-muted-foreground tracking-widest uppercase px-1">
        <span></span>
        <span className="text-center">Weight</span>
        <span className="text-center">Unit</span>
        <span className="text-right">Moment</span>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {stations.map((s, i) => {
          const moment = weights[i] * s.station;
          return (
            <div key={i} className="grid grid-cols-[1fr_100px_50px_90px] gap-2 items-center px-1 py-1.5 rounded hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${weights[i] > 0 ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                <div className="min-w-0">
                  <span className="font-mono text-xs text-foreground truncate block">{s.label}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">STA {s.station}"</span>
                </div>
              </div>
              <div>
                {s.editable ? (
                  <Input
                    type="number"
                    min={0}
                    value={weights[i] || ''}
                    onChange={(e) => onWeightChange(i, Number(e.target.value) || 0)}
                    className="h-8 text-center font-mono text-xs bg-background/50 border-muted"
                  />
                ) : (
                  <div className="font-mono text-xs text-center text-primary font-semibold">{weights[i].toLocaleString()}</div>
                )}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground text-center">lbs</div>
              <div className="font-mono text-xs text-right text-primary">{Math.round(moment).toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="grid grid-cols-[1fr_100px_50px_90px] gap-2 items-center mt-3 px-1 py-2 bg-primary/10 border border-primary/20 rounded">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="font-mono text-sm font-bold text-primary">TOTAL</span>
        </div>
        <div className="font-mono text-sm text-center font-bold text-primary">{totalWeight.toLocaleString()}</div>
        <div className="font-mono text-[10px] text-muted-foreground text-center">lbs</div>
        <div className="font-mono text-sm text-right font-bold text-primary">{Math.round(totalMoment).toLocaleString()}</div>
      </div>

      {/* Gross Weight Bar */}
      <div className="mt-3 px-1">
        <div className="flex justify-between font-mono text-[10px] text-muted-foreground mb-2 tracking-wider">
          <span>GROSS WEIGHT</span>
          <span>{totalWeight.toLocaleString()} / {maxGrossWeight.toLocaleString()} lbs</span>
        </div>
        <div className="relative h-3 rounded-full bg-muted/30 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              weightPercent > 100 ? 'bg-destructive' : weightPercent > 85 ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(weightPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between font-mono text-[9px] text-muted-foreground/50 mt-1">
          <span>0</span>
          <span>{Math.round(maxGrossWeight / 2).toLocaleString()}</span>
          <span>{maxGrossWeight.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
