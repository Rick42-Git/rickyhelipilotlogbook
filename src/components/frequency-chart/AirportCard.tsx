import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, MapPin, Plane, Navigation, Pin, PinOff } from 'lucide-react';
import type { AirportGroup } from './types';

interface AirportCardProps {
  ident: string;
  data: AirportGroup;
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
}

const getTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'TWR': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'GND': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'APP': case 'DEP': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'CTAF': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'ATIS': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'CNTR': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getNavaidBadgeClass = (type: string) => {
  switch (type) {
    case 'VOR': case 'VOR-DME': case 'VORTAC': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'NDB': case 'NDB-DME': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'DME': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
    case 'TACAN': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const formatFreqKhz = (khz: number | null) => {
  if (!khz) return '—';
  if (khz >= 100000) return (khz / 1000).toFixed(2);
  return khz.toString();
};

export default function AirportCard({ ident, data, isPinned, onPin, onUnpin }: AirportCardProps) {
  return (
    <div className={`glass-panel hud-border p-3 md:p-4 space-y-3 ${isPinned ? 'ring-1 ring-primary/30' : ''}`}>
      {/* Airport Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm font-bold text-primary tracking-wider flex items-center gap-2">
            {ident}
            {data.airport?.iata_code && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                {data.airport.iata_code}
              </Badge>
            )}
          </div>
          {data.airport && (
            <div className="font-mono text-xs text-muted-foreground mt-0.5">
              {data.airport.name}
              {data.airport.municipality && ` • ${data.airport.municipality}`}
              {data.airport.iso_country && ` • ${data.airport.iso_country}`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {data.airport?.elevation_ft != null && (
            <span className="font-mono text-[10px] text-muted-foreground mr-1">
              <span className="text-foreground">{data.airport.elevation_ft}</span> ft
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={isPinned ? onUnpin : onPin}
            className={`h-7 w-7 ${isPinned ? 'text-primary hover:text-destructive' : 'text-muted-foreground hover:text-primary'}`}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Airport Details */}
      {data.airport && (data.airport.latitude_deg != null || data.airport.type) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground border-t border-border/30 pt-2">
          {data.airport.type && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {data.airport.type.replace(/_/g, ' ')}
            </span>
          )}
          {data.airport.latitude_deg != null && data.airport.longitude_deg != null && (
            <span>
              {data.airport.latitude_deg.toFixed(4)}°, {data.airport.longitude_deg.toFixed(4)}°
            </span>
          )}
        </div>
      )}

      {/* Frequencies */}
      {data.freqs.length > 0 && (
        <div className="border-t border-border/30 pt-2">
          <div className="font-mono text-[10px] text-muted-foreground/60 tracking-widest mb-1.5 flex items-center gap-1.5">
            <Radio className="h-3 w-3" />
            FREQUENCIES
          </div>
          <div className="space-y-1">
            {data.freqs.map(f => (
              <div key={f.id} className="flex items-center gap-2 font-mono text-xs">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 min-w-[44px] justify-center ${getTypeBadgeClass(f.type)}`}>
                  {f.type}
                </Badge>
                <span className="text-foreground font-semibold tabular-nums min-w-[60px]">
                  {f.frequency_mhz > 0 ? f.frequency_mhz.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : '—'}
                </span>
                <span className="text-muted-foreground truncate">
                  {f.description || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Runways */}
      {data.rwys.length > 0 && (
        <div className="border-t border-border/30 pt-2">
          <div className="font-mono text-[10px] text-muted-foreground/60 tracking-widest mb-1.5 flex items-center gap-1.5">
            <Plane className="h-3 w-3" />
            RUNWAYS
          </div>
          <div className="space-y-1">
            {data.rwys.map(r => (
              <div key={r.id} className="flex items-center gap-2 font-mono text-xs flex-wrap">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 min-w-[60px] justify-center bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                  {r.le_ident}/{r.he_ident}
                </Badge>
                <span className="text-foreground font-semibold tabular-nums">
                  {r.length_ft ? `${r.length_ft.toLocaleString()} ft` : '—'}
                </span>
                <span className="text-muted-foreground">×</span>
                <span className="text-foreground tabular-nums">
                  {r.width_ft ? `${r.width_ft} ft` : '—'}
                </span>
                <span className="text-muted-foreground">{r.surface || '—'}</span>
                {r.lighted && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    LIT
                  </Badge>
                )}
                {r.closed && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-red-500/20 text-red-400 border-red-500/30">
                    CLOSED
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navaids */}
      {data.navs.length > 0 && (
        <div className="border-t border-border/30 pt-2">
          <div className="font-mono text-[10px] text-muted-foreground/60 tracking-widest mb-1.5 flex items-center gap-1.5">
            <Navigation className="h-3 w-3" />
            NAVAIDS
          </div>
          <div className="space-y-1">
            {data.navs.map(n => (
              <div key={n.id} className="flex items-center gap-2 font-mono text-xs">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 min-w-[60px] justify-center ${getNavaidBadgeClass(n.type)}`}>
                  {n.type}
                </Badge>
                <span className="text-foreground font-semibold tabular-nums min-w-[60px]">
                  {formatFreqKhz(n.frequency_khz)}
                </span>
                <span className="text-primary font-semibold">{n.ident}</span>
                <span className="text-muted-foreground truncate">{n.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.freqs.length === 0 && data.rwys.length === 0 && data.navs.length === 0 && !data.airport && (
        <div className="font-mono text-[10px] text-muted-foreground/40 italic">No additional data available</div>
      )}
    </div>
  );
}
