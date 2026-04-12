import { useNavigate } from 'react-router-dom';
import { Clock, Scale, Plane, Radio, Download, ChevronRight } from 'lucide-react';
import { LogbookEntry } from '@/types/logbook';
import { exportToNumbers, exportLast3Pages } from '@/lib/exportLogbook';
import { exportSummaryPDF } from '@/lib/exportSummary';

interface MobileToolsPanelProps {
  isAdmin: boolean;
  entries: LogbookEntry[];
  pilotName: string;
  onOpenDutyCalc: () => void;
  onOpenSummary: () => void;
}

export function MobileToolsPanel({ isAdmin, entries, pilotName, onOpenDutyCalc, onOpenSummary }: MobileToolsPanelProps) {
  const navigate = useNavigate();

  const tools = [
    { label: 'Flight & Duty Calculator', icon: Clock, description: 'CAR OPS 121 duty limits', onClick: onOpenDutyCalc },
    { label: '12-Month Summary', icon: Clock, description: 'Rolling hour totals', onClick: onOpenSummary, disabled: entries.length === 0 },
    { label: 'Mass & Balance', icon: Scale, description: 'Weight & CG calculator', onClick: () => navigate('/mass-balance') },
    ...(isAdmin ? [{ label: 'Flight Planning', icon: Plane, description: 'Route planning & nav log', onClick: () => navigate('/flight-planning') }] : []),
    { label: 'Frequency Chart', icon: Radio, description: 'Airport frequencies lookup', onClick: () => navigate('/frequency-chart') },
  ];

  const exports = [
    { label: `Export All (${entries.length} entries)`, onClick: () => exportToNumbers(entries) },
    { label: 'Last 3 Pages (24/page)', onClick: () => exportLast3Pages(entries) },
    { label: 'Summary of Totals (PDF)', onClick: () => exportSummaryPDF(entries, pilotName) },
  ];

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h3 className="font-mono text-[10px] text-primary uppercase tracking-widest mb-3 px-1">Tools</h3>
        <div className="space-y-2">
          {tools.map(tool => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.label}
                onClick={tool.onClick}
                disabled={tool.disabled}
                className="w-full flex items-center gap-3 bg-card border border-border rounded-lg p-4 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-mono text-sm font-semibold text-foreground">{tool.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{tool.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {entries.length > 0 && (
        <div>
          <h3 className="font-mono text-[10px] text-primary uppercase tracking-widest mb-3 px-1">
            <Download className="h-3 w-3 inline mr-1.5" />
            Export
          </h3>
          <div className="space-y-2">
            {exports.map(exp => (
              <button
                key={exp.label}
                onClick={exp.onClick}
                className="w-full flex items-center gap-3 bg-card border border-border rounded-lg p-4 active:scale-[0.98] transition-transform"
              >
                <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs text-foreground text-left">{exp.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
