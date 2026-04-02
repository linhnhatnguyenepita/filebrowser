# Frontend-Next Component Redesign

**Date:** 2026-04-01
**Approach:** Option A — Token-first, component polish
**Scope:** All three layers — color tokens, UI primitives, layout components, file components, dialogs

---

## Goals

Apply the CloudFiles design system (`DESIGN_SYSTEM.md`) to `frontend-next/` by:
1. Replacing color tokens with the design system palette (green primary, charcoal dark backgrounds)
2. Updating all UI primitives to match design-system visual patterns
3. Updating layout and file components to match design-example aesthetics
4. Changing file interaction model to use a dots menu for actions
5. Updating all dialogs to share consistent card/surface treatment

The sidebar structure (source selector + directory tree) is preserved as-is. Only visual styling changes for the sidebar.

---

## Section 1: Color Tokens

File: `frontend-next/src/styles/globals.css`

Update the `.dark` class tokens to match `DESIGN_SYSTEM.md`. The app defaults to dark mode via user preferences so these are the primary tokens users see.

```css
.dark {
  --primary:            oklch(0.65 0.15 145);   /* Green accent */
  --primary-foreground: oklch(0.98 0 0);

  --background:         oklch(0.13 0.005 260);  /* Deep charcoal */
  --foreground:         oklch(0.95 0 0);

  --card:               oklch(0.17 0.005 260);  /* Elevated surface */
  --card-foreground:    oklch(0.95 0 0);

  --secondary:          oklch(0.22 0.005 260);  /* Subtle backgrounds, inputs */
  --secondary-foreground: oklch(0.85 0 0);

  --muted:              oklch(0.22 0.005 260);
  --muted-foreground:   oklch(0.55 0 0);

  --accent:             oklch(0.22 0.005 260);
  --accent-foreground:  oklch(0.85 0 0);

  --border:             oklch(0.25 0.005 260);
  --input:              oklch(0.22 0.005 260);
  --ring:               oklch(0.65 0.15 145);   /* Green focus ring */

  --destructive:        oklch(0.55 0.2 25);     /* Red */
  --destructive-foreground: oklch(0.98 0 0);

  --popover:            oklch(0.17 0.005 260);
  --popover-foreground: oklch(0.95 0 0);

  --sidebar:            oklch(0.17 0.005 260);
  --sidebar-foreground: oklch(0.95 0 0);
  --sidebar-border:     oklch(0.25 0.005 260);
  --sidebar-accent:     oklch(0.22 0.005 260);
  --sidebar-accent-foreground: oklch(0.85 0 0);
}
```

Light mode `:root` retains neutral white/slate as a fallback (no change required).

---

## Section 2: UI Primitives

Files: `frontend-next/src/components/ui/`

All changes are visual only — no prop signature or behavioral changes.

### `button.tsx`
- Default variant: `bg-primary text-primary-foreground hover:bg-primary/90`
- Ghost variant: `hover:bg-secondary/50 hover:text-foreground`
- Outline variant: `border-border hover:bg-secondary/50`
- Size `sm`: `h-8 px-3 text-sm`
- Size `icon`: `h-8 w-8`

### `input.tsx`
- Base: `bg-secondary border-0 text-foreground placeholder:text-muted-foreground`
- Focus: `ring-2 ring-primary/50`

### `dialog.tsx`
- Content: `bg-card border border-border rounded-xl shadow-lg`
- Title: `text-foreground font-semibold`
- Description: `text-muted-foreground`

### `dropdown-menu.tsx`
- Content: `bg-card border border-border rounded-lg shadow-md`
- Item: `text-foreground hover:bg-secondary/50`
- Destructive item: `text-destructive hover:bg-destructive/10`
- Separator: `bg-border`

### `context-menu.tsx`
- Same treatment as `dropdown-menu.tsx`

### `scroll-area.tsx`
- Scrollbar thumb: `bg-border hover:bg-muted-foreground`

### `separator.tsx`
- `bg-border`

### `switch.tsx`
- Checked: `bg-primary`
- Unchecked: `bg-secondary`

### `table.tsx`
- Header: `text-muted-foreground text-xs font-medium uppercase tracking-wider`
- Row hover: `hover:bg-secondary/30`
- Selected row: `bg-primary/5`

