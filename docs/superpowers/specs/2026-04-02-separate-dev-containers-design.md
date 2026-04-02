# Design: Separate Frontend + Backend Dev Containers

**Date:** 2026-04-02  
**Status:** Approved

## Overview

Replace the single-image `container/docker-compose.yaml` with two separate dev-focused containers: one for the Go backend and one for the Vite/React frontend. This enables live hot-reload for frontend and makes it easy to rebuild only the backend when Go code changes.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  docker-compose (container/)                        │
│                                                     │
│  ┌──────────────┐     proxy /api   ┌─────────────┐ │
│  │  frontend    │ ────────────────▶│  backend    │ │
│  │  Node/Vite   │                  │  Go binary  │ │
│  │  port 5173   │                  │  port 8080  │ │
│  └──────────────┘                  └─────────────┘ │
└─────────────────────────────────────────────────────┘
       host:5173 (→3000)              host:2818
```

## Services

### backend

- **Dockerfile:** `container/Dockerfile.backend`
- **Build context:** `../filebrowser` (repo root)
- **What it does:** builds the Go binary with CGO + mupdf tags; runs `./filebrowser` directly (no nginx)
- **Internal port:** 8080 (as configured in `backend/config.yaml`)
- **Exposed port:** `2818:8080`
- **Volumes:**
  - `./data` → `/home/filebrowser/data` (config, database)
  - `/home/nlnguyen` → `/srv` (files served by filebrowser)

### frontend

- **Dockerfile:** `container/Dockerfile.frontend`
- **Build context:** `../filebrowser/frontend`
- **What it does:** installs npm deps at build time; runs `npm run dev` (Vite dev server with HMR)
- **Internal port:** 5173
- **Exposed port:** `5173:5173`
- **Volumes:**
  - `../filebrowser/frontend/src` → `/app/src` (live source edits, HMR)
  - `../filebrowser/frontend/public` → `/app/public`
- **Depends on:** backend (so Vite proxy target is resolvable)

## Files Modified / Created

| File | Action | Purpose |
|------|--------|---------|
| `container/Dockerfile.backend` | Create | Go-only build, no nginx |
| `container/Dockerfile.frontend` | Create | Node dev image |
| `container/docker-compose.yaml` | Replace | Two-service compose |
| `filebrowser/frontend/vite.config.ts` | Modify | Proxy target uses `VITE_BACKEND_URL` env var |

## Vite Proxy

`vite.config.ts` proxy target changes from hardcoded `http://localhost:2818` to:

```ts
target: process.env.VITE_BACKEND_URL ?? "http://localhost:2818",
```

- In Docker: `VITE_BACKEND_URL=http://backend:8080` (set in docker-compose)
- In local dev (no Docker): falls back to `http://localhost:2818` — no behaviour change

## Data & Volumes

- Backend config/db lives in `container/data/` (already exists, gitignored)
- Frontend source is mounted live for HMR; `node_modules` lives inside the container (not mounted) to avoid host/container OS conflicts

## Constraints

- Go backend requires rebuild (`docker compose build backend`) when backend source changes — no live reload for Go
- `backend/config.yaml` `server.port` must remain `8080`; `server.baseURL` must remain `"/"`
