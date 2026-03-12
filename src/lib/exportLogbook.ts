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

const ENTRIES_PER_PAGE = 24;

function createPageSheet(entries: LogbookEntry[], pageNum: number, totalPages: number, cumulativeTotals?: Record<NumericField, number>) {
  const rows: (string | number)[][] = [];

  // Title row
  rows.push([`HELICOPTER PILOT LOGBOOK — PAGE ${pageNum} OF ${totalPages}`]);
  // Empty spacer
  rows.push([]);
  // Headers
  rows.push(headers);

  // Data rows
  for (const e of entries) {
    rows.push([
      e.date,
      e.aircraftType,
      e.aircraftReg,
      e.pilotInCommand,
      e.flightDetails,
      ...numericKeys.map(k => e[k] || 0),
    ]);
  }

  // Pad to 24 rows for consistent page sizing
  const remaining = ENTRIES_PER_PAGE - entries.length;
  for (let i = 0; i < remaining; i++) {
    rows.push([]);
  }

  // Page totals
  rows.push([]);
  const pageTotals = numericKeys.map(k =>
    entries.reduce((sum, e) => sum + (e[k] || 0), 0)
  );
  rows.push(['', '', '', '', 'PAGE TOTALS', ...pageTotals]);

  // Cumulative totals (carried forward from previous pages)
  if (cumulativeTotals) {
    const cumValues = numericKeys.map(k => cumulativeTotals[k]);
    rows.push(['', '', '', '', 'BROUGHT FORWARD', ...cumValues]);
    const grandValues = numericKeys.map((k, i) => cumValues[i] + pageTotals[i]);
    rows.push(['', '', '', '', 'CARRIED FORWARD', ...grandValues]);
  } else {
    rows.push(['', '', '', '', 'CARRIED FORWARD', ...pageTotals]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = headers.map((_, i) => ({ wch: i < 5 ? 20 : 14 }));

  // Merge title row across all columns
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

  return ws;
}

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
  ws['!cols'] = headers.map((_, i) => ({ wch: i < 5 ? 20 : 14 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Logbook');
  XLSX.writeFile(wb, 'helicopter-logbook.xlsx');
}

export function exportLast3Pages(entries: LogbookEntry[]) {
  const sorted = [...entries].sort((a, b) => (a.date > b.date ? -1 : 1));
  const recent = sorted.slice(0, ENTRIES_PER_PAGE * 3);

  // Split into 3 pages (most recent first): Page 3 = newest, Page 1 = oldest
  const pages: LogbookEntry[][] = [];
  for (let i = 0; i < 3; i++) {
    const start = i * ENTRIES_PER_PAGE;
    const chunk = recent.slice(start, start + ENTRIES_PER_PAGE);
    if (chunk.length > 0) pages.push(chunk);
  }

  // Reverse so oldest page is first (Page 1)
  pages.reverse();

  const wb = XLSX.utils.book_new();
  let cumulative: Record<NumericField, number> | undefined;

  pages.forEach((pageEntries, idx) => {
    const ws = createPageSheet(pageEntries, idx + 1, pages.length, cumulative);
    XLSX.utils.book_append_sheet(wb, ws, `Page ${idx + 1}`);

    // Update cumulative totals
    if (!cumulative) {
      cumulative = {} as Record<NumericField, number>;
      for (const k of numericKeys) cumulative[k] = 0;
    }
    for (const k of numericKeys) {
      cumulative[k] += pageEntries.reduce((s, e) => s + (e[k] || 0), 0);
    }
  });

  XLSX.writeFile(wb, 'helicopter-logbook-last-3-pages.xlsx');
}
