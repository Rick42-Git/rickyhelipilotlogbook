import { AircraftStation } from '@/data/aircraftData';

interface LateralCGChartProps {
  lateralCG: number;
  lateralCGLimit: number;
  stations: AircraftStation[];
  weights: number[];
}

export function LateralCGChart({ lateralCG, lateralCGLimit, stations, weights }: LateralCGChartProps) {
  const withinLimits = Math.abs(lateralCG) <= lateralCGLimit;
  const maxRange = lateralCGLimit * 2; // chart range
  const W = 280;
  const centerX = W / 2;
  
  const cgToX = (val: number) => centerX + (val / maxRange) * W;
  const limitLeftX = cgToX(-lateralCGLimit);
  const limitRightX = cgToX(lateralCGLimit);
  const cgX = cgToX(lateralCG);

  // Collect individual lateral contributions for visualization
  const lateralLoads = stations
    .map((s, i) => ({ label: s.label, buttline: s.buttline, weight: weights[i], moment: weights[i] * s.buttline }))
    .filter(l => l.buttline !== 0 && l.weight > 0);

  return (
    <div className="glass-panel hud-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-accent" />
        <h3 className="font-mono text-xs text-muted-foreground tracking-widest uppercase">Lateral CG</h3>
      </div>

      <svg viewBox={`0 0 ${W} 120`} className="w-full" style={{ maxHeight: 140 }}>
        {/* Background */}
        <rect x={limitLeftX} y="20" width={limitRightX - limitLeftX} height="50" rx="4" fill="hsl(var(--success) / 0.1)" stroke="hsl(var(--success))" strokeWidth="1" strokeDasharray="4,3" />

        {/* Center line */}
        <line x1={centerX} y1="15" x2={centerX} y2="80" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="2,3" strokeOpacity="0.5" />

        {/* Limit markers */}
        <line x1={limitLeftX} y1="15" x2={limitLeftX} y2="80" stroke="hsl(var(--success))" strokeWidth="1.5" />
        <line x1={limitRightX} y1="15" x2={limitRightX} y2="80" stroke="hsl(var(--success))" strokeWidth="1.5" />

        {/* Labels */}
        <text x={centerX} y="12" fill="hsl(var(--muted-foreground))" fontSize="8" textAnchor="middle" fontFamily="monospace">CL</text>
        <text x={limitLeftX} y="12" fill="hsl(var(--success))" fontSize="7" textAnchor="middle" fontFamily="monospace">-{lateralCGLimit}"</text>
        <text x={limitRightX} y="12" fill="hsl(var(--success))" fontSize="7" textAnchor="middle" fontFamily="monospace">+{lateralCGLimit}"</text>

        {/* CG indicator */}
        <circle
          cx={Math.max(10, Math.min(W - 10, cgX))}
          cy="45"
          r="6"
          fill={withinLimits ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
          stroke="hsl(var(--background))"
          strokeWidth="2"
        />
        <text
          x={Math.max(10, Math.min(W - 10, cgX))}
          y="62"
          fill={withinLimits ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
          fontSize="9"
          textAnchor="middle"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {lateralCG >= 0 ? '+' : ''}{lateralCG.toFixed(2)}"
        </text>

        {/* Side labels */}
        <text x="8" y="48" fill="hsl(var(--muted-foreground))" fontSize="7" fontFamily="monospace" opacity="0.5">LEFT</text>
        <text x={W - 8} y="48" fill="hsl(var(--muted-foreground))" fontSize="7" fontFamily="monospace" textAnchor="end" opacity="0.5">RIGHT</text>

        {/* Individual load indicators */}
        {lateralLoads.map((load, i) => {
          const lx = Math.max(10, Math.min(W - 10, cgToX(load.buttline)));
          return (
            <g key={i}>
              <line x1={lx} y1="72" x2={lx} y2="78" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.6" />
              <text x={lx} y="86" fill="hsl(var(--muted-foreground))" fontSize="6" textAnchor="middle" fontFamily="monospace" opacity="0.7">
                {load.label.split(' ')[0]}
              </text>
              <text x={lx} y="93" fill="hsl(var(--primary))" fontSize="7" textAnchor="middle" fontFamily="monospace">
                {load.weight}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Lateral balance summary */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="font-mono text-[9px] text-muted-foreground tracking-wider">
          LEFT MOMENT: <span className="text-accent">{Math.abs(Math.round(lateralLoads.filter(l => l.buttline < 0).reduce((sum, l) => sum + l.moment, 0))).toLocaleString()}</span>
        </div>
        <div className={`font-mono text-[10px] font-bold tracking-wider ${withinLimits ? 'text-success' : 'text-destructive'}`}>
          {withinLimits ? '● IN LIMITS' : '● OUT OF LIMITS'}
        </div>
        <div className="font-mono text-[9px] text-muted-foreground tracking-wider">
          RIGHT MOMENT: <span className="text-primary">{Math.abs(Math.round(lateralLoads.filter(l => l.buttline > 0).reduce((sum, l) => sum + l.moment, 0))).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
