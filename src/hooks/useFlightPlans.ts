import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getActivatedUser } from '@/lib/activation';
import { Waypoint } from '@/types/flightPlan';
import { toast } from '@/hooks/use-toast';

export interface SavedFlightPlan {
  id: string;
  user_id: string;
  name: string;
  aircraft_type: string;
  aircraft_reg: string;
  pilot_in_command: string;
  ground_speed: number;
  fuel_burn_rate: number;
  fuel_on_board: number;
  reserve_fuel: number;
  waypoints: Waypoint[];
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useFlightPlans() {
  const [plans, setPlans] = useState<SavedFlightPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = getActivatedUser()?.id;

  const fetchPlans = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('flight_plans')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPlans(
        (data || []).map((d: any) => ({
          ...d,
          waypoints: (typeof d.waypoints === 'string' ? JSON.parse(d.waypoints) : d.waypoints) as Waypoint[],
        }))
      );
    } catch (err: any) {
      console.error('Failed to fetch flight plans:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const savePlan = useCallback(async (plan: {
    id?: string;
    name: string;
    aircraft_type: string;
    aircraft_reg: string;
    pilot_in_command: string;
    ground_speed: number;
    fuel_burn_rate: number;
    fuel_on_board: number;
    reserve_fuel: number;
    waypoints: Waypoint[];
    notes: string;
  }): Promise<string | null> => {
    if (!userId) {
      toast({ title: 'Not activated', description: 'Please activate first.', variant: 'destructive' });
      return null;
    }

    try {
      if (plan.id) {
        // Update existing
        const { error } = await supabase
          .from('flight_plans')
          .update({
            name: plan.name,
            aircraft_type: plan.aircraft_type,
            aircraft_reg: plan.aircraft_reg,
            pilot_in_command: plan.pilot_in_command,
            ground_speed: plan.ground_speed,
            fuel_burn_rate: plan.fuel_burn_rate,
            fuel_on_board: plan.fuel_on_board,
            reserve_fuel: plan.reserve_fuel,
            waypoints: plan.waypoints as any,
            notes: plan.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', plan.id)
          .eq('user_id', userId);

        if (error) throw error;
        toast({ title: 'Plan saved', description: `"${plan.name}" updated.` });
        fetchPlans();
        return plan.id;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('flight_plans')
          .insert({
            user_id: userId,
            name: plan.name,
            aircraft_type: plan.aircraft_type,
            aircraft_reg: plan.aircraft_reg,
            pilot_in_command: plan.pilot_in_command,
            ground_speed: plan.ground_speed,
            fuel_burn_rate: plan.fuel_burn_rate,
            fuel_on_board: plan.fuel_on_board,
            reserve_fuel: plan.reserve_fuel,
            waypoints: plan.waypoints as any,
            notes: plan.notes,
          })
          .select('id')
          .single();

        if (error) throw error;
        toast({ title: 'Plan saved', description: `"${plan.name}" created.` });
        fetchPlans();
        return data?.id || null;
      }
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
      return null;
    }
  }, [userId, fetchPlans]);

  const deletePlan = useCallback(async (id: string) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('flight_plans')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      toast({ title: 'Plan deleted' });
      fetchPlans();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  }, [userId, fetchPlans]);

  return { plans, loading, savePlan, deletePlan, refetch: fetchPlans };
}
