import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eraser, FileDown } from 'lucide-react';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (signatureData: { imageDataUrl: string; name: string; title: string }) => void;
}

export function SignatureDialog({ open, onOpenChange, onConfirm }: SignatureDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
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
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Draw signature line
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    setHasSignature(false);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(initCanvas, 100);
    }
  }, [open, initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const endDraw = () => setIsDrawing(false);

  const handleClear = () => initCanvas();

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    onConfirm({
      imageDataUrl: canvas.toDataURL('image/png'),
      name,
      title,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-wider text-sm">DIGITAL SIGNATURE</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Sign below to authorize this Mass & Balance report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-mono text-[10px] tracking-wider text-muted-foreground">NAME</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="font-mono text-xs h-8" />
            </div>
            <div>
              <Label className="font-mono text-[10px] tracking-wider text-muted-foreground">TITLE / LICENSE</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. PIC, CPL(H)" className="font-mono text-xs h-8" />
            </div>
          </div>

          <div className="relative border border-border rounded-md overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ height: 150 }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute top-1 right-1 h-7 px-2 text-xs font-mono text-muted-foreground hover:text-destructive"
            >
              <Eraser className="w-3 h-3 mr-1" /> Clear
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-mono text-xs">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!hasSignature} className="font-mono text-xs gap-1.5">
            <FileDown className="w-3.5 h-3.5" /> Sign & Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
