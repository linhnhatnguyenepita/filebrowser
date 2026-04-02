# Frontend-Next: New File Manager Frontend

A brand new frontend for the FileBrowser self-hosted file manager, built with Next.js, React, Shadcn/ui, Zustand, and Tailwind CSS. Replaces the existing Vue 3 frontend with a modern, dark-first, Discord/Spotify-inspired design focused on personal/family home use.

## Context

The existing FileBrowser backend (Go, REST API, JWT auth) is complete and well-documented. The current Vue 3 frontend works but the user wants a fresh start with:
- A modern, polished dark-first aesthetic (Discord/Spotify style)
- Next.js + React as the tech stack (replacing Vue 3)
- Bun as the package manager (replacing npm)

The new frontend lives at `frontend-next/` alongside the existing `frontend/`. Both target the same backend API and build output directory (`backend/http/dist/`).

## V1 Scope

**Must-have features:**
1. Login / authentication (JWT)
2. Browse files & folders (grid + list views)
3. Upload files (chunked)
4. Download files
5. Create / delete / rename files & folders
6. Move / copy files
7. Search

**Explicitly deferred to v2+:**
- File preview (images, video, audio, text)
- Share links (create & manage)
- Settings / profile page
- Admin panel (user management)
- Text/code editor
- Real-time updates (SSE)

## Tech Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | Next.js (App Router) | Modern React, catch-all routing for paths |
| Package manager | Bun | User preference, faster than npm |
| Language | TypeScript (strict) | Type safety as primary quality net |
| Components | Shadcn/ui (Radix primitives) | Accessible, customizable, dark-first |
| Styling | Tailwind CSS + CSS variables | Shadcn dependency, powerful theming |
| State | Zustand | Lightweight, no boilerplate |
| HTTP | Native fetch (typed wrapper) | No extra dependencies |
| Icons | Lucide React | Matches Shadcn ecosystem |
| Deployment | Static export (SPA) | Embedded in Go binary, no Node runtime |

## Project Structure

```
filebrowser/
├── frontend/              # existing Vue app (untouched)
├── frontend-next/         # new Next.js app
│   ├── app/                   # Next.js App Router pages
│   │   ├── layout.tsx             # Root layout (providers, font, theme)
│   │   ├── page.tsx               # Redirect → /files
│   │   ├── login/
│   │   │   └── page.tsx           # Login page
│   │   └── files/
│   │       └── [...path]/
│   │           └── page.tsx       # File browser (catch-all route)
│   ├── components/            # React components
│   │   ├── ui/                    # Shadcn primitives (button, dialog, input, etc.)
│   │   ├── layout/                # Sidebar, Header, Breadcrumbs, StatusBar
│   │   ├── files/                 # FileGrid, FileList, FileRow, FileCard, FileIcon
│   │   └── dialogs/              # Upload, CreateFolder, Rename, Delete, MoveCopy
│   ├── lib/                   # Utilities
│   │   ├── api/                   # Typed API client modules
│   │   ├── stores/                # Zustand stores
│   │   └── utils/                 # Formatters, helpers
│   ├── styles/
│   │   └── globals.css            # Tailwind base + custom theme
│   ├── public/                # Static assets (favicon, etc.)
│   ├── next.config.ts         # API proxy config
│   ├── tailwind.config.ts     # Theme colors, dark mode
│   ├── components.json        # Shadcn config
│   ├── tsconfig.json
│   └── package.json
└── backend/               # Go backend (untouched)
```

## Architecture

### Static Export SPA

Next.js builds to static HTML/JS/CSS via `output: 'export'` in next.config.ts. No Node.js server at runtime. The Go backend serves the static files from `backend/http/dist/`, same as the current Vue frontend. This preserves the single-binary deployment model.

### Data Flow

```
Browser (Next.js SPA)
    │
    │ fetch(/api/*)
    │
    ▼
Go Backend (:2818)
    │
    ▼
Filesystem + BoltDB
```

All data fetching is client-side. No RSC data fetching. Server components are used only for static layout structure. React components call the typed API client via `useEffect` or event handlers.

### Dev Proxy

