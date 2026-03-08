import { useCallback, useRef, useState } from 'react';
import { Upload, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LogbookEntry } from '@/types/logbook';

interface PhotoUploadProps {
  onEntriesExtracted: (entries: Omit<LogbookEntry, 'id'>[]) => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoUpload({ onEntriesExtracted }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const processFile = useCallback(async (file: File) => {
    const base64 = await fileToBase64(file);
    const { data, error } = await supabase.functions.invoke('extract-logbook', {
      body: { imageBase64: base64 },
    });

    if (error) {
      throw new Error(error.message || 'OCR extraction failed');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return (data?.entries || []) as Omit<LogbookEntry, 'id'>[];
  }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('Please select image files only');
      return;
    }

    setProcessing(true);
    let totalEntries: Omit<LogbookEntry, 'id'>[] = [];

    try {
      for (const file of imageFiles) {
        toast.info(`Processing ${file.name}...`);
        const entries = await processFile(file);
        totalEntries = [...totalEntries, ...entries];
      }

      if (totalEntries.length > 0) {
        onEntriesExtracted(totalEntries);
        toast.success(`Extracted ${totalEntries.length} flight entries from ${imageFiles.length} photo(s)`);
      } else {
        toast.warning('No flight entries could be extracted from the image(s)');
      }
    } catch (err) {
      console.error('OCR error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to extract entries');
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [processFile, onEntriesExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!processing) handleFiles(e.dataTransfer.files);
  }, [handleFiles, processing]);

  return (
    <div
      className={`glass-panel p-6 border-dashed border-2 border-border transition-colors glow-cyan ${
        processing ? 'opacity-70 cursor-wait' : 'hover:border-primary/50 cursor-pointer'
      }`}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => !processing && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
        disabled={processing}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex gap-2">
          {processing ? (
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
          ) : (
            <>
              <Camera className="h-8 w-8 text-accent" />
              <Upload className="h-8 w-8 text-accent" />
            </>
          )}
        </div>
        <div>
          <p className="font-mono text-sm text-foreground">
            {processing ? 'EXTRACTING FLIGHT DATA...' : 'UPLOAD LOGBOOK PHOTOS'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {processing
              ? 'AI is reading your logbook page — this may take a moment'
              : 'Drag & drop or click to select pages — AI will extract flight data'}
          </p>
        </div>
      </div>
    </div>
  );
}
