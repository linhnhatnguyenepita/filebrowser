# Share Viewer Design

**Date:** 2026-04-03
**Status:** Draft
**Approach:** Standalone public page (Option A)

---

## 1. Overview

Build a public-facing Share Viewer page at `/public/share/:hash/*` that lets anyone with a share link view and download shared files without logging in. The page is a standalone React route, not wrapped in authentication. It supports full subfolder navigation via URL paths and applies share-level branding (banner, title, theme).

---

## 2. Route Architecture

**Route:** `GET /public/share/:hash/*`

**Frontend route:** `src/routes/ShareViewer.tsx` mounted in `App.tsx` as a public route (no `AuthGuard` wrapper).

**Nginx:** No changes — `/public/*` routes to backend, `/*` routes to frontend SPA. React Router handles `/public/share/*` client-side.

**URL structure:**

| URL | Meaning |
|-----|---------|
| `/public/share/{hash}` | Root of the share |
| `/public/share/{hash}/folder1` | Subfolder inside the share |
| `/public/share/{hash}/folder1/nested` | Nested subfolder |

The wildcard `*` after `:hash` captures the remaining path. The component parses the path from `useParams()` and the URL search params to call the backend API.

---

## 3. API Layer

All API calls use plain `fetch` (not `apiFetch`) to avoid attaching the auth header. They call the backend directly.

### 3.1 Get Share Info

```
GET /public/api/share/info?hash={hash}
```

Returns a `CommonShare` object (see Backend Contract section). Used to fetch share metadata (title, banner, theme, permissions) before loading file content.

### 3.2 Get Share Items (file listing)

Two endpoints are available for listing files in a share. Use `/resources/items` for lightweight directory listing, and `/resources` when full file metadata is needed.

**Lightweight listing:**
```
GET /public/api/resources/items?hash={hash}&path={path}
```

**Full metadata listing:**
```
GET /public/api/resources?hash={hash}&path={path}
```

Query params (both endpoints):
- `hash` — required, the share hash
- `path` — optional, URL-encoded path inside the share (e.g. `/folder1/nested`). Defaults to `/` (root)

The backend's `withHashFileHelper` middleware handles the `path` parameter by resolving it relative to the share's root path, so `path=/folder1` inside a share rooted at `/photos` becomes `/photos/folder1` internally.

### 3.3 File Download

```
GET /public/api/resources/download?hash={hash}&path={path}
```

Downloads a single file from the share. Used by the Quick Download button and by the file download flow.

---

## 4. TypeScript Types

### 4.1 ShareInfo

Mirrors the backend's `CommonShare` struct. Defined in `src/lib/types/share-viewer.ts`:

```typescript
export interface ShareSidebarLink {
  name: string;
  category: string;
  target: string;
  icon: string;
  sourceName?: string;
}

export interface ShareInfo {
  downloadsLimit: number;
  shareTheme: string;
  disableAnonymous: boolean;
  maxBandwidth: number;
  disableThumbnails: boolean;
  keepAfterExpiration: boolean;
  allowedUsernames: string[];
  themeColor: string;
  banner: string;
  title: string;
  description: string;
  favicon: string;
  quickDownload: boolean;
  hideNavButtons: boolean;
  disableSidebar: boolean;
  source: string;
  path: string;
  downloadURL: string;
  shareURL: string;
  faviconUrl: string;
  bannerUrl: string;
  disableShareCard: boolean;
  enforceDarkLightMode: string; // "dark" | "light" | ""
  viewMode: string; // "list" | "compact" | "normal" | "gallery"
  enableOnlyOffice: boolean;
  shareType: string; // "normal" | "upload" | "max"
  perUserDownloadLimit: boolean;
  extractEmbeddedSubtitles: boolean;
  allowDelete: boolean;
  allowCreate: boolean;
  allowModify: boolean;
  disableFileViewer: boolean;
  disableDownload: boolean;
  allowReplacements: boolean;
  sidebarLinks: ShareSidebarLink[];
  hasPassword: boolean;
  showHidden: boolean;
  disableLoginOption: boolean;
  sourceURL: string;
  canEditShare: boolean;
}
```

### 4.2 FileInfo

Reuse the existing `FileInfo` type from `src/lib/api/resources.ts`. No changes needed.

---

