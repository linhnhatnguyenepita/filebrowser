# Profile & Settings Sidebar Tabs — Design Spec

**Date:** 2026-03-31
**Status:** Draft

---

## 1. Overview

Add a tabbed Profile / Settings panel to the sidebar footer area in the frontend-next app. Users access it from the sidebar without navigating to a new page or URL. The panel slides in over the directory tree, preserving its expanded state.

---

## 2. Layout & Navigation

### Sidebar Structure (unchanged zones)

The sidebar retains its three existing zones:

1. **Header** (52px) — App title + HardDrive icon, unchanged.
2. **Source Selector** — unchanged.
3. **Directory Tree** — fills `flex-1`, unchanged.

A new zone is added:

4. **Tab Panel Area** — occupies the same vertical space as the Directory Tree when a tab is open. The Directory Tree is hidden while a tab is open; it is restored when the tab is closed.

### Sidebar Footer (new)

The footer (previously: username + "Admin" badge + Logout) is restructured:

```
┌─────────────────────────┐
│  avatar  username        │  ← user identity line (read-only)
│         [Profile] [Settings] │  ← tab switcher
│              [Logout]   │  ← logout button, unchanged
└─────────────────────────┘
```

- **User identity line** — shows avatar (first letter of username) + username in a pill.
- **Tab switcher** — two small buttons/pills: "Profile" and "Settings". Active tab is highlighted.
- **Logout button** — unchanged from current behavior.
- The footer itself stays fixed at the bottom; only the panel above it changes.

### Tab Open/Close Behavior

- Clicking a tab button opens that tab's panel.
- Clicking the active tab again closes it (toggles).
- Clicking outside the panel (e.g., on a directory tree item) closes the active tab.
- The directory tree's expanded/loaded state is preserved when switching tabs or closing them.

---

## 3. Profile Tab

The Profile panel occupies the full sidebar width above the footer. It is divided into two sections:

### 3a. Identity Card (read-only)

Displays information from `authStore.user`:

| Field | Display |
|---|---|
| Username | `user.username` |
| Scope | `user.scope` |
| Scopes | List of `{ name, scope }` objects |
| Admin | Badge: "Admin" or "Member" |
| Permissions | Six badges: Modify, Share, Create, Delete, Download, Admin |

### 3b. Preferences Form (editable)

All fields below are persisted to the backend. The form has a **Save** button that is disabled when no changes have been made.

| Field | Control | Backend Field |
|---|---|---|
| Display Name | text input | `displayName` (verify backend supports this field) |
| Theme | segmented control: Light / Dark / System | `darkMode` (map: "light"→false, "dark"→true, "system"→null) |
| Language | dropdown | `locale` |
| Default View | toggle: Grid / List | `viewMode` |
| Default Sort | two dropdowns: field + direction | `sorting.by`, `sorting.asc` |
| Show Hidden Files | toggle | `showHidden` |
| Single Click to Open | toggle | `singleClick` |
| Sticky Sidebar | toggle | `stickySidebar` |

**Save behavior:** On click, collect all changed fields (compare current values against `authStore.user`), send to `PATCH /api/users/me` (or equivalent endpoint — see Backend API section), and on success call `authStore.fetchUser()` to refresh the auth store.

**Cancel/reset:** Not needed — the Save button only sends on explicit save; no confirmation dialog.

---

## 4. Settings Tab

The Settings tab contains the same preferences as the Profile tab's editable form, organized into sections with headers. No read-only identity section.

### Sections

**Display**
- Theme
- Language
- Default View
- Default Sort
- Show Hidden Files
- Single Click to Open
- Sticky Sidebar

**Behavior** (if backend supports)
- Default Source / Folder on load — dropdown, options populated from `GET /api/settings/sources`
- Upload Chunk Size — number input in MB (default 5, min 1, max 100)

**Notifications**
- Show Upload Notifications — toggle (default: true)
- Show Delete Confirmations — toggle (default: true)

### Save Behavior

Same as Profile: single Save button disabled when no changes, sends changed fields to backend on click, calls `authStore.fetchUser()` on success.

---

## 5. Backend API

**Required endpoint:** `PATCH /api/users/me` (or `PUT /api/users/me/preferences`)

