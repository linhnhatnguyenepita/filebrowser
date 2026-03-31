import { useRef, useCallback } from "react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import { TableRow, TableCell } from "@/components/ui/table";
import FileIcon from "./FileIcon";
import { isPreviewable } from "@/lib/utils/preview";

const CLICK_DELAY = 250; // ms

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatType(type: string): string {
  if (type === "directory") return "Folder";
  // "image/jpeg" → "JPEG"
  const sub = type.split("/").pop() || type;
  return sub.replace(/^x-/, "").toUpperCase();
}

interface FileRowProps {
  item: FileInfo;
  onNavigate: (path: string) => void;
}

export default function FileRow({ item, onNavigate }: FileRowProps) {
  const { selected, toggleSelect, source, setPreviewFile } = useFileStore();
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelected = selected.has(item.name);
  const isDir = item.type === "directory";

  const downloadFile = useCallback(() => {
    window.open(getDownloadURL(source, item.path), "_blank");
  }, [source, item]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        toggleSelect(item.name);
        return;
      }

      if (isDir) {
        if (clickTimer.current) {
          clearTimeout(clickTimer.current);
          clickTimer.current = null;
        }
        onNavigate(item.path);
        return;
      }

      // Non-previewable: download immediately
      if (!isPreviewable(item.type)) {
        if (clickTimer.current) {
          clearTimeout(clickTimer.current);
          clickTimer.current = null;
        }
        downloadFile();
        return;
      }

      // Previewable: debounce to detect double-click
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        downloadFile();
      } else {
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null;
          setPreviewFile(item);
        }, CLICK_DELAY);
      }
    },
    [isDir, item, onNavigate, toggleSelect, setPreviewFile, downloadFile, source]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey || !isPreviewable(item.type)) {
          downloadFile();
        } else {
          setPreviewFile(item);
        }
      }
    },
    [item, setPreviewFile, downloadFile]
  );

  return (
    <TableRow
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${item.name}${isDir ? " (folder)" : ""}`}
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mb-10"
      data-state={isSelected ? "selected" : undefined}
      style={{
        background: isSelected ? "var(--accent)" : undefined,
      }}
    >
      <TableCell className="w-10 py-4 border-b">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelect(item.name)}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 accent-foreground cursor-pointer"
        />
      </TableCell>
      <TableCell className="w-10 pr-2 border-b">
        <FileIcon type={item.type} size={16} />
      </TableCell>
      <TableCell className="font-medium text-foreground min-w-0 truncate border-b">
        {item.name}
      </TableCell>
      <TableCell className="w-24 text-muted-foreground border-b">
        {isDir ? "\u2014" : formatSize(item.size)}
      </TableCell>
      <TableCell className="w-44 text-muted-foreground border-b">
        {formatDate(item.modified)}
      </TableCell>
      <TableCell className="w-24 text-muted-foreground border-b">
        {formatType(item.type)}
      </TableCell>
    </TableRow>
  );
}
