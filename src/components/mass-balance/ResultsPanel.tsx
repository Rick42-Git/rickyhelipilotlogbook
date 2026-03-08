interface ResultsPanelProps {
  withinLimits: boolean;
  cgStation: number;
  weightMargin: number;
  grossWeight: number;
  maxGrossWeight: number;
  totalMoment: number;
}

export function ResultsPanel({ withinLimits, cgStation, weightMargin, grossWeight, maxGrossWeight, totalMoment }: ResultsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Status */}
      <div className={`glass-panel hud-border p-4 text-center ${withinLimits ? '' : 'border-destructive/50'}`}>
        <div className={`font-mono text-lg md:text-xl font-bold tracking-wider flex items-center justify-center gap-2 ${withinLimits ? 'text-primary' : 'text-destructive'}`}>
          <span className={`w-2 h-2 rounded-full ${withinLimits ? 'bg-primary animate-pulse' : 'bg-destructive animate-pulse'}`} />
          {withinLimits ? 'WITHIN LIMITS' : 'OUTSIDE LIMITS'}
          <span className={`w-2 h-2 rounded-full ${withinLimits ? 'bg-primary animate-pulse' : 'bg-destructive animate-pulse'}`} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel hud-border p-3 text-center">
          <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-1">CG Station</div>
          <div className="font-mono text-xl font-bold text-foreground">
            {cgStation.toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">in</span>
          </div>
        </div>
        <div className="glass-panel hud-border p-3 text-center">
          <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-1">Weight Margin</div>
          <div className={`font-mono text-xl font-bold ${weightMargin >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {weightMargin >= 0 ? '+' : ''}{weightMargin.toLocaleString()}<span className="text-xs text-muted-foreground ml-0.5">lb</span>
          </div>
        </div>
        <div className="glass-panel hud-border p-3 text-center">
          <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-1">Gross Weight</div>
          <div className="font-mono text-xl font-bold text-foreground">
            {grossWeight.toLocaleString()}<span className="text-xs text-muted-foreground ml-0.5">lb</span>
          </div>
        </div>
        <div className="glass-panel hud-border p-3 text-center">
          <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mb-1">Total Moment</div>
          <div className="font-mono text-xl font-bold text-foreground">
            {(totalMoment / 1000).toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">k</span>
          </div>
        </div>
      </div>
    </div>
  );
}
