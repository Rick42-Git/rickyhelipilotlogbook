import { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Airport, africanAirports } from '@/data/africanAirports';
import { Waypoint, calcDistanceNm } from '@/types/flightPlan';

interface MeasureState {
  active: boolean;
  points: [number, number][];
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
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const airportLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const waypointLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const routeLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const measureLayerRef = useRef<L.LayerGroup>(L.layerGroup());

  // Store latest callbacks in refs to avoid re-bindning map click
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const measureRef = useRef(measure);
  measureRef.current = measure;
  const setMeasureRef = useRef(setMeasure);
  setMeasureRef.current = setMeasure;
  const onAirportClickRef = useRef(onAirportClick);
  onAirportClickRef.current = onAirportClick;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-5, 25],
      zoom: 4,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    airportLayerRef.current.addTo(map);
    waypointLayerRef.current.addTo(map);
    routeLayerRef.current.addTo(map);
    measureLayerRef.current.addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const m = measureRef.current;
      if (m.active) {
        const newPoints: [number, number][] = [...m.points, [e.latlng.lat, e.latlng.lng]];
        setMeasureRef.current({ ...m, points: newPoints });
      } else {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update airport markers
  const filteredAirports = useMemo(() => {
    if (!showAirports) return [];
    return africanAirports.filter(a => {
      if (filterCustoms && !a.hasCustoms) return false;
      if (filterFuel && !a.hasFuel) return false;
      return true;
    });
  }, [showAirports, filterCustoms, filterFuel]);

  useEffect(() => {
    const layer = airportLayerRef.current;
    layer.clearLayers();

    filteredAirports.forEach(airport => {
      const color = airport.hasCustoms ? 'hsl(38, 95%, 55%)' : airport.hasFuel ? 'hsl(142, 70%, 45%)' : 'hsl(0, 0%, 50%)';
      const glow = airport.hasCustoms ? 'hsl(38, 95%, 55%, 0.6)' : 'transparent';

      const icon = L.divIcon({
        className: 'custom-airport-icon',
        html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid hsl(0,0%,10%);box-shadow:0 0 6px ${glow};cursor:pointer;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([airport.lat, airport.lng], { icon });

      const popupHtml = `
        <div style="font-family:monospace;font-size:11px;min-width:180px;">
          <div style="font-weight:bold;font-size:13px;">${airport.icao}${airport.iata ? ` / ${airport.iata}` : ''}</div>
          <div>${airport.name}</div>
          <div style="color:#888;">${airport.city}, ${airport.country}</div>
          <div>Elev: ${airport.elevation} ft</div>
          <div style="margin-top:4px;">
            ${airport.hasCustoms ? '<span style="color:hsl(38,95%,55%);">✓ CUSTOMS</span> ' : ''}
            ${airport.hasFuel ? '<span style="color:hsl(142,70%,45%);">✓ FUEL</span>' : ''}
          </div>
          ${airport.fuelTypes ? `<div>Fuel: ${airport.fuelTypes.join(', ')}</div>` : ''}
          ${airport.notes ? `<div style="color:#999;font-style:italic;margin-top:4px;">${airport.notes}</div>` : ''}
          <div style="margin-top:6px;"><button class="add-airport-btn" style="background:hsl(38,95%,55%);color:#111;border:none;padding:3px 8px;border-radius:4px;font-family:monospace;font-size:10px;cursor:pointer;font-weight:bold;">+ ADD TO ROUTE</button></div>
        </div>`;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.querySelector('.add-airport-btn');
          if (btn) {
            btn.addEventListener('click', () => {
              onAirportClickRef.current(airport);
              marker.closePopup();
            });
          }
        }, 50);
      });

      layer.addLayer(marker);
    });
  }, [filteredAirports]);

  // Update waypoint markers & route line
  useEffect(() => {
    const wpLayer = waypointLayerRef.current;
    const rtLayer = routeLayerRef.current;
    wpLayer.clearLayers();
    rtLayer.clearLayers();

    waypoints.forEach((wp, i) => {
      const icon = L.divIcon({
        className: 'custom-waypoint-icon',
        html: `<div style="width:28px;height:28px;border-radius:50%;background:hsl(38,95%,55%);border:3px solid hsl(0,0%,10%);color:hsl(0,0%,10%);display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:12px;font-weight:bold;box-shadow:0 0 10px hsl(38,95%,55%,0.5);">${i + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon });
      marker.bindPopup(`
        <div style="font-family:monospace;font-size:11px;">
          <div style="font-weight:bold;">${wp.name || `WPT ${i + 1}`}</div>
          ${wp.icao ? `<div>${wp.icao}</div>` : ''}
          ${wp.country ? `<div>${wp.country}</div>` : ''}
          <div>${wp.lat.toFixed(4)}°, ${wp.lng.toFixed(4)}°</div>
          ${wp.hasCustoms ? '<div style="color:hsl(38,95%,55%);">CUSTOMS AVAILABLE</div>' : ''}
        </div>
      `);
      wpLayer.addLayer(marker);
    });

    if (waypoints.length >= 2) {
      const positions = waypoints.map(w => [w.lat, w.lng] as [number, number]);
      const polyline = L.polyline(positions, { color: 'hsl(38, 95%, 55%)', weight: 3, opacity: 0.8 });
      rtLayer.addLayer(polyline);
    }
  }, [waypoints]);

  // Update measure overlay
  useEffect(() => {
    const layer = measureLayerRef.current;
    layer.clearLayers();

    if (!measure.active || measure.points.length < 2) return;

    const polyline = L.polyline(measure.points, { color: '#ff6b6b', weight: 2, dashArray: '8, 8' });
    layer.addLayer(polyline);

    let totalDist = 0;
    for (let i = 1; i < measure.points.length; i++) {
      totalDist += calcDistanceNm(measure.points[i - 1][0], measure.points[i - 1][1], measure.points[i][0], measure.points[i][1]);
    }

    const lastPt = measure.points[measure.points.length - 1];
    const popup = L.popup({ closeButton: false, className: 'measure-popup' })
      .setLatLng(lastPt)
      .setContent(`<div style="font-family:monospace;font-size:11px;"><strong>${totalDist.toFixed(1)} NM</strong><br/>(${(totalDist * 1.852).toFixed(1)} km)</div>`)
      .openOn(mapRef.current!);
    layer.addLayer(popup as any);
  }, [measure]);

  // Resize handling
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full rounded-md overflow-hidden border border-muted">
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'hsl(220, 20%, 10%)' }} />
    </div>
  );
}
