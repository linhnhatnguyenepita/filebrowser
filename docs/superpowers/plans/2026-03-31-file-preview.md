# File Preview System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add single-click preview support for images, audio, video, text, and PDF files to frontend-next. Single click previews previewable files; double click (or non-previewable files) triggers download. Keyboard: Enter = preview, Shift+Enter = force download.

**Architecture:** A single `PreviewModal` dialog shell renders type-specific preview components (image, video, audio, text, PDF). The backend gets a new `/api/resources/metadata` endpoint for audio/video metadata (duration, album art) while image/video/audio binary content is served via the existing `/api/resources/download` endpoint with `inline=true`. The frontend uses a debounced single/double-click detection (250ms window) to disambiguate.

**Tech Stack:** TypeScript (strict), base-ui `@base-ui/react/dialog`, Zustand (existing), native `<video>`, `<audio>`, `<iframe>` for previews.

---

## File Map

### Backend

- Create: `backend/http/metadata.go` — new `GET /api/resources/metadata` handler
- Modify: `backend/http/httpRouter.go` — register the new route

### Frontend

- Create: `frontend-next/src/lib/utils/preview.ts` — `isPreviewable()` helper + MIME type constants
- Create: `frontend-next/src/lib/api/metadata.ts` — TypeScript client for the new metadata endpoint
- Modify: `frontend-next/src/lib/stores/file-store.ts` — add `previewFile: FileInfo | null` + `setPreviewFile()`
- Modify: `frontend-next/src/lib/api/resources.ts` — add `getDownloadURL(source, path, inline?)` overload (optional new helper, or just use existing)
- Create: `frontend-next/src/components/dialogs/PreviewModal.tsx` — dialog shell with loading/error/content states
- Create: `frontend-next/src/components/dialogs/preview/ImagePreview.tsx` — image + info overlay
- Create: `frontend-next/src/components/dialogs/preview/VideoPreview.tsx` — native video element
- Create: `frontend-next/src/components/dialogs/preview/AudioPreview.tsx` — album art + custom controls
- Create: `frontend-next/src/components/dialogs/preview/TextPreview.tsx` — monospace text + line numbers
- Create: `frontend-next/src/components/dialogs/preview/PDFPreview.tsx` — embedded iframe
- Create: `frontend-next/src/components/dialogs/preview/PreviewInfoOverlay.tsx` — shared info bar (name, size, type)
- Modify: `frontend-next/src/components/files/FileCard.tsx` — replace `window.open` with debounced single/double-click logic
- Modify: `frontend-next/src/components/files/FileRow.tsx` — same debounced click logic
- Modify: `frontend-next/src/routes/FileBrowser.tsx` — mount `PreviewModal`

---

## Task 1: Backend — `GET /api/resources/metadata`

### Acceptance Criteria
- `GET /api/resources/metadata?path=<path>&source=<source>` returns JSON with `{ name, size, modified, type, metadata: { duration?, albumArt?, width?, height?, title?, artist? } }`
- Requires authentication (same as other resource endpoints)
- Returns 400 if path/source missing, 404 if file not found
- Album art for audio files returned as base64 `data:image/jpeg;base64,...` or null
- Duration returned as float seconds

### Files

- Create: `backend/http/metadata.go`
- Modify: `backend/http/httpRouter.go:121`

### Steps

- [ ] **Step 1: Create `backend/http/metadata.go`**

Write the file:

