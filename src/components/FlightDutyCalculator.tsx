import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, AlertTriangle, CheckCircle } from 'lucide-react';

interface DutyEntry {
  id: string;
  date: string;
  reportTime: string;
  rotorStop: string;
  sectors: number;
}

function calculateMaxFDP(reportTimeStr: string, sectors: number): number {
  const [h, m] = reportTimeStr.split(':').map(Number);
  const mins = h * 60 + m;

  let fdpLimits: Record<number, number>;

  if (mins >= 360 && mins <= 809) {
    // 06:00–13:29
    fdpLimits = { 1: 10, 2: 10, 3: 10, 4: 10, 5: 9.25, 6: 8.5, 7: 8 };
  } else if (mins >= 810 && mins <= 1079) {
    // 13:30–17:59
    fdpLimits = { 1: 9.5, 2: 9.5, 3: 9.5, 4: 9.5, 5: 8.75, 6: 8, 7: 8 };
  } else if (mins >= 1080 && mins <= 1319) {
    // 18:00–21:59
    fdpLimits = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 8.25, 6: 8, 7: 8 };
  } else {
    // 22:00–05:59 (WOCL)
    fdpLimits = { 1: 8, 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8 };
  }

  const key = Math.min(Math.max(sectors, 1), 7);
  return fdpLimits[key];
}

function calcActualFDP(reportTime: string, rotorStop: string): number {
  const [rh, rm] = reportTime.split(':').map(Number);
  const [sh, sm] = rotorStop.split(':').map(Number);
  let diff = (sh * 60 + sm) - (rh * 60 + rm);
  if (diff < 0) diff += 1440; // overnight
  return diff / 60;
}

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
  }
  return options;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FlightDutyCalculator({ open, onOpenChange }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [entries, setEntries] = useState<DutyEntry[]>([]);
  const monthOptions = useMemo(getMonthOptions, []);

  const addEntry = () => {
    const [y, m] = selectedMonth.split('-');
    setEntries(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        date: `${y}-${m}-01`,
        reportTime: '07:00',
        rotorStop: '15:00',
        sectors: 1,
      },
    ]);
  };

  const updateEntry = (id: string, field: keyof DutyEntry, value: string | number) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const results = useMemo(() => {
    return entries.map(e => {
      const maxFDP = calculateMaxFDP(e.reportTime, e.sectors);
      const actualFDP = calcActualFDP(e.reportTime, e.rotorStop);
      const exceeded = actualFDP > maxFDP;
      return { ...e, maxFDP, actualFDP, exceeded };
    });
  }, [entries]);

  const totalDutyHours = results.reduce((sum, r) => sum + r.actualFDP, 0);
  const exceedCount = results.filter(r => r.exceeded).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary tracking-wider">
            ▸ FLIGHT & DUTY CALCULATOR (SACAA)
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mb-4">
          <label className="font-mono text-xs text-muted-foreground">MONTH:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="font-mono text-xs bg-background border border-input rounded px-2 py-1.5 text-foreground"
          >
            {monthOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button size="sm" onClick={addEntry} className="font-mono gap-1 ml-auto">
            <Plus className="h-3 w-3" /> ADD DUTY
          </Button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-mono text-xs">
            No duty entries. Click ADD DUTY to start.
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[110px_90px_90px_70px_80px_80px_50px_28px] gap-2 font-mono text-[9px] text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
              <span>Date</span>
              <span>Report</span>
              <span>Rotor Stop</span>
              <span>Sectors</span>
              <span>Actual FDP</span>
              <span>Max FDP</span>
              <span>Status</span>
              <span />
            </div>

            {results.map(r => (
              <div
                key={r.id}
                className={`grid grid-cols-[110px_90px_90px_70px_80px_80px_50px_28px] gap-2 items-center py-1 ${
                  r.exceeded ? 'bg-destructive/10 rounded' : ''
                }`}
              >
                <Input
                  type="date"
                  value={r.date}
                  onChange={(e) => updateEntry(r.id, 'date', e.target.value)}
                  className="font-mono text-xs h-8"
                />
                <Input
                  type="time"
                  value={r.reportTime}
                  onChange={(e) => updateEntry(r.id, 'reportTime', e.target.value)}
                  className="font-mono text-xs h-8"
                />
                <Input
                  type="time"
                  value={r.rotorStop}
                  onChange={(e) => updateEntry(r.id, 'rotorStop', e.target.value)}
                  className="font-mono text-xs h-8"
                />
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={r.sectors}
                  onChange={(e) => updateEntry(r.id, 'sectors', parseInt(e.target.value) || 1)}
                  className="font-mono text-xs h-8"
                />
                <span className="font-mono text-xs font-semibold text-foreground">
                  {r.actualFDP.toFixed(2)} h
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {r.maxFDP.toFixed(2)} h
                </span>
                <span>
                  {r.exceeded ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </span>
                <button onClick={() => removeEntry(r.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between font-mono text-xs">
            <span className="text-muted-foreground">
              {entries.length} DUTIES — <span className="text-foreground font-bold">{totalDutyHours.toFixed(2)}</span> HRS TOTAL
            </span>
            {exceedCount > 0 ? (
              <span className="text-destructive font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {exceedCount} FDP LIMIT(S) EXCEEDED
              </span>
            ) : (
              <span className="text-primary font-bold flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> ALL WITHIN LEGAL LIMITS
              </span>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
