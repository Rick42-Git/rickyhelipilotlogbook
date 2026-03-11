import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getActivatedUser, setActivatedUser, clearActivatedUser, ActivatedUser } from '@/lib/activation';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  /** Activated user mapped as a minimal User-like object for backward compat */
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
    setLoading(false);
  }, []);

  const activate = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-access-code', {
        body: { code },
      });

      if (error || !data?.success) {
        return { success: false, error: data?.error || 'Invalid access code' };
      }

      const u: ActivatedUser = data.user;
      setActivatedUser(u);
      setUser(u);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error — you need internet for first-time activation' };
    }
  };

  const signOut = () => {
    clearActivatedUser();
    setUser(null);
  };

  // Map activatedUser to a user-like object for backward compat
  const user = activatedUser ? { id: activatedUser.id, email: activatedUser.email } : null;

  return (
    <AuthContext.Provider value={{ user, activatedUser, loading, activate, signOut, isOfflineMode: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
