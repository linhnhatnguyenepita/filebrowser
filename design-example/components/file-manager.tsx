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
  HardDrive,
  LogOut,
  Bell,
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
  { icon: Home, label: "All Files", active: true },
  { icon: Clock, label: "Recent" },
  { icon: Star, label: "Starred" },
  { icon: Trash2, label: "Trash" },
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

  const getFileIconLarge = (type: FileItem["type"]) => {
    switch (type) {
      case "folder":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(10, 114, 239, 0.1)" }}>
            <Folder className="h-5 w-5" style={{ color: "#0a72ef" }} />
          </div>
        )
      case "archive":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(121, 40, 202, 0.1)" }}>
            <FileArchive className="h-5 w-5" style={{ color: "#7928ca" }} />
          </div>
        )
      default:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(0, 112, 243, 0.1)" }}>
            <FileText className="h-5 w-5" style={{ color: "#0070f3" }} />
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-background font-sans">
      {/* Sidebar */}
      <aside 
        className="flex w-[260px] flex-col bg-[#fafafa]"
        style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#171717]"
          >
            <HardDrive className="h-4 w-4 text-white" />
          </div>
          <span 
            className="text-base font-semibold text-[#171717]"
            style={{ letterSpacing: "-0.02em" }}
          >
            FileBrowser
          </span>
        </div>

        {/* New Button */}
        <div className="px-4 pb-4">
          <Button 
            className="w-full gap-2 bg-[#171717] text-white hover:bg-[#333333] rounded-md h-9 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <div className="space-y-0.5">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-white text-[#171717]"
                    : "text-[#666666] hover:bg-white hover:text-[#171717]"
                )}
                style={item.active ? { boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" } : {}}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Folders section */}
          <div className="mt-8">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-medium text-[#666666] uppercase tracking-wide">Folders</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666666] hover:text-[#171717]">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-0.5">
              {["playwright", "documents", "images"].map((folder) => (
                <button
                  key={folder}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#666666] transition-colors hover:bg-white hover:text-[#171717]"
                >
                  <Folder className="h-4 w-4" style={{ color: "#0a72ef" }} />
                  <span className="flex-1 text-left truncate">{folder}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Storage */}
        <div className="p-4 border-t border-[#ebebeb]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#666666]">Storage</span>
            <span className="text-xs text-[#666666]">3.4 MB / 100 GB</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#ebebeb]">
            <div className="h-full w-[1%] rounded-full bg-[#171717]" />
          </div>
        </div>

        {/* User */}
        <div className="border-t border-[#ebebeb] p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-md p-2 transition-colors hover:bg-white">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-white text-xs font-medium"
                >
                  AD
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-[#171717] truncate">admin</p>
                  <p className="text-xs text-[#666666]">Free Plan</p>
                </div>
                <ChevronDown className="h-4 w-4 text-[#666666]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Header */}
        <header 
          className="flex items-center justify-between px-6 py-4"
          style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 1px 0px 0px" }}
        >
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 text-sm">
              <button className="text-[#666666] hover:text-[#171717] transition-colors">
                Home
              </button>
              <ChevronRight className="h-4 w-4 text-[#666666]" />
              <span className="font-medium text-[#171717]">My Files</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
              <Input
                placeholder="Search files..."
                className="w-64 pl-9 h-9 bg-[#fafafa] border-0 text-sm placeholder:text-[#666666] focus-visible:ring-1 focus-visible:ring-[#171717]"
                style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div 
              className="flex items-center gap-0.5 rounded-md bg-[#fafafa] p-1"
              style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }}
            >
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded",
                  viewMode === "grid" && "bg-white shadow-sm"
                )}
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded",
                  viewMode === "list" && "bg-white shadow-sm"
                )}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-[#666666] hover:text-[#171717]"
            >
              <Bell className="h-4 w-4" />
            </Button>

            <Button 
              className="gap-2 bg-[#171717] text-white hover:bg-[#333333] rounded-md h-9 px-4 text-sm font-medium"
            >
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
              <h2 
                className="text-sm font-semibold text-[#171717]"
                style={{ letterSpacing: "-0.01em" }}
              >
                Folders
              </h2>
              <span className="text-xs text-[#666666] font-mono">{folders.length} items</span>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => toggleSelection(folder.id)}
                    className={cn(
                      "group relative flex flex-col rounded-lg bg-white p-4 text-left transition-all hover:bg-[#fafafa]",
                      selectedItems.includes(folder.id) 
                        ? "ring-2 ring-[#0070f3]" 
                        : ""
                    )}
                    style={{ 
                      boxShadow: selectedItems.includes(folder.id) 
                        ? "none" 
                        : "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" 
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      {getFileIconLarge(folder.type)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 text-[#666666] hover:text-[#171717]"
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
                          <DropdownMenuItem className="text-[#ff5b4f]">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 
                      className="mb-1 truncate text-sm font-medium text-[#171717]"
                      style={{ letterSpacing: "-0.01em" }}
                    >
                      {folder.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#666666]">
                      <span>{folder.size}</span>
                      <span className="text-[#ebebeb]">·</span>
                      <span>{folder.modified}</span>
                    </div>
                    {folder.starred && (
                      <Star className="absolute right-3 bottom-3 h-3 w-3 fill-[#f5a623] text-[#f5a623]" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div 
                className="rounded-lg bg-white overflow-hidden"
                style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }}
              >
                <div 
                  className="grid grid-cols-[1fr_100px_140px_40px] gap-4 px-4 py-2.5 text-xs font-medium text-[#666666] uppercase tracking-wide"
                  style={{ borderBottom: "1px solid #ebebeb" }}
                >
                  <span>Name</span>
                  <span>Size</span>
                  <span>Modified</span>
                  <span></span>
                </div>
                {folders.map((folder, index) => (
                  <button
                    key={folder.id}
                    onClick={() => toggleSelection(folder.id)}
                    className={cn(
                      "grid w-full grid-cols-[1fr_100px_140px_40px] items-center gap-4 px-4 py-2.5 text-left transition-colors hover:bg-[#fafafa]",
                      selectedItems.includes(folder.id) && "bg-[#ebf5ff]"
                    )}
                    style={index !== folders.length - 1 ? { borderBottom: "1px solid #ebebeb" } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="h-4 w-4" style={{ color: "#0a72ef" }} />
                      <span className="truncate text-sm font-medium text-[#171717]">{folder.name}</span>
                      {folder.starred && (
                        <Star className="h-3 w-3 fill-[#f5a623] text-[#f5a623]" />
                      )}
                    </div>
                    <span className="text-sm text-[#666666]">{folder.size}</span>
                    <span className="text-sm text-[#666666]">{folder.modified}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#666666] hover:text-[#171717]"
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
                        <DropdownMenuItem className="text-[#ff5b4f]">Delete</DropdownMenuItem>
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
              <h2 
                className="text-sm font-semibold text-[#171717]"
                style={{ letterSpacing: "-0.01em" }}
              >
                Files
              </h2>
              <span className="text-xs text-[#666666] font-mono">{files.length} items</span>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => toggleSelection(file.id)}
                    className={cn(
                      "group relative flex flex-col rounded-lg bg-white p-4 text-left transition-all hover:bg-[#fafafa]",
                      selectedItems.includes(file.id) 
                        ? "ring-2 ring-[#0070f3]" 
                        : ""
                    )}
                    style={{ 
                      boxShadow: selectedItems.includes(file.id) 
                        ? "none" 
                        : "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" 
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      {getFileIconLarge(file.type)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 text-[#666666] hover:text-[#171717]"
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
                          <DropdownMenuItem className="text-[#ff5b4f]">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 
                      className="mb-1 truncate text-sm font-medium text-[#171717]"
                      style={{ letterSpacing: "-0.01em" }}
                    >
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#666666]">
                      <span>{file.size}</span>
                      <span className="text-[#ebebeb]">·</span>
                      <span>{file.modified}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div 
                className="rounded-lg bg-white overflow-hidden"
                style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }}
              >
                <div 
                  className="grid grid-cols-[1fr_100px_140px_40px] gap-4 px-4 py-2.5 text-xs font-medium text-[#666666] uppercase tracking-wide"
                  style={{ borderBottom: "1px solid #ebebeb" }}
                >
                  <span>Name</span>
                  <span>Size</span>
                  <span>Modified</span>
                  <span></span>
                </div>
                {files.map((file, index) => (
                  <button
                    key={file.id}
                    onClick={() => toggleSelection(file.id)}
                    className={cn(
                      "grid w-full grid-cols-[1fr_100px_140px_40px] items-center gap-4 px-4 py-2.5 text-left transition-colors hover:bg-[#fafafa]",
                      selectedItems.includes(file.id) && "bg-[#ebf5ff]"
                    )}
                    style={index !== files.length - 1 ? { borderBottom: "1px solid #ebebeb" } : {}}
                  >
                    <div className="flex items-center gap-3">
                      {file.type === "archive" ? (
                        <FileArchive className="h-4 w-4" style={{ color: "#7928ca" }} />
                      ) : (
                        <FileText className="h-4 w-4" style={{ color: "#0070f3" }} />
                      )}
                      <span className="truncate text-sm font-medium text-[#171717]">{file.name}</span>
                    </div>
                    <span className="text-sm text-[#666666]">{file.size}</span>
                    <span className="text-sm text-[#666666]">{file.modified}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#666666] hover:text-[#171717]"
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
                        <DropdownMenuItem className="text-[#ff5b4f]">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer Status Bar */}
        <footer 
          className="flex items-center justify-between px-6 py-3 text-xs text-[#666666]"
          style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px -1px 0px 0px" }}
        >
          <div className="flex items-center gap-4">
            <span className="font-mono">{folders.length} folders</span>
            <span className="text-[#ebebeb]">·</span>
            <span className="font-mono">{files.length} files</span>
            <span className="text-[#ebebeb]">·</span>
            <span className="font-mono">3.4 MB total</span>
          </div>
          {selectedItems.length > 0 && (
            <span 
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: "#ebf5ff", color: "#0068d6" }}
            >
              {selectedItems.length} selected
            </span>
          )}
        </footer>
      </main>
    </div>
  )
}
