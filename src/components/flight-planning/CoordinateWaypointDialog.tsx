import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

type CoordFormat = 'DD' | 'DM' | 'DMS';

interface CoordinateWaypointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, lat: number, lng: number) => void;
}

// Scroll-wheel number selector
function ScrollSelector({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  width = 'w-16',
  padStart = 0,
  decimals = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  width?: string;
  padStart?: number;
  decimals?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dir = e.deltaY > 0 ? -step : step;
    onChange(clamp(+(value + dir).toFixed(decimals)));
  }, [value, step, min, max, decimals, onChange]);

  // Touch scrolling
  const touchStart = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientY;
    isScrolling.current = true;
  };
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isScrolling.current) return;
    const diff = touchStart.current - e.touches[0].clientY;
    if (Math.abs(diff) > 20) {
      const dir = diff > 0 ? step : -step;
      onChange(clamp(+(value + dir).toFixed(decimals)));
      touchStart.current = e.touches[0].clientY;
    }
  }, [value, step, min, max, decimals, onChange]);

  const formatVal = (v: number) => {
    const s = decimals > 0 ? v.toFixed(decimals) : Math.abs(v).toString();
    return padStart > 0 ? s.padStart(padStart, '0') : s;
  };

  const prevVal = clamp(+(value - step).toFixed(decimals));
  const nextVal = clamp(+(value + step).toFixed(decimals));

  return (
    <div className="flex flex-col items-center gap-0.5">
      {label && <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-wider">{label}</span>}
      <div
        ref={containerRef}
        className={cn("flex flex-col items-center select-none cursor-ns-resize", width)}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { isScrolling.current = false; }}
      >
        <button
          onClick={() => onChange(clamp(+(value + step).toFixed(decimals)))}
          className="font-mono text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors h-5"
        >
          {formatVal(nextVal)}
        </button>
        <div className="font-mono text-sm font-bold text-primary border border-primary/30 rounded px-2 py-0.5 bg-primary/5 min-w-[2.5rem] text-center">
          {formatVal(value)}
        </div>
        <button
          onClick={() => onChange(clamp(+(value - step).toFixed(decimals)))}
          className="font-mono text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors h-5"
        >
          {formatVal(prevVal)}
        </button>
      </div>
    </div>
  );
}

function HemisphereToggle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string] }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-wider">&nbsp;</span>
      <div className="flex flex-col gap-0">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "font-mono text-xs px-2 py-0.5 rounded transition-colors",
              value === opt ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// Convert decimal degrees to DM / DMS parts
function ddToDM(dd: number) {
  const abs = Math.abs(dd);
  const deg = Math.floor(abs);
  const min = +((abs - deg) * 60).toFixed(3);
  return { deg, min };
}

function ddToDMS(dd: number) {
  const abs = Math.abs(dd);
  const deg = Math.floor(abs);
  const minFull = (abs - deg) * 60;
  const min = Math.floor(minFull);
  const sec = +((minFull - min) * 60).toFixed(1);
  return { deg, min, sec };
}

function dmToDD(deg: number, min: number) {
  return +(deg + min / 60).toFixed(6);
}

function dmsToDD(deg: number, min: number, sec: number) {
  return +(deg + min / 60 + sec / 3600).toFixed(6);
}

