# Shares Settings Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Shares" tab to the Settings dialog, letting users view, create, and delete share links. Shares are immutable — path and source cannot be changed after creation; only password and expiration are editable (or delete and recreate).

**Architecture:** New frontend-only files: an API client, a reusable form component (create/edit), and the tab component. The backend already has all required endpoints (`GET /api/share/list`, `POST /api/share`, `DELETE /api/share`). No backend changes needed.

**Tech Stack:** TypeScript/React, Tailwind, lucide-react icons. No new dependencies.

---

## Task 1: Create `frontend/src/lib/api/shares.ts`

**Files:**
- Create: `frontend/src/lib/api/shares.ts`

- [ ] **Step 1: Write the API client**

```typescript
// frontend/src/lib/api/shares.ts
import { apiPath, apiFetch } from "./client";

export interface ShareResponse {
  hash: string;
  source: string; // source name (e.g. "files")
  path: string; // relative path within scope
  expire: number; // Unix timestamp, 0 = never
  hasPassword: boolean;
  downloads: number;
  username: string; // creator username
  pathExists: boolean;
  downloadURL: string;
  shareURL: string;
  // all CommonShare fields also present
  [key: string]: unknown;
}

export interface CreateShareBody {
  path: string;
  source: string;
  password?: string;
  expires?: string; // number as string, e.g. "24"
  unit?: string; // "seconds" | "minutes" | "hours" | "days"
}

export async function getShares(): Promise<ShareResponse[]> {
  return apiFetch<ShareResponse[]>(apiPath("share/list"));
}

export async function createShare(body: CreateShareBody): Promise<ShareResponse> {
  return apiFetch<ShareResponse>(apiPath("share"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteShare(hash: string): Promise<void> {
  await apiFetch(apiPath("share", { hash }), { method: "DELETE" });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/nlnguyen/Documents/fileb/frontend && npx tsc --noEmit src/lib/api/shares.ts 2>&1`
Expected: No errors

---

## Task 2: Create `frontend/src/components/shares/ShareForm.tsx`

**Files:**
- Create: `frontend/src/components/shares/ShareForm.tsx`

This component is used for both create and edit modes. In edit mode, the path and source fields are rendered as read-only display text. Only `password` and `expires`+`unit` are editable.

- [ ] **Step 1: Write the form component**

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ShareResponse } from "@/lib/api/shares";

