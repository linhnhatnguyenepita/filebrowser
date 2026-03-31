import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import PreviewInfoOverlay from "./PreviewInfoOverlay";

interface ImagePreviewProps {
  file: FileInfo;
}

export default function ImagePreview({ file }: ImagePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    let currentBlobUrl: string | null = null;
    setLoading(true);
    setError(null);
    setBlobUrl(null);
    setDimensions(null);

    const url = getDownloadURL(file.source ?? "default", file.path);

    fetch(url, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        currentBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(currentBlobUrl);
        setLoading(false);

        // Get natural dimensions
        const img = new window.Image();
        img.onload = () => {
          if (!cancelled) setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
        };
        img.src = currentBlobUrl;
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? "Failed to load image");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    };
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        {error}
      </div>
    );
  }

  const dimLabel =
    dimensions ? `${dimensions.w} × ${dimensions.h}` : null;

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-t-xl min-h-48 max-h-[80vh] overflow-hidden">
        {blobUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl}
            alt={file.name}
            className="max-w-[90vw] max-h-[70vh] object-contain"
          />
        )}
      </div>
      <PreviewInfoOverlay
        name={file.name}
        size={file.size}
        type={file.type}
        extra={dimLabel ? <span className="text-white/60">{dimLabel}</span> : undefined}
      />
    </div>
  );
}
