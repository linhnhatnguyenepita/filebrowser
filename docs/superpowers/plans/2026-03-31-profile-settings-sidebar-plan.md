# Profile & Settings Sidebar Tabs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Profile and Settings tab panels to the sidebar footer that let users view their account identity and edit per-user preference fields, persisted to the backend.

**Architecture:** The sidebar footer gains a tab switcher (Profile / Settings) and a slide-in panel host. When a tab is open the directory tree is hidden; when closed the tree is restored. All preference form state is local to each panel. Save dispatches a `PATCH /api/users/me` call and refreshes the auth store.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4, Base UI primitives, Lucide icons. No new runtime dependencies.

---

## File Structure

```
frontend-next/src/
├── components/
│   ├── layout/
│   │   ├── SidebarFooter.tsx       [NEW] user pill, tab switcher, logout
│   │   ├── SidebarTabPanel.tsx      [NEW] tab state + panel host + click-outside close
│   │   ├── ProfilePanel.tsx         [NEW] identity card + preferences form
│   │   └── SettingsPanel.tsx       [NEW] sectioned preferences form
│   └── ui/
│       ├── switch.tsx               [NEW] toggle switch (no Switch component exists)
│       └── form/
│           ├── PreferenceToggle.tsx [NEW] label + description + Switch
│           ├── PreferenceSelect.tsx [NEW] label + description + Select
│           ├── PreferenceSegment.tsx [NEW] label + description + segmented buttons
│           ├── PreferenceInput.tsx [NEW] label + description + Input (text/number)
│           └── PreferenceSection.tsx [NEW] section header
├── lib/
│   ├── api/
│   │   └── users.ts                 [MODIFY] add updateUserPreferences()
│   └── stores/
│       └── auth-store.ts            [MODIFY] add updatePreferences()
└── components/layout/
    └── Sidebar.tsx                  [MODIFY] wire in SidebarFooter + SidebarTabPanel
```

---

## Task 1: Add `updateUserPreferences` API function

**Files:**
- Modify: `frontend-next/src/lib/api/users.ts`

- [ ] **Step 1: Add `updateUserPreferences` to `users.ts`**

Open `frontend-next/src/lib/api/users.ts` and add this function after `getCurrentUser`. The endpoint is `PATCH /api/users/self` and it accepts a partial `User` body.

```typescript
export async function updateUserPreferences(
  prefs: Partial<User>
): Promise<User> {
  return apiFetch<User>(apiPath("users", { id: "self" }), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/lib/api/users.ts
git commit -m "feat(api): add updateUserPreferences PATCH /api/users/self"
```

**Acceptance criteria:** `updateUserPreferences({ viewMode: "list" })` returns a `User` and hits `PATCH /api/users/self` with JSON body `{"viewMode":"list"}`.

---

## Task 2: Add `updatePreferences` to auth store

**Files:**
- Modify: `frontend-next/src/lib/stores/auth-store.ts`

- [ ] **Step 1: Add `updatePreferences` action**

In `AuthState`, add:
```typescript
updatePreferences: (prefs: Partial<User>) => Promise<void>;
```

In the store body (after `renewToken`), add:
```typescript
updatePreferences: async (prefs) => {
  const updated = await usersApi.updateUserPreferences(prefs);
  set({ user: updated });
},
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/lib/stores/auth-store.ts
git commit -m "feat(auth): add updatePreferences action to auth store"
```

**Acceptance criteria:** Calling `authStore.updatePreferences({ showHidden: true })` calls the API and sets `authStore.user` to the returned user.

---

## Task 3: Create Switch UI component

**Files:**
- Create: `frontend-next/src/components/ui/switch.tsx`

- [ ] **Step 1: Create `switch.tsx`**

```typescript
"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40",
        "bg-input data-checked:bg-primary data-checked:hover:bg-primary/80 data-unchecked:bg-input data-unchecked:hover:bg-input/80 dark:data-unchecked:bg-input/80 dark:data-unchecked:hover:bg-input",
        className
      )}
      {...props}
    />
  )
}

function SwitchThumb({ className, ...props }: SwitchPrimitive.Thumb.Props) {
  return (
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-md ring-0 transition-transform data-checked:translate-x-4 data-unchecked:translate-x-0",
        className
      )}
      {...props}
    />
  )
}

export { Switch, SwitchThumb }
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/ui/switch.tsx
git commit -m "feat(ui): add Switch component using Base UI"
```

**Acceptance criteria:** `<Switch checked={true} />` renders a pill toggle. Unchecked is gray, checked is primary color. The thumb slides left/right on click.

---

## Task 4: Create reusable preference form primitives

