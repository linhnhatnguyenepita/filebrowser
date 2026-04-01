# File & Folder Metadata Display — 2026-04-01

## Summary

Modify the backend directory listing API to include a `count` field on folder items (number of immediate, non-hidden children). Update the frontend to display `"{n} items"` for folders and retain the existing formatted file size for files, using the same display slot in both grid and list views.

## Decisions Made

- **Count scope:** immediate children only (not recursive). Matches the standard behavior of macOS Finder and Windows Explorer.
- **Hidden files:** excluded from the count. Consistent with how the backend already filters hidden files from listings.
- **API approach:** add a `count` integer field to each folder object in `folders[]`. No changes to endpoint, parameters, or response envelope.

---

## 1. Backend — API Changes

### Response Shape

`folders[]` items gain a `count` field:

```json
{
  "path": "/",
  "source": "srv",
  "files": [
    { "name": "notes.pdf", "size": 4096, "modified": "2026-04-01T17:00:00Z", "type": "application/pdf", "path": "/notes.pdf" }
  ],
  "folders": [
    { "name": "Documents", "count": 12, "modified": "2026-04-01T16:00:00Z", "type": "directory", "path": "/Documents" }
  ]
}
```

### Implementation

**Files:** wherever `DirectoryResponse` / folder `FileInfo` struct is defined (likely `backend/http/response.go` and/or `backend/files/fileinfo.go`).

When building the folder listing, after filesystem entries are filtered (hidden files excluded per existing rules), `count = len(filteredEntries)`. This value is already computed — it just needs to be stored into the response struct.

- No new endpoint or parameters
- No changes to `files[]` items
- Swagger/OpenAPI docs regenerate automatically via the existing `make dev` swagger generation step

### Error Handling

- If the folder cannot be read (permission denied): `count = 0`
- No other error semantics change

---

## 2. Frontend — Type Update

**File:** `frontend-next/src/lib/api/resources.ts`

Add `count?: number` to the `FileInfo` interface:

```typescript
interface FileInfo {
  name: string;
  size: number;
  modified: string;
  type: string;
  hidden: boolean;
  hasPreview: boolean;
  isShared: boolean;
  path: string;
  source?: string;
  count?: number; // number of immediate children; present only for type === "directory"
}
```

`fetchDirectory` already handles arbitrary fields gracefully (no strict schema enforcement). Adding the field keeps types accurate.

---

## 3. Frontend — Display Changes

### Grid View — `FileCard.tsx`

**Current behavior:** file size shown at bottom in muted text for files; nothing for folders.

**Change:** In the bottom slot, render:
- **File:** formatted file size (B/KB/MB/GB) — unchanged
- **Folder:** `"{n} items"` in muted text

```tsx
// In the file size subtitle area:
const subtitle = item.type === "directory"
  ? item.count != null ? `${item.count} item${item.count === 1 ? "" : "s"}` : null
  : formatFileSize(item.size);
```

If `count` is missing (older backend), render nothing for folders — graceful degradation.

### List View — `FileRow.tsx`

**Current behavior:** `—` in the Size column for folders; formatted file size for files.

**Change:** In the Size column, render:
- **File:** formatted file size — unchanged
- **Folder:** `"{n} items"`

```tsx
// In the Size cell:
const sizeLabel = item.type === "directory"
  ? item.count != null ? `${item.count} item${item.count === 1 ? "" : "s"}` : ""
  : formatFileSize(item.size);
```

Same graceful degradation: empty string if `count` is absent.

### Reusable Formatting

Extract a small helper if helpful to avoid duplication, but since the two components are already separate, inline branching is acceptable.

---

## 4. Files to Modify

| Layer | File |
|---|---|
| Backend | `backend/files/fileinfo.go` — add `Count` field to folder struct |
| Backend | `backend/http/response.go` — include `Count` in folder JSON serialization |
| Backend | Any listing handler that builds folder items — populate `Count` from filtered entry list |
| Frontend | `frontend-next/src/lib/api/resources.ts` — add `count?: number` to `FileInfo` |
| Frontend | `frontend-next/src/components/files/FileCard.tsx` — render item count for folders |
| Frontend | `frontend-next/src/components/files/FileRow.tsx` — render item count for folders in size column |

---

## 5. Out of Scope

- Recursive item counts
- Including hidden files in counts
- Any changes to sorting (count is informational, not a sortable field)
- Changes to `files[]` item metadata
- New API endpoints
- Changes to the sidebar or breadcrumbs
