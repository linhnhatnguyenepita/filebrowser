import { useEffect, useState } from "react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { getAuthHeader } from "@/lib/api/client";
import VideoPlayer from "@/components/player/createVideoPlayer";

interface VideoPreviewProps {
  file: FileInfo;
}

export default function VideoPreview({ file }: VideoPreviewProps) {
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

    fetch(url, { credentials: "same-origin", headers: getAuthHeader() })
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
        setError(err.message ?? "Failed to load video");
        setLoading(false);
      });

    return () => {
      revoked = true;
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    };
  }, [file]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-secondary/50 flex items-center justify-center max-h-[80vh]">
      {blobUrl && <VideoPlayer src={blobUrl} className="max-w-[90vw] max-h-[80vh]" />}
    </div>
  );
}
