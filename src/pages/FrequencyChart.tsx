import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Radio, X, Loader2, MapPin, Plane, Navigation } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FrequencyRow {
  id: number;
  airport_ident: string;
  type: string;
  description: string;
  frequency_mhz: number;
}

interface AirportRow {
  id: number;
  ident: string;
  type: string;
  name: string;
  latitude_deg: number | null;
  longitude_deg: number | null;
  elevation_ft: number | null;
  municipality: string;
  iso_country: string;
  icao_code: string;
  iata_code: string;
}

interface RunwayRow {
  id: number;
  airport_ident: string;
  length_ft: number | null;
  width_ft: number | null;
  surface: string;
  lighted: boolean;
  closed: boolean;
  le_ident: string;
  he_ident: string;
  le_heading_degT: number | null;
  he_heading_degT: number | null;
}

interface NavaidRow {
  id: number;
  ident: string;
  name: string;
  type: string;
  frequency_khz: number | null;
  elevation_ft: number | null;
  associated_airport: string;
  power: string;
}

const FREQ_TYPES = [
  { value: 'ALL', label: 'All Types' },
  { value: 'TWR', label: 'Tower' },
  { value: 'GND', label: 'Ground' },
  { value: 'APP', label: 'Approach' },
  { value: 'DEP', label: 'Departure' },
  { value: 'CTAF', label: 'CTAF' },
  { value: 'ATIS', label: 'ATIS' },
  { value: 'UNIC', label: 'UNICOM' },
  { value: 'CNTR', label: 'Center' },
  { value: 'CLNC', label: 'Clearance' },
  { value: 'FSS', label: 'FSS' },
  { value: 'A/D', label: 'A/D' },
  { value: 'MULT', label: 'Multicom' },
  { value: 'OPS', label: 'Operations' },
];

