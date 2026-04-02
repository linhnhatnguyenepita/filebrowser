# Frontend-Next Component Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the CloudFiles design system (green primary, charcoal dark tokens) to all `frontend-next/` components and change file interaction to a dots-menu model.

**Architecture:** Token-first, layer-by-layer approach — update CSS custom properties first, then UI primitives, then layout components, then file components with the new interaction model, then dialogs. Each layer builds on the previous; tokens cascade automatically so later tasks only need Tailwind class changes.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, shadcn/base-ui primitives (`@base-ui/react`), Lucide React icons, Vite

---

## File Map

| File | Task |
|---|---|
| `frontend-next/src/styles/globals.css` | Task 1 |
| `frontend-next/src/components/ui/button.tsx` | Task 2 |
| `frontend-next/src/components/ui/input.tsx` | Task 2 |
| `frontend-next/src/components/ui/dialog.tsx` | Task 2 |
| `frontend-next/src/components/ui/dropdown-menu.tsx` | Task 2 |
| `frontend-next/src/components/ui/context-menu.tsx` | Task 2 |
| `frontend-next/src/components/ui/scroll-area.tsx` | Task 2 |
| `frontend-next/src/components/ui/separator.tsx` | Task 2 |
| `frontend-next/src/components/ui/switch.tsx` | Task 2 |
| `frontend-next/src/components/ui/table.tsx` | Task 2 |
| `frontend-next/src/components/ui/sonner.tsx` | Task 2 |
| `frontend-next/src/components/layout/Sidebar.tsx` | Task 3 |
| `frontend-next/src/components/layout/SidebarFooter.tsx` | Task 3 |
| `frontend-next/src/components/layout/DirectoryTree.tsx` | Task 3 |
| `frontend-next/src/components/layout/Header.tsx` | Task 4 |
| `frontend-next/src/components/layout/Breadcrumbs.tsx` | Task 4 |
| `frontend-next/src/components/layout/StatusBar.tsx` | Task 4 |
| `frontend-next/src/components/files/FileIcon.tsx` | Task 5 |
| `frontend-next/src/components/files/FileCard.tsx` | Task 6 |
| `frontend-next/src/components/files/FileRow.tsx` | Task 7 |
| `frontend-next/src/components/files/FileGrid.tsx` | Task 7 |
| `frontend-next/src/components/files/FileList.tsx` | Task 7 |
| `frontend-next/src/components/files/FileContextMenu.tsx` | Task 7 |
| `frontend-next/src/components/dialogs/CreateFolderDialog.tsx` | Task 8 |
| `frontend-next/src/components/dialogs/RenameDialog.tsx` | Task 8 |
| `frontend-next/src/components/dialogs/DeleteDialog.tsx` | Task 8 |
| `frontend-next/src/components/dialogs/UploadDialog.tsx` | Task 9 |
| `frontend-next/src/components/dialogs/MoveCopyDialog.tsx` | Task 9 |
| `frontend-next/src/components/dialogs/PreviewModal.tsx` | Task 10 |
| `frontend-next/src/components/dialogs/preview/TextPreview.tsx` | Task 10 |
| `frontend-next/src/components/dialogs/preview/PreviewInfoOverlay.tsx` | Task 10 |
| `frontend-next/src/components/dialogs/preview/ImagePreview.tsx` | Task 10 |
| `frontend-next/src/components/dialogs/preview/AudioPreview.tsx` | Task 10 |
| `frontend-next/src/components/dialogs/preview/VideoPreview.tsx` | Task 10 |
| `frontend-next/src/components/dialogs/preview/PDFPreview.tsx` | Task 10 |

---

## Task 1: Color Tokens

**Files:**
- Modify: `frontend-next/src/styles/globals.css`

- [ ] **Step 1: Replace the `.dark` CSS class tokens**

Open `frontend-next/src/styles/globals.css` and replace the entire `.dark { ... }` block with:

```css
.dark {
  --background:         oklch(0.13 0.005 260);
  --foreground:         oklch(0.95 0 0);

  --card:               oklch(0.17 0.005 260);
  --card-foreground:    oklch(0.95 0 0);

  --popover:            oklch(0.17 0.005 260);
  --popover-foreground: oklch(0.95 0 0);

  --primary:            oklch(0.65 0.15 145);
  --primary-foreground: oklch(0.98 0 0);

  --secondary:          oklch(0.22 0.005 260);
  --secondary-foreground: oklch(0.85 0 0);

  --muted:              oklch(0.22 0.005 260);
  --muted-foreground:   oklch(0.55 0 0);

  --accent:             oklch(0.22 0.005 260);
  --accent-foreground:  oklch(0.85 0 0);

  --destructive:        oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:             oklch(0.25 0.005 260);
  --input:              oklch(0.22 0.005 260);
  --ring:               oklch(0.65 0.15 145);

  --sidebar:            oklch(0.17 0.005 260);
  --sidebar-foreground: oklch(0.95 0 0);
  --sidebar-primary:    oklch(0.65 0.15 145);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent:     oklch(0.22 0.005 260);
  --sidebar-accent-foreground: oklch(0.85 0 0);
  --sidebar-border:     oklch(0.25 0.005 260);
  --sidebar-ring:       oklch(0.65 0.15 145);
}
```

- [ ] **Step 2: Verify in browser**

Start the dev server: `cd frontend-next && bun run dev`

