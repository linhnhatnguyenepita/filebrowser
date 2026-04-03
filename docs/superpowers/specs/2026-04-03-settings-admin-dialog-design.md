# Settings & Admin Dialog — Design Spec

**Date:** 2026-04-03
**Status:** Approved

---

## 1. Overview

Add a unified settings and administration dialog to the file browser. It opens from the user avatar pill in the sidebar footer and uses a vertical tab layout with three tabs: Profile, Settings, and Admin (Admin tab visible only to admin users).

---

## 2. Trigger & Dialog Shell

### Trigger

The user avatar pill in `SidebarFooter` (`SidebarFooter.tsx`) opens the dialog on click, replacing the current logout dropdown menu behavior. The avatar pill stays as-is in the sidebar footer — it remains visible when the dialog is open.

### Dialog Shell

```
┌─────────────────────────────────────────────────────┐
│  ┌───────┬──────────────────────────────────┐  ✕  │
│  │Profile│                                  │      │
│  ├───────┤  [Content panel — scrollable]    │      │
│  │Settings│                                  │      │
│  ├───────┤                                   │      │
│  │ Admin │                                   │      │
│  └───────┘                                   │      │
└─────────────────────────────────────────────────────┘
```

**Dimensions:** `max-w-2xl` (~672px), `max-h-[85vh]` content area, `overflow-hidden` shell with internal scroll.

**Layout:**
- Left tab rail: fixed width ~140px, `bg-muted` background, top-aligned tabs
- Right content area: `flex-1`, scrollable, `p-4`
- Close button: top-right corner (`✕`), closes the dialog
- Tabs: icon + label, vertical stack, `bg-background` + left accent border when active

**Tabs:**
- Profile (always visible)
- Settings (always visible)
- Admin (only visible when `user.permissions.admin === true`)

---

## 3. Profile Tab

### Identity Card (read-only, top)

Displays current user info from `authStore.user`:

| Field | Display |
|---|---|
| Avatar | First letter of username in a colored circle |
| Username | `user.username` |
| Scope | `user.scope` |
| Scopes | List of `{ name, scope }` objects as small badges |
| Admin | Badge: "Admin" or "Member" |
| Permissions | Six badges: Admin, Modify, Share, Create, Delete, Download — filled for granted, dimmed for denied |

### Preferences Form (editable)

Persisted to backend via `updatePreferences`. Save button disabled when no changes.

| Field | Control | Backend Field |
|---|---|---|
| Theme | Segmented: Light / Dark / System | `darkMode` |
| Language | Dropdown | `locale` |
| Default View | Segmented: Grid / List | `viewMode` |
| Default Sort | Two selects: field + direction | `sorting.by`, `sorting.asc` |
| Show Hidden Files | Toggle | `showHidden` |
| Single Click to Open | Toggle | `singleClick` |
| Sticky Sidebar | Toggle | `stickySidebar` |

**Save behavior:** Compare current form state against `authStore.user`, send only changed fields via `updatePreferences`. On success, `authStore.fetchUser()` refreshes the store. On error, show inline error below the Save button; form state is NOT reset.

---

## 4. Settings Tab

Sectioned form (no identity card). All fields editable and saved identically to Profile.

### Display Section

| Field | Control | Backend Field |
|---|---|---|
| Theme | Segmented | `darkMode` |
| Language | Dropdown | `locale` |
| Default View | Segmented | `viewMode` |
| Default Sort | Two selects | `sorting.by`, `sorting.asc` |
| Show Hidden Files | Toggle | `showHidden` |
| Single Click to Open | Toggle | `singleClick` |
| Sticky Sidebar | Toggle | `stickySidebar` |

### Behavior Section

| Field | Control | Backend Field |
|---|---|---|
| Upload Chunk Size | `PreferenceInput` (number, MB, range 1–100) | `fileLoading.uploadChunkSizeMb` |
| Download Chunk Size | `PreferenceInput` (number, MB, range 1–100) | `fileLoading.downloadChunkSizeMb` |

