import { useState } from 'react';
import { useLogbook } from '@/hooks/useLogbook';
import { LogbookEntry } from '@/types/logbook';
import { LogbookTable } from '@/components/LogbookTable';
import { EntryFormDialog } from '@/components/EntryFormDialog';
import { SummaryPanel } from '@/components/SummaryPanel';
import { PhotoUpload } from '@/components/PhotoUpload';
import { Button } from '@/components/ui/button';
import { Plus, Download, BarChart3 } from 'lucide-react';
import { exportToNumbers } from '@/lib/exportLogbook';
import { Last12MonthSummary } from '@/components/Last12MonthSummary';
import { SpreadsheetImport } from '@/components/SpreadsheetImport';

const Index = () => {
  const { entries, addEntry, updateEntry, deleteEntry, addMultipleEntries, getTotals } = useLogbook();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogbookEntry | null>(null);

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
              DIGITAL FLIGHT RECORD SYSTEM
            </p>
          </div>
          <div className="flex gap-2">
            <SpreadsheetImport onEntriesImported={addMultipleEntries} />
            <Button variant="outline" onClick={() => setSummaryOpen(true)} disabled={entries.length === 0} className="font-mono gap-2">
              <BarChart3 className="h-4 w-4" />
              12M SUMMARY
            </Button>
            <Button variant="outline" onClick={() => exportToNumbers(entries)} disabled={entries.length === 0} className="font-mono gap-2">
              <Download className="h-4 w-4" />
              EXPORT
            </Button>
            <Button onClick={handleNew} className="font-mono gap-2">
              <Plus className="h-4 w-4" />
              NEW ENTRY
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
