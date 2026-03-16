import { AircraftStation } from '@/data/aircraftData';

interface LoadingDiagramProps {
  stations: AircraftStation[];
  weights: number[];
}

export function LoadingDiagram({ stations, weights }: LoadingDiagramProps) {
  // Map stations to approximate positions on a helicopter side-view
  const getStationCategory = (label: string): string => {
    const l = label.toLowerCase();
    if (l.includes('empty')) return 'skip';
    if (l.includes('pilot') && !l.includes('co')) return 'pilot';
    if (l.includes('co-pilot') || l.includes('copilot')) return 'copilot';
    if (l.includes('fuel')) return 'fuel';
    if (l.includes('rear') && l.includes('left')) return 'rear-left';
    if (l.includes('rear') && l.includes('right')) return 'rear-right';
    if (l.includes('rear') || l.includes('cabin')) return 'rear';
    if (l.includes('center') && l.includes('left')) return 'center-left';
    if (l.includes('center') && l.includes('right')) return 'center-right';
    if (l.includes('baggage')) return 'baggage';
    if (l.includes('passenger') || l.includes('pax')) return 'copilot';
    return 'other';
  };

  const categories: Record<string, { label: string; weight: number }> = {};
  stations.forEach((s, i) => {
    const cat = getStationCategory(s.label);
    if (cat === 'skip') return;
    if (!categories[cat]) {
      categories[cat] = { label: s.label.replace(/STA.*/, '').trim(), weight: weights[i] };
    } else {
      categories[cat].weight += weights[i];
    }
  });

  // Position map for helicopter diagram (pilot sits RIGHT side)
  const positionMap: Record<string, { x: number; y: number }> = {
    'pilot': { x: 190, y: 95 },
    'copilot': { x: 110, y: 95 },
    'fuel': { x: 150, y: 145 },
    'rear-left': { x: 110, y: 155 },
    'rear-right': { x: 190, y: 155 },
    'rear': { x: 150, y: 155 },
    'center-left': { x: 110, y: 130 },
    'center-right': { x: 190, y: 130 },
    'baggage': { x: 150, y: 185 },
    'other': { x: 150, y: 170 },
  };

  return (
    <div className="glass-panel hud-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-accent" />
        <h3 className="font-mono text-xs text-muted-foreground tracking-widest uppercase">Loading Diagram</h3>
      </div>

      <svg viewBox="0 0 300 240" className="w-full" style={{ maxHeight: 240 }}>
        {/* Helicopter body outline */}
        <g stroke="hsl(var(--muted-foreground))" strokeOpacity="0.4" fill="none" strokeWidth="1.5">
          {/* Main fuselage */}
          <ellipse cx="150" cy="130" rx="55" ry="70" />
          {/* Tail boom */}
          <line x1="150" y1="60" x2="150" y2="25" />
          <line x1="140" y1="25" x2="160" y2="25" />
          {/* Skids */}
          <line x1="100" y1="200" x2="100" y2="180" />
          <line x1="200" y1="200" x2="200" y2="180" />
          <line x1="90" y1="200" x2="110" y2="200" />
          <line x1="190" y1="200" x2="210" y2="200" />
          {/* Main rotor disc indicator */}
          <line x1="80" y1="65" x2="220" y2="65" strokeDasharray="4,3" strokeOpacity="0.2" />
        </g>

        {/* CG reference markers */}
        <text x="70" y="60" fill="hsl(var(--muted-foreground))" fontSize="7" fontFamily="monospace" opacity="0.4">FWD</text>
        <text x="215" y="60" fill="hsl(var(--muted-foreground))" fontSize="7" fontFamily="monospace" opacity="0.4">AFT</text>
        <text x="75" y="215" fill="hsl(var(--muted-foreground))" fontSize="7" fontFamily="monospace" opacity="0.4">LEFT</text>
        <text x="205" y="215" fill="hsl(var(--muted-foreground))" fontSize="7" fontFamily="monospace" opacity="0.4">RIGHT</text>

        {/* Weight blocks */}
        {Object.entries(categories).map(([cat, data]) => {
          const pos = positionMap[cat] || positionMap['other'];
          if (data.weight === 0) {
            return (
              <g key={cat}>
                <text
                  x={pos.x}
                  y={pos.y}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  opacity="0.4"
                >
                  {data.label.split(' ')[0]}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 10}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="7"
                  fontFamily="monospace"
                  textAnchor="middle"
                  opacity="0.3"
                >
                  —
                </text>
              </g>
            );
          }
          return (
            <g key={cat}>
              <rect
                x={pos.x - 22}
                y={pos.y - 12}
                width="44"
                height="22"
                rx="3"
                fill="hsl(var(--primary) / 0.2)"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
              />
              <text
                x={pos.x}
                y={pos.y - 1}
                fill="hsl(var(--primary-foreground))"
                fontSize="7"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="bold"
              >
                {data.label.split(' ')[0]}
              </text>
              <text
                x={pos.x}
                y={pos.y + 7}
                fill="hsl(var(--primary))"
                fontSize="8"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="bold"
              >
                {data.weight}
              </text>
            </g>
          );
        })}

        {/* CG label */}
        <text x="150" y="230" fill="hsl(var(--accent))" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">CG</text>
      </svg>
    </div>
  );
}
