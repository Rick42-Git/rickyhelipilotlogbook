import { AircraftType, AircraftStation } from '@/data/aircraftData';

interface MassBalanceExportData {
  aircraft: AircraftType;
  weights: number[];
  totalWeight: number;
  totalMoment: number;
  cgStation: number;
  lateralCG: number;
  lateralMoment: number;
  weightMargin: number;
  withinLimits: boolean;
  lateralWithinLimits: boolean;
  signature?: {
    imageDataUrl: string;
    name: string;
    title: string;
  };
  aircraftReg?: string;
}

export function exportMassBalancePDF(data: MassBalanceExportData) {
  const {
    aircraft, weights, totalWeight, totalMoment, cgStation,
    lateralCG, lateralMoment, weightMargin, withinLimits, lateralWithinLimits, signature,
  } = data;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const statusText = withinLimits ? 'WITHIN LIMITS' : 'OUTSIDE LIMITS';
  const statusColor = withinLimits ? '#22c55e' : '#ef4444';
  const latDirection = lateralCG < -0.1 ? 'LEFT' : lateralCG > 0.1 ? 'RIGHT' : 'CENTER';

  const stationRows = aircraft.stations.map((s: AircraftStation, i: number) => {
    const w = weights[i];
    const longMom = w * s.station;
    const latMom = w * s.buttline;
    return `
      <tr style="${w > 0 ? '' : 'color:#888;'}">
        <td style="padding:6px 10px;border-bottom:1px solid #333;text-align:left;">${s.label}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;text-align:center;">STA ${s.station}" / BL ${s.buttline >= 0 ? '+' : ''}${s.buttline}"</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;text-align:right;font-weight:${w > 0 ? '600' : '400'};">${w > 0 ? w.toLocaleString() : '—'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;text-align:right;">${w > 0 ? Math.round(longMom).toLocaleString() : '—'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;text-align:right;">${latMom !== 0 ? (latMom > 0 ? '+' : '') + Math.round(latMom).toLocaleString() : '—'}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mass & Balance — ${aircraft.name}</title>
  <style>
    @media print {
      @page { margin: 15mm; size: A4; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; background: #fff; color: #111; font-size: 11px; line-height: 1.5; }
    .page { max-width: 750px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
    .title { font-size: 16px; font-weight: 700; letter-spacing: 2px; }
    .subtitle { font-size: 10px; color: #666; letter-spacing: 1px; margin-top: 2px; }
    .meta { text-align: right; font-size: 10px; color: #666; }
    .status-box { text-align: center; padding: 10px; margin-bottom: 16px; border: 2px solid ${statusColor}; background: ${statusColor}15; }
    .status-text { font-size: 18px; font-weight: 700; letter-spacing: 3px; color: ${statusColor}; }
    .section-title { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 16px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { padding: 6px 10px; text-align: left; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #666; border-bottom: 2px solid #333; }
    .total-row td { font-weight: 700; border-top: 2px solid #333; border-bottom: none; padding-top: 8px; }
    .results-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 8px; }
    .result-box { border: 1px solid #ccc; padding: 10px; text-align: center; }
    .result-label { font-size: 9px; color: #666; letter-spacing: 1px; text-transform: uppercase; }
    .result-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .result-unit { font-size: 10px; color: #888; }
    .limits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
    .limit-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ddd; font-size: 10px; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ccc; text-align: center; font-size: 9px; color: #999; }
    .warn { color: #ef4444; }
    .ok { color: #22c55e; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="title">MASS & BALANCE REPORT</div>
      <div class="subtitle">ROTARY WING AIRCRAFT LOADING SHEET</div>
    </div>
    <div class="meta">
      <div><strong>${aircraft.name}</strong></div>
      <div>${dateStr} · ${timeStr} UTC</div>
      <div>Max GW: ${aircraft.maxGrossWeight.toLocaleString()} lbs</div>
    </div>
  </div>

  <div class="status-box">
    <div class="status-text">${statusText}</div>
    ${!lateralWithinLimits ? '<div style="font-size:10px;color:#ef4444;margin-top:4px;">⚠ LATERAL CG EXCEEDS ±' + aircraft.lateralCGLimit + '" LIMIT</div>' : ''}
  </div>

  <div class="section-title">Calculated Results</div>
  <div class="results-grid">
    <div class="result-box">
      <div class="result-label">Gross Weight</div>
      <div class="result-value">${totalWeight.toLocaleString()}<span class="result-unit"> lbs</span></div>
      <div style="font-size:9px;margin-top:2px;" class="${weightMargin >= 0 ? 'ok' : 'warn'}">${weightMargin >= 0 ? '+' : ''}${weightMargin.toLocaleString()} lbs margin</div>
    </div>
    <div class="result-box">
      <div class="result-label">Longitudinal CG</div>
      <div class="result-value">${cgStation.toFixed(2)}<span class="result-unit"> in</span></div>
    </div>
    <div class="result-box">
      <div class="result-label">Lateral CG</div>
      <div class="result-value ${!lateralWithinLimits ? 'warn' : ''}">${lateralCG >= 0 ? '+' : ''}${lateralCG.toFixed(2)}<span class="result-unit"> in</span></div>
      <div style="font-size:9px;margin-top:2px;color:#666;">${latDirection} · Limit ±${aircraft.lateralCGLimit}"</div>
    </div>
  </div>

  <div class="section-title">Loading Sheet</div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;">Station</th>
        <th style="text-align:center;">Arm / BL</th>
        <th style="text-align:right;">Weight (lbs)</th>
        <th style="text-align:right;">Long. Moment</th>
        <th style="text-align:right;">Lat. Moment</th>
      </tr>
    </thead>
    <tbody>
      ${stationRows}
      <tr class="total-row">
        <td style="padding:8px 10px;" colspan="2">TOTAL</td>
        <td style="padding:8px 10px;text-align:right;">${totalWeight.toLocaleString()}</td>
        <td style="padding:8px 10px;text-align:right;">${Math.round(totalMoment).toLocaleString()}</td>
        <td style="padding:8px 10px;text-align:right;">${lateralMoment !== 0 ? (lateralMoment > 0 ? '+' : '') + Math.round(lateralMoment).toLocaleString() : '—'}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Aircraft Limits Reference</div>
  <div class="limits-grid">
    <div>
      <div class="limit-row"><span>Max Gross Weight</span><span>${aircraft.maxGrossWeight.toLocaleString()} lbs</span></div>
      <div class="limit-row"><span>Lateral CG Limit</span><span>±${aircraft.lateralCGLimit}"</span></div>
    </div>
    <div>
      <div class="limit-row"><span>CG Envelope Points</span><span>${aircraft.cgEnvelope.length} vertices</span></div>
      <div class="limit-row"><span>Stations Defined</span><span>${aircraft.stations.length}</span></div>
    </div>
  </div>

  ${signature ? `
  <div class="section-title">Authorization</div>
  <div style="display:flex;align-items:flex-end;gap:24px;margin-top:8px;">
    <div style="flex:1;">
      <img src="${signature.imageDataUrl}" style="max-height:60px;max-width:200px;" />
      <div style="border-top:1px solid #333;margin-top:4px;padding-top:4px;">
        <div style="font-size:11px;font-weight:700;">${signature.name || ''}</div>
        <div style="font-size:9px;color:#666;">${signature.title || ''}</div>
      </div>
    </div>
    <div style="flex:1;text-align:right;">
      <div style="font-size:10px;color:#666;">Date & Time</div>
      <div style="font-size:11px;font-weight:600;">${dateStr} ${timeStr} UTC</div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <div>FOR REFERENCE ONLY — VERIFY WITH OFFICIAL AIRCRAFT DOCUMENTATION</div>
    <div style="margin-top:4px;">Generated ${dateStr} ${timeStr} · ${aircraft.name} Mass & Balance Calculator</div>
  </div>
</div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}
