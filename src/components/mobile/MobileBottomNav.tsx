import { BookOpen, BarChart3, Camera, Wrench, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileTab = 'logbook' | 'summary' | 'upload' | 'tools' | 'more';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const tabs: { id: MobileTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'logbook', label: 'Log', icon: BookOpen },
  { id: 'summary', label: 'Totals', icon: BarChart3 },
  { id: 'upload', label: 'Scan', icon: Camera },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'more', label: 'More', icon: Menu },
];

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-md border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-stretch h-12">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0 flex-1 transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <div className="absolute top-0 inset-x-2 h-[2px] bg-primary rounded-b-full" />
              )}
              <Icon className="h-4 w-4" />
              <span className="font-mono text-[8px] tracking-wider uppercase leading-none mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
