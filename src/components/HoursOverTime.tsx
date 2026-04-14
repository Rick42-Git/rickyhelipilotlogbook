import { useMemo, useState } from 'react';
import { LogbookEntry } from '@/types/logbook';

interface HoursOverTimeProps {
  entries: LogbookEntry[];
}

type Period = 'week' | 'month' | 'year' | 'all';

function getEntryHours(e: LogbookEntry) {
  return (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
}

function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getYearKey(date: Date): string {
  return `${date.getFullYear()}`;
}

function formatLabel(key: string, period: Period): string {
  if (period === 'week') {
    const [, m, d] = key.split('-');
    return `${d}/${m}`;
  }
  if (period === 'month') {
    const [y, m] = key.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
  }
  if (period === 'year') return key;
  return key;
}

function generateAllKeys(entries: { date: Date }[], period: Period): string[] {
  if (entries.length === 0) return [];
  const sorted = entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  const start = sorted[0].date;
  const end = sorted[sorted.length - 1].date;
  const keys: string[] = [];

  if (period === 'week') {
    const d = new Date(start);
    d.setDate(d.getDate() - d.getDay() + 1);
    while (d <= end) {
      keys.push(getWeekKey(d));
      d.setDate(d.getDate() + 7);
    }
  } else if (period === 'month') {
    const d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= end) {
      keys.push(getMonthKey(d));
      d.setMonth(d.getMonth() + 1);
    }
  } else if (period === 'year') {
    for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
      keys.push(String(y));
    }
  }
  return keys;
}

