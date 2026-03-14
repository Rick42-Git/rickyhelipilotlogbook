import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, ArrowLeft, RefreshCw, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import helicopterIcon from '@/assets/helicopter-icon.png';

interface AccessCode {
  id: string;
  code: string;
  display_name: string;
  email: string;
  activated: boolean;
  is_admin: boolean;
  extraction_limit: number;
  created_at: string;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function Admin() {
  const { activatedUser } = useAuth();
  const navigate = useNavigate();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const adminId = activatedUser?.id;

  const fetchCodes = async () => {
    if (!adminId) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-codes', {
      body: { action: 'list', adminId },
    });

    if (error || !data?.data) {
      toast.error('Failed to load access codes');
    } else {
      setCodes(data.data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, [adminId]);

  const createCode = async () => {
    if (!newName.trim() || !adminId) { toast.error('Name is required'); return; }
    setCreating(true);

    const code = generateCode();
    const { data, error } = await supabase.functions.invoke('admin-codes', {
      body: { action: 'create', adminId, code, display_name: newName.trim(), email: newEmail.trim() },
    });

    if (error) {
      toast.error('Failed to create code');
    } else {
      toast.success(`Code created: ${code}`);
      setNewName('');
      setNewEmail('');
      fetchCodes();
    }
    setCreating(false);
  };

  const deleteCode = async (id: string) => {
    if (!adminId) return;
    const { error } = await supabase.functions.invoke('admin-codes', {
      body: { action: 'delete', adminId, id },
    });

    if (error) {
      toast.error('Failed to delete code');
    } else {
      toast.success('Code deleted');
      fetchCodes();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="glass-panel hud-border p-3 md:p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={helicopterIcon} alt="Helicopter" className="h-8 w-auto opacity-80" />
              <div>
                <h1 className="font-mono text-lg font-bold text-primary tracking-wider">ADMIN PANEL</h1>
                <p className="font-mono text-[10px] text-muted-foreground tracking-widest">ACCESS CODE MANAGEMENT</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/')} className="font-mono text-xs gap-1">
                <ArrowLeft className="h-3 w-3" />
                BACK
              </Button>
              <Button variant="outline" size="sm" onClick={fetchCodes} className="font-mono text-xs gap-1">
                <RefreshCw className="h-3 w-3" />
                REFRESH
              </Button>
            </div>
          </div>
        </div>

        {/* Create new code */}
        <div className="glass-panel hud-border p-4 mb-6">
          <h2 className="font-mono text-xs text-primary tracking-wider mb-3">GENERATE NEW ACCESS CODE</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Pilot name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="font-mono text-xs flex-1"
            />
            <Input
              placeholder="Email (optional)"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="font-mono text-xs flex-1"
            />
            <Button onClick={createCode} disabled={creating || !newName.trim()} className="font-mono text-xs gap-1">
              <Plus className="h-3 w-3" />
              GENERATE
            </Button>
          </div>
        </div>

        {/* Codes list */}
        <div className="glass-panel hud-border p-4">
          {loading ? (
            <p className="font-mono text-xs text-muted-foreground text-center py-8">Loading codes...</p>
          ) : codes.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground text-center py-8">No access codes yet. Generate one above.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_120px_80px_60px_60px] gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider pb-2 border-b border-primary/20">
                <span>Pilot</span>
                <span>Code</span>
                <span>Status</span>
                <span>Copy</span>
                <span className="text-right">Del</span>
              </div>
              {codes.map(c => (
                <div key={c.id} className="grid grid-cols-[1fr_120px_80px_60px_60px] gap-2 items-center py-2 border-b border-border/30">
                  <div>
                    <span className="font-mono text-xs text-foreground block truncate">{c.display_name}</span>
                    {c.email && <span className="font-mono text-[10px] text-muted-foreground block truncate">{c.email}</span>}
                    {c.is_admin && <span className="font-mono text-[9px] text-primary">ADMIN</span>}
                  </div>
                  <span className="font-mono text-xs text-primary tracking-widest">{c.code}</span>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${c.activated ? 'text-green-400' : 'text-muted-foreground/50'}`}>
                    {c.activated ? 'ACTIVE' : 'PENDING'}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => copyCode(c.code)} className="h-6 w-6 p-0 text-muted-foreground hover:text-primary">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => deleteCode(c.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
