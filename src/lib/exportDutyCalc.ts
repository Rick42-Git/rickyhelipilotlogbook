interface DutyRow {
  date: string;
  details: string;
  flightHours: number;
  reportTime: string;
  rotorStop: string;
  sectors: number;
  actualFDP: number;
  maxFDP: number;
  exceeded: boolean;
  fdpExceeded: boolean;
  flightTimeExceeded: boolean;
}

interface DutySummary {
  month: string;
  flyingDays: number;
  totalFlights: number;
  totalFlightHours: number;
  totalDutyHours: number;
  exceedCount: number;
  rows: DutyRow[];
}

export function exportDutyCalcPDF(data: DutySummary) {
  const flightTimeExceedCount = data.rows.filter(r => r.flightTimeExceeded).length;
  const totalExceedCount = data.exceedCount + flightTimeExceedCount;

  const rows = data.rows.map(r => {
    const fltColor = r.flightTimeExceeded ? 'color:#dc2626;' : 'color:#2563eb;';
    const fltNote = r.flightTimeExceeded ? ' <span style="font-size:7px">▸7h</span>' : '';
    const anyExceeded = r.fdpExceeded || r.flightTimeExceeded;
    return `
    <tr style="${anyExceeded ? 'background:#fef2f2;' : ''}">
      <td>${r.date}</td>
      <td style="font-size:9px;color:#666;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.details}</td>
      <td style="font-weight:600;${fltColor}">${r.flightHours.toFixed(1)}${fltNote}</td>
      <td>${r.reportTime}</td>
      <td>${r.rotorStop}</td>
      <td style="text-align:center">${r.sectors}</td>
      <td style="font-weight:600">${r.actualFDP.toFixed(1)}</td>
      <td>${r.maxFDP.toFixed(1)}</td>
      <td style="text-align:center;font-weight:700;color:${anyExceeded ? '#dc2626' : '#16a34a'}">${anyExceeded ? '✗' : '✓'}</td>
    </tr>`;
  }).join('');

  let footerStatus: string;
  if (totalExceedCount > 0) {
    const parts: string[] = [];
    if (data.exceedCount > 0) parts.push(`${data.exceedCount} FDP`);
    if (flightTimeExceedCount > 0) parts.push(`${flightTimeExceedCount} FLT TIME`);
    footerStatus = `<span class="danger" style="font-weight:700">⚠ ${parts.join(' + ')} LIMIT(S) EXCEEDED</span>`;
  } else {
    footerStatus = `<span class="success" style="font-weight:700">✓ ALL WITHIN LEGAL LIMITS</span>`;
  }

  const html = `<html><head><meta charset="utf-8"><title>F&D Report — ${data.month}</title>
<style>
  @page{size:A4 landscape;margin:12mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,system-ui,sans-serif;font-size:11px;color:#1a1a1a;padding:10px}
  h1{font-size:14px;font-weight:700;margin-bottom:2px;letter-spacing:1px}
  .sub{font-size:10px;color:#666;margin-bottom:10px}
  .cards{display:flex;gap:12px;margin-bottom:12px}
  .card{border:1px solid #ddd;border-radius:6px;padding:8px 14px;flex:1;text-align:center}
  .card .label{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:2px}
  .card .val{font-size:18px;font-weight:700}
  .primary{color:#2563eb}
  .danger{color:#dc2626}
  .success{color:#16a34a}
  table{width:100%;border-collapse:collapse;font-size:10px}
  th{background:#f4f4f5;font-size:8px;text-transform:uppercase;letter-spacing:0.5px;color:#666;padding:5px 6px;text-align:left;border-bottom:2px solid #ddd}
  td{padding:4px 6px;border-bottom:1px solid #eee}
  .footer{margin-top:10px;padding-top:6px;border-top:2px solid #ddd;font-size:10px;display:flex;justify-content:space-between}
  .note{font-size:8px;color:#888;margin-top:4px}
</style></head><body>
<h1>▸ FLIGHT & DUTY REPORT (SACAA)</h1>
<div class="sub">${data.month} · Max daily flight time: 7.0 h · FDP per SACAA Part 135/127</div>
<div class="cards">
  <div class="card"><div class="label">Flying Days</div><div class="val">${data.flyingDays}</div></div>
  <div class="card"><div class="label">Total Flights</div><div class="val">${data.totalFlights}</div></div>
  <div class="card"><div class="label">Flight Hours</div><div class="val primary">${data.totalFlightHours.toFixed(1)} h</div></div>
  <div class="card"><div class="label">Duty Hours</div><div class="val">${data.totalDutyHours.toFixed(1)} h</div></div>
</div>
<table>
  <thead><tr><th>Date</th><th>Details</th><th>Flt Hrs</th><th>Report</th><th>Rotor Stop</th><th>Sectors</th><th>Act FDP</th><th>Max FDP</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">
  <span>${data.flyingDays} DAYS — <b class="primary">${data.totalFlightHours.toFixed(1)}</b> FLT HRS — <b>${data.totalDutyHours.toFixed(1)}</b> DUTY HRS</span>
  ${footerStatus}
</div>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.print(); };
}