In development, Next.js runs on `:3000` and needs to proxy `/api/*` requests to the Go backend on `:2818`. Since `output: 'export'` does not support `rewrites()`, use the `NEXT_PUBLIC_API_BASE` env var approach:

```typescript
// lib/api/client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
// Dev: NEXT_PUBLIC_API_BASE=http://localhost:2818
// Prod: empty (same origin, Go serves everything)
```

Alternatively, during `bun run dev`, temporarily remove `output: 'export'` and use `rewrites()`, or run a simple Vite-style proxy via `bun` script. The simplest approach: develop directly against the Go backend by having it serve the Next.js dev build, or use the env var.

In production (static export), the frontend and backend are served from the same origin by the Go binary, so no proxy is needed.

## Pages

### Login (`/login`)

Dark full-screen page with a centered card containing:
- Username text input
- Password text input
- "Sign in" button
- Error toast on failed auth

Auto-redirects to `/files` if the user already has a valid JWT cookie.

### File Browser (`/files/[...path]`)

The main and only other page. Three-zone layout:

```
┌──────────┬──────────────────────────────────────┐
│          │  Header                              │
│          │  [Breadcrumbs] [Search] [View] [+New] │
│ Sidebar  ├──────────────────────────────────────┤
│          │                                      │
│ Sources  │  Content Area                        │
│ Tree Nav │  (FileGrid or FileList)              │
│          │                                      │
├──────────┼──────────────────────────────────────┤
│          │  Status Bar                          │
└──────────┴──────────────────────────────────────┘
```

**Sidebar (fixed, always visible):**
- Source selector dropdown (if multiple sources)
- Directory tree — lazy-loaded via `GET /api/resources/items?only=folders`
- Active path highlighted

**Header:**
- Breadcrumb navigation (clickable path segments)
- Search input → queries `GET /api/tools/search`, results in dropdown
- View mode toggle (grid ↔ list)
- Action buttons: Upload, New Folder

**Content area:**
- Grid view: CSS grid of FileCard components (icon + name + size)
- List view: sortable table (name, size, date, type columns)
- Multi-select via checkboxes (visible on hover or shift+click)
- Right-click context menu: Download, Rename, Move, Copy, Delete
- Click folder → navigate (URL change → re-fetch)
- Click file → download (v1, preview in v2)

**Status bar:**
- Current path, total items count
- When items selected: selection count + bulk action buttons (Delete, Move, Copy, Download)

## Components

### Layout Components

| Component | Source | Notes |
|-----------|--------|-------|
| `Sidebar` | Custom | Uses Shadcn ScrollArea, fixed 260px width |
| `DirectoryTree` | Custom | Recursive, lazy-loads children on expand |
| `Header` | Custom | Tailwind flex layout |
| `Breadcrumbs` | Shadcn Breadcrumb | Clickable segments from URL path |
| `StatusBar` | Custom | Sticky bottom bar |

### File Components

| Component | Source | Notes |
|-----------|--------|-------|
| `FileGrid` | Custom | CSS grid container |
| `FileList` | Shadcn Table | Sortable columns, row selection |
| `FileCard` | Custom | Grid item with icon, name, size |
| `FileRow` | Custom | Table row with checkbox, icon, columns |
| `FileIcon` | Custom | Maps mime type → Lucide icon + color |
| `ContextMenu` | Shadcn ContextMenu | Right-click actions |

### Dialog Components

| Component | Trigger | API Call |
|-----------|---------|----------|
| `UploadDialog` | Upload button or drag-drop | `POST /api/resources` (chunked) |
| `CreateFolderDialog` | New Folder button | `POST /api/resources?isDir=true` |
| `RenameDialog` | Context menu → Rename | `PATCH /api/resources` (action: rename) |
| `DeleteDialog` | Context menu → Delete | `DELETE /api/resources` or `/bulk` |
| `MoveCopyDialog` | Context menu → Move/Copy | `PATCH /api/resources` (action: move/copy) |

## State Management

Three Zustand stores:

### authStore
```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  renewToken: () => Promise<void>;
  fetchUser: () => Promise<void>;
}
```

