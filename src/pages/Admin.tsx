import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Check, X, ArrowLeft, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import helicopterIcon from '@/assets/helicopter-icon.png';

interface AccessRequest {
  id: string;
  email: string;
  status: string;
  created_at: string;
  user_id: string;
  offline_approved: boolean;
}

export default function Admin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load requests');
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('access_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update request');
    } else {
      toast.success(`Request ${status}`);
      fetchRequests();
    }
  };

  const toggleOffline = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('access_requests')
      .update({ offline_approved: !current, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update offline access');
    } else {
      toast.success(`Offline access ${!current ? 'granted' : 'revoked'}`);
      fetchRequests();
    }
  };

  const statusColor = (s: string) => {
    if (s === 'approved') return 'text-green-400';
    if (s === 'rejected') return 'text-destructive';
    return 'text-primary';
  };

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <div className="glass-panel hud-border p-3 md:p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={helicopterIcon} alt="Helicopter" className="h-8 w-auto opacity-80" />
              <div>
                <h1 className="font-mono text-lg font-bold text-primary tracking-wider">ADMIN PANEL</h1>
                <p className="font-mono text-[10px] text-muted-foreground tracking-widest">WAITLIST MANAGEMENT</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/')} className="font-mono text-xs gap-1">
                <ArrowLeft className="h-3 w-3" />
                BACK
              </Button>
              <Button variant="outline" size="sm" onClick={fetchRequests} className="font-mono text-xs gap-1">
                <RefreshCw className="h-3 w-3" />
                REFRESH
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-panel hud-border p-4">
          {loading ? (
            <p className="font-mono text-xs text-muted-foreground text-center py-8">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground text-center py-8">No access requests yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_100px] gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider pb-2 border-b border-primary/20">
                <span>Email</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              {requests.map(req => (
                <div key={req.id} className="grid grid-cols-[1fr_80px_100px] gap-2 items-center py-2 border-b border-border/30">
                  <span className="font-mono text-xs text-foreground truncate">{req.email}</span>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${statusColor(req.status)}`}>
                    {req.status}
                  </span>
                  <div className="flex gap-1 justify-end">
                    {req.status !== 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, 'approved')} className="h-6 px-2 font-mono text-[10px] text-green-400 hover:bg-green-400/10">
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    {req.status !== 'rejected' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, 'rejected')} className="h-6 px-2 font-mono text-[10px] text-destructive hover:bg-destructive/10">
                        <X className="h-3 w-3" />
                      </Button>
                    )}
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
