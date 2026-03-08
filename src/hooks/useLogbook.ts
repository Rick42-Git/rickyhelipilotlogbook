import { useState, useCallback, useEffect } from 'react';
import { LogbookEntry, NumericField } from '@/types/logbook';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

  // Fetch entries on mount / user change
  useEffect(() => {
    if (!user) { setEntries([]); setLoading(false); return; }

    const fetchEntries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Failed to load entries:', error);
        toast.error('Failed to load entries');
      } else {
        setEntries((data || []).map(fromDbEntry));
      }
      setLoading(false);
    };

    fetchEntries();
  }, [user]);

  const addEntry = useCallback(async (entry: Omit<LogbookEntry, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('logbook_entries')
      .insert(toDbEntry(entry, user.id))
      .select()
      .single();

    if (error) { toast.error('Failed to add entry'); return; }
    setEntries(prev => [...prev, fromDbEntry(data)]);
  }, [user]);

  const updateEntry = useCallback(async (id: string, entry: Omit<LogbookEntry, 'id'>) => {
    if (!user) return;
    const { error } = await supabase
      .from('logbook_entries')
      .update(toDbEntry(entry, user.id))
      .eq('id', id);

    if (error) { toast.error('Failed to update entry'); return; }
    setEntries(prev => prev.map(e => e.id === id ? { ...entry, id } : e));
  }, [user]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('logbook_entries')
      .delete()
      .eq('id', id);

    if (error) { toast.error('Failed to delete entry'); return; }
    setEntries(prev => prev.filter(e => e.id !== id));
  }, [user]);

  const addMultipleEntries = useCallback(async (newEntries: Omit<LogbookEntry, 'id'>[]) => {
    if (!user) return;
    const rows = newEntries.map(e => toDbEntry(e, user.id));
    const { data, error } = await supabase
      .from('logbook_entries')
      .insert(rows)
      .select();

    if (error) { toast.error('Failed to import entries'); return; }
    const imported = (data || []).map(fromDbEntry);
    setEntries(prev => [...prev, ...imported]);
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
    // Delete in batches of 100 to avoid query limits
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