Log in and toggle dark mode. Verify:
- Background is deep charcoal (not pure black)
- Primary buttons and active states appear green
- Card surfaces are slightly lighter than background

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/styles/globals.css
git commit -m "feat(design): apply CloudFiles dark mode color tokens"
```

---

## Task 2: UI Primitives

**Files:**
- Modify: `frontend-next/src/components/ui/button.tsx`
- Modify: `frontend-next/src/components/ui/input.tsx`
- Modify: `frontend-next/src/components/ui/dialog.tsx`
- Modify: `frontend-next/src/components/ui/dropdown-menu.tsx`
- Modify: `frontend-next/src/components/ui/context-menu.tsx`
- Modify: `frontend-next/src/components/ui/scroll-area.tsx`
- Modify: `frontend-next/src/components/ui/separator.tsx`
- Modify: `frontend-next/src/components/ui/switch.tsx`
- Modify: `frontend-next/src/components/ui/table.tsx`
- Modify: `frontend-next/src/components/ui/sonner.tsx`

### button.tsx

- [ ] **Step 1: Update button variants**

Replace the `buttonVariants` cva call in `frontend-next/src/components/ui/button.tsx`. Keep the function signature identical, only change the class strings:

```ts
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-border bg-transparent hover:bg-secondary/50 hover:text-foreground dark:border-border dark:bg-transparent dark:hover:bg-secondary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-secondary/50 hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-sm in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-3",
        icon: "size-8",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### input.tsx

- [ ] **Step 2: Update input base styles**

Read `frontend-next/src/components/ui/input.tsx`, then find the className string on the `<input>` element and replace it so the input renders with a secondary background and no visible border by default, using a green focus ring:

The className should include:
```
bg-secondary border-0 text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none
```

Keep all existing props (`type`, `value`, `onChange`, `disabled`, `autoFocus`, etc.) unchanged.

### dialog.tsx

- [ ] **Step 3: Update dialog content classes**

Read `frontend-next/src/components/ui/dialog.tsx`. Find `DialogContent` and ensure its wrapper has:
```
bg-card border border-border rounded-xl shadow-lg
```
Find `DialogTitle` and ensure it has: `text-foreground font-semibold`
Find `DialogDescription` and ensure it has: `text-muted-foreground text-sm`

These likely already use semantic tokens — only add `rounded-xl` if the content panel doesn't already have it.

### dropdown-menu.tsx

- [ ] **Step 4: Update dropdown menu popup classes**

Read `frontend-next/src/components/ui/dropdown-menu.tsx`. Find `DropdownMenuContent`'s `MenuPrimitive.Popup` className and replace it with:

```
z-50 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-card border border-border p-1 text-foreground shadow-md duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95
```

Find `DropdownMenuItem` and ensure it has: `rounded-md hover:bg-secondary/50 text-foreground`

Find any destructive item variant and ensure it has: `text-destructive hover:bg-destructive/10`

### context-menu.tsx

- [ ] **Step 5: Apply same treatment to context menu**

Read `frontend-next/src/components/ui/context-menu.tsx`. Apply the same popup class changes as `dropdown-menu.tsx` Step 4 — `bg-card border border-border rounded-lg shadow-md` for the popup, `rounded-md hover:bg-secondary/50` for items, `text-destructive hover:bg-destructive/10` for destructive items.

### scroll-area.tsx, separator.tsx, switch.tsx

- [ ] **Step 6: Update remaining primitives**

**scroll-area.tsx** — Find the scrollbar thumb element and set: `bg-border hover:bg-muted-foreground rounded-full`

**separator.tsx** — Ensure the separator has `bg-border` (not `bg-border/50` or similar lighter value).

**switch.tsx** — Find the checked state class and ensure it uses `bg-primary` (green). Unchecked state should use `bg-secondary`.

### table.tsx

- [ ] **Step 7: Update table header styles**

Read `frontend-next/src/components/ui/table.tsx`. Find `TableHead` and add to its className:
```
text-muted-foreground text-xs font-medium uppercase tracking-wider
```

Find `TableRow` and ensure hover state is `hover:bg-secondary/30`. Selected state (`data-[state=selected]`) should be `bg-primary/5`.

### sonner.tsx

- [ ] **Step 8: Update sonner toast styles**

Read `frontend-next/src/components/ui/sonner.tsx`. Find the `toastOptions` or `classNames` prop passed to `<Toaster>`. Set:
```ts
classNames: {
  toast: "bg-card border border-border text-foreground rounded-xl shadow-lg",
  description: "text-muted-foreground",
  actionButton: "bg-primary text-primary-foreground",
  cancelButton: "bg-secondary text-secondary-foreground",
}
```

- [ ] **Step 9: Verify primitives in browser**

Check that: buttons have green default state, inputs show secondary background, dropdowns open with card background and rounded corners, toasts appear with card surface.

- [ ] **Step 10: Commit**

```bash
git add frontend-next/src/components/ui/
git commit -m "feat(design): update UI primitive styles to match design system"
```

---

## Task 3: Sidebar Components

**Files:**
- Modify: `frontend-next/src/components/layout/Sidebar.tsx`
- Modify: `frontend-next/src/components/layout/SidebarFooter.tsx`
- Modify: `frontend-next/src/components/layout/DirectoryTree.tsx`

### Sidebar.tsx

- [ ] **Step 1: Add brand header and update source selector**

Replace the app title block (the `div` with `height: "52px"`) and source selector section in `frontend-next/src/components/layout/Sidebar.tsx`:

```tsx
{/* Brand header */}
<div className="flex items-center gap-3 px-4 border-b border-border shrink-0" style={{ height: "52px" }}>
  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
    <HardDrive className="h-5 w-5 text-primary-foreground" />
  </div>
  <div>
    <h1 className="font-semibold text-foreground">FileBrowser</h1>
    <p className="text-xs text-muted-foreground">File Manager</p>
  </div>
</div>

{/* Source selector */}
<div className="px-3 py-2 shrink-0">
  <div className="relative">
    <button
      onClick={() => setSourceDropdownOpen((o) => !o)}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-secondary border border-border text-foreground hover:bg-secondary/80"
    >
      <HardDrive className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left truncate font-semibold">
        {activeSource || "default"}
      </span>
      {sourceNames.length > 1 && (
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform ${sourceDropdownOpen ? "rotate-180" : ""}`}
        />
      )}
    </button>

    {sourceDropdownOpen && sourceNames.length > 1 && (
      <div className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-50 bg-card border border-border shadow-md">
        {sourceNames.map((name) => (
          <button
            key={name}
            onClick={() => handleSourceSelect(name)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary/50 text-left ${
              name === activeSource ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            <HardDrive className="h-3 w-3 shrink-0" />
            {name}
          </button>
        ))}
      </div>
    )}
  </div>
</div>
```

Remove all remaining `style={{ ... }}` overrides on the `<aside>` itself — replace with Tailwind classes. Keep `style={{ width: "360px" }}` since it's not a color/spacing token.

### SidebarFooter.tsx

- [ ] **Step 2: Update user pill and action buttons**

Replace the entire JSX return in `frontend-next/src/components/layout/SidebarFooter.tsx`:

```tsx
return (
  <div className="px-3 py-3 shrink-0 border-t border-border space-y-1">
    {/* User identity pill */}
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-secondary/50">
      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{user?.username ?? "User"}</p>
        {user?.permissions?.admin && (
          <p className="text-xs text-muted-foreground">Admin</p>
        )}
      </div>
    </div>

    {/* Settings */}
    <button
      onClick={() => onTabChange(activeTab === "settings" ? "none" : "settings")}
      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        activeTab === "settings"
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
    >
      <Settings size={16} />
      Settings
    </button>

    {/* Logout */}
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary/50 hover:text-foreground disabled:opacity-50"
    >
      <LogOut size={16} />
      {loggingOut ? "Logging out…" : "Logout"}
    </button>
  </div>
);
```

### DirectoryTree.tsx

- [ ] **Step 3: Replace inline styles with Tailwind classes in TreeNodeItem**

In `frontend-next/src/components/layout/DirectoryTree.tsx`, replace the `TreeNodeItem` component's inner `div` (the clickable row):

```tsx
<div
  className={`flex items-center gap-1 rounded-lg cursor-pointer select-none transition-colors py-2 pr-3 ${
    isActive
      ? "bg-secondary text-foreground font-medium"
      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
  }`}
  style={{ paddingLeft: `${depth * 12 + 10}px` }}
  onClick={() => {
    onNavigate(node.path);
    onToggle(node.path);
  }}
>
```

Remove the `style` overrides for `background`, `color`, and `fontWeight` from this element — they are now handled by the Tailwind classes above. Keep only `paddingLeft` in the inline style (it's dynamic and cannot be a static Tailwind class).

Also update the folder icon size: change `<FolderOpen size={20} />` and `<Folder size={20} />` to `size={16}` to match the design-example's navigation icon size.

- [ ] **Step 4: Verify sidebar in browser**

Check: brand header shows green icon badge + two-line title; source selector is styled; directory tree active item is highlighted with secondary background; user pill is `rounded-xl bg-secondary/50`.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/components/layout/Sidebar.tsx frontend-next/src/components/layout/SidebarFooter.tsx frontend-next/src/components/layout/DirectoryTree.tsx
git commit -m "feat(design): redesign sidebar components with CloudFiles design system"
```

---

## Task 4: Header, Breadcrumbs, StatusBar

**Files:**
- Modify: `frontend-next/src/components/layout/Header.tsx`
- Modify: `frontend-next/src/components/layout/Breadcrumbs.tsx`
- Modify: `frontend-next/src/components/layout/StatusBar.tsx`

### Header.tsx

- [ ] **Step 1: Update header layout and styles**

Replace the entire JSX return in `frontend-next/src/components/layout/Header.tsx`:

```tsx
return (
  <header className="flex items-center gap-3 px-4 py-3 shrink-0 bg-background border-b border-border">
    {/* Breadcrumbs — left */}
    <div className="flex-1 min-w-0">
      <Breadcrumbs path={path} onNavigate={onNavigate} />
    </div>

    {/* Search input — center */}
    <div className="relative flex items-center" style={{ width: "280px", flexShrink: 0 }}>
      <Search size={14} className="absolute left-3 pointer-events-none text-muted-foreground" />
      <input
        type="text"
        placeholder="Search files…"
        value={inputValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full rounded-lg text-sm bg-secondary border-0 text-foreground placeholder:text-muted-foreground pl-9 pr-8 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      />
      {searchLoading ? (
        <span className="absolute right-2 flex items-center animate-spin text-muted-foreground">
          <Loader2 size={14} />
        </span>
      ) : inputValue ? (
        <button
          onClick={handleClearSearch}
          className="absolute right-2 rounded transition-opacity hover:opacity-80 text-muted-foreground"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>

    {/* Action buttons — right */}
    <div className="flex items-center gap-2 shrink-0">
      {/* View mode toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="icon-sm"
          onClick={() => setViewMode("grid")}
          title="Grid view"
          aria-label="Grid view"
        >
          <LayoutGrid size={15} />
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="icon-sm"
          onClick={() => setViewMode("list")}
          title="List view"
          aria-label="List view"
        >
          <List size={15} />
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border opacity-50 mx-1" />

      {/* Upload */}
      <Button variant="outline" size="sm" onClick={onUpload} aria-label="Upload files">
        <Upload size={14} />
        Upload
      </Button>

      {/* New folder */}
      <Button variant="outline" size="sm" onClick={onNewFolder} aria-label="New folder">
        <FolderPlus size={14} />
        New folder
      </Button>
    </div>
  </header>
);
```

Add the missing `LayoutGrid` import — it replaces the old `LayoutGrid` icon (already imported). Add `Button` import from `@/components/ui/button`.

### Breadcrumbs.tsx

- [ ] **Step 2: Update breadcrumb styles**

Replace the JSX return in `frontend-next/src/components/layout/Breadcrumbs.tsx`:

```tsx
return (
  <nav aria-label="File path" className="flex items-center gap-0.5 text-sm min-w-0 overflow-hidden">
    <button
      onClick={() => onNavigate("/")}
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors shrink-0 hover:bg-secondary/50 ${
        segments.length === 0 ? "text-foreground" : "text-muted-foreground"
      }`}
      aria-label="Home"
      title="Home"
    >
      <Home size={15} />
    </button>

    {crumbs.map((crumb, idx) => {
      const isLast = idx === crumbs.length - 1;
      return (
        <span key={crumb.path} className="flex items-center gap-0.5 min-w-0">
          <ChevronRight size={13} className="shrink-0 text-muted-foreground opacity-50" />
          <button
            onClick={() => onNavigate(crumb.path)}
            className={`px-2 py-1 rounded-lg transition-colors truncate max-w-[180px] hover:bg-secondary/50 ${
              isLast ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
            title={crumb.label}
          >
            {crumb.label}
          </button>
        </span>
      );
    })}
  </nav>
);
```

### StatusBar.tsx

- [ ] **Step 3: Remove inline style hacks from StatusBar**

Replace the `ActionButton` component in `frontend-next/src/components/layout/StatusBar.tsx`:

```tsx
function ActionButton({ onClick, title, icon, label, danger }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
      title={title}
      aria-label={title}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
```

Also update the outer container div and "Clear" button:

```tsx
<div
  className="flex items-center justify-between px-4 shrink-0 bg-background border-t border-border text-muted-foreground"
  style={{ height: "40px", fontSize: "12px" }}
>
```

```tsx
<button
  onClick={clearSelection}
  className="ml-2 px-2 py-1 rounded-md text-sm transition-colors text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
>
  Clear
</button>
```

- [ ] **Step 4: Verify header area in browser**

Check: search input has secondary background; view toggle has pill container with active state green; upload/new folder are outline buttons; breadcrumbs have correct text hierarchy; status bar bulk action buttons have no inline JS hover hacks.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/components/layout/Header.tsx frontend-next/src/components/layout/Breadcrumbs.tsx frontend-next/src/components/layout/StatusBar.tsx
git commit -m "feat(design): redesign header, breadcrumbs, and status bar"
```

---

## Task 5: FileIcon

**Files:**
- Modify: `frontend-next/src/components/files/FileIcon.tsx`

- [ ] **Step 1: Rewrite FileIcon to return a colored icon container**

The current `FileIcon` returns a bare `<Icon />` element. Replace the entire file:

```tsx
import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  Folder,
  FileType,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconSize = "lg" | "sm";

interface FileIconProps {
  type: string;
  iconSize?: IconSize;
  className?: string;
}

type IconConfig = {
  icon: LucideIcon;
  containerClass: string;
  iconClass: string;
};

const typeIconMap: Array<[RegExp, IconConfig]> = [
  [/^directory$/, { icon: Folder, containerClass: "bg-primary/15", iconClass: "text-primary" }],
  [/^image\//, { icon: FileImage, containerClass: "bg-purple-500/15", iconClass: "text-purple-400" }],
  [/^video\//, { icon: FileVideo, containerClass: "bg-rose-500/15", iconClass: "text-rose-400" }],
  [/^audio\//, { icon: FileAudio, containerClass: "bg-cyan-500/15", iconClass: "text-cyan-400" }],
  [/^application\/(zip|x-tar|x-gzip|x-bzip2|x-7z|x-rar|gzip)/, { icon: FileArchive, containerClass: "bg-amber-500/15", iconClass: "text-amber-500" }],
  [/^application\/(json|xml|javascript|typescript|x-sh|x-python)/, { icon: FileCode, containerClass: "bg-blue-500/15", iconClass: "text-blue-400" }],
  [/^text\/(html|css|javascript|xml|x-python|x-go|x-rust)/, { icon: FileCode, containerClass: "bg-blue-500/15", iconClass: "text-blue-400" }],
  [/^application\/pdf$/, { icon: FileType, containerClass: "bg-red-500/15", iconClass: "text-red-400" }],
  [/^application\/vnd\.(ms-excel|openxmlformats.*sheet)/, { icon: FileSpreadsheet, containerClass: "bg-green-500/15", iconClass: "text-green-400" }],
  [/^application\/vnd\.(ms-word|openxmlformats.*document)/, { icon: FileText, containerClass: "bg-blue-500/15", iconClass: "text-blue-400" }],
  [/^application\/vnd\.(ms-powerpoint|openxmlformats.*presentation)/, { icon: FileText, containerClass: "bg-orange-500/15", iconClass: "text-orange-400" }],
  [/^text\//, { icon: FileText, containerClass: "bg-blue-500/15", iconClass: "text-blue-400" }],
];

const fallbackConfig: IconConfig = {
  icon: File,
  containerClass: "bg-secondary",
  iconClass: "text-muted-foreground",
};

function getIconConfig(mimeType: string): IconConfig {
  for (const [pattern, config] of typeIconMap) {
    if (pattern.test(mimeType)) return config;
  }
  return fallbackConfig;
}

export default function FileIcon({ type, iconSize = "sm", className }: FileIconProps) {
  const { icon: Icon, containerClass, iconClass } = getIconConfig(type);

  const isLg = iconSize === "lg";
  const containerSizeClass = isLg ? "h-12 w-12 rounded-xl" : "h-9 w-9 rounded-lg";
  const iconSizeClass = isLg ? "h-6 w-6" : "h-4 w-4";

  return (
    <div className={cn("flex items-center justify-center shrink-0", containerSizeClass, containerClass, className)}>
      <Icon className={cn(iconSizeClass, iconClass)} />
    </div>
  );
}
```

- [ ] **Step 2: Update all FileIcon call sites to use the new prop**

The old `FileIcon` accepted `type: string` and `size?: number`. The new one accepts `type: string` and `iconSize?: "lg" | "sm"`. Find every usage:

- `frontend-next/src/components/files/FileCard.tsx` — will be updated in Task 6
- `frontend-next/src/components/files/FileRow.tsx` — will be updated in Task 7

No other files use `FileIcon` directly. No changes needed yet.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/components/files/FileIcon.tsx
git commit -m "feat(design): redesign FileIcon with colored type containers"
```

---

## Task 6: FileCard (Grid View + Dots Menu)

**Files:**
- Modify: `frontend-next/src/components/files/FileCard.tsx`

This task changes the click model: single-click on a file selects it; double-click opens preview or downloads; dots `DropdownMenu` handles all file actions (removing the need for special click-to-action behavior on files).

- [ ] **Step 1: Rewrite FileCard**

Replace the entire content of `frontend-next/src/components/files/FileCard.tsx`:

```tsx
import { useRef, useCallback } from "react";
import { MoreHorizontal, Download, Pencil, FolderInput, Copy, Trash2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import FileIcon from "./FileIcon";
import { isPreviewable } from "@/lib/utils/preview";
import { cn } from "@/lib/utils";

const CLICK_DELAY = 250;

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

interface FileCardProps {
  item: FileInfo;
  onNavigate: (path: string) => void;
}

export default function FileCard({ item, onNavigate }: FileCardProps) {
  const { selected, toggleSelect, source, setPreviewFile } = useFileStore();
  const { openDialog } = useUIStore();
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelected = selected.has(item.name);
  const isDir = item.type === "directory";

  const downloadFile = useCallback(() => {
    window.open(getDownloadURL(source, item.path), "_blank");
  }, [source, item]);

  const ensureSelected = useCallback(() => {
    if (!selected.has(item.name)) toggleSelect(item.name);
  }, [selected, item.name, toggleSelect]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        toggleSelect(item.name);
        return;
      }
      if (isDir) {
        onNavigate(item.path);
        return;
      }
      // Files: single-click selects, double-click previews/downloads
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        if (isPreviewable(item.type)) {
          setPreviewFile(item);
        } else {
          downloadFile();
        }
      } else {
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null;
          toggleSelect(item.name);
        }, CLICK_DELAY);
      }
    },
    [isDir, item, onNavigate, toggleSelect, setPreviewFile, downloadFile]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (isDir) {
          onNavigate(item.path);
        } else if (isPreviewable(item.type)) {
          setPreviewFile(item);
        } else {
          downloadFile();
        }
      }
    },
    [isDir, item, onNavigate, setPreviewFile, downloadFile]
  );

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    ensureSelected();
    openDialog("rename");
  };

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    ensureSelected();
    openDialog("moveCopy");
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    ensureSelected();
    openDialog("moveCopy");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    ensureSelected();
    openDialog("delete");
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${item.name}${isDir ? " (folder)" : ""}`}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card p-4 cursor-pointer text-left transition-all",
        "hover:border-primary/50 hover:bg-secondary/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-primary bg-primary/5"
      )}
    >
      {/* Icon + dots menu row */}
      <div className="mb-3 flex items-start justify-between">
        <FileIcon type={item.type} iconSize="lg" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 transition-opacity group-hover:opacity-100 shrink-0"
              onClick={(e) => e.stopPropagation()}
              aria-label="File actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isPreviewable(item.type) && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewFile(item); }}>
                Open / Preview
              </DropdownMenuItem>
            )}
            {!isDir && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); downloadFile(); }}>
                <Download className="h-4 w-4" />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRename}>
              <Pencil className="h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMove}>
              <FolderInput className="h-4 w-4" />
              Move
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Name */}
      <h3 className="mb-1 truncate font-medium text-foreground text-sm" title={item.name}>
        {item.name}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {!isDir && <span>{formatSize(item.size)}</span>}
      </div>
    </div>
  );
}
```

**Note:** `DropdownMenuItem` with `variant="destructive"` uses the `variant` prop — check the current `dropdown-menu.tsx` to confirm this prop exists (it does via the `data-variant` attribute). If not, apply `className="text-destructive hover:bg-destructive/10"` directly instead.

- [ ] **Step 2: Verify FileCard in browser**

In grid view: cards show `rounded-xl` with card background; dots button appears on hover; clicking a file once selects it; double-clicking opens preview; single-clicking a folder navigates.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/components/files/FileCard.tsx
git commit -m "feat(design): redesign FileCard with dots menu and new interaction model"
```

