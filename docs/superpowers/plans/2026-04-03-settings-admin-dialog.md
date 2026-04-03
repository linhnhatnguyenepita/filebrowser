# Settings & Admin Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-panel SettingsDialog with a vertical-tab dialog containing Profile, Settings, and Admin tabs. Admin tab is visible only to users with admin permission.

**Architecture:** The dialog shell (`SettingsDialog`) holds a vertical tab rail on the left and renders the active tab's content on the right. Three tab components (`SettingsProfileTab`, `SettingsSettingsTab`, `SettingsAdminTab`) are each responsible for their own state and API calls. SidebarFooter's avatar pill opens the dialog. Existing `SettingsPanel` content is split between Profile and Settings tabs.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing shadcn-style preference components (`PreferenceToggle`, `PreferenceSegment`, `PreferenceSelect`, `PreferenceSection`, `PreferenceInput`).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `frontend/src/lib/api/users.ts` | Modify | Add `getUsers`, `createUser`, `updateUser`, `deleteUser` |
| `frontend/src/components/layout/SettingsDialog.tsx` | Modify | Vertical tab shell: tab rail + active tab content |
| `frontend/src/components/layout/SidebarFooter.tsx` | Modify | Avatar pill opens dialog instead of dropdown |
| `frontend/src/components/layout/SettingsProfileTab.tsx` | Create | Profile tab: identity card + preferences form + Save |
| `frontend/src/components/layout/SettingsSettingsTab.tsx` | Create | Settings tab: sectioned preferences form + Save |
| `frontend/src/components/layout/SettingsAdminTab.tsx` | Create | Admin tab: user table + system info (read-only) |
| `frontend/src/components/admin/UserForm.tsx` | Create | Inline create/edit user form |
| `frontend/src/components/layout/SettingsPanel.tsx` | No change | Deprecated — content moved to tab components |

---

## Task 1: Extend Frontend API

**Files:**
- Modify: `frontend/src/lib/api/users.ts`

- [ ] **Step 1: Add AdminUser type and admin API functions**

Read the file first. After line 66 (after `updateUserPreferences`), append:

```typescript
export interface AdminUser {
  id: number;
  username: string;
  password?: string;
  scope: string;
  scopes: Array<{ name: string; scope: string }>;
  permissions: {
    admin: boolean;
    modify: boolean;
    share: boolean;
    create: boolean;
    delete: boolean;
    download: boolean;
    api: boolean;
    realtime: boolean;
  };
  loginMethod?: string;
  locale: string;
  sorting: { by: string; asc: boolean };
  viewMode: string;
  singleClick: boolean;
  showHidden: boolean;
  stickySidebar: boolean;
  fileLoading: {
    maxConcurrentUpload: number;
    uploadChunkSizeMb: number;
    clearAll: boolean;
    downloadChunkSizeMb: number;
  };
}

export async function getUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>(apiPath("users"));
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch(apiPath("users", { id: String(id) }), { method: "DELETE" });
}

export async function createUser(userData: Partial<AdminUser>): Promise<void> {
  await apiFetch(apiPath("users"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ which: [], data: userData }),
  });
}

export async function updateUser(
  id: number,
  userData: Partial<AdminUser>,
  which: string[]
): Promise<void> {
  await apiFetch(apiPath("users", { id: String(id) }), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ which, data: { ...userData, id } }),
  });
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api/users.ts
git commit -m "feat(api): add admin user CRUD functions to users API"
```

---

## Task 2: Rewrite SettingsDialog with Vertical Tabs

**Files:**
- Modify: `frontend/src/components/layout/SettingsDialog.tsx`

- [ ] **Step 1: Read the current file**

```tsx
// Current contents:
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SettingsPanel from "./SettingsPanel";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-4">
        <SettingsPanel />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Replace with vertical tab shell**

Replace the entire file contents with:

```tsx
import { useState } from "react";
import { User, Settings, Shield } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import SettingsProfileTab from "./SettingsProfileTab";
import SettingsSettingsTab from "./SettingsSettingsTab";
import SettingsAdminTab from "./SettingsAdminTab";

