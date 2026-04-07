import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Printer, RotateCcw } from 'lucide-react';
import { Waypoint, calcDistanceNm, formatTime } from '@/types/flightPlan';
import { toast } from '@/hooks/use-toast';

export interface CA48FormData {
  // Header
  priority: string;
  addressees: string;
  filing_time: string;
  originator: string;
  // Item 7
  aircraft_id: string;
  // Item 8
  flight_rules: string;
  type_of_flight: string;
  // Item 9
  number: string;
  aircraft_type: string;
  wake_turb: string;
  // Item 10
  equipment: string;
  // Item 13
  departure_aero: string;
  departure_time: string;
  // Item 15
  speed: string;
  level: string;
  route: string;
  // Item 16
  dest_aero: string;
  total_eet: string;
  altn_aero: string;
  altn_aero_2: string;
  // Item 18
  other_info: string;
  // Item 19
  endurance: string;
  pob: string;
  // Supplementary
  emergency_radio_uhf: boolean;
  emergency_radio_vhf: boolean;
  emergency_radio_elt: boolean;
  survival_polar: boolean;
  survival_desert: boolean;
  survival_maritime: boolean;
  survival_jungle: boolean;
  jackets: boolean;
  jackets_light: boolean;
  jackets_fluores: boolean;
  jackets_uhf: boolean;
  jackets_vhf: boolean;
  dinghies_number: string;
  dinghies_capacity: string;
  dinghies_cover: boolean;
  dinghies_colour: string;
  aircraft_colour: string;
  remarks: string;
  pic: string;
  // Filed by
  filed_by: string;
  filed_by_phone: string;
  signature_name: string;
  signature_date: string;
}

const emptyForm: CA48FormData = {
  priority: 'FF', addressees: '', filing_time: '', originator: '',
  aircraft_id: '', flight_rules: 'V', type_of_flight: 'G',
  number: '', aircraft_type: '', wake_turb: 'L',
  equipment: 'S/C', departure_aero: '', departure_time: '',
  speed: '', level: '', route: '',
  dest_aero: '', total_eet: '', altn_aero: '', altn_aero_2: '',
  other_info: '', endurance: '', pob: '',
  emergency_radio_uhf: true, emergency_radio_vhf: true, emergency_radio_elt: true,
  survival_polar: false, survival_desert: false, survival_maritime: false, survival_jungle: false,
  jackets: true, jackets_light: true, jackets_fluores: true, jackets_uhf: false, jackets_vhf: false,
  dinghies_number: '', dinghies_capacity: '', dinghies_cover: false, dinghies_colour: '',
  aircraft_colour: '', remarks: '', pic: '',
  filed_by: '', filed_by_phone: '', signature_name: '', signature_date: new Date().toISOString().split('T')[0],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waypoints: Waypoint[];
  groundSpeed: number;
  fuelBurnRate: number;
  fuelOnBoard: number;
  aircraftType: string;
  aircraftReg: string;
  pilotInCommand: string;
}