---

## Task 7: FileRow, FileGrid, FileList, FileContextMenu

**Files:**
- Modify: `frontend-next/src/components/files/FileRow.tsx`
- Modify: `frontend-next/src/components/files/FileGrid.tsx`
- Modify: `frontend-next/src/components/files/FileList.tsx`
- Modify: `frontend-next/src/components/files/FileContextMenu.tsx`

### FileRow.tsx

- [ ] **Step 1: Rewrite FileRow (table → CSS grid, add dots menu)**

Replace the entire content of `frontend-next/src/components/files/FileRow.tsx`:

```tsx
import { useRef, useCallback } from "react";
import { MoreHorizontal, Download, Pencil, FolderInput, Copy, Trash2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import FileIcon from "./FileIcon";
import { isPreviewable } from "@/lib/utils/preview";
import { cn } from "@/lib/utils";

const CLICK_DELAY = 250;

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface FileRowProps {
  item: FileInfo;
  onNavigate: (path: string) => void;
}

export default function FileRow({ item, onNavigate }: FileRowProps) {
  const { selected, toggleSelect, source, setPreviewFile } = useFileStore();
  const { openDialog } = useUIStore();
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelected = selected.has(item.name);
  const isDir = item.type === "directory";

  const downloadFile = useCallback(() => {
    window.open(getDownloadURL(source, item.path), "_blank");
  }, [source, item]);

  const ensureSelected = useCallback(() => {
    if (!selected.has(item.name)) toggleSelect(item.name);
  }, [selected, item.name, toggleSelect]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        toggleSelect(item.name);
        return;
      }
      if (isDir) {
        onNavigate(item.path);
        return;
      }
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        if (isPreviewable(item.type)) {
          setPreviewFile(item);
        } else {
          downloadFile();
        }
      } else {
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null;
          toggleSelect(item.name);
        }, CLICK_DELAY);
      }
    },
    [isDir, item, onNavigate, toggleSelect, setPreviewFile, downloadFile]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (isDir) {
          onNavigate(item.path);
        } else if (isPreviewable(item.type)) {
          setPreviewFile(item);
        } else {
          downloadFile();
        }
      }
    },
    [isDir, item, onNavigate, setPreviewFile, downloadFile]
  );

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${item.name}${isDir ? " (folder)" : ""}`}
      className={cn(
        "grid grid-cols-[1fr_100px_140px_40px] items-center gap-4 px-4 py-3 cursor-pointer transition-colors",
        "hover:bg-secondary/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "bg-primary/5"
      )}
    >
      {/* Name column: icon + name */}
      <div className="flex items-center gap-3 min-w-0">
        <FileIcon type={item.type} iconSize="sm" />
        <span className="truncate font-medium text-foreground text-sm" title={item.name}>
          {item.name}
        </span>
      </div>

      {/* Size */}
      <span className="text-sm text-muted-foreground">
        {isDir ? "\u2014" : formatSize(item.size)}
      </span>

      {/* Modified */}
      <span className="text-sm text-muted-foreground">
        {formatDate(item.modified)}
      </span>

      {/* Dots menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => e.stopPropagation()}
            aria-label="File actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isPreviewable(item.type) && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewFile(item); }}>
              Open / Preview
            </DropdownMenuItem>
          )}
          {!isDir && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); downloadFile(); }}>
              <Download className="h-4 w-4" />
              Download
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); ensureSelected(); openDialog("rename"); }}>
            <Pencil className="h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); ensureSelected(); openDialog("moveCopy"); }}>
            <FolderInput className="h-4 w-4" />
            Move
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); ensureSelected(); openDialog("moveCopy"); }}>
            <Copy className="h-4 w-4" />
            Copy
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); ensureSelected(); openDialog("delete"); }}>
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

### FileGrid.tsx

- [ ] **Step 2: Update FileGrid grid template**

Replace the inline `style` grid with Tailwind in `frontend-next/src/components/files/FileGrid.tsx`:

```tsx
export default function FileGrid({ items, onNavigate }: FileGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        This folder is empty
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <FileContextMenu key={item.name} item={item}>
          <FileCard item={item} onNavigate={onNavigate} />
        </FileContextMenu>
      ))}
    </div>
  );
}
```

### FileList.tsx

- [ ] **Step 3: Rewrite FileList (Table → CSS grid)**

Replace the entire content of `frontend-next/src/components/files/FileList.tsx`:

```tsx
import { ArrowDown, ArrowUp } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import FileRow from "./FileRow";
import FileContextMenu from "./FileContextMenu";

interface FileListProps {
  items: FileInfo[];
  onNavigate: (path: string) => void;
}

type SortField = "name" | "size" | "modified";

export default function FileList({ items, onNavigate }: FileListProps) {
  const { sortBy, sortAsc, setSorting } = useFileStore();

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSorting(field, !sortAsc);
    } else {
      setSorting(field, true);
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        This folder is empty
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_100px_140px_40px] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <button
          onClick={() => handleSort("name")}
          className="flex items-center gap-1 text-left hover:text-foreground transition-colors"
        >
          Name <SortIndicator field="name" />
        </button>
        <button
          onClick={() => handleSort("size")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Size <SortIndicator field="size" />
        </button>
        <button
          onClick={() => handleSort("modified")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Modified <SortIndicator field="modified" />
        </button>
        <span />
      </div>

      {/* Rows */}
      {items.map((item) => (
        <FileContextMenu key={item.name} item={item}>
          <FileRow item={item} onNavigate={onNavigate} />
        </FileContextMenu>
      ))}
    </div>
  );
}
```

### FileContextMenu.tsx

- [ ] **Step 4: Update FileContextMenu styles**

The context menu already uses the `ContextMenu` primitive. No structural changes needed — the `context-menu.tsx` primitive update in Task 2 (Step 5) handles the visual treatment. Just verify it still works correctly after the primitive update.

If any inline `style={{ ... }}` overrides exist in `FileContextMenu.tsx`, remove them in favor of the semantic classes now set in the primitive.

- [ ] **Step 5: Verify list view in browser**

Check: list view shows `rounded-xl border bg-card` container; header row has uppercase tracking; rows use the CSS grid layout (not a `<table>`); dots menu appears in the last column; clicking a file selects it; double-clicking opens preview.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/components/files/
git commit -m "feat(design): redesign file list/grid components and update interaction model"
```