interface ShareFormProps {
  share?: ShareResponse; // undefined = create mode
  onSubmit: (data: { password?: string; expires?: string; unit?: string }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const UNIT_OPTIONS = [
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

export default function ShareForm({ share, onSubmit, onCancel, saving }: ShareFormProps) {
  const isEdit = !!share;

  const [password, setPassword] = useState("");
  const [expiresEnabled, setExpiresEnabled] = useState(share ? share.expire > 0 : false);
  const [expires, setExpires] = useState(share ? String(Math.round((share.expire - Date.now() / 1000) / 3600)) : "24");
  const [unit, setUnit] = useState("hours");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const data: { password?: string; expires?: string; unit?: string } = {};
    if (password.trim()) {
      data.password = password;
    }
    if (expiresEnabled && expires.trim()) {
      data.expires = expires.trim();
      data.unit = unit;
    }
    await onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border border-border rounded-lg p-4 bg-muted/30"
    >
      {isEdit && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Path</label>
          <p className="text-sm font-mono text-foreground py-1.5 bg-background border border-border rounded px-2">
            {share.source}://{share.path}
          </p>
        </div>
      )}

      {!isEdit && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Path</label>
          <Input
            value={share?.path ?? ""}
            disabled
            className="opacity-60"
          />
          <p className="text-[10px] text-muted-foreground">
            Click a file or folder in the file browser to share it.
          </p>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Password <span className="font-normal">(optional)</span>
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEdit ? "(leave blank to keep current)" : "(no password)"}
        />
        {isEdit && share.hasPassword && (
          <p className="text-[10px] text-muted-foreground">
            Leave blank to keep the current password.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={expiresEnabled}
            onChange={(e) => setExpiresEnabled(e.target.checked)}
            className="accent-primary"
          />
          Set expiration
        </label>
        {expiresEnabled && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="w-20"
              required
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="h-8 text-sm rounded-lg border border-input bg-background px-2"
            >
              {UNIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || (!isEdit && !share?.path)}>
          {saving ? "Saving…" : isEdit ? "Update Share" : "Create Share"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/nlnguyen/Documents/fileb/frontend && npx tsc --noEmit src/components/shares/ShareForm.tsx 2>&1`
Expected: No errors

---

## Task 3: Create `frontend/src/components/shares/ShareTab.tsx`

**Files:**
- Create: `frontend/src/components/shares/ShareTab.tsx`

Mirrors the pattern from `SettingsAdminTab`: loading state, fetch error, filter bar, create/edit form, and a table. Uses `PreferenceSection` from the form UI components.

- [ ] **Step 1: Write the tab component**

```tsx
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, RefreshCw, Copy, Link2 } from "lucide-react";
import { getShares, deleteShare, createShare, type ShareResponse } from "@/lib/api/shares";
import ShareForm from "./ShareForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreferenceSection } from "@/components/ui/form";

function formatExpire(timestamp: number): string {
  if (timestamp === 0) return "Never";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatCreated(): string {
  // Shares don't expose a created-at field; use "—" as a placeholder.
  return "—";
}

export default function ShareTab() {
  const [shares, setShares] = useState<ShareResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editShare, setEditShare] = useState<ShareResponse | undefined>();
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingHash, setDeletingHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getShares();
      setShares(data);
    } catch {
      setFetchError("Failed to load shares. Click retry to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const filteredShares = shares.filter((s) => {
    const term = filter.toLowerCase();
    return (
      s.path.toLowerCase().includes(term) ||
      s.source.toLowerCase().includes(term) ||
      s.username.toLowerCase().includes(term)
    );
  });

  const handleCreate = () => {
    setEditShare(undefined);
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (share: ShareResponse) => {
    setEditShare(share);
    setFormError(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: { password?: string; expires?: string; unit?: string }) => {
    setFormSaving(true);
    setFormError(null);
    try {
      if (editShare) {
        await createShare({
          hash: editShare.hash,
          source: editShare.source,
          path: editShare.path,
          ...data,
        });
      } else {
        throw new Error("Path is required. Select a file or folder to share first.");
      }
      setShowForm(false);
      setEditShare(undefined);
      await loadShares();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save share.";
      setFormError(msg);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (hash: string) => {
    setDeletingHash(hash);
    try {
      await deleteShare(hash);
      setShares((prev) => prev.filter((s) => s.hash !== hash));
    } catch {
      // Keep row visible on error
    } finally {
      setDeletingHash(null);
    }
  };

  const handleCopyLink = async (share: ShareResponse) => {
    try {
      await navigator.clipboard.writeText(share.shareURL);
      setCopiedHash(share.hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="space-y-4">
      <PreferenceSection title="Shared Links">
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter shares…"
              className="flex-1 h-8 text-sm"
            />
            <Button onClick={handleCreate} size="sm" className="shrink-0" disabled={!editShare && !showForm}>
              <Plus size={14} className="mr-1" />
              New Share
            </Button>
            <Button onClick={loadShares} size="sm" variant="ghost" className="shrink-0" disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>

          {/* Error state */}
          {fetchError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle size={14} />
              {fetchError}
            </div>
          )}

          {/* Loading state */}
          {loading && !fetchError && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              Loading shares…
            </div>
          )}

          {/* Create/Edit form */}
          {showForm && (
            <div className="space-y-2">
              {formError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle size={14} />
                  {formError}
                </div>
              )}
              <ShareForm
                share={editShare}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditShare(undefined);
                  setFormError(null);
                }}
                saving={formSaving}
              />
            </div>
          )}

          {/* Shares table */}
          {!loading && !fetchError && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Path</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Created</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Expires</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Protected</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShares.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                        {filter ? `No shares matching "${filter}"` : "No shares yet"}
                      </td>
                    </tr>
                  ) : (
                    filteredShares.map((s) => (
                      <tr key={s.hash} className="border-t border-border hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs px-1 rounded bg-muted text-muted-foreground font-mono">
                              {s.source}
                            </span>
                            <span className="font-medium text-foreground truncate max-w-[200px]" title={s.path}>
                              {s.path}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{formatCreated()}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatExpire(s.expire)}</td>
                        <td className="px-3 py-2">
                          {s.hasPassword ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              Yes
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleCopyLink(s)}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title={copiedHash === s.hash ? "Copied!" : "Copy link"}
                            >
                              {copiedHash === s.hash ? (
                                <span className="text-[10px] text-primary">Copied</span>
                              ) : (
                                <Link2 size={13} />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(s)}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            {deletingHash === s.hash ? (
                              <span className="text-xs text-destructive px-2">Deleting…</span>
                            ) : (
                              <button
                                onClick={() => handleDelete(s.hash)}
                                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PreferenceSection>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/nlnguyen/Documents/fileb/frontend && npx tsc --noEmit src/components/shares/ShareTab.tsx 2>&1`
Expected: No errors

---

## Task 4: Add Shares tab to `SettingsDialog.tsx`

**Files:**
- Modify: `frontend/src/components/layout/SettingsDialog.tsx:1-69`

- [ ] **Step 1: Add the imports**

Add after the existing imports (around line 2-3):

```tsx
import { Link2 } from "lucide-react";
import ShareTab from "@/components/shares/ShareTab";
```

- [ ] **Step 2: Add the tab definition and rendering**

In `SettingsDialog.tsx`, add `"shares"` to the `TabId` type and to the `tabs` array. Add the `Link2` icon to the tab.

The `TabId` type at line 10:
```tsx
type TabId = "profile" | "settings" | "admin" | "shares";
```

The `tabs` array at lines 23-27 — add after the admin tab entry:
```tsx
{ id: "shares", label: "Shares", icon: <Link2 size={16} /> },
```

The tab content rendering at lines 61-63 — add before the closing of the content div:
```tsx
{activeTab === "shares" && <ShareTab />}
```

- [ ] **Step 3: Verify the full dialog type-checks**

Run: `cd /home/nlnguyen/Documents/fileb/frontend && npx tsc --noEmit src/components/layout/SettingsDialog.tsx 2>&1`
Expected: No errors

---

## Task 5: Verify end-to-end

- [ ] **Step 1: Start the backend and frontend**

Run (in a terminal): `cd /home/nlnguyen/Documents/fileb && docker compose -f container/docker-compose.yaml up --build`
Run (in another terminal): `cd /home/nlnguyen/Documents/fileb/frontend && npm run dev`

- [ ] **Step 2: Open Settings → Shares tab**

Open the app, log in, open Settings, click "Shares". The tab should show:
- A "New Share" button (disabled until a file/folder is selected)
- A filter input
- A refresh button
- An empty table with "No shares yet" when no shares exist

- [ ] **Step 3: Test creating a share**

Select a file/folder in the file browser, then click "New Share" in the Shares tab. The form should appear. Fill in optional password and expiration, then click "Create Share". The new share should appear in the table.

- [ ] **Step 4: Test editing a share**

Click the pencil icon on a share. The form should appear with the path shown as read-only text. Change the password and/or expiration, click "Update Share". The share should be updated in the table.

- [ ] **Step 5: Test copy link**

Click the link icon on a share. "Copied" should appear briefly.

- [ ] **Step 6: Test deleting a share**

Click the trash icon on a share. The row should disappear from the table.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/api/shares.ts frontend/src/components/shares/ShareForm.tsx frontend/src/components/shares/ShareTab.tsx frontend/src/components/layout/SettingsDialog.tsx
git commit -m "feat: add Shares tab to Settings with create/edit/delete/copy-link"
```
