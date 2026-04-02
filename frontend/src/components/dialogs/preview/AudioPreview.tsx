import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { fetchMetadata } from "@/lib/api/metadata";
import { getDownloadURL } from "@/lib/api/resources";

interface AudioPreviewProps {
  file: FileInfo;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function stripExtension(name: string): string {
  const lastDot = name.lastIndexOf(".");
  return lastDot > 0 ? name.slice(0, lastDot) : name;
}

export default function AudioPreview({ file }: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [trackTitle, setTrackTitle] = useState(stripExtension(file.name));
  const [artist, setArtist] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    const source = file.source ?? "default";

    // Fetch metadata for album art, title, artist, duration
    fetchMetadata(source, file.path)
      .then((meta) => {
        if (revoked) return;
        if (meta.metadata) {
          if (meta.metadata.albumArt) setAlbumArt(meta.metadata.albumArt);
          if (meta.metadata.title) setTrackTitle(meta.metadata.title);
          if (meta.metadata.artist) setArtist(meta.metadata.artist);
          if (meta.metadata.duration) setDuration(meta.metadata.duration);
        }
      })
      .catch(() => {
        // Non-fatal: continue without metadata
      });

    // Fetch audio blob
    const url = getDownloadURL(source, file.path);
    fetch(url, { credentials: "same-origin" })
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

  // Sync audio element state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [blobUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    playing ? audio.pause() : audio.play();
  };

  const seek = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };

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

      {/* Track Info + Controls */}
      <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base font-medium truncate">{trackTitle}</span>
        </div>
        {artist && (
          <span className="text-sm text-muted-foreground truncate">{artist}</span>
        )}

        {/* Hidden audio element */}
        {blobUrl && (
          <audio
            ref={audioRef}
            src={blobUrl}
            preload="metadata"
          />
        )}

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground tabular-nums w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 cursor-pointer accent-primary"
            disabled={!blobUrl || loading}
          />
          <span className="text-sm text-muted-foreground tabular-nums w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => seek(-10)}
            className="p-1.5 rounded-full hover:bg-accent transition-colors"
            aria-label="Rewind 10 seconds"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            disabled={!blobUrl || loading}
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => seek(10)}
            className="p-1.5 rounded-full hover:bg-accent transition-colors"
            aria-label="Forward 10 seconds"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 cursor-pointer accent-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