### Notifications Section (local-only)

| Field | Control | Notes |
|---|---|---|
| Show Upload Notifications | Toggle | Not persisted — local state only |
| Show Delete Confirmations | Toggle | Not persisted — local state only |

**Save behavior:** Same as Profile — collect dirty fields, call `updatePreferences`, refresh store on success.

---

## 5. Admin Tab (admin only)

Visible only when `user.permissions.admin === true`. Two sub-sections stacked vertically.

### Users Sub-Section

**User Table**

Fetch all users via `GET /api/users` (returns all users for admin users).

| Column | Content |
|---|---|
| Username | `user.username` |
| Scope | `user.scope` |
| Role | "Admin" badge if `permissions.admin`, else "Member" |
| Actions | Edit button, Delete button |

- **Search/filter input** above the table — filters by username.
- **Create User button** above the table, right-aligned.
- **Edit** — opens an inline edit panel or modal below/over the table row with editable fields.
- **Delete** — shows a confirmation inline (not a dialog), then calls `DELETE /api/users?id=X`.
- Non-admin users cannot delete or edit themselves.

**Create/Edit User Form**

Fields:

| Field | Control | Notes |
|---|---|---|
| Username | text input | Required; read-only when editing |
| Password | text input | Required on create; optional on edit (only updates if filled) |
| Scope | text input | Defaults to `global` |
| Permissions | checkboxes | Admin, Modify, Share, Create, Delete, Download |

- On **Create**: `POST /api/users` with `{ which: [], data: { ...formData } }`.
- On **Edit**: `PUT /api/users?id={id}` with `{ which: ["Permissions"], data: { ...formData } }` (only send changed permission fields).
- Cancel button resets the form and hides it.

### System Settings Sub-Section

Read-only display of server configuration from `GET /api/settings`.

| Field | Source |
|---|---|
| Hostname | `config.Server.Hostname` |
| Port | `config.Server.Port` |
| Signup Enabled | `config.Auth.Recaptcha.Key != ""` or `config.Auth.Signup` |
| Registered Users | count from `GET /api/users` (no id param) |
| Sources | list from `GET /api/settings?property=sources` |

Displayed as a clean read-only definition/card list — no editing.

---

## 6. Backend API Changes

No new endpoints required. All needed endpoints already exist:

| Method | Endpoint | Used For |
|---|---|---|
| GET | `/api/users` | Fetch all users (admin only returns full list) |
| PUT | `/api/users?id={id}` | Update user preferences / permissions |
| POST | `/api/users` | Create new user |
| DELETE | `/api/users?id={id}` | Delete user |
| GET | `/api/settings?property=sources` | Sources list for System Settings section |
| GET | `/api/settings` | Full config for System Settings section |

Frontend API additions needed in `frontend/src/lib/api/users.ts`:

```typescript
// Extended User type for admin user management (includes fields not in current User)
interface AdminUser extends User {
  password?: string;
  loginMethod?: string;
}

// GET all users (admin)
export async function getUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>(apiPath("users"));
}

// DELETE a user by id
export async function deleteUser(id: number): Promise<void> {
  await apiFetch(apiPath("users", { id: String(id) }), { method: "DELETE" });
}

// CREATE a new user
export async function createUser(userData: Partial<AdminUser>): Promise<void> {
  await apiFetch(apiPath("users"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ which: [], data: userData }),
  });
}

// UPDATE a user
export async function updateUser(id: number, userData: Partial<AdminUser>, which: string[]): Promise<void> {
  await apiFetch(apiPath("users", { id: String(id) }), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ which, data: { ...userData, id } }),
  });
}
```

---

## 7. Component Architecture

### New Files

