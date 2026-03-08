CREATE TABLE public.column_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Template',
  column_mapping jsonb NOT NULL DEFAULT '{}',
  source_headers jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.column_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON public.column_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.column_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.column_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.column_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);