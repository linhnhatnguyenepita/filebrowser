# Storage Indicator Spec

## Context

The `SidebarFooter` component currently displays a hardcoded storage value ("3.4 MB / 100 GB") with a progress bar. The actual storage limit and free space should reflect the real partition that backs `/srv` inside the backend container.

In `container/docker-compose.yaml`, the backend mounts `/home/nlnguyen` → `/srv`. The endpoint must return partition-level stats (total/free bytes) for that path, anchored to the actual host filesystem — not a scanned total of files.

## Decisions

1. **Data type:** System partition stats (total/free), not per-user usage.
2. **Limit source:** Actual partition size returned by `unix.Statfs("/srv")` — no hardcoding.
3. **Auth:** Authenticated (requires valid session).
4. **New endpoint:** `GET /api/storage` with JSON `{ total: number, free: number }` in bytes.
5. **Error handling:** Return 500 on `Statfs` failure; frontend silently shows nothing.

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `backend/http/storage.go` | **Create** | HTTP handler calling `unix.Statfs` on `/srv` |
| `backend/http/httpRouter.go` | **Modify** | Register `GET /api/storage` under `api.HandleFunc`, line ~125 |
| `frontend/src/lib/api/storage.ts` | **Create** | `apiFetch` wrapper for `GET /api/storage` |
| `frontend/src/lib/utils.ts` | **Modify** | Add `formatBytes(bytes: number): string` helper |
| `frontend/src/components/layout/SidebarFooter.tsx` | **Modify** | Fetch storage on mount, replace hardcoded block (lines 33–42) |

## API Response

```
GET /api/storage
Authorization: Bearer <token>

200 OK
Content-Type: application/json

{
  "total": 500000000000,
  "free": 450000000000
}

500 Internal Server Error
(plain text "failed to read storage")
```

## Frontend Display

Replaces the hardcoded block in `SidebarFooter` (lines 33–42):

```tsx
const [storage, setStorage] = useState<{ total: number; free: number } | null>(null);

useEffect(() => {
  getStorage()
    .then(setStorage)
    .catch(() => {}); // silently fail
}, []);

const used  = storage ? storage.total - storage.free : null;
const pct   = storage ? Math.round((used / storage.total) * 100) : null;

// Render (replaces lines 33-42):
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
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    )}
  </div>
</div>
```

`formatBytes(1024)` → `"1 KB"`, `formatBytes(1024*1024)` → `"1 MB"`, `formatBytes(1_500_000_000)` → `"1.4 GB"`.

## Constraints

- `golang.org/x/sys/unix` is already in `go.mod` — no new dependencies.
- No `golang.org/x/sys/unix` usage exists in the backend yet — verify it builds after adding.
- Fetch happens on every mount (no caching) so the bar reflects current usage after uploads/deletes.
- Silent failure: if the fetch fails, the storage indicator area is empty (no loading spinner, no error message).
