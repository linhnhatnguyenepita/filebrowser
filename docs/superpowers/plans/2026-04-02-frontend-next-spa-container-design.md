# Backend API-Only + Frontend SPA Container Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple the Go backend from frontend serving. The Go backend becomes an API-only server (port 8080). The React/Vite frontend is built to static files and served by a Node.js `serve` static file server (port 3000) inside an Alpine container, with nginx (port 80) as the reverse proxy.

**Architecture:** Single Alpine container running three processes: nginx (only externally exposed port), Go binary (internal port 8080), `serve` (internal port 3000). nginx routes `/api/*`, `/public/*`, `/dav/*` to Go; everything else `/*` to `serve`.

**Tech Stack:** Go, React 19, Vite 8, nginx, `serve` (npm), Alpine Linux, Docker multi-stage build

---

## Phase 1: Frontend Build Output

### Task 1: Modify `frontend-next/vite.config.ts` — Change Build Output Directory

**Files:**
- Modify: `frontend-next/vite.config.ts`

- [ ] **Step 1: Change `build.outDir` to `dist`, remove `experimental.renderBuiltUrl`**

```typescript
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  base: "",
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:2818",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
```

- [ ] **Step 2: Verify dev proxy still works**

```bash
cd frontend-next && npm run dev
```

Expected: Vite dev server starts on port 5173, `/api` requests proxy to `http://localhost:2818`.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/vite.config.ts
git commit -m "refactor(frontend): change build outDir to dist"
```

**Acceptance Criteria:** `npm run dev` starts successfully with proxy working; `npm run build` outputs to `frontend-next/dist`.

---

## Phase 2: Docker Infrastructure

### Task 2: Create `_docker/nginx.conf` — nginx Reverse Proxy Configuration

**Files:**
- Create: `_docker/nginx.conf`

- [ ] **Step 1: Write nginx.conf**

```nginx
worker_processes auto;
error_log /dev/stderr warn;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /dev/stdout main;

    sendfile on;
    keepalive_timeout 65;
    gzip on;

    upstream go_backend {
        server 127.0.0.1:8080;
    }

    upstream serve_frontend {
        server 127.0.0.1:3000;
    }

    server {
        listen 80 default_server;
        server_name _;

        # Health check endpoint
        location /health {
            proxy_pass http://go_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API routes -> Go backend
        location /api/ {
            proxy_pass http://go_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Public routes -> Go backend
        location /public/ {
            proxy_pass http://go_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebDAV routes -> Go backend
        location /dav/ {
            proxy_pass http://go_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # All other routes -> React SPA (serve)
        location / {
            proxy_pass http://serve_frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add _docker/nginx.conf
git commit -m "feat(docker): add nginx reverse proxy config for SPA architecture"
```

**Acceptance Criteria:** nginx.conf syntax is valid; contains all required `proxy_pass` routes for `/api/`, `/public/`, `/dav/`, and `/`.

---

### Task 3: Create `_docker/docker-entrypoint.sh` — Container Startup Script

**Files:**
- Create: `_docker/docker-entrypoint.sh`

- [ ] **Step 1: Write the startup script**

```sh
#!/bin/sh
set -e

# Start Go backend in background
echo "Starting filebrowser backend on port 8080..."
./filebrowser &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 2

# Start serve for React SPA in background
echo "Starting React SPA server on port 3000..."
serve -s dist -l 3000 &
SERVE_PID=$!

# Wait for serve to start
sleep 1

# Start nginx in foreground (replaces current process)
echo "Starting nginx on port 80..."
exec nginx -c /etc/nginx/nginx.conf
```

- [ ] **Step 2: Make script executable**

```bash
chmod +x _docker/docker-entrypoint.sh
```

- [ ] **Step 3: Commit**

```bash
git add _docker/docker-entrypoint.sh
git commit -m "feat(docker): add container entrypoint script for nginx+serve+backend startup"
```

**Acceptance Criteria:** Entrypoint script is executable; backend starts on 8080, `serve` starts on 3000, nginx starts last in foreground.

---

### Task 4: Rewrite `_docker/Dockerfile.slim` — Slim Production Image

**Files:**
- Modify: `_docker/Dockerfile.slim`

- [ ] **Step 1: Write new Dockerfile.slim**

```dockerfile
# Stage 1: Build Go binary (no embed)
FROM golang:alpine AS go-build
ARG VERSION
ARG REVISION
WORKDIR /app
COPY ./backend/ ./
RUN apk update && apk add --no-cache upx
RUN go build -ldflags="-w -s \
  -X 'github.com/gtsteffaniak/filebrowser/backend/common/version.Version=${VERSION}' \
  -X 'github.com/gtsteffaniak/filebrowser/backend/common/version.CommitSHA=${REVISION}'" \
  -o filebrowser .
RUN upx filebrowser

# Stage 2: Build React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY ./frontend-next/package*.json ./
RUN npm ci
COPY ./frontend-next/ ./
RUN npm run build

# Stage 3: Final Alpine image
FROM alpine:3.20
RUN apk --no-cache add ca-certificates curl nginx nodejs npm
RUN adduser -D -s /bin/sh -u 1000 filebrowser
USER filebrowser
WORKDIR /home/filebrowser

# Copy Go binary
COPY --from=go-build --chown=filebrowser:filebrowser [ "/app/filebrowser", "./" ]

# Copy React SPA dist
COPY --from=frontend-build --chown=filebrowser:filebrowser [ "/app/dist/", "./dist/" ]

# Copy nginx config and entrypoint
COPY --chown=filebrowser:filebrowser _docker/nginx.conf /etc/nginx/nginx.conf
COPY --chown=filebrowser:filebrowser _docker/docker-entrypoint.sh ./

# Install serve globally
RUN npm install -g serve

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Sanity checks
RUN [ -f "filebrowser" ]
RUN [ -d "dist" ]

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1
ENTRYPOINT [ "./docker-entrypoint.sh" ]
```

- [ ] **Step 2: Commit**

```bash
git add _docker/Dockerfile.slim
git commit -m "refactor(docker): slim image serves React SPA via serve + nginx"
```

**Acceptance Criteria:** `docker build -f _docker/Dockerfile.slim` succeeds; image contains Go binary, `dist/`, `nginx.conf`, `serve`.

---

### Task 5: Rewrite `_docker/Dockerfile` — Full Development Image

**Files:**
- Modify: `_docker/Dockerfile`

- [ ] **Step 1: Write new Dockerfile**

```dockerfile
# Stage 1: Build Go binary (no embed)
FROM golang:alpine AS go-build
ARG VERSION
ARG REVISION
WORKDIR /app
COPY ./backend/ ./
RUN apk update && apk add --no-cache upx
RUN go build -ldflags="-w -s \
  -X 'github.com/gtsteffaniak/filebrowser/backend/common/version.Version=${VERSION}' \
  -X 'github.com/gtsteffaniak/filebrowser/backend/common/version.CommitSHA=${REVISION}'" \
  -o filebrowser .
RUN upx filebrowser

# Stage 2: Build React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY ./frontend-next/package*.json ./
RUN npm ci
COPY ./frontend-next/ ./
RUN npm run build

# Stage 3: Final Alpine image with dev tools
FROM alpine:3.20
RUN apk --no-cache add ca-certificates curl nginx nodejs npm bash git
RUN adduser -D -s /bin/bash -u 1000 filebrowser
USER filebrowser
WORKDIR /home/filebrowser

# Copy Go binary
COPY --from=go-build --chown=filebrowser:filebrowser [ "/app/filebrowser", "./" ]

# Copy React SPA dist
COPY --from=frontend-build --chown=filebrowser:filebrowser [ "/app/dist/", "./dist/" ]

# Copy nginx config and entrypoint
COPY --chown=filebrowser:filebrowser _docker/nginx.conf /etc/nginx/nginx.conf
COPY --chown=filebrowser:filebrowser _docker/docker-entrypoint.sh ./

# Install serve globally
RUN npm install -g serve

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Copy source for debugging
COPY --chown=filebrowser:filebrowser ./backend/ ./backend-src/
COPY --chown=filebrowser:filebrowser ./frontend-next/ ./frontend-src/

# Sanity checks
RUN [ -f "filebrowser" ]
RUN [ -d "dist" ]

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1
ENTRYPOINT [ "./docker-entrypoint.sh" ]
```

- [ ] **Step 2: Commit**

```bash
git add _docker/Dockerfile
git commit -m "refactor(docker): full image uses nginx+serve SPA architecture"
```

**Acceptance Criteria:** Full image is debuggable with source code copies included.

---

## Phase 3: Backend Cleanup

### Task 6: Modify `backend/http/httpRouter.go` — Remove Frontend Routes and Embed

**Files:**
- Modify: `backend/http/httpRouter.go`

- [ ] **Step 1: Remove frontend-related imports**

```go
package http

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"

	_ "net/http/pprof"

	"github.com/coreos/go-systemd/v22/activation"
	"github.com/gtsteffaniak/filebrowser/backend/database/storage/bolt"
	"github.com/gtsteffaniak/filebrowser/backend/events"
	"github.com/gtsteffaniak/go-logger/logger"
)
```

- [ ] **Step 2: Remove `//go:embed`, `GetEmbeddedAssets()`, `assetFs` variable (lines 26-40)**

Replace with:

```go
var (
	store  *bolt.BoltStore
	config *settings.Settings
)
```

- [ ] **Step 3: Remove template rendering initialization (lines 61-76)**

Delete the `templates := template.New` block and `templateRenderer` initialization.

- [ ] **Step 4: Remove all `if !config.Server.ServeOnlyAPI` conditional blocks (lines 222-248)**

Remove:
- Swagger handler (lines 222-224)
- `redirectToShare` handler (lines 228-231)
- Static asset handler registration (lines 235-238)
- Index handler registration and `serveOnlyAPIHandler` (lines 241-248)

- [ ] **Step 5: Verify compilation**

```bash
cd backend && go build ./...
```

Expected: Build passes, no frontend-related errors.

- [ ] **Step 6: Commit**

```bash
git add backend/http/httpRouter.go
git commit -m "refactor(backend): remove frontend routes and embedded assets"
```

**Acceptance Criteria:** `go build ./...` succeeds with no frontend-route-related compile errors.

---

### Task 7: Delete Frontend-Related Files

**Files:**
- Delete: `backend/http/static.go`
- Modify: `backend/http/share.go` (remove `redirectToShare` function only)
- Delete: `backend/icons/generator.go`
- Delete: `backend/adapters/fs/fileutils/assets.go`

- [ ] **Step 1: Delete `backend/http/static.go`**

```bash
rm backend/http/static.go
```

- [ ] **Step 2: Remove `redirectToShare` function from `backend/http/share.go` (lines 687-696)**

Delete this block:

```go
func redirectToShare(w http.ResponseWriter, r *http.Request, d *requestContext) (int, error) {
	// Remove the base URL and "/share/" prefix to get the full path after share
	sharePath := strings.TrimPrefix(r.URL.Path, config.Server.BaseURL+"share/")
	newURL := config.Server.BaseURL + "public/share/" + sharePath
	if r.URL.RawQuery != "" {
		newURL += "?" + r.URL.RawQuery
	}
	http.Redirect(w, r, newURL, http.StatusMovedPermanently)
	return http.StatusMovedPermanently, nil
}
```

- [ ] **Step 3: Delete `backend/icons/generator.go`**

```bash
rm backend/icons/generator.go
```

- [ ] **Step 4: Delete `backend/adapters/fs/fileutils/assets.go`**

```bash
rm backend/adapters/fs/fileutils/assets.go
```

- [ ] **Step 5: Verify compilation**

```bash
cd backend && go build ./...
```

Expected: Build succeeds. May need to clean up unused imports.

- [ ] **Step 6: Commit**

```bash
git rm backend/http/static.go backend/icons/generator.go backend/adapters/fs/fileutils/assets.go
git add backend/http/share.go
git commit -m "refactor(backend): remove frontend static asset and PWA icon generation code"
```

**Acceptance Criteria:** `go build ./...` succeeds; `static.go`, `generator.go`, `assets.go` deleted.

---

### Task 8: Modify `backend/common/settings/structs.go` — Remove Frontend Config Structures

**Files:**
- Modify: `backend/common/settings/structs.go`

- [ ] **Step 1: Remove `Frontend` struct (lines 268-280)**

Delete:

```go
type Frontend struct {
	Name                  string         `json:"name"`
	DisableDefaultLinks   bool           `json:"disableDefaultLinks"`
	DisableUsedPercentage bool           `json:"disableUsedPercentage"`
	ExternalLinks         []ExternalLink `json:"externalLinks"`
	DisableNavButtons     bool           `json:"disableNavButtons"`
	Styling               StylingConfig  `json:"styling"`
	Favicon               string         `json:"favicon"`
	Description           string         `json:"description"`
	LoginIcon             string         `json:"loginIcon"`
	LoginButtonText       string         `json:"loginButtonText"`
	OIDCLoginButtonText   string         `json:"oidcLoginButtonText"`
}

type StylingConfig struct {
	DisableEventBasedThemes bool                   `json:"disableEventThemes"`
	CustomCSS               string                 `json:"customCSS"`
	CustomCSSRaw            string                 `json:"-"`
	LightBackground         string                 `json:"lightBackground"`
	DarkBackground          string                 `json:"darkBackground"`
	CustomThemes            map[string]CustomTheme `json:"customThemes"`
	CustomThemeOptions      map[string]CustomTheme `json:"-"`
}

type CustomTheme struct {
	Description string `json:"description"`
	CSS         string `json:"css,omitempty"`
	CssRaw      string `json:"-"`
}
```

- [ ] **Step 2: Remove `Frontend` field from `Settings` struct (line 20)**

```go
type Settings struct {
	Server       Server       `json:"server"`
	Auth         Auth         `json:"auth"`
	UserDefaults UserDefaults `json:"userDefaults"`
	Integrations Integrations `json:"integrations"`
}
```

- [ ] **Step 3: Remove `Server.ServeOnlyAPI` field (line 69)**

```go
	DisableWebDAV bool `json:"disableWebDAV"`
	// REMOVE: ServeOnlyAPI bool `json:"serveOnlyAPI"`
```

- [ ] **Step 4: Remove PWA and icon-related fields from `Environment` struct (lines 33-43)**

```go
type Environment struct {
	IsPlaywright   bool   `json:"-"`
	IsDevMode      bool   `json:"-"`
	IsFirstLoad    bool   `json:"-"`
	MuPdfAvailable bool   `json:"-"`
	FFmpegPath     string `json:"-"`
	FFprobePath    string `json:"-"`
}
```

- [ ] **Step 5: Verify compilation**

```bash
cd backend && go build ./...
```

Expected: Multiple compile errors — this is expected since other files still reference deleted fields. Subsequent tasks will fix these.

- [ ] **Step 6: Commit**

```bash
git add backend/common/settings/structs.go
git commit -m "refactor(settings): remove Frontend, StylingConfig, ServeOnlyAPI structs"
```

**Acceptance Criteria:** `go build ./...` succeeds; `Frontend`, `StylingConfig` structs deleted.

---

### Task 9: Modify `backend/cmd/root.go` — Clean Up Asset and PWA Initialization

**Files:**
- Modify: `backend/cmd/root.go:183-221`

- [ ] **Step 1: Remove `InitAssetFS` call (lines 192-201)**

Delete this block:

```go
// Initialize asset filesystem before starting services
if settings.Env.EmbeddedFs {
	embeddedAssets := fbhttp.GetEmbeddedAssets()
	subAssets, err := fs.Sub(embeddedAssets, "embed")
	if err != nil {
		logger.Fatalf("Failed to create sub filesystem: %v", err)
	}
	fileutils.InitAssetFS(subAssets, true)
} else {
	fileutils.InitAssetFS(nil, false)
}
```

- [ ] **Step 2: Remove `GeneratePWAIcons` and `InitializePWAManifest` calls (lines 212-218)**

Delete this block:

```go
// Generate PWA icons after preview service is initialized
if err := icons.GeneratePWAIcons(); err != nil {
	logger.Warningf("Failed to generate PWA icons: %v", err)
}

// Initialize PWA manifest after icons are generated
icons.InitializePWAManifest()
```

- [ ] **Step 3: Remove unused imports**

Check and remove no-longer-needed imports from `cmd/root.go` (`fs`, `fileutils`, `fbhttp`, `icons`).

- [ ] **Step 4: Verify compilation**

```bash
cd backend && go build ./...
```

Expected: Build passes.

- [ ] **Step 5: Commit**

```bash
git add backend/cmd/root.go
git commit -m "refactor(backend): remove asset FS and PWA icon initialization"
```

**Acceptance Criteria:** `go build ./...` succeeds; no asset FS or PWA initialization code remains.

---

### Task 10: Modify `backend/common/settings/config.go` — Clean Up Frontend and PWA Logic

**Files:**
- Modify: `backend/common/settings/config.go`

- [ ] **Step 1: Remove `setupFrontend(false)` call (line 58)**

Delete from `Initialize()`:

```go
// REMOVE: setupFrontend(false)
```

- [ ] **Step 2: Remove `Frontend` default from `setDefaults()` (lines 706-708)**

Delete from `setDefaults()`:

```go
Frontend: Frontend{
	Name: "FileBrowser Quantum",
},
```

- [ ] **Step 3: Verify compilation**

```bash
cd backend && go build ./...
```

Expected: Build passes.

- [ ] **Step 4: Commit**

```bash
git add backend/common/settings/config.go
git commit -m "refactor(settings): remove frontend setup from config initialization"
```

**Acceptance Criteria:** `go build ./...` succeeds; `setupFrontend` call removed.

---

### Task 11: Modify `backend/indexing/indexingFiles.go` — Remove Frontend Reference

**Files:**
- Modify: `backend/indexing/indexingFiles.go:1615-1621`

- [ ] **Step 1: Modify `SetUsage` function**

Original:

```go
func (idx *Index) SetUsage(totalBytes uint64) {
	if settings.Config.Frontend.DisableUsedPercentage {
		return
	}
	// ... rest unchanged ...
}
```

Change to (remove the if guard):

```go
func (idx *Index) SetUsage(totalBytes uint64) {
	// ... rest unchanged ...
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd backend && go build ./...
```

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add backend/indexing/indexingFiles.go
git commit -m "refactor(indexing): remove Frontend config reference from SetUsage"
```

**Acceptance Criteria:** `go build ./...` succeeds; `DisableUsedPercentage` reference removed.

---

### Task 12: Delete `backend/common/settings/styling.go`

**Files:**
- Delete: `backend/common/settings/styling.go`

- [ ] **Step 1: Delete the file**

```bash
rm backend/common/settings/styling.go
```

- [ ] **Step 2: Verify compilation**

```bash
cd backend && go build ./...
```

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git rm backend/common/settings/styling.go
git commit -m "refactor(settings): remove frontend styling configuration"
```

**Acceptance Criteria:** `go build ./...` succeeds; `styling.go` deleted.

---

## Phase 4: Config and Verification

### Task 13: Modify `backend/config.yaml` — Remove Frontend Config Sections

**Files:**
- Modify: `backend/config.yaml`

- [ ] **Step 1: Update config.yaml**

Remove `serveOnlyAPI`, `frontend:`, `styling:` config sections:

```yaml
server:
  port: 80
  baseURL: "/"
  logging:
    - levels: "info|warning|error"
  sources:
    - path: "./srv"
# REMOVE: serveOnlyAPI: true
userDefaults:
  # ... rest unchanged ...
```

- [ ] **Step 2: Commit**

```bash
git add backend/config.yaml
git commit -m "refactor(config): remove serveOnlyAPI and frontend config sections"
```

**Acceptance Criteria:** config.yaml validates; no `serveOnlyAPI`, `frontend:` config present.

---

### Task 14: Update `_docker/docker-compose.yaml` — Adjust Volume Mounts

**Files:**
- Modify: `_docker/docker-compose.yaml`

- [ ] **Step 1: Remove frontend volume mount from compose services**

If `filebrowser` or `filebrowser-jwt` services mount `frontend-next` into the container, remove those volumes (frontend is now built into the image):

```yaml
  filebrowser:
    hostname: filebrowser
    volumes:
      # REMOVE: - '../frontend-next:/home/frontend'
      - "./src/proxy/backend/config.yaml:/home/filebrowser/data/config.yaml"
    build:
      context: ../
      dockerfile: ./_docker/Dockerfile.slim
```

- [ ] **Step 2: Commit**

```bash
git add _docker/docker-compose.yaml
git commit -m "refactor(docker): remove frontend volume mount from compose"
```

**Acceptance Criteria:** docker-compose.yaml validates; frontend volume mount removed.

---

### Task 15: End-to-End Verification

**Files:**
- Test: `backend/`
- Test: `_docker/Dockerfile.slim`
- Test: `frontend-next/`

- [ ] **Step 1: Go compilation and vet**

```bash
cd backend && go build ./...
go vet ./...
```

Expected: Build succeeds, `go vet` reports no errors.

- [ ] **Step 2: Frontend build**

```bash
cd frontend-next && npm install && npm run build
ls dist/
```

Expected: `dist/` directory contains `index.html` and static asset files.

- [ ] **Step 3: Docker image build and run**

```bash
cd _docker && docker build -f Dockerfile.slim -t filebrowser:test ../
docker run --rm -p 8080:80 filebrowser:test
```

Expected: Container starts; nginx on 80, Go on 8080, `serve` on 3000.

- [ ] **Step 4: Playwright test check**

```bash
grep -r "localhost:2818" _docker/src/*/frontend/playwright.config.ts
```

Expected: If any tests use Go port directly for frontend routes, update `baseURL` to `http://localhost` (nginx port).

- [ ] **Step 5: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete SPA container architecture refactor"
```

**Acceptance Criteria:** End-to-end test passes — container starts, frontend loads, API responds correctly.

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec Requirement | Task(s) |
|---|---|
| nginx reverse proxy configuration | Task 2, 4, 5 |
| Go backend removes frontend routes | Task 6, 7, 8, 9 |
| `serve` static file server | Task 3, 4, 5 |
| Remove `//go:embed` | Task 6, 7 |
| Remove PWA icon generation | Task 7, 9 |
| `vite.config.ts` outDir → `dist` | Task 1 |
| Dockerfiles updated for SPA architecture | Task 4, 5, 14 |
| config.yaml frontend sections removed | Task 13 |
| docker-compose volume adjustment | Task 14 |
| Frontend becomes pure SPA | Task 1, 4, 5 |

### 2. Placeholder Scan

No placeholders (TBD, TODO, "implement later", etc.) found in the plan.

### 3. Type Consistency

- `Settings.Frontend` → deleted (Task 8)
- `settings.Config.Frontend` → deleted (Task 8)
- `settings.Env.PWAIcon*` → deleted (Task 8)
- `Server.ServeOnlyAPI` → deleted (Task 8)
- `fileutils.InitAssetFS` → deleted (Task 7)
- `fileutils.GetAssetFS` → deleted (Task 7)
- `staticAssetHandler` → deleted (Task 7)
- `templateRenderer` → deleted (Task 6)
- `redirectToShare` → deleted (Task 7)

All references to the above symbols are handled in the corresponding delete/modify tasks.

---

## Phase Summary

| Phase | Tasks | Files Changed | Build Impact |
|-------|-------|---------------|--------------|
| **Phase 1: Frontend Build Output** | Task 1 | 1 | Frontend only |
| **Phase 2: Docker Infrastructure** | Tasks 2–5 | 4 new + 2 modified | Docker only |
| **Phase 3: Backend Cleanup** | Tasks 6–12 | 6 deleted + 4 modified | Go compilation |
| **Phase 4: Config & Verification** | Tasks 13–15 | 3 modified | Config + E2E test |

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-02-frontend-next-spa-container-design.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
