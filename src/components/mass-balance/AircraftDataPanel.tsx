import { AircraftType } from '@/data/aircraftData';

interface AircraftDataPanelProps {
  aircraft: AircraftType;
  currentEmptyWeight?: number;
}

export function AircraftDataPanel({ aircraft, currentEmptyWeight }: AircraftDataPanelProps) {
  const emptyWt = currentEmptyWeight ?? aircraft.emptyWeight;
  const usefulLoad = aircraft.maxGrossWeight - emptyWt;
  const isCustom = currentEmptyWeight !== undefined && currentEmptyWeight !== aircraft.emptyWeight;

  const rows = [
    { label: 'Type', value: aircraft.name },
    { label: 'Max Gross Weight', value: `${aircraft.maxGrossWeight.toLocaleString()} lbs` },
    { label: 'Basic Empty Weight', value: `${emptyWt.toLocaleString()} lbs`, highlight: isCustom },
    { label: 'Useful Load', value: `${usefulLoad.toLocaleString()} lbs`, highlight: isCustom },
    { label: 'Lateral CG Limit', value: `±${aircraft.lateralCGLimit}" from CL` },
    { label: 'Stations', value: `${aircraft.stations.length}` },
  ];

  return (
    <div className="glass-panel hud-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-accent" />
        <h3 className="font-mono text-xs text-muted-foreground tracking-widest uppercase">Aircraft Data</h3>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">{row.label}</span>
            <span className={`font-mono text-xs font-semibold ${row.highlight ? 'text-accent' : 'text-foreground'}`}>
              {row.value}
              {row.highlight && <span className="text-[8px] ml-1 text-muted-foreground">(custom)</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
