import { LogbookEntry, numericFieldLabels, NumericField } from '@/types/logbook';
import * as XLSX from 'xlsx';

const headers = [
  'Date', 'Class or Type', 'Registration', 'Pilot in Command', 'Flight Details',
  ...Object.values(numericFieldLabels),
];

const numericKeys: NumericField[] = [
  'seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot',
  'instrumentTime', 'instructorDay', 'instructorNight',
];

export function exportToNumbers(entries: LogbookEntry[]) {
  const sorted = [...entries].sort((a, b) => (a.date > b.date ? -1 : 1));

  const rows = sorted.map(e => [
    e.date,
    e.aircraftType,
    e.aircraftReg,
    e.pilotInCommand,
    e.flightDetails,
    ...numericKeys.map(k => e[k] || 0),
  ]);

  // Add totals row
  const totals = numericKeys.map(k =>
    entries.reduce((sum, e) => sum + (e[k] || 0), 0)
  );
  rows.push(['', '', '', '', 'TOTALS', ...totals]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws['!cols'] = headers.map((h, i) => ({ wch: i < 5 ? 18 : 12 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Logbook');
  XLSX.writeFile(wb, 'helicopter-logbook.xlsx');
}
