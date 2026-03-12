
CREATE TABLE public.flight_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  name text NOT NULL DEFAULT 'Untitled Plan',
  aircraft_type text NOT NULL DEFAULT '',
  aircraft_reg text NOT NULL DEFAULT '',
  pilot_in_command text NOT NULL DEFAULT '',
  ground_speed numeric NOT NULL DEFAULT 90,
  fuel_burn_rate numeric NOT NULL DEFAULT 120,
  fuel_on_board numeric NOT NULL DEFAULT 0,
  reserve_fuel numeric NOT NULL DEFAULT 0,
  waypoints jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.flight_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select own flight plans"
ON public.flight_plans FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can insert flight plans"
ON public.flight_plans FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update own flight plans"
ON public.flight_plans FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete own flight plans"
ON public.flight_plans FOR DELETE
TO anon, authenticated
USING (true);
