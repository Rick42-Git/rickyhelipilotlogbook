import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Ruler, Map, Plane, FileText, Layers, Globe } from 'lucide-react';
import { FlightMap, MapLayer } from '@/components/flight-planning/FlightMap';
import { FlightPlanPanel } from '@/components/flight-planning/FlightPlanPanel';
import { FlightLogTable } from '@/components/flight-planning/FlightLogTable';
import { Waypoint } from '@/types/flightPlan';
import { Airport } from '@/data/africanAirports';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const FlightPlanning = () => {
  const navigate = useNavigate();

  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [groundSpeed, setGroundSpeed] = useState(90);
  const [fuelBurnRate, setFuelBurnRate] = useState(120);
  const [fuelOnBoard, setFuelOnBoard] = useState(0);
  const [reserveFuel, setReserveFuel] = useState(0);
  const [aircraftType, setAircraftType] = useState('');
  const [aircraftReg, setAircraftReg] = useState('');
  const [pilotInCommand, setPilotInCommand] = useState('');
  const [planNotes, setPlanNotes] = useState('');

  // Map controls
  const [showAirports, setShowAirports] = useState(true);
  const [filterCustoms, setFilterCustoms] = useState(false);
  const [filterFuel, setFilterFuel] = useState(false);
  const [measure, setMeasure] = useState<{ active: boolean; points: [number, number][] }>({ active: false, points: [] });
  const [activeLayer, setActiveLayer] = useState<MapLayer>('dark');
  const [showAirspaces, setShowAirspaces] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(true);

  const handleMapClick = (lat: number, lng: number) => {
    const wp: Waypoint = {
      id: crypto.randomUUID(),
      name: `WPT ${waypoints.length + 1}`,
      lat,
      lng,
    };
    setWaypoints([...waypoints, wp]);
  };

  const handleAirportClick = (airport: Airport) => {
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
  };

  const toggleMeasure = () => {
    setMeasure(prev => ({ active: !prev.active, points: prev.active ? [] : prev.points }));
  };

  const layerLabels: Record<MapLayer, string> = {
    dark: '🌑 DARK',
    satellite: '🛰️ SATELLITE',
    terrain: '🏔️ TERRAIN',
    vfr: '🗺️ STREET',
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="glass-panel hud-border px-3 py-2 flex items-center justify-between gap-2 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            <h1 className="font-mono text-sm md:text-base font-bold text-primary tracking-wider">FLIGHT PLANNING</h1>
            <div className="status-dot" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Map Layer Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="font-mono text-[10px] gap-1 h-7">
                <Layers className="h-3 w-3" />
                <span className="hidden md:inline">{layerLabels[activeLayer]}</span>
                <span className="md:hidden">MAP</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-mono text-xs">
              {(Object.keys(layerLabels) as MapLayer[]).map(key => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setActiveLayer(key)}
                  className={activeLayer === key ? 'bg-primary/20 text-primary' : ''}
                >
                  {layerLabels[key]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 flex items-center justify-between gap-3">
                <span className="text-[10px] text-muted-foreground">AIRSPACES</span>
                <Switch checked={showAirspaces} onCheckedChange={setShowAirspaces} className="scale-[0.6]" />
              </div>
              <div className="px-2 py-1.5 flex items-center justify-between gap-3">
                <span className="text-[10px] text-muted-foreground">BORDERS</span>
                <Switch checked={showBoundaries} onCheckedChange={setShowBoundaries} className="scale-[0.6]" />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Desktop filters */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Switch id="airports" checked={showAirports} onCheckedChange={setShowAirports} className="scale-75" />
              <Label htmlFor="airports" className="font-mono text-[10px] text-muted-foreground cursor-pointer">AIRPORTS</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch id="customs" checked={filterCustoms} onCheckedChange={setFilterCustoms} className="scale-75" />
              <Label htmlFor="customs" className="font-mono text-[10px] text-primary cursor-pointer">CUSTOMS</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch id="fuel" checked={filterFuel} onCheckedChange={setFilterFuel} className="scale-75" />
              <Label htmlFor="fuel" className="font-mono text-[10px] text-green-500 cursor-pointer">FUEL</Label>
            </div>
          </div>

          <Button
            variant={measure.active ? 'default' : 'outline'}
            size="sm"
            onClick={toggleMeasure}
            className="font-mono text-[10px] gap-1 h-7"
          >
            <Ruler className="h-3 w-3" />
            {measure.active ? 'MEASURING' : 'MEASURE'}
          </Button>
        </div>
      </div>

      {/* Mobile filter bar */}
      <div className="flex md:hidden items-center justify-center gap-4 py-1.5 bg-muted/20 border-b border-muted/30">
        <div className="flex items-center gap-1.5">
          <Switch id="airports-m" checked={showAirports} onCheckedChange={setShowAirports} className="scale-[0.65]" />
          <Label htmlFor="airports-m" className="font-mono text-[9px] text-muted-foreground">APT</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch id="customs-m" checked={filterCustoms} onCheckedChange={setFilterCustoms} className="scale-[0.65]" />
          <Label htmlFor="customs-m" className="font-mono text-[9px] text-primary">CUS</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch id="fuel-m" checked={filterFuel} onCheckedChange={setFilterFuel} className="scale-[0.65]" />
          <Label htmlFor="fuel-m" className="font-mono text-[9px] text-green-500">FUEL</Label>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 min-h-[300px] md:min-h-0">
          <FlightMap
            waypoints={waypoints}
            onMapClick={handleMapClick}
            measure={measure}
            setMeasure={setMeasure}
            onAirportClick={handleAirportClick}
            showAirports={showAirports}
            filterCustoms={filterCustoms}
            filterFuel={filterFuel}
            activeLayer={activeLayer}
            showAirspaces={showAirspaces}
            showBoundaries={showBoundaries}
          />
        </div>

        <div className="w-full md:w-[380px] border-t md:border-t-0 md:border-l border-muted/30 flex flex-col overflow-hidden">
          <Tabs defaultValue="plan" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full rounded-none bg-muted/20 border-b border-muted/30 flex-shrink-0">
              <TabsTrigger value="plan" className="flex-1 font-mono text-[10px] tracking-wider gap-1">
                <Map className="h-3 w-3" />PLAN
              </TabsTrigger>
              <TabsTrigger value="log" className="flex-1 font-mono text-[10px] tracking-wider gap-1">
                <FileText className="h-3 w-3" />LOG
              </TabsTrigger>
            </TabsList>
            <TabsContent value="plan" className="flex-1 overflow-hidden mt-0">
              <FlightPlanPanel
                waypoints={waypoints} setWaypoints={setWaypoints}
                groundSpeed={groundSpeed} setGroundSpeed={setGroundSpeed}
                fuelBurnRate={fuelBurnRate} setFuelBurnRate={setFuelBurnRate}
                fuelOnBoard={fuelOnBoard} setFuelOnBoard={setFuelOnBoard}
                reserveFuel={reserveFuel} setReserveFuel={setReserveFuel}
                aircraftType={aircraftType} setAircraftType={setAircraftType}
                aircraftReg={aircraftReg} setAircraftReg={setAircraftReg}
                pilotInCommand={pilotInCommand} setPilotInCommand={setPilotInCommand}
                planNotes={planNotes} setPlanNotes={setPlanNotes}
              />
            </TabsContent>
            <TabsContent value="log" className="flex-1 overflow-hidden mt-0">
              <FlightLogTable
                waypoints={waypoints}
                groundSpeed={groundSpeed}
                fuelBurnRate={fuelBurnRate}
                fuelOnBoard={fuelOnBoard}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Map legend */}
      <div className="glass-panel px-3 py-1.5 flex items-center justify-center gap-4 text-[9px] font-mono text-muted-foreground flex-shrink-0 border-t border-muted/30">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Customs
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Fuel Only
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground inline-block" /> No Services
        </span>
        <span className="hidden md:inline">|</span>
        <span className="hidden md:inline">Click map to add waypoint • Click airport dot to add as waypoint</span>
      </div>
    </div>
  );
};

export default FlightPlanning;
