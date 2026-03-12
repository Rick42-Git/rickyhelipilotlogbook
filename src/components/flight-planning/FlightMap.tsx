import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Airport, africanAirports } from '@/data/africanAirports';
import { Waypoint, calcDistanceNm } from '@/types/flightPlan';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const airportIcon = (hasCustoms: boolean, hasFuel: boolean) => L.divIcon({
  className: 'custom-airport-icon',
  html: `<div style="
    width: 12px; height: 12px; border-radius: 50%;
    background: ${hasCustoms ? 'hsl(38, 95%, 55%)' : hasFuel ? 'hsl(142, 70%, 45%)' : 'hsl(0, 0%, 50%)'};
    border: 2px solid hsl(0, 0%, 10%);
    box-shadow: 0 0 6px ${hasCustoms ? 'hsl(38, 95%, 55%, 0.6)' : 'transparent'};
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const waypointIcon = (index: number) => L.divIcon({
  className: 'custom-waypoint-icon',
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50%;
    background: hsl(38, 95%, 55%);
    border: 3px solid hsl(0, 0%, 10%);
    color: hsl(0, 0%, 10%);
    display: flex; align-items: center; justify-content: center;
    font-family: monospace; font-size: 12px; font-weight: bold;
    box-shadow: 0 0 10px hsl(38, 95%, 55%, 0.5);
  ">${index + 1}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface MeasureState {
  active: boolean;
  points: [number, number][];
}

function MapClickHandler({ onMapClick, measureMode }: { onMapClick: (lat: number, lng: number) => void; measureMode: boolean }) {
  useMapEvents({
    click: (e) => {
      if (measureMode) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MeasureTool({ measure, setMeasure }: { measure: MeasureState; setMeasure: (m: MeasureState) => void }) {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      if (!measure.active) return;
      const newPoints: [number, number][] = [...measure.points, [e.latlng.lat, e.latlng.lng]];
      setMeasure({ ...measure, points: newPoints });
    },
  });

  if (!measure.active || measure.points.length < 2) return null;

  let totalDist = 0;
  for (let i = 1; i < measure.points.length; i++) {
    totalDist += calcDistanceNm(measure.points[i-1][0], measure.points[i-1][1], measure.points[i][0], measure.points[i][1]);
  }

  return (
    <>
      <Polyline positions={measure.points} pathOptions={{ color: '#ff6b6b', weight: 2, dashArray: '8, 8' }} />
      {measure.points.length >= 2 && (
        <Popup position={measure.points[measure.points.length - 1] as [number, number]}>
          <div className="font-mono text-xs">
            <strong>{totalDist.toFixed(1)} NM</strong>
            <br />({(totalDist * 1.852).toFixed(1)} km)
          </div>
        </Popup>
      )}
    </>
  );
}

interface FlightMapProps {
  waypoints: Waypoint[];
  onMapClick: (lat: number, lng: number) => void;
  measure: MeasureState;
  setMeasure: (m: MeasureState) => void;
  onAirportClick: (airport: Airport) => void;
  showAirports: boolean;
  filterCustoms: boolean;
  filterFuel: boolean;
}

export function FlightMap({ waypoints, onMapClick, measure, setMeasure, onAirportClick, showAirports, filterCustoms, filterFuel }: FlightMapProps) {
  const routePositions = waypoints.map(w => [w.lat, w.lng] as [number, number]);

  const filteredAirports = useMemo(() => {
    if (!showAirports) return [];
    return africanAirports.filter(a => {
      if (filterCustoms && !a.hasCustoms) return false;
      if (filterFuel && !a.hasFuel) return false;
      return true;
    });
  }, [showAirports, filterCustoms, filterFuel]);

  return (
    <div className="w-full h-full rounded-md overflow-hidden border border-muted">
      <MapContainer
        center={[-5, 25]}
        zoom={4}
        style={{ width: '100%', height: '100%', background: 'hsl(220, 20%, 10%)' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler onMapClick={onMapClick} measureMode={measure.active} />
        <MeasureTool measure={measure} setMeasure={setMeasure} />

        {/* Airport markers */}
        {filteredAirports.map(airport => (
          <Marker
            key={airport.icao}
            position={[airport.lat, airport.lng]}
            icon={airportIcon(airport.hasCustoms, airport.hasFuel)}
            eventHandlers={{ click: () => onAirportClick(airport) }}
          >
            <Popup>
              <div className="font-mono text-xs space-y-1" style={{ minWidth: 180 }}>
                <div className="font-bold text-sm">{airport.icao}{airport.iata ? ` / ${airport.iata}` : ''}</div>
                <div>{airport.name}</div>
                <div className="text-gray-500">{airport.city}, {airport.country}</div>
                <div>Elev: {airport.elevation} ft</div>
                <div className="flex gap-2 mt-1">
                  {airport.hasCustoms && <span style={{ color: 'hsl(38, 95%, 55%)' }}>✓ CUSTOMS</span>}
                  {airport.hasFuel && <span style={{ color: 'hsl(142, 70%, 45%)' }}>✓ FUEL</span>}
                </div>
                {airport.fuelTypes && <div>Fuel: {airport.fuelTypes.join(', ')}</div>}
                {airport.notes && <div className="italic text-gray-400 mt-1">{airport.notes}</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Waypoint markers */}
        {waypoints.map((wp, i) => (
          <Marker key={wp.id} position={[wp.lat, wp.lng]} icon={waypointIcon(i)}>
            <Popup>
              <div className="font-mono text-xs">
                <div className="font-bold">{wp.name || `WPT ${i + 1}`}</div>
                {wp.icao && <div>{wp.icao}</div>}
                {wp.country && <div>{wp.country}</div>}
                <div>{wp.lat.toFixed(4)}°, {wp.lng.toFixed(4)}°</div>
                {wp.hasCustoms && <div style={{ color: 'hsl(38, 95%, 55%)' }}>CUSTOMS AVAILABLE</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route line */}
        {routePositions.length >= 2 && (
          <Polyline
            positions={routePositions}
            pathOptions={{ color: 'hsl(38, 95%, 55%)', weight: 3, opacity: 0.8 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
