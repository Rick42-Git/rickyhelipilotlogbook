import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle, Save, X, Check } from 'lucide-react';
import { LogbookEntry } from '@/types/logbook';
import { toast } from 'sonner';

export interface ExtractedEntry extends Omit<LogbookEntry, 'id'> {
  confidence: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: ExtractedEntry[];
  onConfirm: (entries: Omit<LogbookEntry, 'id'>[]) => void;
}

const CONFIDENCE_THRESHOLD = 98;

export function ExtractedDataReview({ open, onOpenChange, entries: initialEntries, onConfirm }: Props) {
  const [entries, setEntries] = useState<(ExtractedEntry & { accepted?: boolean })[]>(initialEntries);

  useEffect(() => {
    setEntries(initialEntries.map(e => ({
      ...e,
      // Fix common OCR misreads
      aircraftReg: e.aircraftReg?.replace(/RH-ZZ/gi, 'RH-22') ?? e.aircraftReg,
      aircraftType: e.aircraftType?.replace(/R-ZZ/gi, 'R22').replace(/RH-ZZ/gi, 'R22') ?? e.aircraftType,
      accepted: false,
    })));
  }, [initialEntries]);

  const updateField = (index: number, field: string, value: string | number) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const acceptEntry = useCallback((index: number) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, accepted: true } : e));
    // Save this single entry immediately
    const entry = entries[index];
    if (entry) {
      const { confidence, accepted, ...clean } = entry as ExtractedEntry & { accepted?: boolean };
      onConfirm([clean]);
      toast.success(`Saved: ${clean.date} ${clean.aircraftReg}`);
    }
  }, [entries, onConfirm]);

  const acceptAll = useCallback(() => {
    const unaccepted = entries.filter(e => !e.accepted);
    if (unaccepted.length === 0) return;
    const cleaned = unaccepted.map(({ confidence, accepted, ...rest }) => rest);
    onConfirm(cleaned);
    setEntries(prev => prev.map(e => ({ ...e, accepted: true })));
    toast.success(`Saved ${cleaned.length} entries`);
  }, [entries, onConfirm]);

  const flaggedCount = entries.filter(e => !e.accepted && e.confidence < CONFIDENCE_THRESHOLD).length;
  const pendingCount = entries.filter(e => !e.accepted).length;
  const acceptedCount = entries.filter(e => e.accepted).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary tracking-wider">
            ▸ REVIEW EXTRACTED DATA
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            {acceptedCount > 0 && <span className="text-primary">{acceptedCount} SAVED</span>}
            {acceptedCount > 0 && pendingCount > 0 && ' · '}
            {pendingCount > 0 && <span>{pendingCount} PENDING</span>}
            {flaggedCount > 0 && (
              <span className="text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3.5 w-3.5 inline" />
                {flaggedCount} FLAGGED — REVIEW BEFORE ACCEPTING
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[36px_90px_70px_70px_1fr_65px_65px_65px_65px_65px_65px_50px_28px] gap-1 font-mono text-[9px] text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
            <span className="text-center">OK</span>
            <span>Date</span>
            <span>Type</span>
            <span>Reg</span>
            <span>Details</span>
            <span>Day D</span>
            <span>Day P</span>
            <span>Ngt D</span>
            <span>Ngt P</span>
            <span>Instr D</span>
            <span>Instr N</span>
            <span>Conf</span>
            <span />
          </div>

          {entries.map((entry, i) => {
            const flagged = !entry.accepted && entry.confidence < CONFIDENCE_THRESHOLD;
            const accepted = entry.accepted;
            return (
              <div
                key={i}
                className={`grid grid-cols-[36px_90px_70px_70px_1fr_65px_65px_65px_65px_65px_65px_50px_28px] gap-1 items-center py-1 rounded transition-colors ${
                  accepted
                    ? 'bg-primary/10 border border-primary/30'
                    : flagged
                      ? 'bg-destructive/10 border border-destructive/30'
                      : 'border border-border/50'
                }`}
              >
                <span className="flex justify-center">
                  {accepted ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <button
                      onClick={() => acceptEntry(i)}
                      className="h-6 w-6 rounded border-2 border-primary/50 flex items-center justify-center hover:bg-primary/20 hover:border-primary transition-colors"
                      title="Accept & save this entry"
                    >
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </button>
                  )}
                </span>
                <Input
                  value={entry.date}
                  onChange={e => updateField(i, 'date', e.target.value)}
                  className={`font-mono text-xs h-7 ${flagged ? 'border-destructive/50' : ''}`}
                  placeholder="YYYY-MM-DD"
                  disabled={accepted}
                />
                <Input
                  value={entry.aircraftType}
                  onChange={e => updateField(i, 'aircraftType', e.target.value)}
                  className="font-mono text-xs h-7"
                  disabled={accepted}
                />
                <Input
                  value={entry.aircraftReg}
                  onChange={e => updateField(i, 'aircraftReg', e.target.value)}
                  className="font-mono text-xs h-7"
                  disabled={accepted}
                />
                <Input
                  value={entry.flightDetails}
                  onChange={e => updateField(i, 'flightDetails', e.target.value)}
                  className="font-mono text-xs h-7"
                  disabled={accepted}
                />
                <Input
                  type="number"
                  step="0.1"
                  value={entry.seDayDual || ''}
                  onChange={e => updateField(i, 'seDayDual', parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs h-7 text-center px-1"
                  disabled={accepted}
                  placeholder="0"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={entry.seDayPilot || ''}
                  onChange={e => updateField(i, 'seDayPilot', parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs h-7 text-center px-1"
                  disabled={accepted}
                  placeholder="0"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={entry.seNightDual || ''}
                  onChange={e => updateField(i, 'seNightDual', parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs h-7 text-center"
                  disabled={accepted}
                  placeholder="0"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={entry.seNightPilot || ''}
                  onChange={e => updateField(i, 'seNightPilot', parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs h-7 text-center"
                  disabled={accepted}
                  placeholder="0"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={entry.instructorDay || ''}
                  onChange={e => updateField(i, 'instructorDay', parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs h-7 text-center"
                  disabled={accepted}
                  placeholder="0"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={entry.instructorNight || ''}
                  onChange={e => updateField(i, 'instructorNight', parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs h-7 text-center"
                  disabled={accepted}
                  placeholder="0"
                />
                <span className={`font-mono text-xs text-center font-bold ${
                  accepted ? 'text-primary' : flagged ? 'text-destructive' : 'text-primary'
                }`}>
                  {accepted ? '✓' : `${entry.confidence}%`}
                </span>
                {!accepted ? (
                  <button
                    onClick={() => removeEntry(i)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : <span />}
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-mono">
            {pendingCount === 0 ? 'DONE' : 'CLOSE'}
          </Button>
          {pendingCount > 0 && (
            <Button onClick={acceptAll} className="font-mono gap-2">
              <Save className="h-4 w-4" />
              ACCEPT ALL ({pendingCount})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