export function HoursOverTime({ entries }: HoursOverTimeProps) {
  const [period, setPeriod] = useState<Period>('month');

  const chartData = useMemo(() => {
    const parsed = entries
      .map(e => ({ date: parseDate(e.date), hours: getEntryHours(e) }))
      .filter((e): e is { date: Date; hours: number } => e.date !== null);

    if (parsed.length === 0) return [];

    const getKey = period === 'week' ? getWeekKey : period === 'month' ? getMonthKey : getYearKey;

    // For "all" period, show a single cumulative line
    if (period === 'all') {
      parsed.sort((a, b) => a.date.getTime() - b.date.getTime());
      let cumulative = 0;
      const points: { key: string; label: string; hours: number; cumulative: number }[] = [];
      const monthMap: Record<string, number> = {};
      for (const p of parsed) {
        const mk = getMonthKey(p.date);
        monthMap[mk] = (monthMap[mk] || 0) + p.hours;
      }
      const allMonths = generateAllKeys(parsed, 'month');
      for (const mk of allMonths) {
        cumulative += monthMap[mk] || 0;
        points.push({ key: mk, label: formatLabel(mk, 'month'), hours: monthMap[mk] || 0, cumulative });
      }
      return points;
    }

    const allKeys = generateAllKeys(parsed, period);
    const grouped: Record<string, number> = {};
    for (const p of parsed) {
      const k = getKey(p.date);
      grouped[k] = (grouped[k] || 0) + p.hours;
    }

    let cumulative = 0;
    return allKeys.map(k => {
      const hours = grouped[k] || 0;
      cumulative += hours;
      return { key: k, label: formatLabel(k, period), hours, cumulative };
    });
  }, [entries, period]);

  if (entries.length === 0) return null;

  const maxHours = Math.max(...chartData.map(d => d.hours), 1);
  const maxCumulative = Math.max(...chartData.map(d => d.cumulative), 1);
  const totalHours = chartData.reduce((s, d) => s + d.hours, 0);

  // SVG chart dimensions
  const width = 600;
  const height = 200;
  const padL = 40;
  const padR = 10;
  const padT = 15;
  const padB = 35;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  // Limit displayed bars for readability
  const maxBars = period === 'week' ? 26 : period === 'month' ? 36 : 20;
  const displayData = chartData.length > maxBars ? chartData.slice(-maxBars) : chartData;
  const barW = Math.min(chartW / displayData.length, 30);
  const gap = Math.max((chartW - barW * displayData.length) / Math.max(displayData.length - 1, 1), 1);

  // Cumulative line points
  const displayMaxCum = Math.max(...displayData.map(d => d.cumulative), 1);
  const linePoints = displayData.map((d, i) => {
    const x = padL + i * (barW + gap) + barW / 2;
    const y = padT + chartH - (d.cumulative / displayMaxCum) * chartH;
    return `${x},${y}`;
  }).join(' ');

  // Y-axis labels for bars
  const yTicks = [0, Math.round(maxHours / 2), Math.round(maxHours)];

  // Label every nth bar
  const labelEvery = displayData.length > 20 ? Math.ceil(displayData.length / 10) : displayData.length > 10 ? 2 : 1;

  const periods: { key: Period; label: string }[] = [
    { key: 'week', label: 'Weekly' },
    { key: 'month', label: 'Monthly' },
    { key: 'year', label: 'Yearly' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between border-b border-border pb-1 mb-3">
        <p className="font-mono text-[9px] text-accent uppercase tracking-widest">Hours Over Time</p>
        <div className="flex gap-0.5">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`font-mono text-[8px] uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                period === p.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-3 mb-3">
        {displayData.length > 0 && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-amber-400 to-amber-500" />
              <span className="font-mono text-[8px] text-muted-foreground">Period hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-cyan-400 rounded" />
              <span className="font-mono text-[8px] text-muted-foreground">Cumulative</span>
            </div>
            <span className="font-mono text-[9px] text-foreground ml-auto tabular-nums">
              Avg: <span className="font-semibold">{(totalHours / displayData.length).toFixed(1)}</span> hrs/{period === 'week' ? 'wk' : period === 'month' ? 'mo' : 'yr'}
            </span>
          </>
        )}
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: displayData.length > 15 ? 500 : 'auto' }}>
          {/* Grid lines */}
          {yTicks.map((t, i) => {
            const y = padT + chartH - (t / maxHours) * chartH;
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="4,3" />
                <text x={padL - 4} y={y + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 8, fontFamily: 'ui-monospace, monospace' }}>{t}</text>
              </g>
            );
          })}

          {/* Bars */}
          {displayData.map((d, i) => {
            const x = padL + i * (barW + gap);
            const barH = (d.hours / maxHours) * chartH;
            return (
              <g key={d.key}>
                <defs>
                  <linearGradient id={`bar-grad-${i}`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <rect
                  x={x}
                  y={padT + chartH - barH}
                  width={barW}
                  height={Math.max(barH, d.hours > 0 ? 2 : 0)}
                  rx={2}
                  fill={`url(#bar-grad-${i})`}
                  opacity={0.8}
                />
                {/* Value on bar if big enough */}
                {barH > 18 && (
                  <text
                    x={x + barW / 2}
                    y={padT + chartH - barH + 11}
                    textAnchor="middle"
                    className="fill-foreground"
                    style={{ fontSize: 7, fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}
                  >
                    {d.hours.toFixed(1)}
                  </text>
                )}
                {/* X-axis label */}
                {i % labelEvery === 0 && (
                  <text
                    x={x + barW / 2}
                    y={height - 5}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: 7, fontFamily: 'ui-monospace, monospace' }}
                    transform={displayData.length > 12 ? `rotate(-45, ${x + barW / 2}, ${height - 5})` : ''}
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Cumulative line */}
          {displayData.length > 1 && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.7}
            />
          )}

          {/* Cumulative dots */}
          {displayData.map((d, i) => {
            const x = padL + i * (barW + gap) + barW / 2;
            const y = padT + chartH - (d.cumulative / displayMaxCum) * chartH;
            return (
              <circle key={`dot-${i}`} cx={x} cy={y} r={displayData.length > 20 ? 1.5 : 2.5} fill="#22d3ee" opacity={0.9} />
            );
          })}

          {/* Cumulative value at end */}
          {displayData.length > 0 && (() => {
            const last = displayData[displayData.length - 1];
            const x = padL + (displayData.length - 1) * (barW + gap) + barW / 2;
            const y = padT + chartH - (last.cumulative / displayMaxCum) * chartH;
            return (
              <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                fill="#22d3ee"
                style={{ fontSize: 8, fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}
              >
                {last.cumulative.toFixed(1)}
              </text>
            );
          })()}

          {/* Baseline */}
          <line x1={padL} y1={padT + chartH} x2={width - padR} y2={padT + chartH} stroke="hsl(var(--border))" strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
}
