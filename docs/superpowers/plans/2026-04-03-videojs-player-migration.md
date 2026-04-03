# Video.js Player Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace native `<video>` and `<audio>` elements in VideoPreview and AudioPreview with `@videojs/react` components, keeping the existing blob URL loading and error handling logic intact.

**Architecture:** Create factory files in `components/player/` that export pre-configured Video.js players. VideoPreview gets a full Video.js skin; AudioPreview keeps its custom album art layout but delegates playback to a Video.js Audio player with an invisible container.

**Tech Stack:** `@videojs/react@10.0.0-beta.14`, React 19, TypeScript, Vite

---

## File Structure

| File | Responsibility |
|------|---------------|
| `components/player/createVideoPlayer.ts` | Exports `VideoPlayer` component using `createPlayer({ features: videoFeatures })` |
| `components/player/createAudioPlayer.ts` | Exports `AudioPlayer` component using `createPlayer({ features: audioFeatures })` |
| `components/dialogs/preview/VideoPreview.tsx` | Blob URL fetch → renders `VideoPlayer` with `blobUrl` |
| `components/dialogs/preview/AudioPreview.tsx` | Blob URL fetch + metadata extraction → keeps album art layout, renders `AudioPlayer` controls |

---

## Task 1: Create Video.js Video Player Factory

**Files:**
- Create: `frontend/src/components/player/createVideoPlayer.ts`

- [ ] **Step 1: Create the file**

```typescript
import '@videojs/react/video/skin.css';
import { createPlayer, videoFeatures } from '@videojs/react';
import { VideoSkin, Video } from '@videojs/react/video';

const VideoPlayer = createPlayer({ features: videoFeatures });

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function VideoPlayerComponent({ src, className }: VideoPlayerProps) {
  return (
    <VideoPlayer.Provider>
      <VideoSkin className={className}>
        <Video src={src} playsInline />
      </VideoSkin>
    </VideoPlayer.Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/player/createVideoPlayer.ts
git commit -m "feat(player): create Video.js video player factory"
```

---

## Task 2: Create Video.js Audio Player Factory

**Files:**
- Create: `frontend/src/components/player/createAudioPlayer.ts`

- [ ] **Step 1: Create the file**

```typescript
import '@videojs/react/audio/skin.css';
import { createPlayer, audioFeatures } from '@videojs/react';
import { AudioSkin, Audio } from '@videojs/react/audio';

const AudioPlayer = createPlayer({ features: audioFeatures });

interface AudioPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function AudioPlayerComponent({ src, poster, className }: AudioPlayerProps) {
  return (
    <AudioPlayer.Provider>
      <AudioSkin className={className}>
        <Audio src={src} poster={poster} preload="metadata" />
      </AudioSkin>
    </AudioPlayer.Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/player/createAudioPlayer.ts
git commit -m "feat(player): create Video.js audio player factory"
```

---

## Task 3: Migrate VideoPreview to Video.js

**Files:**
- Modify: `frontend/src/components/dialogs/preview/VideoPreview.tsx` (lines 1-77)

- [ ] **Step 1: Replace the component body**

Replace the entire file contents with:

```tsx
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
```

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dialogs/preview/VideoPreview.tsx
git commit -m "feat(preview): migrate VideoPreview to Video.js"
```

---

## Task 4: Migrate AudioPreview to Video.js (Hybrid Layout)

**Files:**
- Modify: `frontend/src/components/dialogs/preview/AudioPreview.tsx` (lines 1-235)

- [ ] **Step 1: Replace the component body**

Replace the entire file contents with:

```tsx
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
          <AudioPlayer src={blobUrl} poster={albumArt ?? undefined} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dialogs/preview/AudioPreview.tsx
git commit -m "feat(preview): migrate AudioPreview to Video.js (hybrid layout)"
```

---

## Verification

After all tasks complete:

1. **Start the dev server:** `cd frontend && npm run dev`
2. **Navigate to a video file** in the file browser → click to preview → verify Video.js player loads with controls
3. **Navigate to an audio file** → click to preview → verify album art + track title are shown with Video.js audio controls
4. **Test playback:** play/pause, seek, volume on both players
5. **Test HLS** (if any `.m3u8` files exist) — Video.js HLS support should work automatically
6. **Run typecheck:** `cd frontend && npm run typecheck` → expected: PASS
7. **Run lint:** `cd frontend && npm run lint` → expected: PASS

---

## Self-Review Checklist

1. **Spec coverage:** Both VideoPreview and AudioPreview migrated. Album art layout preserved in AudioPreview. Blob URL lifecycle (create on mount, revoke on unmount) preserved.
2. **Placeholder scan:** No "TBD", "TODO", or vague instructions in the plan.
3. **Type consistency:** `VideoPlayerProps.src` matches `VideoPreview`'s `blobUrl` state. `AudioPlayerProps.src` + `poster` match `AudioPreview`'s `blobUrl` + `albumArt` state.
4. **CSS imports verified:** `@videojs/react/video/skin.css` and `@videojs/react/audio/skin.css` are in the correct import paths (confirmed via package exports map).
5. **Removed unused imports:** `Loader2`, `SkipBack`, `SkipForward`, `Play`, `Pause`, `Volume2` from AudioPreview — no longer needed since Video.js handles controls.
