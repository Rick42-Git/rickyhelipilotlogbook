import { supabase } from '@/integrations/supabase/client';

/**
 * Sets the x-user-id header on the Supabase client for RLS policies
 * that scope data access to the current activated user.
 */
export function setSupabaseUserId(userId: string | null) {
  if (userId) {
    // Set custom header that PostgREST passes through to Postgres
    // This is used by RLS policies to scope data to the current user
    (supabase as any).rest.headers['x-user-id'] = userId;
  } else {
    delete (supabase as any).rest.headers['x-user-id'];
  }
}
