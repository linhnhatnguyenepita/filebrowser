import { useRef, useCallback } from "react";
import { MoreHorizontal, Download, Pencil, FolderInput, Copy, Trash2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import { useUIStore } from "@/lib/stores/ui-store";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import FileIcon from "./FileIcon";
import { isPreviewable } from "@/lib/utils/preview";
import { cn } from "@/lib/utils";

const CLICK_DELAY = 250;

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
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
  const { openDialog } = useUIStore();
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelected = selected.has(item.name);
  const isDir = item.type === "directory";

  const downloadFile = useCallback(() => {
    window.open(getDownloadURL(source, item.path), "_blank");
  }, [source, item]);

  const ensureSelected = useCallback(() => {
    if (!selected.has(item.name)) toggleSelect(item.name);
  }, [selected, item.name, toggleSelect]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        toggleSelect(item.name);
        return;
      }
      if (isDir) {
        onNavigate(item.path);
        return;
      }
      // Files: single-click selects, double-click previews/downloads
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        if (isPreviewable(item.type)) {
          setPreviewFile(item);
        } else {
          downloadFile();
        }
      } else {
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null;
          toggleSelect(item.name);
        }, CLICK_DELAY);
      }
    },
    [isDir, item, onNavigate, toggleSelect, setPreviewFile, downloadFile]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (isDir) {
          onNavigate(item.path);
        } else if (isPreviewable(item.type)) {
          setPreviewFile(item);
        } else {
          downloadFile();
        }
      }
    },
    [isDir, item, onNavigate, setPreviewFile, downloadFile]
  );

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    ensureSelected();
    openDialog("rename");
  };

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    ensureSelected();
    openDialog("moveCopy");
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    ensureSelected();
    openDialog("moveCopy");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    ensureSelected();
    openDialog("delete");
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${item.name}${isDir ? " (folder)" : ""}`}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card p-4 cursor-pointer text-left transition-all",
        "hover:border-primary/50 hover:bg-secondary/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-primary bg-primary/5"
      )}
    >
      {/* Icon + dots menu row */}
      <div className="mb-3 flex items-start justify-between">
        <FileIcon type={item.type} iconSize="lg" />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="opacity-0 transition-opacity group-hover:opacity-100 shrink-0 rounded-[min(var(--radius-md),12px)] p-0 size-7 flex items-center justify-center cursor-pointer bg-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(e) => e.stopPropagation()}
            aria-label="File actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isPreviewable(item.type) && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewFile(item); }}>
                Open / Preview
              </DropdownMenuItem>
            )}
            {!isDir && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); downloadFile(); }}>
                <Download className="h-4 w-4" />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRename}>
              <Pencil className="h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMove}>
              <FolderInput className="h-4 w-4" />
              Move
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Name */}
      <h3 className="mb-1 truncate font-medium text-foreground text-sm" title={item.name}>
        {item.name}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {!isDir && <span>{formatSize(item.size)}</span>}
      </div>
    </div>
  );
}
