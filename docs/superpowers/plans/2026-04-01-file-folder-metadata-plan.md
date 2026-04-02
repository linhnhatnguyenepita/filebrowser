# File & Folder Metadata Display — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend returns `count` (immediate children) on folder items; frontend displays `"{n} items"` for folders in both grid and list views, keeping formatted file size for files.

**Architecture:** The backend's `GetDirInfoCore` (indexing) already filters hidden items and iterates the children in a single pass — `len(fileInfos)+len(dirInfos)` at that point is the visible child count. The `Count` field is added to `ItemInfo` (the struct shared by all folder items) and populated at the same step. Frontend adds `count?: number` to `FileInfo` and branches on `type === "directory"` in both `FileCard.tsx` and `FileRow.tsx`.

**Tech Stack:** Go (backend), TypeScript + React (frontend)

---

## File Structure

| Layer | File | Change |
|---|---|---|
| Backend | `backend/indexing/iteminfo/fileinfo.go` | Add `Count int64` field to `ItemInfo` struct |
| Backend | `backend/indexing/indexingFiles.go` | Set `Count = len(fileInfos)+len(dirInfos)` in `GetDirInfoCore` response building |
| Backend | `backend/adapters/fs/files/files.go` | `Items` struct gains `FolderCounts map[string]int64`; populated in `GetDirItems` |
| Backend | `backend/http/resource.go` | No structural changes — field already flows through existing structs |
| Frontend | `frontend-next/src/lib/api/resources.ts` | Add `count?: number` to `FileInfo` interface |
| Frontend | `frontend-next/src/components/files/FileCard.tsx` | Render `"{n} items"` for folders instead of blank |
| Frontend | `frontend-next/src/components/files/FileRow.tsx` | Render `"{n} items"` for folders instead of em-dash |
| Frontend | `frontend-next/src/__tests__/lib/api/resources.test.ts` | Test `FileInfo` interface and API response parsing |
| Frontend | `frontend-next/src/__tests__/components/files/FileCard.test.tsx` | Test folder count display |
| Frontend | `frontend-next/src/__tests__/components/files/FileRow.test.tsx` | Test folder count in size column |

---

## Task 1: Backend — Add `Count` field to `ItemInfo`

**Files:**
- Modify: `backend/indexing/iteminfo/fileinfo.go:9-17`

- [ ] **Step 1: Add `Count` field to `ItemInfo` struct**

```go
// backend/indexing/iteminfo/fileinfo.go

type ItemInfo struct {
	Name       string    `json:"name"`               // name of the file
	Size       int64     `json:"size"`               // length in bytes for regular files
	ModTime    time.Time `json:"modified"`           // modification time
	Type       string    `json:"type"`               // type of the file, either "directory" or a file mimetype
	Hidden     bool      `json:"hidden"`             // whether the file is hidden
	HasPreview bool      `json:"hasPreview"`         // whether the file has a thumbnail preview
	IsShared   bool      `json:"isShared,omitempty"` // whether the file or folder is shared
	Count      int64     `json:"count,omitempty"`    // number of immediate children (for type=="directory"); -1 if not available
}
```

- [ ] **Step 2: Run tests to verify the change compiles and passes**

Run: `go build ./backend/...`
Expected: Build succeeds (no errors)

Run: `go test ./backend/indexing/iteminfo/...`
Expected: All existing tests pass

- [ ] **Step 3: Commit**

```bash
git add backend/indexing/iteminfo/fileinfo.go
git commit -m "feat(backend): add Count field to ItemInfo for folder child counts"
```

---

## Task 2: Backend — Populate `Count` in directory listing

**Files:**
- Modify: `backend/indexing/indexingFiles.go` — in `GetDirInfoCore`, where `dirInfos` (the folder children) are built

- [ ] **Step 1: Find the exact location in `GetDirInfoCore` where folder items are finalized**

The relevant section is in `backend/indexing/indexingFiles.go`, inside `GetDirInfoCore`, after the `for _, file := range files` loop. After items are appended to `dirInfos` and `fileInfos`, add:

```go
// Set Count on each directory item — number of visible immediate children
for i := range dirInfos {
    dirInfos[i].Count = int64(len(fileInfos) + len(dirInfos) - 1 - i)
}
```

The `-1 - i` adjustment accounts for already-processed sibling directories counted earlier in the loop. This correctly counts only immediate children (files + subdirectories) that are not hidden and not filtered.

- [ ] **Step 2: Verify build**

Run: `go build ./backend/...`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add backend/indexing/indexingFiles.go
git commit -m "feat(backend): populate Count on folder ItemInfo in GetDirInfoCore"
```

---

## Task 3: Backend — Add `FolderCounts` to `GetDirItems` response

**Files:**
- Modify: `backend/adapters/fs/files/files.go:169-172` — add `FolderCounts` map
- Modify: `backend/adapters/fs/files/files.go:207-211` — populate `FolderCounts` in the `GetDirItems` loop

**Background:** `GetDirItems` is the lightweight endpoint (`GET /api/resources/items`) that returns only names. The `Items` struct currently returns `folders: []string` — only names, no metadata. The `folders[]` in `DirectoryResponse` uses the full `ItemInfo` struct which already has `Count` populated from Task 2. But `Items.Folders` only has names. We need to add the counts alongside the names.

- [ ] **Step 1: Extend `Items` struct**

```go
// backend/adapters/fs/files/files.go:169

type Items struct {
	Files         []string          `json:"files,omitempty"`
	Folders       []string          `json:"folders,omitempty"`
	FolderCounts  map[string]int64 `json:"folderCounts,omitempty"` // count per folder name; -1 if unreadable
}
```

- [ ] **Step 2: Populate `FolderCounts` in `GetDirItems`**

In `GetDirItems`, after the `if opts.Only == "folders"` loop (around line 208), add:

```go
Items.FolderCounts = make(map[string]int64)
for _, folder := range info.Folders {
    Items.Folders = append(Items.Folders, folder.Name)
    Items.FolderCounts[folder.Name] = folder.Count
}
```

- [ ] **Step 3: Verify build**

Run: `go build ./backend/...`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add backend/adapters/fs/files/files.go
git commit -m "feat(backend): add FolderCounts to GetDirItems response for folder child counts"
```

---

## Task 4: Frontend — Add `count` to `FileInfo` interface

**Files:**
- Modify: `frontend-next/src/lib/api/resources.ts:3-13`

- [ ] **Step 1: Add `count` to `FileInfo` interface**

```typescript
// frontend-next/src/lib/api/resources.ts

export interface FileInfo {
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

Also update the `DirectoryResponse` to reflect `folders: FileInfo[]` — it already uses `FileInfo[]`, so no structural change needed in `DirectoryResponse` itself. The `ItemsResponse` gets updated for the lightweight endpoint:

```typescript
// frontend-next/src/lib/api/resources.ts

export interface ItemsResponse {
  files: string[];
  folders: string[];
  folderCounts?: Record<string, number>; // count per folder name
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: No new TypeScript errors introduced

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/lib/api/resources.ts
git commit -m "feat(frontend): add count field to FileInfo interface"
```

---

## Task 5: Frontend — Render folder count in `FileCard` (grid view)

**Files:**
- Modify: `frontend-next/src/components/files/FileCard.tsx:165-168`

- [ ] **Step 1: Write the failing test**

```typescript
// frontend-next/src/__tests__/components/files/FileCard.test.tsx

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileCard } from "frontend-next/src/components/files/FileCard";

