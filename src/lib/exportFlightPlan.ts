import { Waypoint, calcDistanceNm, calcBearing, formatTime } from '@/types/flightPlan';

interface ExportFlightPlanData {
  name: string;
  aircraftType: string;
  aircraftReg: string;
  pilotInCommand: string;
  groundSpeed: number;
  fuelBurnRate: number;
  fuelOnBoard: number;
  reserveFuel: number;
  waypoints: Waypoint[];
  notes: string;
}

interface Leg {
  from: Waypoint;
  to: Waypoint;
  distanceNm: number;
  bearing: number;
  timeMin: number;
  fuel: number;
  crossesBorder: boolean;
}

function buildLegs(waypoints: Waypoint[], groundSpeed: number, fuelBurnRate: number): Leg[] {
  const legs: Leg[] = [];
  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    const distanceNm = calcDistanceNm(from.lat, from.lng, to.lat, to.lng);
    const bearing = calcBearing(from.lat, from.lng, to.lat, to.lng);
    const timeMin = (distanceNm / groundSpeed) * 60;
    const fuel = (timeMin / 60) * fuelBurnRate;
    const crossesBorder = !!(from.country && to.country && from.country !== to.country);
    legs.push({ from, to, distanceNm, bearing, timeMin, fuel, crossesBorder });
  }
  return legs;
}