export function CA48FlightPlanDialog({
  open, onOpenChange, waypoints, groundSpeed, fuelBurnRate, fuelOnBoard,
  aircraftType, aircraftReg, pilotInCommand,
}: Props) {
  const [form, setForm] = useState<CA48FormData>({ ...emptyForm });

  // Auto-fill from current flight plan data when dialog opens
  useEffect(() => {
    if (!open) return;
    const dep = waypoints[0];
    const dest = waypoints[waypoints.length - 1];
    const routeStr = waypoints.slice(1, -1).map(w => w.icao || w.name.split(' ')[0]).join(' ');

    // Calculate total EET
    let totalMin = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const dist = calcDistanceNm(waypoints[i - 1].lat, waypoints[i - 1].lng, waypoints[i].lat, waypoints[i].lng);
      totalMin += (dist / groundSpeed) * 60;
    }
    const eetHrs = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const eetMin = Math.round(totalMin % 60).toString().padStart(2, '0');

    // Endurance from fuel
    const enduranceMin = fuelOnBoard > 0 ? (fuelOnBoard / fuelBurnRate) * 60 : 0;
    const endHrs = Math.floor(enduranceMin / 60).toString().padStart(2, '0');
    const endMin = Math.round(enduranceMin % 60).toString().padStart(2, '0');

    // Speed format: N + knots padded to 4
    const speedStr = `N${groundSpeed.toString().padStart(4, '0')}`;

    setForm(prev => ({
      ...prev,
      aircraft_id: aircraftReg || prev.aircraft_id,
      aircraft_type: aircraftType || prev.aircraft_type,
      pic: pilotInCommand || prev.pic,
      departure_aero: dep?.icao || '',
      dest_aero: dest?.icao || '',
      route: routeStr || 'DCT',
      total_eet: waypoints.length >= 2 ? `${eetHrs}${eetMin}` : '',
      speed: speedStr,
      endurance: fuelOnBoard > 0 ? `${endHrs}${endMin}` : '',
      other_info: `PBN/B2 DOF/${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`,
    }));
  }, [open, waypoints, groundSpeed, fuelBurnRate, fuelOnBoard, aircraftType, aircraftReg, pilotInCommand]);

  const update = (key: keyof CA48FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    // Build HTML that renders the CA48 form and triggers print
    const html = buildCA48HTML(form);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
    toast({ title: 'CA48 Flight Plan', description: 'Print dialog opened. Save as PDF or print.' });
  };

  const handleReset = () => {
    setForm({ ...emptyForm });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-mono text-primary tracking-wider flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ICAO FLIGHT PLAN (CA48)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-2">
          <div className="space-y-4 pb-4">
            {/* Items 7 & 8 */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 7-8 — AIRCRAFT & FLIGHT RULES</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">7 — AIRCRAFT ID</Label>
                  <Input value={form.aircraft_id} onChange={e => update('aircraft_id', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="ZS-ABC" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">8 — FLIGHT RULES</Label>
                  <Select value={form.flight_rules} onValueChange={v => update('flight_rules', v)}>
                    <SelectTrigger className="h-8 font-mono text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="V">V — VFR</SelectItem>
                      <SelectItem value="I">I — IFR</SelectItem>
                      <SelectItem value="Y">Y — IFR then VFR</SelectItem>
                      <SelectItem value="Z">Z — VFR then IFR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">TYPE OF FLIGHT</Label>
                  <Select value={form.type_of_flight} onValueChange={v => update('type_of_flight', v)}>
                    <SelectTrigger className="h-8 font-mono text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="G">G — General Aviation</SelectItem>
                      <SelectItem value="S">S — Scheduled</SelectItem>
                      <SelectItem value="N">N — Non-Scheduled</SelectItem>
                      <SelectItem value="M">M — Military</SelectItem>
                      <SelectItem value="X">X — Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 9 & 10 */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 9-10 — AIRCRAFT TYPE & EQUIPMENT</h3>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">NUMBER</Label>
                  <Input value={form.number} onChange={e => update('number', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="1" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">TYPE OF AIRCRAFT</Label>
                  <Input value={form.aircraft_type} onChange={e => update('aircraft_type', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="AS50" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">WAKE TURB CAT</Label>
                  <Select value={form.wake_turb} onValueChange={v => update('wake_turb', v)}>
                    <SelectTrigger className="h-8 font-mono text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">L — Light</SelectItem>
                      <SelectItem value="M">M — Medium</SelectItem>
                      <SelectItem value="H">H — Heavy</SelectItem>
                      <SelectItem value="J">J — Super</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">10 — EQUIPMENT</Label>
                  <Input value={form.equipment} onChange={e => update('equipment', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="S/C" />
                </div>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 13 */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 13 — DEPARTURE</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">DEPARTURE AERODROME</Label>
                  <Input value={form.departure_aero} onChange={e => update('departure_aero', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="FAGC" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">TIME (UTC)</Label>
                  <Input value={form.departure_time} onChange={e => update('departure_time', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="1000" maxLength={4} />
                </div>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 15 */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 15 — CRUISING SPEED, LEVEL & ROUTE</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">CRUISING SPEED</Label>
                  <Input value={form.speed} onChange={e => update('speed', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="N0110" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">LEVEL</Label>
                  <Input value={form.level} onChange={e => update('level', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="A065" />
                </div>
                <div className="col-span-1" />
              </div>
              <div>
                <Label className="font-mono text-[10px] text-muted-foreground">ROUTE</Label>
                <Textarea value={form.route} onChange={e => update('route', e.target.value.toUpperCase())}
                  className="font-mono text-xs uppercase min-h-[50px]" placeholder="DCT" />
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 16 */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 16 — DESTINATION & ALTERNATES</h3>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">DESTINATION</Label>
                  <Input value={form.dest_aero} onChange={e => update('dest_aero', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="FALA" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">TOTAL EET</Label>
                  <Input value={form.total_eet} onChange={e => update('total_eet', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="0030" maxLength={4} />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">ALTN AERODROME</Label>
                  <Input value={form.altn_aero} onChange={e => update('altn_aero', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="FAOR" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">2ND ALTN</Label>
                  <Input value={form.altn_aero_2} onChange={e => update('altn_aero_2', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" />
                </div>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 18 */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 18 — OTHER INFORMATION</h3>
              <Textarea value={form.other_info} onChange={e => update('other_info', e.target.value.toUpperCase())}
                className="font-mono text-xs uppercase min-h-[50px]" placeholder="PBN/B2 DOF/260407" />
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 19 — Supplementary */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 19 — SUPPLEMENTARY</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">ENDURANCE (HHMM)</Label>
                  <Input value={form.endurance} onChange={e => update('endurance', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="0200" maxLength={4} />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">PERSONS ON BOARD</Label>
                  <Input value={form.pob} onChange={e => update('pob', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="002" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">AIRCRAFT COLOUR</Label>
                  <Input value={form.aircraft_colour} onChange={e => update('aircraft_colour', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="WHITE/BLUE" />
                </div>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* PIC & Remarks */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">PILOT IN COMMAND & REMARKS</h3>
              <div>
                <Label className="font-mono text-[10px] text-muted-foreground">PILOT IN COMMAND</Label>
                <Input value={form.pic} onChange={e => update('pic', e.target.value.toUpperCase())}
                  className="h-8 font-mono text-xs uppercase" />
              </div>
              <div>
                <Label className="font-mono text-[10px] text-muted-foreground">REMARKS</Label>
                <Textarea value={form.remarks} onChange={e => update('remarks', e.target.value.toUpperCase())}
                  className="font-mono text-xs uppercase min-h-[40px]" />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between px-6 py-4 border-t border-muted/30">
          <Button variant="ghost" size="sm" onClick={handleReset} className="font-mono text-xs gap-1">
            <RotateCcw className="h-3 w-3" />RESET
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="font-mono text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleExport} className="font-mono text-xs gap-1">
              <Printer className="h-3 w-3" />EXPORT PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildCA48HTML(f: CA48FormData): string {
  const cell = (label: string, value: string, width = 'auto') =>
    `<td style="width:${width};padding:2px 6px;border:1px solid #000;font-size:9pt;vertical-align:top">
      <div style="font-size:7pt;color:#555">${label}</div>
      <div style="font-weight:bold;font-size:11pt;letter-spacing:1px;min-height:16px">${value}</div>
    </td>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ICAO Flight Plan CA48</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 9pt; color: #000; }
  table { border-collapse: collapse; width: 100%; }
  td { border: 1px solid #000; padding: 2px 6px; vertical-align: top; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; padding: 6px; border: 2px solid #000; }
  .section-label { font-size: 7pt; color: #555; }
  .field-value { font-weight: bold; font-size: 11pt; letter-spacing: 1px; min-height: 16px; }
  .field-value-sm { font-weight: bold; font-size: 9pt; letter-spacing: 1px; min-height: 16px; }
  .arrows { font-size: 8pt; color: #888; }
  @media print { body { -webkit-print-color-adjust: exact; } }
</style></head><body>
<table>
  <tr><td colspan="8" class="title">FLIGHT PLAN</td></tr>
  <tr>
    <td colspan="2" style="border-bottom:none"><span class="section-label">PRIORITY</span><br><span class="arrows">&lt;&lt;≡</span> FF →</td>
    <td colspan="6"><span class="section-label">ADDRESSEE(S)</span><br><br></td>
  </tr>
  <tr>
    <td colspan="2"><span class="section-label">FILING TIME</span><br><div class="field-value-sm"></div></td>
    <td colspan="6"><span class="section-label">ORIGINATOR</span><br><div class="field-value-sm"></div></td>
  </tr>
  <tr><td colspan="8" style="font-size:7pt;text-align:center;padding:3px">SPECIFIC IDENTIFICATION OF ADDRESSEE(S) AND/OR ORIGINATOR</td></tr>

  <!-- Items 7, 8 -->
  <tr>
    <td colspan="1"><span class="section-label">3 MESSAGE TYPE</span><br><span class="arrows">&lt;&lt;≡</span> <span class="field-value">(FPL</span></td>
    <td colspan="3"><span class="section-label">7 AIRCRAFT IDENTIFICATION</span><br><div class="field-value">${f.aircraft_id}</div></td>
    <td colspan="2"><span class="section-label">8 FLIGHT RULES</span><br><div class="field-value">${f.flight_rules}</div></td>
    <td colspan="2"><span class="section-label">TYPE OF FLIGHT</span><br><div class="field-value">${f.type_of_flight}</div> <span class="arrows">&lt;&lt;≡</span></td>
  </tr>

  <!-- Item 9, 10 -->
  <tr>
    <td><span class="section-label">9 NUMBER</span><br><div class="field-value">${f.number}</div></td>
    <td colspan="2"><span class="section-label">TYPE OF AIRCRAFT</span><br><div class="field-value">${f.aircraft_type}</div></td>
    <td colspan="2"><span class="section-label">WAKE TURBULENCE CAT</span><br><div class="field-value">${f.wake_turb}</div></td>
    <td colspan="3"><span class="section-label">10 EQUIPMENT</span><br><div class="field-value">${f.equipment}</div> <span class="arrows">&lt;&lt;≡</span></td>
  </tr>

  <!-- Item 13 -->
  <tr>
    <td colspan="3"><span class="section-label">13 DEPARTURE AERODROME</span><br><div class="field-value">${f.departure_aero}</div></td>
    <td colspan="5"><span class="section-label">TIME</span><br><div class="field-value">${f.departure_time}</div> <span class="arrows">&lt;&lt;≡</span></td>
  </tr>

  <!-- Item 15 -->
  <tr>
    <td colspan="2"><span class="section-label">15 CRUISING SPEED</span><br><div class="field-value">${f.speed}</div></td>
    <td colspan="2"><span class="section-label">LEVEL</span><br><div class="field-value">${f.level}</div></td>
    <td colspan="4"><span class="section-label">ROUTE</span><br><div class="field-value-sm">${f.route}</div></td>
  </tr>

  <!-- Blank route continuation -->
  <tr><td colspan="8" style="min-height:30px;padding:8px"><br></td></tr>

  <!-- Item 16 -->
  <tr>
    <td colspan="2"><span class="section-label">16 DESTINATION AERODROME</span><br><div class="field-value">${f.dest_aero}</div></td>
    <td colspan="2"><span class="section-label">TOTAL EET HR. MIN</span><br><div class="field-value">${f.total_eet}</div></td>
    <td colspan="2"><span class="section-label">ALTN AERODROME</span><br><div class="field-value">${f.altn_aero}</div></td>
    <td colspan="2"><span class="section-label">2ND ALTN AERODROME</span><br><div class="field-value">${f.altn_aero_2}</div> <span class="arrows">&lt;&lt;≡</span></td>
  </tr>

  <!-- Item 18 -->
  <tr>
    <td colspan="8"><span class="section-label">18 OTHER INFORMATION</span><br><div class="field-value-sm" style="min-height:40px">${f.other_info}</div></td>
  </tr>

  <!-- Blank space -->
  <tr><td colspan="8" style="min-height:20px;padding:8px;text-align:right"><span class="arrows">) &lt;&lt;≡</span></td></tr>

  <!-- Supplementary header -->
  <tr><td colspan="8" style="text-align:center;font-size:7pt;padding:4px;border-top:2px solid #000">SUPPLEMENTARY INFORMATION (NOT TO BE TRANSMITTED IN FPL MESSAGES)</td></tr>

  <!-- Item 19 -->
  <tr>
    <td colspan="3"><span class="section-label">19 ENDURANCE HR MIN</span><br>
      <span class="field-value">-E/ ${f.endurance}</span>
    </td>
    <td colspan="2"><span class="section-label">PERSONS ON BOARD</span><br>
      <span class="field-value">→P/ ${f.pob}</span>
    </td>
    <td colspan="3"><span class="section-label">EMERGENCY RADIO</span><br>
      <span class="field-value-sm">→R/ ${f.emergency_radio_uhf ? '☑U' : '☐U'} ${f.emergency_radio_vhf ? '☑V' : '☐V'} ${f.emergency_radio_elt ? '☑E' : '☐E'}</span>
    </td>
  </tr>

  <!-- Survival & Jackets -->
  <tr>
    <td colspan="4"><span class="section-label">SURVIVAL EQUIPMENT</span><br>
      <span class="field-value-sm">→S/ ${f.survival_polar ? '☑P' : '☐P'} ${f.survival_desert ? '☑D' : '☐D'} ${f.survival_maritime ? '☑M' : '☐M'} ${f.survival_jungle ? '☑J' : '☐J'}</span>
    </td>
    <td colspan="4"><span class="section-label">JACKETS / LIGHT / FLUORES / UHF / VHF</span><br>
      <span class="field-value-sm">→J/ ${f.jackets ? '☑J' : '☐J'} ${f.jackets_light ? '☑L' : '☐L'} ${f.jackets_fluores ? '☑F' : '☐F'} ${f.jackets_uhf ? '☑U' : '☐U'} ${f.jackets_vhf ? '☑V' : '☐V'}</span>
    </td>
  </tr>

  <!-- Dinghies -->
  <tr>
    <td colspan="8"><span class="section-label">DINGHIES</span><br>
      <span class="field-value-sm">→D/ ${f.dinghies_number} / CAP: ${f.dinghies_capacity} COVER: ${f.dinghies_cover ? 'C' : ''} COLOUR: ${f.dinghies_colour}</span>
    </td>
  </tr>

  <!-- Aircraft colour -->
  <tr>
    <td colspan="8"><span class="section-label">AIRCRAFT COLOUR AND MARKINGS</span><br>
      <span class="field-value-sm">A/ ${f.aircraft_colour}</span>
    </td>
  </tr>

  <!-- Remarks -->
  <tr>
    <td colspan="8"><span class="section-label">REMARKS</span><br>
      <span class="field-value-sm">→N/ ${f.remarks}</span> <span class="arrows">&lt;&lt;≡</span>
    </td>
  </tr>

  <!-- PIC -->
  <tr>
    <td colspan="8"><span class="section-label">PILOT IN COMMAND</span><br>
      <span class="field-value">C/ ${f.pic}</span> <span class="arrows">) &lt;&lt;≡</span>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td colspan="3" style="font-size:7pt;text-align:center">FILED BY</td>
    <td colspan="5" style="font-size:7pt;text-align:center">SPACE RESERVED FOR ADDITIONAL REQUIREMENTS<br><span style="font-size:6pt">Please provide a telephone number so our operators can contact you if needed</span></td>
  </tr>

  <tr>
    <td colspan="4" style="font-size:6pt;border-top:none">CA48/RAF2919</td>
    <td colspan="4" style="font-size:6pt;text-align:center;border-top:none">VER 1.5.3</td>
  </tr>
</table>
</body></html>`;
}