const FrequencyChart = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [results, setResults] = useState<FrequencyRow[]>([]);
  const [airports, setAirports] = useState<AirportRow[]>([]);
  const [runways, setRunways] = useState<RunwayRow[]>([]);
  const [navaids, setNavaids] = useState<NavaidRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!search.trim() && typeFilter === 'ALL') return;
    setLoading(true);
    setSearched(true);

    const term = search.trim().toUpperCase();

    // Run all queries in parallel
    let freqQuery = supabase
      .from('airport_frequencies')
      .select('id, airport_ident, type, description, frequency_mhz')
      .order('airport_ident')
      .limit(200);

    if (term) {
      freqQuery = freqQuery.or(`airport_ident.ilike.%${term}%,description.ilike.%${term}%`);
    }
    if (typeFilter !== 'ALL') {
      freqQuery = freqQuery.eq('type', typeFilter);
    }

    // Airport search
    let airportQuery = supabase
      .from('airports')
      .select('id, ident, type, name, latitude_deg, longitude_deg, elevation_ft, municipality, iso_country, icao_code, iata_code')
      .limit(50);

    if (term) {
      airportQuery = airportQuery.or(`ident.ilike.%${term}%,icao_code.ilike.%${term}%,iata_code.ilike.%${term}%,name.ilike.%${term}%`);
    }

    const [freqRes, airportRes] = await Promise.all([
      freqQuery,
      airportQuery,
    ]);

    const freqData = freqRes.error ? [] : (freqRes.data as FrequencyRow[]) || [];
    const airportData = airportRes.error ? [] : (airportRes.data as AirportRow[]) || [];

    // Get all unique airport idents from results
    const allIdents = new Set<string>();
    freqData.forEach(f => allIdents.add(f.airport_ident));
    airportData.forEach(a => { allIdents.add(a.ident); if (a.icao_code) allIdents.add(a.icao_code); });

    const identArray = Array.from(allIdents);

    // Fetch runways and navaids for matched airports
    if (identArray.length > 0) {
      const [runwayRes, navaidRes] = await Promise.all([
        supabase
          .from('runways')
          .select('id, airport_ident, length_ft, width_ft, surface, lighted, closed, le_ident, he_ident, le_heading_degT, he_heading_degT')
          .in('airport_ident', identArray)
          .limit(200),
        supabase
          .from('navaids')
          .select('id, ident, name, type, frequency_khz, elevation_ft, associated_airport, power')
          .in('associated_airport', identArray)
          .limit(200),
      ]);

      setRunways(runwayRes.error ? [] : (runwayRes.data as RunwayRow[]) || []);
      setNavaids(navaidRes.error ? [] : (navaidRes.data as NavaidRow[]) || []);
    } else {
      setRunways([]);
      setNavaids([]);
    }

    setResults(freqData);
    setAirports(airportData);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch();
  };

  const clearSearch = () => {
    setSearch('');
    setTypeFilter('ALL');
    setResults([]);
    setAirports([]);
    setRunways([]);
    setNavaids([]);
    setSearched(false);
  };

  // Group results by airport
  const grouped = useMemo(() => {
    const map = new Map<string, {
      freqs: FrequencyRow[];
      airport?: AirportRow;
      rwys: RunwayRow[];
      navs: NavaidRow[];
    }>();

    // Add from frequencies
    results.forEach(r => {
      if (!map.has(r.airport_ident)) {
        map.set(r.airport_ident, { freqs: [], rwys: [], navs: [] });
      }
      map.get(r.airport_ident)!.freqs.push(r);
    });

    // Add from airports
    airports.forEach(a => {
      const key = a.ident;
      if (!map.has(key)) {
        map.set(key, { freqs: [], rwys: [], navs: [] });
      }
      map.get(key)!.airport = a;
    });

    // Add runways
    runways.forEach(r => {
      if (map.has(r.airport_ident)) {
        map.get(r.airport_ident)!.rwys.push(r);
      }
    });

    // Add navaids
    navaids.forEach(n => {
      if (map.has(n.associated_airport)) {
        map.get(n.associated_airport)!.navs.push(n);
      }
    });

    return Array.from(map.entries());
  }, [results, airports, runways, navaids]);

  const totalResults = results.length + airports.length;

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

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="glass-panel hud-border p-3 md:p-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Radio className="h-5 w-5 text-primary opacity-80" />
            <div>
              <h1 className="font-mono text-base md:text-xl font-bold text-primary tracking-wider">
                FREQUENCY CHART
              </h1>
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
                AIRPORTS • FREQUENCIES • RUNWAYS • NAVAIDS
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="glass-panel hud-border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ICAO, IATA, or airport name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 font-mono text-sm bg-background/50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px] font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQ_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value} className="font-mono text-sm">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={doSearch} className="font-mono text-xs gap-1.5 flex-1 sm:flex-initial">
                <Search className="h-3.5 w-3.5" />
                SEARCH
              </Button>
              {searched && (
                <Button variant="outline" onClick={clearSearch} className="font-mono text-xs gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  CLEAR
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground font-mono text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            SEARCHING...
          </div>
        )}

        {!loading && searched && grouped.length === 0 && (
          <div className="text-center py-12 font-mono text-sm text-muted-foreground">
            No results found. Try a different search term.
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-16 font-mono text-xs text-muted-foreground/60 space-y-2">
            <Radio className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p>Search by ICAO designator, IATA code, or airport name</p>
            <p className="text-[10px]">e.g. FAOR, JNB, O.R. Tambo</p>
          </div>
        )}

        {!loading && grouped.length > 0 && (
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-muted-foreground/60 tracking-wider">
              {grouped.length} AIRPORT{grouped.length !== 1 ? 'S' : ''} FOUND
            </p>
            {grouped.map(([ident, data]) => (
              <div key={ident} className="glass-panel hud-border p-3 md:p-4 space-y-3">
                {/* Airport Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
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
                  {data.airport?.elevation_ft != null && (
                    <div className="font-mono text-[10px] text-muted-foreground text-right shrink-0">
                      <span className="text-foreground">{data.airport.elevation_ft}</span> ft
                    </div>
                  )}
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

                {/* Empty state for airport with no data */}
                {data.freqs.length === 0 && data.rwys.length === 0 && data.navs.length === 0 && !data.airport && (
                  <div className="font-mono text-[10px] text-muted-foreground/40 italic">No additional data available</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FrequencyChart;
