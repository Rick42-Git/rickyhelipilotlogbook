import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle, Clock, Plane, FileDown, Moon } from 'lucide-react';
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

function getNightHours(entry: LogbookEntry): number {
  return entry.seNightDual + entry.seNightPilot + entry.instructorNight;
}

function getFatigueUnits(entry: LogbookEntry): number {
  const commercialHours = entry.seDayDual + entry.seDayPilot +
    entry.seNightDual + entry.seNightPilot;
  const instructionHours = entry.instructorDay + entry.instructorNight;
  return commercialHours + (instructionHours * 1.5);
}

/** SACAA Two Local Nights rest validation.
 *  A local night = 21:00–07:00 (10hr window containing 8hr sleep opportunity).
 *  Rest must span at least 2 full local nights to be valid. */
function validateRestPeriod(dutyEndDate: string, dutyEndTime: string, nextDutyStartDate: string, nextDutyStartTime: string): {
  isValid: boolean;
  localNights: number;
  restHours: number;
  message: string;
} {
  const [eh, em] = dutyEndTime.split(':').map(Number);
  const [sh, sm] = nextDutyStartTime.split(':').map(Number);

  const endDt = new Date(dutyEndDate);
  endDt.setHours(eh, em, 0, 0);

  const startDt = new Date(nextDutyStartDate);
  startDt.setHours(sh, sm, 0, 0);

  const restMs = startDt.getTime() - endDt.getTime();
  const restHours = restMs / (1000 * 60 * 60);

  if (restHours < 36) {
    return { isValid: false, localNights: 0, restHours, message: 'Rest < 36h; cannot contain two local nights' };
  }

  // Count full 21:00–07:00 windows within the rest period
  let localNights = 0;
  const checkDate = new Date(endDt);
  checkDate.setHours(21, 0, 0, 0);

  // If duty ended after 21:00, first available night starts next day
  if (endDt.getHours() >= 21) {
    checkDate.setDate(checkDate.getDate() + 1);
  }

  while (true) {
    const nightEnd = new Date(checkDate);
    nightEnd.setHours(nightEnd.getHours() + 10); // 21:00 + 10h = 07:00 next day
    if (nightEnd.getTime() > startDt.getTime()) break;
    localNights++;
    checkDate.setDate(checkDate.getDate() + 1);
  }

  if (localNights >= 2) {
    return { isValid: true, localNights, restHours, message: `Valid rest — ${localNights} local nights` };
  } else {
    return { isValid: false, localNights, restHours, message: `Invalid rest — only ${localNights} local night${localNights !== 1 ? 's' : ''}` };
  }
}

/** Check if two ISO date strings (YYYY-MM-DD) are consecutive calendar days */
function isConsecutiveDay(dateA: string, dateB: string): boolean {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diff = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  return diff === 1;
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
  totalNightHours: number;
  totalFatigueUnits: number;
  duty: DutyOverride;
  actualFDP: number;
  maxFDP: number;
  fdpExceeded: boolean;
  fatigueExceeded: boolean;
  nightExceeded: boolean;
  anyExceeded: boolean;
  consecutiveDays: number;
  restAfter?: { isValid: boolean; localNights: number; restHours: number; message: string };
}

