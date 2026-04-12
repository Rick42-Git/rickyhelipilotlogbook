import { useNavigate } from 'react-router-dom';
import { Clock, Scale, Plane, Radio, Download } from 'lucide-react';
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
    { label: 'F&D Calculator', icon: Clock, onClick: onOpenDutyCalc },
    { label: '12M Summary', icon: Clock, onClick: onOpenSummary, disabled: entries.length === 0 },
    { label: 'Mass & Balance', icon: Scale, onClick: () => navigate('/mass-balance') },
    { label: 'Flight Planning', icon: Plane, onClick: () => navigate('/flight-planning') },
    { label: 'Frequencies', icon: Radio, onClick: () => navigate('/frequency-chart') },
  ];

  const exports = [
    { label: `All (${entries.length})`, onClick: () => exportToNumbers(entries) },
    { label: 'Last 3 Pages', onClick: () => exportLast3Pages(entries) },
    { label: 'Summary PDF', onClick: () => exportSummaryPDF(entries, pilotName) },
  ];

  return (
    <div className="flex flex-col gap-2 overflow-y-auto pb-14">
      <div className="grid grid-cols-2 gap-1.5">
        {tools.map(tool => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.label}
              onClick={tool.onClick}
              disabled={tool.disabled}
              className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2.5 active:scale-[0.97] transition-transform disabled:opacity-40"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="font-mono text-[10px] font-semibold text-foreground text-left">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {entries.length > 0 && (
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <h3 className="font-mono text-[8px] text-primary uppercase tracking-widest mb-2">
            <Download className="h-3 w-3 inline mr-1" />Export
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {exports.map(exp => (
              <button
                key={exp.label}
                onClick={exp.onClick}
                className="bg-muted/30 border border-border/50 rounded px-2 py-1.5 active:scale-[0.97] transition-transform"
              >
                <span className="font-mono text-[9px] text-foreground">{exp.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
