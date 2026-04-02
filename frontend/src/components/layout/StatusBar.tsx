import { Trash2, Move, Copy, Download } from "lucide-react";
import { useFileStore } from "@/lib/stores/file-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { getDownloadURL } from "@/lib/api/resources";

export default function StatusBar() {
  const { items, selected, path, source, clearSelection } = useFileStore();
  const { openDialog } = useUIStore();

  const selectionCount = selected.size;
  const totalCount = items.length;
  const folderCount = items.filter((i) => i.type === "directory").length;
  const fileCount = totalCount - folderCount;

  const handleDownloadSelected = () => {
    const selectedItems = items.filter((item) => selected.has(item.name));
    for (const item of selectedItems) {
      if (item.type !== "directory") {
        const url = getDownloadURL(source, item.path);
        const a = document.createElement("a");
        a.href = url;
        a.download = item.name;
        a.click();
      }
    }
  };

  return (
    <div
      className="flex items-center justify-between px-6 shrink-0 bg-card dark:shadow-border"
      style={{ height: "40px", boxShadow: "rgba(0, 0, 0, 0.08) 0px -1px 0px 0px" }}
    >
      {/* Left: item counts */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-mono">{folderCount} folder{folderCount !== 1 ? "s" : ""}</span>
        <span style={{ color: "var(--border)" }}>·</span>
        <span className="font-mono">{fileCount} file{fileCount !== 1 ? "s" : ""}</span>
        {path && path !== "/" && (
          <>
            <span style={{ color: "var(--border)" }}>·</span>
            <span
              className="font-mono truncate max-w-[200px] hidden sm:block"
              title={path}
            >
              {path}
            </span>
          </>
        )}
      </div>

      {/* Right: selection info + bulk actions */}
      <div className="flex items-center gap-2">
        {selectionCount > 0 && (
          <>
            {/* Bulk action buttons */}
            <ActionButton
              onClick={handleDownloadSelected}
              title="Download selected"
              icon={<Download size={12} />}
              label="Download"
            />
            <ActionButton
              onClick={() => openDialog("move")}
              title="Move selected"
              icon={<Move size={12} />}
              label="Move"
            />
            <ActionButton
              onClick={() => openDialog("copy")}
              title="Copy selected"
              icon={<Copy size={12} />}
              label="Copy"
            />
            <ActionButton
              onClick={() => openDialog("delete")}
              title="Delete selected"
              icon={<Trash2 size={12} />}
              label="Delete"
              danger
            />

            {/* Selection pill */}
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium font-mono cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              onClick={clearSelection}
              title="Clear selection"
            >
              {selectionCount} selected ×
            </span>
          </>
        )}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}

function ActionButton({ onClick, title, icon, label, danger }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
      title={title}
      aria-label={title}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
