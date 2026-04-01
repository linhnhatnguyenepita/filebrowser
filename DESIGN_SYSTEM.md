# CloudFiles Design System

A comprehensive design system for the CloudFiles file manager application.

---

## Color Palette

### Core Colors (5 Colors)

| Token | OKLCH Value | Description |
|-------|-------------|-------------|
| **Primary** | `oklch(0.65 0.15 145)` | Green accent - used for CTAs, active states, and brand elements |
| **Background** | `oklch(0.13 0.005 260)` | Deep charcoal - main background |
| **Card** | `oklch(0.17 0.005 260)` | Elevated surface color |
| **Secondary** | `oklch(0.22 0.005 260)` | Subtle backgrounds, inputs |
| **Destructive** | `oklch(0.55 0.2 25)` | Red for delete/danger actions |

### Neutral Scale

| Token | OKLCH Value | Usage |
|-------|-------------|-------|
| **Foreground** | `oklch(0.95 0 0)` | Primary text |
| **Secondary Foreground** | `oklch(0.85 0 0)` | Secondary text |
| **Muted Foreground** | `oklch(0.55 0 0)` | Tertiary/disabled text |
| **Border** | `oklch(0.25 0.005 260)` | Dividers and borders |

### Semantic File Type Colors

| Type | Color | Usage |
|------|-------|-------|
| **Folders** | `bg-primary/15` + `text-primary` | Green tint for folder icons |
| **Documents** | `bg-blue-500/15` + `text-blue-400` | Blue tint for text files |
| **Archives** | `bg-amber-500/15` + `text-amber-500` | Amber tint for compressed files |

---

## Typography

### Font Family

```css
--font-sans: 'Geist', 'Geist Fallback';
--font-mono: 'Geist Mono', 'Geist Mono Fallback';
```

### Type Scale

| Element | Class | Size | Weight |
|---------|-------|------|--------|
| **App Title** | `font-semibold text-foreground` | Base (1rem) | 600 |
| **Section Headers** | `text-sm font-semibold` | 0.875rem | 600 |
| **Body Text** | `font-medium text-foreground` | Base | 500 |
| **Meta/Caption** | `text-xs text-muted-foreground` | 0.75rem | 400 |
| **Labels** | `text-xs font-semibold uppercase tracking-wider` | 0.75rem | 600 |

---

## Spacing System

Using Tailwind's spacing scale consistently:

| Context | Value | Tailwind Class |
|---------|-------|----------------|
| **Card Padding** | 16px | `p-4` |
| **Section Gaps** | 16px | `gap-4` |
| **Content Margin** | 24px | `p-6` |
| **Icon Margin** | 12px | `gap-3` |
| **Small Gaps** | 8px | `gap-2` |
| **Section Spacing** | 32px | `mb-8` |

---

## Border Radius

```css
--radius: 0.75rem; /* 12px base */
```

| Element | Class | Value |
|---------|-------|-------|
| **Cards** | `rounded-xl` | 12px |
| **Icons/Badges** | `rounded-lg` | 8px |
| **Buttons** | `rounded-lg` | 8px |
| **Progress Bars** | `rounded-full` | Full |
| **Avatars** | `rounded-full` | Full |

---

## Components

### Cards (File/Folder Items)

```jsx
// Grid View Card
<button className={cn(
  "group relative flex flex-col rounded-xl border border-border bg-card p-4",
  "text-left transition-all",
  "hover:border-primary/50 hover:bg-secondary/30",
  isSelected && "border-primary bg-primary/5"
)}>
```

**States:**
- Default: `border-border bg-card`
- Hover: `border-primary/50 bg-secondary/30`
- Selected: `border-primary bg-primary/5`

### File Type Icons

```jsx
// Large icon container (48x48)
<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
  <Folder className="h-6 w-6 text-primary" />
</div>

// Small icon container (36x36)
<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
  <Folder className="h-4 w-4 text-primary" />
</div>
```

### Sidebar Navigation

```jsx
// Nav Item
<button className={cn(
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
  "text-sm font-medium transition-colors",
  isActive
    ? "bg-secondary text-foreground"
    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
)}>
```

### Quick Access Items

```jsx
<button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary/50">
  <div className={cn("h-2 w-2 rounded-full", colorClass)} />
  <span className="flex-1 text-left text-foreground">{name}</span>
  <span className="text-xs text-muted-foreground">{storage}</span>
</button>
```

### Storage Progress Bar

