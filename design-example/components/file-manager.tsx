"use client"

import { useState } from "react"
import {
  Search,
  Grid3X3,
  List,
  ChevronRight,
  Folder,
  FileText,
  FileArchive,
  Home,
  Star,
  Clock,
  Trash2,
  Settings,
  Upload,
  Plus,
  MoreHorizontal,
  User,
  HardDrive,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type FileItem = {
  id: string
  name: string
  type: "folder" | "file" | "archive"
  size: string
  modified: string
  starred?: boolean
}

const folders: FileItem[] = [
  { id: "1", name: "excluded", type: "folder", size: "4.0 KB", modified: "4 months ago" },
  { id: "2", name: "excludedButVisible", type: "folder", size: "4.0 KB", modified: "4 weeks ago" },
  { id: "3", name: "files", type: "folder", size: "8.0 KB", modified: "24 seconds ago", starred: true },
  { id: "4", name: "folder#hash", type: "folder", size: "4.0 KB", modified: "4 months ago" },
  { id: "5", name: "myfolder", type: "folder", size: "3.3 MB", modified: "2 weeks ago", starred: true },
  { id: "6", name: "share", type: "folder", size: "4.0 KB", modified: "4 months ago" },
  { id: "7", name: "subfolderExclusions", type: "folder", size: "16.0 KB", modified: "4 months ago" },
  { id: "8", name: "test & test.txt", type: "folder", size: "4.0 KB", modified: "4 weeks ago" },
  { id: "9", name: "text-files", type: "folder", size: "8.0 KB", modified: "4 months ago" },
]

const files: FileItem[] = [
  { id: "10", name: "1file1.txt", type: "file", size: "0 bytes", modified: "4 months ago" },
  { id: "11", name: "copyme.txt", type: "file", size: "4.0 KB", modified: "4 months ago" },
  { id: "12", name: "deleteme.txt", type: "file", size: "0 bytes", modified: "4 months ago" },
  { id: "13", name: "file.tar.gz", type: "archive", size: "4.0 KB", modified: "4 months ago" },
  { id: "14", name: "renameme.txt", type: "file", size: "0 bytes", modified: "3 months ago" },
  { id: "15", name: "utf8-truncated.txt", type: "file", size: "12.0 KB", modified: "3 months ago" },
]

const sidebarItems = [
  { icon: Home, label: "Home", active: true },
  { icon: Clock, label: "Recent" },
  { icon: Star, label: "Starred" },
  { icon: Trash2, label: "Trash" },
]

const quickAccess = [
  { name: "playwright", storage: "3.3 MB", color: "bg-primary" },
  { name: "documents", storage: "1.2 GB", color: "bg-chart-2" },
  { name: "images", storage: "856 MB", color: "bg-chart-4" },
]

export function FileManager() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const getFileIcon = (type: FileItem["type"]) => {
    switch (type) {
      case "folder":
        return <Folder className="h-5 w-5" />
      case "archive":
        return <FileArchive className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getFileIconLarge = (type: FileItem["type"]) => {
    switch (type) {
      case "folder":
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Folder className="h-6 w-6 text-primary" />
          </div>
        )
      case "archive":
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
            <FileArchive className="h-6 w-6 text-amber-500" />
          </div>
        )
      default:
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
            <FileText className="h-6 w-6 text-blue-400" />
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <HardDrive className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">CloudFiles</h1>
            <p className="text-xs text-muted-foreground">File Manager</p>
          </div>
        </div>

        {/* User */}
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-foreground">admin</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* New Button */}
        <div className="p-4">
          <Button className="w-full gap-2" size="lg">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                item.active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Quick Access */}
        <div className="border-t border-border p-4">
          <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Access
          </h3>
          <div className="space-y-2">
            {quickAccess.map((item) => (
              <button
                key={item.name}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary/50"
              >
                <div className={cn("h-2 w-2 rounded-full", item.color)} />
                <span className="flex-1 text-left text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.storage}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Storage */}
        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Storage</span>
              <span className="text-xs text-muted-foreground">3.3 MB / 98.4 GB</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[3%] rounded-full bg-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">0% used</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">My Files</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search files and folders..."
                className="pl-10 bg-secondary border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Folders Section */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Folders</h2>
              <span className="text-xs text-muted-foreground">{folders.length} folders</span>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => toggleSelection(folder.id)}
                    className={cn(
                      "group relative flex flex-col rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-secondary/30",
                      selectedItems.includes(folder.id) && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      {getFileIconLarge(folder.type)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Open</DropdownMenuItem>
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="mb-1 truncate font-medium text-foreground">{folder.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{folder.size}</span>
                      <span>•</span>
                      <span>{folder.modified}</span>
                    </div>
                    {folder.starred && (
                      <Star className="absolute right-3 top-3 h-4 w-4 fill-amber-500 text-amber-500 opacity-0 group-hover:opacity-0" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card">
                <div className="grid grid-cols-[1fr_100px_140px_40px] gap-4 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
                  <span>Name</span>
                  <span>Size</span>
                  <span>Modified</span>
                  <span></span>
                </div>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => toggleSelection(folder.id)}
                    className={cn(
                      "grid w-full grid-cols-[1fr_100px_140px_40px] items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-secondary/30",
                      selectedItems.includes(folder.id) && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                        <Folder className="h-4 w-4 text-primary" />
                      </div>
                      <span className="truncate font-medium text-foreground">{folder.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{folder.size}</span>
                    <span className="text-sm text-muted-foreground">{folder.modified}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Open</DropdownMenuItem>
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuItem>Share</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Files Section */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Files</h2>
              <span className="text-xs text-muted-foreground">{files.length} files</span>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => toggleSelection(file.id)}
                    className={cn(
                      "group relative flex flex-col rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-secondary/30",
                      selectedItems.includes(file.id) && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      {getFileIconLarge(file.type)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Open</DropdownMenuItem>
                          <DropdownMenuItem>Download</DropdownMenuItem>
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="mb-1 truncate font-medium text-foreground">{file.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>{file.modified}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card">
                <div className="grid grid-cols-[1fr_100px_140px_40px] gap-4 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
                  <span>Name</span>
                  <span>Size</span>
                  <span>Modified</span>
                  <span></span>
                </div>
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => toggleSelection(file.id)}
                    className={cn(
                      "grid w-full grid-cols-[1fr_100px_140px_40px] items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-secondary/30",
                      selectedItems.includes(file.id) && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          file.type === "archive" ? "bg-amber-500/15" : "bg-blue-500/15"
                        )}
                      >
                        {file.type === "archive" ? (
                          <FileArchive className="h-4 w-4 text-amber-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <span className="truncate font-medium text-foreground">{file.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{file.size}</span>
                    <span className="text-sm text-muted-foreground">{file.modified}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Open</DropdownMenuItem>
                        <DropdownMenuItem>Download</DropdownMenuItem>
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuItem>Share</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{folders.length} Folders</span>
            <span>•</span>
            <span>{files.length} Files</span>
            <span>•</span>
            <span>3.4 MB total</span>
          </div>
          {selectedItems.length > 0 && (
            <span className="font-medium text-primary">{selectedItems.length} selected</span>
          )}
        </footer>
      </main>
    </div>
  )
}
