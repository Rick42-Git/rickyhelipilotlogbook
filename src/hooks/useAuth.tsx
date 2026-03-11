import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setOfflineUser } from '@/lib/offlineCache';
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

  const enableGuestMode = useCallback(() => {
    const guestUser = {
      id: 'offline-guest-user',
      email: 'offline@local.dev',
    } as User;

    setSession(null);
    setUser(guestUser);
    setIsOfflineMode(true);
    setOfflineUser({ id: guestUser.id, email: guestUser.email || '', offlineApproved: true });
  }, []);

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.user) {
        setSession(nextSession);
        setUser(nextSession.user);
        setIsOfflineMode(false);
        setOfflineUser({ id: nextSession.user.id, email: nextSession.user.email || '' });
        fetchOfflineApproval(nextSession.user.id, nextSession.user.email || '');
      } else {
        enableGuestMode();
      }
      setLoading(false);
    });

    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          setOfflineUser({ id: currentSession.user.id, email: currentSession.user.email || '' });
          fetchOfflineApproval(currentSession.user.id, currentSession.user.email || '');
          setIsOfflineMode(false);
        } else {
          enableGuestMode();
        }
        setLoading(false);
      })
      .catch(() => {
        enableGuestMode();
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [enableGuestMode]);

  const signOut = async () => {
    if (!isOfflineMode) {
      await supabase.auth.signOut();
    }
    enableGuestMode();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, isOfflineMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