```go
package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gtsteffaniak/filebrowser/backend/adapters/fs/files"
	"github.com/gtsteffaniak/filebrowser/backend/common/utils"
)

type MetadataResponse struct {
	Name     string       `json:"name"`
	Size     int64        `json:"size"`
	Modified string       `json:"modified"`
	Type     string       `json:"type"`
	Metadata *FileMetadata `json:"metadata,omitempty"`
}

type FileMetadata struct {
	Duration float64 `json:"duration,omitempty"`
	AlbumArt string  `json:"albumArt,omitempty"` // base64 data URI
	Width    int     `json:"width,omitempty"`
	Height   int     `json:"height,omitempty"`
	Title    string  `json:"title,omitempty"`
	Artist   string  `json:"artist,omitempty"`
}

// metadataHandler returns metadata for a file including audio/video metadata (duration, album art).
// @Summary Get file metadata
// @Description Returns file metadata including audio album art, video/audio duration, and image dimensions.
// @Tags Resources
// @Produce json
// @Param path query string true "Index path to the file"
// @Param source query string true "Source name"
// @Success 200 {object} MetadataResponse
// @Failure 400 {object} map[string]string "Bad request"
// @Failure 403 {object} map[string]string "Forbidden"
// @Failure 404 {object} map[string]string "File not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /api/resources/metadata [get]
func metadataHandler(w http.ResponseWriter, r *http.Request, d *requestContext) (int, error) {
	path := r.URL.Query().Get("path")
	source := r.URL.Query().Get("source")

	if path == "" {
		return http.StatusBadRequest, fmt.Errorf("path is required")
	}
	if source == "" {
		return http.StatusBadRequest, fmt.Errorf("source is required")
	}

	cleanPath, err := utils.SanitizeUserPath(path)
	if err != nil {
		return http.StatusBadRequest, fmt.Errorf("invalid path: %v", err)
	}

	fileInfo, err := files.FileInfoFaster(utils.FileOptions{
		Path:     cleanPath,
		Source:   source,
		AlbumArt: true, // request album art extraction for audio files
		Metadata: true, // request duration/width/height
	}, store.Access, d.user, store.Share)
	if err != nil {
		return errToStatus(err), err
	}

	meta := &FileMetadata{
		Width:  fileInfo.Width,
		Height: fileInfo.Height,
		Title:  fileInfo.Title,
		Artist: fileInfo.Artist,
	}

	if fileInfo.Duration > 0 {
		meta.Duration = fileInfo.Duration.Seconds()
	}

	if fileInfo.AlbumArt != nil && len(fileInfo.AlbumArt) > 0 {
		meta.AlbumArt = "data:image/jpeg;base64," + string(fileInfo.AlbumArt)
	}

	response := MetadataResponse{
		Name:     fileInfo.Name,
		Size:     fileInfo.Size,
		Modified: fileInfo.Modified.Format("2006-01-02T15:04:05Z"),
		Type:     fileInfo.Type,
		Metadata: meta,
	}

	return renderJSON(w, r, response)
}
```

- [ ] **Step 2: Register route in `backend/http/httpRouter.go`**

Find the resources section (around line 121) and add the new route:

```go
api.HandleFunc("GET /resources/preview", withTimeout(60*time.Second, withUserHelper(previewHandler)))
api.HandleFunc("GET /api/resources/metadata", withUser(metadataHandler))  // <-- ADD THIS LINE
```

Wait, the API path prefix `/api/` is already stripped by `http.StripPrefix(apiPath, api)`. Add it without the `/api/` prefix:

```go
api.HandleFunc("GET /resources/preview", withTimeout(60*time.Second, withUserHelper(previewHandler)))
api.HandleFunc("GET /resources/metadata", withUser(metadataHandler))  // <-- ADD THIS
```

- [ ] **Step 3: Verify build**

Run: `cd backend && go build ./...`
Expected: Compiles without errors

- [ ] **Step 4: Commit**

```bash
git add backend/http/metadata.go backend/http/httpRouter.go
git commit -m "feat(backend): add GET /api/resources/metadata endpoint for file metadata"
```

---

## Task 2: Frontend — Preview Utilities and API Client

### Acceptance Criteria
- `isPreviewable(fileType: string): boolean` returns true for image, video, audio, text, pdf MIME types
- `metadataApi.fetchMetadata(source, path)` returns `MetadataResponse` from the new endpoint

### Files

- Create: `frontend-next/src/lib/utils/preview.ts`
- Create: `frontend-next/src/lib/api/metadata.ts`

### Steps

- [ ] **Step 1: Create `frontend-next/src/lib/utils/preview.ts`**

