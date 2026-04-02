# File Preview System

Adds single-click preview support for images, audio, video, and text files to the frontend-next file browser. Previously deferred to v2; now in scope.

## Context

The frontend-next design spec (2026-03-30) deferred file preview to v2+. This spec covers implementing preview as a v1 feature, changing one item in the original scope.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Click interaction | **A** — Single click = preview (previewable files), double click = download | Industry standard (macOS Quick Look, VS Code, Google Drive) |
| Audio preview | **A** — Album art + track name + waveform/audio controls in modal | Backend already extracts album art; adds visual polish |
| Image preview | **B** — Image + file name, dimensions, size in subtle overlay | Zero effort for useful context; zoom/pan deferred |
| Theme | **A** — Modal respects app dark/light mode automatically | Consistent with app |

## Previewable File Types

| Type | Extensions | Preview Approach |
|---|---|---|
| Image | jpg, jpeg, png, gif, webp, svg, bmp | Inline image in modal |
| Video | mp4, webm, mov, avi | Native `<video>` with controls in modal |
| Audio | mp3, flac, wav, ogg, m4a | Album art + track name + `<audio>` element in modal |
| Text | txt, md, json, xml, html, css, js, ts, log | Monospace text in modal with scrolling |
| PDF | pdf | Native `<embed>` or iframe in modal |

Non-previewable files (archives, executables, etc.) trigger a download on single click.

## Components

### PreviewModal (`components/dialogs/PreviewModal.tsx`)

A single dialog shell that renders different content based on file type. All variants share the same outer frame: dark backdrop, centered modal, close button, file name in header.

**Props:**
```typescript
interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
}
```

**States:**
- `loading` — Spinner while fetch resolves
- `error` — Error message if file can't be loaded (network, CORS, unsupported format)
- `content` — The type-specific preview

**Behavior:**
- On open, fetch file contents via `GET /api/resources/download?path=<path>&source=<source>` with `Authorization` header
- Image/audio/video served as `Content-Type: <mime>` blobs; set as src/href accordingly
- Text files served as `text/plain`; display raw content in `<pre>`
- Close on backdrop click, Escape key, or close button

### ImagePreview

Renders `<img src={blobUrl} />` with the following:

- Image centered in modal, max 90vw × 80vh, object-fit contain
- Overlay footer: file name, dimensions (W×H), file size — positioned at bottom of modal, semi-transparent dark background
- No zoom/pan in v1

### VideoPreview

Renders `<video controls src={blobUrl} />`:

- Video centered, max 90vw × 80vh
- Native controls: play/pause, seek, volume, fullscreen
- File name in header

### AudioPreview

Layout: album art (left) + track info + controls (right):

```
┌────────────────────────────────────────────┐
│ [Album Art 120×120]  Track Title           │
│                      Artist Name           │
│                      ──●─────────  3:45    │
│                      [⏮] [⏯] [⏭] [🔊]      │
└────────────────────────────────────────────┘
```

- Album art: 120×120px, rounded corners, sourced from the file itself (audio files contain embedded art; the backend returns this as a separate field)
- Track info: file name as track title, source as subtitle
- Progress bar: custom-styled `<input type="range">` synced to `<audio>` currentTime/duration
- Controls: play/pause, seek ±10s buttons, volume slider
- File name in header

Backend note: The Go backend needs a new endpoint `GET /api/resources/metadata?path=<path>` that returns album art (as base64 or separate URL), duration, and other audio metadata. If the backend doesn't extract album art, fall back to a generic music note icon.

### TextPreview

Renders `<pre>` with monospace font:

- Max 90vw × 80vh, scrollable
- Dark background, syntax-highlighted (basic — just a different text color for known extensions like `.ts`, `.js`, `.json`)
- Line numbers on the left
- File name in header

### PDFPreview

Renders `<iframe src={blobUrl} />` or `<embed>`:

- PDF rendered inline, max 90vw × 80vh
- File name in header
- Browser's native PDF controls (zoom, page nav)

## Click Interaction

Override the current single-click behavior in `FileCard` and `FileRow`:

```typescript
const CLICK_DELAY = 250; // ms — if second click arrives within this window, it's a double click

let clickTimer: ReturnType<typeof setTimeout> | null = null;

function handleClick() {
  if (clickTimer) {
    // Double click — download
    clearTimeout(clickTimer);
    clickTimer = null;
    downloadFile(file);
  } else {
    // Potential single click — wait to see if double click follows
    clickTimer = setTimeout(() => {
      clickTimer = null;
      if (isPreviewable(file)) {
        openPreview(file);
      } else {
        downloadFile(file);
      }
    }, CLICK_DELAY);
  }
}
```

For list view, apply the same logic to `FileRow`.

For non-previewable files, single click = download immediately (no delay).

### Keyboard Support

- `Enter` on a focused file = single-click action (preview or download)
- `Shift+Enter` = force download
- `Space` = preview (if previewable, focused file)

## API Changes

### New: `GET /api/resources/metadata`

Returns metadata for a file, used to populate audio album art and other previews.

**Request:**
```
GET /api/resources/metadata?path=<url-encoded-path>&source=<source>
Authorization: Bearer <token>
```

**Response:**
```json
{
  "name": "song.mp3",
  "size": 3456789,
  "modified": "2024-01-15T10:30:00Z",
  "type": "audio",
  "metadata": {
    "duration": 214.5,
    "albumArt": "data:image/jpeg;base64,...",
    "title": "Track Title",
    "artist": "Artist Name"
  }
}
```

For images, `metadata` includes `width`, `height`.

The backend implements this by reading embedded metadata (audio ID3 tags, image EXIF). If no metadata is found, `metadata` is null.

### Existing: `GET /api/resources/download`

Already exists. Used as-is for fetching file blob data. No changes needed.

## State

No new Zustand stores. `PreviewModal` is controlled by `fileStore.previewFile` and `fileStore.setPreviewFile`.

```typescript
// In fileStore
previewFile: FileItem | null;
setPreviewFile: (file: FileItem | null) => void;
```

`previewFile === null` means modal is closed.

## Component Inventory

| Component | File | Notes |
|---|---|---|
| `PreviewModal` | `dialogs/PreviewModal.tsx` | Dialog shell, routes to content type |
| `ImagePreview` | `dialogs/preview/ImagePreview.tsx` | Image + info overlay |
| `VideoPreview` | `dialogs/preview/VideoPreview.tsx` | Native video element |
| `AudioPreview` | `dialogs/preview/AudioPreview.tsx` | Album art + custom controls |
| `TextPreview` | `dialogs/preview/TextPreview.tsx` | Monospace text + line numbers |
| `PDFPreview` | `dialogs/preview/PDFPreview.tsx` | Embedded PDF |
| `PreviewInfoOverlay` | `dialogs/preview/PreviewInfoOverlay.tsx` | Shared: file name, size, type info |

## Error Handling

| Scenario | Behavior |
|---|---|
| File not found | Toast: "File not found" |
| Unsupported type | Toast: "Cannot preview this file type" |
| Network error | Toast: "Could not load preview" |
| CORS/blocked | Toast: "Preview blocked — try downloading" |
| Large file (>100MB) | Prompt: "File is large. Download instead?" with Yes/Download buttons |

## Testing

- Manual: open various file types (image, audio, video, text, PDF) and verify preview renders
- Audio preview with real MP3s with and without embedded album art
- Double-click download works on all file types
- Single click on non-previewable files downloads immediately
- Escape key closes modal
- Theme switching (dark/light) reflects in modal
