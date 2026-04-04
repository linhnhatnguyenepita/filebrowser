import { Download } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getPreviewType } from "@/lib/utils/preview";
import { getShareDownloadURL } from "@/lib/api/share-viewer";
import ImagePreview from "@/components/dialogs/preview/ImagePreview";
import VideoPreview from "@/components/dialogs/preview/VideoPreview";
import AudioPreview from "@/components/dialogs/preview/AudioPreview";
import TextPreview from "@/components/dialogs/preview/TextPreview";
import PDFPreview from "@/components/dialogs/preview/PDFPreview";

interface SharePreviewProps {
  file: FileInfo;
  hash: string;
}

export default function SharePreview({ file, hash }: SharePreviewProps) {
  const previewType = getPreviewType(file.type);
  const downloadUrl = getShareDownloadURL(hash, file.path);

  if (!previewType) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Cannot preview this file type.
        </p>
        <a
          href={getShareDownloadURL(hash, file.path)}
          download={file.name}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download File
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <span className="text-sm font-medium truncate text-foreground">{file.name}</span>
        <div className="flex gap-2 ml-4 shrink-0">
          <a
            href={getShareDownloadURL(hash, file.path)}
            download={file.name}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      </div>

      <div className="px-6 pb-6">
        {previewType === "image" && <ImagePreview file={file} downloadUrl={downloadUrl} />}
        {previewType === "video" && <VideoPreview file={file} downloadUrl={downloadUrl} />}
        {previewType === "audio" && <AudioPreview file={file} downloadUrl={downloadUrl} />}
        {previewType === "text" && <TextPreview file={file} downloadUrl={downloadUrl} />}
        {previewType === "pdf" && <PDFPreview file={file} downloadUrl={downloadUrl} />}
      </div>
    </div>
  );
}
