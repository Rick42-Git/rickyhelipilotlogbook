import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import helicopterIcon from '@/assets/helicopter-icon.png';

export default function Auth() {
  const { activate } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);

    const result = await activate(code.trim());
    if (result.success) {
      toast.success('Access granted — welcome!');
    } else {
      toast.error(result.error || 'Invalid code');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background grid-bg scanline flex items-center justify-center px-4">
      <div className="glass-panel hud-border p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <img src={helicopterIcon} alt="Helicopter" className="h-16 w-auto mx-auto opacity-70 drop-shadow-[0_0_12px_hsl(38_95%_55%/0.3)]" />
          <h1 className="font-mono text-xl font-bold text-primary tracking-wider">
            HELI PILOT LOGBOOK
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex-1 alt-line" />
            <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em]">
              ACTIVATION
            </span>
            <div className="flex-1 alt-line" />
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            Enter the access code provided by your administrator to activate this device.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="ACCESS CODE"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            required
            className="font-mono text-center tracking-[0.3em] text-lg"
            autoComplete="off"
          />
          <Button type="submit" className="w-full font-mono" disabled={loading || !code.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            ACTIVATE
          </Button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground/50 font-mono">
          One-time activation • Works offline after
        </p>
      </div>
    </div>
  );
}
