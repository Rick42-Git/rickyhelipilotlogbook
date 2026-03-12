import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const CHECKWX_API_KEY = Deno.env.get('CHECKWX_API_KEY');
  if (!CHECKWX_API_KEY) {
    return new Response(JSON.stringify({ error: 'CHECKWX_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { icao, type } = await req.json();
    
    if (!icao || typeof icao !== 'string') {
      return new Response(JSON.stringify({ error: 'ICAO code required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanIcao = icao.toUpperCase().trim();
    // Support comma-separated ICAO codes (max 10)
    const icaoCodes = cleanIcao.split(',').map(s => s.trim()).filter(Boolean).slice(0, 10);
    const icaoParam = icaoCodes.join(',');

    const endpoint = type === 'taf' ? 'taf' : 'metar';
    const url = `https://api.checkwx.com/${endpoint}/${icaoParam}/decoded`;

    const response = await fetch(url, {
      headers: { 'X-API-Key': CHECKWX_API_KEY },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`CheckWX API error [${response.status}]: ${text}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Weather fetch error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
