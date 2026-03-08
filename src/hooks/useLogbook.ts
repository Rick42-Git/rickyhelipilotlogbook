import { useState, useCallback } from 'react';
import { LogbookEntry, emptyEntry, NumericField } from '@/types/logbook';

const STORAGE_KEY = 'heli-logbook-entries';

function loadEntries(): LogbookEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: LogbookEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const numericFields: NumericField[] = [
  'seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot',
  'instrumentNavAids', 'instrumentPlace', 'instrumentTime',
  'instructorDay', 'instructorNight',
];

export function useLogbook() {
  const [entries, setEntries] = useState<LogbookEntry[]>(loadEntries);

  const addEntry = useCallback((entry: Omit<LogbookEntry, 'id'>) => {
    const newEntry: LogbookEntry = { ...entry, id: crypto.randomUUID() };
    setEntries(prev => { const updated = [...prev, newEntry]; saveEntries(updated); return updated; });
  }, []);

  const updateEntry = useCallback((id: string, entry: Omit<LogbookEntry, 'id'>) => {
    setEntries(prev => { const updated = prev.map(e => e.id === id ? { ...entry, id } : e); saveEntries(updated); return updated; });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => { const updated = prev.filter(e => e.id !== id); saveEntries(updated); return updated; });
  }, []);

  const addMultipleEntries = useCallback((newEntries: Omit<LogbookEntry, 'id'>[]) => {
    const withIds = newEntries.map(e => ({ ...e, id: crypto.randomUUID() }));
    setEntries(prev => { const updated = [...prev, ...withIds]; saveEntries(updated); return updated; });
  }, []);

  const getTotals = useCallback(() => {
    const initial = Object.fromEntries(numericFields.map(f => [f, 0])) as Record<NumericField, number>;
    return entries.reduce((acc, e) => {
      for (const f of numericFields) { acc[f] += (e[f] || 0); }
      return acc;
    }, initial);
  }, [entries]);

  return { entries, addEntry, updateEntry, deleteEntry, addMultipleEntries, getTotals };
}
