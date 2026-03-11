import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getActivatedUser, setActivatedUser, clearActivatedUser, ActivatedUser } from '@/lib/activation';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  activatedUser: ActivatedUser | null;
  loading: boolean;
  activate: (code: string) => Promise<{ success: boolean; error?: string }>;
  deactivate: () => void;
}

const AuthContext = createContext<AuthContextType>({
  activatedUser: null,
  loading: true,
  activate: async () => ({ success: false }),
  deactivate: () => {},
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

      const user: ActivatedUser = data.user;
      setActivatedUser(user);
      setUser(user);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error — you need internet for first-time activation' };
    }
  };

  const deactivate = () => {
    clearActivatedUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ activatedUser, loading, activate, deactivate }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
