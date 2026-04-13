import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogbook } from '@/hooks/useLogbook';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import helicopterIcon from '@/assets/helicopter-icon.png';
import { LogbookEntry } from '@/types/logbook';
import { LogbookTable } from '@/components/LogbookTable';
import { LogbookBookView } from '@/components/LogbookBookView';
import { EntryFormDialog } from '@/components/EntryFormDialog';
import { SummaryPanel } from '@/components/SummaryPanel';
import { PhotoUpload } from '@/components/PhotoUpload';
import { Button } from '@/components/ui/button';
import { Plus, Download, BarChart3, LogOut, MonitorSmartphone, ChevronDown, Clock, Undo2, Trash2, Shield, Scale, Plane, List, BookOpen, Radio, Sun, Moon, Search, FileDown } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToNumbers, exportLast3Pages } from '@/lib/exportLogbook';
import { exportSummaryPDF } from '@/lib/exportSummary';
import { useAuth } from '@/hooks/useAuth';
import { Last12MonthSummary } from '@/components/Last12MonthSummary';
import { SpreadsheetImport } from '@/components/SpreadsheetImport';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { FlightDutyCalculator } from '@/components/FlightDutyCalculator';
import { ColumnTemplateManager } from '@/components/ColumnTemplateManager';
import { useColumnTemplates } from '@/hooks/useColumnTemplates';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';

// Mobile components
import { MobileBottomNav, MobileTab } from '@/components/mobile/MobileBottomNav';
import { MobileEntryCard } from '@/components/mobile/MobileEntryCard';
import { MobileSummaryPanel } from '@/components/mobile/MobileSummaryPanel';
import { MobileToolsPanel } from '@/components/mobile/MobileToolsPanel';
import { MobileMorePanel } from '@/components/mobile/MobileMorePanel';