| File | Responsibility |
|---|---|
| `frontend/src/components/layout/SettingsDialog.tsx` | Shell: vertical tabs + content switching + Dialog wrapper. **Already exists — modify to add vertical tabs** |
| `frontend/src/components/layout/SettingsTabs.tsx` | Vertical tab list with Profile/Settings/Admin tabs |
| `frontend/src/components/layout/SettingsProfileTab.tsx` | Profile tab: identity card + preferences form |
| `frontend/src/components/layout/SettingsSettingsTab.tsx` | Settings tab: sectioned preferences form |
| `frontend/src/components/layout/SettingsAdminTab.tsx` | Admin tab: user table + system info |
| `frontend/src/components/admin/UserForm.tsx` | Create/Edit user form (inline or modal) |

### Modified Files

| File | Change |
|---|---|
| `frontend/src/components/layout/SettingsDialog.tsx` | Replace current single-content layout with vertical tab shell. Add `activeTab` state. Conditionally include Admin tab. |
| `frontend/src/components/layout/SidebarFooter.tsx` | Change avatar pill to open `SettingsDialog` instead of the dropdown. Keep logout in the dropdown. |
| `frontend/src/components/layout/SettingsPanel.tsx` | **Migrate its contents into `SettingsSettingsTab.tsx`** — the current `SettingsPanel.tsx` file can be removed or repurposed. |
| `frontend/src/lib/api/users.ts` | Add `getUsers`, `deleteUser`, `createUser`, `updateUser` functions |
| `frontend/src/App.tsx` | (No change — dialog is rendered by SidebarFooter, not App) |

### Deleted Files

| File | Reason |
|---|---|
| `frontend/src/components/layout/SidebarTabPanel.tsx` | Already deleted; confirms sidebar-panel approach was replaced by dialog with vertical tabs |

---

## 8. State & Data Flow

```
User clicks avatar pill in SidebarFooter
  → SettingsDialog opens (controlled via local state in SidebarFooter or a dedicated store)
  → activeTab defaults to "profile"

User clicks a tab
  → activeTab → tab id
  → Content area renders the corresponding tab component

User edits a field (Profile or Settings tab)
  → Local form state updates
  → isDirty flag set true → Save button enabled

User clicks Save (Profile or Settings)
  → Compare form state with authStore.user
  → Call authStore.updatePreferences(changedFields)
  → On success: authStore.fetchUser() → store updated
  → isDirty → false

User navigates to Admin tab (admin only)
  → getUsers() called on mount
  → User table renders

User clicks Create User (Admin tab)
  → UserForm shows inline below/over table
  → User fills form → createUser() → on success, refresh user list

User clicks Edit on a user row (Admin tab)
  → UserForm pre-filled with user data, shown inline
  → User edits → updateUser() → on success, refresh user list

User clicks Delete on a user row (Admin tab)
  → Inline confirmation appears
  → User confirms → deleteUser() → on success, remove row from list
```

---

## 9. Styling

- All components use **Tailwind CSS** classes, consistent with the existing codebase.
- Tab rail: `bg-muted` background, `border-r border-border`, `min-w-[140px]`.
- Active tab: `bg-background`, `border-l-2 border-primary`, `text-foreground`.
- Inactive tab: `text-muted-foreground`, hover: `text-foreground` + `bg-accent/50`.
- Section headers: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`.
- Form rows: `flex items-center justify-between py-2`.
- Dialog: `max-w-2xl`, `rounded-xl`, `p-0` (no content padding — each tab manages its own padding).
- The existing `PreferenceToggle`, `PreferenceSegment`, `PreferenceSelect`, `PreferenceInput`, `PreferenceSection` components are reused directly.

---

## 10. Error Handling

- **Profile/Settings save fails:** Inline error below Save button. Form state preserved. No reset.
- **Admin user fetch fails:** Show inline error in the table area. Retry button.
- **Admin create/update/delete fails:** Show inline error. Form/row state preserved.
- **401 Unauthorized:** `apiFetch` handles this — redirect to `/login`.

---

## 11. Out of Scope

- Changes to the sidebar directory tree behavior.
- Changes to the file preview or upload dialogs.
- User impersonation or session management.
- Full-page admin routes (everything stays in the dialog).
- i18n string files beyond the `locale` field.
- Editing system settings (read-only display only).