export function CoordinateWaypointDialog({ open, onOpenChange, onAdd }: CoordinateWaypointDialogProps) {
  const [format, setFormat] = useState<CoordFormat>('DD');
  const [name, setName] = useState('');

  // DD state
  const [latDD, setLatDD] = useState(0);
  const [lngDD, setLngDD] = useState(0);

  // DM state
  const [latDeg, setLatDeg] = useState(0);
  const [latMin, setLatMin] = useState(0);
  const [lngDeg, setLngDeg] = useState(0);
  const [lngMin, setLngMin] = useState(0);

  // DMS state
  const [latDMSDeg, setLatDMSDeg] = useState(0);
  const [latDMSMin, setLatDMSMin] = useState(0);
  const [latDMSSec, setLatDMSSec] = useState(0);
  const [lngDMSDeg, setLngDMSDeg] = useState(0);
  const [lngDMSMin, setLngDMSMin] = useState(0);
  const [lngDMSSec, setLngDMSSec] = useState(0);

  // Hemispheres
  const [latHemi, setLatHemi] = useState<'N' | 'S'>('S');
  const [lngHemi, setLngHemi] = useState<'E' | 'W'>('E');

  // Sync when switching formats
  const getDecimalLat = (): number => {
    let val = 0;
    if (format === 'DD') val = Math.abs(latDD);
    else if (format === 'DM') val = dmToDD(latDeg, latMin);
    else val = dmsToDD(latDMSDeg, latDMSMin, latDMSSec);
    return latHemi === 'S' ? -val : val;
  };

  const getDecimalLng = (): number => {
    let val = 0;
    if (format === 'DD') val = Math.abs(lngDD);
    else if (format === 'DM') val = dmToDD(lngDeg, lngMin);
    else val = dmsToDD(lngDMSDeg, lngDMSMin, lngDMSSec);
    return lngHemi === 'W' ? -val : val;
  };

  const syncFromDD = (lat: number, lng: number) => {
    const absLat = Math.abs(lat);
    const absLng = Math.abs(lng);
    // DM
    const dmLat = ddToDM(lat);
    setLatDeg(dmLat.deg); setLatMin(dmLat.min);
    const dmLng = ddToDM(lng);
    setLngDeg(dmLng.deg); setLngMin(dmLng.min);
    // DMS
    const dmsLat = ddToDMS(lat);
    setLatDMSDeg(dmsLat.deg); setLatDMSMin(dmsLat.min); setLatDMSSec(dmsLat.sec);
    const dmsLng = ddToDMS(lng);
    setLngDMSDeg(dmsLng.deg); setLngDMSMin(dmsLng.min); setLngDMSSec(dmsLng.sec);
  };

  const handleFormatChange = (newFormat: string) => {
    if (!newFormat) return;
    const lat = getDecimalLat();
    const lng = getDecimalLng();
    const absLat = Math.abs(lat);
    const absLng = Math.abs(lng);

    if (newFormat === 'DD') {
      setLatDD(+absLat.toFixed(4));
      setLngDD(+absLng.toFixed(4));
    } else if (newFormat === 'DM') {
      const dm1 = ddToDM(lat); setLatDeg(dm1.deg); setLatMin(+dm1.min.toFixed(2));
      const dm2 = ddToDM(lng); setLngDeg(dm2.deg); setLngMin(+dm2.min.toFixed(2));
    } else {
      const dms1 = ddToDMS(lat); setLatDMSDeg(dms1.deg); setLatDMSMin(dms1.min); setLatDMSSec(+dms1.sec.toFixed(1));
      const dms2 = ddToDMS(lng); setLngDMSDeg(dms2.deg); setLngDMSMin(dms2.min); setLngDMSSec(+dms2.sec.toFixed(1));
    }
    setFormat(newFormat as CoordFormat);
  };

  const handleAdd = () => {
    const lat = getDecimalLat();
    const lng = getDecimalLng();
    const wpName = name.trim() || `WPT ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    onAdd(wpName, lat, lng);
    // Reset
    setName('');
    setLatDD(0); setLngDD(0);
    setLatDeg(0); setLatMin(0); setLngDeg(0); setLngMin(0);
    setLatDMSDeg(0); setLatDMSMin(0); setLatDMSSec(0);
    setLngDMSDeg(0); setLngDMSMin(0); setLngDMSSec(0);
    onOpenChange(false);
  };

  // Preview
  const previewLat = getDecimalLat();
  const previewLng = getDecimalLng();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Add Waypoint by Coordinates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label className="font-mono text-[10px] text-muted-foreground">WAYPOINT NAME (optional)</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-7 font-mono text-xs"
              placeholder="Custom Waypoint"
            />
          </div>

          {/* Format toggle */}
          <div className="flex items-center justify-between">
            <Label className="font-mono text-[10px] text-muted-foreground">FORMAT</Label>
            <ToggleGroup type="single" value={format} onValueChange={handleFormatChange} className="gap-0">
              <ToggleGroupItem value="DD" className="font-mono text-[10px] h-6 px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">DD</ToggleGroupItem>
              <ToggleGroupItem value="DM" className="font-mono text-[10px] h-6 px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">DM</ToggleGroupItem>
              <ToggleGroupItem value="DMS" className="font-mono text-[10px] h-6 px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">DMS</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Latitude */}
          <div className="space-y-1">
            <Label className="font-mono text-[10px] text-muted-foreground">LATITUDE</Label>
            <div className="flex items-center justify-center gap-2 py-2">
              {format === 'DD' && (
                <>
                  <ScrollSelector value={latDD} onChange={setLatDD} min={0} max={90} step={0.0001} decimals={4} label="Degrees" width="w-20" />
                  <span className="font-mono text-muted-foreground mt-4">°</span>
                </>
              )}
              {format === 'DM' && (
                <>
                  <ScrollSelector value={latDeg} onChange={setLatDeg} min={0} max={90} step={1} label="Deg" padStart={2} />
                  <span className="font-mono text-muted-foreground mt-4">°</span>
                  <ScrollSelector value={latMin} onChange={setLatMin} min={0} max={59.99} step={0.01} decimals={2} label="Min" width="w-18" />
                  <span className="font-mono text-muted-foreground mt-4">'</span>
                </>
              )}
              {format === 'DMS' && (
                <>
                  <ScrollSelector value={latDMSDeg} onChange={setLatDMSDeg} min={0} max={90} step={1} label="Deg" padStart={2} />
                  <span className="font-mono text-muted-foreground mt-4">°</span>
                  <ScrollSelector value={latDMSMin} onChange={setLatDMSMin} min={0} max={59} step={1} label="Min" padStart={2} />
                  <span className="font-mono text-muted-foreground mt-4">'</span>
                  <ScrollSelector value={latDMSSec} onChange={setLatDMSSec} min={0} max={59.9} step={0.1} decimals={1} label="Sec" width="w-16" />
                  <span className="font-mono text-muted-foreground mt-4">"</span>
                </>
              )}
              <HemisphereToggle value={latHemi} onChange={v => setLatHemi(v as 'N' | 'S')} options={['N', 'S']} />
            </div>
          </div>

          {/* Longitude */}
          <div className="space-y-1">
            <Label className="font-mono text-[10px] text-muted-foreground">LONGITUDE</Label>
            <div className="flex items-center justify-center gap-2 py-2">
              {format === 'DD' && (
                <>
                  <ScrollSelector value={lngDD} onChange={setLngDD} min={0} max={180} step={0.0001} decimals={4} label="Degrees" width="w-20" />
                  <span className="font-mono text-muted-foreground mt-4">°</span>
                </>
              )}
              {format === 'DM' && (
                <>
                  <ScrollSelector value={lngDeg} onChange={setLngDeg} min={0} max={180} step={1} label="Deg" padStart={3} />
                  <span className="font-mono text-muted-foreground mt-4">°</span>
                  <ScrollSelector value={lngMin} onChange={setLngMin} min={0} max={59.99} step={0.01} decimals={2} label="Min" width="w-18" />
                  <span className="font-mono text-muted-foreground mt-4">'</span>
                </>
              )}
              {format === 'DMS' && (
                <>
                  <ScrollSelector value={lngDMSDeg} onChange={setLngDMSDeg} min={0} max={180} step={1} label="Deg" padStart={3} />
                  <span className="font-mono text-muted-foreground mt-4">°</span>
                  <ScrollSelector value={lngDMSMin} onChange={setLngDMSMin} min={0} max={59} step={1} label="Min" padStart={2} />
                  <span className="font-mono text-muted-foreground mt-4">'</span>
                  <ScrollSelector value={lngDMSSec} onChange={setLngDMSSec} min={0} max={59.9} step={0.1} decimals={1} label="Sec" width="w-16" />
                  <span className="font-mono text-muted-foreground mt-4">"</span>
                </>
              )}
              <HemisphereToggle value={lngHemi} onChange={v => setLngHemi(v as 'E' | 'W')} options={['E', 'W']} />
            </div>
          </div>

          {/* Preview */}
          <div className="glass-panel p-2 rounded-md text-center">
            <span className="font-mono text-[10px] text-muted-foreground">DECIMAL: </span>
            <span className="font-mono text-xs text-foreground font-semibold">
              {previewLat.toFixed(4)}°, {previewLng.toFixed(4)}°
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-mono text-xs">Cancel</Button>
          <Button onClick={handleAdd} className="font-mono text-xs">
            <MapPin className="h-3 w-3 mr-1" />Add Waypoint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