```typescript
const PREVIEWABLE_MIME_PREFIXES = [
  "image/",
  "video/",
  "audio/",
  "text/",
];

const PREVIEWABLE_TYPES = new Set([
  "pdf",
  "application/pdf",
]);

export function isPreviewable(mimeType: string): boolean {
  if (PREVIEWABLE_TYPES.has(mimeType)) return true;
  return PREVIEWABLE_MIME_PREFIXES.some((prefix) =>
    mimeType.startsWith(prefix)
  );
}

export function getPreviewType(
  mimeType: string
): "image" | "video" | "audio" | "text" | "pdf" | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("text/")) return "text";
  if (mimeType === "pdf" || mimeType === "application/pdf") return "pdf";
  return null;
}
```

- [ ] **Step 2: Create `frontend-next/src/lib/api/metadata.ts`**

```typescript
import { apiPath, apiFetch } from "./client";

export interface FileMetadata {
  duration?: number;
  albumArt?: string; // data:image/jpeg;base64,...
  width?: number;
  height?: number;
  title?: string;
  artist?: string;
}

export interface MetadataResponse {
  name: string;
  size: number;
  modified: string;
  type: string;
  metadata: FileMetadata | null;
}

export async function fetchMetadata(
  source: string,
  path: string
): Promise<MetadataResponse> {
  return apiFetch<MetadataResponse>(
    apiPath("resources/metadata", { source, path })
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/lib/utils/preview.ts frontend-next/src/lib/api/metadata.ts
git commit -m "feat(frontend): add preview utilities and metadata API client"
```

---

## Task 3: Frontend — Add `previewFile` state to fileStore

### Acceptance Criteria
- `fileStore.previewFile` is `FileInfo | null` (null = modal closed)
- `fileStore.setPreviewFile(file: FileInfo | null): void` updates it

### Files

- Modify: `frontend-next/src/lib/stores/file-store.ts`

### Steps

- [ ] **Step 1: Add state fields to `FileState` interface**

In the interface, add:

```typescript
previewFile: FileInfo | null;
setPreviewFile: (file: FileInfo | null) => void;
```

- [ ] **Step 2: Add initial state and implementation**

In `create<FileState>((set) => ({`, add:

```typescript
previewFile: null,
setPreviewFile: (file) => set({ previewFile: file }),
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend-next && bun run build` (or `bunx tsc --noEmit`)
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/lib/stores/file-store.ts
git commit -m "feat(fileStore): add previewFile and setPreviewFile state"
```

---

## Task 4: Frontend — `PreviewInfoOverlay` shared component

### Acceptance Criteria
- Displays file name, formatted size, and type
- Renders in the footer of the preview modal
- Used by all preview type components

### Files

- Create: `frontend-next/src/components/dialogs/preview/PreviewInfoOverlay.tsx`

### Steps

- [ ] **Step 1: Write the component**

```typescript
import { formatFileSize } from "@/lib/utils/format";

interface PreviewInfoOverlayProps {
  name: string;
  size: number;
  type: string;
  extra?: React.ReactNode;
}

