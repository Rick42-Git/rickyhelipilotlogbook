
CREATE TABLE public.credit_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  requested_amount integer NOT NULL DEFAULT 5,
  approved_amount integer,
  status text NOT NULL DEFAULT 'pending',
  admin_note text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert credit requests" ON public.credit_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can select credit requests" ON public.credit_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update credit requests" ON public.credit_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
