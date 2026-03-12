import { LogbookEntry } from '@/types/logbook';

const ROWS_PER_SPREAD = 22;

function fmt(n: number) { return n > 0 ? n.toFixed(1) : ''; }

function getMonthDay(iso: string) {
  if (!iso) return { month: '', day: '', year: '' };
  const [y, m, d] = iso.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return { month: months[parseInt(m)] || m, day: d || '', year: y || '' };
}

export function exportBookPagesPDF(
  entries: LogbookEntry[],
  fromSpread: number,
  toSpread: number,
) {
  const sorted = [...entries].sort((a, b) => (a.date > b.date ? 1 : -1));

  let spreadsHtml = '';

  for (let s = fromSpread; s <= toSpread; s++) {
    const spreadEntries = sorted.slice(s * ROWS_PER_SPREAD, s * ROWS_PER_SPREAD + ROWS_PER_SPREAD);
    const emptyRows = ROWS_PER_SPREAD - spreadEntries.length;
    const year = spreadEntries.length > 0 ? getMonthDay(spreadEntries[0].date).year : '';

    const totals = spreadEntries.reduce((t, e) => ({
      seDayPilot: t.seDayPilot + e.seDayPilot,
      seDayDual: t.seDayDual + e.seDayDual,
      seNightDual: t.seNightDual + e.seNightDual,
      seNightPilot: t.seNightPilot + e.seNightPilot,
      instrumentTime: t.instrumentTime + e.instrumentTime,
      instructorDay: t.instructorDay + e.instructorDay,
      instructorNight: t.instructorNight + e.instructorNight,
    }), { seDayPilot: 0, seDayDual: 0, seNightDual: 0, seNightPilot: 0, instrumentTime: 0, instructorDay: 0, instructorNight: 0 });

    // Build left-page rows
    let leftRows = '';
    let rightRows = '';
    let prevMonth = '';
    spreadEntries.forEach((e) => {
      const { month, day } = getMonthDay(e.date);
      const showMonth = month !== prevMonth;
      prevMonth = month;
      leftRows += `<tr class="entry-row">
        <td class="td-l">${showMonth ? month : '&ldquo;'}</td>
        <td class="td-c">${day}</td>
        <td class="td-l type-cell">${e.aircraftType}</td>
        <td class="td-c reg">${e.aircraftReg}</td>
        <td class="td-l pic-cell">${e.pilotInCommand}</td>
        <td class="td-l details-cell">${e.flightDetails}</td>
      </tr>`;
      rightRows += `<tr class="entry-row">
        <td class="td-c day-val">${fmt(e.seDayPilot)}</td>
        <td class="td-c day-val">${fmt(e.seDayDual)}</td>
        <td class="td-c night-val">${fmt(e.seNightDual)}</td>
        <td class="td-c night-val">${fmt(e.seNightPilot)}</td>
        <td class="td-c">${fmt(e.instrumentTime)}</td>
        <td class="td-c inst-val">${fmt(e.instructorDay)}</td>
        <td class="td-c inst-val last-col">${fmt(e.instructorNight)}</td>
      </tr>`;
    });

    for (let i = 0; i < emptyRows; i++) {
      leftRows += `<tr class="entry-row empty-row"><td class="td-l"></td><td class="td-c"></td><td class="td-l"></td><td class="td-c"></td><td class="td-l"></td><td class="td-l"></td></tr>`;
      rightRows += `<tr class="entry-row empty-row"><td class="td-c"></td><td class="td-c"></td><td class="td-c"></td><td class="td-c"></td><td class="td-c"></td><td class="td-c"></td><td class="td-c last-col"></td></tr>`;
    }

    spreadsHtml += `
    <div class="spread ${s > fromSpread ? 'page-break' : ''}">
      <!-- Page edges left -->
      <div class="page-edges left-edges"></div>
      <!-- Page edges right -->
      <div class="page-edges right-edges"></div>
      <!-- Spine -->
      <div class="spine"></div>

      <div class="pages">
        <!-- LEFT PAGE -->
        <div class="page left-page">
          <div class="page-header">
            <span class="year-label">Year <strong>${year}</strong></span>
            <span class="page-num">Page ${s * 2 + 1}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th class="col-hdr" style="width:48px">Month</th>
                <th class="col-hdr" style="width:32px">Day</th>
                <th class="col-hdr" style="width:62px">Type</th>
                <th class="col-hdr" style="width:52px">Reg</th>
                <th class="col-hdr" style="width:95px">Pilot in Command</th>
                <th class="col-hdr">Flight Details</th>
              </tr>
            </thead>
            <tbody>
              <tr class="cf-row"><td colspan="6" class="td-l cf-label">Totals Carried Forward</td></tr>
              ${leftRows}
              <tr class="totals-row"><td colspan="6" class="td-l totals-label">Totals This Page</td></tr>
            </tbody>
          </table>
        </div>
        <!-- RIGHT PAGE -->
        <div class="page right-page">
          <div class="page-header">
            <span class="section-label">Single Engine Aircraft</span>
            <span class="page-num">Page ${s * 2 + 2}</span>
          </div>
          <table>
            <thead>
              <tr class="group-hdr-row">
                <th colspan="2" class="group-hdr day-hdr">Day</th>
                <th colspan="2" class="group-hdr night-hdr">Night</th>
                <th class="group-hdr">Instr</th>
                <th colspan="2" class="group-hdr inst-hdr last-col">Instructor</th>
              </tr>
              <tr>
                <th class="col-hdr day-hdr">Pilot</th>
                <th class="col-hdr day-hdr">Dual</th>
                <th class="col-hdr night-hdr">Dual</th>
                <th class="col-hdr night-hdr">Pilot</th>
                <th class="col-hdr">Time</th>
                <th class="col-hdr inst-hdr">Day</th>
                <th class="col-hdr inst-hdr last-col">Night</th>
              </tr>
            </thead>
            <tbody>
              <tr class="cf-row">
                <td class="td-c"></td><td class="td-c"></td><td class="td-c"></td>
                <td class="td-c"></td><td class="td-c"></td><td class="td-c"></td>
                <td class="td-c last-col"></td>
              </tr>
              ${rightRows}
              <tr class="totals-row">
                <td class="td-c total-val day-val">${fmt(totals.seDayPilot)}</td>
                <td class="td-c total-val day-val">${fmt(totals.seDayDual)}</td>
                <td class="td-c total-val night-val">${fmt(totals.seNightDual)}</td>
                <td class="td-c total-val night-val">${fmt(totals.seNightPilot)}</td>
                <td class="td-c total-val">${fmt(totals.instrumentTime)}</td>
                <td class="td-c total-val inst-val">${fmt(totals.instructorDay)}</td>
                <td class="td-c total-val inst-val last-col">${fmt(totals.instructorNight)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  const doc = `<!DOCTYPE html>
<html>
<head>
<title>Pilot Logbook – Pages ${fromSpread * 2 + 1} to ${(toSpread + 1) * 2}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
  @page { size: landscape A4; margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 9px;
    color: #3a3530;
    background: #1a1a1f;
    padding: 16px;
  }

  .page-break { page-break-before: always; }

  /* ===== Spread container ===== */
  .spread {
    position: relative;
    margin-bottom: 20px;
    border-radius: 6px;
    overflow: hidden;
    box-shadow:
      0 8px 40px rgba(0,0,0,0.5),
      0 2px 8px rgba(0,0,0,0.3);
  }

  /* Page edges */
  .page-edges {
    position: absolute;
    top: 4px;
    bottom: 4px;
    width: 4px;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 0.5px;
  }
  .page-edges::before,
  .page-edges::after,
  .page-edges {
    /* Using background stripes */
  }
  .left-edges { left: 0; }
  .right-edges { right: 0; }
  .left-edges { background: repeating-linear-gradient(to bottom, #cdc5b5 0px, #cdc5b5 3px, #d8d0c2 3px, #d8d0c2 6px); border-radius: 3px 0 0 3px; }
  .right-edges { background: repeating-linear-gradient(to bottom, #cdc5b5 0px, #cdc5b5 3px, #d8d0c2 3px, #d8d0c2 6px); border-radius: 0 3px 3px 0; }

  /* Spine center */
  .spine {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 24px;
    transform: translateX(-50%);
    z-index: 10;
    background: linear-gradient(to right,
      transparent 0%,
      rgba(60,50,35,0.12) 25%,
      rgba(60,50,35,0.22) 50%,
      rgba(60,50,35,0.12) 75%,
      transparent 100%
    );
    pointer-events: none;
  }

  /* Pages flex layout */
  .pages {
    display: flex;
    width: 100%;
  }

  .page {
    flex: 1;
    min-width: 0;
    background: linear-gradient(135deg, #ede8dc 0%, #e5dfcf 100%);
    padding: 0;
  }

  .left-page {
    border-right: 1px solid rgba(140,125,100,0.2);
  }

  /* Page header */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px 4px;
    border-bottom: 1px solid rgba(140,125,100,0.35);
  }
  .year-label {
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #5a5045;
  }
  .section-label {
    font-size: 7px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #8a8070;
  }
  .page-num {
    font-size: 7px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #a09888;
  }

  /* Tables */
  table { width: 100%; border-collapse: collapse; }

  /* Column headers */
  .col-hdr {
    padding: 3px 5px;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    text-align: center;
    white-space: nowrap;
    border-right: 1px solid rgba(140,125,100,0.35);
    border-bottom: 1px solid rgba(140,125,100,0.35);
    color: #5a5045;
    font-weight: 600;
  }
  .col-hdr:last-child, .last-col { border-right: none !important; }

  /* Group headers (Day/Night/Instructor) */
  .group-hdr {
    padding: 2px 5px;
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-align: center;
    border-right: 1px solid rgba(140,125,100,0.35);
    border-bottom: 1px solid rgba(140,125,100,0.35);
    font-weight: 700;
    color: #5a5045;
  }

  /* Color coding */
  .day-hdr { color: #2a6090 !important; }
  .night-hdr { color: #a03030 !important; }
  .inst-hdr { color: #2a6a3a !important; }
  .day-val { color: #2a6090; }
  .night-val { color: #a03030; }
  .inst-val { color: #2a6a3a; }
  .reg { color: #2a6090; font-weight: 600; }

  /* Cell styles */
  .td-c {
    padding: 2px 4px;
    text-align: center;
    border-right: 1px solid rgba(140,125,100,0.35);
    border-bottom: 1px solid rgba(170,190,210,0.25);
    font-size: 9px;
    white-space: nowrap;
  }
  .td-l {
    padding: 2px 5px;
    text-align: left;
    border-right: 1px solid rgba(140,125,100,0.35);
    border-bottom: 1px solid rgba(170,190,210,0.25);
    font-size: 9px;
    white-space: nowrap;
  }

  .type-cell { font-size: 8px; }
  .pic-cell { font-size: 8px; max-width: 90px; overflow: hidden; text-overflow: ellipsis; }
  .details-cell { font-size: 8px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; border-right: none !important; }

  /* Entry rows */
  .entry-row { height: 20px; }
  .empty-row td { height: 20px; }

  /* Carried forward row */
  .cf-row td {
    background: rgba(200,190,170,0.35);
    border-bottom: 1px solid rgba(140,125,100,0.3);
  }
  .cf-label {
    font-style: italic;
    color: #8a8070;
    border-right: none !important;
  }

  /* Totals row */
  .totals-row td {
    background: rgba(200,190,170,0.35);
    border-top: 1px solid rgba(140,125,100,0.4);
    border-bottom: none;
  }
  .totals-label {
    font-style: italic;
    font-weight: 600;
    color: #6a6055;
    border-right: none !important;
  }
  .total-val { font-weight: 700; }

  /* Print overrides */
  @media print {
    body { background: white; padding: 0; }
    .spread { box-shadow: none; margin-bottom: 0; border: 1px solid #ccc; }
    .spine { display: none; }
    .page-edges { display: none; }
  }
</style>
</head>
<body>${spreadsHtml}</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(doc);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
