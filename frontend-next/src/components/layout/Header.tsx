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
    <header
      className="flex items-center gap-3 px-4 pt-2 pb-2 shrink-0 bg-background border-b border-border"
    >
      {/* Breadcrumbs — left */}
      <div className="flex-1 min-w-0">
        <Breadcrumbs path={path} onNavigate={onNavigate} />
      </div>

      {/* Search input — center */}
      <div
        className="relative flex items-center"
        style={{ width: "280px", flexShrink: 0 }}
      >
        <Search
          size={14}
          className="absolute left-3 pointer-events-none text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search files…"
          value={inputValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-lg text-sm outline-none transition-all bg-input text-foreground border border-transparent focus:border-foreground px-8"
          style={{ paddingTop: "6px", paddingBottom: "6px" }}
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
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="p-2 rounded-lg transition-colors hover:bg-accent"
          style={{
            color: viewMode === "grid" ? "var(--foreground)" : "var(--muted-foreground)",
          }}
          title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
          aria-label={
            viewMode === "grid" ? "Switch to list view" : "Switch to grid view"
          }
        >
          {viewMode === "grid" ? <List size={16} /> : <LayoutGrid size={16} />}
        </button>

        {/* Divider */}
        <div
          className="mx-1"
          style={{
            width: "1px",
            height: "20px",
            background: "var(--border)",
            opacity: 0.5,
          }}
        />

        {/* Upload */}
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-foreground text-background hover:opacity-90"
          title="Upload files"
          aria-label="Upload files"
        >
          <Upload size={15} />
          Upload
        </button>

        {/* New folder */}
        <button
          onClick={onNewFolder}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-foreground text-background hover:opacity-90"
          title="New folder"
          aria-label="New folder"
        >
          <FolderPlus size={15} />
          New folder
        </button>
      </div>
    </header>
  );
}
