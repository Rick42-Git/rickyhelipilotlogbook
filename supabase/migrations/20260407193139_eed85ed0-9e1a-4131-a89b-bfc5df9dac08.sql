
-- 1. Remove public SELECT on access_codes (data now served via edge function)
DROP POLICY IF EXISTS "Anyone can read codes" ON public.access_codes;

-- 2. Restrict credit_requests UPDATE to only allow users to insert their own requests
-- Remove the overly permissive update policy
DROP POLICY IF EXISTS "Anyone can update credit requests" ON public.credit_requests;

-- 3. Tighten logbook_entries: scope SELECT, UPDATE, DELETE to own user_id
-- Since this app uses anon role, we use a request header approach:
-- The client passes user_id, and RLS checks it matches.
-- For now, remove the overly permissive policies and add user_id-scoped ones.

-- Drop existing overly permissive policies on logbook_entries
DROP POLICY IF EXISTS "Anyone can select own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Anyone can update own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Anyone can delete own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Anyone can insert entries" ON public.logbook_entries;

-- Re-create with user_id scoping via request header
-- The app will need to set the user_id header on requests
CREATE POLICY "Users can select own entries" ON public.logbook_entries
  FOR SELECT TO anon, authenticated
  USING (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

CREATE POLICY "Users can insert own entries" ON public.logbook_entries
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

CREATE POLICY "Users can update own entries" ON public.logbook_entries
  FOR UPDATE TO anon, authenticated
  USING (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  )
  WITH CHECK (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

CREATE POLICY "Users can delete own entries" ON public.logbook_entries
  FOR DELETE TO anon, authenticated
  USING (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

-- Similarly tighten flight_plans
DROP POLICY IF EXISTS "Anyone can select own flight plans" ON public.flight_plans;
DROP POLICY IF EXISTS "Anyone can insert flight plans" ON public.flight_plans;
DROP POLICY IF EXISTS "Anyone can update own flight plans" ON public.flight_plans;
DROP POLICY IF EXISTS "Anyone can delete own flight plans" ON public.flight_plans;

CREATE POLICY "Users can select own flight plans" ON public.flight_plans
  FOR SELECT TO anon, authenticated
  USING (
    user_id = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

CREATE POLICY "Users can insert own flight plans" ON public.flight_plans
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

CREATE POLICY "Users can update own flight plans" ON public.flight_plans
  FOR UPDATE TO anon, authenticated
  USING (
    user_id = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  )
  WITH CHECK (
    user_id = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

CREATE POLICY "Users can delete own flight plans" ON public.flight_plans
  FOR DELETE TO anon, authenticated
  USING (
    user_id = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

-- Tighten column_templates similarly
DROP POLICY IF EXISTS "Anyone can select own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Anyone can insert templates" ON public.column_templates;
DROP POLICY IF EXISTS "Anyone can update own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Anyone can delete own templates" ON public.column_templates;

CREATE POLICY "Users can select own templates" ON public.column_templates
  FOR SELECT TO anon, authenticated
  USING (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

CREATE POLICY "Users can insert own templates" ON public.column_templates
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

CREATE POLICY "Users can update own templates" ON public.column_templates
  FOR UPDATE TO anon, authenticated
  USING (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  )
  WITH CHECK (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

CREATE POLICY "Users can delete own templates" ON public.column_templates
  FOR DELETE TO anon, authenticated
  USING (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );
