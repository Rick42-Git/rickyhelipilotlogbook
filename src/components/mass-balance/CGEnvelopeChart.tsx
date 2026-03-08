import { useMemo } from 'react';
import { CGEnvelopePoint } from '@/data/aircraftData';

interface CGEnvelopeChartProps {
  envelope: CGEnvelopePoint[];
  currentStation: number;
  currentWeight: number;
  withinLimits: boolean;
}

export function CGEnvelopeChart({ envelope, currentStation, currentWeight, withinLimits }: CGEnvelopeChartProps) {
  const { minX, maxX, minY, maxY, pathD, cx, cy } = useMemo(() => {
    const stations = envelope.map(p => p.station);
    const weights = envelope.map(p => p.weight);
    const padX = 4;
    const padY = 200;
    const mnX = Math.min(...stations) - padX;
    const mxX = Math.max(...stations) + padX;
    const mnY = Math.min(...weights) - padY;
    const mxY = Math.max(...weights) + padY;

    const W = 300, H = 250;
    const toSvgX = (s: number) => ((s - mnX) / (mxX - mnX)) * W;
    const toSvgY = (w: number) => H - ((w - mnY) / (mxY - mnY)) * H;

    const d = envelope.map((p, i) => `${i === 0 ? 'M' : 'L'}${toSvgX(p.station).toFixed(1)},${toSvgY(p.weight).toFixed(1)}`).join(' ') + ' Z';

    return {
      minX: mnX, maxX: mxX, minY: mnY, maxY: mxY,
      pathD: d,
      cx: toSvgX(currentStation),
      cy: toSvgY(currentWeight),
    };
  }, [envelope, currentStation, currentWeight]);

  const W = 300, H = 250;
  const toSvgX = (s: number) => ((s - minX) / (maxX - minX)) * W;
  const toSvgY = (w: number) => H - ((w - minY) / (maxY - minY)) * H;

  // Grid lines
  const xTicks = [];
  const step = Math.ceil((maxX - minX) / 6);
  for (let x = Math.ceil(minX); x <= maxX; x += step) xTicks.push(x);

  const yTicks = [];
  const yStep = Math.ceil((maxY - minY) / 5 / 100) * 100;
  for (let y = Math.ceil(minY / 100) * 100; y <= maxY; y += yStep) yTicks.push(y);

  return (
    <div className="glass-panel hud-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-accent" />
        <h3 className="font-mono text-xs text-muted-foreground tracking-widest uppercase">CG Envelope</h3>
      </div>
      <svg viewBox={`-40 -10 380 290`} className="w-full" style={{ maxHeight: 280 }}>
        {/* Grid */}
        {xTicks.map(x => (
          <g key={`x-${x}`}>
            <line x1={toSvgX(x)} y1={0} x2={toSvgX(x)} y2={H} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} strokeDasharray="2,4" />
            <text x={toSvgX(x)} y={H + 15} fill="hsl(var(--muted-foreground))" fontSize="9" textAnchor="middle" fontFamily="monospace">{x}"</text>
          </g>
        ))}
        {yTicks.map(y => (
          <g key={`y-${y}`}>
            <line x1={0} y1={toSvgY(y)} x2={W} y2={toSvgY(y)} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} strokeDasharray="2,4" />
            <text x={-5} y={toSvgY(y) + 3} fill="hsl(var(--muted-foreground))" fontSize="9" textAnchor="end" fontFamily="monospace">{y}</text>
          </g>
        ))}

        {/* Envelope polygon */}
        <path d={pathD} fill="hsl(var(--success) / 0.15)" stroke="hsl(var(--success))" strokeWidth="1.5" />

        {/* Current point */}
        <circle cx={cx} cy={cy} r={5} fill={withinLimits ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} stroke="hsl(var(--background))" strokeWidth="2" />
        <text x={cx + 8} y={cy - 5} fill="hsl(var(--foreground))" fontSize="8" fontFamily="monospace">
          {currentWeight.toLocaleString()} lb
        </text>

        {/* Axis labels */}
        <text x={W / 2} y={H + 28} fill="hsl(var(--muted-foreground))" fontSize="9" textAnchor="middle" fontFamily="monospace">CG Station (inches)</text>
        <text x={-35} y={H / 2} fill="hsl(var(--muted-foreground))" fontSize="9" textAnchor="middle" fontFamily="monospace" transform={`rotate(-90, -35, ${H / 2})`}>Weight (lb)</text>
      </svg>
    </div>
  );
}
