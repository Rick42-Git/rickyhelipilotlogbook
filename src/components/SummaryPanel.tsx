import { numericFieldLabels, NumericField } from '@/types/logbook';

interface SummaryPanelProps {
  totals: Record<NumericField, number>;
  entryCount: number;
}

export function SummaryPanel({ totals, entryCount }: SummaryPanelProps) {
  const groups = [
    { title: 'Single Engine — Day', fields: ['seDayDual', 'seDayPilot'] as NumericField[] },
    { title: 'Single Engine — Night', fields: ['seNightDual', 'seNightPilot'] as NumericField[] },
    { title: 'Instrument', fields: ['instrumentNavAids', 'instrumentPlace', 'instrumentTime'] as NumericField[] },
    { title: 'Instructor', fields: ['instructorDay', 'instructorNight'] as NumericField[] },
  ];

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <div className="glass-panel p-5 glow-amber">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs text-primary uppercase tracking-widest">▸ Flight Totals</h2>
        <div className="font-mono text-xs text-muted-foreground">
          {entryCount} FLIGHTS
        </div>
      </div>
      <div className="flex items-center justify-center mb-4 py-3 rounded border border-primary/20 bg-primary/5">
        <div className="text-center">
          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.3em] mb-1">Total Flight Hours</p>
          <span className="font-mono text-3xl font-bold text-primary tracking-wider drop-shadow-[0_0_10px_hsl(38_95%_55%/0.4)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {grandTotal.toFixed(1)}
          </span>
          <span className="font-mono text-xs text-primary/70 ml-1.5 uppercase tracking-widest">HRS</span>
        </div>
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
    </div>
  );
}