const Index = () => {
  const { user, activatedUser, signOut } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { entries, loading, addEntry, updateEntry, deleteEntry, addMultipleEntries, undoLastImport, lastImportIds, clearAllEntries, deleteUnknownEntries, getTotals } = useLogbook();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [dutyCalcOpen, setDutyCalcOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogbookEntry | null>(null);
  const { canInstall, install } = useInstallPrompt();
  const { templates } = useColumnTemplates();
  const [viewMode, setViewMode] = useState<'list' | 'book'>('list');
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>('logbook');
  const [mobileSearch, setMobileSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

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

  const totals = useMemo(() => getTotals(), [getTotals]);
  const pilotName = activatedUser?.displayName?.toUpperCase() || user?.email?.split('@')[0]?.toUpperCase() || 'UNKNOWN';
  const grandTotal = useMemo(() => totals.seDayDual + totals.seDayPilot + totals.seNightDual + totals.seNightPilot, [totals]);

  const aviatorTime = useMemo(() => {
    if (entries.length === 0) return null;
    const dates = entries.map(e => e.date).filter(Boolean).sort();
    if (dates.length === 0) return null;
    const first = new Date(dates[0]);
    const now = new Date();
    const diffMs = now.getTime() - first.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365.25);
    const remainingDays = Math.floor(totalDays - years * 365.25);
    return { years, days: remainingDays };
  }, [entries]);

  const filteredMobileEntries = useMemo(() => {
    if (!mobileSearch.trim()) return entries;
    const q = mobileSearch.toLowerCase();
    return entries.filter(e =>
      e.date.toLowerCase().includes(q) ||
      e.aircraftType.toLowerCase().includes(q) ||
      e.aircraftReg.toLowerCase().includes(q) ||
      e.pilotInCommand.toLowerCase().includes(q) ||
      e.flightDetails.toLowerCase().includes(q)
    );
  }, [entries, mobileSearch]);

  const sortedMobileEntries = useMemo(() =>
    [...filteredMobileEntries].sort((a, b) => (a.date > b.date ? -1 : 1)),
    [filteredMobileEntries]
  );

  // ─── MOBILE LAYOUT ───
  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
        {/* Cockpit-style header */}
        <div className="shrink-0 z-40 relative overflow-hidden">
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-card via-card/95 to-background/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_70%)]" />
          {/* Scan line effect */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />
          
          <div className="relative px-3 pt-3 pb-2">
            {/* Top row: HUD data readouts */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="font-mono text-[8px] text-success/70 tracking-widest">ONLINE</span>
              </div>
              <span className="font-mono text-[8px] text-muted-foreground/50 tracking-wider">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                {mobileTab === 'logbook' && (
                  <button onClick={() => setSearchOpen(!searchOpen)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                    <Search className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Main header: Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md" />
                <img src={helicopterIcon} alt="" className="relative h-9 w-auto drop-shadow-[0_0_12px_hsl(38_95%_55%/0.4)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-mono text-sm font-bold text-primary tracking-wider leading-none">
                  ROTORLOG
                </h1>
                <p className="font-mono text-[8px] text-muted-foreground/60 tracking-[0.2em] mt-0.5">
                  DIGITAL PILOT LOGBOOK
                </p>
              </div>
            </div>

            {/* Bottom row: Pilot info + stats */}
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-primary/5 border border-primary/20 rounded px-2 py-0.5">
                  <span className="font-mono text-[8px] text-primary/60">PIC</span>
                  <span className="font-mono text-[10px] font-bold text-primary tracking-wide">{pilotName}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {aviatorTime && (
                  <div className="flex items-center gap-1 bg-primary/5 border border-primary/20 rounded px-2 py-0.5">
                    <span className="font-mono text-[8px] text-primary/60">AVT</span>
                    <span className="font-mono text-[10px] font-bold text-primary leading-none">{aviatorTime.years}y {aviatorTime.days}d</span>
                  </div>
                )}
                <div className="flex items-center gap-1 bg-success/5 border border-success/20 rounded px-2 py-0.5">
                  <span className="font-mono text-[8px] text-success/60">TTL</span>
                  <span className="font-mono text-sm font-bold text-success leading-none">{grandTotal.toFixed(1)}</span>
                  <span className="font-mono text-[7px] text-success/50">HRS</span>
                </div>
                <div className="flex items-center gap-1 bg-accent/5 border border-accent/20 rounded px-2 py-0.5">
                  <span className="font-mono text-[8px] text-accent/60">FLT</span>
                  <span className="font-mono text-[10px] font-bold text-accent leading-none">{entries.length}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom edge glow */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        {/* Search bar — collapsible, only on logbook tab */}
        {mobileTab === 'logbook' && searchOpen && (
          <div className="shrink-0 px-3 py-1.5 bg-card border-b border-border/50">
            <Input
              value={mobileSearch}
              onChange={e => setMobileSearch(e.target.value)}
              placeholder="Search..."
              className="h-7 font-mono text-xs bg-background/50 border-border"
              autoFocus
            />
          </div>
        )}

        {/* Content area — fills remaining space */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {mobileTab === 'logbook' && (
            <>
              {/* Compact action bar */}
              <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm px-3 py-1 flex items-center justify-between border-b border-border/30">
                <span className="font-mono text-[9px] text-muted-foreground">
                  {filteredMobileEntries.length} flights
                </span>
                <Button onClick={handleNew} size="sm" className="h-6 px-2 font-mono text-[9px] gap-1">
                  <Plus className="h-3 w-3" /> NEW
                </Button>
              </div>

              {/* Dense entry list */}
              {sortedMobileEntries.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <p className="font-mono text-xs text-muted-foreground">
                      {entries.length === 0 ? 'No flights yet' : 'No results'}
                    </p>
                    <p className="font-mono text-[9px] text-muted-foreground/60 mt-0.5">
                      {entries.length === 0 ? 'Tap NEW or go to Scan' : 'Try different search'}
                    </p>
                  </div>
                </div>
              ) : (
                sortedMobileEntries.map(entry => (
                  <MobileEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEdit}
                    onDelete={deleteEntry}
                  />
                ))
              )}
            </>
          )}

          {mobileTab === 'summary' && (
            <div className="px-3 pt-2">
              <MobileSummaryPanel totals={totals} entryCount={entries.length} entries={entries} />
            </div>
          )}

          {mobileTab === 'upload' && (
            <div className="px-3 pt-2 pb-14">
              <PhotoUpload onEntriesExtracted={(extracted) => addMultipleEntries(extracted)} />
            </div>
          )}

          {mobileTab === 'tools' && (
            <div className="px-3 pt-2">
              <MobileToolsPanel
                isAdmin={isAdmin}
                entries={entries}
                pilotName={pilotName}
                onOpenDutyCalc={() => setDutyCalcOpen(true)}
                onOpenSummary={() => setSummaryOpen(true)}
              />
            </div>
          )}

          {mobileTab === 'more' && (
            <div className="px-3 pt-2">
              <MobileMorePanel
                isAdmin={isAdmin}
                theme={theme}
                toggleTheme={toggleTheme}
                canInstall={canInstall}
                install={install}
                signOut={signOut}
                onImport={addMultipleEntries}
                templates={templates}
                pilotName={pilotName}
                pilotEmail={user?.email || ''}
              />
            </div>
          )}
        </div>

        {/* Bottom nav — 48px */}
        <MobileBottomNav activeTab={mobileTab} onTabChange={setMobileTab} />

        {/* Shared dialogs */}
        <EntryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editingEntry} onSave={handleSave} existingEntries={entries} />
        <Last12MonthSummary entries={entries} allEntries={entries} open={summaryOpen} onOpenChange={setSummaryOpen} />
        <FlightDutyCalculator open={dutyCalcOpen} onOpenChange={setDutyCalcOpen} entries={entries} />
      </div>
    );
  }

  // ─── DESKTOP LAYOUT (unchanged) ───
  return (
    <div className="min-h-screen bg-background grid-bg scanline overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="glass-panel hud-border p-3 md:p-4 mb-6 md:mb-8">
          <div className="flex flex-col gap-3">
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
                      PILOT: {pilotName}
                    </p>
                    <span className="font-mono text-[9px] text-accent/60 flex-shrink-0">▸ ACTIVE</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="font-mono" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                  {theme === 'dark' ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
                </Button>
                <Button variant="ghost" onClick={signOut} className="font-mono gap-2 text-muted-foreground">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
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
               <Button variant="outline" onClick={() => navigate('/flight-planning')} className="font-mono gap-2">
                 <Plane className="h-4 w-4" />
                 FLT PLAN
               </Button>
              <Button variant="outline" onClick={() => navigate('/frequency-chart')} className="font-mono gap-2">
                <Radio className="h-4 w-4" />
                FREQ
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
                  <DropdownMenuItem onClick={() => exportSummaryPDF(entries, pilotName)}>
                    SUMMARY OF TOTALS (PDF)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate('/admin')} className="font-mono gap-2 border-accent text-accent">
                  <Shield className="h-4 w-4" />
                  ADMIN
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 alt-line" />
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em] compass-divider flex items-center gap-2"><span>totals</span></span>
          <div className="flex-1 alt-line" />
        </div>

        <div className="mb-6">
          <SummaryPanel totals={totals} entryCount={entries.length} entries={entries} />
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 alt-line" />
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em] compass-divider flex items-center gap-2"><span>upload</span></span>
          <div className="flex-1 alt-line" />
        </div>

        <div className="mb-6">
          <PhotoUpload onEntriesExtracted={(extracted) => addMultipleEntries(extracted)} />
        </div>

        <div className="flex items-center gap-3 my-6 sticky top-0 z-30 bg-background pt-4 pb-3 -mx-4 px-4">
          {entries.length > 0 && (
            <Button
              variant="ghost" size="sm"
              onClick={() => setViewMode(v => v === 'list' ? 'book' : 'list')}
              className="font-mono text-[10px] gap-1.5 h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              {viewMode === 'list' ? <BookOpen className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              {viewMode === 'list' ? 'SWITCH TO LOGBOOK VIEW' : 'SWITCH TO LIST VIEW'}
            </Button>
          )}
          {viewMode === 'book' && entries.length > 0 && (
            <Button
              variant="outline" size="sm"
              onClick={() => {
                const bookView = document.querySelector('[data-book-export]');
                if (bookView) (bookView as any).click();
              }}
              className="font-mono text-[10px] gap-1.5 h-7 px-2"
            >
              <FileDown className="h-3.5 w-3.5" />
              EXPORT PAGES TO PDF
            </Button>
          )}
          <div className="flex-1 alt-line" />
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em] compass-divider flex items-center gap-2"><span>entries</span></span>
          <div className="flex-1 alt-line" />
          <Button size="sm" onClick={handleNew} className="font-mono text-[10px] gap-1.5 h-7 px-2">
            <Plus className="h-3.5 w-3.5" />
            NEW ENTRY
          </Button>
        </div>

        {viewMode === 'list' ? (
          <LogbookTable entries={entries} onEdit={handleEdit} onDelete={deleteEntry} onClearAll={clearAllEntries} />
        ) : (
          <LogbookBookView entries={entries} onEdit={handleEdit} onDelete={deleteEntry} />
        )}

        <EntryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editingEntry} onSave={handleSave} existingEntries={entries} />
        <Last12MonthSummary entries={entries} allEntries={entries} open={summaryOpen} onOpenChange={setSummaryOpen} />
        <FlightDutyCalculator open={dutyCalcOpen} onOpenChange={setDutyCalcOpen} entries={entries} />
      </div>
    </div>
  );
};

export default Index;
