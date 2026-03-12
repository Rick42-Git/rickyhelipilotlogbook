interface ResultsPanelProps {
  withinLimits: boolean;
  cgStation: number;
  lateralCG: number;
  lateralWithinLimits: boolean;
  lateralCGLimit: number;
  weightMargin: number;
  grossWeight: number;
  maxGrossWeight: number;
  totalMoment: number;
}

export function ResultsPanel({ withinLimits, cgStation, lateralCG, lateralWithinLimits, lateralCGLimit, weightMargin, grossWeight, maxGrossWeight, totalMoment }: ResultsPanelProps) {
  const lateralDirection = lateralCG < -0.1 ? 'LEFT' : lateralCG > 0.1 ? 'RIGHT' : 'CENTER';

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className={`glass-panel hud-border p-4 text-center ${withinLimits ? '' : 'border-destructive/50'}`}>
        <div className={`font-mono text-lg md:text-xl font-bold tracking-wider flex items-center justify-center gap-2 ${withinLimits ? 'text-success' : 'text-destructive'}`}>
          <span className={`w-2 h-2 rounded-full ${withinLimits ? 'bg-success animate-pulse' : 'bg-destructive animate-pulse'}`} />
          {withinLimits ? 'WITHIN LIMITS' : 'OUTSIDE LIMITS'}
          <span className={`w-2 h-2 rounded-full ${withinLimits ? 'bg-success animate-pulse' : 'bg-destructive animate-pulse'}`} />
        </div>
        {!lateralWithinLimits && (
          <div className="font-mono text-xs text-destructive mt-1 tracking-wider">
            ⚠ LATERAL CG EXCEEDS LIMIT
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel hud-border p-3 text-center">
          <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-1">Long. CG</div>
          <div className="font-mono text-xl font-bold text-foreground">
            {cgStation.toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">in</span>
          </div>
        </div>
        <div className={`glass-panel hud-border p-3 text-center ${!lateralWithinLimits ? 'border-destructive/50' : ''}`}>
          <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-1">Lat. CG</div>
          <div className={`font-mono text-xl font-bold ${lateralWithinLimits ? 'text-foreground' : 'text-destructive'}`}>
            {lateralCG >= 0 ? '+' : ''}{lateralCG.toFixed(2)}<span className="text-xs text-muted-foreground ml-0.5">in</span>
          </div>
          <div className={`font-mono text-[8px] mt-0.5 tracking-wider ${lateralWithinLimits ? 'text-muted-foreground' : 'text-destructive'}`}>
            {lateralDirection} · ±{lateralCGLimit}" MAX
          </div>
        </div>
        <div className="glass-panel hud-border p-3 text-center">
          <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-1">Weight Margin</div>
          <div className={`font-mono text-xl font-bold ${weightMargin >= 0 ? 'text-success' : 'text-destructive'}`}>
            {weightMargin >= 0 ? '+' : ''}{weightMargin.toLocaleString()}<span className="text-xs text-muted-foreground ml-0.5">lb</span>
          </div>
        </div>
        <div className="glass-panel hud-border p-3 text-center">
          <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-1">Gross Weight</div>
          <div className="font-mono text-xl font-bold text-foreground">
            {grossWeight.toLocaleString()}<span className="text-xs text-muted-foreground ml-0.5">lb</span>
          </div>
        </div>
        <div className="glass-panel hud-border p-3 text-center col-span-2">
          <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-1">Total Moment</div>
          <div className="font-mono text-xl font-bold text-foreground">
            {(totalMoment / 1000).toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">k</span>
          </div>
        </div>
      </div>
    </div>
  );
}
