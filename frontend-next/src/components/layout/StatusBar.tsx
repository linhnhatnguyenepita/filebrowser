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
    // Download each selected file individually
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
      className="flex items-center justify-between px-4 shrink-0 bg-background border-t border-border text-muted-foreground"
      style={{ height: "36px", fontSize: "12px" }}
    >
      {/* Left: item counts */}
      <div className="flex items-center gap-3">
        {selectionCount > 0 ? (
          <span className="text-foreground">
            {selectionCount} selected
          </span>
        ) : (
          <>
            <span>{fileCount} file{fileCount !== 1 ? "s" : ""}</span>
            {folderCount > 0 && (
              <span>{folderCount} folder{folderCount !== 1 ? "s" : ""}</span>
            )}
          </>
        )}

        {/* Path */}
        <span
          className="truncate max-w-[200px] hidden sm:block"
          style={{ opacity: 0.6 }}
          title={path}
        >
          {path}
        </span>
      </div>

      {/* Right: bulk actions (only visible when items are selected) */}
      {selectionCount > 0 && (
        <div className="flex items-center gap-1">
          {/* Download (files only) */}
          <ActionButton
            onClick={handleDownloadSelected}
            title="Download selected"
            icon={<Download size={13} />}
            label="Download"
          />

          {/* Move */}
          <ActionButton
            onClick={() => openDialog("move")}
            title="Move selected"
            icon={<Move size={13} />}
            label="Move"
          />

          {/* Copy */}
          <ActionButton
            onClick={() => openDialog("copy")}
            title="Copy selected"
            icon={<Copy size={13} />}
            label="Copy"
          />

          {/* Delete */}
          <ActionButton
            onClick={() => openDialog("delete")}
            title="Delete selected"
            icon={<Trash2 size={13} />}
            label="Delete"
            danger
          />

          {/* Clear selection */}
          <button
            onClick={clearSelection}
            className="ml-2 px-2 py-0.5 rounded text-sm transition-colors text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}
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
      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-sm transition-colors"
      style={{
        color: danger ? "var(--destructive)" : "var(--muted-foreground)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
        (e.currentTarget as HTMLButtonElement).style.color = danger
          ? "var(--destructive)"
          : "var(--foreground)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = danger
          ? "var(--destructive)"
          : "var(--muted-foreground)";
      }}
      title={title}
      aria-label={title}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