## 5. Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Banner image — 100% width, 200px max-height, object-cover]
│  (hidden if shareInfo.bannerUrl is empty)               │
├─────────────────────────────────────────────────────────┤
│  Title (h1)                         [Quick Download]   │
│  Description                                           │
│  [sourceLocation sidebar link]                         │
├─────────────────────────────────────────────────────────┤
│  [Breadcrumb: Share Name > Folder1 > Folder2]          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [File Grid / List]                                     │
│  (view mode from shareInfo.viewMode)                    │
│  - folder clicks → navigate to /public/share/{hash}/... │
│  - file clicks → preview dialog or download              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Footer: "Shared via FileBrowser" + link to origin      │
└─────────────────────────────────────────────────────────┘
```

**Sidebar:** Always hidden on the Share Viewer page. The `disableSidebar` share setting is respected (already the default — no sidebar rendered).

**Header block:** Share title (h1, 1.5rem, font-semibold), description (text-muted-foreground, 0.875rem), sourceLocation link (if set), Quick Download button (if applicable).

**Breadcrumb:** Clickable segments. The root segment ("Share Name") links to `shareInfo.shareURL`. Interior segments link to their respective paths. Non-link segment for current location. Uses chevron icons between segments.

**File display:** Uses the existing `FileGrid` and `FileList` components. The view mode comes from `shareInfo.viewMode`. File clicks navigate within the share (folder) or open preview/download (file). The `FileContextMenu` is used to wrap each file item for context menu support.

**Footer:** Minimal, single line of muted text. Links back to the file browser origin (extracted from `shareInfo.sourceURL`).

---

## 6. Theme Application

Before rendering the Share Viewer, apply share-level theme overrides from `shareInfo`:

1. **Custom theme** (`shareInfo.shareTheme`): If set, load that theme's CSS variables from the themes configuration. Apply them to `document.documentElement` by setting CSS custom properties.

2. **Enforced dark/light mode** (`shareInfo.enforceDarkLightMode`):
   - `"dark"` → add `class="dark"` to `<html>`
   - `"light"` → remove `class="dark"` from `<html>`
   - `""` → no change (use default/cookie preference)

These overrides are applied before paint to avoid flash of wrong theme. This is done in `main.tsx` after fetching share info, or via a blocking `useEffect` at the root of the ShareViewer component.

---

## 7. Error States

| HTTP Status | Meaning | UI |
|-------------|---------|----|
| 404 | Share hash not found | Full-page error: "This share link does not exist or has been removed." + link to FileBrowser home |
| 403 | Share expired | Full-page error: "This share link has expired." |
| 403 | Path does not exist inside share | Empty directory message: "This folder does not exist." |
| 401 | Password required (future) | Show placeholder: "This share is password protected." |
| Network error | Connection failure | Full-page error: "Could not load share. Please check your connection." |
| Loading | Initial load | Centered spinner (`animate-spin`) |
| Empty folder | No files | Centered muted text: "This folder is empty." |

Error pages use a centered layout matching the Login page style: icon + title + description + optional action button.

---

## 8. Component Inventory

### 8.1 New Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `ShareViewer` | `src/routes/ShareViewer.tsx` | Main page. Fetches share info, manages path state, renders layout. |
| `ShareHeader` | `src/components/shares/ShareHeader.tsx` | Banner image, title, description, sourceLocation link, Quick Download button. |
| `ShareBreadcrumb` | `src/components/shares/ShareBreadcrumb.tsx` | Breadcrumb navigation for share paths. |
| `ShareFooter` | `src/components/shares/ShareFooter.tsx` | Minimal footer with origin link. |
| `ShareError` | `src/components/shares/ShareError.tsx` | Full-page error display for 404, 403, network errors. |
| `ShareInfoLoader` | `src/components/shares/ShareInfoLoader.tsx` | Component that fetches share info and applies theme before rendering children. |

### 8.2 Reused Components

| Component | Usage in ShareViewer |
|-----------|---------------------|
| `FileGrid` | Display shared files in grid view |
| `FileList` | Display shared files in list view |
| `FileContextMenu` | Wraps each file item for context menu |
| `FileRow` | Single row in list view |
| `FileCard` | Single card in grid view |

### 8.3 Reused Utilities

| Utility | File | Usage |
|---------|------|-------|
| `formatBytes` | `src/lib/utils.ts` | Format file sizes |
| `getFileIcon` | existing utils | File type icons |
| `getPreviewType` | existing utils | Determine preview capability |

---

## 9. File Structure

```
frontend/src/
├── lib/
│   ├── api/
│   │   └── share-viewer.ts        # NEW — API calls for share viewer
│   └── types/
│       └── share-viewer.ts        # NEW — ShareInfo TypeScript type
├── routes/
│   └── ShareViewer.tsx           # NEW — main page component
└── components/
    └── shares/
        ├── ShareHeader.tsx       # NEW
        ├── ShareBreadcrumb.tsx   # NEW
        ├── ShareFooter.tsx       # NEW
        ├── ShareError.tsx        # NEW
        └── ShareInfoLoader.tsx   # NEW
