import { useCallback, useRef, useState } from 'react';
import { Upload, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LogbookEntry } from '@/types/logbook';
import { ExtractedDataReview, ExtractedEntry } from '@/components/ExtractedDataReview';

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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [extractedEntries, setExtractedEntries] = useState<ExtractedEntry[]>([]);
  const { user } = useAuth();

  const processFile = useCallback(async (file: File) => {
    const base64 = await fileToBase64(file);
    const { data, error } = await supabase.functions.invoke('extract-logbook', {
      body: { imageBase64: base64, userId: user?.id },
    });

    if (error) {
      throw new Error(error.message || 'OCR extraction failed');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return (data?.entries || []) as ExtractedEntry[];
  }, [user?.id]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (validFiles.length === 0) {
      toast.error('Please select image or PDF files');
      return;
    }

    setProcessing(true);
    let totalEntries: ExtractedEntry[] = [];

    try {
      for (const file of validFiles) {
        toast.info(`Processing ${file.name}...`);
        const entries = await processFile(file);
        totalEntries = [...totalEntries, ...entries];
      }

      if (totalEntries.length > 0) {
        setExtractedEntries(totalEntries);
        setReviewOpen(true);
        const flagged = totalEntries.filter(e => e.confidence < 98).length;
        if (flagged > 0) {
          toast.warning(`${flagged} entr${flagged === 1 ? 'y' : 'ies'} flagged for review — please check before saving`);
        } else {
          toast.success(`${totalEntries.length} entries extracted — review and save`);
        }
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
  }, [processFile]);

  const handleConfirm = useCallback((entries: Omit<LogbookEntry, 'id'>[]) => {
    onEntriesExtracted(entries);
    toast.success(`Saved ${entries.length} flight entries`);
  }, [onEntriesExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!processing) handleFiles(e.dataTransfer.files);
  }, [handleFiles, processing]);

  return (
    <>
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
          accept="image/*,application/pdf"
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
              {processing ? 'EXTRACTING FLIGHT DATA...' : 'UPLOAD LOGBOOK PHOTOS / PDF'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {processing
                ? 'AI is reading your logbook — this may take a moment'
                : 'Drag & drop or click — supports images and PDFs'}
            </p>
          </div>
        </div>
      </div>

      <ExtractedDataReview
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        entries={extractedEntries}
        onConfirm={handleConfirm}
      />
    </>
  );
}
