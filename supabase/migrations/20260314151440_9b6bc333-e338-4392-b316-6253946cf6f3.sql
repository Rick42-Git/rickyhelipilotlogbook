
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert usage" ON public.ai_usage
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can select usage" ON public.ai_usage
  FOR SELECT TO anon, authenticated USING (true);