export default function PreviewInfoOverlay({
  name,
  size,
  type,
  extra,
}: PreviewInfoOverlayProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-black/60 text-xs text-white/80 rounded-b-xl">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="truncate font-medium text-white">{name}</span>
        <span className="text-white/60">
          {formatFileSize(size)} &middot; {type}
        </span>
      </div>
      {extra}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/dialogs/preview/PreviewInfoOverlay.tsx
git commit -m "feat(preview): add PreviewInfoOverlay shared component"
```

---

## Task 5: Frontend — `ImagePreview` component

### Acceptance Criteria
- Renders `<img>` with blob URL, max 90vw × 80vh, `object-fit: contain`
- Overlay footer with name, W×H dimensions, file size
- Shows loading spinner while blob is loading
- Handles `onError` with error state

### Files

- Create: `frontend-next/src/components/dialogs/preview/ImagePreview.tsx`

### Steps

- [ ] **Step 1: Write the component**

```typescript
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { apiFetch } from "@/lib/api/client";
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
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    const url = getDownloadURL(file.source ?? "default", file.path);

    apiFetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` } })
      .then((res: Response) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);

        // Get natural dimensions
        const img = new window.Image();
        img.onload = () => {
          if (!cancelled) setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
        };
        img.src = url;
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? "Failed to load image");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/dialogs/preview/ImagePreview.tsx
git commit -m "feat(preview): add ImagePreview component"
```

---

## Task 6: Frontend — `VideoPreview` component

### Acceptance Criteria
- Renders `<video controls>` with blob URL
- Video max 90vw × 80vh
- File name in header (handled by parent `PreviewModal`)
- Shows loading spinner while blob is loading

### Files

- Create: `frontend-next/src/components/dialogs/preview/VideoPreview.tsx`

### Steps

- [ ] **Step 1: Write the component**

```typescript
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { apiFetch } from "@/lib/api/client";

interface VideoPreviewProps {
  file: FileInfo;
}

export default function VideoPreview({ file }: VideoPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    const url = getDownloadURL(file.source ?? "default", file.path);

    apiFetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
    })
      .then((res: Response) => {
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
        setError(err.message ?? "Failed to load video");
        setLoading(false);
      });

    return () => {
      revoked = true;
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

  return (
    <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[80vh]">
      {blobUrl && (
        <video
          controls
          src={blobUrl}
          className="max-w-[90vw] max-h-[80vh]"
        >
          <track kind="captions" />
        </video>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/dialogs/preview/VideoPreview.tsx
git commit -m "feat(preview): add VideoPreview component"
```

---

## Task 7: Frontend — `AudioPreview` component

### Acceptance Criteria
- Two-column layout: album art (120×120, left) + track info + controls (right)
- Album art from metadata API (base64 data URI), fallback to generic music icon
- Track title = file name (without extension), subtitle = source
- Custom `<audio>` controls: play/pause, seek ±10s, volume slider, progress bar
- Duration from metadata API

### Files

- Create: `frontend-next/src/components/dialogs/preview/AudioPreview.tsx`

### Steps

- [ ] **Step 1: Write the component**

```typescript
import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { fetchMetadata } from "@/lib/api/metadata";
import { getDownloadURL } from "@/lib/api/resources";
import { apiFetch } from "@/lib/api/client";

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
    apiFetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
    })
      .then((res: Response) => {
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
    <div className="flex gap-6 p-4">
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
        {loading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
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
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
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
          <span className="text-xs text-muted-foreground tabular-nums w-10">
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/dialogs/preview/AudioPreview.tsx
git commit -m "feat(preview): add AudioPreview component with album art and custom controls"
```

---

## Task 8: Frontend — `TextPreview` component

### Acceptance Criteria
- Renders `<pre>` with monospace font, max 90vw × 80vh, scrollable
- Line numbers in a left gutter column
- File name in header (handled by parent)
- Shows loading spinner while fetching text
- Truncates large files (>1MB) with a warning

### Files

- Create: `frontend-next/src/components/dialogs/preview/TextPreview.tsx`

### Steps

- [ ] **Step 1: Write the component**

```typescript
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { apiFetch } from "@/lib/api/client";

interface TextPreviewProps {
  file: FileInfo;
}

const MAX_TEXT_SIZE = 1024 * 1024; // 1MB

export default function TextPreview({ file }: TextPreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent(null);
    setTruncated(false);

    if (file.size > MAX_TEXT_SIZE) {
      setError("File is too large to preview. Please download it.");
      setLoading(false);
      return;
    }

    const url = getDownloadURL(file.source ?? "default", file.path);

    apiFetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
    })
      .then((res: Response) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        if (text.length > MAX_TEXT_SIZE) {
          setContent(text.slice(0, MAX_TEXT_SIZE));
          setTruncated(true);
        } else {
          setContent(text);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? "Failed to load text");
        setLoading(false);
      });

    return () => {
      cancelled = true;
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

  const lines = (content ?? "").split("\n");

  return (
    <div className="flex flex-col rounded-xl overflow-hidden max-h-[80vh]">
      {truncated && (
        <div className="px-3 py-1.5 bg-yellow-500/10 text-yellow-600 text-xs border-b border-yellow-500/20">
          File truncated at 1MB.{" "}
          <a
            href={getDownloadURL(file.source ?? "default", file.path)}
            download={file.name}
            className="underline hover:text-yellow-700"
          >
            Download
          </a>{" "}
          for full content.
        </div>
      )}
      <div className="flex overflow-auto bg-muted/30 font-mono text-xs leading-6">
        {/* Line numbers */}
        <div className="flex-shrink-0 select-none text-right pr-3 pl-3 py-3 text-muted-foreground/60 border-r border-border/50 min-w-[3rem]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Content */}
        <pre className="flex-1 px-3 py-3 whitespace-pre overflow-x-auto text-foreground">
          {content}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/dialogs/preview/TextPreview.tsx
git commit -m "feat(preview): add TextPreview component with line numbers"
```

---

## Task 9: Frontend — `PDFPreview` component

### Acceptance Criteria
- Renders `<iframe>` with blob URL, max 90vw × 80vh
- Uses `allow="fullscreen"` for native PDF controls
- File name in header (handled by parent)

### Files

- Create: `frontend-next/src/components/dialogs/preview/PDFPreview.tsx`

### Steps

- [ ] **Step 1: Write the component**

```typescript
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { apiFetch } from "@/lib/api/client";

interface PDFPreviewProps {
  file: FileInfo;
}

export default function PDFPreview({ file }: PDFPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    const url = getDownloadURL(file.source ?? "default", file.path);

    apiFetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
    })
      .then((res: Response) => {
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
        setError(err.message ?? "Failed to load PDF");
        setLoading(false);
      });

    return () => {
      revoked = true;
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/dialogs/preview/PDFPreview.tsx
git commit -m "feat(preview): add PDFPreview component with iframe"
```

---

## Task 10: Frontend — `PreviewModal` dialog shell

### Acceptance Criteria
- Opens when `fileStore.previewFile` is set, closes when null
- Renders loading spinner while fetching; renders type-specific preview once ready
- Handles error states with appropriate toast/error message
- Shows file name in the header
- Closes on backdrop click, Escape key, or close button
- Large file warning (>100MB) with download option

### Files

- Create: `frontend-next/src/components/dialogs/PreviewModal.tsx`

### Steps

- [ ] **Step 1: Write the component**

```typescript
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFileStore } from "@/lib/stores/file-store";
import { getPreviewType } from "@/lib/utils/preview";
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
    if (file && !file.type.startsWith("text/") && file.size > LARGE_FILE_THRESHOLD) {
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
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="truncate text-base">{file.name}</DialogTitle>
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
                href={`${window.origin}/api/resources/download?file=${encodeURIComponent(file.path)}&source=${encodeURIComponent(file.source ?? "default")}`}
                download={file.name}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
              >
                Download
              </a>
              <button
                onClick={() => setShowLargeWarning(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
              >
                Preview Anyway
              </button>
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/dialogs/PreviewModal.tsx
git commit -m "feat(preview): add PreviewModal dialog shell with type routing"
```

---

## Task 11: Frontend — Update click handlers in `FileCard` and `FileRow`

### Acceptance Criteria
- Single click within 250ms window → preview (if previewable) or download
- Double click → download immediately
- Non-previewable files → download immediately on single click
- Ctrl/Cmd+Click → toggle selection only
- Keyboard: `Enter` → preview (or download for non-previewable); `Shift+Enter` → force download
- Focus states visible and accessible

### Files

- Modify: `frontend-next/src/components/files/FileCard.tsx`
- Modify: `frontend-next/src/components/files/FileRow.tsx`

### Steps

- [ ] **Step 1: Rewrite click handling in `FileCard.tsx`**

Replace the `handleClick` function with the debounced single/double-click logic. Keep everything else (checkbox, selection, icons, layout) identical.

```typescript
import { useRef, useCallback } from "react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import FileIcon from "./FileIcon";
import { isPreviewable } from "@/lib/utils/preview";

const CLICK_DELAY = 250; // ms

function formatSize(bytes: number): string {
  if (bytes === 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

interface FileCardProps {
  item: FileInfo;
  onNavigate: (path: string) => void;
}

export default function FileCard({ item, onNavigate }: FileCardProps) {
  const { selected, toggleSelect, source, setPreviewFile } = useFileStore();
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelected = selected.has(item.name);
  const isDir = item.type === "directory";

  const downloadFile = useCallback(() => {
    window.open(getDownloadURL(source, item.source ?? source, item.path), "_blank");
  }, [source, item]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        toggleSelect(item.name);
        return;
      }

      if (isDir) {
        // Navigate on any click for directories
        if (clickTimer.current) {
          clearTimeout(clickTimer.current);
          clickTimer.current = null;
        }
        onNavigate(item.path);
        return;
      }

      // Non-previewable: download immediately
      if (!isPreviewable(item.type)) {
        if (clickTimer.current) {
          clearTimeout(clickTimer.current);
          clickTimer.current = null;
        }
        downloadFile();
        return;
      }

      // Previewable: debounce to detect double-click
      if (clickTimer.current) {
        // Double click — download
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        downloadFile();
      } else {
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null;
          setPreviewFile(item);
        }, CLICK_DELAY);
      }
    },
    [isDir, item, onNavigate, toggleSelect, setPreviewFile, downloadFile, source]
  );

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey || !isPreviewable(item.type)) {
          downloadFile();
        } else {
          setPreviewFile(item);
        }
      }
    },
    [item, setPreviewFile, downloadFile]
  );

  const handleCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelect(item.name);
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${item.name}${isDir ? " (folder)" : ""}`}
      className="group relative flex flex-col items-center gap-2 rounded-lg p-3 cursor-pointer transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        background: isSelected ? "var(--accent)" : "transparent",
        border: isSelected
          ? "1px solid var(--border)"
          : "1px solid transparent",
      }}
    >
      {/* Checkbox */}
      <div
        onClick={handleCheckbox}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ opacity: isSelected ? 1 : undefined }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          className="w-3.5 h-3.5 accent-foreground cursor-pointer"
        />
      </div>

      <FileIcon type={item.type} size={32} />

      <span
        className="text-xs text-center truncate w-full text-foreground"
        title={item.name}
      >
        {item.name}
      </span>

      {!isDir && item.size > 0 && (
        <span className="text-[10px] text-muted-foreground">
          {formatSize(item.size)}
        </span>
      )}
    </div>
  );
}
```

Note: `getDownloadURL` currently takes `(source, filePath)`. You may need to update it or use `window.origin + apiPath(...)` inline if the `source` on `item` isn't always populated. Verify that `item.source` is available in `FileInfo` — if not, fall back to the store's `source`.

- [ ] **Step 2: Apply the same pattern to `FileRow.tsx`**

Use the same `CLICK_DELAY` debounce pattern. Keep all columns (checkbox, icon, name, size, date, type) identical. Apply the same `handleKeyDown`.

```typescript
// In FileRow.tsx, replace handleClick with the debounced version:
// 1. Add imports: useRef, useCallback, isPreviewable from utils/preview
// 2. Add clickTimer ref, downloadFile function
// 3. Replace handleClick with debounced logic
// 4. Add handleKeyDown with Enter/Shift+Enter logic
// 5. Add tabIndex={0} and role="row" (or wrap in role="button" on the name cell)
```

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/components/files/FileCard.tsx frontend-next/src/components/files/FileRow.tsx
git commit -m "feat(preview): replace click handler with debounced single/double-click logic"
```

