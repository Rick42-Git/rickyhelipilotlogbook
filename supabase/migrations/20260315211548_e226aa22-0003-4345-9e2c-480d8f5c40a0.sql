
CREATE TABLE public.airport_frequencies (
  id integer PRIMARY KEY,
  airport_ref integer NOT NULL,
  airport_ident text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  frequency_mhz numeric
);

ALTER TABLE public.airport_frequencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read frequencies"
  ON public.airport_frequencies
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX idx_airport_frequencies_ident ON public.airport_frequencies(airport_ident);
CREATE INDEX idx_airport_frequencies_type ON public.airport_frequencies(type);
CREATE INDEX idx_airport_frequencies_description ON public.airport_frequencies USING gin(to_tsvector('english', description));