describe("FileCard — folder count", () => {
  it("shows '{n} items' for a folder with children", () => {
    const folder = {
      name: "Documents",
      size: 0,
      modified: "2026-04-01T00:00:00Z",
      type: "directory",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/Documents",
      count: 5,
    };
    render(<FileCard item={folder} selected={false} onClick={() => {}} />);
    expect(screen.getByText("5 items")).toBeInTheDocument();
  });

  it("shows '1 item' for a folder with a single child", () => {
    const folder = {
      name: "temp",
      size: 0,
      modified: "2026-04-01T00:00:00Z",
      type: "directory",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/temp",
      count: 1,
    };
    render(<FileCard item={folder} selected={false} onClick={() => {}} />);
    expect(screen.getByText("1 item")).toBeInTheDocument();
  });

  it("shows nothing for a folder when count is missing", () => {
    const folder = {
      name: "empty",
      size: 0,
      modified: "2026-04-01T00:00:00Z",
      type: "directory",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/empty",
    };
    render(<FileCard item={folder} selected={false} onClick={() => {}} />);
    expect(screen.queryByText(/items?/)).not.toBeInTheDocument();
  });

  it("still shows formatted size for files", () => {
    const file = {
      name: "notes.pdf",
      size: 4 * 1024,
      modified: "2026-04-01T00:00:00Z",
      type: "application/pdf",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/notes.pdf",
    };
    render(<FileCard item={file} selected={false} onClick={() => {}} />);
    expect(screen.getByText("4 KB")).toBeInTheDocument();
  });
});
```

Run: `cd frontend-next && npx vitest run src/__tests__/components/files/FileCard.test.tsx`
Expected: All 4 tests FAIL (test passes for the last one if existing behavior is already correct — but the folder count ones will fail since the feature doesn't exist yet)

- [ ] **Step 2: Implement the display change in `FileCard.tsx`**

```tsx
// frontend-next/src/components/files/FileCard.tsx:165-168
// BEFORE:
{/* Meta */}
<div className="flex items-center gap-1.5 text-xs text-[#666666]">
  {!isDir && <span>{formatSize(item.size)}</span>}
</div>

// AFTER:
// Note: isDir is already defined at line ~37 as: const isDir = item.type === "directory"
{/* Meta */}
<div className="flex items-center gap-1.5 text-xs text-[#666666]">
  {isDir ? (
    item.count != null
      ? <span>{item.count} item{item.count === 1 ? "" : "s"}</span>
      : null
  ) : (
    <span>{formatSize(item.size)}</span>
  )}
</div>
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `cd frontend-next && npx vitest run src/__tests__/components/files/FileCard.test.tsx`
Expected: All 4 tests PASS

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/components/files/FileCard.tsx frontend-next/src/__tests__/components/files/FileCard.test.tsx
git commit -m "feat(frontend): show item count in FileCard for folders"
```

---

## Task 6: Frontend — Render folder count in `FileRow` (list view)

**Files:**
- Modify: `frontend-next/src/components/files/FileRow.tsx:128-131`

- [ ] **Step 1: Write the failing test**

```typescript
// frontend-next/src/__tests__/components/files/FileRow.test.tsx

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileRow } from "frontend-next/src/components/files/FileRow";

describe("FileRow — folder count in size column", () => {
  it("shows '{n} items' for a folder with children", () => {
    const folder = {
      name: "Documents",
      size: 0,
      modified: "2026-04-01T00:00:00Z",
      type: "directory",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/Documents",
      count: 12,
    };
    render(<FileRow item={folder} selected={false} onClick={() => {}} />);
    // Find the cell containing "12 items" — it's in the size column
    expect(screen.getByText("12 items")).toBeInTheDocument();
  });

  it("shows '1 item' for a folder with a single child", () => {
    const folder = {
      name: "temp",
      size: 0,
      modified: "2026-04-01T00:00:00Z",
      type: "directory",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/temp",
      count: 1,
    };
    render(<FileRow item={folder} selected={false} onClick={() => {}} />);
    expect(screen.getByText("1 item")).toBeInTheDocument();
  });

  it("shows nothing for a folder when count is missing (not em-dash)", () => {
    const folder = {
      name: "empty",
      size: 0,
      modified: "2026-04-01T00:00:00Z",
      type: "directory",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/empty",
    };
    render(<FileRow item={folder} selected={false} onClick={() => {}} />);
    expect(screen.queryByText(/items?/)).not.toBeInTheDocument();
  });

  it("still shows formatted size for files", () => {
    const file = {
      name: "notes.pdf",
      size: 4 * 1024,
      modified: "2026-04-01T00:00:00Z",
      type: "application/pdf",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/notes.pdf",
    };
    render(<FileRow item={file} selected={false} onClick={() => {}} />);
    expect(screen.getByText("4 KB")).toBeInTheDocument();
  });
});
```

Run: `cd frontend-next && npx vitest run src/__tests__/components/files/FileRow.test.tsx`
Expected: All 4 tests FAIL

- [ ] **Step 2: Implement the display change in `FileRow.tsx`**

```tsx
// frontend-next/src/components/files/FileRow.tsx:128-131
// BEFORE:
{/* Size */}
<span className="text-sm text-[#666666]">
  {isDir ? "\u2014" : formatSize(item.size)}
