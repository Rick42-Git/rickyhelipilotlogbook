
CREATE TABLE public.logbook_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL DEFAULT '',
  aircraft_type TEXT NOT NULL DEFAULT '',
  aircraft_reg TEXT NOT NULL DEFAULT '',
  pilot_in_command TEXT NOT NULL DEFAULT '',
  flight_details TEXT NOT NULL DEFAULT '',
  se_day_dual NUMERIC NOT NULL DEFAULT 0,
  se_day_pilot NUMERIC NOT NULL DEFAULT 0,
  se_night_dual NUMERIC NOT NULL DEFAULT 0,
  se_night_pilot NUMERIC NOT NULL DEFAULT 0,
  instrument_nav_aids NUMERIC NOT NULL DEFAULT 0,
  instrument_place NUMERIC NOT NULL DEFAULT 0,
  instrument_time NUMERIC NOT NULL DEFAULT 0,
  instructor_day NUMERIC NOT NULL DEFAULT 0,
  instructor_night NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.logbook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries"
  ON public.logbook_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON public.logbook_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON public.logbook_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON public.logbook_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