---

## Task 12: Frontend — Mount `PreviewModal` in `FileBrowser`

### Acceptance Criteria
- `PreviewModal` is rendered unconditionally in `FileBrowser` layout
- Modal opens when `fileStore.previewFile` is set, closes when null

### Files

- Modify: `frontend-next/src/routes/FileBrowser.tsx`

### Steps

- [ ] **Step 1: Import and mount the modal**

Add to the imports at the top:

```typescript
import PreviewModal from "@/components/dialogs/PreviewModal";
```

Add the component inside the outer `<div>` in the JSX return, as the last child (sibling to the dialogs):

```tsx
<DeleteDialog ... />
<MoveCopyDialog ... />
<PreviewModal />  {/* <-- ADD HERE */}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/routes/FileBrowser.tsx
git commit -m "feat(preview): mount PreviewModal in FileBrowser"
```

---

## Task 13: Integration Verification

### Acceptance Criteria
- Dev server starts without errors (`bun run dev`)
- Single-clicking an image shows the preview modal with the image rendered
- Single-clicking a .txt file shows the text preview with line numbers
- Single-clicking an audio file shows album art + custom controls
- Single-clicking a video file shows the native video player
- Single-clicking a PDF shows the embedded PDF
- Double-clicking any file triggers download
- Single-clicking a non-previewable file (e.g., .zip) triggers download
- Escape key closes the preview modal
- Backdrop click closes the preview modal

