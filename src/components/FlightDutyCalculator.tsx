import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle, Clock, Plane, FileDown } from 'lucide-react';
import { exportDutyCalcPDF } from '@/lib/exportDutyCalc';
import { LogbookEntry } from '@/types/logbook';

interface DutyOverride {
  reportTime: string;
  rotorStop: string;
  sectors: number;
}

function calculateMaxFDP(reportTimeStr: string, sectors: number): number {
  const [h, m] = reportTimeStr.split(':').map(Number);
  const mins = h * 60 + m;

  let fdpLimits: Record<number, number>;

  if (mins >= 360 && mins <= 809) {
    fdpLimits = { 1: 10, 2: 10, 3: 10, 4: 10, 5: 9.25, 6: 8.5, 7: 8 };
  } else if (mins >= 810 && mins <= 1079) {
    fdpLimits = { 1: 9.5, 2: 9.5, 3: 9.5, 4: 9.5, 5: 8.75, 6: 8, 7: 8 };
  } else if (mins >= 1080 && mins <= 1319) {
    fdpLimits = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 8.25, 6: 8, 7: 8 };
  } else {
    fdpLimits = { 1: 8, 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8 };
  }

  const key = Math.min(Math.max(sectors, 1), 7);
  return fdpLimits[key];
}

function calcActualFDP(reportTime: string, rotorStop: string): number {
  const [rh, rm] = reportTime.split(':').map(Number);
  const [sh, sm] = rotorStop.split(':').map(Number);
  let diff = (sh * 60 + sm) - (rh * 60 + rm);
  if (diff < 0) diff += 1440;
  return diff / 60;
}

function getFlightHours(entry: LogbookEntry): number {
  return (
    entry.seDayDual + entry.seDayPilot +
    entry.seNightDual + entry.seNightPilot +
    entry.instructorDay + entry.instructorNight
  );
}

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const startYear = 2010;
  const totalMonths = (now.getFullYear() - startYear) * 12 + now.getMonth() + 1;
  for (let i = 0; i < totalMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
  }
  return options;
}

interface DayData {
  date: string;
  flights: LogbookEntry[];
  totalFlightHours: number;
  duty: DutyOverride;
  actualFDP: number;
  maxFDP: number;
  fdpExceeded: boolean;
  flightTimeExceeded: boolean;
  anyExceeded: boolean;
}

const MAX_DAILY_FLIGHT_HOURS = 7;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: LogbookEntry[];
}