### `sonner.tsx`
- Toast: `bg-card border border-border text-foreground`

**General rule:** Replace all inline `style={{ color: "var(--x)" }}` patterns in all components with Tailwind semantic classes (e.g. `text-muted-foreground`, `bg-secondary`).

---

## Section 3: Layout Components

### `Sidebar.tsx`
- Width: `360px` (unchanged)
- Add brand header: `bg-primary` icon badge (`HardDrive`) + "FileBrowser" title, matching design-example logo treatment
- Source selector button: `bg-secondary border border-border rounded-lg hover:bg-secondary/80`
- Source dropdown: `bg-card border border-border rounded-lg shadow-md`
- Active source item: `bg-accent text-foreground`

### `SidebarFooter.tsx`
- User pill: `bg-secondary/50 rounded-xl p-4`
- Avatar: `bg-primary text-primary-foreground` (green circle)
- Settings button: `rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground`
- Logout button: same pattern as settings
- Active settings state: `bg-secondary text-foreground`
- Remove all inline style hacks

### `DirectoryTree.tsx`
- Active item: `bg-secondary text-foreground`
- Inactive item: `text-muted-foreground hover:bg-secondary/50 hover:text-foreground`
- Icons: `h-5 w-5`
- Tree indent lines: `border-l border-border`

### `Header.tsx`
- Container: `bg-background border-b border-border px-4 py-3`
- Search: `bg-secondary border-0 pl-10 rounded-lg` with `Search` icon at `left-3`
- View toggle: `rounded-lg bg-secondary p-1` wrapping two `Button` components (default/ghost variants)
- Upload button: `Button variant="outline" size="sm"` with `Upload` icon
- New Folder button: `Button variant="outline" size="sm"` with `FolderPlus` icon
- Remove all inline `style={{}}` overrides

### `Breadcrumbs.tsx`
- Root home button: `text-muted-foreground hover:bg-secondary/50 rounded-lg px-1.5 py-1`
- Active crumb: `text-foreground font-medium`
- Ancestor crumbs: `text-muted-foreground hover:bg-secondary/50 rounded-lg`
- Separator: `ChevronRight` at `opacity-50 text-muted-foreground`

### `StatusBar.tsx`
- Container: `bg-background border-t border-border px-4 h-10 text-xs text-muted-foreground`
- Bulk action buttons: `rounded-md px-2 py-1 hover:bg-secondary/50 text-muted-foreground hover:text-foreground`
- Destructive action: `text-destructive hover:bg-destructive/10`
- Replace `onMouseEnter/Leave` inline style hacks with Tailwind classes

---

## Section 4: File Components + Click Behavior

### Interaction Model Change

| Interaction | Before | After |
|---|---|---|
| Single click — folder | Navigate | Navigate (unchanged) |
| Single click — file | Open preview (debounced) | Select item |
| Double click — file | Download | Open preview (if previewable), else download |
| Ctrl/Cmd+click | Multi-select | Multi-select (unchanged) |
| Dots menu | Did not exist | Open/Preview, Download, Rename, Move, Copy, Delete |

The `CLICK_DELAY` debounce mechanism in `FileCard` and `FileRow` is replaced with straightforward single/double-click handlers. The dots `DropdownMenu` surfaces all file actions, removing the need for click-to-action behavior.

The checkbox column is removed from both `FileCard` and `FileRow`. Selection is via single-click on file items (ctrl+click for multi). This matches the design-example pattern.

### `FileIcon.tsx`
Returns a colored icon container for each file type:
- `directory`: `bg-primary/15 text-primary` (green)
- `text/*`, `application/pdf`, documents: `bg-blue-500/15 text-blue-400`
- Archives (`application/zip`, `application/x-tar`, etc.): `bg-amber-500/15 text-amber-500`
- `image/*`: `bg-purple-500/15 text-purple-400`
- `video/*`: `bg-rose-500/15 text-rose-400`
- `audio/*`: `bg-cyan-500/15 text-cyan-400`
- Fallback: `bg-secondary text-muted-foreground`

Two sizes: `lg` (h-12 w-12 rounded-xl, icon h-6 w-6) and `sm` (h-9 w-9 rounded-lg, icon h-4 w-4).