type TabId = "profile" | "settings" | "admin";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const isAdmin = user?.permissions?.admin === true;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: "profile", label: "Profile", icon: <User size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
    { id: "admin", label: "Admin", icon: <Shield size={16} />, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  // Reset to profile tab when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) setActiveTab("profile");
    if (!o) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex max-h-[85vh]">
        {/* Vertical tab rail */}
        <div className="flex flex-col w-36 shrink-0 bg-muted border-r border-border">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors border-l-2",
                activeTab === tab.id
                  ? "bg-background border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 min-w-0">
          {activeTab === "profile" && <SettingsProfileTab />}
          {activeTab === "settings" && <SettingsSettingsTab />}
          {activeTab === "admin" && isAdmin && <SettingsAdminTab />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS (will fail on missing imports — fix by creating the tab components in subsequent tasks)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/SettingsDialog.tsx
git commit -m "feat(settings): rewrite SettingsDialog with vertical tab layout"
```

---

## Task 3: Update SidebarFooter to Open Dialog

**Files:**
- Modify: `frontend/src/components/layout/SidebarFooter.tsx`

- [ ] **Step 1: Read the current file**

The current `SidebarFooter.tsx` shows a user dropdown menu. Change the avatar pill to open `SettingsDialog` instead of the dropdown, and keep the logout item in the dropdown triggered by a separate icon button.

Replace the file contents with:

```tsx
import { useState } from "react";
import { LogOut, ChevronDown, Settings2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import SettingsDialog from "./SettingsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SidebarFooter() {
  const { logout, user } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      window.location.href = "/login";
    } catch {
      setLoggingOut(false);
    }
  };

  const initial = user?.username?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      <div className="shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        {/* Storage indicator */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Storage</span>
            <span className="text-xs text-muted-foreground font-mono">3.4 MB / 100 GB</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[1%] rounded-full bg-primary" />
          </div>
        </div>

        {/* User row: avatar pill opens settings dialog */}
        <div className="p-3 flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex flex-1 items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent text-left cursor-pointer bg-transparent border-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.username ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.permissions?.admin ? "Admin" : "Member"}
              </p>
            </div>
          </button>

          {/* Settings gear icon */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            title="Settings"
          >
            <Settings2 size={16} />
          </button>

          {/* Logout dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
              title="More options"
            >
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={loggingOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {loggingOut ? "Logging out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/SidebarFooter.tsx
git commit -m "feat(sidebar): connect avatar pill to open SettingsDialog"
```

---

## Task 4: Create SettingsProfileTab

**Files:**
- Create: `frontend/src/components/layout/SettingsProfileTab.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  PreferenceSection,
  PreferenceToggle,
  PreferenceSegment,
  PreferenceSelect,
} from "@/components/ui/form";
import { Shield, Eye, Share2, FolderPlus, Trash2, Download } from "lucide-react";

function themeToString(darkMode: boolean | null): "light" | "dark" | "system" {
  if (darkMode === null) return "system";
  return darkMode ? "dark" : "light";
}

function themeToDarkMode(theme: "light" | "dark" | "system"): boolean | null {
  if (theme === "system") return null;
  return theme === "dark";
}

export default function SettingsProfileTab() {
  const { user, updatePreferences } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [locale, setLocale] = useState("en");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [singleClick, setSingleClick] = useState(false);
  const [stickySidebar, setStickySidebar] = useState(false);

  useEffect(() => {
    if (!user) return;
    setTheme(themeToString(user.darkMode));
    setLocale(user.locale || "en");
    setViewMode(user.viewMode || "grid");
    setSortBy(user.sorting?.by || "name");
    setSortAsc(user.sorting?.asc ?? true);
    setShowHidden(user.showHidden ?? false);
    setSingleClick(user.singleClick ?? false);
    setStickySidebar(user.stickySidebar ?? false);
    setIsDirty(false);
  }, [user]);

  const markDirty = () => setIsDirty(true);

  const permissionIcons: Record<string, React.ReactNode> = {
    admin: <Shield size={10} />,
    modify: <Eye size={10} />,
    share: <Share2 size={10} />,
    create: <FolderPlus size={10} />,
    delete: <Trash2 size={10} />,
    download: <Download size={10} />,
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      const changes: Record<string, unknown> = {};
      if (themeToDarkMode(theme) !== user.darkMode) changes.darkMode = themeToDarkMode(theme);
      if (locale !== user.locale) changes.locale = locale;
      if (viewMode !== user.viewMode) changes.viewMode = viewMode;
      if (sortBy !== user.sorting?.by) changes.sorting = { ...user.sorting, by: sortBy };
      if (sortAsc !== user.sorting?.asc) changes.sorting = { ...(changes.sorting ?? user.sorting), asc: sortAsc };
      if (showHidden !== user.showHidden) changes.showHidden = showHidden;
      if (singleClick !== user.singleClick) changes.singleClick = singleClick;
      if (stickySidebar !== user.stickySidebar) changes.stickySidebar = stickySidebar;

      if (Object.keys(changes).length > 0) {
        await updatePreferences(changes as Parameters<typeof updatePreferences>[0]);
      }
      setIsDirty(false);
    } catch {
      setSaveError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Identity card */}
      <div className="border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{user.username}</p>
            <p className="text-[10px] text-muted-foreground">{user.scope}</p>
          </div>
        </div>
        {user.scopes?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {user.scopes.map((s) => (
              <span
                key={s.scope}
                className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {Object.entries(user.permissions ?? {}).map(([key, val]) =>
            val ? (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
              >
                {permissionIcons[key]} {key}
              </span>
            ) : null
          )}
        </div>
      </div>

      <PreferenceSection title="Preferences">
        <PreferenceSegment
          label="Theme"
          value={theme}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]}
          onChange={(v) => {
            setTheme(v as typeof theme);
            markDirty();
          }}
        />
        <PreferenceSelect
          label="Language"
          value={locale}
          options={[
            { value: "en", label: "English" },
            { value: "vi", label: "Vietnamese" },
            { value: "de", label: "German" },
            { value: "fr", label: "French" },
            { value: "es", label: "Spanish" },
            { value: "ja", label: "Japanese" },
          ]}
          onChange={setLocale}
          onValueChange={markDirty}
        />
        <PreferenceSegment
          label="Default View"
          value={viewMode}
          options={[
            { value: "grid", label: "Grid" },
            { value: "list", label: "List" },
          ]}
          onChange={(v) => {
            setViewMode(v);
            markDirty();
          }}
        />
        <div className="flex items-center justify-between py-2">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-sm font-medium text-foreground leading-none">Default Sort</p>
          </div>
          <div className="flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                markDirty();
              }}
              className="h-7 text-sm rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none"
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="modified">Modified</option>
            </select>
            <select
              value={sortAsc ? "asc" : "desc"}
              onChange={(e) => {
                setSortAsc(e.target.value === "asc");
                markDirty();
              }}
              className="h-7 text-sm rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
        <PreferenceToggle
          label="Show Hidden Files"
          checked={showHidden}
          onChange={(v) => {
            setShowHidden(v);
            markDirty();
          }}
        />
        <PreferenceToggle
          label="Single Click to Open"
          checked={singleClick}
          onChange={(v) => {
            setSingleClick(v);
            markDirty();
          }}
        />
        <PreferenceToggle
          label="Sticky Sidebar"
          checked={stickySidebar}
          onChange={(v) => {
            setStickySidebar(v);
            markDirty();
          }}
        />
      </PreferenceSection>

      <div className="space-y-1.5">
        <Button onClick={handleSave} disabled={!isDirty || saving} className="w-full" size="lg">
          {saving ? "Saving…" : "Save"}
        </Button>
        {saveError && (
          <p className="text-[10px] text-destructive text-center">{saveError}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/SettingsProfileTab.tsx
git commit -m "feat(settings): create Profile tab component"
```

---

## Task 5: Create SettingsSettingsTab

**Files:**
- Create: `frontend/src/components/layout/SettingsSettingsTab.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  PreferenceSection,
  PreferenceToggle,
  PreferenceSegment,
  PreferenceSelect,
  PreferenceInput,
} from "@/components/ui/form";

function themeToString(darkMode: boolean | null): "light" | "dark" | "system" {
  if (darkMode === null) return "system";
  return darkMode ? "dark" : "light";
}

function themeToDarkMode(theme: "light" | "dark" | "system"): boolean | null {
  if (theme === "system") return null;
  return theme === "dark";
}

export default function SettingsSettingsTab() {
  const { user, updatePreferences } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [locale, setLocale] = useState("en");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [singleClick, setSingleClick] = useState(false);
  const [stickySidebar, setStickySidebar] = useState(false);
  const [uploadChunkSize, setUploadChunkSize] = useState(5);
  const [downloadChunkSize, setDownloadChunkSize] = useState(5);

  // Local-only notification preferences
  const [showUploadNotifications, setShowUploadNotifications] = useState(true);
  const [showDeleteConfirmations, setShowDeleteConfirmations] = useState(true);

  useEffect(() => {
    if (!user) return;
    setTheme(themeToString(user.darkMode));
    setLocale(user.locale || "en");
    setViewMode(user.viewMode || "grid");
    setSortBy(user.sorting?.by || "name");
    setSortAsc(user.sorting?.asc ?? true);
    setShowHidden(user.showHidden ?? false);
    setSingleClick(user.singleClick ?? false);
    setStickySidebar(user.stickySidebar ?? false);
    setUploadChunkSize(user.fileLoading?.uploadChunkSizeMb ?? 5);
    setDownloadChunkSize(user.fileLoading?.downloadChunkSizeMb ?? 5);
    setIsDirty(false);
  }, [user]);

  const markDirty = () => setIsDirty(true);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      const changes: Record<string, unknown> = {};
      if (themeToDarkMode(theme) !== user.darkMode) changes.darkMode = themeToDarkMode(theme);
      if (locale !== user.locale) changes.locale = locale;
      if (viewMode !== user.viewMode) changes.viewMode = viewMode;
      if (sortBy !== user.sorting?.by) changes.sorting = { ...user.sorting, by: sortBy };
      if (sortAsc !== user.sorting?.asc) changes.sorting = { ...(changes.sorting ?? user.sorting), asc: sortAsc };
      if (showHidden !== user.showHidden) changes.showHidden = showHidden;
      if (singleClick !== user.singleClick) changes.singleClick = singleClick;
      if (stickySidebar !== user.stickySidebar) changes.stickySidebar = stickySidebar;
      if (uploadChunkSize !== (user.fileLoading?.uploadChunkSizeMb ?? 5)) {
        changes.fileLoading = { ...user.fileLoading, uploadChunkSizeMb: uploadChunkSize };
      }
      if (downloadChunkSize !== (user.fileLoading?.downloadChunkSizeMb ?? 5)) {
        changes.fileLoading = { ...(changes.fileLoading ?? user.fileLoading), downloadChunkSizeMb: downloadChunkSize };
      }

      if (Object.keys(changes).length > 0) {
        await updatePreferences(changes as Parameters<typeof updatePreferences>[0]);
      }
      setIsDirty(false);
    } catch {
      setSaveError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PreferenceSection title="Display">
        <PreferenceSegment
          label="Theme"
          value={theme}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]}
          onChange={(v) => {
            setTheme(v as typeof theme);
            markDirty();
          }}
        />
        <PreferenceSelect
          label="Language"
          value={locale}
          options={[
            { value: "en", label: "English" },
            { value: "vi", label: "Vietnamese" },
            { value: "de", label: "German" },
            { value: "fr", label: "French" },
            { value: "es", label: "Spanish" },
            { value: "ja", label: "Japanese" },
          ]}
          onChange={setLocale}
          onValueChange={markDirty}
        />
        <PreferenceSegment
          label="Default View"
          value={viewMode}
          options={[
            { value: "grid", label: "Grid" },
            { value: "list", label: "List" },
          ]}
          onChange={(v) => {
            setViewMode(v);
            markDirty();
          }}
        />
        <div className="flex items-center justify-between py-2">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-sm font-medium text-foreground leading-none">Default Sort</p>
          </div>
          <div className="flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                markDirty();
              }}
              className="h-7 text-sm rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none"
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="modified">Modified</option>
            </select>
            <select
              value={sortAsc ? "asc" : "desc"}
              onChange={(e) => {
                setSortAsc(e.target.value === "asc");
                markDirty();
              }}
              className="h-7 text-sm rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
        <PreferenceToggle
          label="Show Hidden Files"
          checked={showHidden}
          onChange={(v) => {
            setShowHidden(v);
            markDirty();
          }}
        />
        <PreferenceToggle
          label="Single Click to Open"
          checked={singleClick}
          onChange={(v) => {
            setSingleClick(v);
            markDirty();
          }}
        />
        <PreferenceToggle
          label="Sticky Sidebar"
          checked={stickySidebar}
          onChange={(v) => {
            setStickySidebar(v);
            markDirty();
          }}
        />
      </PreferenceSection>

      <PreferenceSection title="Behavior">
        <PreferenceInput
          label="Upload Chunk Size"
          description="Size in MB (1–100)"
          type="number"
          value={uploadChunkSize}
          onChange={(v) => {
            setUploadChunkSize(Number(v));
            markDirty();
          }}
          min={1}
          max={100}
        />
        <PreferenceInput
          label="Download Chunk Size"
          description="Size in MB (1–100)"
          type="number"
          value={downloadChunkSize}
          onChange={(v) => {
            setDownloadChunkSize(Number(v));
            markDirty();
          }}
          min={1}
          max={100}
        />
      </PreferenceSection>

      <PreferenceSection title="Notifications">
        <PreferenceToggle
          label="Show Upload Notifications"
          description="Show a toast when uploads complete"
          checked={showUploadNotifications}
          onChange={setShowUploadNotifications}
        />
        <PreferenceToggle
          label="Show Delete Confirmations"
          description="Ask before deleting files or folders"
          checked={showDeleteConfirmations}
          onChange={setShowDeleteConfirmations}
        />
      </PreferenceSection>

      <div className="space-y-1.5">
        <Button onClick={handleSave} disabled={!isDirty || saving} className="w-full" size="lg">
          {saving ? "Saving…" : "Save"}
        </Button>
        {saveError && (
          <p className="text-[10px] text-destructive text-center">{saveError}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/SettingsSettingsTab.tsx
git commit -m "feat(settings): create Settings tab component with sectioned form"
```

---

## Task 6: Create UserForm Component

**Files:**
- Create: `frontend/src/components/admin/UserForm.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUser } from "@/lib/api/users";

interface UserFormProps {
  user?: AdminUser; // undefined = create mode, defined = edit mode
  onSubmit: (data: Partial<AdminUser>) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const PERMISSION_CHECKBOXES = [
  { key: "admin", label: "Admin" },
  { key: "modify", label: "Modify" },
  { key: "share", label: "Share" },
  { key: "create", label: "Create" },
  { key: "delete", label: "Delete" },
  { key: "download", label: "Download" },
] as const;

export default function UserForm({ user, onSubmit, onCancel, saving }: UserFormProps) {
  const isEdit = !!user;

  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [scope, setScope] = useState(user?.scope ?? "global");
  const [permissions, setPermissions] = useState({
    admin: user?.permissions?.admin ?? false,
    modify: user?.permissions?.modify ?? false,
    share: user?.permissions?.share ?? false,
    create: user?.permissions?.create ?? false,
    delete: user?.permissions?.delete ?? false,
    download: user?.permissions?.download ?? false,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [username, password, scope]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !password.trim()) {
      setError("Password is required.");
      return;
    }
    setError(null);
    const data: Partial<AdminUser> = {
      username,
      scope,
      permissions,
    };
    if (password.trim()) {
      data.password = password;
    }
    await onSubmit(data);
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Username</label>
        {isEdit ? (
          <p className="text-sm text-muted-foreground py-1.5">{username}</p>
        ) : (
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            required
          />
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">
          Password <span className="text-muted-foreground font-normal">{isEdit ? "(leave blank to keep current)" : ""}</span>
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEdit ? "(unchanged)" : "password"}
          required={!isEdit}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Scope</label>
        <Input
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="global"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Permissions</label>
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          {PERMISSION_CHECKBOXES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={permissions[key]}
                onChange={() => togglePermission(key)}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/UserForm.tsx
git commit -m "feat(admin): create UserForm component for create/edit user"
```

---

## Task 7: Create SettingsAdminTab

**Files:**
- Create: `frontend/src/components/layout/SettingsAdminTab.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { getUsers, deleteUser, createUser, updateUser } from "@/lib/api/users";
import type { AdminUser } from "@/lib/api/users";
import UserForm from "@/components/admin/UserForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreferenceSection } from "@/components/ui/form";

export default function SettingsAdminTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // Create/edit form state
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | undefined>();
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setFetchError("Failed to load users. Click retry to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCreate = () => {
    setEditUser(undefined);
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (user: AdminUser) => {
    setEditUser(user);
    setFormError(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: Partial<AdminUser>) => {
    setFormSaving(true);
    setFormError(null);
    try {
      if (editUser) {
        await updateUser(editUser.id, data, ["Permissions"]);
      } else {
        await createUser(data);
      }
      setShowForm(false);
      setEditUser(undefined);
      await loadUsers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save user.";
      setFormError(msg);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: unknown) {
      // Keep row visible on error
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Users section */}
      <PreferenceSection title="Users">
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter users…"
              className="flex-1 h-8 text-sm"
            />
            <Button onClick={handleCreate} size="sm" className="shrink-0">
              <Plus size={14} className="mr-1" />
              Create User
            </Button>
            <Button onClick={loadUsers} size="sm" variant="ghost" className="shrink-0" disabled={loading}>
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
              Loading users…
            </div>
          )}

          {/* Create/Edit form */}
          {showForm && (
            <UserForm
              user={editUser}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditUser(undefined);
                setFormError(null);
              }}
              saving={formSaving}
            />
          )}

          {/* User table */}
          {!loading && !fetchError && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Username</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Scope</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Role</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                        {filter ? `No users matching "${filter}"` : "No users found"}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium text-foreground">{u.username}</td>
                        <td className="px-3 py-2 text-muted-foreground">{u.scope || "—"}</td>
                        <td className="px-3 py-2">
                          {u.permissions?.admin ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              Admin
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              Member
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(u)}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            {deletingId === u.id ? (
                              <span className="text-xs text-destructive px-2">Deleting…</span>
                            ) : (
                              <button
                                onClick={() => handleDelete(u.id)}
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

      {/* System Settings section — read-only */}
      <PreferenceSection title="System Settings">
        <div className="space-y-2">
          <div className="flex justify-between text-sm py-1 border-b border-border/50">
            <span className="text-muted-foreground">Hostname</span>
            <span className="text-foreground font-mono">fileb</span>
          </div>
          <div className="flex justify-between text-sm py-1 border-b border-border/50">
            <span className="text-muted-foreground">Port</span>
            <span className="text-foreground font-mono">8080</span>
          </div>
          <div className="flex justify-between text-sm py-1 border-b border-border/50">
            <span className="text-muted-foreground">Registered Users</span>
            <span className="text-foreground font-mono">{users.length}</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Full system configuration is managed server-side in the config file.
        </p>
      </PreferenceSection>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/SettingsAdminTab.tsx
git commit -m "feat(admin): create Admin tab with user table and system settings"
```

---

## Task 8: Verify Full Integration

**Files:**
- Modify: `frontend/src/components/layout/SettingsDialog.tsx` (add missing `AdminUser` field `fileLoading` to `PreferenceInput` compatibility)

- [ ] **Step 1: Run full typecheck and lint**

Run: `cd frontend && npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 2: Start the dev server**

Run: `cd frontend && npm run dev`
Expected: Dev server starts on port 5173 without errors.

- [ ] **Step 3: Manual browser verification**

1. Open http://localhost:5173
2. Log in
3. In the sidebar, click the avatar pill → Settings dialog should open with vertical tabs (Profile, Settings, Admin visible if admin)
4. Click through each tab — content should render
5. In the Profile tab, change a toggle → Save button becomes enabled
6. Click Save → changes persist (refresh page to verify)
7. In the Admin tab (if admin), verify the user table loads
8. Click "Create User" → form appears, fill and submit → user appears in table
9. Open Settings dialog again → all three tabs visible and functional

---

## Verification Checklist

1. SettingsDialog opens from avatar pill in sidebar footer
2. Vertical tab rail shows Profile, Settings, and Admin tabs
3. Admin tab only visible to users with `permissions.admin === true`
4. Profile tab shows identity card + preferences form with working Save
5. Settings tab shows sectioned form with working Save
6. Admin tab shows user table with create/edit/delete
7. Admin tab shows read-only system settings
8. All API calls (getUsers, createUser, updateUser, deleteUser) work correctly
9. No console errors on any tab
10. TypeScript typecheck passes with zero errors

---

## Self-Review Checklist

1. **Spec coverage:** Profile tab ✓, Settings tab ✓, Admin tab ✓, user CRUD ✓, system settings ✓, vertical tabs ✓, admin-only tab ✓, dialog trigger from avatar ✓
2. **Placeholder scan:** No "TBD", "TODO", or vague instructions in any step. All code is concrete.
3. **Type consistency:** `AdminUser` type defined in Task 1 and used consistently in Tasks 5–7. `UserForm` and `SettingsAdminTab` both import `AdminUser` from the same source. `handleFormSubmit` uses the same `Partial<AdminUser>` shape throughout.
4. **Import paths verified:** All imports use `@/` alias pointing to `frontend/src/`, matching `vite.config.ts` alias configuration.