- Accepts a partial user object with preference fields.
- Returns the full updated user object.
- Requires the same auth token used for all other API calls.

If this endpoint does not exist in the backend, it must be added as part of this work.

### Fallback

If only full-user `PUT /api/users/:id` is available, the frontend sends the full user object (fetch current user first, merge changes, send back).

---

## 6. Component Architecture

### New Files

| File | Responsibility |
|---|---|
| `src/components/layout/SidebarFooter.tsx` | User identity pill, tab switcher, logout button — replaces the footer section in Sidebar.tsx |
| `src/components/layout/SidebarTabPanel.tsx` | Manages `activeTab` state (`"none" \| "profile" \| "settings"`), renders the active panel over the directory tree, handles click-outside-to-close |
| `src/components/layout/ProfilePanel.tsx` | Identity card + preferences form with Save button |
| `src/components/layout/SettingsPanel.tsx` | Sectioned preferences form with Save button |
| `src/components/ui/form/PreferenceToggle.tsx` | Reusable toggle row: label + description + switch |
| `src/components/ui/form/PreferenceSelect.tsx` | Reusable select row: label + description + select |
| `src/components/ui/form/PreferenceSegment.tsx` | Reusable segmented control row: label + description + segmented buttons |
| `src/components/ui/form/PreferenceInput.tsx` | Reusable text/number input row: label + description + input |
| `src/components/ui/form/PreferenceSection.tsx` | Section header with optional description |

### Modified Files

| File | Change |
|---|---|
| `src/components/layout/Sidebar.tsx` | Replace inline footer with `<SidebarFooter>` + `<SidebarTabPanel>`. Directory tree conditionally renders only when no tab is active. |
| `src/lib/api/users.ts` | Add `updateUserPreferences(prefs: Partial<User>): Promise<User>` |
| `src/lib/stores/auth-store.ts` | Add `updatePreferences(prefs)` action: calls the API, then patches `this.user` with the result |

---

## 7. State & Data Flow

```
User clicks tab
  → SidebarTabPanel sets activeTab
  → Sidebar conditionally hides DirectoryTree, shows active panel

User edits field
  → Local form state updates
  → isDirty flag set true → Save button enabled

User clicks Save
  → Compare form state with authStore.user
  → Call authStore.updatePreferences(changedFields)
  → API call to backend
  → On success: authStore.fetchUser() → authStore.user updates → all consumers re-render
  → Form resets isDirty to false

User clicks active tab (toggle)
  → activeTab → "none"
  → DirectoryTree restored
```

---

## 8. Styling

- All components use **Tailwind CSS v4** classes, consistent with the existing codebase.
- Toggle controls use the existing shadcn-style `Switch` component.
- Select/dropdown controls use the existing shadcn-style `Select` component.
- Text inputs use the existing shadcn-style `Input` component.
- Tab switcher uses a pill/segmented style with `bg-muted` for inactive, `bg-background` for active.
- Section headers use `text-xs font-semibold uppercase tracking-wider text-muted-foreground`.
- Form rows use `flex items-center justify-between py-2` with a `flex-1` label section.

---

## 9. Error Handling

- If `updateUserPreferences` fails (network error, 4xx/5xx), show an inline error message below the Save button: "Failed to save preferences. Please try again."
- The form state is NOT reset on error — the user keeps their changes.
- If `fetchUser` fails during initial load (inside `AuthGuard`), redirect to `/login` as before.

---

## 10. Open Questions

1. **Backend endpoint** — confirm whether `PATCH /api/users/me` exists, and what request/response shape it expects. If it doesn't exist, this spec needs a backend component.
2. **displayName field** — confirm whether the backend user model has a `displayName` field. If not, the Profile tab shows read-only identity only, with preferences in the Settings tab.
3. **Behavior section** — confirm whether `defaultSource` and `uploadChunkSize` are stored per-user or globally in the backend.
4. **Notifications section** — confirm whether notification preferences are stored per-user. If not, this section is omitted.

---

## 11. Out of Scope

- Any changes to the backend API beyond the user preferences endpoint.
- Changes to the directory tree behavior.
- Changes to existing dialogs.
- Multi-user admin panel for managing other users.
- Internationalization (i18n) string files beyond using the `locale` field from the user object.
