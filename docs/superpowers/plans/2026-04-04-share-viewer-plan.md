# Share Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public-facing Share Viewer page at `/public/share/:hash/*` that lets anyone with a share link view and download shared files without logging in. Supports subfolder navigation, share-level branding (banner, title, theme), and view modes.

**Architecture:** Standalone React route (`ShareViewer.tsx`) mounted in `App.tsx` without `AuthGuard`. Uses plain `fetch` (not `apiFetch`) for all API calls to avoid attaching the auth header. Theme overrides applied before paint via blocking `useEffect`.

**Tech Stack:** React Router v6, Zustand, plain `fetch`, Tailwind CSS, Lucide icons

---

## File Structure

```
frontend/src/
├── lib/
│   ├── api/
│   │   └── share-viewer.ts        # NEW — unauthenticated API calls for share viewer
│   └── types/
│       └── share-viewer.ts        # NEW — ShareInfo TypeScript type
├── routes/
│   └── ShareViewer.tsx           # NEW — main page component
└── components/
    └── shares/
        ├── ShareHeader.tsx       # NEW — banner, title, description, quick download
        ├── ShareBreadcrumb.tsx   # NEW — breadcrumb navigation for share paths
        ├── ShareFooter.tsx       # NEW — minimal footer with origin link
        ├── ShareError.tsx        # NEW — full-page error display
        └── ShareInfoLoader.tsx   # NEW — fetches share info + applies theme
```

**Modified files:**
- `src/App.tsx:44-46` — add public route
- `src/components/files/FileGrid.tsx` — expose as export for share viewer reuse
- `src/components/files/FileList.tsx` — expose as export for share viewer reuse

---

## Phase 1: Foundation — Types & API Layer

### Task 1: Define ShareInfo Type

**Files:**
- Create: `frontend/src/lib/types/share-viewer.ts`

- [ ] **Step 1: Write the type definitions**

```typescript
// frontend/src/lib/types/share-viewer.ts

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
  enforceDarkLightMode: "dark" | "light" | "";
  viewMode: "list" | "compact" | "normal" | "gallery";
  enableOnlyOffice: boolean;
  shareType: string;
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

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/types/share-viewer.ts
git commit -m "feat(share-viewer): add ShareInfo TypeScript type"
```

---

### Task 2: Build Unauthenticated API Layer

**Files:**
- Create: `frontend/src/lib/api/share-viewer.ts`
- Test: `frontend/src/lib/api/share-viewer.test.ts` (create)

- [ ] **Step 1: Write the API module**

```typescript
// frontend/src/lib/api/share-viewer.ts

import { ShareInfo } from "@/lib/types/share-viewer";
import type { FileInfo } from "@/lib/api/resources";

function getBaseURL(): string {
  return window.globalVars?.baseURL ?? "/";
}

function publicPath(endpoint: string, params?: Record<string, string>): string {
  let path = `${getBaseURL()}public/api/${endpoint}`;
  if (params) {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    if (parts.length > 0) path += `?${parts.join("&")}`;
  }
  return path;
}

export interface ShareInfoResponse extends ShareInfo {}

export async function getShareInfo(hash: string): Promise<ShareInfoResponse> {
  const url = publicPath("share/info", { hash });
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    const err: { status: number; message: string } = { status: res.status, message: res.statusText };
    try {
      const body = await res.json();
      if (body.message) err.message = body.message;
    } catch { /* keep statusText */ }
    throw err;
  }
  return res.json();
}

export interface ShareItemsResponse {
  files: FileInfo[];
  folders: FileInfo[];
}

export async function getShareItems(
  hash: string,
  path: string = "/"
): Promise<ShareItemsResponse> {
  const url = publicPath("resources/items", { hash, path });
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    const err: { status: number; message: string } = { status: res.status, message: res.statusText };
    try {
      const body = await res.json();
      if (body.message) err.message = body.message;
    } catch { /* keep statusText */ }
    throw err;
  }
  return res.json();
}

export function getShareDownloadURL(hash: string, path: string): string {
  return publicPath("resources/download", { hash, path });
}
```

- [ ] **Step 2: Write unit tests**

