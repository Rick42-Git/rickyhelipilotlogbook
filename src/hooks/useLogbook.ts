import { useState, useCallback } from 'react';
import { LogbookEntry, emptyEntry } from '@/types/logbook';

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

export function useLogbook() {
  const [entries, setEntries] = useState<LogbookEntry[]>(loadEntries);

  const addEntry = useCallback((entry: Omit<LogbookEntry, 'id'>) => {
    const newEntry: LogbookEntry = { ...entry, id: crypto.randomUUID() };
    setEntries(prev => {
      const updated = [...prev, newEntry];
      saveEntries(updated);
      return updated;
    });
  }, []);

  const updateEntry = useCallback((id: string, entry: Omit<LogbookEntry, 'id'>) => {
    setEntries(prev => {
      const updated = prev.map(e => e.id === id ? { ...entry, id } : e);
      saveEntries(updated);
      return updated;
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveEntries(updated);
      return updated;
    });
  }, []);

  const addMultipleEntries = useCallback((newEntries: Omit<LogbookEntry, 'id'>[]) => {
    const withIds = newEntries.map(e => ({ ...e, id: crypto.randomUUID() }));
    setEntries(prev => {
      const updated = [...prev, ...withIds];
      saveEntries(updated);
      return updated;
    });
  }, []);

  const getTotals = useCallback(() => {
    return entries.reduce(
      (acc, e) => ({
        totalTime: acc.totalTime + (e.totalTime || 0),
        picTime: acc.picTime + (e.picTime || 0),
        sicTime: acc.sicTime + (e.sicTime || 0),
        dualTime: acc.dualTime + (e.dualTime || 0),
        nightTime: acc.nightTime + (e.nightTime || 0),
        ifrTime: acc.ifrTime + (e.ifrTime || 0),
        crossCountry: acc.crossCountry + (e.crossCountry || 0),
        landings: acc.landings + (e.landings || 0),
      }),
      { totalTime: 0, picTime: 0, sicTime: 0, dualTime: 0, nightTime: 0, ifrTime: 0, crossCountry: 0, landings: 0 }
    );
  }, [entries]);

  return { entries, addEntry, updateEntry, deleteEntry, addMultipleEntries, getTotals };
}