export function exportFlightPlanPDF(data: ExportFlightPlanData) {
  const legs = buildLegs(data.waypoints, data.groundSpeed, data.fuelBurnRate);
  const totalDist = legs.reduce((s, l) => s + l.distanceNm, 0);
  const totalTime = legs.reduce((s, l) => s + l.timeMin, 0);
  const totalFuel = legs.reduce((s, l) => s + l.fuel, 0);
  const fuelRemaining = data.fuelOnBoard - totalFuel;
  const fuelAfterReserve = fuelRemaining - data.reserveFuel;
  const countriesCrossed = [...new Set(data.waypoints.map(w => w.country).filter(Boolean))];
  const borderLegs = legs.filter(l => l.crossesBorder);
  const date = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });

  const waypointRows = data.waypoints.map((wp, i) => {
    const leg = i > 0 ? legs[i - 1] : null;
    return `
      <tr>
        <td style="font-weight:600">${i + 1}</td>
        <td style="font-weight:600">${wp.icao || '—'}</td>
        <td>${wp.name}</td>
        <td>${wp.lat.toFixed(4)}°</td>
        <td>${wp.lng.toFixed(4)}°</td>
        <td>${wp.altitude ? wp.altitude + ' ft' : '—'}</td>
        <td>${wp.country || '—'}</td>
        <td>${leg ? leg.distanceNm.toFixed(1) : '—'}</td>
        <td>${leg ? Math.round(leg.bearing) + '°' : '—'}</td>
        <td>${leg ? formatTime(leg.timeMin) : '—'}</td>
        <td>${leg ? leg.fuel.toFixed(1) + ' L' : '—'}</td>
        <td>${wp.hasCustoms ? '✓' : ''}</td>
        <td>${wp.hasFuel ? '✓' : ''}</td>
      </tr>`;
  }).join('');

  const borderRows = borderLegs.length > 0 ? borderLegs.map(l => `
    <tr>
      <td>${l.from.icao || l.from.name} → ${l.to.icao || l.to.name}</td>
      <td>${l.from.country} → ${l.to.country}</td>
      <td>${l.to.hasCustoms ? '✓ Customs at ' + (l.to.icao || 'destination') : '✗ No customs at destination'}</td>
    </tr>
  `).join('') : '<tr><td colspan="3" style="color:#888">No border crossings on this route.</td></tr>';

  const fuelWarning = data.fuelOnBoard > 0 && fuelRemaining < 0
    ? '<div style="color:#c0392b;font-weight:700;margin-top:8px">⚠ INSUFFICIENT FUEL — REFUEL STOP REQUIRED</div>'
    : data.fuelOnBoard > 0 && fuelAfterReserve < 0
    ? '<div style="color:#e67e22;font-weight:700;margin-top:8px">⚠ RESERVE FUEL COMPROMISED</div>'
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Flight Plan — ${data.name || 'Untitled'}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 9pt; color: #1a1a1a; line-height: 1.4; }
  h1 { font-size: 14pt; margin-bottom: 2px; letter-spacing: 2px; }
  h2 { font-size: 10pt; margin: 14px 0 6px; padding-bottom: 3px; border-bottom: 1.5px solid #333; letter-spacing: 1px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #000; }
  .header-right { text-align: right; font-size: 8pt; color: #555; }
  .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 16px; margin-bottom: 10px; }
  .info-item label { font-size: 7pt; color: #777; text-transform: uppercase; letter-spacing: 1px; display: block; }
  .info-item span { font-size: 10pt; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th { background: #222; color: #fff; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 5px; text-align: left; }
  td { padding: 3px 5px; border-bottom: 0.5px solid #ccc; font-size: 8pt; }
  tr:nth-child(even) td { background: #f5f5f5; }
  .totals-row td { font-weight: 700; border-top: 2px solid #333; border-bottom: none; background: #eee !important; }
  .fuel-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0; }
  .fuel-box { border: 1px solid #ccc; padding: 6px 8px; border-radius: 3px; }
  .fuel-box label { font-size: 7pt; color: #777; text-transform: uppercase; display: block; }
  .fuel-box span { font-size: 11pt; font-weight: 700; }
  .fuel-ok { color: #27ae60; }
  .fuel-warn { color: #c0392b; }
  .notes-box { border: 1px solid #ccc; padding: 8px; border-radius: 3px; font-size: 8pt; white-space: pre-wrap; min-height: 40px; }
  .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #999; display: flex; justify-content: space-between; font-size: 7pt; color: #888; }
  .sig-line { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .sig-line div { border-top: 1px solid #333; padding-top: 4px; font-size: 7pt; color: #555; text-transform: uppercase; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>✈ FLIGHT PLAN</h1>
      <div style="font-size:11pt;font-weight:700;margin-top:2px">${data.name || 'Untitled Plan'}</div>
    </div>
    <div class="header-right">
      <div>Generated: ${date}</div>
      <div>HELI PILOT LOGBOOK</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item"><label>Aircraft Type</label><span>${data.aircraftType || '—'}</span></div>
    <div class="info-item"><label>Registration</label><span>${data.aircraftReg || '—'}</span></div>
    <div class="info-item"><label>Pilot in Command</label><span>${data.pilotInCommand || '—'}</span></div>
    <div class="info-item"><label>Ground Speed</label><span>${data.groundSpeed} KTS</span></div>
  </div>

  <h2>ROUTE (${data.waypoints.length} WAYPOINTS)</h2>
  ${data.waypoints.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>#</th><th>ICAO</th><th>Name</th><th>Lat</th><th>Lng</th><th>Elev</th><th>Country</th>
        <th>Dist</th><th>HDG</th><th>ETE</th><th>Fuel</th><th>Cust</th><th>Fuel</th>
      </tr>
    </thead>
    <tbody>
      ${waypointRows}
      <tr class="totals-row">
        <td colspan="7" style="text-align:right">TOTALS</td>
        <td>${totalDist.toFixed(1)} NM</td>
        <td></td>
        <td>${formatTime(totalTime)}</td>
        <td>${totalFuel.toFixed(1)} L</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>` : '<p style="color:#888;margin:10px 0">No waypoints in this plan.</p>'}

  ${data.waypoints.length > 0 ? `
  <div style="font-size:8pt;color:#555;margin-bottom:10px">
    <strong>Route:</strong> ${data.waypoints.map(w => w.icao || w.name.split(' ')[0]).join(' → ')}
    ${countriesCrossed.length > 1 ? `<br><strong>Countries:</strong> ${countriesCrossed.join(' → ')}` : ''}
  </div>` : ''}

  <h2>FUEL CALCULATIONS</h2>
  <div class="fuel-summary">
    <div class="fuel-box"><label>Fuel on Board</label><span>${data.fuelOnBoard > 0 ? data.fuelOnBoard + ' L' : '—'}</span></div>
    <div class="fuel-box"><label>Fuel Required</label><span>${totalFuel.toFixed(1)} L</span></div>
    <div class="fuel-box"><label>Fuel Remaining</label><span class="${fuelRemaining >= 0 ? 'fuel-ok' : 'fuel-warn'}">${data.fuelOnBoard > 0 ? fuelRemaining.toFixed(1) + ' L' : '—'}</span></div>
    <div class="fuel-box"><label>Burn Rate</label><span>${data.fuelBurnRate} L/hr</span></div>
    <div class="fuel-box"><label>Reserve Fuel</label><span>${data.reserveFuel > 0 ? data.reserveFuel + ' L' : '—'}</span></div>
    <div class="fuel-box"><label>After Reserve</label><span class="${fuelAfterReserve >= 0 ? 'fuel-ok' : 'fuel-warn'}">${data.fuelOnBoard > 0 && data.reserveFuel > 0 ? fuelAfterReserve.toFixed(1) + ' L' : '—'}</span></div>
  </div>
  ${fuelWarning}

  <h2>BORDER CROSSINGS & CUSTOMS</h2>
  <table>
    <thead><tr><th>Leg</th><th>Countries</th><th>Customs Status</th></tr></thead>
    <tbody>${borderRows}</tbody>
  </table>
  ${borderLegs.length > 0 ? '<div style="font-size:7pt;color:#888;margin-top:4px">⚠ Always confirm customs hours & requirements before flight. File GenDec / flight plan as required by each country.</div>' : ''}

  ${data.notes ? `<h2>FLIGHT NOTES</h2><div class="notes-box">${data.notes.replace(/\n/g, '<br>')}</div>` : ''}

  <div class="sig-line">
    <div>Pilot in Command Signature</div>
    <div>Date</div>
  </div>

  <div class="footer">
    <span>Generated by Heli Pilot Logbook</span>
    <span>This document is for planning purposes only. Verify all data before flight.</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    // Small delay to let styles render before print dialog
    setTimeout(() => win.print(), 400);
  }
}
