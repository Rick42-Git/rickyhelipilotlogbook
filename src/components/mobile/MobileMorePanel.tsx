import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, MonitorSmartphone, Sun, Moon } from 'lucide-react';
import { SpreadsheetImport } from '@/components/SpreadsheetImport';
import { LogbookEntry } from '@/types/logbook';

interface MobileMorePanelProps {
  isAdmin: boolean;
  theme: string;
  toggleTheme: () => void;
  canInstall: boolean;
  install: () => void;
  signOut: () => void;
  onImport: (entries: Omit<LogbookEntry, 'id'>[]) => void;
  templates: any[];
  pilotName: string;
  pilotEmail: string;
}

export function MobileMorePanel({
  isAdmin, theme, toggleTheme, canInstall, install, signOut, onImport, templates, pilotName, pilotEmail
}: MobileMorePanelProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto pb-14">
      {/* Profile row */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="font-mono text-sm font-bold text-primary">{pilotName.charAt(0)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-bold text-foreground truncate">{pilotName}</p>
          <p className="font-mono text-[9px] text-muted-foreground truncate">{pilotEmail}</p>
        </div>
      </div>

      {/* Action rows */}
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2.5 active:scale-[0.98] transition-transform"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
        <span className="font-mono text-xs text-foreground">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      {canInstall && (
        <button
          onClick={install}
          className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2.5 active:scale-[0.98] transition-transform"
        >
          <MonitorSmartphone className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs text-foreground">Install App</span>
        </button>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <SpreadsheetImport onEntriesImported={onImport} templates={templates} />
      </div>

      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2.5 active:scale-[0.98] transition-transform"
        >
          <Shield className="h-4 w-4 text-accent" />
          <span className="font-mono text-xs text-accent">Admin Panel</span>
        </button>
      )}

      <button
        onClick={signOut}
        className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 active:scale-[0.98] transition-transform mt-1"
      >
        <LogOut className="h-4 w-4 text-destructive" />
        <span className="font-mono text-xs text-destructive">Sign Out</span>
      </button>
    </div>
  );
}
