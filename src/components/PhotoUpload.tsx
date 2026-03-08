import { useCallback, useRef } from 'react';
import { Upload, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PhotoUploadProps {
  onPhotosSelected: (files: File[]) => void;
}

export function PhotoUpload({ onPhotosSelected }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArr.length === 0) {
      toast.error('Please select image files only');
      return;
    }
    onPhotosSelected(fileArr);
    toast.info(`${fileArr.length} photo(s) ready — OCR extraction requires Cloud integration`);
  }, [onPhotosSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div
      className="glass-panel p-6 border-dashed border-2 border-border hover:border-primary/50 transition-colors cursor-pointer glow-cyan"
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex gap-2">
          <Camera className="h-8 w-8 text-accent" />
          <Upload className="h-8 w-8 text-accent" />
        </div>
        <div>
          <p className="font-mono text-sm text-foreground">UPLOAD LOGBOOK PHOTOS</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag & drop or click to select pages — OCR will extract flight data
          </p>
        </div>
      </div>
    </div>
  );
}
