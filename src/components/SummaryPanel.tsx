import { numericFieldLabels, NumericField } from '@/types/logbook';

interface SummaryPanelProps {
  totals: Record<NumericField, number>;
  entryCount: number;
}

export function SummaryPanel({ totals, entryCount }: SummaryPanelProps) {
  // Group totals for cleaner display
  const groups = [
    { title: 'Single Engine — Day', fields: ['seDayDual', 'seDayPilot'] as NumericField[] },
    { title: 'Single Engine — Night', fields: ['seNightDual', 'seNightPilot'] as NumericField[] },
    { title: 'Multi Engine — Day', fields: ['meDayDual', 'meDayPilot', 'meDayCoPilot'] as NumericField[] },
    { title: 'Multi Engine — Night', fields: ['meNightDual', 'meNightPilot', 'meNightCoPilot'] as NumericField[] },
    { title: 'Instrument', fields: ['instrumentNavAids', 'instrumentPlace', 'instrumentTime'] as NumericField[] },
    { title: 'Instructor', fields: ['instructorDay', 'instructorNight'] as NumericField[] },
  ];

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <div className="glass-panel p-5 glow-amber">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs text-primary uppercase tracking-widest">▸ Flight Totals</h2>
        <div className="font-mono text-xs text-muted-foreground">
          {entryCount} FLIGHTS — <span className="text-primary font-bold">{grandTotal.toFixed(1)}</span> HRS TOTAL
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {groups.map(g => (
          <div key={g.title} className="space-y-1">
            <p className="font-mono text-[9px] text-accent uppercase tracking-widest border-b border-border pb-1">{g.title}</p>
            {g.fields.map(f => (
              <div key={f} className="flex justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">{numericFieldLabels[f].replace(/^(SE |ME |Instr |Instructor )/, '')}</span>
                <span className="font-mono text-xs font-semibold text-foreground">{totals[f].toFixed(1)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
