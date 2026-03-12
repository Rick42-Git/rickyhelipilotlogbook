import { useState } from 'react';
import { LogbookEntry, NumericField } from '@/types/logbook';
import { normalizeAircraftType } from '@/lib/normalizeAircraftType';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

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
  const typeMap: Record<string, { dual: number; pic: number; other: number; flights: number }> = {};
  for (const e of filtered) {
    const type = normalizeAircraftType(e.aircraftType || 'Unknown');
    if (!typeMap[type]) typeMap[type] = { dual: 0, pic: 0, other: 0, flights: 0 };
    typeMap[type].flights += 1;
    typeMap[type].dual += (e.seDayDual || 0) + (e.seNightDual || 0);
    typeMap[type].pic += (e.seDayPilot || 0) + (e.seNightPilot || 0);
    typeMap[type].other += (e.instrumentTime || 0) + (e.instructorDay || 0) + (e.instructorNight || 0);
  }
  const typeTotals = Object.entries(typeMap).sort((a, b) => (b[1].dual + b[1].pic + b[1].other) - (a[1].dual + a[1].pic + a[1].other));

  const exportSummary = () => {
    const totalDualAll = typeTotals.reduce((s, [, d]) => s + d.dual, 0);
    const totalPicAll = typeTotals.reduce((s, [, d]) => s + d.pic, 0);
    const totalOtherAll = typeTotals.reduce((s, [, d]) => s + d.other, 0);
    const grandTotalAll = totalDualAll + totalPicAll + totalOtherAll;
    const startMonth = new Date(cutoff).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Summary of Hours</title>
<style>
  @page { size: A4 portrait; margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 11pt; color: #000; }
  h2 { text-align: center; text-decoration: underline; font-size: 13pt; margin-bottom: 10px; }
  .subtitle { text-align: center; font-size: 10pt; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  th, td { border: 2px solid #000; padding: 6px 12px; text-align: center; font-size: 11pt; }
  th { font-weight: 700; text-transform: uppercase; background: #f0f0f0; }
  .label-cell { text-align: left; font-weight: 600; }
  .total-row td { border-top: 3px solid #000; font-weight: 700; }
  .grand-row td { font-weight: 700; }
  .grand-total { text-align: right; font-weight: 700; font-size: 12pt; margin-top: 4px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
  <h2>SUMMARY OF HOURS</h2>
  <p class="subtitle">Summary of hours flown in the last 12 months from (${startMonth})</p>
  <table>
    <thead><tr><th>Aircraft Type</th><th>Dual</th><th>PIC</th><th>Other</th></tr></thead>
    <tbody>
      ${typeTotals.map(([type, d]) => `<tr><td class="label-cell">${type}</td><td>${d.dual > 0 ? d.dual.toFixed(1) : '—'}</td><td>${d.pic > 0 ? d.pic.toFixed(1) : '—'}</td><td>${d.other > 0 ? d.other.toFixed(1) : '—'}</td></tr>`).join('')}
      <tr class="total-row"><td class="label-cell">Total last 12 months</td><td>${totalDualAll > 0 ? totalDualAll.toFixed(1) : '—'}</td><td>${totalPicAll > 0 ? totalPicAll.toFixed(1) : '—'}</td><td>${totalOtherAll > 0 ? totalOtherAll.toFixed(1) : '—'}</td></tr>
    </tbody>
  </table>
  <p class="grand-total">⇒ ${grandTotalAll.toFixed(1)}h</p>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass-panel max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-mono text-primary">▸ LAST 12 MONTHS SUMMARY</DialogTitle>
            <Button variant="ghost" size="sm" className="h-7 px-2 font-mono text-[10px]" onClick={exportSummary}>
              <FileDown className="h-3.5 w-3.5 mr-1" /> Export
            </Button>
          </div>
        </DialogHeader>

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
                      <span className="font-mono text-sm font-bold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{(data.dual + data.pic + data.other).toFixed(1)}</span>
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
