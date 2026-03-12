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
  const sorted = [...entries].sort((a, b) => (a.date > b.date ? -1 : 1));

  let html = '';

  for (let s = fromSpread; s <= toSpread; s++) {
    const spreadEntries = sorted.slice(s * ROWS_PER_SPREAD, s * ROWS_PER_SPREAD + ROWS_PER_SPREAD);
    const emptyRows = ROWS_PER_SPREAD - spreadEntries.length;

    const totals = spreadEntries.reduce((t, e) => ({
      seDayPilot: t.seDayPilot + e.seDayPilot,
      seDayDual: t.seDayDual + e.seDayDual,
      seNightDual: t.seNightDual + e.seNightDual,
      seNightPilot: t.seNightPilot + e.seNightPilot,
      instrumentTime: t.instrumentTime + e.instrumentTime,
      instructorDay: t.instructorDay + e.instructorDay,
      instructorNight: t.instructorNight + e.instructorNight,
    }), { seDayPilot: 0, seDayDual: 0, seNightDual: 0, seNightPilot: 0, instrumentTime: 0, instructorDay: 0, instructorNight: 0 });

    const year = spreadEntries.length > 0 ? getMonthDay(spreadEntries[0].date).year : '';

    let rows = '';
    let prevMonth = '';
    spreadEntries.forEach((e) => {
      const { month, day } = getMonthDay(e.date);
      const showMonth = month !== prevMonth;
      prevMonth = month;
      rows += `<tr>
        <td class="td-l">${showMonth ? month : '&quot;'}</td>
        <td class="td">${day}</td>
        <td class="td-l" style="font-size:8px">${e.aircraftType}</td>
        <td class="td reg">${e.aircraftReg}</td>
        <td class="td-l" style="font-size:8px;max-width:90px;overflow:hidden;text-overflow:ellipsis">${e.pilotInCommand}</td>
        <td class="td-l" style="font-size:8px;max-width:120px;overflow:hidden;text-overflow:ellipsis;border-right:2px solid #8a7a60">${e.flightDetails}</td>
        <td class="td day">${fmt(e.seDayPilot)}</td>
        <td class="td day">${fmt(e.seDayDual)}</td>
        <td class="td night">${fmt(e.seNightDual)}</td>
        <td class="td night">${fmt(e.seNightPilot)}</td>
        <td class="td">${fmt(e.instrumentTime)}</td>
        <td class="td inst">${fmt(e.instructorDay)}</td>
        <td class="td inst" style="border-right:none">${fmt(e.instructorNight)}</td>
      </tr>`;
    });

    for (let i = 0; i < emptyRows; i++) {
      rows += `<tr>
        <td class="td-l">&nbsp;</td><td class="td">&nbsp;</td><td class="td-l">&nbsp;</td>
        <td class="td">&nbsp;</td><td class="td-l">&nbsp;</td>
        <td class="td-l" style="border-right:2px solid #8a7a60">&nbsp;</td>
        <td class="td">&nbsp;</td><td class="td">&nbsp;</td><td class="td">&nbsp;</td>
        <td class="td">&nbsp;</td><td class="td">&nbsp;</td><td class="td">&nbsp;</td>
        <td class="td" style="border-right:none">&nbsp;</td>
      </tr>`;
    }

    html += `
    <div class="spread ${s > fromSpread ? 'page-break' : ''}">
      <table>
        <thead>
          <tr>
            <th colspan="6" class="hdr-group" style="border-right:2px solid #8a7a60">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>YEAR ${year}</span>
                <span style="font-size:7px;font-weight:normal;color:#999">Pages ${s * 2 + 1}–${s * 2 + 2}</span>
              </div>
            </th>
            <th colspan="2" class="hdr-group day-hdr">DAY</th>
            <th colspan="2" class="hdr-group night-hdr">NIGHT</th>
            <th class="hdr-group">INSTR</th>
            <th colspan="2" class="hdr-group inst-hdr" style="border-right:none">INSTRUCTOR</th>
          </tr>
          <tr>
            <th class="sub-hdr" style="width:44px">Month</th>
            <th class="sub-hdr" style="width:30px">Day</th>
            <th class="sub-hdr" style="width:60px">Type</th>
            <th class="sub-hdr" style="width:50px">Reg</th>
            <th class="sub-hdr" style="width:90px">PIC</th>
            <th class="sub-hdr" style="border-right:2px solid #8a7a60">Details</th>
            <th class="sub-hdr day-hdr">Pilot</th>
            <th class="sub-hdr day-hdr">Dual</th>
            <th class="sub-hdr night-hdr">Dual</th>
            <th class="sub-hdr night-hdr">Pilot</th>
            <th class="sub-hdr">Time</th>
            <th class="sub-hdr inst-hdr">Day</th>
            <th class="sub-hdr inst-hdr" style="border-right:none">Night</th>
          </tr>
          <tr class="cf-row">
            <td colspan="6" class="td-l" style="font-style:italic;color:#888;border-right:2px solid #8a7a60">Totals Carried Forward</td>
            <td class="td">&nbsp;</td><td class="td">&nbsp;</td><td class="td">&nbsp;</td>
            <td class="td">&nbsp;</td><td class="td">&nbsp;</td><td class="td">&nbsp;</td>
            <td class="td" style="border-right:none">&nbsp;</td>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="6" class="td-l" style="font-style:italic;font-weight:bold;color:#555;border-right:2px solid #8a7a60">Page Totals</td>
            <td class="td total-val day">${fmt(totals.seDayPilot)}</td>
            <td class="td total-val day">${fmt(totals.seDayDual)}</td>
            <td class="td total-val night">${fmt(totals.seNightDual)}</td>
            <td class="td total-val night">${fmt(totals.seNightPilot)}</td>
            <td class="td total-val">${fmt(totals.instrumentTime)}</td>
            <td class="td total-val inst">${fmt(totals.instructorDay)}</td>
            <td class="td total-val inst" style="border-right:none">${fmt(totals.instructorNight)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
  }

  const doc = `<!DOCTYPE html>
<html>
<head>
<title>Pilot Logbook – Pages ${fromSpread * 2 + 1} to ${(toSpread + 1) * 2}</title>
<style>
  @page { size: landscape A4; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 9px; color: #2a2520; background: #f5f0e8; }
  .page-break { page-break-before: always; }
  .spread { width: 100%; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; border: 2px solid #8a7a60; }
  .hdr-group { padding: 4px 6px; font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px;
    border-bottom: 2px solid #8a7a60; border-right: 1px solid #c0b69d; background: #e8e0d0; color: #4a4035; }
  .sub-hdr { padding: 3px 4px; font-size: 7px; text-transform: uppercase; letter-spacing: 1px;
    border-bottom: 2px solid #8a7a60; border-right: 1px solid #c0b69d; background: #ede7da; color: #5a5045; }
  .day-hdr { color: #2a6090; }
  .night-hdr { color: #a03030; }
  .inst-hdr { color: #2a6a3a; }
  .cf-row td { background: #e8e0d0; }
  .td { padding: 2px 4px; text-align: center; border-right: 1px solid #d8d0c0; border-bottom: 1px solid #d0d8e0; font-size: 9px; white-space: nowrap; }
  .td-l { padding: 2px 4px; text-align: left; border-right: 1px solid #d8d0c0; border-bottom: 1px solid #d0d8e0; font-size: 9px; white-space: nowrap; }
  .reg { color: #2a6090; font-weight: bold; }
  .day { color: #2a6090; }
  .night { color: #a03030; }
  .inst { color: #2a6a3a; }
  .totals-row td { background: #e8e0d0; border-top: 2px solid #8a7a60; }
  .total-val { font-weight: bold; }
  @media print {
    body { background: white; }
    .spread { margin-bottom: 0; }
  }
</style>
</head>
<body>${html}</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(doc);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }
}
