import { LogbookEntry, NumericField } from '@/types/logbook';
import { normalizeAircraftType } from '@/lib/normalizeAircraftType';

const PISTON_TYPES = new Set(['RH-22', 'RH-44', 'FNTP II', 'FSTD I', 'FSTD II']);

function getTypeTotals(entries: LogbookEntry[]) {
  const map: Record<string, { dual: number; pic: number; instructor: number; instrument: number; flights: number }> = {};
  for (const e of entries) {
    const type = normalizeAircraftType(e.aircraftType || 'Unknown');
    if (!map[type]) map[type] = { dual: 0, pic: 0, instructor: 0, instrument: 0, flights: 0 };
    map[type].flights += 1;
    map[type].dual += (e.seDayDual || 0) + (e.seNightDual || 0);
    map[type].pic += (e.seDayPilot || 0) + (e.seNightPilot || 0);
    map[type].instructor += (e.instructorDay || 0) + (e.instructorNight || 0);
    map[type].instrument += (e.instrumentTime || 0);
  }
  return Object.entries(map).sort((a, b) => {
    const totalA = a[1].dual + a[1].pic + a[1].instructor + a[1].instrument;
    const totalB = b[1].dual + b[1].pic + b[1].instructor + b[1].instrument;
    return totalB - totalA;
  });
}

