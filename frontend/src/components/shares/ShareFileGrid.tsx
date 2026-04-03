// frontend/src/components/shares/ShareFileGrid.tsx

import type { FileInfo } from "@/lib/api/resources";
import { getShareDownloadURL } from "@/lib/api/share-viewer";
import FileIcon from "@/components/files/FileIcon";

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

interface Props {
  items: FileInfo[];
  hash: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function ShareFileGrid({ items, hash, currentPath, onNavigate }: Props) {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map((item) => {
        const isDir = item.type === "directory";
        return (
          <div
            key={item.name}
            onClick={() => handleItemClick(item)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => e.key === "Enter" && handleItemClick(item)}
            aria-label={`${item.name}${isDir ? " (folder)" : ""}`}
            className="group relative flex flex-col rounded-lg bg-card p-4 cursor-pointer text-left transition-all dark:shadow-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="mb-3">
              <FileIcon type={item.type} iconSize="lg" />
            </div>
            <h3 className="mb-1 truncate text-sm font-medium text-foreground" style={{ letterSpacing: "-0.01em" }} title={item.name}>
              {item.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isDir
                ? item.count != null && item.count > 0
                  ? <span>{item.count} item{item.count === 1 ? "" : "s"}</span>
                  : <span className="opacity-50">0 items</span>
                : <span>{formatSize(item.size)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
