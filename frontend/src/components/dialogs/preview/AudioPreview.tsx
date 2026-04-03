import { useEffect, useState } from "react";
import { Music } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { fetchMetadata } from "@/lib/api/metadata";
import { getDownloadURL } from "@/lib/api/resources";
import { getAuthHeader } from "@/lib/api/client";
import AudioPlayer from "@/components/player/createAudioPlayer";

interface AudioPreviewProps {
  file: FileInfo;
}

function stripExtension(name: string): string {
  const lastDot = name.lastIndexOf(".");
  return lastDot > 0 ? name.slice(0, lastDot) : name;
}

export default function AudioPreview({ file }: AudioPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [trackTitle, setTrackTitle] = useState(stripExtension(file.name));
  const [artist, setArtist] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    const source = file.source ?? "default";

    // Fetch metadata for album art, title, artist
    fetchMetadata(source, file.path)
      .then((meta) => {
        if (revoked) return;
        if (meta.metadata) {
          if (meta.metadata.albumArt) setAlbumArt(meta.metadata.albumArt);
          if (meta.metadata.title) setTrackTitle(meta.metadata.title);
          if (meta.metadata.artist) setArtist(meta.metadata.artist);
        }
      })
      .catch(() => {
        // Non-fatal: continue without metadata
      });

    // Fetch audio blob
    const url = getDownloadURL(source, file.path);
    fetch(url, { credentials: "same-origin", headers: getAuthHeader() })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        setBlobUrl(URL.createObjectURL(blob));
        setLoading(false);
      })
      .catch((err) => {
        if (revoked) return;
        setError(err.message ?? "Failed to load audio");
        setLoading(false);
      });

    return () => {
      revoked = true;
    };
  }, [file]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-4 relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10 rounded-xl">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Album Art */}
      <div className="flex-shrink-0 w-[120px] h-[120px] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        {albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={albumArt}
            alt="Album art"
            className="w-full h-full object-cover"
          />
        ) : (
          <Music className="w-12 h-12 text-muted-foreground" />
        )}
      </div>

      {/* Track Info + Video.js Player */}
      <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base font-medium truncate">{trackTitle}</span>
        </div>
        {artist && (
          <span className="text-sm text-muted-foreground truncate">{artist}</span>
        )}

        {/* Video.js audio player — replaces custom controls */}
        {blobUrl && (
          <AudioPlayer src={blobUrl} />
        )}
      </div>
    </div>
  );
}
