import { numericFieldLabels, NumericField } from '@/types/logbook';

interface SummaryPanelProps {
  totals: Record<NumericField, number>;
  entryCount: number;
}

export function SummaryPanel({ totals, entryCount }: SummaryPanelProps) {
  return (
    <div className="glass-panel p-5 glow-amber">
      <h2 className="font-mono text-xs text-primary uppercase tracking-widest mb-4">▸ Flight Totals</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.entries(numericFieldLabels) as [NumericField, string][]).map(([key, label]) => (
          <div key={key} className="text-center">
            <p className="font-mono text-2xl font-bold text-foreground">
              {key === 'landings' ? totals[key] : totals[key].toFixed(1)}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border text-center">
        <span className="font-mono text-xs text-muted-foreground">{entryCount} FLIGHTS LOGGED</span>
      </div>
    </div>
  );
}
