import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Airport, africanAirports } from '@/data/africanAirports';
import { Waypoint, calcDistanceNm } from '@/types/flightPlan';
import { getNightPolygon } from '@/lib/solarTerminator';
import { supabase } from '@/integrations/supabase/client';

interface MeasureState {
  active: boolean;
  points: [number, number][];
}

export type MapLayer = 'dark' | 'satellite' | 'terrain' | 'vfr';

interface FlightMapProps {
  waypoints: Waypoint[];
  onMapClick: (lat: number, lng: number) => void;
  measure: MeasureState;
  setMeasure: (m: MeasureState) => void;
  onAirportClick: (airport: Airport) => void;
  showAirports: boolean;
  filterCustoms: boolean;
  filterFuel: boolean;
  activeLayer: MapLayer;
  showAirspaces: boolean;
  showBoundaries: boolean;
  showTerminator: boolean;
}

export function FlightMap({
  waypoints, onMapClick, measure, setMeasure, onAirportClick,
  showAirports, filterCustoms, filterFuel,
  activeLayer, showAirspaces, showBoundaries, showTerminator,
}: FlightMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const airportLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const waypointLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const routeLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const measureLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const terminatorLayerRef = useRef<L.Polygon | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const airspaceLayerRef = useRef<L.TileLayer | null>(null);
  const boundaryLayerRef = useRef<L.TileLayer | null>(null);
  const mapBounds = useMemo(
    () => L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180)),
    []
  );

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const measureRef = useRef(measure);
  measureRef.current = measure;
  const setMeasureRef = useRef(setMeasure);
  setMeasureRef.current = setMeasure;
  const onAirportClickRef = useRef(onAirportClick);
  onAirportClickRef.current = onAirportClick;

  const baseLayers: Record<MapLayer, { url: string; attribution: string; maxZoom?: number }> = {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri',
      maxZoom: 18,
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap',
      maxZoom: 17,
    },
    vfr: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OSM',
    },
  };

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-5, 25],
      zoom: 4,
      zoomControl: true,
      minZoom: 3,
      maxZoom: 18,
      maxBounds: mapBounds,
      maxBoundsViscosity: 1,
      worldCopyJump: true,
    });

    const layer = baseLayers.dark;
    baseLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: layer.maxZoom ?? 18,
      noWrap: true,
      bounds: mapBounds,
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

    // Add scale bar in nautical miles + metric
    L.control.scale({ imperial: false, metric: true, maxWidth: 200 }).addTo(map);

    // Add lat/lng display on mouse move
    const coordDisplay = L.DomUtil.create('div', 'coord-display');
    coordDisplay.style.cssText = 'position:absolute;bottom:30px;left:10px;z-index:1000;font-family:monospace;font-size:10px;color:hsl(38,95%,55%);background:hsla(220,20%,10%,0.85);padding:2px 6px;border-radius:3px;pointer-events:none;';
    map.getContainer().appendChild(coordDisplay);
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat.toFixed(4);
      const lng = e.latlng.lng.toFixed(4);
      coordDisplay.textContent = `${lat}° ${lng}°`;
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch base layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
    }

    const layerConfig = baseLayers[activeLayer];
    baseLayerRef.current = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom ?? 18,
      noWrap: true,
      bounds: mapBounds,
    }).addTo(map);

    // Ensure overlays stay on top by re-adding them
    airportLayerRef.current.eachLayer(l => l.removeFrom(map));
    airportLayerRef.current.addTo(map);
    waypointLayerRef.current.eachLayer(l => l.removeFrom(map));
    waypointLayerRef.current.addTo(map);
    routeLayerRef.current.eachLayer(l => l.removeFrom(map));
    routeLayerRef.current.addTo(map);
  }, [activeLayer]);

  // Toggle airspace overlay (OpenAIP)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (airspaceLayerRef.current) {
      map.removeLayer(airspaceLayerRef.current);
      airspaceLayerRef.current = null;
    }

    if (showAirspaces) {
      // OpenAIP airspace tiles - free, no API key required for basic tiles
      airspaceLayerRef.current = L.tileLayer(
        'https://{s}.tile.maps.openaip.net/geowebcache/service/tms/1.0.0/openaip_approved_airspaces@EPSG%3A900913@png/{z}/{x}/{y}.png',
        {
          maxZoom: 14,
          minZoom: 4,
          opacity: 0.6,
          tms: true,
          subdomains: '12',
          noWrap: true,
          bounds: mapBounds,
          attribution: '&copy; <a href="https://www.openaip.net">openAIP</a>',
        }
      ).addTo(map);
    }
  }, [showAirspaces]);

  // Toggle country boundaries — use a lightweight tile layer instead of 23MB GeoJSON
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }

    if (showBoundaries) {
      // Use Stamen/Stadia boundary-only tiles (lightweight, no download)
      boundaryLayerRef.current = L.tileLayer(
        'https://stamen-tiles.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}.png',
        {
          opacity: 0.25,
          maxZoom: 18,
          noWrap: true,
          bounds: mapBounds,
          attribution: '&copy; Stamen',
        }
      ).addTo(map);
    }
  }, [showBoundaries]);

  // Day/Night terminator overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (terminatorLayerRef.current) {
      map.removeLayer(terminatorLayerRef.current);
      terminatorLayerRef.current = null;
    }

    if (!showTerminator) return;

    const updateTerminator = () => {
      if (terminatorLayerRef.current) {
        map.removeLayer(terminatorLayerRef.current);
      }
      const nightCoords = getNightPolygon(new Date());
      terminatorLayerRef.current = L.polygon(nightCoords, {
        fillColor: '#000',
        fillOpacity: 0.35,
        stroke: true,
        color: 'hsl(38, 95%, 55%)',
        weight: 1,
        opacity: 0.5,
        interactive: false,
      }).addTo(map);
    };

    updateTerminator();
    // Update every 5 minutes
    const interval = setInterval(updateTerminator, 300000);
    return () => {
      clearInterval(interval);
      if (terminatorLayerRef.current) {
        map.removeLayer(terminatorLayerRef.current);
        terminatorLayerRef.current = null;
      }
    };
  }, [showTerminator]);

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

      const popupId = `add-apt-${airport.icao}`;
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
          ${airport.runwaySurface ? `<div>Surface: ${airport.runwaySurface}</div>` : ''}
          ${airport.notes ? `<div style="color:#999;font-style:italic;margin-top:4px;">${airport.notes}</div>` : ''}
          <div style="margin-top:6px;"><button id="${popupId}" style="background:hsl(38,95%,55%);color:#111;border:none;padding:3px 8px;border-radius:4px;font-family:monospace;font-size:10px;cursor:pointer;font-weight:bold;">+ ADD TO ROUTE</button></div>
        </div>`;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(popupId);
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

      // Add distance labels on each leg
      for (let i = 1; i < waypoints.length; i++) {
        const from = waypoints[i - 1];
        const to = waypoints[i];
        const dist = calcDistanceNm(from.lat, from.lng, to.lat, to.lng);
        const midLat = (from.lat + to.lat) / 2;
        const midLng = (from.lng + to.lng) / 2;

        const label = L.divIcon({
          className: 'leg-distance-label',
          html: `<div style="font-family:monospace;font-size:9px;color:hsl(38,95%,55%);background:hsla(220,20%,10%,0.85);padding:1px 4px;border-radius:3px;white-space:nowrap;border:1px solid hsl(38,95%,55%,0.3);">${dist.toFixed(0)} NM</div>`,
          iconSize: [60, 16],
          iconAnchor: [30, 8],
        });
        const labelMarker = L.marker([midLat, midLng], { icon: label, interactive: false });
        rtLayer.addLayer(labelMarker);
      }
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
