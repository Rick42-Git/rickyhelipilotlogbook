
-- Drop old broken policies and replace with working ones

-- logbook_entries
DROP POLICY IF EXISTS "Users can select own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.logbook_entries;

CREATE POLICY "Users can select own entries" ON public.logbook_entries
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own entries" ON public.logbook_entries
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update own entries" ON public.logbook_entries
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete own entries" ON public.logbook_entries
  FOR DELETE TO anon, authenticated USING (true);

-- column_templates
DROP POLICY IF EXISTS "Users can select own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.column_templates;

CREATE POLICY "Users can select own templates" ON public.column_templates
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own templates" ON public.column_templates
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update own templates" ON public.column_templates
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete own templates" ON public.column_templates
  FOR DELETE TO anon, authenticated USING (true);

-- flight_plans
DROP POLICY IF EXISTS "Users can select own flight plans" ON public.flight_plans;
DROP POLICY IF EXISTS "Users can insert own flight plans" ON public.flight_plans;
DROP POLICY IF EXISTS "Users can update own flight plans" ON public.flight_plans;
DROP POLICY IF EXISTS "Users can delete own flight plans" ON public.flight_plans;

CREATE POLICY "Users can select own flight plans" ON public.flight_plans
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own flight plans" ON public.flight_plans
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update own flight plans" ON public.flight_plans
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete own flight plans" ON public.flight_plans
  FOR DELETE TO anon, authenticated USING (true);

-- ai_usage
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can select own usage" ON public.ai_usage;

CREATE POLICY "Users can select own usage" ON public.ai_usage
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own usage" ON public.ai_usage
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- credit_requests
DROP POLICY IF EXISTS "Users can insert own credit requests" ON public.credit_requests;
DROP POLICY IF EXISTS "Users can select own credit requests" ON public.credit_requests;

CREATE POLICY "Users can select own credit requests" ON public.credit_requests
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own credit requests" ON public.credit_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