---

## Task 8: Simple Dialogs (CreateFolder, Rename, Delete)

**Files:**
- Modify: `frontend-next/src/components/dialogs/CreateFolderDialog.tsx`
- Modify: `frontend-next/src/components/dialogs/RenameDialog.tsx`
- Modify: `frontend-next/src/components/dialogs/DeleteDialog.tsx`

The Dialog primitive already provides `bg-card border border-border rounded-xl` after Task 2. The changes here are to the dialog body content only.

### CreateFolderDialog.tsx

- [ ] **Step 1: Add spacing and label**

In `frontend-next/src/components/dialogs/CreateFolderDialog.tsx`, wrap the `<Input>` with a label:

```tsx
<div className="py-4 space-y-2">
  <label className="text-sm font-medium text-foreground">Folder name</label>
  <Input
    autoFocus
    placeholder="e.g. Documents"
    value={name}
    onChange={(e) => setName(e.target.value)}
    disabled={submitting}
  />
</div>
```

### RenameDialog.tsx

- [ ] **Step 2: Add spacing and label**

In `frontend-next/src/components/dialogs/RenameDialog.tsx`, wrap the `<Input>` similarly:

```tsx
<div className="py-4 space-y-2">
  <label className="text-sm font-medium text-foreground">New name</label>
  <Input
    autoFocus
    value={newName}
    onChange={(e) => setNewName(e.target.value)}
    disabled={submitting}
    onFocus={(e) => {
      const dotIdx = oldName.lastIndexOf(".");
      if (!isDir && dotIdx > 0) {
        e.currentTarget.setSelectionRange(0, dotIdx);
      } else {
        e.currentTarget.select();
      }
    }}
  />
</div>
```

