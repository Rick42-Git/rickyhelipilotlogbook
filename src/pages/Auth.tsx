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
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 overflow-hidden relative selection:bg-primary/30 font-mono">
      {/* Background tech grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, hsl(var(--muted-foreground)) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />

      {/* Ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main component */}
      <div className="relative w-full max-w-md animate-fade-in">
        {/* HUD corner brackets */}
        <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-primary/40" />
        <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-primary/40" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-primary/40" />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-primary/40" />

        {/* Decorative telemetry — desktop only */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 text-[10px] text-muted-foreground/40 tracking-tighter">
          <div>ALT [24.000]</div>
          <div className="h-px w-8 bg-border" />
          <div>HDG [342°]</div>
          <div className="h-px w-12 bg-border" />
          <div>SPD [140KT]</div>
        </div>
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 text-[10px] text-muted-foreground/40 tracking-tighter items-end">
          <div>LAT [34.05°N]</div>
          <div className="h-px w-8 bg-border" />
          <div>LON [118.24°W]</div>
          <div className="h-px w-12 bg-border" />
          <div>SYS [READY]</div>
        </div>

        <div className="relative bg-card border border-border/50 shadow-2xl p-10 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center space-y-3 mb-10">
            <div className="relative inline-block">
              <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl" />
              <img
                src={helicopterIcon}
                alt="Helicopter"
                className="relative h-14 w-auto mx-auto drop-shadow-[0_0_16px_hsl(38_95%_55%/0.5)]"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-[0.2em] uppercase pt-2">
              Heli Pilot Logbook
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-border" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/70 font-bold">
                Activation
              </span>
              <div className="h-px w-8 bg-border" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <p className="text-muted-foreground text-xs leading-relaxed text-center max-w-[280px] mx-auto">
              Enter the access code provided by your administrator to activate this device.
            </p>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary/20 group-focus-within:bg-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="ACCESS CODE"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  required
                  autoComplete="off"
                  className="w-full bg-background/60 border-border h-auto px-6 py-4 text-center tracking-[0.5em] text-primary placeholder:text-muted-foreground/40 focus-visible:border-primary/50 transition-all font-mono font-bold text-base"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full h-auto py-4 font-mono font-bold uppercase tracking-[0.2em] text-sm shadow-[0_0_20px_hsl(38_95%_55%/0.15)] hover:shadow-[0_0_28px_hsl(38_95%_55%/0.35)] transition-shadow"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Activate
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-border/50 flex flex-col items-center gap-2">
            <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest text-muted-foreground/60">
              <span>One-time activation</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Works offline after</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
            </div>
          </div>
        </div>

        {/* Bottom UI label */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/40 uppercase tracking-[0.5em] whitespace-nowrap">
          Secure Terminal · V2.04
        </div>
      </div>
    </div>
  );
}
