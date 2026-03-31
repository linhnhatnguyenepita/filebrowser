import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutGrid,
  List,
  Search,
  Upload,
  FolderPlus,
  X,
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
  const { viewMode, setViewMode, search, clearSearch, searchQuery } = useUIStore();
  const { path, source } = useFileStore();

  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search: fires 300ms after last keystroke
  const handleSearchChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
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
      className="flex items-center gap-3 px-4 shrink-0"
      style={{
        height: "52px",
        background: "var(--surface-1)",
        borderBottom: "1px solid var(--border-strong)",
      }}
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
          className="absolute left-3 pointer-events-none"
          style={{ color: "var(--text-secondary)" }}
        />
        <input
          type="text"
          placeholder="Search files…"
          value={inputValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-lg text-sm outline-none transition-all"
          style={{
            paddingLeft: "32px",
            paddingRight: inputValue ? "32px" : "12px",
            paddingTop: "6px",
            paddingBottom: "6px",
            background: "var(--surface-3)",
            color: "var(--text-primary)",
            border: "1px solid transparent",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLInputElement).style.border =
              "1px solid var(--border-strong)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLInputElement).style.border =
              "1px solid transparent";
          }}
        />
        {inputValue && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2 rounded transition-opacity hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Action buttons — right */}
      <div className="flex items-center gap-1 shrink-0">
        {/* View mode toggle */}
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="p-2 rounded-lg transition-colors"
          style={{
            color:
              viewMode === "grid" ? "var(--primary)" : "var(--text-secondary)",
            background: "transparent",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "var(--surface-3)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "transparent")
          }
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
            background: "var(--border-strong)",
            opacity: 0.5,
          }}
        />

        {/* Upload */}
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            color: "var(--text-secondary)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--surface-3)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-secondary)";
          }}
          title="Upload files"
          aria-label="Upload files"
        >
          <Upload size={14} />
          Upload
        </button>

        {/* New folder */}
        <button
          onClick={onNewFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            color: "var(--text-secondary)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--surface-3)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-secondary)";
          }}
          title="New folder"
          aria-label="New folder"
        >
          <FolderPlus size={14} />
          New folder
        </button>
      </div>
    </header>
  );
}