```

**Modified files:**

| File | Change |
|------|--------|
| `src/App.tsx` | Add `<Route path="/public/share/:hash/*" element={<ShareViewer />} />` |
| `src/main.tsx` | Optional: apply share theme before render (can also be done in component) |
| `src/styles/globals.css` | Add `.share-viewer` scoped overrides if needed |

---

## 10. Backend Contract

### 10.1 `GET /public/api/share/info?hash={hash}`

**Response:** `CommonShare` JSON

Key fields used by the frontend:

| Field | Type | Usage |
|-------|------|-------|
| `title` | string | Page title, shown in ShareHeader |
| `description` | string | Shown in ShareHeader below title |
| `bannerUrl` | string | Banner image URL, full-width above content |
| `faviconUrl` | string | Set as `document favicon` via `<link>` |
| `shareURL` | string | Base URL for share, used in breadcrumb root |
| `sourceURL` | string | Link to source location, shown in footer |
| `sourceLocation` | string | Display name for source in header |
| `viewMode` | string | Default view mode: "list", "compact", "normal", "gallery" |
| `shareTheme` | string | Custom theme name to load |
| `enforceDarkLightMode` | string | "dark" or "light" to force mode |
| `quickDownload` | bool | Show quick download button for single files |
| `hasPassword` | bool | True if share requires password (not supported in v1) |
| `sidebarLinks` | []SidebarLink | Custom links to display in header area |
| `canEditShare` | bool | Whether the current user can edit share settings |

### 10.2 `GET /public/api/resources/items?hash={hash}&path={path}` and `GET /public/api/resources?hash={hash}&path={path}`

Both endpoints support `path` for subfolder navigation. Use `/resources/items` for lightweight listing and `/resources` for full metadata.

**Query params:**
- `hash` — share hash
- `path` — URL-encoded path inside share (e.g. `%2Ffolder1%2Fnested`)

**`/resources/items` Response:** Lightweight flat list

```typescript
interface ItemsResponse {
  items: FileInfo[];
  // ... other fields from the existing API
}
```

**`/resources` Response:** Full `FileInfo` metadata including children list if path is a directory.

### 10.3 `GET /public/api/resources/download?hash={hash}&path={path}`

Downloads a file. Backend sets appropriate `Content-Disposition` header for browser download.

---

## 11. Navigation & URL Behavior

1. **Initial load:** Parse `hash` from route params and `path` from the wildcard route (`*`). Default path to `/`.
2. **Folder click:** Use `navigate()` to push a new URL with the subfolder appended. This triggers a re-fetch of items.
3. **Breadcrumb click:** Same as folder click — navigate to the segment's path.
4. **Root breadcrumb click:** Navigate to `/public/share/{hash}` (no path suffix).
5. **Browser back/forward:** React Router handles this automatically — path changes re-trigger the fetch.

**URL encoding:** Path segments are stored as-is in the URL. Spaces and special characters are encoded by React Router. When sending to the API, the full path is URL-encoded as a single query parameter value.

---

## 12. Performance Considerations

- Banner image loaded with `loading="lazy"` and explicit dimensions to prevent layout shift
- File listing loaded after share info (share info is smaller, faster). Show skeleton/spinner for file area during load.
- No server-side rendering needed — this is a SPA page
- Themes loaded from existing themes config (no new theme loading mechanism needed in v1)

---

## 13. Security

- Share Viewer makes unauthenticated API calls. Backend correctly returns minimal data (no full paths, no source tokens) from the public share info endpoint.
- File download URLs include the share hash and path but do not expose the user's auth token.
- No user data is exposed in the public page.

---

## 14. Out of Scope (Future Work)

- Password-protected shares (share type 4C)
- Upload shares (share type B)
- OnlyOffice document editing in share
- Custom sidebar links rendering
- Download counting and limits display
- Share edit UI (for `canEditShare` users)
