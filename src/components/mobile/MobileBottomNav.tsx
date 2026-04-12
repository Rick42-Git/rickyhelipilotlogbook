import { BookOpen, BarChart3, Camera, Wrench, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileTab = 'logbook' | 'summary' | 'upload' | 'tools' | 'more';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  entryCount?: number;
}

const tabs: { id: MobileTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'logbook', label: 'Logbook', icon: BookOpen },
  { id: 'summary', label: 'Totals', icon: BarChart3 },
  { id: 'upload', label: 'Upload', icon: Camera },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'more', label: 'More', icon: Menu },
];

export function MobileBottomNav({ activeTab, onTabChange, entryCount }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <div className="absolute top-0 inset-x-3 h-0.5 bg-primary rounded-b-full" />
              )}
              <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_6px_hsl(38_95%_55%/0.5)]')} />
              <span className="font-mono text-[9px] tracking-wider uppercase">{tab.label}</span>
              {tab.id === 'logbook' && entryCount !== undefined && entryCount > 0 && (
                <span className="absolute top-1.5 right-1/4 bg-primary text-primary-foreground font-mono text-[8px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {entryCount > 99 ? '99+' : entryCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
