import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";

interface PDFPreviewProps {
  file: FileInfo;
}

export default function PDFPreview({ file }: PDFPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let currentBlobUrl: string | null = null;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    const url = getDownloadURL(file.source ?? "default", file.path);

    fetch(url, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        currentBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(currentBlobUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (revoked) return;
        setError(err.message ?? "Failed to load PDF");
        setLoading(false);
      });

    return () => {
      revoked = true;
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
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-destructive">
        <span>{error}</span>
        <a
          href={getDownloadURL(file.source ?? "default", file.path)}
          download={file.name}
          className="text-sm text-primary hover:underline"
        >
          Download instead
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-muted/30 border border-border/50 max-h-[80vh]">
      {blobUrl && (
        <iframe
          src={blobUrl}
          title={file.name}
          className="w-[90vw] h-[80vh] max-w-full border-0"
          allow="fullscreen"
        />
      )}
    </div>
  );
}
