import { useCallback, useEffect, useRef, useState } from "react";
import {
  Grid3X3,
  List,
  Search,
  Upload,
  FolderPlus,
  X,
  Loader2,
} from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useFileStore } from "@/lib/stores/file-store";
import { cn } from "@/lib/utils";
import Breadcrumbs from "./Breadcrumbs";

interface HeaderProps {
  onNavigate: (path: string) => void;
  onUpload: () => void;
  onNewFolder: () => void;
}

export default function Header({ onNavigate, onUpload, onNewFolder }: HeaderProps) {
  const { viewMode, setViewMode, search, clearSearch, searchQuery, searchLoading } = useUIStore();
  const { path, source } = useFileStore();

  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MIN_SEARCH_LENGTH = 3;

  const handleSearchChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim() || value.trim().length < MIN_SEARCH_LENGTH) {
        clearSearch();
        return;
      }
      debounceRef.current = setTimeout(() => {
        search(value.trim(), source);
      }, 300);
    },
    [search, clearSearch, source]
  );

  const handleClearSearch = useCallback(() => {
    setInputValue("");
    clearSearch();
  }, [clearSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <header
      className="flex items-center justify-between px-6 py-4 shrink-0 bg-card dark:shadow-border"
      style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 1px 0px 0px" }}
    >
      {/* Breadcrumbs — left */}
      <div className="flex items-center gap-2 min-w-0">
        <Breadcrumbs path={path} onNavigate={onNavigate} />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files…"
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-64 pl-9 pr-8 h-9 rounded-md bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
            style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.2) 0px 0px 0px 1px")}
            onBlur={(e) => (e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px")}
          />
          {searchLoading ? (
            <span className="absolute right-2.5 flex items-center animate-spin text-muted-foreground">
              <Loader2 size={14} />
            </span>
          ) : inputValue ? (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* View mode toggle */}
        <div
          className="flex items-center gap-0.5 rounded-md bg-secondary p-1"
          style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }}
        >
          <button
            onClick={() => setViewMode("grid")}
            title="Grid view"
            aria-label="Grid view"
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded transition-colors text-muted-foreground",
              viewMode === "grid" ? "bg-card text-foreground" : "hover:text-foreground"
            )}
            style={viewMode === "grid" ? { boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px" } : {}}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            title="List view"
            aria-label="List view"
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded transition-colors text-muted-foreground",
              viewMode === "list" ? "bg-card text-foreground" : "hover:text-foreground"
            )}
            style={viewMode === "list" ? { boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px" } : {}}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* New folder */}
        <button
          onClick={onNewFolder}
          aria-label="New folder"
          className="flex items-center gap-2 h-9 px-4 rounded-md text-sm font-medium text-foreground transition-colors hover:bg-accent"
          style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }}
        >
          <FolderPlus className="h-4 w-4" />
          New folder
        </button>

        {/* Upload — primary dark button */}
        <button
          onClick={onUpload}
          aria-label="Upload files"
          className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>
    </header>
  );
}
