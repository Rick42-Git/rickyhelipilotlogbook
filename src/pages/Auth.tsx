import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import helicopterIcon from '@/assets/helicopter-icon.png';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Logged in successfully');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success('Check your email to confirm your account');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
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
              {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </span>
            <div className="flex-1 alt-line" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="font-mono"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="font-mono"
          />
          <Button type="submit" className="w-full font-mono" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isLogin ? 'SIGN IN' : 'SIGN UP'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground font-mono">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
