import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Loader2, Trash2, Save, Layout, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useColumnTemplates, ColumnMapping } from '@/hooks/useColumnTemplates';
import { NumericField } from '@/types/logbook';

const FIELD_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'aircraftType', label: 'Class or Type' },
  { value: 'aircraftReg', label: 'Registration' },
  { value: 'pilotInCommand', label: 'Pilot in Command' },
  { value: 'flightDetails', label: 'Flight Details' },
  { value: 'seDayDual', label: 'SE Day Dual' },
  { value: 'seDayPilot', label: 'SE Day Pilot/PIC' },
  { value: 'seNightDual', label: 'SE Night Dual' },
  { value: 'seNightPilot', label: 'SE Night Pilot/PIC' },
  { value: 'instrumentTime', label: 'Instrument Time' },
  { value: 'instructorDay', label: 'Instructor Day' },
  { value: 'instructorNight', label: 'Instructor Night' },
  { value: 'unmapped', label: '— Skip / Unmapped —' },
];

export function ColumnTemplateManager() {
  const { templates, loading, saveTemplate, deleteTemplate } = useColumnTemplates();
  const [setupOpen, setSetupOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [columns, setColumns] = useState<ColumnMapping[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setSetupOpen(true);
    setColumns([]);
    setTemplateName('');

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('extract-columns', {
        body: { imageBase64: base64 },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Failed to extract columns');
        setSetupOpen(false);
        return;
      }

      const extracted = (data?.columns || []) as ColumnMapping[];
      if (extracted.length === 0) {
        toast.error('No columns detected in image');
        setSetupOpen(false);
        return;
      }

      setColumns(extracted);
      toast.success(`Detected ${extracted.length} columns`);
    } catch (err) {
      console.error('Column extraction error:', err);
      toast.error('Failed to process image');
      setSetupOpen(false);
    } finally {
      setExtracting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, []);

  const updateMapping = (index: number, field: string) => {
    setColumns(prev => prev.map((col, i) => i === index ? { ...col, mappedField: field } : col));
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    setSaving(true);
    const sourceHeaders = columns.map(c => c.sourceHeader);
    await saveTemplate(templateName.trim(), columns, sourceHeaders);
    setSaving(false);
    setSetupOpen(false);
    setColumns([]);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Button to create new template */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="font-mono text-[10px] gap-1 h-7 md:h-9 md:text-xs border-accent text-accent"
      >
        <Layout className="h-3 w-3 md:h-4 md:w-4" />
        <span className="hidden md:inline">COLUMN TEMPLATE</span>
        <span className="md:hidden">TEMPLATE</span>
      </Button>

      {/* Button to view existing templates */}
      {templates.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setListOpen(true)}
          className="font-mono text-[10px] gap-1 h-7 md:h-9 md:text-xs text-muted-foreground"
        >
          ({templates.length})
        </Button>
      )}

      {/* Setup Dialog — photo extracted, review mapping */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {extracting ? 'ANALYSING LOGBOOK FORMAT...' : 'REVIEW COLUMN MAPPING'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {extracting
                ? 'AI is reading your logbook column headers...'
                : 'Review the detected columns and adjust any incorrect mappings, then save as a template.'}
            </DialogDescription>
          </DialogHeader>

          {extracting ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-3">
                <label className="font-mono text-[10px] text-muted-foreground mb-1 block">TEMPLATE NAME</label>
                <Input
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="e.g. SACAA Logbook, Old Format..."
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex-1 max-h-[50vh] overflow-y-auto pr-1">
                <div className="space-y-2 pr-2">
                  {columns.map((col, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded border border-border/50 bg-muted/20">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs truncate">{col.sourceHeader}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                          {col.confidence >= 70 ? (
                            <Check className="h-3 w-3 text-accent" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-primary" />
                          )}
                          <span className="text-[9px] text-muted-foreground">{col.confidence}% match</span>
                        </div>
                      </div>
                      <Select value={col.mappedField} onValueChange={v => updateMapping(i, v)}>
                        <SelectTrigger className="w-[160px] font-mono text-[11px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="font-mono text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="mt-3">
                <Button variant="outline" onClick={() => setSetupOpen(false)} className="font-mono text-xs">
                  CANCEL
                </Button>
                <Button onClick={handleSave} disabled={saving} className="font-mono text-xs gap-1">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  SAVE TEMPLATE
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* List Dialog — manage existing templates */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">SAVED TEMPLATES</DialogTitle>
            <DialogDescription className="text-xs">
              Your saved column mappings. These are used automatically during spreadsheet imports.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto">
            <div className="space-y-2">
              {templates.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded border border-border/50 bg-muted/20">
                  <div>
                    <p className="font-mono text-sm font-medium">{t.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {t.columnMapping.filter(c => c.mappedField !== 'unmapped').length} mapped columns
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteTemplate(t.id)} className="h-7 w-7 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