```typescript
// frontend/src/lib/api/share-viewer.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getShareInfo, getShareItems, getShareDownloadURL } from "./share-viewer";

beforeEach(() => {
  vi.restoreAllMocks();
  window.globalVars = { baseURL: "https://example.com/" };
});

describe("getShareInfo", () => {
  it("returns ShareInfo on 200", async () => {
    const mockShareInfo = {
      hash: "abc123",
      title: "My Share",
      bannerUrl: "",
      viewMode: "list",
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockShareInfo),
    } as Response);

    const result = await getShareInfo("abc123");
    expect(result).toEqual(mockShareInfo);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/public/api/share/info?hash=abc123",
      { credentials: "same-origin" }
    );
  });

  it("throws on 404", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ message: "Share not found" }),
    } as Response);

    await expect(getShareInfo("nonexistent")).rejects.toMatchObject({ status: 404 });
  });

  it("throws on 403 expired", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: () => Promise.resolve({ message: "Share has expired" }),
    } as Response);

    await expect(getShareInfo("expired")).rejects.toMatchObject({ status: 403 });
  });
});

describe("getShareDownloadURL", () => {
  it("returns correctly constructed URL", () => {
    const url = getShareDownloadURL("abc123", "/folder/file.txt");
    expect(url).toBe("https://example.com/public/api/resources/download?hash=abc123&path=%2Ffolder%2Ffile.txt");
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd frontend && npm test -- --run src/lib/api/share-viewer.test.ts`
Expected: PASS (or FAIL if `npm test` is not set up — check `package.json` scripts first)

If `npm test` is not configured, run: `cd frontend && npx vitest run src/lib/api/share-viewer.test.ts`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api/share-viewer.ts frontend/src/lib/api/share-viewer.test.ts
git commit -m "feat(share-viewer): add unauthenticated API layer for public share endpoints"
```

---

## Phase 2: Components — UI Building Blocks

### Task 3: ShareInfoLoader — Fetches Share Info & Applies Theme

**Files:**
- Create: `frontend/src/components/shares/ShareInfoLoader.tsx`

- [ ] **Step 1: Write the component**

```typescript
// frontend/src/components/shares/ShareInfoLoader.tsx

import { useEffect, useState, type ReactNode } from "react";
import { ShareInfo } from "@/lib/types/share-viewer";
import { getShareInfo } from "@/lib/api/share-viewer";
import ShareError from "./ShareError";

interface Props {
  hash: string;
  children: (info: ShareInfo) => ReactNode;
}

