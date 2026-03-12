import { useState } from 'react';
import { LogbookEntry, NumericField } from '@/types/logbook';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Last12MonthSummaryProps {
  entries: LogbookEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Last12MonthSummary({ entries, open, onOpenChange }: Last12MonthSummaryProps) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const cutoff = twelveMonthsAgo.toISOString().slice(0, 10);

  const filtered = entries.filter(e => e.date >= cutoff);

  const totalDual = filtered.reduce((s, e) => s + (e.seDayDual || 0) + (e.seNightDual || 0), 0);
  const totalPilot = filtered.reduce((s, e) => s + (e.seDayPilot || 0) + (e.seNightPilot || 0), 0);
  const totalInstrument = filtered.reduce((s, e) => s + (e.instrumentTime || 0), 0);
  const totalInstructor = filtered.reduce((s, e) => s + (e.instructorDay || 0) + (e.instructorNight || 0), 0);
  const grandTotal = totalDual + totalPilot;

  const breakdowns = [
    {
      title: 'Single Engine — Day',
      rows: [
        { label: 'Dual', value: filtered.reduce((s, e) => s + (e.seDayDual || 0), 0) },
        { label: 'Pilot', value: filtered.reduce((s, e) => s + (e.seDayPilot || 0), 0) },
      ],
    },
    {
      title: 'Single Engine — Night',
      rows: [
        { label: 'Dual', value: filtered.reduce((s, e) => s + (e.seNightDual || 0), 0) },
        { label: 'Pilot', value: filtered.reduce((s, e) => s + (e.seNightPilot || 0), 0) },
      ],
    },
    {
      title: 'Instrument Flying',
      rows: [
        { label: 'Time', value: filtered.reduce((s, e) => s + (e.instrumentTime || 0), 0) },
      ],
    },
    {
      title: 'Flying as Instructor',
      rows: [
        { label: 'Day', value: filtered.reduce((s, e) => s + (e.instructorDay || 0), 0) },
        { label: 'Night', value: filtered.reduce((s, e) => s + (e.instructorNight || 0), 0) },
      ],
    },
  ];

  // Per-type breakdown
  const typeMap: Record<string, { hours: number; flights: number }> = {};
  for (const e of filtered) {
    const type = e.aircraftType || 'Unknown';
    if (!typeMap[type]) typeMap[type] = { hours: 0, flights: 0 };
    typeMap[type].flights += 1;
    typeMap[type].hours += (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
  }
  const typeTotals = Object.entries(typeMap).sort((a, b) => b[1].hours - a[1].hours);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass-panel max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary">▸ LAST 12 MONTHS SUMMARY</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Grand totals */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded border border-border bg-muted/20">
              <p className="font-mono text-2xl font-bold text-primary">{grandTotal.toFixed(1)}</p>
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Total Hours</p>
            </div>
            <div className="text-center p-3 rounded border border-border bg-muted/20">
              <p className="font-mono text-2xl font-bold text-foreground">{totalDual.toFixed(1)}</p>
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Total Dual</p>
            </div>
            <div className="text-center p-3 rounded border border-border bg-muted/20">
              <p className="font-mono text-2xl font-bold text-foreground">{totalPilot.toFixed(1)}</p>
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Total Pilot</p>
            </div>
          </div>

          <p className="font-mono text-[10px] text-muted-foreground text-center">
            {filtered.length} flights from {cutoff} to {now.toISOString().slice(0, 10)}
          </p>

          {/* Per-type breakdown */}
          {typeTotals.length > 0 && (
            <div>
              <p className="font-mono text-[9px] text-accent uppercase tracking-widest border-b border-border pb-1 mb-2">Hours by Aircraft Type</p>
              <div className="space-y-1">
                {typeTotals.map(([type, data]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="font-mono text-xs text-foreground">{type}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-muted-foreground">{data.flights} flights</span>
                      <span className="font-mono text-sm font-bold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{data.hours.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category breakdowns */}
          <div className="grid grid-cols-2 gap-4">
            {breakdowns.map(g => (
              <div key={g.title} className="space-y-1">
                <p className="font-mono text-[9px] text-accent uppercase tracking-widest border-b border-border pb-1">{g.title}</p>
                {g.rows.map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">{r.label}</span>
                    <span className="font-mono text-xs font-semibold text-foreground">{r.value.toFixed(1)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border/50 pt-0.5">
                  <span className="font-mono text-[10px] text-muted-foreground">Subtotal</span>
                  <span className="font-mono text-xs font-bold text-primary">
                    {g.rows.reduce((s, r) => s + r.value, 0).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
