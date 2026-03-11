import { useState, useCallback, useEffect } from 'react';
import { LogbookEntry, NumericField } from '@/types/logbook';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  getCachedEntries,
  setCachedEntries,
  pushOfflineAction,
  getOfflineQueue,
  clearOfflineQueue,
} from '@/lib/offlineCache';

const numericFields: NumericField[] = [
  'seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot',
  'instrumentTime', 'instructorDay', 'instructorNight',
];

// Map between camelCase (frontend) and snake_case (DB)
function toDbEntry(e: Omit<LogbookEntry, 'id'>, userId: string) {
  return {
    user_id: userId,
    date: e.date,
    aircraft_type: e.aircraftType,
    aircraft_reg: e.aircraftReg,
    pilot_in_command: e.pilotInCommand,
    flight_details: e.flightDetails,
    se_day_dual: e.seDayDual,
    se_day_pilot: e.seDayPilot,
    se_night_dual: e.seNightDual,
    se_night_pilot: e.seNightPilot,
    instrument_time: e.instrumentTime,
    instructor_day: e.instructorDay,
    instructor_night: e.instructorNight,
  };
}

function fromDbEntry(row: any): LogbookEntry {
  return {
    id: row.id,
    date: row.date ?? '',
    aircraftType: row.aircraft_type ?? '',
    aircraftReg: row.aircraft_reg ?? '',
    pilotInCommand: row.pilot_in_command ?? '',
    flightDetails: row.flight_details ?? '',
    seDayDual: Number(row.se_day_dual) || 0,
    seDayPilot: Number(row.se_day_pilot) || 0,
    seNightDual: Number(row.se_night_dual) || 0,
    seNightPilot: Number(row.se_night_pilot) || 0,
    instrumentTime: Number(row.instrument_time) || 0,
    instructorDay: Number(row.instructor_day) || 0,
    instructorNight: Number(row.instructor_night) || 0,
  };
}

