import { Waypoint, calcDistanceNm, calcBearing, formatTime } from '@/types/flightPlan';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

interface FlightLogTableProps {
  waypoints: Waypoint[];
  groundSpeed: number;
  fuelBurnRate: number;
  fuelOnBoard: number;
}

interface LegData {
  from: Waypoint;
  to: Waypoint;
  distNm: number;
  bearing: number;
  ete: number;
  fuel: number;
  cumulativeFuel: number;
  remainingFuel: number;
  crossesBorder: boolean;
  ata: string;
  atd: string;
  actualFuel: string;
}

export function FlightLogTable({ waypoints, groundSpeed, fuelBurnRate, fuelOnBoard }: FlightLogTableProps) {
  const [legEdits, setLegEdits] = useState<Record<number, { ata: string; atd: string; actualFuel: string }>>({});

  if (waypoints.length < 2) {
    return (
      <div className="flex items-center justify-center h-full font-mono text-xs text-muted-foreground/50">
        Add at least 2 waypoints to generate a flight log
      </div>
    );
  }

  const legs: LegData[] = [];
  let cumulativeFuel = 0;

  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    const distNm = calcDistanceNm(from.lat, from.lng, to.lat, to.lng);
    const bearing = calcBearing(from.lat, from.lng, to.lat, to.lng);
    const ete = (distNm / groundSpeed) * 60;
    const fuel = (ete / 60) * fuelBurnRate;
    cumulativeFuel += fuel;

    const edits = legEdits[i] || { ata: '', atd: '', actualFuel: '' };

    legs.push({
      from, to,
      distNm, bearing, ete, fuel,
      cumulativeFuel,
      remainingFuel: fuelOnBoard - cumulativeFuel,
      crossesBorder: from.country !== to.country && !!from.country && !!to.country,
      ...edits,
    });
  }

  const updateLeg = (idx: number, field: string, value: string) => {
    setLegEdits(prev => ({
      ...prev,
      [idx + 1]: { ...prev[idx + 1] || { ata: '', atd: '', actualFuel: '' }, [field]: value },
    }));
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-mono text-[9px] text-primary tracking-wider w-8">#</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider">FROM</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider">TO</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider text-right">DIST</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider text-right">HDG</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider text-right">ETE</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider text-right">FUEL</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider text-right">REM</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider">BORDER</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider">ATD</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider">ATA</TableHead>
              <TableHead className="font-mono text-[9px] text-primary tracking-wider">ACT FUEL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {legs.map((leg, i) => (
              <TableRow key={i} className={`hover:bg-muted/20 ${leg.remainingFuel < 0 ? 'bg-destructive/10' : ''}`}>
                <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-mono text-xs">
                  {leg.from.icao || leg.from.name.slice(0, 8)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {leg.to.icao || leg.to.name.slice(0, 8)}
                </TableCell>
                <TableCell className="font-mono text-xs text-right">{leg.distNm.toFixed(1)}</TableCell>
                <TableCell className="font-mono text-xs text-right">{Math.round(leg.bearing)}°</TableCell>
                <TableCell className="font-mono text-xs text-right">{formatTime(leg.ete)}</TableCell>
                <TableCell className="font-mono text-xs text-right">{leg.fuel.toFixed(0)}L</TableCell>
                <TableCell className={`font-mono text-xs text-right font-semibold ${leg.remainingFuel < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {leg.remainingFuel.toFixed(0)}L
                </TableCell>
                <TableCell>
                  {leg.crossesBorder && (
                    <Badge variant="outline" className="h-4 text-[8px] font-mono border-primary/50 text-primary">
                      {leg.from.country?.slice(0, 3).toUpperCase()}→{leg.to.country?.slice(0, 3).toUpperCase()}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Input value={leg.atd} onChange={e => updateLeg(i, 'atd', e.target.value)} className="h-6 w-16 font-mono text-[10px] bg-transparent" placeholder="HHMM" />
                </TableCell>
                <TableCell>
                  <Input value={leg.ata} onChange={e => updateLeg(i, 'ata', e.target.value)} className="h-6 w-16 font-mono text-[10px] bg-transparent" placeholder="HHMM" />
                </TableCell>
                <TableCell>
                  <Input value={leg.actualFuel} onChange={e => updateLeg(i, 'actualFuel', e.target.value)} className="h-6 w-16 font-mono text-[10px] bg-transparent" placeholder="L" />
                </TableCell>
              </TableRow>
            ))}
            {/* Totals row */}
            <TableRow className="hover:bg-transparent border-t-2 border-primary/30">
              <TableCell colSpan={3} className="font-mono text-xs font-bold text-primary">TOTALS</TableCell>
              <TableCell className="font-mono text-xs text-right font-bold">
                {legs.reduce((s, l) => s + l.distNm, 0).toFixed(1)}
              </TableCell>
              <TableCell />
              <TableCell className="font-mono text-xs text-right font-bold">
                {formatTime(legs.reduce((s, l) => s + l.ete, 0))}
              </TableCell>
              <TableCell className="font-mono text-xs text-right font-bold">
                {legs.reduce((s, l) => s + l.fuel, 0).toFixed(0)}L
              </TableCell>
              <TableCell colSpan={5} />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
