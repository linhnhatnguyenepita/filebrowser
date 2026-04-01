import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFileStore } from "@/lib/stores/file-store";
import { getPreviewType } from "@/lib/utils/preview";
import { apiPath } from "@/lib/api/client";
import ImagePreview from "./preview/ImagePreview";
import VideoPreview from "./preview/VideoPreview";
import AudioPreview from "./preview/AudioPreview";
import TextPreview from "./preview/TextPreview";
import PDFPreview from "./preview/PDFPreview";

const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB

export default function PreviewModal() {
  const { previewFile, setPreviewFile } = useFileStore();
  const [showLargeWarning, setShowLargeWarning] = useState(false);

  const open = previewFile !== null;
  const file = previewFile;

  useEffect(() => {
    if (file && file.size > LARGE_FILE_THRESHOLD) {
      setShowLargeWarning(true);
    } else {
      setShowLargeWarning(false);
    }
  }, [file]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPreviewFile(null);
    }
  };

  if (!file) return null;

  const previewType = getPreviewType(file.type);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-4xl w-full p-0 gap-0 overflow-hidden"
        showCloseButton
      >
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border bg-card/80">
          <DialogTitle className="truncate text-base font-semibold text-foreground">{file.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Previewing {file.name}
          </DialogDescription>
        </DialogHeader>

        {showLargeWarning ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
            <p className="text-sm text-muted-foreground">
              This file is large ({Math.round(file.size / 1024 / 1024)}MB). Previewing may be slow.
            </p>
            <div className="flex gap-3">
              <a
                href={window.origin + apiPath("resources/download", {
                  source: file.source ?? "default",
                  file: file.path,
                })}
                download={file.name}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
              >
                Download
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLargeWarning(false)}
              >
                Preview Anyway
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            {previewType === "image" && <ImagePreview file={file} />}
            {previewType === "video" && <VideoPreview file={file} />}
            {previewType === "audio" && <AudioPreview file={file} />}
            {previewType === "text" && <TextPreview file={file} />}
            {previewType === "pdf" && <PDFPreview file={file} />}
            {!previewType && (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Cannot preview this file type.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
