import { supabase } from '@/integrations/supabase/client';
import { getActivatedUser } from '@/lib/activation';

export type ProxyTable =
  | 'logbook_entries'
  | 'flight_plans'
  | 'column_templates'
  | 'ai_usage'
  | 'credit_requests';

export interface ProxyResult<T = any> {
  data?: T;
  error?: { message: string; code?: string };
}

/**
 * Calls the secure `data-proxy` edge function with the user's access code.
 * The function verifies the code server-side and uses service role to query
 * the database — clients can no longer spoof identity by setting a header.
 */
export async function invokeDataProxy<T = any>(
  table: ProxyTable,
  action: string,
  payload?: any,
): Promise<ProxyResult<T>> {
  const accessCode = getActivatedUser()?.accessCode;
  if (!accessCode) {
    return { error: { message: 'Not activated — please re-enter your access code' } };
  }

  const { data, error } = await supabase.functions.invoke('data-proxy', {
    body: { accessCode, table, action, payload },
  });

  if (error) return { error: { message: error.message || 'Network error' } };
  if (data?.error) return { error: { message: data.error, code: data.code } };
  return { data: data?.data as T };
}