### `FileCard.tsx` (grid view)
```
rounded-xl border border-border bg-card p-4
hover: border-primary/50 bg-secondary/30
selected: border-primary bg-primary/5
```
- `group` class for coordinated hover
- `FileIcon` size `lg` at top-left
- `MoreHorizontal` dots button top-right: `opacity-0 group-hover:opacity-100 transition-opacity`
- Dots `DropdownMenu` items: Open/Preview, Download, Rename, Move, Copy, Delete
- Name: `font-medium text-foreground truncate`
- Meta: `text-xs text-muted-foreground` (size • modified)
- No checkbox

### `FileRow.tsx` (list view)
Switches from `<TableRow>`/`<TableCell>` HTML to a CSS grid `div` layout (matching design-example). The `<Table>` import is removed entirely.

```
div: grid grid-cols-[1fr_100px_140px_40px] items-center gap-4 px-4 py-3
hover: bg-secondary/30
selected: bg-primary/5
```
- First column: `FileIcon` size `sm` + name inline (`flex items-center gap-3`)
- Name: `font-medium text-foreground truncate`
- Size, Modified columns: `text-sm text-muted-foreground`
- Last column: `MoreHorizontal` dots button always visible (`Button variant="ghost" size="icon" h-8 w-8`)
- No checkbox column
- **Type column removed** (was showing JPEG/Folder/etc. — not present in design-example)

### `FileGrid.tsx`
- Section header: `text-sm font-semibold text-foreground` with count `text-xs text-muted-foreground`
- Grid: `grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
- Folders section above Files section

### `FileList.tsx`
Switches from `<Table>`/`<TableHeader>`/`<TableBody>` to plain `div` wrappers using the same CSS grid as `FileRow`.

- Container: `rounded-xl border border-border bg-card overflow-hidden`
- Header row: `grid grid-cols-[1fr_100px_140px_40px] px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground`
- Columns: Name, Size, Modified, (actions — empty header cell)

### `FileContextMenu.tsx`
- Right-click menu uses same `bg-card border-border rounded-lg shadow-md` treatment
- Items mirror dots menu: Open/Preview, Download, Rename, Move, Copy, Delete

---

## Section 5: Dialogs

All dialogs share the base treatment:
- `Dialog` content: `bg-card border border-border rounded-xl`
- Title: `text-foreground font-semibold`
- Description: `text-muted-foreground text-sm`
- Button hierarchy: primary action = `Button` default, cancel = `Button variant="ghost"`, destructive = `Button variant="destructive"`

### `CreateFolderDialog.tsx`
- Input: `bg-secondary border-0` with label `text-sm font-medium text-foreground`

### `RenameDialog.tsx`
- Same as CreateFolderDialog treatment

### `DeleteDialog.tsx`
- Confirm button: `variant="destructive"`
- File list: items use `bg-secondary/50 rounded-lg px-3 py-2 text-sm`

### `MoveCopyDialog.tsx`
- Directory picker rows: `rounded-lg hover:bg-secondary/50`
- Active/selected path: `border border-primary/50 bg-primary/5`

### `UploadDialog.tsx`
- Drop zone: `border-2 border-dashed border-border rounded-xl bg-secondary/30`
- Drop zone hover/drag-over: `border-primary/50 bg-primary/5`
- Progress bar fill: `bg-primary` on `bg-secondary` track
- File list items: `bg-secondary/50 rounded-lg`

### `PreviewModal.tsx`
- Overlay: `bg-background/95 backdrop-blur-sm`
- Header: `bg-card/80 border-b border-border`
- Nav/close buttons: `rounded-lg hover:bg-secondary/50`

### Preview sub-components
- `TextPreview`: `font-mono text-sm bg-secondary/50 rounded-xl p-4`
- `AudioPreview` / `VideoPreview`: controls `bg-secondary rounded-lg`
- `PDFPreview`: toolbar `bg-card border-b border-border`
- `ImagePreview`: `bg-background` container, centered with `object-contain`
- `PreviewInfoOverlay`: `bg-card/90 backdrop-blur-sm rounded-xl border border-border`

---

## Out of Scope

- Sidebar structure (source selector + directory tree layout is unchanged)
- Backend API changes
- New features beyond what exists today
- Light mode token redesign (`:root` stays neutral)
- `SidebarTabPanel.tsx` and `SettingsPanel.tsx` visual content (structure preserved, base token changes will cascade automatically)
