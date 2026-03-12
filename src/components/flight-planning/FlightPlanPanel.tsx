import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, GripVertical, Fuel, ShieldCheck, AlertTriangle, ArrowRight, Pencil, Plus, RotateCcw } from 'lucide-react';
import { Waypoint, FlightLeg, calcDistanceNm, calcBearing, formatTime } from '@/types/flightPlan';
import { searchAirports, Airport } from '@/data/africanAirports';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FlightPlanPanelProps {
  waypoints: Waypoint[];
  setWaypoints: (w: Waypoint[]) => void;
  groundSpeed: number;
  setGroundSpeed: (s: number) => void;
  fuelBurnRate: number;
  setFuelBurnRate: (r: number) => void;
  fuelOnBoard: number;
  setFuelOnBoard: (f: number) => void;
  reserveFuel: number;
  setReserveFuel: (f: number) => void;
  aircraftType: string;
  setAircraftType: (t: string) => void;
  aircraftReg: string;
  setAircraftReg: (r: string) => void;
  pilotInCommand: string;
  setPilotInCommand: (p: string) => void;
  planNotes: string;
  setPlanNotes: (n: string) => void;
}

export function FlightPlanPanel({
  waypoints, setWaypoints,
  groundSpeed, setGroundSpeed,
  fuelBurnRate, setFuelBurnRate,
  fuelOnBoard, setFuelOnBoard,
  reserveFuel, setReserveFuel,
  aircraftType, setAircraftType,
  aircraftReg, setAircraftReg,
  pilotInCommand, setPilotInCommand,
  planNotes, setPlanNotes,
}: FlightPlanPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = searchQuery.length >= 2 ? searchAirports(searchQuery) : [];

  const addAirportWaypoint = (airport: Airport) => {
    const wp: Waypoint = {
      id: crypto.randomUUID(),
      name: `${airport.icao} - ${airport.city}`,
      icao: airport.icao,
      lat: airport.lat,
      lng: airport.lng,
      altitude: airport.elevation,
      hasCustoms: airport.hasCustoms,
      hasFuel: airport.hasFuel,
      country: airport.country,
      notes: airport.notes,
    };
    setWaypoints([...waypoints, wp]);
    setSearchQuery('');
  };

  const removeWaypoint = (id: string) => {
    setWaypoints(waypoints.filter(w => w.id !== id));
  };

  const updateWaypointNotes = (id: string, notes: string) => {
    setWaypoints(waypoints.map(w => w.id === id ? { ...w, notes } : w));
  };

  // Calculate legs
  const legs: FlightLeg[] = [];
  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    const distNm = calcDistanceNm(from.lat, from.lng, to.lat, to.lng);
    const bearing = calcBearing(from.lat, from.lng, to.lat, to.lng);
    const timeMin = (distNm / groundSpeed) * 60;
    const fuelForLeg = (timeMin / 60) * fuelBurnRate;
    const crossesBorder = from.country !== to.country && from.country && to.country;
    
    legs.push({
      id: crypto.randomUUID(),
      from, to,
      distanceNm: distNm,
      bearing,
      groundSpeed,
      estimatedTimeMin: timeMin,
      fuelBurnRate,
      estimatedFuel: fuelForLeg,
      altitudeFt: to.altitude || 0,
      customsRequired: !!crossesBorder,
      notes: crossesBorder ? `Border crossing: ${from.country} → ${to.country}` : '',
    });
  }

  const totalDistNm = legs.reduce((s, l) => s + l.distanceNm, 0);
  const totalTimeMin = legs.reduce((s, l) => s + l.estimatedTimeMin, 0);
  const totalFuel = legs.reduce((s, l) => s + l.estimatedFuel, 0);
  const fuelRemaining = fuelOnBoard - totalFuel;
  const fuelAfterReserve = fuelRemaining - reserveFuel;
  const customsLegs = legs.filter(l => l.customsRequired);
  const countriesCrossed = [...new Set(waypoints.map(w => w.country).filter(Boolean))];

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Aircraft Info */}
        <div className="space-y-2">
          <h3 className="font-mono text-xs text-primary tracking-widest">AIRCRAFT</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="font-mono text-[10px] text-muted-foreground">TYPE</Label>
              <Input value={aircraftType} onChange={e => setAircraftType(e.target.value)} className="h-7 font-mono text-xs" placeholder="AS350 B3" />
            </div>
            <div>
              <Label className="font-mono text-[10px] text-muted-foreground">REG</Label>
              <Input value={aircraftReg} onChange={e => setAircraftReg(e.target.value)} className="h-7 font-mono text-xs" placeholder="ZS-XXX" />
            </div>
          </div>
          <div>
            <Label className="font-mono text-[10px] text-muted-foreground">PILOT IN COMMAND</Label>
            <Input value={pilotInCommand} onChange={e => setPilotInCommand(e.target.value)} className="h-7 font-mono text-xs" />
          </div>
        </div>

        <Separator className="bg-muted/30" />

        {/* Performance */}
        <div className="space-y-2">
          <h3 className="font-mono text-xs text-primary tracking-widest">PERFORMANCE</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="font-mono text-[10px] text-muted-foreground">GND SPEED (KTS)</Label>
              <Input type="number" value={groundSpeed} onChange={e => setGroundSpeed(Number(e.target.value))} className="h-7 font-mono text-xs" />
            </div>
            <div>
              <Label className="font-mono text-[10px] text-muted-foreground">FUEL BURN (L/HR)</Label>
              <Input type="number" value={fuelBurnRate} onChange={e => setFuelBurnRate(Number(e.target.value))} className="h-7 font-mono text-xs" />
            </div>
            <div>
              <Label className="font-mono text-[10px] text-muted-foreground">FUEL ON BOARD (L)</Label>
              <Input type="number" value={fuelOnBoard || ''} onChange={e => setFuelOnBoard(Number(e.target.value))} className="h-7 font-mono text-xs" />
            </div>
            <div>
              <Label className="font-mono text-[10px] text-muted-foreground">RESERVE FUEL (L)</Label>
              <Input type="number" value={reserveFuel || ''} onChange={e => setReserveFuel(Number(e.target.value))} className="h-7 font-mono text-xs" />
            </div>
          </div>
        </div>

        <Separator className="bg-muted/30" />

        {/* Search & Add Waypoints */}
        <div className="space-y-2">
          <h3 className="font-mono text-xs text-primary tracking-widest">ADD WAYPOINT</h3>
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-7 font-mono text-xs"
            placeholder="Search ICAO, city, country..."
          />
          {searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-muted rounded-md bg-background">
              {searchResults.slice(0, 8).map(a => (
                <button
                  key={a.icao}
                  onClick={() => addAirportWaypoint(a)}
                  className="w-full text-left px-2 py-1.5 hover:bg-muted/50 transition-colors border-b border-muted/20 last:border-0"
                >
                  <div className="font-mono text-xs font-semibold text-foreground">{a.icao} — {a.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground flex gap-2">
                    <span>{a.city}, {a.country}</span>
                    {a.hasCustoms && <span className="text-primary">CUSTOMS</span>}
                    {a.hasFuel && <span className="text-green-500">FUEL</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
          <p className="font-mono text-[9px] text-muted-foreground/60">Or click the map to add a custom waypoint</p>
        </div>

        <Separator className="bg-muted/30" />

        {/* Route / Waypoints */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs text-primary tracking-widest">ROUTE ({waypoints.length} WPT)</h3>
            {waypoints.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 px-1 text-destructive font-mono text-[9px]">
                    <RotateCcw className="h-3 w-3 mr-1" />CLEAR
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-mono">Clear Route?</AlertDialogTitle>
                    <AlertDialogDescription>Remove all waypoints from this flight plan?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-mono">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setWaypoints([])} className="font-mono">Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {waypoints.length === 0 && (
            <p className="font-mono text-[10px] text-muted-foreground/50 text-center py-4">
              No waypoints yet. Search above or click the map.
            </p>
          )}

          {waypoints.map((wp, i) => (
            <div key={wp.id} className="space-y-1">
              <div className="glass-panel p-2 rounded-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-primary w-5 text-center flex-shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-semibold text-foreground truncate">{wp.name}</div>
                      <div className="font-mono text-[9px] text-muted-foreground">
                        {wp.lat.toFixed(3)}°, {wp.lng.toFixed(3)}°
                        {wp.altitude ? ` • ${wp.altitude}ft` : ''}
                        {wp.country ? ` • ${wp.country}` : ''}
                      </div>
                      <div className="flex gap-1 mt-0.5">
                        {wp.hasCustoms && <Badge variant="outline" className="h-4 text-[8px] font-mono border-primary/50 text-primary">CUSTOMS</Badge>}
                        {wp.hasFuel && <Badge variant="outline" className="h-4 text-[8px] font-mono border-green-500/50 text-green-500">FUEL</Badge>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => removeWaypoint(wp.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  value={wp.notes || ''}
                  onChange={e => updateWaypointNotes(wp.id, e.target.value)}
                  className="h-6 font-mono text-[10px] mt-1 bg-transparent border-muted/30"
                  placeholder="Notes (customs info, fuel stop, etc.)"
                />
              </div>

              {/* Leg info between waypoints */}
              {i < legs.length && (
                <div className="flex items-center gap-2 px-2 py-1">
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <div className="font-mono text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>{legs[i].distanceNm.toFixed(1)} NM</span>
                    <span>HDG {Math.round(legs[i].bearing)}°</span>
                    <span>{formatTime(legs[i].estimatedTimeMin)}</span>
                    <span>{legs[i].estimatedFuel.toFixed(1)}L fuel</span>
                    {legs[i].customsRequired && (
                      <span className="text-primary flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3" />CUSTOMS
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {legs.length > 0 && (
          <>
            <Separator className="bg-muted/30" />

            {/* Totals */}
            <div className="space-y-2">
              <h3 className="font-mono text-xs text-primary tracking-widest">FLIGHT SUMMARY</h3>
              <div className="glass-panel p-3 rounded-md space-y-1.5">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Total Distance</span>
                  <span className="text-foreground font-semibold">{totalDistNm.toFixed(1)} NM</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Est. Flight Time</span>
                  <span className="text-foreground font-semibold">{formatTime(totalTimeMin)}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Total Fuel Required</span>
                  <span className="text-foreground font-semibold">{totalFuel.toFixed(1)} L</span>
                </div>
                {fuelOnBoard > 0 && (
                  <>
                    <Separator className="bg-muted/20" />
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-muted-foreground">Fuel Remaining</span>
                      <span className={`font-semibold ${fuelRemaining < 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {fuelRemaining.toFixed(1)} L
                      </span>
                    </div>
                    {reserveFuel > 0 && (
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-muted-foreground">After Reserve</span>
                        <span className={`font-semibold ${fuelAfterReserve < 0 ? 'text-destructive' : 'text-foreground'}`}>
                          {fuelAfterReserve.toFixed(1)} L
                        </span>
                      </div>
                    )}
                    {fuelRemaining < 0 && (
                      <div className="flex items-center gap-1 font-mono text-[10px] text-destructive mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        INSUFFICIENT FUEL — REFUEL STOP REQUIRED
                      </div>
                    )}
                    {fuelRemaining >= 0 && fuelAfterReserve < 0 && (
                      <div className="flex items-center gap-1 font-mono text-[10px] text-primary mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        RESERVE FUEL COMPROMISED
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Countries & Customs */}
            {countriesCrossed.length > 1 && (
              <div className="space-y-2">
                <h3 className="font-mono text-xs text-primary tracking-widest">BORDER CROSSINGS</h3>
                <div className="glass-panel p-3 rounded-md space-y-1.5">
                  <div className="font-mono text-[10px] text-muted-foreground">
                    Countries: {countriesCrossed.join(' → ')}
                  </div>
                  {customsLegs.map((leg, i) => (
                    <div key={i} className="flex items-center gap-1.5 font-mono text-[10px]">
                      <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0" />
                      <span>{leg.from.country} → {leg.to.country}</span>
                      {leg.to.hasCustoms ? (
                        <Badge variant="outline" className="h-4 text-[8px] border-green-500/50 text-green-500">CUSTOMS AT {leg.to.icao || 'DEST'}</Badge>
                      ) : (
                        <Badge variant="outline" className="h-4 text-[8px] border-destructive/50 text-destructive">NO CUSTOMS</Badge>
                      )}
                    </div>
                  ))}
                  <div className="font-mono text-[9px] text-muted-foreground/60 mt-2">
                    ⚠ Always confirm customs hours & requirements before flight. File GenDec/flight plan as required.
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <h3 className="font-mono text-xs text-primary tracking-widest">FLIGHT NOTES</h3>
          <Textarea
            value={planNotes}
            onChange={e => setPlanNotes(e.target.value)}
            className="font-mono text-xs min-h-[60px] bg-background/50"
            placeholder="GenDec info, customs contacts, fuel arrangements, NOTAMs, weather notes..."
          />
        </div>
      </div>
    </ScrollArea>
  );
}
