import { useState } from 'react';
import { LogbookEntry, emptyEntry, NumericField } from '@/types/logbook';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: LogbookEntry | null;
  onSave: (entry: Omit<LogbookEntry, 'id'>) => void;
}

const fields: { key: keyof Omit<LogbookEntry, 'id'>; label: string; type: string; half?: boolean }[] = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'aircraftType', label: 'Aircraft Type', type: 'text' },
  { key: 'aircraftReg', label: 'Registration', type: 'text' },
  { key: 'from', label: 'From', type: 'text', half: true },
  { key: 'to', label: 'To', type: 'text', half: true },
  { key: 'departureTime', label: 'Dep Time', type: 'time', half: true },
  { key: 'arrivalTime', label: 'Arr Time', type: 'time', half: true },
  { key: 'totalTime', label: 'Total Time (hrs)', type: 'number' },
  { key: 'picTime', label: 'PIC (hrs)', type: 'number', half: true },
  { key: 'sicTime', label: 'SIC (hrs)', type: 'number', half: true },
  { key: 'dualTime', label: 'Dual (hrs)', type: 'number', half: true },
  { key: 'nightTime', label: 'Night (hrs)', type: 'number', half: true },
  { key: 'ifrTime', label: 'IFR (hrs)', type: 'number', half: true },
  { key: 'crossCountry', label: 'XC (hrs)', type: 'number', half: true },
  { key: 'landings', label: 'Landings', type: 'number' },
  { key: 'remarks', label: 'Remarks', type: 'text' },
];

export function EntryFormDialog({ open, onOpenChange, entry, onSave }: EntryFormDialogProps) {
  const [form, setForm] = useState<Omit<LogbookEntry, 'id'>>(entry ? { ...entry } : { ...emptyEntry });

  const handleOpen = (o: boolean) => {
    if (o) {
      setForm(entry ? { ...entry } : { ...emptyEntry });
    }
    onOpenChange(o);
  };

  const handleChange = (key: string, value: string) => {
    const numericKeys: string[] = ['totalTime', 'picTime', 'sicTime', 'dualTime', 'nightTime', 'ifrTime', 'crossCountry', 'landings'];
    setForm(prev => ({
      ...prev,
      [key]: numericKeys.includes(key) ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto glass-panel">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary">
            {entry ? '✎ EDIT ENTRY' : '+ NEW ENTRY'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.key} className={f.half ? 'col-span-1' : 'col-span-2'}>
              <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{f.label}</Label>
              <Input
                type={f.type}
                step={f.type === 'number' ? '0.1' : undefined}
                value={form[f.key] as string | number}
                onChange={e => handleChange(f.key, e.target.value)}
                className="font-mono bg-muted/50 border-border focus:border-primary"
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
