import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Radio, X, Loader2, MapPin, Plane, Navigation, Pin, PinOff, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AirportCard from '@/components/frequency-chart/AirportCard';
import type { AirportGroup } from '@/components/frequency-chart/types';

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
  const [searchResults, setSearchResults] = useState<[string, AirportGroup][]>([]);
  const [pinnedResults, setPinnedResults] = useState<[string, AirportGroup][]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!search.trim() && typeFilter === 'ALL') return;
    setLoading(true);
    setSearched(true);

    const term = search.trim().toUpperCase();

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

    let airportQuery = supabase
      .from('airports')
      .select('id, ident, type, name, latitude_deg, longitude_deg, elevation_ft, municipality, iso_country, icao_code, iata_code')
      .limit(50);

    if (term) {
      airportQuery = airportQuery.or(`ident.ilike.%${term}%,icao_code.ilike.%${term}%,iata_code.ilike.%${term}%,name.ilike.%${term}%`);
    }

    const [freqRes, airportRes] = await Promise.all([freqQuery, airportQuery]);

    const freqData = freqRes.error ? [] : freqRes.data || [];
    const airportData = airportRes.error ? [] : airportRes.data || [];

    const allIdents = new Set<string>();
    freqData.forEach(f => allIdents.add(f.airport_ident));
    airportData.forEach(a => { allIdents.add(a.ident); if (a.icao_code) allIdents.add(a.icao_code); });

    const identArray = Array.from(allIdents);

    let runwayData: any[] = [];
    let navaidData: any[] = [];

    if (identArray.length > 0) {
      const [runwayRes, navaidRes] = await Promise.all([
        supabase
          .from('runways')
          .select('id, airport_ident, length_ft, width_ft, surface, lighted, closed, le_ident, he_ident, le_heading_degt, he_heading_degt')
          .in('airport_ident', identArray)
          .limit(200),
        supabase
          .from('navaids')
          .select('id, ident, name, type, frequency_khz, elevation_ft, associated_airport, power')
          .in('associated_airport', identArray)
          .limit(200),
      ]);
      runwayData = runwayRes.error ? [] : runwayRes.data || [];
      navaidData = navaidRes.error ? [] : navaidRes.data || [];
    }

    // Group into airport entries
    const map = new Map<string, AirportGroup>();

    freqData.forEach(r => {
      if (!map.has(r.airport_ident)) map.set(r.airport_ident, { freqs: [], rwys: [], navs: [] });
      map.get(r.airport_ident)!.freqs.push(r);
    });

    airportData.forEach(a => {
      if (!map.has(a.ident)) map.set(a.ident, { freqs: [], rwys: [], navs: [] });
      map.get(a.ident)!.airport = a;
    });

    runwayData.forEach(r => {
      if (map.has(r.airport_ident)) map.get(r.airport_ident)!.rwys.push(r);
    });

    navaidData.forEach(n => {
      if (map.has(n.associated_airport)) map.get(n.associated_airport)!.navs.push(n);
    });

    setSearchResults(Array.from(map.entries()));
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch();
  };

  const clearSearch = () => {
    setSearch('');
    setTypeFilter('ALL');
    setSearchResults([]);
    setSearched(false);
  };

  const pinAirport = useCallback((ident: string, data: AirportGroup) => {
    setPinnedResults(prev => {
      if (prev.some(([id]) => id === ident)) return prev;
      return [...prev, [ident, data]];
    });
  }, []);

  const unpinAirport = useCallback((ident: string) => {
    setPinnedResults(prev => prev.filter(([id]) => id !== ident));
  }, []);

  const clearAllPinned = useCallback(() => {
    setPinnedResults([]);
  }, []);

  const pinnedIdents = useMemo(() => new Set(pinnedResults.map(([id]) => id)), [pinnedResults]);

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

        {/* Pinned Results */}
        {pinnedResults.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] text-primary/70 tracking-widest flex items-center gap-1.5">
                <Pin className="h-3 w-3" />
                PINNED — {pinnedResults.length} AIRPORT{pinnedResults.length !== 1 ? 'S' : ''}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllPinned}
                className="font-mono text-[10px] h-6 px-2 text-muted-foreground hover:text-destructive gap-1"
              >
                <Trash2 className="h-3 w-3" />
                CLEAR ALL
              </Button>
            </div>
            {pinnedResults.map(([ident, data]) => (
              <AirportCard
                key={`pinned-${ident}`}
                ident={ident}
                data={data}
                isPinned={true}
                onPin={() => {}}
                onUnpin={() => unpinAirport(ident)}
              />
            ))}
          </div>
        )}

        {/* Search Results */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground font-mono text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            SEARCHING...
          </div>
        )}

        {!loading && searched && searchResults.length === 0 && (
          <div className="text-center py-12 font-mono text-sm text-muted-foreground">
            No results found. Try a different search term.
          </div>
        )}

        {!loading && !searched && pinnedResults.length === 0 && (
          <div className="text-center py-16 font-mono text-xs text-muted-foreground/60 space-y-2">
            <Radio className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p>Search by ICAO designator, IATA code, or airport name</p>
            <p className="text-[10px]">e.g. FAOR, JNB, O.R. Tambo</p>
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-muted-foreground/60 tracking-wider">
              {searchResults.length} RESULT{searchResults.length !== 1 ? 'S' : ''} — CLICK <Pin className="h-2.5 w-2.5 inline" /> TO KEEP
            </p>
            {searchResults.map(([ident, data]) => (
              <AirportCard
                key={`result-${ident}`}
                ident={ident}
                data={data}
                isPinned={pinnedIdents.has(ident)}
                onPin={() => pinAirport(ident, data)}
                onUnpin={() => unpinAirport(ident)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FrequencyChart;
