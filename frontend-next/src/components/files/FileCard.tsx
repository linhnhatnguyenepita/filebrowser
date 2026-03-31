import { useRef, useCallback } from "react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import FileIcon from "./FileIcon";
import { isPreviewable } from "@/lib/utils/preview";

const CLICK_DELAY = 250; // ms

function formatSize(bytes: number): string {
  if (bytes === 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

interface FileCardProps {
  item: FileInfo;
  onNavigate: (path: string) => void;
}

export default function FileCard({ item, onNavigate }: FileCardProps) {
  const { selected, toggleSelect, source, setPreviewFile } = useFileStore();
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelected = selected.has(item.name);
  const isDir = item.type === "directory";

  const downloadFile = useCallback(() => {
    window.open(getDownloadURL(source, item.source ?? source, item.path), "_blank");
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

  const handleCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelect(item.name);
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${item.name}${isDir ? " (folder)" : ""}`}
      className="group relative flex flex-col items-center gap-2 rounded-lg p-3 cursor-pointer transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        background: isSelected ? "var(--accent)" : "transparent",
        border: isSelected
          ? "1px solid var(--border)"
          : "1px solid transparent",
      }}
    >
      {/* Checkbox */}
      <div
        onClick={handleCheckbox}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ opacity: isSelected ? 1 : undefined }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          className="w-3.5 h-3.5 accent-foreground cursor-pointer"
        />
      </div>

      <FileIcon type={item.type} size={32} />

      <span
        className="text-xs text-center truncate w-full text-foreground"
        title={item.name}
      >
        {item.name}
      </span>

      {!isDir && item.size > 0 && (
        <span className="text-[10px] text-muted-foreground">
          {formatSize(item.size)}
        </span>
      )}
    </div>
  );
}
