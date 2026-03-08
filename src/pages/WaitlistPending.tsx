import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Clock, LogOut } from 'lucide-react';
import helicopterIcon from '@/assets/helicopter-icon.png';

interface WaitlistPendingProps {
  status: 'pending' | 'rejected';
}

export default function WaitlistPending({ status }: WaitlistPendingProps) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background grid-bg scanline flex items-center justify-center px-4">
      <div className="glass-panel hud-border p-8 w-full max-w-sm space-y-6 text-center">
        <img src={helicopterIcon} alt="Helicopter" className="h-16 w-auto mx-auto opacity-70 drop-shadow-[0_0_12px_hsl(38_95%_55%/0.3)]" />
        
        {status === 'pending' ? (
          <>
            <Clock className="h-10 w-10 mx-auto text-primary animate-pulse" />
            <h2 className="font-mono text-lg font-bold text-primary tracking-wider">
              ACCESS PENDING
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              Your access request has been submitted. You'll be able to use the app once an admin approves your request.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-mono text-lg font-bold text-destructive tracking-wider">
              ACCESS DENIED
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              Your access request was rejected. Contact the administrator for more information.
            </p>
          </>
        )}

        <Button variant="outline" onClick={signOut} className="font-mono gap-2">
          <LogOut className="h-4 w-4" />
          SIGN OUT
        </Button>
      </div>
    </div>
  );
}
