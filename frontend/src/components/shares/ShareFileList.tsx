// frontend/src/components/shares/ShareFileList.tsx

import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { Download, Folder } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getShareDownloadURL } from "@/lib/api/share-viewer";
import FileIcon from "@/components/files/FileIcon";

type SortField = "name" | "size" | "modified";

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

interface Props {
  items: FileInfo[];
  hash: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function ShareFileList({ items, hash, currentPath, onNavigate }: Props) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sorted = [...items].sort((a, b) => {
    // Folders first
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;
    let cmp = 0;
    if (sortField === "name") cmp = a.name.localeCompare(b.name);
    else if (sortField === "size") cmp = (a.size ?? 0) - (b.size ?? 0);
    else if (sortField === "modified") cmp = (a.modified ?? "").localeCompare(b.modified ?? "");
    return sortAsc ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const handleItemClick = (item: FileInfo) => {
    if (item.type === "directory") {
      const newPath = currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`;
      onNavigate(newPath);
    } else {
      const filePath = currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`;
      const url = getShareDownloadURL(hash, filePath);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      a.click();
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_140px_40px] items-center gap-4 px-4 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground font-medium">
        <button className="flex items-center gap-1 hover:text-foreground text-left" onClick={() => handleSort("name")}>
          Name <SortIcon field="name" />
        </button>
        <button className="flex items-center gap-1 hover:text-foreground text-left" onClick={() => handleSort("size")}>
          Size <SortIcon field="size" />
        </button>
        <button className="flex items-center gap-1 hover:text-foreground text-left" onClick={() => handleSort("modified")}>
          Modified <SortIcon field="modified" />
        </button>
        <span />
      </div>

      {/* Rows */}
      {sorted.map((item, i) => {
        const isLast = i === sorted.length - 1;
        const isDir = item.type === "directory";
        return (
          <div
            key={item.name}
            onClick={() => handleItemClick(item)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => e.key === "Enter" && handleItemClick(item)}
            aria-label={`${item.name}${isDir ? " (folder)" : ""}`}
            className="group grid grid-cols-[1fr_100px_140px_40px] items-center gap-4 px-4 py-2.5 cursor-pointer transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            style={!isLast ? { borderBottom: "1px solid var(--border)" } : {}}
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileIcon type={item.type} iconSize="sm" />
              <span className="truncate text-sm font-medium text-foreground" title={item.name}>{item.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {isDir
                ? item.count != null && item.count > 0 ? `${item.count} item${item.count === 1 ? "" : "s"}` : <span className="opacity-50">0 items</span>
                : formatSize(item.size)}
            </span>
            <span className="text-sm text-muted-foreground">{formatDate(item.modified)}</span>
            <div className="flex items-center justify-center">
              {!isDir && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                  className="opacity-0 group-hover:opacity-100 shrink-0 rounded-md p-0 size-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Download ${item.name}`}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
