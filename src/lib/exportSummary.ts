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

  const today = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Flight Hours Summary — ${pilotName}</title>
<style>
  @page { size: A4 portrait; margin: 22mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.5; }
  
  .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1a1a1a; }
  .header h1 { font-size: 18pt; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px; }
  .header .pilot-name { font-size: 13pt; font-weight: 600; color: #333; margin-bottom: 2px; }
  .header .date-range { font-size: 9pt; color: #666; letter-spacing: 1px; }
  
  .hero { display: flex; justify-content: center; gap: 32px; margin: 20px 0 24px; }
  .hero-card { text-align: center; padding: 14px 28px; border: 1.5px solid #1a1a1a; border-radius: 4px; min-width: 130px; }
  .hero-card .value { font-size: 22pt; font-weight: 700; color: #1a1a1a; }
  .hero-card .label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-top: 2px; }
  
  .section { margin-bottom: 18px; }
  .section-title { font-size: 8pt; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 700; color: #1a1a1a; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
  
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; text-align: left; padding: 6px 10px; border-bottom: 1.5px solid #1a1a1a; color: #333; }
  th.num { text-align: right; }
  td { font-size: 9.5pt; padding: 5px 10px; border-bottom: 1px solid #e5e5e5; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tr:last-child td { border-bottom: none; }
  .total-row td { font-weight: 700; border-top: 1.5px solid #1a1a1a; border-bottom: none; padding-top: 8px; }
  
  .breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 18px; }
  .breakdown-card { border: 1px solid #ddd; border-radius: 4px; padding: 12px 14px; }
  .breakdown-card .card-title { font-size: 8pt; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 8px; color: #333; }
  .breakdown-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .breakdown-row .lbl { font-size: 9pt; color: #555; }
  .breakdown-row .val { font-size: 9.5pt; font-weight: 600; font-variant-numeric: tabular-nums; }
  .breakdown-subtotal { border-top: 1px solid #ccc; margin-top: 4px; padding-top: 4px; }
  .breakdown-subtotal .val { font-weight: 700; }
  
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; align-items: flex-end; }
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
    <div class="hero-card">
      <div class="value">${grandTotal.toFixed(1)}</div>
      <div class="label">Total Hours</div>
    </div>
    <div class="hero-card">
      <div class="value">${totalPIC.toFixed(1)}</div>
      <div class="label">Pilot in Command</div>
    </div>
    ${turbine.flights > 0 ? `<div class="hero-card">
      <div class="value">${turbine.hours.toFixed(1)}</div>
      <div class="label">Turbine Hours</div>
    </div>` : ''}
    <div class="hero-card">
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
      ${turbine.flights > 0 ? `
      <div class="breakdown-row" style="margin-top:6px"><span class="lbl">Turbine Hours</span><span class="val">${turbine.hours.toFixed(1)}</span></div>
      <div class="breakdown-row"><span class="lbl">Turbine Flights</span><span class="val">${turbine.flights}</span></div>` : ''}
    </div>
  </div>

  <div class="footer">
    <div class="date">Generated ${today}</div>
    <div class="sig">
      <div class="sig-line"></div>
      <div class="sig-label">Pilot Signature</div>
    </div>
  </div>

</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