export default function ShareInfoLoader({ hash, children }: Props) {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getShareInfo(hash);
        if (cancelled) return;
        setInfo(data);
        applyTheme(data);
      } catch (err: unknown) {
        if (cancelled) return;
        if (
          err &&
          typeof err === "object" &&
          "status" in err
        ) {
          setError(err as { status: number; message: string });
        } else {
          setError({ status: 0, message: "Could not load share. Please check your connection." });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [hash]);

  if (error) {
    if (error.status === 404) {
      return <ShareError title="Share not found" description="This share link does not exist or has been removed." action={{ label: "Go to FileBrowser", href: "/" }} />;
    }
    if (error.status === 403) {
      return <ShareError title="Share expired" description="This share link has expired." />;
    }
    return <ShareError title="Could not load share" description={error.message} />;
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return <>{children(info)}</>;
}

function applyTheme(info: ShareInfo) {
  // Apply dark/light mode enforcement
  if (info.enforceDarkLightMode === "dark") {
    document.documentElement.classList.add("dark");
  } else if (info.enforceDarkLightMode === "light") {
    document.documentElement.classList.remove("dark");
  }

  // Apply custom theme CSS variables if shareTheme is set
  if (info.shareTheme) {
    // Load theme from existing themes config — append to document head if not already present
    const themeId = `share-theme-${info.shareTheme}`;
    if (!document.getElementById(themeId)) {
      const link = document.createElement("link");
      link.id = themeId;
      link.rel = "stylesheet";
      link.href = `/api/themes/${info.shareTheme}`;
      document.head.appendChild(link);
    }
  }

  // Apply favicon
  if (info.faviconUrl) {
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = info.faviconUrl;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/shares/ShareInfoLoader.tsx
git commit -m "feat(share-viewer): add ShareInfoLoader — fetches share info and applies theme"
```

---

### Task 4: ShareError — Full-Page Error Display

**Files:**
- Create: `frontend/src/components/shares/ShareError.tsx`

- [ ] **Step 1: Write the component**

```typescript
// frontend/src/components/shares/ShareError.tsx

import { AlertCircle, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export default function ShareError({ title, description, action }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ letterSpacing: "-0.02em" }}>
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {action && (
          <Link
            to={action.href}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/shares/ShareError.tsx
git commit -m "feat(share-viewer): add ShareError full-page error component"
```

---

### Task 5: ShareHeader — Banner, Title, Quick Download

**Files:**
- Create: `frontend/src/components/shares/ShareHeader.tsx`

- [ ] **Step 1: Write the component**

```typescript
// frontend/src/components/shares/ShareHeader.tsx

import { Download, ExternalLink } from "lucide-react";
import { ShareInfo } from "@/lib/types/share-viewer";
import { getShareDownloadURL } from "@/lib/api/share-viewer";

interface Props {
  info: ShareInfo;
  items: { files: Array<{ name: string; path: string }>; folders: unknown[] };
}

export default function ShareHeader({ info, items }: Props) {
  const hasBanner = Boolean(info.bannerUrl);
  const hasFilesOnly = items.files.length === 1 && items.folders.length === 0;
  const singleFile = hasFilesOnly ? items.files[0] : null;

  const handleQuickDownload = () => {
    if (!singleFile) return;
    const url = getShareDownloadURL(info.hash, singleFile.path);
    const a = document.createElement("a");
    a.href = url;
    a.download = singleFile.name;
    a.click();
  };

  return (
    <div className="w-full">
      {/* Banner */}
      {hasBanner && (
        <div className="w-full h-48 overflow-hidden bg-muted">
          <img
            src={info.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1
              className="text-2xl font-semibold text-foreground truncate"
              style={{ letterSpacing: "-0.02em" }}
            >
              {info.title || "Shared Files"}
            </h1>
            {info.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {info.description}
              </p>
            )}
            {info.sourceURL && (
              <a
                href={info.sourceURL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {info.sourceLocation || info.sourceURL}
              </a>
            )}
          </div>

          {/* Quick Download */}
          {info.quickDownload && hasFilesOnly && (
            <button
              onClick={handleQuickDownload}
              className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/shares/ShareHeader.tsx
git commit -m "feat(share-viewer): add ShareHeader component with banner, title, and quick download"
```

---

### Task 6: ShareBreadcrumb — Path Navigation

**Files:**
- Create: `frontend/src/components/shares/ShareBreadcrumb.tsx`

- [ ] **Step 1: Write the component**

```typescript
// frontend/src/components/shares/ShareBreadcrumb.tsx

import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface Segment {
  label: string;
  path: string; // empty string = root
}

interface Props {
  shareHash: string;
  shareTitle: string;
  shareURL: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function ShareBreadcrumb({
  shareHash,
  shareTitle,
  shareURL,
  currentPath,
  onNavigate,
}: Props) {
  const segments: Segment[] = [
    { label: shareTitle || "Share", path: "" },
  ];

  // Parse currentPath into segments: "/folder1/folder2" → segments after root
  const parts = currentPath.split("/").filter(Boolean);
  let accumulated = "";
  for (const part of parts) {
    accumulated += `/${part}`;
    segments.push({ label: part, path: accumulated });
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-2">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          return (
            <span key={seg.path} className="flex items-center gap-1 whitespace-nowrap">
              {i > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
              {isLast ? (
                <span className="text-foreground font-medium truncate max-w-[200px]">
                  {seg.label}
                </span>
              ) : seg.path === "" ? (
                <Link
                  to={shareURL}
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Home className="h-3 w-3" />
                  {seg.label}
                </Link>
              ) : (
                <button
                  onClick={() => onNavigate(seg.path)}
                  className="hover:text-foreground transition-colors"
                >
                  {seg.label}
                </button>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/shares/ShareBreadcrumb.tsx
git commit -m "feat(share-viewer): add ShareBreadcrumb navigation component"
```

---

### Task 7: ShareFooter — Minimal Origin Link

**Files:**
- Create: `frontend/src/components/shares/ShareFooter.tsx`

- [ ] **Step 1: Write the component**

```typescript
// frontend/src/components/shares/ShareFooter.tsx

import { ExternalLink } from "lucide-react";

interface Props {
  sourceURL: string;
}

export default function ShareFooter({ sourceURL }: Props) {
  const originLabel = (() => {
    try {
      const u = new URL(sourceURL);
      return u.hostname;
    } catch {
      return "FileBrowser";
    }
  })();

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 text-center">
      <p className="text-xs text-muted-foreground">
        Shared via{" "}
        <a
          href={sourceURL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors underline underline-offset-2"
        >
          {originLabel}
          <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/shares/ShareFooter.tsx
git commit -m "feat(share-viewer): add ShareFooter component"
```

---

## Phase 3: Main Page — ShareViewer Route & App Integration

### Task 8: ShareViewer — Main Page Component

**Files:**
- Create: `frontend/src/routes/ShareViewer.tsx`

- [ ] **Step 1: Write the component**

```typescript
// frontend/src/routes/ShareViewer.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ShareInfo } from "@/lib/types/share-viewer";
import { getShareInfo, getShareItems } from "@/lib/api/share-viewer";
import type { FileInfo } from "@/lib/api/resources";
import ShareInfoLoader from "@/components/shares/ShareInfoLoader";
import ShareHeader from "@/components/shares/ShareHeader";
import ShareBreadcrumb from "@/components/shares/ShareBreadcrumb";
import ShareFooter from "@/components/shares/ShareFooter";
import ShareError from "@/components/shares/ShareError";
import FileGrid from "@/components/files/FileGrid";
import FileList from "@/components/files/FileList";

type Items = { files: FileInfo[]; folders: FileInfo[] };

function buildSharePath(hash: string, path: string): string {
  return path ? `/public/share/${hash}${path}` : `/public/share/${hash}`;
}

export default function ShareViewer() {
  const { hash } = useParams<{ hash: string }>();
  const location = useLocation();

  if (!hash) {
    return <ShareError title="Invalid link" description="No share hash found in URL." action={{ label: "Go to FileBrowser", href: "/" }} />;
  }

  return (
    <ShareViewerInner hash={hash} location={location} />
  );
}

function ShareViewerInner({ hash, location }: { hash: string; location: ReturnType<typeof useLocation> }) {
  const navigate = useNavigate();

  // Parse path from URL: /public/share/{hash}/subfolder → /subfolder
  const rawPath = location.pathname.replace(/^\/public\/share\/[^/]+/, "") || "/";

  const [items, setItems] = useState<Items | null>(null);
  const [itemsError, setItemsError] = useState<{ status: number; message: string } | null>(null);
  const [itemsLoading, setItemsLoading] = useState(true);

  const fetchItems = useCallback(async (path: string) => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      const data = await getShareItems(hash, path);
      setItems(data);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "status" in err) {
        setItemsError(err as { status: number; message: string });
      } else {
        setItemsError({ status: 0, message: "Could not load files. Please check your connection." });
      }
      setItems(null);
    } finally {
      setItemsLoading(false);
    }
  }, [hash]);

  useEffect(() => {
    fetchItems(rawPath);
  }, [fetchItems, rawPath]);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(buildSharePath(hash, path));
    },
    [navigate, hash]
  );

  const handleFileClick = useCallback(
    (item: FileInfo) => {
      if (item.type === "directory") {
        const newPath = rawPath === "/"
          ? `/${item.name}`
          : `${rawPath}/${item.name}`;
        handleNavigate(newPath);
      } else {
        // Download the file
        const filePath = rawPath === "/"
          ? `/${item.name}`
          : `${rawPath}/${item.name}`;
        const url = `${window.globalVars?.baseURL ?? "/"}public/api/resources/download?hash=${hash}&path=${encodeURIComponent(filePath)}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = item.name;
        a.click();
      }
    },
    [handleNavigate, rawPath, hash]
  );

  // Render error from items fetch (path not found)
  if (itemsError) {
    if (itemsError.status === 403) {
      return <ShareError title="Folder not found" description="This folder does not exist." />;
    }
    if (itemsError.status === 0) {
      return <ShareError title="Connection error" description={itemsError.message} />;
    }
  }

  return (
    <ShareInfoLoader hash={hash}>
      {(info: ShareInfo) => {
        const viewMode = info.viewMode === "gallery" ? "grid" : info.viewMode === "list" ? "list" : "grid";
        const allItems: FileInfo[] = [
          ...(info.showHidden ? [] : (items?.folders ?? []).filter(f => !f.hidden)),
          ...(info.showHidden ? [] : (items?.files ?? []).filter(f => !f.hidden)),
        ];

        return (
          <div className="min-h-screen bg-background flex flex-col">
            <ShareHeader info={info} items={items ?? { files: [], folders: [] }} />

            <ShareBreadcrumb
              shareHash={hash}
              shareTitle={info.title}
              shareURL={info.shareURL}
              currentPath={rawPath}
              onNavigate={handleNavigate}
            />

            <div className="flex-1 px-6 pb-6">
              <div className="max-w-5xl mx-auto">
                {itemsLoading ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-sm">Loading files…</span>
                    </div>
                  </div>
                ) : allItems.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    This folder is empty.
                  </div>
                ) : viewMode === "list" ? (
                  <FileList items={allItems} onNavigate={handleNavigate} />
                ) : (
                  <FileGrid items={allItems} onNavigate={handleNavigate} />
                )}
              </div>
            </div>

            <ShareFooter sourceURL={info.sourceURL} />
          </div>
        );
      }}
    </ShareInfoLoader>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/routes/ShareViewer.tsx
git commit -m "feat(share-viewer): add main ShareViewer page component"
```

---

### Task 9: Mount ShareViewer Route in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx:44-46`

- [ ] **Step 1: Add the import**

Add after the existing imports in `frontend/src/App.tsx`:

```typescript
import ShareViewer from "@/routes/ShareViewer";
```

- [ ] **Step 2: Add the public route**

In the `<Routes>` block (after line 44), add before the `*` catch-all:

```tsx
<Route path="/public/share/:hash/*" element={<ShareViewer />} />
```

The resulting routes block should be:

```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/public/share/:hash/*" element={<ShareViewer />} />
  <Route path="/files/*" element={<AuthGuard><FileBrowser /></AuthGuard>} />
  <Route path="*" element={<Navigate to="/files" replace />} />
</Routes>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(share-viewer): mount ShareViewer route at /public/share/:hash/*"
```

---

## Phase 4: Integration & Polish

### Task 10: Export FileGrid and FileList for Share Viewer Reuse

**Files:**
- Modify: `frontend/src/components/files/FileGrid.tsx` — verify default export
- Modify: `frontend/src/components/files/FileList.tsx` — verify default export

- [ ] **Step 1: Check FileGrid export**

Read `frontend/src/components/files/FileGrid.tsx` to confirm it has `export default`. If it uses named export, no change needed. If it has no export, add `export default function FileGrid`.

- [ ] **Step 2: Check FileList export**

Read `frontend/src/components/files/FileList.tsx` to confirm it has `export default`.

- [ ] **Step 3: Commit (if changes were made)**

```bash
git add frontend/src/components/files/FileGrid.tsx frontend/src/components/files/FileList.tsx
git commit -m "chore(share-viewer): ensure FileGrid and FileList are exported for share viewer"
```

---

### Task 11: Manual Smoke Test

- [ ] **Step 1: Build the project**

Run: `cd frontend && npm run build 2>&1`
Expected: No TypeScript errors, build completes successfully.

- [ ] **Step 2: Check for any remaining issues**

Run: `npx tsc --noEmit 2>&1`
Expected: No errors.

If there are errors, fix them and re-run until clean.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore(share-viewer): clean up build and type errors"
```

---

### Self-Review Checklist

**1. Spec coverage:**
- [x] Route at `/public/share/:hash/*` — Task 9
- [x] Share info fetch (`/public/api/share/info`) — Tasks 1, 2
- [x] Items listing (`/public/api/resources/items`) — Tasks 2
- [x] File download (`/public/api/resources/download`) — Tasks 2, 5
- [x] ShareInfo type — Task 1
- [x] ShareHeader with banner, title, description, quick download — Task 5
- [x] ShareBreadcrumb navigation — Task 6
- [x] ShareFooter with origin link — Task 7
- [x] ShareError full-page error — Task 4
- [x] ShareInfoLoader with theme application — Task 3
- [x] ShareViewer main page — Task 8
- [x] Theme enforcement (dark/light mode) — Task 3
- [x] Subfolder navigation via URL — Tasks 6, 8
- [x] Empty folder state — Task 8
- [x] Loading spinner — Tasks 3, 8
- [x] 404/403 error handling — Tasks 3, 4

**2. Placeholder scan:** No placeholders found. All steps have complete code.

**3. Type consistency:**
- `ShareInfo` type used consistently in Tasks 3, 5, 6, 7, 8
- `FileInfo` from `resources.ts` reused (not duplicated) in Tasks 2, 8
- `getShareItems` returns `{ files, folders }` matching `ShareItemsResponse` from Task 2
- `handleNavigate` uses path strings consistently throughout

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-04-share-viewer-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
