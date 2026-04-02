# Backend API-Only + Frontend SPA Architecture

**Date:** 2026-04-02

**Goal:** Decouple the Go backend from frontend serving. The Go backend becomes an API-only server. A React/Vite frontend is built to static files and served via a lightweight Node.js static server (`serve`) inside the same Alpine container, with nginx as the reverse proxy.

## 1. Architecture

Single Alpine container with three processes:

```
┌──────────────────────────────────────────────────────────┐
│  Alpine Container                                         │
│                                                           │
│  nginx (port 80, public face)                            │
│  ├── /api/*   → reverse proxy → Go :8080                │
│  ├── /public/* → reverse proxy → Go :8080               │
│  ├── /dav/*   → reverse proxy → Go :8080                │
│  └── /*       → reverse proxy → serve :3000             │
│                                                           │
│  Go backend (port 8080, internal only)                   │
│  ├── /api/*                                               │
│  ├── /public/*                                            │
│  └── /dav/*                                               │
│                                                           │
│  serve (port 3000, internal only)                        │
│  └── Serves React SPA static files                       │
└──────────────────────────────────────────────────────────┘
```

The Go backend and `serve` never listen on externally exposed ports. nginx is the only public-facing process.

## 2. Why This Approach

- **Single container:** Simpler than two-container (backend + frontend) deployments.
- **API-only Go backend:** Smaller, simpler, more focused. No template parsing, asset embedding, or static file serving.
- **`serve` over Vite dev server:** `serve` is a minimal static file server designed for production. Vite's dev server is for development only.
- **nginx reverse proxy:** Battle-tested, ~8MB Alpine image, familiar config syntax.
- **SPA pattern:** The React app is a pure client-side SPA. No SSR needed.

## 3. Files Deleted

| File / Directory | Reason |
|---|---|
| `backend/http/static.go` | All template rendering and static asset serving removed |
| `backend/http/share.go` | `redirectToShare` handler removed |
| `backend/http/embed/` | Embedded asset directory (no more `//go:embed`) |
| `backend/icons/` | PWA icon generation package removed |
| `backend/adapters/fs/fileutils/assets.go` | `InitAssetFS`, `GetAssetFS` removed |

## 4. Files Modified

### `backend/http/httpRouter.go`

Router simplifies to API-only routes. Remove all frontend-related routes, the `//go:embed` directive, `GetEmbeddedAssets()`, template parsing, `assetFs` variable, and the `assets` static file handler.

```go
mux.HandleFunc(baseURL+"api/", apiHandler)
mux.HandleFunc(baseURL+"public/", publicHandler)   // share API only
mux.HandleFunc(baseURL+"dav/", webDAVHandler)
```

### `backend/common/settings/structs.go`

Remove:
- `Server.ServeOnlyAPI` field
- `Frontend` struct
- `StylingConfig` struct
- `Environment.FaviconPath`, `LoginIconPath`, `PWAIconsDir`, `EmbeddedFs`
- All `Settings.HTMLTemplate*` and `Settings.Public*` fields referencing frontend

### `backend/root.go`

Remove the `fileutils.InitAssetFS` call and all `EmbeddedFs` branching. The Go backend no longer initializes an asset FS.

### `backend/config.yaml`

Remove `serveOnlyAPI`, `frontend:`, `styling:` sections. Keep server, database, auth, and logging config.

### `frontend-next/vite.config.ts`

Change build output directory from `../backend/http/dist` to `dist` (local to the frontend project):

```typescript
build: {
  outDir: "dist",
}
```

The dev proxy configuration (`npm run dev` proxies `/api/*` to `http://localhost:2818`) remains unchanged.

### `_docker/Dockerfile.slim`

Build Go binary (no embed step), build frontend static files, copy both into an Alpine container with nginx. An entrypoint script starts the Go backend in the background, then runs nginx.

### `_docker/Dockerfile`

Full development variant: keeps `node_modules`, source files, and dev tools for debugging inside the container.

### `_docker/nginx.conf`

Nginx configuration routing:
- `/api/*`, `/public/*`, `/dav/*` → proxy to Go backend on `localhost:8080`
- `/*` → proxy to `serve` on `localhost:3000`

### `_docker/docker-entrypoint.sh`

Shell script that starts the Go backend in the background, then execs into nginx.

## 5. Playwright Test Impact

Any Playwright tests that navigate directly to the Go backend's frontend routes (e.g., `http://localhost:2818/`) need to be updated to point to the new SPA endpoint (`http://localhost` via nginx, or `http://localhost:3000` directly via `serve`).

## 6. Error Handling

- After modifications, run `go build ./...` to catch any remaining references to deleted code.
- Run `go vet ./...` to surface any leftover issues.
- Any compile errors will identify missed references to `static.go`, `icons/`, or `fileutils.GetAssetFS()`.

## 7. Development vs. Production

| Environment | Frontend | Backend |
|---|---|---|
| **Development** | `npm run dev` (port 5173), proxies `/api/*` to Go :2818 | `go run ./backend/cmd` (port 2818) |
| **Production** | Built to `frontend-next/dist`, served by `serve` (port 3000) | Binary on port 8080, nginx routes traffic |

## 8. Architecture Diagram

```
BEFORE (Go serves everything):
┌──────────────────────────────────────┐
│  Container                           │
│  Go Backend (port 80)                 │
│  ├── /         → index.html (Go template)
│  ├── /api/*    → REST API             │
│  ├── /public/* → static assets        │
│  ├── /swagger/* → Swagger UI          │
│  └── /dav/*   → WebDAV                │
└──────────────────────────────────────┘

AFTER (Go = API, nginx + serve = frontend):
┌──────────────────────────────────────┐
│  Container                           │
│  nginx (port 80, public)             │
│  ├── /api/*  → proxy Go :8080       │
│  ├── /public/* → proxy Go :8080     │
│  ├── /dav/* → proxy Go :8080        │
│  └── /*      → proxy serve :3000    │
│                                      │
│  Go backend (port 8080, internal)   │
│  serve (port 3000, internal)         │
└──────────────────────────────────────┘
```
