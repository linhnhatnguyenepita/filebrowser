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
    return sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        This folder is empty
      </div>
    );
  }

  return (
    <div
      className="rounded-lg bg-card overflow-hidden shadow-border"
    >
      {/* Header row */}
      <div
        className="grid grid-cols-[1fr_100px_140px_40px] gap-4 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
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
      {items.map((item, index) => (
        <FileContextMenu key={item.name} item={item}>
          <FileRow item={item} onNavigate={onNavigate} isLast={index === items.length - 1} />
        </FileContextMenu>
      ))}
    </div>
  );
}