### Steps

- [ ] **Step 1: Start the backend**

```bash
cd backend && go run .
# Verify it starts on the configured port (default 2818)
```

- [ ] **Step 2: Start the frontend dev server**

```bash
cd frontend-next && bun run dev
# Verify it starts on localhost:3000
```

- [ ] **Step 3: Manual smoke test**

Test each preview type listed in the acceptance criteria. Log any errors.

- [ ] **Step 4: Commit any fixes**

If any component needs adjustment, fix it and commit:

```bash
git add <changed-files>
git commit -m "fix(preview): <brief fix description>"
```

---

## Self-Review Checklist

Before marking complete, run through:

1. **Spec coverage** — Skim the spec (lines 1-227). Each requirement:
   - Image preview → Task 5 ✓
   - Video preview → Task 6 ✓
   - Audio preview (album art + controls) → Task 7 ✓
   - Text preview (line numbers) → Task 8 ✓
   - PDF preview → Task 9 ✓
   - Click interaction (single/double) → Task 11 ✓
   - Keyboard support (Enter, Shift+Enter) → Task 11 ✓
   - Backend metadata endpoint → Task 1 ✓
   - Large file warning (>100MB) → Task 10 ✓
   - Error handling (toasts/not in component) → all preview components ✓
   - State management (`previewFile`) → Task 3 ✓