### DeleteDialog.tsx

- [ ] **Step 3: Update multi-item list style**

In `frontend-next/src/components/dialogs/DeleteDialog.tsx`, replace the `<ul>` list:

```tsx
{items.length > 1 && (
  <div className="max-h-40 overflow-auto space-y-1">
    {items.map((item) => (
      <div
        key={item.name}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 text-sm text-muted-foreground"
      >
        <span className="truncate">{item.name}</span>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 4: Verify dialogs in browser**

Open each dialog: inputs have secondary background; delete list items have rounded-lg secondary style; all buttons follow primary/ghost/destructive hierarchy.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/components/dialogs/CreateFolderDialog.tsx frontend-next/src/components/dialogs/RenameDialog.tsx frontend-next/src/components/dialogs/DeleteDialog.tsx
git commit -m "feat(design): update CreateFolder, Rename, Delete dialog styles"
```

---

## Task 9: Upload and MoveCopy Dialogs

**Files:**
- Modify: `frontend-next/src/components/dialogs/UploadDialog.tsx`
- Modify: `frontend-next/src/components/dialogs/MoveCopyDialog.tsx`

### UploadDialog.tsx

- [ ] **Step 1: Update drop zone, file list, and progress bar**

In `frontend-next/src/components/dialogs/UploadDialog.tsx`:

