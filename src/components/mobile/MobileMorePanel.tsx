import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, MonitorSmartphone, Sun, Moon, Upload, ChevronRight } from 'lucide-react';
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
    <div className="space-y-4 pb-20">
      {/* Profile */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="font-mono text-lg font-bold text-primary">{pilotName.charAt(0)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-bold text-foreground truncate">{pilotName}</p>
            <p className="font-mono text-[10px] text-muted-foreground truncate">{pilotEmail}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 bg-card border border-border rounded-lg p-4 active:scale-[0.98] transition-transform"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
          <span className="font-mono text-sm text-foreground flex-1 text-left">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {canInstall && (
          <button
            onClick={install}
            className="w-full flex items-center gap-3 bg-card border border-border rounded-lg p-4 active:scale-[0.98] transition-transform"
          >
            <MonitorSmartphone className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm text-foreground flex-1 text-left">Install App</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <SpreadsheetImport onEntriesImported={onImport} templates={templates} />
        </div>

        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-3 bg-card border border-border rounded-lg p-4 active:scale-[0.98] transition-transform"
          >
            <Shield className="h-5 w-5 text-accent" />
            <span className="font-mono text-sm text-accent flex-1 text-left">Admin Panel</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4 active:scale-[0.98] transition-transform"
      >
        <LogOut className="h-5 w-5 text-destructive" />
        <span className="font-mono text-sm text-destructive flex-1 text-left">Sign Out</span>
      </button>
    </div>
  );
}
