import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Waypoint, calcDistanceNm, calcBearing, formatTime } from '@/types/flightPlan';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, X, FastForward, ChevronLeft, ChevronRight } from 'lucide-react';

interface FlyoverViewProps {
  waypoints: Waypoint[];
  groundSpeed: number; // knots
  onClose: () => void;
}

// Interpolate between two points
function interpolateLatLng(
  lat1: number, lng1: number, lat2: number, lng2: number, t: number
): [number, number] {
  return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t];
}

// Build a dense path from waypoints for smooth animation
function buildPath(waypoints: Waypoint[]): { lat: number; lng: number; legIndex: number; t: number }[] {
  if (waypoints.length < 2) return [];
  const path: { lat: number; lng: number; legIndex: number; t: number }[] = [];
  const stepsPerLeg = 200;

  for (let i = 0; i < waypoints.length - 1; i++) {
    for (let s = 0; s <= stepsPerLeg; s++) {
      const t = s / stepsPerLeg;
      const [lat, lng] = interpolateLatLng(
        waypoints[i].lat, waypoints[i].lng,
        waypoints[i + 1].lat, waypoints[i + 1].lng,
        t
      );
      path.push({ lat, lng, legIndex: i, t });
    }
  }
  return path;
}

export function FlyoverView({ waypoints, groundSpeed, onClose }: FlyoverViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heliMarkerRef = useRef<L.Marker | null>(null);
  const trailRef = useRef<L.Polyline | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const animFrameRef = useRef<number>(0);
  const pathRef = useRef<ReturnType<typeof buildPath>>([]);
  const progressRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [currentLeg, setCurrentLeg] = useState(0);
  const [currentBearing, setCurrentBearing] = useState(0);
  const [distanceCovered, setDistanceCovered] = useState(0);
  const [elapsedMin, setElapsedMin] = useState(0);

  // Total route distance
  const totalDistNm = waypoints.reduce((sum, wp, i) => {
    if (i === 0) return 0;
    return sum + calcDistanceNm(waypoints[i - 1].lat, waypoints[i - 1].lng, wp.lat, wp.lng);
  }, 0);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current || waypoints.length < 2) return;

    const map = L.map(containerRef.current, {
      center: [waypoints[0].lat, waypoints[0].lng],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 18,
    });

    // Satellite layer for cinematic feel
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
    }).addTo(map);

    // Route line (ghost)
    const positions = waypoints.map(w => [w.lat, w.lng] as [number, number]);
    routeRef.current = L.polyline(positions, {
      color: 'hsla(38, 95%, 55%, 0.3)',
      weight: 3,
      dashArray: '8, 8',
    }).addTo(map);

    // Waypoint markers
    waypoints.forEach((wp, i) => {
      const icon = L.divIcon({
        className: 'flyover-wp-icon',
        html: `<div style="width:22px;height:22px;border-radius:50%;background:hsla(38,95%,55%,0.9);border:2px solid hsl(0,0%,10%);color:hsl(0,0%,10%);display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:10px;font-weight:bold;">${i + 1}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([wp.lat, wp.lng], { icon, interactive: false }).addTo(map);
    });

    // Trail polyline (already flown)
    trailRef.current = L.polyline([], {
      color: 'hsl(38, 95%, 55%)',
      weight: 4,
      opacity: 0.9,
    }).addTo(map);

    // Helicopter marker
    const heliIcon = L.divIcon({
      className: 'heli-marker',
      html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 8px hsla(38,95%,55%,0.8));">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(38,95%,55%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L12 6"/>
          <path d="M5 6L19 6"/>
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 15L12 20"/>
          <path d="M8 20L16 20"/>
          <path d="M15 12L20 9"/>
          <path d="M9 12L4 9"/>
        </svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    heliMarkerRef.current = L.marker([waypoints[0].lat, waypoints[0].lng], { icon: heliIcon, interactive: false }).addTo(map);

    // Build path
    pathRef.current = buildPath(waypoints);

    // Fit bounds
    map.fitBounds(L.latLngBounds(positions), { padding: [60, 60] });

    mapRef.current = map;

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, [waypoints]);

  // Animation loop
  const animate = useCallback(() => {
    if (!pathRef.current.length) return;

    const path = pathRef.current;
    const totalSteps = path.length - 1;
    // Speed: steps per frame — higher speed = faster
    const stepsPerFrame = (speed * 2);

    progressRef.current = Math.min(progressRef.current + stepsPerFrame / totalSteps, 1);
    const idx = Math.min(Math.floor(progressRef.current * totalSteps), totalSteps);
    const point = path[idx];

    if (heliMarkerRef.current) {
      heliMarkerRef.current.setLatLng([point.lat, point.lng]);
    }

    // Update trail
    if (trailRef.current) {
      const trailPoints = path.slice(0, idx + 1).map(p => [p.lat, p.lng] as [number, number]);
      trailRef.current.setLatLngs(trailPoints);
    }

    // Smooth camera follow
    if (mapRef.current) {
      mapRef.current.panTo([point.lat, point.lng], { animate: true, duration: 0.3 });
    }

    // Update HUD info
    setProgress(progressRef.current);
    setCurrentLeg(point.legIndex);

    // Bearing
    if (idx < totalSteps) {
      const next = path[Math.min(idx + 5, totalSteps)];
      setCurrentBearing(Math.round(calcBearing(point.lat, point.lng, next.lat, next.lng)));
    }

    // Distance & time
    const coveredDist = totalDistNm * progressRef.current;
    setDistanceCovered(coveredDist);
    setElapsedMin(groundSpeed > 0 ? (coveredDist / groundSpeed) * 60 : 0);

    if (progressRef.current >= 1) {
      setPlaying(false);
      return;
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [speed, totalDistNm, groundSpeed]);

  useEffect(() => {
    if (playing) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playing, animate]);

  const handleReset = () => {
    setPlaying(false);
    progressRef.current = 0;
    setProgress(0);
    setDistanceCovered(0);
    setElapsedMin(0);
    setCurrentLeg(0);
    setCurrentBearing(0);
    if (trailRef.current) trailRef.current.setLatLngs([]);
    if (heliMarkerRef.current && waypoints.length > 0) {
      heliMarkerRef.current.setLatLng([waypoints[0].lat, waypoints[0].lng]);
    }
    if (mapRef.current && waypoints.length >= 2) {
      const positions = waypoints.map(w => [w.lat, w.lng] as [number, number]);
      mapRef.current.fitBounds(L.latLngBounds(positions), { padding: [60, 60] });
    }
  };

  const handleSliderChange = (val: number[]) => {
    const v = val[0] / 100;
    progressRef.current = v;
    setProgress(v);

    const path = pathRef.current;
    if (!path.length) return;
    const idx = Math.min(Math.floor(v * (path.length - 1)), path.length - 1);
    const point = path[idx];

    if (heliMarkerRef.current) heliMarkerRef.current.setLatLng([point.lat, point.lng]);
    if (trailRef.current) {
      trailRef.current.setLatLngs(path.slice(0, idx + 1).map(p => [p.lat, p.lng] as [number, number]));
    }
    if (mapRef.current) mapRef.current.panTo([point.lat, point.lng], { animate: false });
    setCurrentLeg(point.legIndex);
    setDistanceCovered(totalDistNm * v);
    setElapsedMin(groundSpeed > 0 ? (totalDistNm * v / groundSpeed) * 60 : 0);
  };

  const cycleSpeed = () => {
    setSpeed(prev => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      if (prev === 4) return 8;
      return 1;
    });
  };

  const fromWp = waypoints[currentLeg];
  const toWp = waypoints[currentLeg + 1];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Map */}
      <div ref={containerRef} className="flex-1" />

      {/* HUD overlay - top */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
        <div className="glass-panel p-3 pointer-events-auto rounded-lg space-y-1 min-w-[200px]"
             style={{ background: 'hsla(220, 20%, 5%, 0.85)', border: '1px solid hsla(38, 95%, 55%, 0.3)' }}>
          <div className="font-mono text-[10px] text-muted-foreground tracking-widest">CURRENT LEG</div>
          <div className="font-mono text-sm text-primary font-bold">
            {fromWp?.name || `WPT ${currentLeg + 1}`}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {toWp?.name || 'DESTINATION'}
          </div>
          <div className="flex gap-4 mt-2">
            <div>
              <div className="font-mono text-[9px] text-muted-foreground">HDG</div>
              <div className="font-mono text-sm text-primary">{currentBearing}°</div>
            </div>
            <div>
              <div className="font-mono text-[9px] text-muted-foreground">GS</div>
              <div className="font-mono text-sm text-foreground">{groundSpeed} KTS</div>
            </div>
            <div>
              <div className="font-mono text-[9px] text-muted-foreground">LEG</div>
              <div className="font-mono text-sm text-foreground">{currentLeg + 1}/{waypoints.length - 1}</div>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose}
                className="pointer-events-auto h-10 w-10 rounded-full"
                style={{ background: 'hsla(220, 20%, 5%, 0.85)', border: '1px solid hsla(38, 95%, 55%, 0.3)' }}>
          <X className="h-5 w-5 text-primary" />
        </Button>
      </div>

      {/* HUD overlay - top right stats */}
      <div className="absolute top-4 right-16 pointer-events-none">
        <div className="glass-panel p-3 rounded-lg space-y-1"
             style={{ background: 'hsla(220, 20%, 5%, 0.85)', border: '1px solid hsla(38, 95%, 55%, 0.3)' }}>
          <div className="flex gap-4">
            <div>
              <div className="font-mono text-[9px] text-muted-foreground">DIST</div>
              <div className="font-mono text-sm text-foreground">{distanceCovered.toFixed(1)} NM</div>
            </div>
            <div>
              <div className="font-mono text-[9px] text-muted-foreground">REM</div>
              <div className="font-mono text-sm text-foreground">{(totalDistNm - distanceCovered).toFixed(1)} NM</div>
            </div>
            <div>
              <div className="font-mono text-[9px] text-muted-foreground">ETE</div>
              <div className="font-mono text-sm text-foreground">{formatTime(elapsedMin)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls - bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4"
           style={{ background: 'linear-gradient(transparent, hsla(220,20%,5%,0.95))' }}>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mb-3">
          <Slider
            value={[progress * 100]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={handleSliderChange}
            className="cursor-pointer"
          />
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleReset}
                  className="h-10 w-10 rounded-full"
                  style={{ background: 'hsla(220, 20%, 5%, 0.7)', border: '1px solid hsla(38, 95%, 55%, 0.2)' }}>
            <RotateCcw className="h-4 w-4 text-primary" />
          </Button>

          <Button variant="ghost" size="icon"
                  onClick={() => setPlaying(!playing)}
                  className="h-14 w-14 rounded-full"
                  style={{ background: 'hsla(38, 95%, 55%, 0.2)', border: '2px solid hsl(38, 95%, 55%)' }}>
            {playing
              ? <Pause className="h-6 w-6 text-primary" />
              : <Play className="h-6 w-6 text-primary ml-0.5" />
            }
          </Button>

          <Button variant="ghost" size="icon" onClick={cycleSpeed}
                  className="h-10 w-10 rounded-full"
                  style={{ background: 'hsla(220, 20%, 5%, 0.7)', border: '1px solid hsla(38, 95%, 55%, 0.2)' }}>
            <span className="font-mono text-xs text-primary font-bold">{speed}x</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
