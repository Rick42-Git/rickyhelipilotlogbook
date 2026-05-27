
-- Drop all spoofable policies on the 5 user-data tables, revoke client grants.
-- Service role (used by the data-proxy edge function) bypasses RLS and keeps full access.

-- logbook_entries
DROP POLICY IF EXISTS "Users can select own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.logbook_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.logbook_entries;
REVOKE ALL ON public.logbook_entries FROM anon, authenticated;
GRANT ALL ON public.logbook_entries TO service_role;

-- flight_plans
DROP POLICY IF EXISTS "Users can select own flight plans" ON public.flight_plans;
DROP POLICY IF EXISTS "Users can insert own flight plans" ON public.flight_plans;
DROP POLICY IF EXISTS "Users can update own flight plans" ON public.flight_plans;
DROP POLICY IF EXISTS "Users can delete own flight plans" ON public.flight_plans;
REVOKE ALL ON public.flight_plans FROM anon, authenticated;
GRANT ALL ON public.flight_plans TO service_role;

-- column_templates
DROP POLICY IF EXISTS "Users can select own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.column_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.column_templates;
REVOKE ALL ON public.column_templates FROM anon, authenticated;
GRANT ALL ON public.column_templates TO service_role;

-- ai_usage
DROP POLICY IF EXISTS "Users can select own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;
REVOKE ALL ON public.ai_usage FROM anon, authenticated;
GRANT ALL ON public.ai_usage TO service_role;

-- credit_requests
DROP POLICY IF EXISTS "Users can select own credit requests" ON public.credit_requests;
DROP POLICY IF EXISTS "Users can insert own credit requests" ON public.credit_requests;
REVOKE ALL ON public.credit_requests FROM anon, authenticated;
GRANT ALL ON public.credit_requests TO service_role;

-- user_roles: prevent any client write (no INSERT/UPDATE/DELETE policy = denied,
-- but revoke grants too for defense in depth)
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
REVOKE ALL ON public.user_roles FROM anon, authenticated;
GRANT ALL ON public.user_roles TO service_role;
-- Keep RLS enabled (defense in depth; the admin SELECT policy isn't useful
-- since the app doesn't use Supabase Auth — admin checks happen server-side
-- via access_codes.is_admin).
