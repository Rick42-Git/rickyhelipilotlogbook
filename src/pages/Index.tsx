import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogbook } from '@/hooks/useLogbook';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import helicopterIcon from '@/assets/helicopter-icon.png';
import { LogbookEntry } from '@/types/logbook';
import { LogbookTable } from '@/components/LogbookTable';
import { EntryFormDialog } from '@/components/EntryFormDialog';
import { SummaryPanel } from '@/components/SummaryPanel';
import { PhotoUpload } from '@/components/PhotoUpload';
import { Button } from '@/components/ui/button';
import { Plus, Download, BarChart3, LogOut, MonitorSmartphone, ChevronDown, Clock, Undo2, Trash2, Shield, Scale, Plane } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToNumbers, exportLast3Pages } from '@/lib/exportLogbook';
import { useAuth } from '@/hooks/useAuth';
import { Last12MonthSummary } from '@/components/Last12MonthSummary';
import { SpreadsheetImport } from '@/components/SpreadsheetImport';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { FlightDutyCalculator } from '@/components/FlightDutyCalculator';
import { ColumnTemplateManager } from '@/components/ColumnTemplateManager';
import { useColumnTemplates } from '@/hooks/useColumnTemplates';

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { entries, loading, addEntry, updateEntry, deleteEntry, addMultipleEntries, undoLastImport, lastImportIds, clearAllEntries, deleteUnknownEntries, getTotals } = useLogbook();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [dutyCalcOpen, setDutyCalcOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogbookEntry | null>(null);
  const { canInstall, install } = useInstallPrompt();
  const { templates } = useColumnTemplates();

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
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="glass-panel hud-border p-3 md:p-4 mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4 shrink min-w-0 md:min-w-fit">
              <img src={helicopterIcon} alt="Helicopter" className="h-8 md:h-12 w-auto opacity-80 drop-shadow-[0_0_8px_hsl(38_95%_55%/0.3)] flex-shrink-0" />
              <div className="min-w-0 md:min-w-fit">
                <div className="flex items-center gap-2">
                  <h1 className="font-mono text-base md:text-2xl font-bold text-primary tracking-wider truncate md:overflow-visible md:text-clip md:whitespace-nowrap">
                    HELI PILOT LOGBOOK
                  </h1>
                  <div className="status-dot flex-shrink-0" />
                </div>
                <div className="flex items-center gap-3 mt-0.5 md:mt-1">
                  <p className="font-mono text-[10px] md:text-xs text-muted-foreground tracking-widest truncate">
                    PILOT: {user?.email?.split('@')[0]?.toUpperCase() || 'UNKNOWN'}
                  </p>
                  <span className="font-mono text-[9px] text-accent/60 flex-shrink-0">▸ ACTIVE</span>
                </div>
              </div>
            </div>
            {/* Desktop buttons */}
            <div className="hidden md:flex gap-2">
              {canInstall && (
                <Button variant="outline" onClick={install} className="font-mono gap-2 border-primary text-primary">
                  <MonitorSmartphone className="h-4 w-4" />
                  INSTALL
                </Button>
              )}
              <SpreadsheetImport onEntriesImported={addMultipleEntries} templates={templates} />
              <Button variant="outline" onClick={() => navigate('/mass-balance')} className="font-mono gap-2">
                <Scale className="h-4 w-4" />
                M&B CALC
              </Button>
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
                  <DropdownMenuItem onClick={() => exportLast3Pages(entries)}>
                    LAST 3 PAGES (24 entries/page)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleNew} className="font-mono gap-2">
                <Plus className="h-4 w-4" />
                NEW ENTRY
              </Button>
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate('/admin')} className="font-mono gap-2 border-accent text-accent">
                  <Shield className="h-4 w-4" />
                  ADMIN
                </Button>
              )}
              <Button variant="ghost" onClick={signOut} className="font-mono gap-2 text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            {/* Mobile: sign out only */}
            <div className="flex md:hidden gap-1">
              {isAdmin && (
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8 text-accent">
                  <Shield className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Mobile action bar */}
          <div className="flex md:hidden gap-1.5 mt-3 flex-wrap">
            {canInstall && (
              <Button variant="outline" size="sm" onClick={install} className="font-mono text-[10px] gap-1 h-7 border-primary text-primary">
                <MonitorSmartphone className="h-3 w-3" />
                INSTALL
              </Button>
            )}
            <SpreadsheetImport onEntriesImported={addMultipleEntries} templates={templates} />
            
            <Button variant="outline" size="sm" onClick={() => navigate('/mass-balance')} className="font-mono text-[10px] gap-1 h-7">
              <Scale className="h-3 w-3" />
              M&B
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDutyCalcOpen(true)} className="font-mono text-[10px] gap-1 h-7">
              <Clock className="h-3 w-3" />
              F&D
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSummaryOpen(true)} disabled={entries.length === 0} className="font-mono text-[10px] gap-1 h-7">
              <BarChart3 className="h-3 w-3" />
              12M
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={entries.length === 0} className="font-mono text-[10px] gap-1 h-7">
                  <Download className="h-3 w-3" />
                  EXPORT
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-mono">
                <DropdownMenuItem onClick={() => exportToNumbers(entries)}>
                  EXPORT ALL ({entries.length} entries)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportLast3Pages(entries)}>
                  LAST 3 PAGES (24 entries/page)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={handleNew} className="font-mono text-[10px] gap-1 h-7">
              <Plus className="h-3 w-3" />
              NEW
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 alt-line" />
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em] compass-divider flex items-center gap-2">
            <span>totals</span>
          </span>
          <div className="flex-1 alt-line" />
        </div>

        {/* Summary */}
        <div className="mb-6">
          <SummaryPanel totals={totals} entryCount={entries.length} entries={entries} />
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 alt-line" />
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em] compass-divider flex items-center gap-2">
            <span>upload</span>
          </span>
          <div className="flex-1 alt-line" />
        </div>

        {/* Photo Upload */}
        <div className="mb-6">
          <PhotoUpload onEntriesExtracted={(extracted) => {
            addMultipleEntries(extracted);
          }} />
        </div>

        <div className="flex items-center gap-3 my-6 sticky top-0 z-30 bg-background py-3 -mx-4 px-4">
          <div className="flex-1 alt-line" />
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em] compass-divider flex items-center gap-2">
            <span>entries</span>
          </span>
          <div className="flex-1 alt-line" />
        </div>

        {/* Table */}
        <LogbookTable entries={entries} onEdit={handleEdit} onDelete={deleteEntry} onClearAll={clearAllEntries} />

        {/* Entry Dialog */}
        <EntryFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entry={editingEntry}
          onSave={handleSave}
          existingEntries={entries}
        />

        <Last12MonthSummary entries={entries} open={summaryOpen} onOpenChange={setSummaryOpen} />
        <FlightDutyCalculator open={dutyCalcOpen} onOpenChange={setDutyCalcOpen} entries={entries} />
      </div>
    </div>
  );
};

export default Index;
