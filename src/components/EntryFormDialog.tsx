import { useState } from 'react';
import { LogbookEntry, emptyEntry } from '@/types/logbook';
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

const fields: { key: keyof Omit<LogbookEntry, 'id'>; label: string; type: string; half?: boolean; section?: string }[] = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'aircraftType', label: 'Aircraft Type', type: 'text', half: true },
  { key: 'aircraftReg', label: 'Registration', type: 'text', half: true },
  { key: 'pilotInCommand', label: 'Pilot in Command', type: 'text' },
  { key: 'flightDetails', label: 'Flight Details', type: 'text' },

  { key: 'seDayDual', label: 'Dual (1)', type: 'number', half: true, section: 'Single Engine — Day' },
  { key: 'seDayPilot', label: 'Pilot (2)', type: 'number', half: true },

  { key: 'seNightDual', label: 'Dual (3)', type: 'number', half: true, section: 'Single Engine — Night' },
  { key: 'seNightPilot', label: 'Pilot (4)', type: 'number', half: true },

  { key: 'meDayDual', label: 'Dual (5)', type: 'number', half: true, section: 'Multi Engine — Day' },
  { key: 'meDayPilot', label: 'Pilot (6)', type: 'number', half: true },
  { key: 'meDayCoPilot', label: 'Co-Pilot (7)', type: 'number', half: true },

  { key: 'meNightDual', label: 'Dual (8)', type: 'number', half: true, section: 'Multi Engine — Night' },
  { key: 'meNightPilot', label: 'Pilot (9)', type: 'number', half: true },
  { key: 'meNightCoPilot', label: 'Co-Pilot (10)', type: 'number', half: true },

  { key: 'instrumentNavAids', label: 'Nav Aids (11)', type: 'number', half: true, section: 'Instrument Flying' },
  { key: 'instrumentPlace', label: 'Place (12)', type: 'number', half: true },
  { key: 'instrumentTime', label: 'Time (13)', type: 'number', half: true },

  { key: 'instructorDay', label: 'Day (14)', type: 'number', half: true, section: 'Flying as Instructor' },
  { key: 'instructorNight', label: 'Night (15)', type: 'number', half: true },
];

const numericKeys = [
  'seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot',
  'meDayDual', 'meDayPilot', 'meDayCoPilot',
  'meNightDual', 'meNightPilot', 'meNightCoPilot',
  'instrumentNavAids', 'instrumentPlace', 'instrumentTime',
  'instructorDay', 'instructorNight',
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
            <div key={f.key} className={`${f.half ? 'col-span-1' : 'col-span-2'}`}>
              {f.section && (
                <div className="col-span-2 mt-3 mb-1">
                  <p className="font-mono text-[10px] text-accent uppercase tracking-widest border-b border-border pb-1">
                    {f.section}
                  </p>
                </div>
              )}
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