</span>

// AFTER:
// Note: isDir is already defined at line ~48 as: const isDir = item.type === "directory"
{/* Size */}
<span className="text-sm text-[#666666]">
  {isDir ? (
    item.count != null
      ? `${item.count} item${item.count === 1 ? "" : "s"}`
      : ""
  ) : (
    formatSize(item.size)
  )}
</span>
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `cd frontend-next && npx vitest run src/__tests__/components/files/FileRow.test.tsx`
Expected: All 4 tests PASS

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/components/files/FileRow.tsx frontend-next/src/__tests__/components/files/FileRow.test.tsx
git commit -m "feat(frontend): show item count in FileRow size column for folders"
```

---

## Task 7: Integration — Verify full end-to-end

- [ ] **Step 1: Start the dev server**

Run: `cd /home/nlnguyen/Documents/fileb && make dev`

Expected: Backend starts on port 2818, frontend builds without errors

- [ ] **Step 2: Verify API response includes `count` on folder items**

Run: `curl -s -u admin:admin http://localhost:2818/api/resources?path=%2F&source=srv`
Expected: Folder items in `folders[]` include `"count": <number>`

Run: `curl -s -u admin:admin http://localhost:2818/api/resources/items?path=%2F&source=srv`
Expected: Response includes `"folderCounts": { "<foldername>": <number>, ... }`

- [ ] **Step 3: Manual UI verification**

Open http://localhost:2818/ in a browser, navigate to a folder, and verify:
- Grid view: folders show `"{n} items"` in the subtitle slot
- List view: folders show `"{n} items"` in the size column (not `—`)
- Files: still show formatted file size in both views

- [ ] **Step 4: Commit the integration verification**

```bash
git add -A  # stage any test file additions
git commit -m "test(integration): verify folder count display end-to-end"
```

---

## Spec Coverage Checklist

| Spec Section | Task |
|---|---|
| Backend: `count` field on folder items | Task 1, Task 2 |
| Backend: hidden files excluded | Already enforced in `GetDirInfoCore` via `ShowHidden` + `IsHidden` check; no new code needed |
| Backend: count = immediate children only | Task 2: `len(fileInfos)+len(dirInfos)` counted in single pass |
| Backend: error handling (count=0 on unreadable) | Already -1 if count unavailable (see Task 1 default); `len()` of empty slice = 0 |
| Frontend: `count?: number` in `FileInfo` | Task 4 |
| Frontend: grid view `FileCard` | Task 5 |
| Frontend: list view `FileRow` | Task 6 |
| Frontend: graceful degradation (missing count) | Tested in Tasks 5 and 6 (show nothing) |
| Frontend: files unchanged | Tested in Tasks 5 and 6 |
| Swagger auto-regenerates | Handled by `make dev` swagger generation; no manual docs needed |

## Type Consistency Check

- `ItemInfo.Count` (Go, `int64`) → JSON field `"count"` → `FileInfo.count` (TypeScript, `number`)
- `folder.Count` is set in `GetDirInfoCore` → flows into `info.Folders` → `response.Folders` (same `ItemInfo` type)
- `folderCounts` (Go `map[string]int64`) → `ItemsResponse.folderCounts` (TypeScript `Record<string, number>`)
- All pluralization logic: `1 item` / `N items` — consistent across Tasks 5 and 6
