import { useAuth } from '@/hooks/useAuth';

export function useIsAdmin() {
  const { activatedUser, loading } = useAuth();
  return {
    isAdmin: activatedUser?.isAdmin ?? false,
    loading,
  };
}