**Drop zone** — replace the className on the drop zone `div`:
```tsx
className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/30 p-6 text-sm text-muted-foreground transition-colors cursor-pointer hover:border-primary/50 hover:bg-primary/5"
```

**Progress bar fill** — change `bg-foreground` to `bg-primary`:
```tsx
<div
  className="h-full rounded-full transition-all bg-primary"
  style={{ width: `${upload.progress}%` }}
/>
```

**"Done" success text** — replace the green-600 hardcoded color:
```tsx
{upload.status === "done" && (
  <span className="text-sm text-primary">Done</span>
)}
```

**File list items** — wrap each upload item in a styled div:
```tsx
<div
  key={`${upload.file.name}-${i}`}
  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 text-sm"
>
```

### MoveCopyDialog.tsx

- [ ] **Step 2: Replace inline styles in PickerNodeItem**

In `frontend-next/src/components/dialogs/MoveCopyDialog.tsx`, replace the `PickerNodeItem` inner clickable div:

```tsx
<div
  className={`flex items-center gap-1 rounded-lg cursor-pointer select-none text-sm py-1.5 px-2 transition-colors ${
    isSelected
      ? "border border-primary/50 bg-primary/5 text-foreground"
      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
  }`}
  style={{ paddingLeft: `${depth * 12 + 8}px` }}
  onClick={() => onSelect(node.path)}
>
```

Remove the old `style={{ background: ..., color: ... }}` from this element. Keep only `paddingLeft` for dynamic depth indentation.

- [ ] **Step 3: Verify in browser**

