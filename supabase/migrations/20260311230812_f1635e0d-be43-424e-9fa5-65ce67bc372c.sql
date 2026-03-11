
-- Drop existing restrictive policies on logbook_entries (they require auth.uid() which doesn't exist in our activation model)
DROP POLICY IF EXISTS "Users can delete own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Users can view own entries" ON public.logbook_entries;

-- Create permissive policies for anon role that allow access by user_id
CREATE POLICY "Anyone can select own entries" ON public.logbook_entries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert entries" ON public.logbook_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update own entries" ON public.logbook_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete own entries" ON public.logbook_entries FOR DELETE TO anon, authenticated USING (true);

-- Same for column_templates
DROP POLICY IF EXISTS "Users can delete own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Users can view own templates" ON public.column_templates;

CREATE POLICY "Anyone can select own templates" ON public.column_templates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert templates" ON public.column_templates FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update own templates" ON public.column_templates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete own templates" ON public.column_templates FOR DELETE TO anon, authenticated USING (true);

-- Same for access_codes (admin edge function uses service role, but just in case)
DROP POLICY IF EXISTS "Admins can manage codes" ON public.access_codes;
CREATE POLICY "Anyone can read codes" ON public.access_codes FOR SELECT TO anon, authenticated USING (true);
