import { WifiOff } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-center py-1.5 font-mono text-xs tracking-widest flex items-center justify-center gap-2">
      <WifiOff className="h-3.5 w-3.5" />
      OFFLINE MODE — CHANGES WILL SYNC WHEN ONLINE
    </div>
  );
}