Upload dialog: drop zone has dashed border, hover turns green; progress bar is green; file list items are styled cards. MoveCopy dialog: selected path has green-tinted border; unselected items highlight on hover.

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/components/dialogs/UploadDialog.tsx frontend-next/src/components/dialogs/MoveCopyDialog.tsx
git commit -m "feat(design): update Upload and MoveCopy dialog styles"
```

---

## Task 10: Preview Modal and Sub-components

**Files:**
- Modify: `frontend-next/src/components/dialogs/PreviewModal.tsx`
- Modify: `frontend-next/src/components/dialogs/preview/TextPreview.tsx`
- Modify: `frontend-next/src/components/dialogs/preview/PreviewInfoOverlay.tsx`
- Modify: `frontend-next/src/components/dialogs/preview/ImagePreview.tsx`
- Modify: `frontend-next/src/components/dialogs/preview/AudioPreview.tsx`
- Modify: `frontend-next/src/components/dialogs/preview/VideoPreview.tsx`
- Modify: `frontend-next/src/components/dialogs/preview/PDFPreview.tsx`

### PreviewModal.tsx

- [ ] **Step 1: Update modal header and large-file warning**

In `frontend-next/src/components/dialogs/PreviewModal.tsx`:

**Header** — update to use design-system styling:
```tsx
<DialogHeader className="px-5 pt-4 pb-3 border-b border-border bg-card/80">
  <DialogTitle className="truncate text-base font-semibold text-foreground">{file.name}</DialogTitle>
  <DialogDescription className="sr-only">
    Previewing {file.name}
  </DialogDescription>
</DialogHeader>
```

**Large file warning** — update download link button to use design-system classes:
```tsx
<a
  href={window.origin + apiPath("resources/download", {
    source: file.source ?? "default",
    file: file.path,
  })}
  download={file.name}
  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
>
  Download
</a>
```

**Preview Anyway button** — keep as `Button variant="outline" size="sm"` (already correct).

### TextPreview.tsx

- [ ] **Step 2: Update TextPreview container and truncation banner**

In `frontend-next/src/components/dialogs/preview/TextPreview.tsx`:

**Truncation banner** — replace the hardcoded `yellow-500` colors:
```tsx
<div className="px-3 py-1.5 bg-amber-500/10 text-amber-500 text-sm border-b border-amber-500/20">
  File truncated at 1MB.{" "}
  <a
    href={getDownloadURL(file.source ?? "default", file.path)}
    download={file.name}
    className="underline hover:opacity-80"
  >
    Download
  </a>{" "}
  for full content.
</div>
```

**Code body** — update the bg class:
```tsx
<div className="flex overflow-auto bg-secondary/50 font-mono text-sm leading-6">
```

### PreviewInfoOverlay.tsx

- [ ] **Step 3: Update overlay to use design tokens**

Replace the entire JSX return in `frontend-next/src/components/dialogs/preview/PreviewInfoOverlay.tsx`:

```tsx
return (
  <div className="flex items-center justify-between px-4 py-2 bg-card/90 backdrop-blur-sm border-t border-border text-sm rounded-b-xl">
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="truncate font-medium text-foreground">{name}</span>
      <span className="text-xs text-muted-foreground">
        {formatFileSize(size)} &middot; {type}
      </span>
    </div>
    {extra}
  </div>
);
```

### AudioPreview.tsx, VideoPreview.tsx

- [ ] **Step 4: Read and update audio/video preview styles**

Read `frontend-next/src/components/dialogs/preview/AudioPreview.tsx` and `VideoPreview.tsx`.

For any container divs with hardcoded background colors, replace with `bg-secondary/50 rounded-xl`. For any control elements, replace inline color styles with `text-muted-foreground hover:text-foreground`.

### ImagePreview.tsx, PDFPreview.tsx

- [ ] **Step 5: Read and update image/PDF preview styles**

Read `frontend-next/src/components/dialogs/preview/ImagePreview.tsx` and `PDFPreview.tsx`.

For `ImagePreview`: ensure the container uses `bg-background` and the image is `object-contain`.

For `PDFPreview`: if it has a toolbar, update it to `bg-card border-b border-border`.

- [ ] **Step 6: Verify preview modal in browser**

Open a text file: code area has secondary background, line numbers are muted. Open an image: centered on background. Info overlay is card-tinted. Large file warning shows green Download button.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/components/dialogs/PreviewModal.tsx frontend-next/src/components/dialogs/preview/
git commit -m "feat(design): update preview modal and sub-component styles"
```

---

## Self-Review Checklist

- [x] **Token layer (Task 1):** All 5 spec token groups covered in `.dark` CSS block
- [x] **UI primitives (Task 2):** All 10 files from spec covered
- [x] **Sidebar (Task 3):** Brand header, source selector, footer pill, directory tree — all covered
- [x] **Header area (Task 4):** Header, Breadcrumbs, StatusBar — inline style hacks removed
- [x] **FileIcon (Task 5):** New `iconSize` prop, 10 file type color configs, two sizes
- [x] **FileCard (Task 6):** New interaction model, dots menu with all 5 actions
- [x] **FileRow (Task 7):** Table → CSS grid, dots menu, no checkbox, Type column removed
- [x] **FileList (Task 7):** Table → CSS grid container with sortable headers
- [x] **Simple dialogs (Task 8):** CreateFolder, Rename, Delete — all covered
- [x] **Upload, MoveCopy (Task 9):** Drop zone, progress bar, picker node — all covered
- [x] **Preview modal (Task 10):** Modal header, TextPreview, InfoOverlay, Audio/Video/Image/PDF — all covered
- [x] **FileGrid (Task 7):** `auto-fill minmax(350px)` → responsive Tailwind grid classes
- [x] **`iconSize` prop consistency:** FileCard uses `iconSize="lg"`, FileRow uses `iconSize="sm"` — matches FileIcon definition in Task 5
- [x] **`DropdownMenuItem variant="destructive"`:** Noted the conditional fallback in Task 6 Step 1
