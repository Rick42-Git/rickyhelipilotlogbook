import { useState } from 'react';
import { useLogbook } from '@/hooks/useLogbook';
import { LogbookEntry } from '@/types/logbook';
import { LogbookTable } from '@/components/LogbookTable';
import { EntryFormDialog } from '@/components/EntryFormDialog';
import { SummaryPanel } from '@/components/SummaryPanel';
import { PhotoUpload } from '@/components/PhotoUpload';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Index = () => {
  const { entries, addEntry, updateEntry, deleteEntry, addMultipleEntries, getTotals } = useLogbook();
  const [dialogOpen, setDialogOpen] = useState(false);
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
          <Button onClick={handleNew} className="font-mono gap-2">
            <Plus className="h-4 w-4" />
            NEW ENTRY
          </Button>
        </div>

        {/* Summary */}
        <div className="mb-6">
          <SummaryPanel totals={totals} entryCount={entries.length} />
        </div>

        {/* Photo Upload */}
        <div className="mb-6">
          <PhotoUpload onEntriesExtracted={(extracted) => {
            addMultipleEntries(extracted);
          }} />
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
      </div>
    </div>
  );
};

export default Index;
