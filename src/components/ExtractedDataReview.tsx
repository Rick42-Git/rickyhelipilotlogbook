import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { LogbookEntry } from '@/types/logbook';

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
  const [entries, setEntries] = useState<ExtractedEntry[]>(initialEntries);

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  const updateField = (index: number, field: string, value: string | number) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const cleaned = entries.map(({ confidence, ...rest }) => rest);
    onConfirm(cleaned);
    onOpenChange(false);
  };

  const flaggedCount = entries.filter(e => e.confidence < CONFIDENCE_THRESHOLD).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary tracking-wider">
            ▸ REVIEW EXTRACTED DATA
          </DialogTitle>
          {flaggedCount > 0 && (
            <p className="font-mono text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {flaggedCount} ENTR{flaggedCount === 1 ? 'Y' : 'IES'} FLAGGED FOR REVIEW — LOW AI CONFIDENCE
            </p>
          )}
        </DialogHeader>

        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[28px_90px_70px_70px_100px_1fr_60px_60px_28px] gap-1.5 font-mono text-[9px] text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
            <span />
            <span>Date</span>
            <span>Type</span>
            <span>Reg</span>
            <span>PIC</span>
            <span>Details</span>
            <span>Day Hrs</span>
            <span>Conf</span>
            <span />
          </div>

          {entries.map((entry, i) => {
            const flagged = entry.confidence < CONFIDENCE_THRESHOLD;
            return (
              <div
                key={i}
                className={`grid grid-cols-[28px_90px_70px_70px_100px_1fr_60px_60px_28px] gap-1.5 items-center py-1 rounded ${
                  flagged ? 'bg-destructive/10 border border-destructive/30' : 'border border-transparent'
                }`}
              >
                <span className="flex justify-center">
                  {flagged ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </span>
                <Input
                  value={entry.date}
                  onChange={e => updateField(i, 'date', e.target.value)}
                  className={`font-mono text-xs h-7 ${flagged ? 'border-destructive/50' : ''}`}
                  placeholder="YYYY-MM-DD"
                />
                <Input
                  value={entry.aircraftType}
                  onChange={e => updateField(i, 'aircraftType', e.target.value)}
                  className="font-mono text-xs h-7"
                />
                <Input
                  value={entry.aircraftReg}
                  onChange={e => updateField(i, 'aircraftReg', e.target.value)}
                  className="font-mono text-xs h-7"
                />
                <Input
                  value={entry.pilotInCommand}
                  onChange={e => updateField(i, 'pilotInCommand', e.target.value)}
                  className="font-mono text-xs h-7"
                />
                <Input
                  value={entry.flightDetails}
                  onChange={e => updateField(i, 'flightDetails', e.target.value)}
                  className="font-mono text-xs h-7"
                />
                <span className="font-mono text-xs text-center text-foreground">
                  {(entry.seDayDual + entry.seDayPilot + entry.seNightDual + entry.seNightPilot).toFixed(1)}
                </span>
                <span className={`font-mono text-xs text-center font-bold ${
                  flagged ? 'text-destructive' : 'text-primary'
                }`}>
                  {entry.confidence}%
                </span>
                <button
                  onClick={() => removeEntry(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-mono">
            CANCEL
          </Button>
          <Button onClick={handleConfirm} className="font-mono gap-2" disabled={entries.length === 0}>
            <Save className="h-4 w-4" />
            SAVE {entries.length} ENTR{entries.length === 1 ? 'Y' : 'IES'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
