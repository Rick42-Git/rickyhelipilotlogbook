import { useState, useEffect, useMemo } from 'react';
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
  existingEntries?: LogbookEntry[];
}

const fields: { key: keyof Omit<LogbookEntry, 'id'>; label: string; type: string; half?: boolean; section?: string }[] = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'aircraftType', label: 'Class or Type', type: 'text', half: true },
  { key: 'aircraftReg', label: 'Registration', type: 'text', half: true },
  { key: 'pilotInCommand', label: 'Pilot in Command', type: 'text' },
  { key: 'flightDetails', label: 'Flight Details', type: 'text' },

  { key: 'seDayDual', label: 'Dual (1)', type: 'number', half: true, section: 'Single Engine — Day' },
  { key: 'seDayPilot', label: 'Pilot (2)', type: 'number', half: true },

  { key: 'seNightDual', label: 'Dual (3)', type: 'number', half: true, section: 'Single Engine — Night' },
  { key: 'seNightPilot', label: 'Pilot (4)', type: 'number', half: true },

  { key: 'instrumentTime', label: 'Time (13)', type: 'number', half: true, section: 'Instrument Flying' },

  { key: 'instructorDay', label: 'Day (14)', type: 'number', half: true, section: 'Flying as Instructor' },
  { key: 'instructorNight', label: 'Night (15)', type: 'number', half: true },
];

const numericKeys = [
  'seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot',
  'instrumentTime', 'instructorDay', 'instructorNight',
];

const autoCompleteKeys = ['aircraftType', 'aircraftReg', 'pilotInCommand', 'flightDetails'];

export function EntryFormDialog({ open, onOpenChange, entry, onSave, existingEntries = [] }: EntryFormDialogProps) {
  const [form, setForm] = useState<Omit<LogbookEntry, 'id'>>(entry ? { ...entry } : { ...emptyEntry });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Build unique previous values for autocomplete fields
  const suggestions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const key of autoCompleteKeys) {
      const values = existingEntries
        .map(e => e[key as keyof LogbookEntry] as string)
        .filter(v => v && v.trim() !== '');
      map[key] = [...new Set(values)].sort();
    }
    return map;
  }, [existingEntries]);

  useEffect(() => {
    if (open) setForm(entry ? { ...entry } : { ...emptyEntry });
  }, [entry, open]);

  const handleOpen = (o: boolean) => {
    if (o) setForm(entry ? { ...entry } : { ...emptyEntry });
    setActiveDropdown(null);
    onOpenChange(o);
  };

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: numericKeys.includes(key) ? (value === '' ? 0 : parseFloat(value) || 0) : value,
    }));
  };

  // Display empty string for zero numeric fields so users don't fight a stuck "0"
  const displayValue = (key: string, val: string | number) => {
    if (numericKeys.includes(key)) {
      return val === 0 || val === '0' ? '' : val;
    }
    return val;
  };

  const handleSave = () => { onSave(form); onOpenChange(false); };

  const getFilteredSuggestions = (key: string) => {
    const currentVal = (form[key as keyof Omit<LogbookEntry, 'id'>] as string || '').toLowerCase().trim();
    if (!currentVal) return suggestions[key] || [];
    return (suggestions[key] || []).filter(s => 
      s.toLowerCase().includes(currentVal)
    );
  };

  // Track if user is interacting with dropdown to prevent blur from closing it
  const dropdownInteracting = React.useRef(false);
...
                {activeDropdown === f.key && getFilteredSuggestions(f.key).length > 0 && (
                  <div
                    className="absolute z-50 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
                    onMouseDown={() => { dropdownInteracting.current = true; }}
                    onMouseUp={() => { dropdownInteracting.current = false; }}
                  >
                    {getFilteredSuggestions(f.key).map(s => (
                      <button
                        key={s}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm font-mono text-popover-foreground hover:bg-primary/20 hover:text-primary hover:scale-[1.02] origin-left transition-all duration-150"
                        onMouseDown={e => {
                          e.preventDefault();
                          handleChange(f.key, s);
                          setActiveDropdown(null);
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