export function FlightDutyCalculator({ open, onOpenChange, entries }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dutyOverrides, setDutyOverrides] = useState<Record<string, DutyOverride>>({});
  const monthOptions = useMemo(getMonthOptions, []);

  // Filter logbook entries for the selected month and group by date
  const monthData = useMemo((): DayData[] => {
    const filtered = entries.filter(e => e.date.startsWith(selectedMonth));

    // Group by date
    const byDate: Record<string, LogbookEntry[]> = {};
    for (const e of filtered) {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    }

    const dates = Object.keys(byDate).sort();

    return dates.map(date => {
      const flights = byDate[date];
      const totalFlightHours = flights.reduce((sum, f) => sum + getFlightHours(f), 0);
      const sectorCount = flights.length;

      const duty = dutyOverrides[date] || {
        reportTime: '07:00',
        rotorStop: '15:00',
        sectors: sectorCount,
      };

      const actualFDP = calcActualFDP(duty.reportTime, duty.rotorStop);
      const maxFDP = calculateMaxFDP(duty.reportTime, duty.sectors);
      const exceeded = actualFDP > maxFDP;

      return { date, flights, totalFlightHours, duty, actualFDP, maxFDP, exceeded };
    });
  }, [entries, selectedMonth, dutyOverrides]);

  const updateDuty = (date: string, field: keyof DutyOverride, value: string | number) => {
    setDutyOverrides(prev => {
      const existing = prev[date] || {
        reportTime: '07:00',
        rotorStop: '15:00',
        sectors: monthData.find(d => d.date === date)?.flights.length || 1,
      };
      return { ...prev, [date]: { ...existing, [field]: value } };
    });
  };

  const totalFlightHours = monthData.reduce((sum, d) => sum + d.totalFlightHours, 0);
  const totalDutyHours = monthData.reduce((sum, d) => sum + d.actualFDP, 0);
  const totalFlights = monthData.reduce((sum, d) => sum + d.flights.length, 0);
  const exceedCount = monthData.filter(d => d.exceeded).length;
  const flyingDays = monthData.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary tracking-wider">
            ▸ FLIGHT & DUTY CALCULATOR (SACAA)
          </DialogTitle>
          {monthData.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs gap-1.5"
              onClick={() => exportDutyCalcPDF({
                month: monthOptions.find(o => o.value === selectedMonth)?.label || selectedMonth,
                flyingDays,
                totalFlights,
                totalFlightHours,
                totalDutyHours,
                exceedCount,
                rows: monthData.map(d => ({
                  date: d.date,
                  details: d.flights.map(f => `${f.aircraftType} ${f.aircraftReg}`).join(', '),
                  flightHours: d.totalFlightHours,
                  reportTime: d.duty.reportTime,
                  rotorStop: d.duty.rotorStop,
                  sectors: d.duty.sectors,
                  actualFDP: d.actualFDP,
                  maxFDP: d.maxFDP,
                  exceeded: d.exceeded,
                })),
              })}
            >
              <FileDown className="h-3.5 w-3.5" /> Export PDF
            </Button>
          )}
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
        </div>

        {/* Monthly summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="border border-border rounded p-3">
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Flying Days</p>
            <p className="font-mono text-lg font-bold text-foreground">{flyingDays}</p>
          </div>
          <div className="border border-border rounded p-3">
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Total Flights</p>
            <p className="font-mono text-lg font-bold text-foreground">{totalFlights}</p>
          </div>
          <div className="border border-border rounded p-3">
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Plane className="h-3 w-3" /> Flight Hours</p>
            <p className="font-mono text-lg font-bold text-primary">{totalFlightHours.toFixed(1)} h</p>
          </div>
          <div className="border border-border rounded p-3">
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock className="h-3 w-3" /> Duty Hours</p>
            <p className="font-mono text-lg font-bold text-foreground">{totalDutyHours.toFixed(1)} h</p>
          </div>
        </div>

        {monthData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-mono text-xs">
            No flights found for this month.
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[90px_1fr_70px_80px_80px_70px_70px_70px_40px] gap-2 font-mono text-[9px] text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
              <span>Date</span>
              <span>Details</span>
              <span>Flt Hrs</span>
              <span>Report</span>
              <span>Rotor Stop</span>
              <span>Sectors</span>
              <span>Act FDP</span>
              <span>Max FDP</span>
              <span />
            </div>

            {monthData.map(d => (
              <div
                key={d.date}
                className={`grid grid-cols-[90px_1fr_70px_80px_80px_70px_70px_70px_40px] gap-2 items-center py-1.5 border-b border-border/30 ${
                  d.exceeded ? 'bg-destructive/10 rounded' : ''
                }`}
              >
                <span className="font-mono text-xs text-foreground">{d.date}</span>
                <div className="font-mono text-[10px] text-muted-foreground truncate">
                  {d.flights.map(f => `${f.aircraftType} ${f.aircraftReg}`).join(', ')}
                </div>
                <span className="font-mono text-xs font-semibold text-primary">
                  {d.totalFlightHours.toFixed(1)} h
                </span>
                <Input
                  type="time"
                  value={d.duty.reportTime}
                  onChange={(e) => updateDuty(d.date, 'reportTime', e.target.value)}
                  className="font-mono text-xs h-7"
                />
                <Input
                  type="time"
                  value={d.duty.rotorStop}
                  onChange={(e) => updateDuty(d.date, 'rotorStop', e.target.value)}
                  className="font-mono text-xs h-7"
                />
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={d.duty.sectors}
                  onChange={(e) => updateDuty(d.date, 'sectors', parseInt(e.target.value) || 1)}
                  className="font-mono text-xs h-7"
                />
                <span className="font-mono text-xs font-semibold text-foreground">
                  {d.actualFDP.toFixed(1)} h
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {d.maxFDP.toFixed(1)} h
                </span>
                <span>
                  {d.exceeded ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {monthData.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between font-mono text-xs">
            <span className="text-muted-foreground">
              {flyingDays} DAYS — <span className="text-primary font-bold">{totalFlightHours.toFixed(1)}</span> FLT HRS — <span className="text-foreground font-bold">{totalDutyHours.toFixed(1)}</span> DUTY HRS
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