const DAILY_FATIGUE_LIMIT = 10;
const DAILY_NIGHT_LIMIT = 8;

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

  const monthData = useMemo((): DayData[] => {
    const filtered = entries.filter(e => e.date.startsWith(selectedMonth));

    const byDate: Record<string, LogbookEntry[]> = {};
    for (const e of filtered) {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    }

    const dates = Object.keys(byDate).sort();

    const days: DayData[] = dates.map((date, idx) => {
      const flights = byDate[date];
      const totalFlightHours = flights.reduce((sum, f) => sum + getFlightHours(f), 0);
      const totalNightHours = flights.reduce((sum, f) => sum + getNightHours(f), 0);
      const totalFatigueUnits = flights.reduce((sum, f) => sum + getFatigueUnits(f), 0);
      const sectorCount = flights.length;

      const duty = dutyOverrides[date] || {
        reportTime: '07:00',
        rotorStop: '15:00',
        sectors: sectorCount,
      };

      const actualFDP = calcActualFDP(duty.reportTime, duty.rotorStop);
      const maxFDP = calculateMaxFDP(duty.reportTime, duty.sectors);
      const fdpExceeded = actualFDP > maxFDP;
      const fatigueExceeded = totalFatigueUnits > DAILY_FATIGUE_LIMIT;
      const nightExceeded = totalNightHours > DAILY_NIGHT_LIMIT;
      const anyExceeded = fdpExceeded || fatigueExceeded || nightExceeded;

      let consecutiveDays = 1;
      for (let j = idx - 1; j >= 0; j--) {
        if (isConsecutiveDay(dates[j], dates[j + 1])) {
          consecutiveDays++;
        } else break;
      }

      return { date, flights, totalFlightHours, totalNightHours, totalFatigueUnits, duty, actualFDP, maxFDP, fdpExceeded, fatigueExceeded, nightExceeded, anyExceeded, consecutiveDays };
    });

    // Calculate rest validation between duty blocks
    for (let i = 0; i < days.length - 1; i++) {
      const isEndOfBlock = !isConsecutiveDay(days[i].date, days[i + 1].date);
      if (isEndOfBlock) {
        days[i].restAfter = validateRestPeriod(
          days[i].date, days[i].duty.rotorStop,
          days[i + 1].date, days[i + 1].duty.reportTime
        );
      }
    }

    return days;
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
  const exceedCount = monthData.filter(d => d.fdpExceeded).length;
  const fatigueExceedCount = monthData.filter(d => d.fatigueExceeded).length;
  const nightExceedCount = monthData.filter(d => d.nightExceeded).length;
  const restViolations = monthData.filter(d => d.restAfter && !d.restAfter.isValid).length;
  const totalExceedCount = exceedCount + fatigueExceedCount + nightExceedCount + restViolations;
  const flyingDays = monthData.length;
  const maxConsecutive = monthData.reduce((max, d) => Math.max(max, d.consecutiveDays), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex-row items-center justify-between gap-4">
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
                restViolations,
                maxConsecutive,
                rows: monthData.map(d => ({
                  date: d.date,
                  details: d.flights.map(f => `${f.aircraftType} ${f.aircraftReg}`).join(', '),
                  flightHours: d.totalFlightHours,
                  fatigueUnits: d.totalFatigueUnits,
                  reportTime: d.duty.reportTime,
                  rotorStop: d.duty.rotorStop,
                  sectors: d.duty.sectors,
                  actualFDP: d.actualFDP,
                  maxFDP: d.maxFDP,
                  exceeded: d.anyExceeded,
                  fdpExceeded: d.fdpExceeded,
                  fatigueExceeded: d.fatigueExceeded,
                  consecutiveDays: d.consecutiveDays,
                  restAfter: d.restAfter,
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
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
          <div className="border border-border rounded p-3">
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Moon className="h-3 w-3" /> Max Consec Days</p>
            <p className={`font-mono text-lg font-bold ${maxConsecutive >= 7 ? 'text-destructive' : 'text-foreground'}`}>{maxConsecutive}</p>
          </div>
        </div>

        {monthData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-mono text-xs">
            No flights found for this month.
          </div>
        ) : (
          <div className="space-y-0">
            {/* Header */}
            <div className="grid grid-cols-[90px_1fr_50px_50px_50px_45px_80px_80px_50px_50px_50px_28px] gap-1 font-mono text-[9px] text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
              <span>Date</span>
              <span>Details</span>
              <span>Flt Hrs</span>
              <span>Night</span>
              <span>Fatigue</span>
              <span>Days</span>
              <span>Report</span>
              <span>Rotor Stop</span>
              <span>Sectors</span>
              <span>Act FDP</span>
              <span>Max FDP</span>
              <span />
            </div>

            {monthData.map((d, idx) => (
              <div key={d.date}>
                <div
                  className={`grid grid-cols-[90px_1fr_50px_50px_50px_45px_80px_80px_50px_50px_50px_28px] gap-1 items-center py-1.5 border-b border-border/30 ${
                    d.anyExceeded ? 'bg-destructive/10 rounded' : ''
                  }`}
                >
                  <span className="font-mono text-xs text-foreground">{d.date}</span>
                  <div className="font-mono text-[10px] text-muted-foreground truncate">
                    {d.flights.map(f => `${f.aircraftType} ${f.aircraftReg}`).join(', ')}
                  </div>
                  <span className="font-mono text-xs text-primary font-semibold">
                    {d.totalFlightHours.toFixed(1)}
                  </span>
                  <span className={`font-mono text-xs font-semibold ${d.nightExceeded ? 'text-destructive' : 'text-foreground'}`}>
                    {d.totalNightHours.toFixed(1)}
                    {d.nightExceeded && <span className="text-[8px] ml-0.5">▸8</span>}
                  </span>
                  <span className={`font-mono text-xs font-semibold ${d.fatigueExceeded ? 'text-destructive' : 'text-foreground'}`}>
                    {d.totalFatigueUnits.toFixed(1)}
                    {d.fatigueExceeded && <span className="text-[8px] ml-0.5">▸10</span>}
                  </span>
                  <span className={`font-mono text-xs font-semibold ${d.consecutiveDays >= 7 ? 'text-destructive' : d.consecutiveDays >= 5 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    {d.consecutiveDays}
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
                    {d.actualFDP.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {d.maxFDP.toFixed(1)}
                  </span>
                  <span>
                    {d.anyExceeded ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </span>
                </div>

                {/* Rest period validation between duty blocks */}
                {d.restAfter && (
                  <div className={`flex items-center gap-2 py-1.5 px-3 my-1 rounded text-[10px] font-mono ${
                    d.restAfter.isValid
                      ? 'bg-primary/5 border border-primary/20 text-primary'
                      : 'bg-destructive/10 border border-destructive/20 text-destructive'
                  }`}>
                    <Moon className="h-3 w-3 flex-shrink-0" />
                    <span className="font-semibold">REST:</span>
                    <span>{d.restAfter.restHours.toFixed(1)}h</span>
                    <span>•</span>
                    <span>{d.restAfter.localNights} local night{d.restAfter.localNights !== 1 ? 's' : ''} (21:00–07:00)</span>
                    <span>•</span>
                    <span className="font-semibold">{d.restAfter.isValid ? '✓ VALID' : '✗ INSUFFICIENT'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {monthData.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between font-mono text-xs gap-2">
            <span className="text-muted-foreground">
              {flyingDays} DAYS — <span className="text-primary font-bold">{totalFlightHours.toFixed(1)}</span> FLT HRS — <span className="text-foreground font-bold">{totalDutyHours.toFixed(1)}</span> DUTY HRS
            </span>
            {totalExceedCount > 0 ? (
              <span className="text-destructive font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {[
                  exceedCount > 0 && `${exceedCount} FDP`,
                  nightExceedCount > 0 && `${nightExceedCount} NIGHT`,
                  fatigueExceedCount > 0 && `${fatigueExceedCount} FATIGUE`,
                  restViolations > 0 && `${restViolations} REST`,
                ].filter(Boolean).join(' + ')}
                {' '}LIMIT(S) EXCEEDED
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
