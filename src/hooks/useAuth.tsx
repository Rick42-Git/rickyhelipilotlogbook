import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getActivatedUser, setActivatedUser, clearActivatedUser, ActivatedUser } from '@/lib/activation';
import { supabase } from '@/integrations/supabase/client';
import { setSupabaseUserId } from '@/lib/supabaseHeaders';

interface AuthContextType {
  user: { id: string; email: string } | null;
  activatedUser: ActivatedUser | null;
  loading: boolean;
  activate: (code: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  isOfflineMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  activatedUser: null,
  loading: true,
  activate: async () => ({ success: false }),
  signOut: () => {},
  isOfflineMode: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [activatedUser, setUser] = useState<ActivatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getActivatedUser();
    setUser(cached);
    setSupabaseUserId(cached?.id || null);
    setLoading(false);

    // Sync display name from server in case admin updated it
    if (cached?.id) {
      supabase.functions.invoke('profile-sync', {
        body: { userId: cached.id },
      }).then(({ data, error }) => {
        if (!error && data?.data && data.data.display_name !== cached.displayName) {
          const updated = { ...cached, displayName: data.data.display_name, isAdmin: data.data.is_admin };
          setActivatedUser(updated);
          setUser(updated);
        }
      });
    }
  }, []);

  const activate = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-access-code', {
        body: { code },
      });

      console.log('[activate] response:', { data, error });

      if (error) {
        // supabase.functions.invoke wraps non-2xx as FunctionsHttpError
        // Try to extract the body from the error context
        let errorMessage = 'Invalid access code';
        if (error instanceof Error && 'context' in error) {
          try {
            const ctx = (error as any).context;
            if (ctx?.json) {
              const body = await ctx.json();
              errorMessage = body?.error || errorMessage;
            }
          } catch {}
        }
        return { success: false, error: errorMessage };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Invalid access code' };
      }

      const u: ActivatedUser = data.user;
      setActivatedUser(u);
      setUser(u);
      return { success: true };
    } catch (e) {
      console.error('[activate] caught error:', e);
      return { success: false, error: 'Network error — you need internet for first-time activation' };
    }
  };

  const signOut = () => {
    clearActivatedUser();
    setUser(null);
  };

  const user = activatedUser ? { id: activatedUser.id, email: activatedUser.email } : null;

  return (
    <AuthContext.Provider value={{ user, activatedUser, loading, activate, signOut, isOfflineMode: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
