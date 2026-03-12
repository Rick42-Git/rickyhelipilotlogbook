import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// OurAirports CSV URL
const AIRPORTS_CSV_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

// African country ISO codes
const AFRICAN_COUNTRIES = new Set([
  'ZA','BW','NA','MZ','ZW','ZM','TZ','KE','UG','ET','RW','CD','MW','MG','AO','CG','GA',
  'CM','NG','GH','SN','MR','ML','BF','NE','TD','CF','GQ','ST','BJ','TG','CI','GN','SL',
  'LR','GM','GW','CV','DJ','ER','SO','SD','SS','LY','TN','DZ','MA','EG','MU','SC','KM',
  'RE','YT','LS','SZ','BI',
]);

// Cache (edge functions are short-lived, but within a request batch this helps)
let cachedAirports: any[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour

async function fetchAirports(): Promise<any[]> {
  if (cachedAirports && Date.now() - cacheTime < CACHE_TTL) {
    return cachedAirports;
  }

  const response = await fetch(AIRPORTS_CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch OurAirports CSV: ${response.status}`);
  }

  const text = await response.text();
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const airports: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV respecting quoted fields
    const values: string[] = [];
    let current = '';
    let inQuote = false;
    for (const char of line) {
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || '';
    });

    const countryCode = record['iso_country'] || '';
    if (!AFRICAN_COUNTRIES.has(countryCode)) continue;

    // Filter: only medium/large airports + seaplane bases + heliports for helicopters
    const type = record['type'] || '';
    if (type === 'closed') continue;

    const lat = parseFloat(record['latitude_deg']);
    const lng = parseFloat(record['longitude_deg']);
    if (isNaN(lat) || isNaN(lng)) continue;

    const ident = record['ident'] || '';
    const name = record['name'] || '';
    const elevation = parseInt(record['elevation_ft'] || '0') || 0;

    airports.push({
      icao: ident,
      name,
      country: countryCode,
      lat,
      lng,
      elevation,
      type, // small_airport, medium_airport, large_airport, heliport, seaplane_base
      municipality: record['municipality'] || '',
      scheduled_service: record['scheduled_service'] === 'yes',
      iata: record['iata_code'] || undefined,
    });
  }

  cachedAirports = airports;
  cacheTime = Date.now();
  return airports;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const typeFilter = url.searchParams.get('type'); // small_airport, medium_airport, large_airport, heliport
    const country = url.searchParams.get('country'); // ISO code
    const search = url.searchParams.get('search')?.toLowerCase();

    let airports = await fetchAirports();

    // Apply filters
    if (typeFilter) {
      const types = typeFilter.split(',');
      airports = airports.filter(a => types.includes(a.type));
    }
    if (country) {
      airports = airports.filter(a => a.country === country.toUpperCase());
    }
    if (search) {
      airports = airports.filter(a =>
        a.icao.toLowerCase().includes(search) ||
        a.name.toLowerCase().includes(search) ||
        a.municipality.toLowerCase().includes(search) ||
        (a.iata && a.iata.toLowerCase().includes(search))
      );
    }

    return new Response(JSON.stringify({
      results: airports.length,
      data: airports,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    console.error('Airport fetch error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
