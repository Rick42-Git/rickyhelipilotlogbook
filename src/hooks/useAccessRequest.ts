import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AccessStatus = 'pending' | 'approved' | 'rejected' | 'none' | 'loading';

export function useAccessRequest() {
  const { user } = useAuth();
  const [status, setStatus] = useState<AccessStatus>('loading');

  const checkStatus = async () => {
    if (!user) { setStatus('none'); return; }
    
    const { data, error } = await supabase
      .from('access_requests')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) { setStatus('none'); return; }
    if (!data) { setStatus('none'); return; }
    setStatus(data.status as AccessStatus);
  };

  const requestAccess = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('access_requests')
      .insert({ user_id: user.id, email: user.email || '' });
    
    if (error) {
      if (error.code === '23505') {
        // Already requested
        await checkStatus();
      }
      return;
    }
    setStatus('pending');
  };

  useEffect(() => { checkStatus(); }, [user]);

  return { status, requestAccess, checkStatus };
}
