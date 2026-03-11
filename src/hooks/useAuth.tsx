import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setOfflineUser, getOfflineUser } from '@/lib/offlineCache';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isOfflineMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  isOfflineMode: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const fetchOfflineApproval = async (userId: string, email: string) => {
      try {
        const { data } = await supabase
          .from('access_requests')
          .select('offline_approved')
          .eq('user_id', userId)
          .maybeSingle();
        setOfflineUser({ id: userId, email, offlineApproved: data?.offline_approved ?? false });
      } catch {
        // Keep existing cached value if fetch fails
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsOfflineMode(false);
      if (session?.user) {
        setOfflineUser({ id: session.user.id, email: session.user.email || '' });
        fetchOfflineApproval(session.user.id, session.user.email || '');
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setOfflineUser({ id: session.user.id, email: session.user.email || '' });
        fetchOfflineApproval(session.user.id, session.user.email || '');
        setIsOfflineMode(false);
        setLoading(false);
      } else if (!navigator.onLine) {
        // Offline and no session — use cached user
        const cached = getOfflineUser();
        if (cached && cached.offlineApproved) {
          // Create a minimal User-like object for offline use
          const offlineUser = { id: cached.id, email: cached.email } as User;
          setUser(offlineUser);
          setIsOfflineMode(true);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isOfflineMode) {
      setUser(null);
      setSession(null);
      setIsOfflineMode(false);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, isOfflineMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
