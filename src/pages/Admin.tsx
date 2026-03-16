import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, ArrowLeft, RefreshCw, Plus, Copy, Check, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import helicopterIcon from '@/assets/helicopter-icon.png';
import { setActivatedUser, getActivatedUser } from '@/lib/activation';
import DataImporter from '@/components/DataImporter';

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

interface CreditRequest {
  id: string;
  user_id: string;
  user_name: string;
  requested_amount: number;
  approved_amount: number | null;
  status: string;
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
  const [newExtractionLimit, setNewExtractionLimit] = useState(5);
  const [creating, setCreating] = useState(false);

  // Credit requests
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [editingAmount, setEditingAmount] = useState<Record<string, number>>({});
  const [editingName, setEditingName] = useState<Record<string, string>>({});

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

  const fetchCreditRequests = async () => {
    const { data } = await supabase
      .from('credit_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setCreditRequests((data as any[]) || []);
  };

  useEffect(() => { fetchCodes(); fetchCreditRequests(); }, [adminId]);

  const createCode = async () => {
    if (!newName.trim() || !adminId) { toast.error('Name is required'); return; }
    setCreating(true);

    const code = generateCode();
    const { error } = await supabase.functions.invoke('admin-codes', {
      body: { action: 'create', adminId, code, display_name: newName.trim(), email: newEmail.trim(), extraction_limit: newExtractionLimit },
    });

    if (error) {
      toast.error('Failed to create code');
    } else {
      toast.success(`Code created: ${code}`);
      setNewName('');
      setNewEmail('');
      setNewExtractionLimit(5);
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

  const saveName = async (codeEntry: AccessCode) => {
    const newDisplayName = editingName[codeEntry.id];
    if (!newDisplayName?.trim() || !adminId) return;
    const { error } = await supabase.functions.invoke('admin-codes', {
      body: { action: 'update_name', adminId, id: codeEntry.id, display_name: newDisplayName.trim() },
    });
    if (error) {
      toast.error('Failed to update name');
    } else {
      toast.success('Name updated');
      // Update localStorage if editing own name
      const current = getActivatedUser();
      if (current && current.id === codeEntry.id) {
        setActivatedUser({ ...current, displayName: newDisplayName.trim() });
      }
      setEditingName(prev => { const next = { ...prev }; delete next[codeEntry.id]; return next; });
      fetchCodes();
    }
  };

  const handleCreditAction = async (request: CreditRequest, action: 'approve' | 'reject') => {
    if (!adminId) return;
    const approvedAmount = action === 'approve' ? (editingAmount[request.id] ?? request.requested_amount) : 0;

    const { error } = await supabase.functions.invoke('admin-codes', {
      body: {
        action: 'credit_response',
        adminId,
        requestId: request.id,
        userId: request.user_id,
        approvedAmount,
        status: action === 'approve' ? 'approved' : 'rejected',
      },
    });

    if (error) {
      toast.error('Failed to process request');
    } else {
      toast.success(action === 'approve' ? `Approved ${approvedAmount} credits` : 'Request rejected');
      fetchCreditRequests();
      fetchCodes();
    }
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
              <Button variant="outline" size="sm" onClick={() => { fetchCodes(); fetchCreditRequests(); }} className="font-mono text-xs gap-1">
                <RefreshCw className="h-3 w-3" />
                REFRESH
              </Button>
            </div>
          </div>
        </div>

        {/* Credit Requests */}
        {creditRequests.length > 0 && (
          <div className="glass-panel hud-border p-4 mb-6 border-accent/30">
            <h2 className="font-mono text-xs text-accent tracking-wider mb-3">
              PENDING CREDIT REQUESTS ({creditRequests.length})
            </h2>
            <div className="space-y-3">
              {creditRequests.map(cr => (
                <div key={cr.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded border border-border/50 bg-background/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-foreground truncate">{cr.user_name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      Requested <span className="text-accent">{cr.requested_amount}</span> additional extractions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={editingAmount[cr.id] ?? cr.requested_amount}
                      onChange={e => setEditingAmount(prev => ({ ...prev, [cr.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="font-mono text-xs w-20 h-7"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCreditAction(cr, 'approve')}
                      className="font-mono text-[10px] h-7 gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-3 w-3" />
                      APPROVE
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCreditAction(cr, 'reject')}
                      className="font-mono text-[10px] h-7 gap-1"
                    >
                      <X className="h-3 w-3" />
                      REJECT
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
            <Input
              type="number"
              min={1}
              placeholder="Extractions"
              value={newExtractionLimit}
              onChange={e => setNewExtractionLimit(Math.max(1, parseInt(e.target.value) || 5))}
              className="font-mono text-xs w-28"
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
              <div className="grid grid-cols-[1fr_120px_60px_80px_60px_60px] gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider pb-2 border-b border-primary/20">
                <span>Pilot</span>
                <span>Code</span>
                <span>Limit</span>
                <span>Status</span>
                <span>Copy</span>
                <span className="text-right">Del</span>
              </div>
              {codes.map(c => (
                <div key={c.id} className="grid grid-cols-[1fr_120px_60px_80px_60px_60px] gap-2 items-center py-2 border-b border-border/30">
                  <div className="flex items-center gap-1 min-w-0">
                    {editingName[c.id] !== undefined ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Input
                          value={editingName[c.id]}
                          onChange={e => setEditingName(prev => ({ ...prev, [c.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && saveName(c)}
                          className="font-mono text-xs h-6 flex-1"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={() => saveName(c)} className="h-6 w-6 p-0 text-green-400 hover:text-green-300">
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingName(prev => { const next = { ...prev }; delete next[c.id]; return next; })} className="h-6 w-6 p-0 text-muted-foreground">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-xs text-foreground block truncate">{c.display_name}</span>
                          {c.email && <span className="font-mono text-[10px] text-muted-foreground block truncate">{c.email}</span>}
                          {c.is_admin && <span className="font-mono text-[9px] text-primary">ADMIN</span>}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setEditingName(prev => ({ ...prev, [c.id]: c.display_name }))} className="h-5 w-5 p-0 text-muted-foreground hover:text-primary flex-shrink-0">
                          <Edit2 className="h-2.5 w-2.5" />
                        </Button>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-xs text-primary tracking-widest">{c.code}</span>
                  <span className="font-mono text-xs text-accent">{c.extraction_limit}</span>
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

        {/* Data Import Section */}
        <DataImporter />
      </div>
    </div>
  );
}
