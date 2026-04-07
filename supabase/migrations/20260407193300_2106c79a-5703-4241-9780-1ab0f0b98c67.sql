
-- Add a restrictive policy on access_codes so it's not flagged as "RLS enabled no policy"
-- Only service role (edge functions) should access this table
CREATE POLICY "No direct access" ON public.access_codes
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Tighten ai_usage INSERT to require user_id match
DROP POLICY IF EXISTS "Anyone can insert usage" ON public.ai_usage;
CREATE POLICY "Users can insert own usage" ON public.ai_usage
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

-- Tighten ai_usage SELECT to own data
DROP POLICY IF EXISTS "Anyone can select usage" ON public.ai_usage;
CREATE POLICY "Users can select own usage" ON public.ai_usage
  FOR SELECT TO anon, authenticated
  USING (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

-- Tighten credit_requests INSERT
DROP POLICY IF EXISTS "Anyone can insert credit requests" ON public.credit_requests;
CREATE POLICY "Users can insert own credit requests" ON public.credit_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );

-- Tighten credit_requests SELECT to own data
DROP POLICY IF EXISTS "Anyone can select credit requests" ON public.credit_requests;
CREATE POLICY "Users can select own credit requests" ON public.credit_requests
  FOR SELECT TO anon, authenticated
  USING (
    user_id::text = coalesce(
      current_setting('request.headers', true)::json->>'x-user-id',
      ''
    )
  );