export function useLogbook() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastImportIds, setLastImportIds] = useState<string[] | null>(null);

  // Sync offline queue when coming back online
  const syncOfflineQueue = useCallback(async (userId: string) => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    let syncedCount = 0;
    const tempIdMap = new Map<string, string>(); // tempId -> real DB id

    for (const action of queue) {
      try {
        if (action.type === 'add') {
          const { data, error } = await supabase
            .from('logbook_entries')
            .insert({ ...action.entry, user_id: userId })
            .select()
            .single();
          if (!error && data) {
            tempIdMap.set(action.tempId, data.id);
            syncedCount++;
          }
        } else if (action.type === 'update') {
          // If updating a temp entry, resolve the real id
          const realId = tempIdMap.get(action.id) || action.id;
          const { error } = await supabase
            .from('logbook_entries')
            .update({ ...action.entry, user_id: userId })
            .eq('id', realId);
          if (!error) syncedCount++;
        } else if (action.type === 'delete') {
          const realId = tempIdMap.get(action.id) || action.id;
          const { error } = await supabase
            .from('logbook_entries')
            .delete()
            .eq('id', realId);
          if (!error) syncedCount++;
        }
      } catch {
        // Network still down — stop trying
        break;
      }
    }

    if (syncedCount > 0) {
      clearOfflineQueue();
      toast.success(`Synced ${syncedCount} offline change${syncedCount > 1 ? 's' : ''}`);
      // Re-fetch to get clean server state
      const { data } = await supabase
        .from('logbook_entries')
        .select('*')
        .order('date', { ascending: true });
      if (data) {
        const mapped = data.map(fromDbEntry);
        setEntries(mapped);
        setCachedEntries(mapped);
      }
    }
  }, []);

  // Listen for online event to trigger sync
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        syncOfflineQueue(user.id);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, syncOfflineQueue]);

  // Fetch entries on mount / user change
  useEffect(() => {
    if (!user) { setEntries([]); setLoading(false); return; }

    const fetchEntries = async () => {
      setLoading(true);

      if (!navigator.onLine) {
        const cached = getCachedEntries<LogbookEntry>();
        if (cached) {
          setEntries(cached);
          toast.info('Showing cached data — you are offline');
        }
        setLoading(false);
        return;
      }

      // Sync any pending offline changes first
      await syncOfflineQueue(user.id);

      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Failed to load entries:', error);
        const cached = getCachedEntries<LogbookEntry>();
        if (cached) {
          setEntries(cached);
          toast.warning('Using cached data — failed to reach server');
        } else {
          toast.error('Failed to load entries');
        }
      } else {
        const mapped = (data || []).map(fromDbEntry);
        setEntries(mapped);
        setCachedEntries(mapped);
      }
      setLoading(false);
    };

    fetchEntries();
  }, [user, syncOfflineQueue]);

  const addEntry = useCallback(async (entry: Omit<LogbookEntry, 'id'>) => {
    if (!user) return;

    if (!navigator.onLine) {
      const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const dbShape = toDbEntry(entry, user.id);
      pushOfflineAction({ type: 'add', tempId, entry: dbShape });
      const newEntry: LogbookEntry = { ...entry, id: tempId };
      setEntries(prev => {
        const updated = [...prev, newEntry];
        setCachedEntries(updated);
        return updated;
      });
      toast.info('Entry saved offline — will sync when online');
      return;
    }

    const { data, error } = await supabase
      .from('logbook_entries')
      .insert(toDbEntry(entry, user.id))
      .select()
      .single();

    if (error) { toast.error('Failed to add entry'); return; }
    setEntries(prev => {
      const updated = [...prev, fromDbEntry(data)];
      setCachedEntries(updated);
      return updated;
    });
  }, [user]);

  const updateEntry = useCallback(async (id: string, entry: Omit<LogbookEntry, 'id'>) => {
    if (!user) return;

    if (!navigator.onLine) {
      const dbShape = toDbEntry(entry, user.id);
      pushOfflineAction({ type: 'update', id, entry: dbShape });
      setEntries(prev => {
        const updated = prev.map(e => e.id === id ? { ...entry, id } : e);
        setCachedEntries(updated);
        return updated;
      });
      toast.info('Edit saved offline — will sync when online');
      return;
    }

    const { error } = await supabase
      .from('logbook_entries')
      .update(toDbEntry(entry, user.id))
      .eq('id', id);

    if (error) { toast.error('Failed to update entry'); return; }
    setEntries(prev => {
      const updated = prev.map(e => e.id === id ? { ...entry, id } : e);
      setCachedEntries(updated);
      return updated;
    });
  }, [user]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!user) return;

    if (!navigator.onLine) {
      pushOfflineAction({ type: 'delete', id });
      setEntries(prev => {
        const updated = prev.filter(e => e.id !== id);
        setCachedEntries(updated);
        return updated;
      });
      toast.info('Delete saved offline — will sync when online');
      return;
    }

    const { error } = await supabase
      .from('logbook_entries')
      .delete()
      .eq('id', id);

    if (error) { toast.error('Failed to delete entry'); return; }
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      setCachedEntries(updated);
      return updated;
    });
  }, [user]);

  const addMultipleEntries = useCallback(async (newEntries: Omit<LogbookEntry, 'id'>[]) => {
    if (!user) return;

    if (!navigator.onLine) {
      const offlineEntries: LogbookEntry[] = newEntries.map(entry => {
        const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const dbShape = toDbEntry(entry, user.id);
        pushOfflineAction({ type: 'add', tempId, entry: dbShape });
        return { ...entry, id: tempId };
      });
      setEntries(prev => {
        const updated = [...prev, ...offlineEntries];
        setCachedEntries(updated);
        return updated;
      });
      toast.info(`${newEntries.length} entries saved offline — will sync when online`);
      setLastImportIds(offlineEntries.map(e => e.id));
      return;
    }

    const rows = newEntries.map(e => toDbEntry(e, user.id));
    const { data, error } = await supabase
      .from('logbook_entries')
      .insert(rows)
      .select();

    if (error) { toast.error('Failed to import entries'); return; }
    const imported = (data || []).map(fromDbEntry);
    setEntries(prev => {
      const updated = [...prev, ...imported];
      setCachedEntries(updated);
      return updated;
    });
    setLastImportIds(imported.map(e => e.id));
  }, [user]);

  const undoLastImport = useCallback(async () => {
    if (!user || !lastImportIds || lastImportIds.length === 0) return;
    const { error } = await supabase
      .from('logbook_entries')
      .delete()
      .in('id', lastImportIds);

    if (error) { toast.error('Failed to undo import'); return; }
    const idsToRemove = new Set(lastImportIds);
    setEntries(prev => prev.filter(e => !idsToRemove.has(e.id)));
    toast.success(`Removed ${lastImportIds.length} entries`);
    setLastImportIds(null);
  }, [user, lastImportIds]);

  const deleteUnknownEntries = useCallback(async () => {
    if (!user) return;
    const unknownEntries = entries.filter(e => {
      const textFields = [e.date, e.aircraftType, e.aircraftReg, e.pilotInCommand, e.flightDetails];
      return textFields.some(f => f.toLowerCase().includes('unknown'));
    });
    if (unknownEntries.length === 0) { toast.info('No unknown entries found'); return; }
    const ids = unknownEntries.map(e => e.id);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await supabase.from('logbook_entries').delete().in('id', batch);
      if (error) { toast.error('Failed to delete unknown entries'); return; }
    }
    const idSet = new Set(ids);
    setEntries(prev => prev.filter(e => !idSet.has(e.id)));
    toast.success(`Removed ${ids.length} unknown entries`);
  }, [user, entries]);

  const clearAllEntries = useCallback(async () => {
    if (!user || entries.length === 0) return;
    const ids = entries.map(e => e.id);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await supabase
        .from('logbook_entries')
        .delete()
        .in('id', batch);
      if (error) { toast.error('Failed to clear entries'); return; }
    }
    setEntries([]);
    setLastImportIds(null);
    toast.success(`Cleared ${ids.length} entries`);
  }, [user, entries]);

  const getTotals = useCallback(() => {
    const initial = Object.fromEntries(numericFields.map(f => [f, 0])) as Record<NumericField, number>;
    return entries.reduce((acc, e) => {
      for (const f of numericFields) { acc[f] += (e[f] || 0); }
      return acc;
    }, initial);
  }, [entries]);

  return { entries, loading, addEntry, updateEntry, deleteEntry, addMultipleEntries, undoLastImport, lastImportIds, clearAllEntries, deleteUnknownEntries, getTotals };
}
