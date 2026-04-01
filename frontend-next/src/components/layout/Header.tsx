import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutGrid,
  List,
  Search,
  Upload,
  FolderPlus,
  X,
  Loader2,
} from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useFileStore } from "@/lib/stores/file-store";
import { Button } from "@/components/ui/button";
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

  // Minimum length must match backend (backend/common/settings/config.go:229 — defaults to 3)
  const MIN_SEARCH_LENGTH = 3;

  // Debounced search: fires 300ms after last keystroke, only when query is long enough
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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
}
