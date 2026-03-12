import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, FolderOpen, Clock } from 'lucide-react';
import { SavedFlightPlan } from '@/hooks/useFlightPlans';
import { Waypoint, calcDistanceNm } from '@/types/flightPlan';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SavedPlansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: SavedFlightPlan[];
  loading: boolean;
  onLoad: (plan: SavedFlightPlan) => void;
  onDelete: (id: string) => void;
}

function getTotalDistance(waypoints: Waypoint[]): number {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += calcDistanceNm(waypoints[i - 1].lat, waypoints[i - 1].lng, waypoints[i].lat, waypoints[i].lng);
  }
  return total;
}

export function SavedPlansDialog({ open, onOpenChange, plans, loading, onLoad, onDelete }: SavedPlansDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh]">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary tracking-wider flex items-center gap-2">
            <FolderOpen className="h-4 w-4" /> SAVED FLIGHT PLANS
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-muted-foreground">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-muted-foreground">
            No saved flight plans yet. Create a route and save it.
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-2 pr-2">
              {plans.map(plan => {
                const dist = getTotalDistance(plan.waypoints);
                const wptCount = plan.waypoints.length;
                const updated = new Date(plan.updated_at).toLocaleDateString('en-ZA', {
                  day: '2-digit', month: 'short', year: 'numeric',
                });

                return (
                  <div
                    key={plan.id}
                    className="glass-panel p-3 rounded-md hover:border-primary/40 transition-colors cursor-pointer group"
                    onClick={() => { onLoad(plan); onOpenChange(false); }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-sm font-semibold text-foreground truncate">
                          {plan.name || 'Untitled Plan'}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                          {plan.aircraft_type && <span>{plan.aircraft_type} {plan.aircraft_reg}</span>}
                          <span>{wptCount} waypoints</span>
                          <span>{dist.toFixed(0)} NM</span>
                        </div>
                        <div className="font-mono text-[9px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {updated}
                        </div>
                        {wptCount > 0 && (
                          <div className="font-mono text-[9px] text-primary/70 mt-1 truncate">
                            {plan.waypoints.map(w => w.icao || w.name.split(' ')[0]).join(' → ')}
                          </div>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => e.stopPropagation()}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={e => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-mono">Delete "{plan.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="font-mono">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(plan.id)}
                              className="font-mono bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
