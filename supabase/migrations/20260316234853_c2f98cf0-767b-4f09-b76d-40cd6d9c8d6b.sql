
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.airports (
  id integer PRIMARY KEY,
  ident text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  latitude_deg double precision,
  longitude_deg double precision,
  elevation_ft integer,
  continent text NOT NULL DEFAULT '',
  iso_country text NOT NULL DEFAULT '',
  iso_region text NOT NULL DEFAULT '',
  municipality text NOT NULL DEFAULT '',
  scheduled_service text NOT NULL DEFAULT 'no',
  icao_code text NOT NULL DEFAULT '',
  iata_code text NOT NULL DEFAULT '',
  gps_code text NOT NULL DEFAULT '',
  local_code text NOT NULL DEFAULT ''
);

CREATE TABLE public.runways (
  id integer PRIMARY KEY,
  airport_ref integer NOT NULL,
  airport_ident text NOT NULL DEFAULT '',
  length_ft integer,
  width_ft integer,
  surface text NOT NULL DEFAULT '',
  lighted boolean NOT NULL DEFAULT false,
  closed boolean NOT NULL DEFAULT false,
  le_ident text NOT NULL DEFAULT '',
  le_heading_degT double precision,
  he_ident text NOT NULL DEFAULT '',
  he_heading_degT double precision
);

CREATE TABLE public.navaids (
  id integer PRIMARY KEY,
  ident text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  frequency_khz double precision,
  latitude_deg double precision,
  longitude_deg double precision,
  elevation_ft integer,
  iso_country text NOT NULL DEFAULT '',
  dme_frequency_khz double precision,
  dme_channel text NOT NULL DEFAULT '',
  magnetic_variation_deg double precision,
  usage_type text NOT NULL DEFAULT '',
  power text NOT NULL DEFAULT '',
  associated_airport text NOT NULL DEFAULT ''
);

CREATE INDEX idx_airports_ident ON public.airports(ident);
CREATE INDEX idx_airports_icao ON public.airports(icao_code);
CREATE INDEX idx_airports_iata ON public.airports(iata_code);
CREATE INDEX idx_airports_name ON public.airports USING gin(name gin_trgm_ops);
CREATE INDEX idx_runways_airport_ident ON public.runways(airport_ident);
CREATE INDEX idx_navaids_associated_airport ON public.navaids(associated_airport);
CREATE INDEX idx_navaids_ident ON public.navaids(ident);

ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navaids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read airports" ON public.airports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read runways" ON public.runways FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read navaids" ON public.navaids FOR SELECT TO anon, authenticated USING (true);
