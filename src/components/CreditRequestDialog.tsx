import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreditRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  used: number;
  limit: number;
}

export function CreditRequestDialog({ open, onOpenChange, userId, userName, used, limit }: CreditRequestDialogProps) {
  const [amount, setAmount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (amount < 1) { toast.error('Request at least 1 extraction'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('credit_requests')
        .insert({ user_id: userId, user_name: userName, requested_amount: amount } as any);

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a pending request');
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast.success('Credit request submitted — awaiting admin approval');
      }
    } catch (err) {
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) { setSubmitted(false); setAmount(10); }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-panel border-primary/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary tracking-wider">REQUEST AI EXTRACTIONS</DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            You've used all {used} of {limit} AI extractions. Request more credits below.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <p className="font-mono text-sm text-green-400">✓ REQUEST SUBMITTED</p>
            <p className="font-mono text-xs text-muted-foreground">
              Your admin will review your request. You'll get access once approved.
            </p>
            <Button variant="outline" onClick={() => handleClose(false)} className="font-mono text-xs">
              CLOSE
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">HOW MANY ADDITIONAL EXTRACTIONS?</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={amount}
                onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="font-mono text-sm"
              />
              <p className="font-mono text-[10px] text-muted-foreground">
                This will increase your limit from {limit} to {limit + amount} if approved.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleClose(false)} className="font-mono text-xs">
                CANCEL
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="font-mono text-xs gap-1">
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                SUBMIT REQUEST
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