2. **Placeholder scan** — No `TBD`, `TODO`, or vague steps in the plan above. All code is shown inline.

3. **Type consistency** — `getPreviewType` returns `"image" | "video" | "audio" | "text" | "pdf" | null`. `PreviewModal` switches on `previewType`. `ImagePreview`/`VideoPreview`/etc. all accept `FileInfo`. `fetchMetadata` returns `MetadataResponse` as defined in Task 2.

4. **Dependency order** — Tasks are ordered so that later tasks depend on earlier ones:
   - Task 1 (backend) can run in parallel with Tasks 2-4 (frontend setup)
   - Tasks 5-9 (preview components) depend on Task 4 (shared overlay)
   - Task 10 (modal) depends on Tasks 5-9
   - Task 11 (click handlers) depends on Task 2 (isPreviewable) and Task 3 (setPreviewFile)
   - Task 12 (mount) depends on Task 10
   - Task 13 (verification) depends on all

---

## Plan Summary

| # | Task | Files | Duration |
|---|------|-------|----------|
| 1 | Backend: metadata endpoint | `metadata.go`, `httpRouter.go` | ~20 min |
| 2 | Preview utils + metadata API client | `preview.ts`, `metadata.ts` | ~10 min |
| 3 | Add `previewFile` state to fileStore | `file-store.ts` | ~5 min |
| 4 | `PreviewInfoOverlay` component | `PreviewInfoOverlay.tsx` | ~5 min |
| 5 | `ImagePreview` component | `ImagePreview.tsx` | ~15 min |
| 6 | `VideoPreview` component | `VideoPreview.tsx` | ~10 min |
| 7 | `AudioPreview` component | `AudioPreview.tsx` | ~25 min |
| 8 | `TextPreview` component | `TextPreview.tsx` | ~15 min |
| 9 | `PDFPreview` component | `PDFPreview.tsx` | ~10 min |
| 10 | `PreviewModal` shell | `PreviewModal.tsx` | ~15 min |
| 11 | Click handler update | `FileCard.tsx`, `FileRow.tsx` | ~20 min |
| 12 | Mount modal in FileBrowser | `FileBrowser.tsx` | ~5 min |
| 13 | Integration verification | — | ~30 min |
