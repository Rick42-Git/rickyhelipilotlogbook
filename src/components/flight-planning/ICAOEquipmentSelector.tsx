import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

const COMNAV_OPTIONS = [
  { code: 'N', label: 'Nil (No capability)' },
  { code: 'S', label: 'Standard (VHF/ADF/VOR/ILS)' },
  { code: 'A', label: 'GBAS Landing System' },
  { code: 'B', label: 'LPV (APV with SBAS)' },
  { code: 'C', label: 'LORAN C' },
  { code: 'D', label: 'DME' },
  { code: 'E1', label: 'FMC WPR ACARS' },
  { code: 'F', label: 'ADF' },
  { code: 'G', label: 'GNSS (GPS)' },
  { code: 'H', label: 'HF RTF' },
  { code: 'I', label: 'Inertial Navigation' },
  { code: 'J1', label: 'CPDLC ATN VDL Mode 2' },
  { code: 'J2', label: 'CPDLC FANS 1/A HFDL' },
  { code: 'J3', label: 'CPDLC FANS 1/A VDL Mode A' },
  { code: 'J4', label: 'CPDLC FANS 1/A VDL Mode 2' },
  { code: 'J5', label: 'CPDLC FANS 1/A SATCOM (INMARSAT)' },
  { code: 'J6', label: 'CPDLC FANS 1/A SATCOM (MTSAT)' },
  { code: 'J7', label: 'CPDLC FANS 1/A SATCOM (Iridium)' },
  { code: 'K', label: 'MLS' },
  { code: 'L', label: 'ILS' },
  { code: 'O', label: 'VOR' },
  { code: 'R', label: 'PBN Approved (requires PBN/ in Item 18)' },
  { code: 'U', label: 'UHF RTF' },
  { code: 'V', label: 'VHF RTF' },
  { code: 'W', label: 'RVSM Approved' },
  { code: 'X', label: 'MNPS Approved' },
  { code: 'Y', label: 'VHF 8.33 kHz spacing' },
  { code: 'Z', label: 'Other (specify in Item 18)' },
];

const SURVEILLANCE_OPTIONS = [
  { code: 'N', label: 'Nil' },
  { code: 'A', label: 'Mode A (no Mode C)' },
  { code: 'C', label: 'Mode A and C' },
  { code: 'S', label: 'Mode S (ID + pressure alt)' },
  { code: 'P', label: 'Mode S (pressure alt, no ID)' },
  { code: 'I', label: 'Mode S (ID, no pressure alt)' },
  { code: 'L', label: 'Mode S (ID + alt + ADS-B)' },
  { code: 'B1', label: 'ADS-B out (1090 ES)' },
  { code: 'B2', label: 'ADS-B out (1090 ES) + in' },
  { code: 'U1', label: 'ADS-B out (UAT)' },
  { code: 'U2', label: 'ADS-B out + in (UAT)' },
];

interface Props {
  comnavCodes: string[];
  surveillanceCodes: string[];
  onComnavChange: (codes: string[]) => void;
  onSurveillanceChange: (codes: string[]) => void;
}

export function ICAOEquipmentSelector({ comnavCodes, surveillanceCodes, onComnavChange, onSurveillanceChange }: Props) {
  const [comnavOpen, setComnavOpen] = useState(false);
  const [survOpen, setSurvOpen] = useState(false);

  const toggleCode = (current: string[], code: string, onChange: (c: string[]) => void) => {
    if (code === 'N') {
      onChange(current.includes('N') ? [] : ['N']);
      return;
    }
    const without = current.filter(c => c !== 'N');
    if (without.includes(code)) {
      onChange(without.filter(c => c !== code));
    } else {
      onChange([...without, code]);
    }
  };

  const comnavStr = comnavCodes.length > 0 ? comnavCodes.join('') : 'S';
  const survStr = surveillanceCodes.length > 0 ? surveillanceCodes.join('') : 'C';
  const combinedStr = `${comnavStr}/${survStr}`;

  return (
    <div className="space-y-2">
      <Label className="font-mono text-[10px] text-muted-foreground">10 — EQUIPMENT & SURVEILLANCE</Label>
      <div className="bg-muted/30 rounded px-2 py-1.5 font-mono text-sm font-bold tracking-wider text-primary">
        {combinedStr}
      </div>

      <Collapsible open={comnavOpen} onOpenChange={setComnavOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between font-mono text-[10px] h-7 px-2">
            10a — COM/NAV ({comnavCodes.length} selected)
            {comnavOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 max-h-[200px] overflow-y-auto p-1 border rounded border-muted/40">
            {COMNAV_OPTIONS.map(opt => (
              <label key={opt.code} className="flex items-center gap-1.5 font-mono text-[10px] py-0.5 px-1 hover:bg-muted/30 rounded cursor-pointer">
                <Checkbox
                  checked={comnavCodes.includes(opt.code)}
                  onCheckedChange={() => toggleCode(comnavCodes, opt.code, onComnavChange)}
                  className="h-3 w-3"
                />
                <span className="font-bold w-5 shrink-0">{opt.code}</span>
                <span className="text-muted-foreground truncate">{opt.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={survOpen} onOpenChange={setSurvOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between font-mono text-[10px] h-7 px-2">
            10b — SURVEILLANCE ({surveillanceCodes.length} selected)
            {survOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 max-h-[160px] overflow-y-auto p-1 border rounded border-muted/40">
            {SURVEILLANCE_OPTIONS.map(opt => (
              <label key={opt.code} className="flex items-center gap-1.5 font-mono text-[10px] py-0.5 px-1 hover:bg-muted/30 rounded cursor-pointer">
                <Checkbox
                  checked={surveillanceCodes.includes(opt.code)}
                  onCheckedChange={() => toggleCode(surveillanceCodes, opt.code, onSurveillanceChange)}
                  className="h-3 w-3"
                />
                <span className="font-bold w-5 shrink-0">{opt.code}</span>
                <span className="text-muted-foreground truncate">{opt.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function buildEquipmentString(comnav: string[], surveillance: string[]): string {
  const c = comnav.length > 0 ? comnav.join('') : 'S';
  const s = surveillance.length > 0 ? surveillance.join('') : 'C';
  return `${c}/${s}`;
}
