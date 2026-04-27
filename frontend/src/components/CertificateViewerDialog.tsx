import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileUrl: string;
  isPdf: boolean;
}

export default function CertificateViewerDialog({ open, onOpenChange, fileName, fileUrl, isPdf }: Props) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!open || !isPdf || !fileUrl) {
      setPreviewUrl('');
      return;
    }

    // Convert large data URLs to Blob URLs for reliable PDF rendering.
    if (fileUrl.startsWith('data:')) {
      try {
        const [meta, base64] = fileUrl.split(',', 2);
        if (!base64) {
          setPreviewUrl(fileUrl);
          return;
        }

        const mimeType = meta.match(/data:(.*?);base64/)?.[1] || 'application/pdf';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        setPreviewUrl(blobUrl);

        return () => {
          URL.revokeObjectURL(blobUrl);
        };
      } catch {
        setPreviewUrl(fileUrl);
        return;
      }
    }

    setPreviewUrl(fileUrl);
  }, [open, isPdf, fileUrl]);

  const effectiveUrl = previewUrl || fileUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{fileName || 'Certificate Preview'}</DialogTitle>
          <DialogDescription className="sr-only">
            Preview uploaded certificate document.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 rounded-md border bg-background overflow-hidden">
          {isPdf ? (
            <object data={effectiveUrl} type="application/pdf" className="h-full w-full">
              <div className="h-full w-full flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
                <p>PDF preview browser me load nahi ho paayi.</p>
                <Button asChild type="button" variant="outline" size="sm">
                  <a href={effectiveUrl} target="_blank" rel="noreferrer">
                    Open in new tab
                  </a>
                </Button>
              </div>
            </object>
          ) : (
            <div className="h-full w-full flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
              This file cannot be previewed in the PDF viewer. Please upload PDF certificates.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
