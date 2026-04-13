import { useMemo, useState } from 'react';
import { LogbookEntry } from '@/types/logbook';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { MapPin, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';

interface LandingsMapProps {
  entries: LogbookEntry[];
}

interface LandingPoint {
  lat: number;
  lng: number;
  label: string;
  flights: number;
  hours: number;
  dates: string[];
}

function getEntryHours(e: LogbookEntry) {
  return (e.seDayDual || 0) + (e.seDayPilot || 0) + (e.seNightDual || 0) + (e.seNightPilot || 0);
}

function FitBounds({ points }: { points: LandingPoint[] }) {
  const map = useMap();
  useMemo(() => {
    if (points.length === 0) return;
    const bounds = points.map(p => [p.lat, p.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
  }, [points, map]);
  return null;
}

export function LandingsMap({ entries }: LandingsMapProps) {
  const [expanded, setExpanded] = useState(false);

  const points = useMemo(() => {
    const map = new Map<string, LandingPoint>();
    for (const e of entries) {
      if (e.latitude == null || e.longitude == null) continue;
      // Round to ~100m precision for grouping nearby landings
      const key = `${e.latitude.toFixed(3)},${e.longitude.toFixed(3)}`;
      if (!map.has(key)) {
        map.set(key, {
          lat: e.latitude,
          lng: e.longitude,
          label: e.flightDetails || e.aircraftReg || 'Landing',
          flights: 0,
          hours: 0,
          dates: [],
        });
      }
      const pt = map.get(key)!;
      pt.flights += 1;
      pt.hours += getEntryHours(e);
      if (e.date && !pt.dates.includes(e.date)) pt.dates.push(e.date);
      // Use most recent label
      if (e.flightDetails) pt.label = e.flightDetails;
    }
    return Array.from(map.values());
  }, [entries]);

  if (points.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-bold">Landing Zones</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-muted-foreground">{points.length} locations</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      <div style={{ height: expanded ? '400px' : '200px' }} className="transition-all duration-300">
        <MapContainer
          center={[points[0]?.lat || 0, points[0]?.lng || 0]}
          zoom={5}
          className="h-full w-full"
          style={{ background: 'hsl(var(--background))' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds points={points} />
          {points.map((pt, i) => (
            <CircleMarker
              key={i}
              center={[pt.lat, pt.lng]}
              radius={Math.min(6 + pt.flights * 2, 16)}
              pathOptions={{
                color: 'hsl(47, 100%, 50%)',
                fillColor: 'hsl(47, 100%, 50%)',
                fillOpacity: 0.6,
                weight: 1,
              }}
            >
              <Popup>
                <div className="font-mono text-xs space-y-1">
                  <p className="font-bold">{pt.label}</p>
                  <p className="text-muted-foreground">{pt.flights} flight{pt.flights > 1 ? 's' : ''} · {pt.hours.toFixed(1)} hrs</p>
                  <p className="text-[10px] text-muted-foreground">{pt.lat.toFixed(4)}°, {pt.lng.toFixed(4)}°</p>
                  {pt.dates.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {pt.dates.length <= 3 ? pt.dates.join(', ') : `${pt.dates.slice(-3).join(', ')} …`}
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