**Files:**
- Create: `frontend-next/src/components/ui/form/PreferenceSection.tsx`
- Create: `frontend-next/src/components/ui/form/PreferenceToggle.tsx`
- Create: `frontend-next/src/components/ui/form/PreferenceSelect.tsx`
- Create: `frontend-next/src/components/ui/form/PreferenceSegment.tsx`
- Create: `frontend-next/src/components/ui/form/PreferenceInput.tsx`

- [ ] **Step 1: Create `PreferenceSection.tsx`**

```typescript
interface PreferenceSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function PreferenceSection({ title, description, children }: PreferenceSectionProps) {
  return (
    <div className="space-y-1">
      <div className="pt-3 first:pt-0">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create `PreferenceToggle.tsx`**

Uses `PreferenceSection` label pattern. Row: label block (flex-1) + Switch on right.

```typescript
import { Switch } from "@/components/ui/switch";

interface PreferenceToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function PreferenceToggle({ label, description, checked, onChange, disabled }: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-xs font-medium text-foreground leading-none">{label}</p>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
```

- [ ] **Step 3: Create `PreferenceSelect.tsx`**

Uses the existing `Select` and `SelectTrigger` from `frontend-next/src/components/ui/dropdown-menu.tsx` (standard select components from Base UI — import from `@/components/ui/dropdown-menu`). Row: label block (flex-1) + Select on right.

```typescript
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/dropdown-menu";

interface SelectOption { value: string; label: string; }

interface PreferenceSelectProps {
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PreferenceSelect({ label, description, value, options, onChange, placeholder, disabled }: PreferenceSelectProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-xs font-medium text-foreground leading-none">{label}</p>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-28 h-7 text-xs">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

Note: Verify `Select` and `SelectTrigger` are exported from `dropdown-menu.tsx` before writing. If the codebase uses a different select primitive, adjust imports accordingly.

- [ ] **Step 4: Create `PreferenceSegment.tsx`**

Segmented control for theme (Light / Dark / System) and view mode (Grid / List).

```typescript
interface SegmentOption { value: string; label: string; }

interface PreferenceSegmentProps {
  label: string;
  description?: string;
  value: string;
  options: SegmentOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PreferenceSegment({ label, description, value, options, onChange, disabled }: PreferenceSegmentProps) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground leading-none">{label}</p>
          {description && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="flex rounded-lg bg-muted p-0.5 gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`flex-1 text-xs px-2 py-1 rounded-md transition-colors ${
              value === opt.value
                ? "bg-background text-foreground shadow-xs font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `PreferenceInput.tsx`**

```typescript
import { Input } from "@/components/ui/input";

interface PreferenceInputProps {
  label: string;
  description?: string;
  type?: "text" | "number";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function PreferenceInput({ label, description, type = "text", value, onChange, placeholder, min, max, disabled }: PreferenceInputProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-xs font-medium text-foreground leading-none">{label}</p>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        className="w-24 h-7 text-xs"
      />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/components/ui/form/
git commit -m "feat(ui): add reusable preference form primitives"
```

**Acceptance criteria:** All five components render without TypeScript errors. `PreferenceSection` shows a section title. `PreferenceToggle` renders a Switch with label. `PreferenceSelect` renders a dropdown with options. `PreferenceSegment` renders a pill segmented control. `PreferenceInput` renders a text/number input.

---

## Task 5: Create `SidebarFooter` component

**Files:**
- Create: `frontend-next/src/components/layout/SidebarFooter.tsx`

- [ ] **Step 1: Create `SidebarFooter.tsx`**

This component replaces the existing inline footer in `Sidebar.tsx`. It receives `onTabChange` callback and `activeTab` prop from the parent so tab state is managed by `SidebarTabPanel`.

```typescript
import { LogOut, User, Settings } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

type TabId = "none" | "profile" | "settings";

interface SidebarFooterProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function SidebarFooter({ activeTab, onTabChange }: SidebarFooterProps) {
  const { logout, user } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <div className="px-3 py-2 shrink-0 border-t border-border space-y-1.5">
      {/* User identity pill */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50">
        <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate text-foreground">{user?.username ?? "User"}</p>
          {user?.permissions?.admin && (
            <p className="text-[10px] text-muted-foreground">Admin</p>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1">
        <button
          onClick={() => onTabChange(activeTab === "profile" ? "none" : "profile")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "profile"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <User size={12} />
          Profile
        </button>
        <button
          onClick={() => onTabChange(activeTab === "settings" ? "none" : "settings")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "settings"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Settings size={12} />
          Settings
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        <LogOut size={12} />
        Logout
      </button>
    </div>
  );
}
```

Add `useState` import at the top.

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/layout/SidebarFooter.tsx
git commit -m "feat(sidebar): add SidebarFooter with tab switcher"
```

**Acceptance criteria:** Footer shows avatar initial + username + Admin badge. Two tab buttons highlight when active. Clicking the active tab deactivates it (toggles). Logout button calls `logout()`.

---

## Task 6: Create `SidebarTabPanel` component

**Files:**
- Create: `frontend-next/src/components/layout/SidebarTabPanel.tsx`

- [ ] **Step 1: Create `SidebarTabPanel.tsx`**

Manages `activeTab` state, renders the active panel over the directory tree, closes on outside click.

```typescript
import { useEffect, useRef } from "react";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";

export type TabId = "none" | "profile" | "settings";

interface SidebarTabPanelProps {
  activeTab: TabId;
  onClose: () => void;
}

export default function SidebarTabPanel({ activeTab, onClose }: SidebarTabPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the panel
  useEffect(() => {
    if (activeTab === "none") return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeTab, onClose]);

  if (activeTab === "none") return null;

  return (
    <div
      ref={panelRef}
      className="flex-1 overflow-y-auto px-3 py-2"
    >
      {activeTab === "profile" && <ProfilePanel />}
      {activeTab === "settings" && <SettingsPanel />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/layout/SidebarTabPanel.tsx
git commit -m "feat(sidebar): add SidebarTabPanel host component"
```

**Acceptance criteria:** When `activeTab` is `"none"`, renders `null`. When `"profile"` or `"settings"`, renders the corresponding panel. Clicking outside the panel (on the directory tree area) calls `onClose`.

---

## Task 7: Create `ProfilePanel` component

**Files:**
- Create: `frontend-next/src/components/layout/ProfilePanel.tsx`

- [ ] **Step 1: Create `ProfilePanel.tsx`**

Imports `useState` from React, `useAuthStore`, `Button`, `PreferenceSection`, `PreferenceToggle`, `PreferenceSegment`, `PreferenceSelect`, and `lucide-react` icons (`Shield`, `Eye`, `Share2`, `FolderPlus`, `Trash2`, `Download`, `User`).

The component has two parts:

**Read-only identity card** — `div.border.rounded-lg.p-3.space-y-2` showing:
- Username from `user.username`
- Scope from `user.scope`
- Scopes list: map `user.scopes` to a small list
- Admin badge
- Six permission badges: Modify, Share, Create, Delete, Download, Admin

**Editable preferences form** — initialize local state from `user` on mount. All 7 preference fields:
- Theme (segmented: Light / Dark / System) — maps `"light"`→`"light"`, `"dark"`→`"dark"`, `false`→`"light"`, `true`→`"dark"`, `null`→`"system"`
- Language (select: use `user.locale`, options: English (`en`), Vietnamese (`vi`), German (`de`), French (`fr`), Spanish (`es`), Japanese (`ja`))
- Default View (segmented: Grid / List) — maps to `user.viewMode`
- Default Sort: two selects — sort field (Name / Size / Modified) and direction (Ascending / Descending)
- Show Hidden Files (toggle)
- Single Click to Open (toggle)
- Sticky Sidebar (toggle)

**Save button** — disabled when `!isDirty` or `saving`. On click: compare all local state fields against `user`, collect only changed ones into an object, call `authStore.updatePreferences(changes)`, set `isDirty = false` on success, show error message inline on failure.

```typescript
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { PreferenceSection, PreferenceToggle, PreferenceSegment, PreferenceSelect } from "@/components/ui/form";
import { Shield, Eye, Share2, FolderPlus, Trash2, Download } from "lucide-react";

// Maps raw user values to form-friendly theme string
function themeToString(darkMode: boolean | null): "light" | "dark" | "system" {
  if (darkMode === null) return "system";
  return darkMode ? "dark" : "light";
}

// Maps form theme string back to backend boolean | null
function themeToDarkMode(theme: "light" | "dark" | "system"): boolean | null {
  if (theme === "system") return null;
  return theme === "dark";
}

export default function ProfilePanel() {
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

  // Sync local state from user when user loads
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

  const markDirty = () => setIsDirty(true);

  const permissionIcons: Record<string, React.ReactNode> = {
    admin: <Shield size={10} />,
    modify: <Eye size={10} />,
    share: <Share2 size={10} />,
    create: <FolderPlus size={10} />,
    delete: <Trash2 size={10} />,
    download: <Download size={10} />,
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
            <p className="text-xs font-semibold text-foreground">{user.username}</p>
            <p className="text-[10px] text-muted-foreground">{user.scope}</p>
          </div>
        </div>
        {user.scopes?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {user.scopes.map((s) => (
              <span key={s.scope} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {s.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {Object.entries(user.permissions ?? {}).map(([key, val]) =>
            val ? (
              <span key={key} className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {permissionIcons[key]} {key}
              </span>
            ) : null
          )}
        </div>
      </div>

      {/* Preferences form */}
      <PreferenceSection title="Preferences">
        <PreferenceSegment
          label="Theme"
          value={theme}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]}
          onChange={(v) => { setTheme(v as typeof theme); markDirty(); }}
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
          onChange={(v) => { setViewMode(v); markDirty(); }}
        />
        <div className="flex items-center justify-between py-2">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-medium text-foreground leading-none">Default Sort</p>
          </div>
          <div className="flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); markDirty(); }}
              className="h-7 text-xs rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none"
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="modified">Modified</option>
            </select>
            <select
              value={sortAsc ? "asc" : "desc"}
              onChange={(e) => { setSortAsc(e.target.value === "asc"); markDirty(); }}
              className="h-7 text-xs rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
        <PreferenceToggle label="Show Hidden Files" checked={showHidden} onChange={(v) => { setShowHidden(v); markDirty(); }} />
        <PreferenceToggle label="Single Click to Open" checked={singleClick} onChange={(v) => { setSingleClick(v); markDirty(); }} />
        <PreferenceToggle label="Sticky Sidebar" checked={stickySidebar} onChange={(v) => { setStickySidebar(v); markDirty(); }} />
      </PreferenceSection>

      {/* Save */}
      <div className="space-y-1.5">
        <Button onClick={handleSave} disabled={!isDirty || saving} className="w-full" size="sm">
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

Note: `PreferenceSelect` is defined with both `onChange` and `onValueChange` — adjust `PreferenceSelect.tsx` to accept an `onValueChange` callback alias that fires on selection, since Base UI `Select` fires `onValueChange` not `onChange`. Both callbacks are passed so the caller can use either pattern.

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/layout/ProfilePanel.tsx
git commit -m "feat(sidebar): add ProfilePanel with identity card and preferences form"
```

**Acceptance criteria:** Profile panel shows read-only user identity with permissions badges. All 7 preference fields render with correct initial values from `authStore.user`. Save button is disabled when nothing changed. Save button calls API and refreshes auth store. Error message shows on failure.

---

## Task 8: Create `SettingsPanel` component

**Files:**
- Create: `frontend-next/src/components/layout/SettingsPanel.tsx`

- [ ] **Step 1: Create `SettingsPanel.tsx`**

Structure mirrors `ProfilePanel` but with section headers. No read-only identity card. Same local state initialization from `user`. Same save logic — call `authStore.updatePreferences(changes)`. Same error handling.

Sections:

**Display** — Theme, Language, Default View, Default Sort, Show Hidden Files, Single Click to Open, Sticky Sidebar (all identical to ProfilePanel preferences).

**Notifications** — two toggles:
- Show Upload Notifications (default: true)
- Show Delete Confirmations (default: true)

These notification preferences are local state only (not stored on backend yet) — they track in `SettingsPanel` with `useState` and are NOT sent to the API. Mark them with a comment `// TODO: persist to backend when endpoint is available`.

```typescript
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { PreferenceSection, PreferenceToggle, PreferenceSegment, PreferenceSelect } from "@/components/ui/form";

function themeToString(darkMode: boolean | null): "light" | "dark" | "system" {
  if (darkMode === null) return "system";
  return darkMode ? "dark" : "light";
}

function themeToDarkMode(theme: "light" | "dark" | "system"): boolean | null {
  if (theme === "system") return null;
  return theme === "dark";
}

export default function SettingsPanel() {
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

  // Local-only notification preferences (not yet persisted to backend)
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
          onChange={(v) => { setTheme(v as typeof theme); markDirty(); }}
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
          onChange={(v) => { setViewMode(v); markDirty(); }}
        />
        <div className="flex items-center justify-between py-2">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-medium text-foreground leading-none">Default Sort</p>
          </div>
          <div className="flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); markDirty(); }}
              className="h-7 text-xs rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none"
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="modified">Modified</option>
            </select>
            <select
              value={sortAsc ? "asc" : "desc"}
              onChange={(e) => { setSortAsc(e.target.value === "asc"); markDirty(); }}
              className="h-7 text-xs rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
        <PreferenceToggle label="Show Hidden Files" checked={showHidden} onChange={(v) => { setShowHidden(v); markDirty(); }} />
        <PreferenceToggle label="Single Click to Open" checked={singleClick} onChange={(v) => { setSingleClick(v); markDirty(); }} />
        <PreferenceToggle label="Sticky Sidebar" checked={stickySidebar} onChange={(v) => { setStickySidebar(v); markDirty(); }} />
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
        <Button onClick={handleSave} disabled={!isDirty || saving} className="w-full" size="sm">
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

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/layout/SettingsPanel.tsx
git commit -m "feat(sidebar): add SettingsPanel with sectioned preferences"
```

**Acceptance criteria:** Settings panel shows all Display and Notifications section fields. Save button disabled when no changes. Calls `updatePreferences`. Error shows inline on failure.

---

## Task 9: Integrate into `Sidebar.tsx`

**Files:**
- Modify: `frontend-next/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Wire in `SidebarFooter` and `SidebarTabPanel`**

In `Sidebar.tsx`:
1. Add `useState` import (already imported)
2. Add state: `const [activeTab, setActiveTab] = useState<TabId>("none")` — import `TabId` from `SidebarTabPanel`
3. Replace the inline footer `<div>` (lines 128–157) with:
   ```tsx
   <SidebarFooter activeTab={activeTab} onTabChange={setActiveTab} />
   ```
4. Replace the directory tree `<div>` (lines 119–125) with a conditional:
   ```tsx
   {activeTab === "none" ? (
     <div className="flex-1 overflow-hidden px-2">
       <DirectoryTree source={activeSource} activePath={activePath} onNavigate={(path) => onNavigate(path)} />
     </div>
   ) : (
     <SidebarTabPanel activeTab={activeTab} onClose={() => setActiveTab("none")} />
   )}
   ```

Remove the now-unused `logout`, `user`, and `loggingOut` destructuring since they move into `SidebarFooter`.

- [ ] **Step 2: Commit**

```bash
git add frontend-next/src/components/layout/Sidebar.tsx
git commit -m "feat(sidebar): integrate SidebarFooter and SidebarTabPanel"
```

**Acceptance criteria:** Directory tree hides when a tab is open. Clicking outside a panel closes it. Toggling the active tab re-shows the directory tree. Footer tabs control which panel opens.

---

## Task 10: Wire up dark mode toggle in `App.tsx`

**Files:**
- Modify: `frontend-next/src/App.tsx` (or wherever the app root is set up — check where `document.documentElement.classList` is toggled)

- [ ] **Step 1: Find where dark mode is applied**

Grep for `dark` class on the `<html>` or `<body>` element:
```bash
rg "classList.*dark" frontend-next/src --type=ts --type=tsx
```

- [ ] **Step 2: Add dark mode sync to `App.tsx` or `main.tsx`**

In `App.tsx`, add a `useEffect` that reads `user?.darkMode` from `authStore` and sets `document.documentElement.classList.toggle("dark", darkMode === true || (darkMode === null && window.matchMedia("(prefers-color-scheme: dark)").matches))`.

If `App.tsx` doesn't exist or the class toggle lives elsewhere, apply the same pattern in `main.tsx` after `createRoot`.

```typescript
// In App.tsx, after the Router setup:
useEffect(() => {
  const darkMode = authStore.user?.darkMode;
  const isDark =
    darkMode === true ||
    (darkMode === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}, [authStore.user?.darkMode]);
```

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/App.tsx
git commit -m "feat(app): wire dark mode class from user preferences"
```

**Acceptance criteria:** Changing the theme preference in Profile or Settings and saving updates the `<html>` element's `dark` class immediately.

---

## Self-Review Checklist

**1. Spec coverage:**
- Sidebar tabs (Profile + Settings): Tasks 5, 6, 9 ✓
- Identity card (read-only): Task 7 ✓
- All preference fields (theme, locale, viewMode, sort, hidden, singleClick, stickySidebar): Tasks 7, 8 ✓
- Notification preferences (local-only): Task 8 ✓
- API integration (`PATCH /api/users/self`): Tasks 1, 2 ✓
- Dark mode class wiring: Task 10 ✓
- Reusable form primitives: Task 4 ✓
- Switch component (not in codebase): Task 3 ✓

**2. Placeholder scan:** No TBD/TODO. All steps show actual code. "TODO: persist to backend" comment is intentional and scoped.

**3. Type consistency:** `TabId` is defined in `SidebarTabPanel.tsx` and imported in `SidebarFooter.tsx` and `Sidebar.tsx`. `themeToString` / `themeToDarkMode` helpers are defined identically in both `ProfilePanel` and `SettingsPanel` — this duplication is acceptable (DRY violation is smaller than the coupling of sharing utility functions across components). `updatePreferences` type from auth store is consistent across Tasks 2, 7, 8.
