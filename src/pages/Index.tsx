import { useState } from 'react';
import { useLogbook } from '@/hooks/useLogbook';
import { LogbookEntry } from '@/types/logbook';
import { LogbookTable } from '@/components/LogbookTable';
import { EntryFormDialog } from '@/components/EntryFormDialog';
import { SummaryPanel } from '@/components/SummaryPanel';
import { PhotoUpload } from '@/components/PhotoUpload';
import { Button } from '@/components/ui/button';
import { Plus, Download, BarChart3, LogOut, MonitorSmartphone, ChevronDown, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToNumbers } from '@/lib/exportLogbook';
import { useAuth } from '@/hooks/useAuth';
import { Last12MonthSummary } from '@/components/Last12MonthSummary';
import { SpreadsheetImport } from '@/components/SpreadsheetImport';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { FlightDutyCalculator } from '@/components/FlightDutyCalculator';

const Index = () => {
  const { user, signOut } = useAuth();
  const { entries, loading, addEntry, updateEntry, deleteEntry, addMultipleEntries, getTotals } = useLogbook();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [dutyCalcOpen, setDutyCalcOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogbookEntry | null>(null);
  const { canInstall, install } = useInstallPrompt();

  const handleEdit = (entry: LogbookEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleSave = (entry: Omit<LogbookEntry, 'id'>) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, entry);
    } else {
      addEntry(entry);
    }
  };

  const totals = getTotals();

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-mono text-2xl font-bold text-primary tracking-wider">
              ◈ HELI PILOT LOGBOOK
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1 tracking-widest">
              PILOT: {user?.email?.split('@')[0]?.toUpperCase() || 'UNKNOWN'}
            </p>
          </div>
          <div className="flex gap-2">
            {canInstall && (
              <Button variant="outline" onClick={install} className="font-mono gap-2 border-primary text-primary">
                <MonitorSmartphone className="h-4 w-4" />
                INSTALL
              </Button>
            )}
            <SpreadsheetImport onEntriesImported={addMultipleEntries} />
            <Button variant="outline" onClick={() => setDutyCalcOpen(true)} className="font-mono gap-2">
              <Clock className="h-4 w-4" />
              F&D CALC
            </Button>
            <Button variant="outline" onClick={() => setSummaryOpen(true)} disabled={entries.length === 0} className="font-mono gap-2">
              <BarChart3 className="h-4 w-4" />
              12M SUMMARY
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={entries.length === 0} className="font-mono gap-2">
                  <Download className="h-4 w-4" />
                  EXPORT
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-mono">
                <DropdownMenuItem onClick={() => exportToNumbers(entries)}>
                  EXPORT ALL ({entries.length} entries)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToNumbers(entries.slice(-72))}>
                  LAST 3 PAGES (72 entries)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleNew} className="font-mono gap-2">
              <Plus className="h-4 w-4" />
              NEW ENTRY
            </Button>
            <Button variant="ghost" onClick={signOut} className="font-mono gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border/40" />
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em]">totals</span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* Summary */}
        <div className="mb-6">
          <SummaryPanel totals={totals} entryCount={entries.length} />
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border/40" />
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em]">upload</span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* Photo Upload */}
        <div className="mb-6">
          <PhotoUpload onEntriesExtracted={(extracted) => {
            addMultipleEntries(extracted);
          }} />
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border/40" />
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em]">entries</span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* Table */}
        <LogbookTable entries={entries} onEdit={handleEdit} onDelete={deleteEntry} />

        {/* Entry Dialog */}
        <EntryFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entry={editingEntry}
          onSave={handleSave}
        />

        <Last12MonthSummary entries={entries} open={summaryOpen} onOpenChange={setSummaryOpen} />
      </div>
    </div>
  );
};

export default Index;