function getTurbineTotals(entries: LogbookEntry[]) {
  let hours = 0, flights = 0;
  for (const e of entries) {
    const type = normalizeAircraftType(e.aircraftType || '');
    if (!PISTON_TYPES.has(type.toUpperCase()) && !PISTON_TYPES.has(type)) {
      flights += 1;
      hours += (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
    }
  }
  return { hours, flights };
}

function getGameCaptureTotals(entries: LogbookEntry[]) {
  let hours = 0, flights = 0;
  for (const e of entries) {
    if ((e.flightDetails || '').toLowerCase().includes('game')) {
      flights += 1;
      hours += (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
    }
  }
  return { hours, flights };
}

function fmt(n: number) {
  return n > 0 ? n.toFixed(1) : '—';
}

export function exportSummaryPDF(entries: LogbookEntry[], pilotName: string) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = sorted.length > 0 ? sorted[0].date : '—';
  const lastDate = sorted.length > 0 ? sorted[sorted.length - 1].date : '—';

  const totalDual = entries.reduce((s, e) => s + (e.seDayDual || 0) + (e.seNightDual || 0), 0);
  const totalPIC = entries.reduce((s, e) => s + (e.seDayPilot || 0) + (e.seNightPilot || 0), 0);
  const totalDay = entries.reduce((s, e) => s + (e.seDayDual || 0) + (e.seDayPilot || 0), 0);
  const totalNight = entries.reduce((s, e) => s + (e.seNightDual || 0) + (e.seNightPilot || 0), 0);
  const totalInstrument = entries.reduce((s, e) => s + (e.instrumentTime || 0), 0);
  const totalInstructor = entries.reduce((s, e) => s + (e.instructorDay || 0) + (e.instructorNight || 0), 0);
  const grandTotal = totalDual + totalPIC;

  const typeTotals = getTypeTotals(entries);
  const turbine = getTurbineTotals(entries);
  const gameCapture = getGameCaptureTotals(entries);

  const today = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Flight Hours Summary — ${pilotName}</title>
<style>
  @page { size: A4 portrait; margin: 22mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.5; }
  
  .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #0f4c75; page-break-inside: avoid; }
  .header h1 { font-size: 18pt; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px; color: #0f4c75; }
  .header .pilot-name { font-size: 13pt; font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
  .header .date-range { font-size: 9pt; color: #666; letter-spacing: 1px; }
  
  .hero { display: flex; justify-content: center; gap: 20px; margin: 20px 0 24px; flex-wrap: wrap; page-break-inside: avoid; }
  .hero-card { text-align: center; padding: 14px 24px; border-radius: 6px; min-width: 120px; }
  .hero-primary { background: #0f4c75; color: #fff; }
  .hero-primary .value { font-size: 22pt; font-weight: 700; color: #fff; }
  .hero-primary .label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.8); margin-top: 2px; }
  .hero-secondary { background: #f0f7fc; border: 1.5px solid #0f4c75; }
  .hero-secondary .value { font-size: 22pt; font-weight: 700; color: #0f4c75; }
  .hero-secondary .label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 2px; color: #555; margin-top: 2px; }
  .hero-accent { background: #f0faf0; border: 1.5px solid #2e7d32; }
  .hero-accent .value { font-size: 22pt; font-weight: 700; color: #2e7d32; }
  .hero-accent .label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 2px; color: #555; margin-top: 2px; }
  
  .section { margin-bottom: 18px; page-break-inside: avoid; }
  .section-title { font-size: 8pt; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 700; color: #0f4c75; border-bottom: 2px solid #0f4c75; padding-bottom: 4px; margin-bottom: 8px; }
  
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; text-align: left; padding: 6px 10px; border-bottom: 2px solid #0f4c75; color: #0f4c75; background: #f0f7fc; }
  th.num { text-align: right; }
  td { font-size: 9.5pt; padding: 5px 10px; border-bottom: 1px solid #e5e5e5; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tr:nth-child(even) { background: #fafcfe; }
  tr:last-child td { border-bottom: none; }
  .total-row td { font-weight: 700; border-top: 2px solid #0f4c75; border-bottom: none; padding-top: 8px; background: #f0f7fc; }
  
  .breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 18px; page-break-inside: avoid; }
  .breakdown-card { border: 1.5px solid #dde6ed; border-radius: 6px; padding: 12px 14px; background: #fafcfe; page-break-inside: avoid; }
  .breakdown-card .card-title { font-size: 8pt; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 8px; color: #0f4c75; }
  .breakdown-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .breakdown-row .lbl { font-size: 9pt; color: #555; }
  .breakdown-row .val { font-size: 9.5pt; font-weight: 600; font-variant-numeric: tabular-nums; }
  .breakdown-subtotal { border-top: 1.5px solid #0f4c75; margin-top: 4px; padding-top: 4px; }
  .breakdown-subtotal .val { font-weight: 700; color: #0f4c75; }
  
  .highlight-bar { display: flex; gap: 16px; margin-bottom: 18px; page-break-inside: avoid; }
  .highlight-item { flex: 1; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 6px; border-left: 4px solid; }
  .highlight-turbine { background: #f0f7fc; border-left-color: #0f4c75; }
  .highlight-game { background: #f5f0e6; border-left-color: #8b6914; }
  .highlight-item .hi-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #333; }
  .highlight-item .hi-detail { font-size: 8pt; color: #888; }
  .highlight-item .hi-value { font-size: 14pt; font-weight: 700; font-variant-numeric: tabular-nums; }
  .highlight-turbine .hi-value { color: #0f4c75; }
  .highlight-game .hi-value { color: #8b6914; }
  
  .footer { margin-top: 28px; padding-top: 12px; border-top: 2px solid #0f4c75; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
  .footer .date { font-size: 8pt; color: #999; }
  .footer .sig { text-align: right; }
  .footer .sig-line { width: 180px; border-bottom: 1px solid #999; margin-bottom: 4px; margin-left: auto; }
  .footer .sig-label { font-size: 7.5pt; color: #999; text-transform: uppercase; letter-spacing: 1.5px; }
  
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>

  <div class="header">
    <h1>Flight Hours Summary</h1>
    <p class="pilot-name">${pilotName}</p>
    <p class="date-range">Logbook period: ${firstDate} — ${lastDate} &nbsp;·&nbsp; ${entries.length} flights</p>
  </div>

  <div class="hero">
    <div class="hero-card hero-primary">
      <div class="value">${grandTotal.toFixed(1)}</div>
      <div class="label">Total Hours</div>
    </div>
    <div class="hero-card hero-secondary">
      <div class="value">${totalPIC.toFixed(1)}</div>
      <div class="label">Pilot in Command</div>
    </div>
    ${turbine.flights > 0 ? `<div class="hero-card hero-secondary">
      <div class="value">${turbine.hours.toFixed(1)}</div>
      <div class="label">Turbine Hours</div>
    </div>` : ''}
    ${gameCapture.flights > 0 ? `<div class="hero-card hero-accent">
      <div class="value">${gameCapture.hours.toFixed(1)}</div>
      <div class="label">Game Capture</div>
    </div>` : ''}
    <div class="hero-card hero-secondary">
      <div class="value">${entries.length}</div>
      <div class="label">Total Flights</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Hours by Aircraft Type</div>
    <table>
      <thead>
        <tr>
          <th>Aircraft Type</th>
          <th class="num">Dual</th>
          <th class="num">PIC</th>
          <th class="num">Instructor</th>
          <th class="num">Instrument</th>
          <th class="num">Total</th>
          <th class="num">Flights</th>
        </tr>
      </thead>
      <tbody>
        ${typeTotals.map(([type, d]) => {
          const total = d.dual + d.pic + d.instructor + d.instrument;
          return `<tr>
            <td>${type}</td>
            <td class="num">${fmt(d.dual)}</td>
            <td class="num">${fmt(d.pic)}</td>
            <td class="num">${fmt(d.instructor)}</td>
            <td class="num">${fmt(d.instrument)}</td>
            <td class="num" style="font-weight:600">${total.toFixed(1)}</td>
            <td class="num">${d.flights}</td>
          </tr>`;
        }).join('')}
        <tr class="total-row">
          <td>Grand Total</td>
          <td class="num">${fmt(totalDual)}</td>
          <td class="num">${fmt(totalPIC)}</td>
          <td class="num">${fmt(totalInstructor)}</td>
          <td class="num">${fmt(totalInstrument)}</td>
          <td class="num">${grandTotal.toFixed(1)}</td>
          <td class="num">${entries.length}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${(turbine.flights > 0 || gameCapture.flights > 0) ? `<div class="highlight-bar">
    ${turbine.flights > 0 ? `<div class="highlight-item highlight-turbine">
      <div><div class="hi-label">Turbine Hours</div><div class="hi-detail">${turbine.flights} flights</div></div>
      <div class="hi-value">${turbine.hours.toFixed(1)}h</div>
    </div>` : ''}
    ${gameCapture.flights > 0 ? `<div class="highlight-item highlight-game">
      <div><div class="hi-label">Game Capture</div><div class="hi-detail">${gameCapture.flights} flights</div></div>
      <div class="hi-value">${gameCapture.hours.toFixed(1)}h</div>
    </div>` : ''}
  </div>` : ''}

  <div class="breakdown-grid">
    <div class="breakdown-card">
      <div class="card-title">Day / Night Breakdown</div>
      <div class="breakdown-row"><span class="lbl">Day — Dual</span><span class="val">${fmt(entries.reduce((s, e) => s + (e.seDayDual || 0), 0))}</span></div>
      <div class="breakdown-row"><span class="lbl">Day — PIC</span><span class="val">${fmt(entries.reduce((s, e) => s + (e.seDayPilot || 0), 0))}</span></div>
      <div class="breakdown-row breakdown-subtotal"><span class="lbl">Total Day</span><span class="val">${totalDay.toFixed(1)}</span></div>
      <div class="breakdown-row" style="margin-top:6px"><span class="lbl">Night — Dual</span><span class="val">${fmt(entries.reduce((s, e) => s + (e.seNightDual || 0), 0))}</span></div>
      <div class="breakdown-row"><span class="lbl">Night — PIC</span><span class="val">${fmt(entries.reduce((s, e) => s + (e.seNightPilot || 0), 0))}</span></div>
      <div class="breakdown-row breakdown-subtotal"><span class="lbl">Total Night</span><span class="val">${totalNight.toFixed(1)}</span></div>
    </div>
    <div class="breakdown-card">
      <div class="card-title">Special Categories</div>
      <div class="breakdown-row"><span class="lbl">Instrument Time</span><span class="val">${fmt(totalInstrument)}</span></div>
      <div class="breakdown-row"><span class="lbl">Instructor — Day</span><span class="val">${fmt(entries.reduce((s, e) => s + (e.instructorDay || 0), 0))}</span></div>
      <div class="breakdown-row"><span class="lbl">Instructor — Night</span><span class="val">${fmt(entries.reduce((s, e) => s + (e.instructorNight || 0), 0))}</span></div>
      <div class="breakdown-row breakdown-subtotal"><span class="lbl">Total Instruction</span><span class="val">${totalInstructor.toFixed(1)}</span></div>
    </div>
  </div>

  <div class="footer">
    <div class="date">Generated ${today}</div>
    <div class="sig">
      <div class="sig-line"></div>
      <div class="sig-label">${pilotName}</div>
      <div class="sig-label" style="margin-top:2px">Pilot Signature</div>
  </div>

</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