### fileStore
```typescript
interface FileState {
  path: string;
  source: string;
  files: ExtendedItemInfo[];
  folders: ItemInfo[];
  loading: boolean;
  selected: Set<string>;
  sortBy: 'name' | 'size' | 'modified';
  sortAsc: boolean;
  fetchDirectory: (path: string, source: string) => Promise<void>;
  toggleSelect: (name: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
}
```

### uiStore
```typescript
interface UIState {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  activeDialog: string | null;
  setViewMode: (mode: 'grid' | 'list') => void;
  search: (query: string, source: string) => Promise<void>;
  openDialog: (name: string) => void;
  closeDialog: () => void;
}
```

## API Client

### Base Client (`lib/api/client.ts`)

A typed fetch wrapper that handles:
- JWT token injection via `Authorization: Bearer` header
- Auto token renewal on `X-Renew-Token: true` response header
- Auto redirect to `/login` on 401
- JSON parsing with typed responses
- Error extraction from `{ status, message }` response format

### API Modules

| Module | Backend Endpoints |
|--------|-------------------|
| `api/auth.ts` | `POST /auth/login`, `POST /auth/logout`, `POST /auth/renew` |
| `api/resources.ts` | `GET /resources`, `GET /resources/items`, `POST /resources`, `PUT /resources`, `DELETE /resources`, `DELETE /resources/bulk`, `PATCH /resources`, `GET /resources/download` |
| `api/search.ts` | `GET /tools/search` |
| `api/users.ts` | `GET /users?id=self` |
| `api/settings.ts` | `GET /settings/sources` |

### Upload Implementation

Chunked upload with progress tracking:
1. Read file as ArrayBuffer
2. Split into chunks (default 10MB, configurable)
3. Send each chunk via `POST /api/resources` with headers:
   - `X-File-Chunk-Offset: <byte-offset>`
   - `X-File-Total-Size: <total-bytes>`
4. Track progress per file in upload dialog
5. On 409 (conflict), prompt user to overwrite

## Error Handling

| Error Type | Behavior |
|------------|----------|
| API error (4xx/5xx) | Shadcn Toast showing backend `message` |
| Network error | Toast: "Connection lost" with retry button |
| 401 Unauthorized | Redirect to `/login` |
| 409 Conflict (upload) | Dialog: "File exists. Overwrite?" |
| 207 Multi-Status | Toast: "X succeeded, Y failed" with detail expansion |

## Visual Design

### Theme

Discord/Spotify-inspired dark-first design:
- Dark background surfaces (`#1a1a2e`, `#16213e`, `#0f3460`)
- Vibrant accent color (electric blue `#3b82f6` or customizable)
- Subtle borders between zones, no heavy shadows
- Rounded corners (`radius-md` to `radius-lg`)
- Smooth 150-200ms transitions on hover/focus
- Lucide icons with muted colors, accent on active state

### Typography
- Inter font (via `next/font`, self-hosted, no CDN)
- Hierarchy: file names 14px medium, metadata 12px regular, headers 16-20px semibold

### Dark Mode
- Default and only mode in v1 (light mode deferred)
- Tailwind `darkMode: 'class'` for future light mode support

## Build & Deploy

```bash
# Development
cd frontend-next
bun install
bun run dev              # localhost:3000, proxy → backend :2818

# Production build
bun run build            # static export → out/
# Copy to backend embed directory:
cp -r out/* ../backend/http/dist/
```

The Go backend serves the static files from `backend/http/dist/` at the configured `baseURL`. Build output must include:
- `index.html` — In v1, this is a plain static HTML file. The Go backend's template rendering (`{{ .htmlVars.* }}`) for dynamic theme injection is **not used initially**. Instead, theme colors are hardcoded in `globals.css`. Adding Go template compatibility is a v2 task that requires the `index.html` to be renamed and registered as a Go template.
- Static JS/CSS bundles in `_next/`
- Any public assets

## Testing

Lightweight for v1:
- TypeScript strict mode as primary safety net
- Manual testing against running backend on `:2818`
- No unit tests initially — add when codebase stabilizes
- ESLint + Prettier for code quality