```jsx
<div className="rounded-xl bg-secondary/50 p-4">
  <div className="mb-2 flex items-center justify-between">
    <span className="text-sm font-medium text-foreground">Storage</span>
    <span className="text-xs text-muted-foreground">3.3 MB / 98.4 GB</span>
  </div>
  <div className="h-2 overflow-hidden rounded-full bg-muted">
    <div className="h-full w-[3%] rounded-full bg-primary" />
  </div>
</div>
```

### Search Input

```jsx
<div className="relative w-80">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input
    placeholder="Search files and folders..."
    className="pl-10 bg-secondary border-0"
  />
</div>
```

### View Toggle

```jsx
<div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
  <Button
    variant={viewMode === "grid" ? "default" : "ghost"}
    size="icon"
    className="h-8 w-8"
  >
    <Grid3X3 className="h-4 w-4" />
  </Button>
  <Button
    variant={viewMode === "list" ? "default" : "ghost"}
    size="icon"
    className="h-8 w-8"
  >
    <List className="h-4 w-4" />
  </Button>
</div>
```

---

## Layout Structure

### Page Layout

```
┌─────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌────────────────────────────────────┐ │
│ │          │ │ Header (Breadcrumb + Search + Actions) │
│ │ Sidebar  │ ├────────────────────────────────────┤ │
│ │ (256px)  │ │                                    │ │
│ │          │ │ Content Area (Scrollable)          │ │
│ │          │ │   - Folders Section                │ │
│ │          │ │   - Files Section                  │ │
│ │          │ │                                    │ │
│ │          │ ├────────────────────────────────────┤ │
│ │          │ │ Status Bar                         │ │
│ └──────────┘ └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Sidebar Structure

```
┌─────────────────┐
│ Logo + Brand    │
├─────────────────┤
│ User Profile    │
├─────────────────┤
│ New Button      │
├─────────────────┤
│ Navigation      │
│ - Home          │
│ - Recent        │
│ - Starred       │
│ - Trash         │
├─────────────────┤
│ Quick Access    │
├─────────────────┤
│ Storage Usage   │
└─────────────────┘
```

### Grid Layout

```css
/* Responsive grid for files/folders */
grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
```

### List Layout

```css
/* Table-like grid for list view */
grid grid-cols-[1fr_100px_140px_40px] gap-4
```

---

## Iconography

Using **Lucide React** icons consistently at these sizes:

| Context | Size | Class |
|---------|------|-------|
| **Large Display** | 24px | `h-6 w-6` |
| **Navigation** | 20px | `h-5 w-5` |
| **Buttons/Actions** | 16px | `h-4 w-4` |

### Core Icons Used

| Icon | Usage |
|------|-------|
| `HardDrive` | App logo |
| `Folder` | Folder items |
| `FileText` | Document files |
| `FileArchive` | Compressed files |
| `Search` | Search input |
| `Home` | Home navigation |
| `Star` | Starred items |
| `Clock` | Recent items |
| `Trash2` | Trash/delete |
| `Settings` | Settings |
| `Upload` | Upload action |
| `Plus` | New/create |
| `MoreHorizontal` | Context menu |
| `Grid3X3` | Grid view |
| `List` | List view |
| `ChevronRight` | Breadcrumb separator |
| `ChevronDown` | Dropdown indicator |

---

## Animation & Transitions

### Standard Transition

```css
transition-colors /* For color changes */
transition-all /* For complex state changes */
transition-opacity /* For fade effects */
```

### Hover Reveal Pattern

```jsx
// Button appears on card hover
className="opacity-0 transition-opacity group-hover:opacity-100"
```

---

## Accessibility

### Focus States

```css
outline-ring/50 /* Default focus outline using ring color at 50% opacity */
```

### Interactive Elements

- All clickable items use `<button>` elements
- Dropdown menus use Radix UI primitives for keyboard navigation
- Proper contrast ratios maintained between text and backgrounds

### Selection Feedback

- Visual border change on selection
- Background tint on selected items
- Clear hover states on all interactive elements

---

## Dark Mode

This design system is built dark-mode first. The same color tokens are used for both `:root` and `.dark` selectors, creating a consistent dark theme experience.

To implement light mode, override the CSS custom properties in `:root` with lighter values while keeping the `.dark` selector for explicit dark mode.

---

## Usage Guidelines

### Do's

- Use semantic color tokens (`bg-primary`, `text-foreground`) instead of raw colors
- Maintain consistent spacing using Tailwind's scale
- Use the `cn()` utility for conditional class composition
- Keep icon sizes consistent within context
- Use `group` + `group-hover:` for coordinated hover effects

### Don'ts

- Don't use arbitrary color values (e.g., `bg-[#123456]`)
- Don't mix spacing systems
- Don't override component base styles without good reason
- Don't use inline styles for theming
- Don't use different icon libraries within the same interface
