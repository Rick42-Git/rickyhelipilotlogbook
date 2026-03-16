import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Radio, X, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!search.trim() && typeFilter === 'ALL') return;
    setLoading(true);
    setSearched(true);

    let query = supabase
      .from('airport_frequencies')
      .select('id, airport_ident, type, description, frequency_mhz')
      .order('airport_ident')
      .limit(200);

    if (search.trim()) {
      const term = search.trim().toUpperCase();
      // Search by airport ident or description
      query = query.or(`airport_ident.ilike.%${term}%,description.ilike.%${term}%`);
    }

    if (typeFilter !== 'ALL') {
      query = query.eq('type', typeFilter);
    }

    const { data, error } = await query;
    setResults(error ? [] : (data as FrequencyRow[]) || []);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch();
  };

  const clearSearch = () => {
    setSearch('');
    setTypeFilter('ALL');
    setResults([]);
    setSearched(false);
  };

  // Group results by airport
  const grouped = useMemo(() => {
    const map = new Map<string, FrequencyRow[]>();
    results.forEach(r => {
      const arr = map.get(r.airport_ident) || [];
      arr.push(r);
      map.set(r.airport_ident, arr);
    });
    return Array.from(map.entries());
  }, [results]);

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
                30,000+ AIRPORT FREQUENCIES
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
                placeholder="Search by ICAO, name, or description..."
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

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12 font-mono text-sm text-muted-foreground">
            No frequencies found. Try a different search term.
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-16 font-mono text-xs text-muted-foreground/60 space-y-2">
            <Radio className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p>Search by ICAO designator (e.g. FAOR, FACT)</p>
          </div>
        )}

        {!loading && grouped.length > 0 && (
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-muted-foreground/60 tracking-wider">
              {results.length} RESULT{results.length !== 1 ? 'S' : ''} • {grouped.length} AIRPORT{grouped.length !== 1 ? 'S' : ''}
              {results.length >= 200 && ' • SHOWING FIRST 200'}
            </p>
            {grouped.map(([ident, freqs]) => (
              <div key={ident} className="glass-panel hud-border p-3 md:p-4">
                <div className="font-mono text-sm font-bold text-primary tracking-wider mb-2">
                  {ident}
                </div>
                <div className="space-y-1.5">
                  {freqs.map(f => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FrequencyChart;
