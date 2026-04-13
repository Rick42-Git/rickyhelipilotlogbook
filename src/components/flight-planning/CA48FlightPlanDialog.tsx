import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Printer, RotateCcw, Eraser, PenLine, Plus } from 'lucide-react';
import { Waypoint, calcDistanceNm, formatTime } from '@/types/flightPlan';
import { toast } from '@/hooks/use-toast';
import { ICAOEquipmentSelector, buildEquipmentString } from './ICAOEquipmentSelector';

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
  comnav_codes: string[];
  surveillance_codes: string[];
  // Item 13
  departure_aero: string;
  departure_time: string;
  // Item 15
  speed_prefix: string;
  speed_value: string;
  speed: string;
  level_prefix: string;
  level_value: string;
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
  pic_telephone: string;
  // Filed by
  filed_by: string;
  filed_by_phone: string;
  signature_name: string;
  signature_date: string;
  // Digital signature
  signature_image: string;
  signature_title: string;
}

const emptyForm: CA48FormData = {
  priority: '', addressees: '', filing_time: '', originator: '',
  aircraft_id: '', flight_rules: 'V', type_of_flight: 'G',
  number: '', aircraft_type: '', wake_turb: 'L',
  equipment: 'S/C', comnav_codes: ['S'], surveillance_codes: ['C'],
  departure_aero: '', departure_time: '',
  speed_prefix: 'N', speed_value: '', speed: '',
  level_prefix: 'A', level_value: '', level: '',
  route: '',
  dest_aero: '', total_eet: '', altn_aero: '', altn_aero_2: '',
  other_info: '', endurance: '', pob: '',
  emergency_radio_uhf: true, emergency_radio_vhf: true, emergency_radio_elt: true,
  survival_polar: false, survival_desert: false, survival_maritime: false, survival_jungle: false,
  jackets: true, jackets_light: true, jackets_fluores: true, jackets_uhf: false, jackets_vhf: false,
  dinghies_number: '', dinghies_capacity: '', dinghies_cover: false, dinghies_colour: '',
  aircraft_colour: '', remarks: '', pic: '', pic_telephone: '',
  filed_by: '', filed_by_phone: '', signature_name: '', signature_date: new Date().toISOString().split('T')[0],
  signature_image: '', signature_title: '',
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

// Section 18 tag helpers
const SECTION18_TAGS = [
  { tag: 'PBN/', hint: 'e.g. A1B1C1D1' },
  { tag: 'NAV/', hint: 'significant nav equipment' },
  { tag: 'REG/', hint: 'registration if different' },
  { tag: 'EET/', hint: 'e.g. FAOR0030' },
  { tag: 'SEL/', hint: 'SELCAL code e.g. ABCD' },
  { tag: 'DOF/', hint: 'date of flight YYMMDD' },
  { tag: 'RMK/', hint: 'free-text remarks' },
  { tag: 'OPR/', hint: 'operator name' },
  { tag: 'STS/', hint: 'special status e.g. MEDEVAC' },
];

export function CA48FlightPlanDialog({
  open, onOpenChange, waypoints, groundSpeed, fuelBurnRate, fuelOnBoard,
  aircraftType, aircraftReg, pilotInCommand,
}: Props) {
  const [form, setForm] = useState<CA48FormData>({ ...emptyForm });
  const [showSigPad, setShowSigPad] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigDrawn, setHasSigDrawn] = useState(false);

  // Auto-fill from current flight plan data when dialog opens
  useEffect(() => {
    if (!open) return;
    const dep = waypoints[0];
    const dest = waypoints[waypoints.length - 1];
    const routeStr = waypoints.slice(1, -1).map(w => w.icao || w.name.split(' ')[0]).join(' ');

    let totalMin = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const dist = calcDistanceNm(waypoints[i - 1].lat, waypoints[i - 1].lng, waypoints[i].lat, waypoints[i].lng);
      totalMin += (dist / groundSpeed) * 60;
    }
    const eetHrs = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const eetMin = Math.round(totalMin % 60).toString().padStart(2, '0');

    const enduranceMin = fuelOnBoard > 0 ? (fuelOnBoard / fuelBurnRate) * 60 : 0;
    const endHrs = Math.floor(enduranceMin / 60).toString().padStart(2, '0');
    const endMin = Math.round(enduranceMin % 60).toString().padStart(2, '0');

    const speedVal = groundSpeed.toString().padStart(4, '0');

    setForm(prev => ({
      ...prev,
      aircraft_id: aircraftReg || prev.aircraft_id,
      aircraft_type: aircraftType || prev.aircraft_type,
      pic: pilotInCommand || prev.pic,
      departure_aero: dep?.icao || '',
      dest_aero: dest?.icao || '',
      route: routeStr || 'DCT',
      total_eet: waypoints.length >= 2 ? `${eetHrs}${eetMin}` : '',
      speed_value: speedVal,
      speed: `N${speedVal}`,
      endurance: fuelOnBoard > 0 ? `${endHrs}${endMin}` : '',
      other_info: `PBN/B2 DOF/${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`,
    }));
  }, [open, waypoints, groundSpeed, fuelBurnRate, fuelOnBoard, aircraftType, aircraftReg, pilotInCommand]);

  const update = (key: keyof CA48FormData, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Update combined speed/level strings when prefix or value changes
  const updateSpeed = (prefix: string, value: string) => {
    setForm(prev => ({ ...prev, speed_prefix: prefix, speed_value: value, speed: `${prefix}${value}` }));
  };
  const updateLevel = (prefix: string, value: string) => {
    setForm(prev => ({ ...prev, level_prefix: prefix, level_value: value, level: `${prefix}${value}` }));
  };

  // Update equipment string when codes change
  const updateEquipment = (comnav: string[], surveillance: string[]) => {
    setForm(prev => ({
      ...prev,
      comnav_codes: comnav,
      surveillance_codes: surveillance,
      equipment: buildEquipmentString(comnav, surveillance),
    }));
  };

  // Section 18 tag insertion
  const insertTag = (tag: string) => {
    setForm(prev => {
      const current = prev.other_info.trim();
      if (current.includes(tag)) return prev;
      return { ...prev, other_info: current ? `${current} ${tag}` : tag };
    });
  };

  // ========== Signature Pad ==========
  const initSigCanvas = useCallback(() => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 20);
    ctx.lineTo(rect.width - 20, rect.height - 20);
    ctx.stroke();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasSigDrawn(false);
  }, []);

  useEffect(() => {
    if (showSigPad) {
      setTimeout(initSigCanvas, 100);
    }
  }, [showSigPad, initSigCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = sigCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = sigCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = sigCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSigDrawn(true);
  };
  const endDraw = () => setIsDrawing(false);

  const applySig = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    update('signature_image', dataUrl);
    setShowSigPad(false);
    toast({ title: 'Signature applied', description: 'Digital signature added to your flight plan.' });
  };

  const handleExport = () => {
    const html = buildCA48HTML(form);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
    toast({ title: 'File2Fly Flight Plan', description: 'Print dialog opened. Save as PDF or print.' });
  };

  const handleReset = () => {
    setForm({ ...emptyForm });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="font-mono text-primary tracking-wider flex items-center gap-2 text-xs sm:text-sm">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            ICAO FLIGHT PLAN (File2Fly)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto px-3 sm:px-6 pb-2" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="space-y-3 sm:space-y-4 pb-4">
            {/* Priority / Addressees */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">PRIORITY & ADDRESSEES</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">PRIORITY</Label>
                  <Input value={form.priority} onChange={e => update('priority', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="FF" />
                </div>
                <div className="col-span-1 sm:col-span-3">
                  <Label className="font-mono text-[10px] text-muted-foreground">ADDRESSEE(S)</Label>
                  <Input value={form.addressees} onChange={e => update('addressees', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="JNBXTYF" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">FILING TIME</Label>
                  <Input value={form.filing_time} onChange={e => update('filing_time', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="0930" maxLength={4} />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">ORIGINATOR</Label>
                  <Input value={form.originator} onChange={e => update('originator', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" />
                </div>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Items 7 & 8 */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 7-8 — AIRCRAFT ID & FLIGHT RULES</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">7 — AIRCRAFT ID</Label>
                  <Input value={form.aircraft_id} onChange={e => update('aircraft_id', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="ZS-ABC" maxLength={7} />
                  <span className="font-mono text-[8px] text-muted-foreground/50">Max 7 chars</span>
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">8 — FLIGHT RULES</Label>
                  <Select value={form.flight_rules} onValueChange={v => update('flight_rules', v)}>
                    <SelectTrigger className="h-8 font-mono text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I">I — IFR</SelectItem>
                      <SelectItem value="V">V — VFR</SelectItem>
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
                      <SelectItem value="S">S — Scheduled Air Service</SelectItem>
                      <SelectItem value="N">N — Non-scheduled Transport</SelectItem>
                      <SelectItem value="G">G — General Aviation</SelectItem>
                      <SelectItem value="M">M — Military</SelectItem>
                      <SelectItem value="X">X — Other (SAR, Test, etc.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 9 */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 9 — AIRCRAFT TYPE & WAKE</h3>
              <div className="grid grid-cols-3 gap-2">
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
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 10 — Equipment & Surveillance */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 10 — EQUIPMENT & SURVEILLANCE</h3>
              <ICAOEquipmentSelector
                comnavCodes={form.comnav_codes}
                surveillanceCodes={form.surveillance_codes}
                onComnavChange={codes => updateEquipment(codes, form.surveillance_codes)}
                onSurveillanceChange={codes => updateEquipment(form.comnav_codes, codes)}
              />
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 13 */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 13 — DEPARTURE</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">DEPARTURE AERODROME</Label>
                  <Input value={form.departure_aero} onChange={e => update('departure_aero', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="FAGC" maxLength={4} />
                  <span className="font-mono text-[8px] text-muted-foreground/50">4-letter ICAO (ZZZZ if none)</span>
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">TIME (UTC)</Label>
                  <Input value={form.departure_time} onChange={e => update('departure_time', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="1000" maxLength={4} />
                </div>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 15 — Speed, Level & Route */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 15 — CRUISING SPEED, LEVEL & ROUTE</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Speed with prefix */}
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">CRUISING SPEED</Label>
                  <div className="flex gap-1">
                    <Select value={form.speed_prefix} onValueChange={v => updateSpeed(v, form.speed_value)}>
                      <SelectTrigger className="h-8 font-mono text-xs w-16 shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N">N — Knots</SelectItem>
                        <SelectItem value="M">M — Mach</SelectItem>
                        <SelectItem value="K">K — km/h</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={form.speed_value}
                      onChange={e => updateSpeed(form.speed_prefix, e.target.value)}
                      className="h-8 font-mono text-xs" placeholder="0110" />
                  </div>
                  <span className="font-mono text-[8px] text-muted-foreground/50">e.g. N0110, M082, K0200</span>
                </div>
                {/* Level with prefix */}
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">LEVEL</Label>
                  <div className="flex gap-1">
                    <Select value={form.level_prefix} onValueChange={v => updateLevel(v, form.level_value)}>
                      <SelectTrigger className="h-8 font-mono text-xs w-16 shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="F">F — Flight Level</SelectItem>
                        <SelectItem value="A">A — Altitude (x100ft)</SelectItem>
                        <SelectItem value="S">S — Std Metric (x10m)</SelectItem>
                        <SelectItem value="VFR">VFR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={form.level_value}
                      onChange={e => updateLevel(form.level_prefix, e.target.value.toUpperCase())}
                      className="h-8 font-mono text-xs uppercase" placeholder="065" />
                  </div>
                  <span className="font-mono text-[8px] text-muted-foreground/50">e.g. F350, A065, VFR</span>
                </div>
              </div>
              <div>
                <Label className="font-mono text-[10px] text-muted-foreground">ROUTE</Label>
                <Textarea value={form.route} onChange={e => update('route', e.target.value.toUpperCase())}
                  className="font-mono text-xs uppercase min-h-[50px]" placeholder="DCT" />
                <span className="font-mono text-[8px] text-muted-foreground/50">DCT, airways, or waypoints</span>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 16 */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 16 — DESTINATION & ALTERNATES</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">DESTINATION</Label>
                  <Input value={form.dest_aero} onChange={e => update('dest_aero', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="FALA" maxLength={4} />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">TOTAL EET</Label>
                  <Input value={form.total_eet} onChange={e => update('total_eet', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="0030" maxLength={4} />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">ALTN AERODROME</Label>
                  <Input value={form.altn_aero} onChange={e => update('altn_aero', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="FAOR" maxLength={4} />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">2ND ALTN</Label>
                  <Input value={form.altn_aero_2} onChange={e => update('altn_aero_2', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" maxLength={4} />
                </div>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 18 — Other Information with tag helpers */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 18 — OTHER INFORMATION</h3>
              <div className="flex flex-wrap gap-1 mb-1">
                {SECTION18_TAGS.map(t => (
                  <Button key={t.tag} type="button" variant="outline" size="sm"
                    className="h-5 px-1.5 font-mono text-[9px] gap-0.5"
                    onClick={() => insertTag(t.tag)}
                    title={t.hint}
                  >
                    <Plus className="h-2.5 w-2.5" />{t.tag}
                  </Button>
                ))}
              </div>
              <Textarea value={form.other_info} onChange={e => update('other_info', e.target.value.toUpperCase())}
                className="font-mono text-xs uppercase min-h-[60px]" placeholder="PBN/B2 DOF/260407" />
              <span className="font-mono text-[8px] text-muted-foreground/50">Click tags above to insert. Common: PBN/, DOF/, NAV/, REG/, RMK/</span>
            </div>

            <Separator className="bg-muted/30" />

            {/* Item 19 — Supplementary */}
            <div className="space-y-3">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">ITEM 19 — SUPPLEMENTARY INFORMATION</h3>
              <p className="font-mono text-[9px] text-muted-foreground/60">Not transmitted in FPL messages</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">ENDURANCE (E/HHMM)</Label>
                  <Input value={form.endurance} onChange={e => update('endurance', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="0200" maxLength={4} />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">PERSONS ON BOARD (P/)</Label>
                  <Input value={form.pob} onChange={e => update('pob', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="002 or TBN" />
                </div>
              </div>

              {/* Emergency Radio */}
              <div>
                <Label className="font-mono text-[10px] text-muted-foreground">EMERGENCY RADIO</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.emergency_radio_uhf} onCheckedChange={v => update('emergency_radio_uhf', !!v)} /> U — UHF
                  </label>
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.emergency_radio_vhf} onCheckedChange={v => update('emergency_radio_vhf', !!v)} /> V — VHF
                  </label>
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.emergency_radio_elt} onCheckedChange={v => update('emergency_radio_elt', !!v)} /> E — ELT
                  </label>
                </div>
              </div>

              {/* Survival Equipment */}
              <div>
                <Label className="font-mono text-[10px] text-muted-foreground">SURVIVAL EQUIPMENT</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.survival_polar} onCheckedChange={v => update('survival_polar', !!v)} /> P — Polar
                  </label>
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.survival_desert} onCheckedChange={v => update('survival_desert', !!v)} /> D — Desert
                  </label>
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.survival_maritime} onCheckedChange={v => update('survival_maritime', !!v)} /> M — Maritime
                  </label>
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.survival_jungle} onCheckedChange={v => update('survival_jungle', !!v)} /> J — Jungle
                  </label>
                </div>
              </div>

              {/* Jackets */}
              <div>
                <Label className="font-mono text-[10px] text-muted-foreground">JACKETS</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.jackets_light} onCheckedChange={v => update('jackets_light', !!v)} /> L — Light
                  </label>
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.jackets_fluores} onCheckedChange={v => update('jackets_fluores', !!v)} /> F — Fluorescent
                  </label>
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.jackets_uhf} onCheckedChange={v => update('jackets_uhf', !!v)} /> U — UHF
                  </label>
                  <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                    <Checkbox checked={form.jackets_vhf} onCheckedChange={v => update('jackets_vhf', !!v)} /> V — VHF
                  </label>
                </div>
              </div>

              {/* Dinghies */}
              <div>
                <Label className="font-mono text-[10px] text-muted-foreground">DINGHIES</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  <div>
                    <Label className="font-mono text-[9px] text-muted-foreground/70">NUMBER</Label>
                    <Input value={form.dinghies_number} onChange={e => update('dinghies_number', e.target.value)}
                      className="h-7 font-mono text-xs" placeholder="0" />
                  </div>
                  <div>
                    <Label className="font-mono text-[9px] text-muted-foreground/70">CAPACITY</Label>
                    <Input value={form.dinghies_capacity} onChange={e => update('dinghies_capacity', e.target.value)}
                      className="h-7 font-mono text-xs" />
                  </div>
                  <div className="flex items-end pb-0.5">
                    <label className="flex items-center gap-1.5 font-mono text-xs cursor-pointer">
                      <Checkbox checked={form.dinghies_cover} onCheckedChange={v => update('dinghies_cover', !!v)} /> Cover
                    </label>
                  </div>
                  <div>
                    <Label className="font-mono text-[9px] text-muted-foreground/70">COLOUR</Label>
                    <Input value={form.dinghies_colour} onChange={e => update('dinghies_colour', e.target.value.toUpperCase())}
                      className="h-7 font-mono text-xs uppercase" />
                  </div>
                </div>
              </div>

              {/* Aircraft Colour */}
              <div>
                <Label className="font-mono text-[10px] text-muted-foreground">AIRCRAFT COLOUR AND MARKINGS</Label>
                <Input value={form.aircraft_colour} onChange={e => update('aircraft_colour', e.target.value.toUpperCase())}
                  className="h-8 font-mono text-xs uppercase" placeholder="WHITE/BLUE" />
              </div>

              {/* Remarks */}
              <div>
                <Label className="font-mono text-[10px] text-muted-foreground">REMARKS</Label>
                <Textarea value={form.remarks} onChange={e => update('remarks', e.target.value.toUpperCase())}
                  className="font-mono text-xs uppercase min-h-[40px]" />
              </div>

              {/* PIC + Telephone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">PILOT IN COMMAND</Label>
                  <Input value={form.pic} onChange={e => update('pic', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">PIC TELEPHONE</Label>
                  <Input value={form.pic_telephone} onChange={e => update('pic_telephone', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="+27..." />
                </div>
              </div>
            </div>

            <Separator className="bg-muted/30" />

            {/* Filed By / Signature */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] text-primary tracking-widest">FILED BY & AUTHORIZATION</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">FILED BY</Label>
                  <Input value={form.filed_by} onChange={e => update('filed_by', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">TELEPHONE</Label>
                  <Input value={form.filed_by_phone} onChange={e => update('filed_by_phone', e.target.value)}
                    className="h-8 font-mono text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">NAME IN BLOCK LETTERS</Label>
                  <Input value={form.signature_name} onChange={e => update('signature_name', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">TITLE / CAPACITY</Label>
                  <Input value={form.signature_title} onChange={e => update('signature_title', e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase" placeholder="PIC" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-muted-foreground">DATE</Label>
                  <Input value={form.signature_date} onChange={e => update('signature_date', e.target.value)}
                    className="h-8 font-mono text-xs" placeholder="2026-04-13" />
                </div>
              </div>

              {/* Digital Signature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-[10px] text-muted-foreground">DIGITAL SIGNATURE</Label>
                  {form.signature_image ? (
                    <Button variant="ghost" size="sm" className="h-5 text-[9px] font-mono text-destructive"
                      onClick={() => update('signature_image', '')}>
                      Clear
                    </Button>
                  ) : null}
                </div>

                {form.signature_image ? (
                  <div className="border rounded p-2 bg-white flex items-center gap-3">
                    <img src={form.signature_image} alt="Signature" className="h-12 object-contain" />
                    <span className="font-mono text-[9px] text-green-600">✓ Signature applied</span>
                  </div>
                ) : !showSigPad ? (
                  <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5 w-full" onClick={() => setShowSigPad(true)}>
                    <PenLine className="h-3.5 w-3.5" /> Sign Document
                  </Button>
                ) : (
                  <div className="border rounded p-2 space-y-2">
                    <canvas
                      ref={sigCanvasRef}
                      className="w-full border rounded cursor-crosshair touch-none bg-white"
                      style={{ height: 120 }}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] font-mono gap-1" onClick={initSigCanvas}>
                        <Eraser className="h-3 w-3" />Clear
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] font-mono" onClick={() => setShowSigPad(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" className="h-6 text-[10px] font-mono" onClick={applySig} disabled={!hasSigDrawn}>
                        Apply Signature
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-t border-muted/30">
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

  const sigBlock = f.signature_image
    ? `<div style="margin-top:4px"><img src="${f.signature_image}" style="max-height:50px;margin-bottom:2px" /><br>
       <span style="font-size:7pt;color:#555">${f.signature_title ? f.signature_title : ''}</span></div>`
    : '<br><br>';

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
  .header-bar { display: flex; align-items: center; justify-content: space-between; border: 2px solid #000; padding: 6px 12px; margin-bottom: 0; }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .sacaa-logo { width: 60px; height: 60px; }
  .header-text { font-size: 8pt; line-height: 1.4; }
  .header-text strong { font-size: 10pt; display: block; }
  .header-right { text-align: right; font-size: 7pt; line-height: 1.5; }
  @media print { body { -webkit-print-color-adjust: exact; } }
</style></head><body>

<!-- SACAA Header -->
<div class="header-bar">
  <div class="header-left">
    <svg class="sacaa-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="none" stroke="#003366" stroke-width="3"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#003366" stroke-width="1.5"/>
      <path d="M50 12 L50 88 M12 50 L88 50" stroke="#003366" stroke-width="1" opacity="0.3"/>
      <text x="50" y="42" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" font-weight="bold" fill="#003366">SOUTH AFRICAN</text>
      <text x="50" y="52" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" font-weight="bold" fill="#003366">CIVIL AVIATION</text>
      <text x="50" y="62" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" font-weight="bold" fill="#003366">AUTHORITY</text>
      <path d="M30 72 Q50 80 70 72" fill="none" stroke="#CC0000" stroke-width="2"/>
    </svg>
    <div class="header-text">
      <strong>SOUTH AFRICAN CIVIL AVIATION AUTHORITY</strong>
      Flight Plan — ICAO Format<br>
      <span style="font-size:7pt;color:#555">In accordance with ICAO Annex 2 and CATS</span>
    </div>
  </div>
  <div class="header-right">
    Form CA 172-04<br>
    Revision: 01<br>
    Date: ${f.signature_date || new Date().toISOString().split('T')[0]}
  </div>
</div>

<table>
  <tr><td colspan="8" class="title">FLIGHT PLAN</td></tr>
  <tr>
    <td colspan="2" style="border-bottom:none"><span class="section-label">PRIORITY</span><br><span class="arrows">&lt;&lt;≡</span> <span class="field-value-sm">${f.priority}</span> →</td>
    <td colspan="6"><span class="section-label">ADDRESSEE(S)</span><br><div class="field-value-sm">${f.addressees}</div></td>
  </tr>
  <tr>
    <td colspan="2"><span class="section-label">FILING TIME</span><br><div class="field-value-sm">${f.filing_time}</div></td>
    <td colspan="6"><span class="section-label">ORIGINATOR</span><br><div class="field-value-sm">${f.originator}</div></td>
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
    <td colspan="2"><span class="section-label">19 ENDURANCE</span><br>
      <span class="field-value-sm">- E / <span class="field-value">${f.endurance.slice(0, 2) || '__'}</span> Hr <span class="field-value">${f.endurance.slice(2, 4) || '__'}</span> Min</span>
    </td>
    <td colspan="2"><span class="section-label">PERSONS ON BOARD</span><br>
      <span class="field-value">→P / ${f.pob}</span>
    </td>
    <td colspan="1" style="text-align:center"><span class="section-label">UHF</span><br>
      <span class="field-value">${f.emergency_radio_uhf ? '☑' : '☐'} U</span>
    </td>
    <td colspan="1" style="text-align:center"><span class="section-label">VHF</span><br>
      <span class="field-value">${f.emergency_radio_vhf ? '☑' : '☐'} V</span>
    </td>
    <td colspan="2" style="text-align:center"><span class="section-label">ELT</span><br>
      <span class="field-value">${f.emergency_radio_elt ? '☑' : '☐'} E</span>
    </td>
  </tr>

  <!-- Survival & Jackets -->
  <tr>
    <td colspan="1" style="border-right:none"><span class="section-label">SURVIVAL EQUIPMENT</span><br>
      <span class="field-value-sm">→S /</span>
    </td>
    <td style="text-align:center;border-left:none;border-right:none"><span class="section-label">Polar</span><br><span class="field-value">${f.survival_polar ? '☑' : '☐'} P</span></td>
    <td style="text-align:center;border-left:none;border-right:none"><span class="section-label">Desert</span><br><span class="field-value">${f.survival_desert ? '☑' : '☐'} D</span></td>
    <td style="text-align:center;border-left:none;border-right:none"><span class="section-label">Maritime</span><br><span class="field-value">${f.survival_maritime ? '☑' : '☐'} M</span></td>
    <td style="text-align:center;border-left:none"><span class="section-label">Jungle</span><br><span class="field-value">${f.survival_jungle ? '☑' : '☐'} J</span></td>
    <td colspan="1" style="text-align:center"><span class="section-label">Light</span><br><span class="field-value">${f.jackets_light ? '☑' : '☐'} L</span></td>
    <td colspan="1" style="text-align:center"><span class="section-label">Fluores</span><br><span class="field-value">${f.jackets_fluores ? '☑' : '☐'} F</span></td>
    <td colspan="1" style="text-align:center"><span class="section-label">UHF / VHF</span><br><span class="field-value">${f.jackets_uhf ? '☑' : '☐'} U ${f.jackets_vhf ? '☑' : '☐'} V</span></td>
  </tr>

  <!-- Dinghies -->
  <tr>
    <td colspan="1"><span class="section-label">DINGHIES</span><br>
      <span class="field-value-sm">→D /</span>
    </td>
    <td colspan="1"><span class="section-label">Number</span><br><span class="field-value">${f.dinghies_number}</span></td>
    <td colspan="1"><span class="section-label">Capacity</span><br><span class="field-value">${f.dinghies_capacity}</span></td>
    <td colspan="1"><span class="section-label">Cover</span><br><span class="field-value">→C ${f.dinghies_cover ? '☑' : '☐'}</span></td>
    <td colspan="4"><span class="section-label">Colour</span><br><span class="field-value">${f.dinghies_colour}</span></td>
  </tr>

  <!-- Aircraft colour -->
  <tr>
    <td colspan="8"><span class="section-label">AIRCRAFT COLOUR AND MARKINGS</span><br>
      <span class="field-value-sm">A / ${f.aircraft_colour}</span>
    </td>
  </tr>

  <!-- Remarks -->
  <tr>
    <td colspan="8"><span class="section-label">REMARKS</span><br>
      <span class="field-value-sm">→N / ${f.remarks}</span> <span class="arrows">&lt;&lt;≡</span>
    </td>
  </tr>

  <!-- PIC -->
  <tr>
    <td colspan="4"><span class="section-label">PILOT IN COMMAND</span><br>
      <span class="field-value">C / ${f.pic}</span>
    </td>
    <td colspan="4"><span class="section-label">PIC TELEPHONE</span><br>
      <span class="field-value-sm">${f.pic_telephone}</span> <span class="arrows">) &lt;&lt;≡</span>
    </td>
  </tr>

  <!-- Filed By -->
  <tr>
    <td colspan="8" style="border-bottom:none"><span class="section-label" style="font-weight:bold;font-size:9pt;text-align:center;display:block">FILED BY:</span></td>
  </tr>
  <tr>
    <td colspan="4"><span class="section-label">FILED BY</span><br><div class="field-value-sm">${f.filed_by}</div>
      ${f.filed_by_phone ? `<div style="font-size:7pt;color:#555;margin-top:2px">TEL: ${f.filed_by_phone}</div>` : ''}
    </td>
    <td colspan="4" style="font-size:7pt;text-align:center;vertical-align:top;padding:6px">
      SPACE RESERVED FOR ADDITIONAL REQUIREMENTS<br><span style="font-size:6pt">Please provide a telephone number so our operators can contact you if needed</span>
    </td>
  </tr>

  <!-- Signature -->
  <tr>
    <td colspan="3" style="min-height:40px;padding:8px"><span class="section-label" style="font-weight:bold">SIGNATURE AND CAPACITY</span>${sigBlock}</td>
    <td colspan="3"><span class="section-label" style="font-weight:bold">NAME IN BLOCK LETTERS</span><br><div class="field-value" style="padding-top:8px">${f.signature_name}</div></td>
    <td colspan="2"><span class="section-label" style="font-weight:bold">DATE</span><br><div class="field-value" style="padding-top:8px">${f.signature_date}</div></td>
  </tr>

  <tr>
    <td colspan="4" style="font-size:6pt;border-top:none">CA 172-04</td>
    <td colspan="4" style="font-size:6pt;text-align:right;border-top:none">Page 1 of 1</td>
  </tr>
</table>
</body></html>`;
}
