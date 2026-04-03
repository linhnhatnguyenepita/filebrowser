# Storage Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded "3.4 MB / 100 GB" storage indicator in `SidebarFooter` with live partition stats fetched from a new `GET /api/storage` backend endpoint backed by `unix.Statfs("/srv")`.

**Architecture:** A new Go HTTP handler calls `unix.Statfs` on `/srv` (the path bound to the host's `/home/nlnguyen` partition) and returns `{ total, free }` in bytes. The frontend fetches this on mount, computes `used` and `pct`, and renders the indicator. A `formatBytes` utility converts bytes to human-readable strings (KB, MB, GB, TB).

**Tech Stack:** Go (`golang.org/x/sys/unix` already in go.mod), TypeScript/React, Vite, Tailwind.

---

## Task 1: Add `formatBytes` utility to `frontend/src/lib/utils.ts`

**Files:**
- Modify: `frontend/src/lib/utils.ts:1-6`

- [ ] **Step 1: Add `formatBytes` function**

```typescript
// frontend/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${UNITS[i]}`;
}
```

- [ ] **Step 2: Verify the file still type-checks**

Run: `cd /home/nlnguyen/Documents/fileb/frontend && npx tsc --noEmit src/lib/utils.ts 2>&1`
Expected: No errors (only the function, no breaking changes)

---

## Task 2: Create `backend/http/storage.go`

**Files:**
- Create: `backend/http/storage.go`

- [ ] **Step 1: Create `storage.go` with the handler**

```go
package http

import (
	"encoding/json"
	"net/http"
	"golang.org/x/sys/unix"
)

type StorageResponse struct {
	Total int64 `json:"total"`
	Free  int64 `json:"free"`
}

func (rt *Router) handleStorage(w http.ResponseWriter, r *http.Request, d *requestContext) (int, error) {
	var stat unix.Statfs_t
	if err := unix.Statfs("/srv", &stat); err != nil {
		http.Error(w, "failed to read storage", http.StatusInternalServerError)
		return http.StatusInternalServerError, nil
	}
	resp := StorageResponse{
		Total: int64(stat.Blocks) * int64(stat.Bsize),
		Free:  int64(stat.Bavail) * int64(stat.Bsize),
	}
	w.Header().Set("Content-Type", "application/json")
	return renderJSON(w, r, resp)
}
```

- [ ] **Step 2: Verify the backend compiles**

Run: `cd /home/nlnguyen/Documents/fileb/backend && go build ./... 2>&1`
Expected: No errors (new file uses only stdlib + `golang.org/x/sys/unix` which is already in go.mod)

---

## Task 3: Register `GET /api/storage` route in `backend/http/httpRouter.go`

**Files:**
- Modify: `backend/http/httpRouter.go:121-126`

- [ ] **Step 1: Add route registration in the Settings Routes section**

After line 125 (`api.HandleFunc("GET /settings/sources", withUser(getSourceInfoHandler))`), add:

```go
	// Storage route
	api.HandleFunc("GET /storage", withUser(handleStorage))
```

The surrounding context to make the edit unique:

```go
	// ========================================
	// Settings Routes - /api/settings/
	// ========================================
	api.HandleFunc("GET /settings", withAdmin(settingsGetHandler))
	api.HandleFunc("GET /settings/config", withAdmin(settingsConfigHandler))
	api.HandleFunc("GET /settings/sources", withUser(getSourceInfoHandler))

	// Storage route
	api.HandleFunc("GET /storage", withUser(handleStorage))
```

- [ ] **Step 2: Verify the backend compiles with the new route**

Run: `cd /home/nlnguyen/Documents/fileb/backend && go build ./... 2>&1`
Expected: No errors

---

## Task 4: Create `frontend/src/lib/api/storage.ts`

**Files:**
- Create: `frontend/src/lib/api/storage.ts`

- [ ] **Step 1: Create the API client file**

```typescript
// frontend/src/lib/api/storage.ts
import { apiPath, apiFetch } from "./client";

export interface StorageInfo {
  total: number;
  free: number;
}

export async function getStorage(): Promise<StorageInfo> {
  return apiFetch<StorageInfo>(apiPath("storage"));
}
```

- [ ] **Step 2: Verify the TypeScript compiles**

Run: `cd /home/nlnguyen/Documents/fileb/frontend && npx tsc --noEmit src/lib/api/storage.ts 2>&1`
Expected: No errors

---

## Task 5: Update `SidebarFooter.tsx` to fetch and display live storage

**Files:**
- Modify: `frontend/src/components/layout/SidebarFooter.tsx:1-94`

- [ ] **Step 1: Add imports and state**

Add to the imports at the top (after the existing imports):

```tsx
import { useState, useEffect } from "react";
import { getStorage } from "@/lib/api/storage";
import { formatBytes } from "@/lib/utils";
```

Add inside the component function, after `const [settingsOpen, setSettingsOpen] = useState(false);`:

```tsx
  const [storage, setStorage] = useState<{ total: number; free: number } | null>(null);

  useEffect(() => {
    getStorage()
      .then(setStorage)
      .catch(() => {});
  }, []);

  const used = storage ? storage.total - storage.free : null;
  const pct = storage ? Math.round((used / storage.total) * 100) : null;
```

- [ ] **Step 2: Replace the hardcoded storage block**

Replace lines 33–42 (the storage indicator div):

```tsx
        {/* Storage indicator */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Storage</span>
            {storage ? (
              <span className="text-xs text-muted-foreground font-mono">
                {formatBytes(used)} / {formatBytes(storage.total)}
              </span>
            ) : null}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            {pct !== null && (
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            )}
          </div>
        </div>
```

- [ ] **Step 3: Verify the component type-checks**

Run: `cd /home/nlnguyen/Documents/fileb/frontend && npx tsc --noEmit 2>&1`
Expected: No errors

---

## Task 6: Verify end-to-end

**Files:**
- Test: Manual smoke test

- [ ] **Step 1: Start the backend and frontend**

Run (in a terminal): `cd /home/nlnguyen/Documents/fileb && docker compose -f container/docker-compose.yaml up --build`
Run (in another terminal): `cd /home/nlnguyen/Documents/fileb/frontend && npm run dev`

- [ ] **Step 2: Log in and check the storage indicator**

Open the app in the browser. After logging in, the sidebar footer should show:
- Storage label on the left
- Live used/total (e.g., "45.2 GB / 500 GB") on the right
- A filled progress bar proportional to usage

- [ ] **Step 3: Verify the API endpoint directly**

Run: `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/storage`
Expected: `{"total":500000000000,"free":450000000000}`

- [ ] **Step 4: Commit**

```bash
git add backend/http/storage.go backend/http/httpRouter.go frontend/src/lib/api/storage.ts frontend/src/lib/utils.ts frontend/src/components/layout/SidebarFooter.tsx
git commit -m "feat: add live storage indicator backed by /srv partition stats"
```
