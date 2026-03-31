import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import FileIcon from "./FileIcon";

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
  const { selected, toggleSelect, source } = useFileStore();
  const isSelected = selected.has(item.name);
  const isDir = item.type === "directory";

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      toggleSelect(item.name);
      return;
    }
    if (isDir) {
      onNavigate(item.path);
    } else {
      window.open(getDownloadURL(source, item.path), "_blank");
    }
  };

  const handleCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelect(item.name);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col items-center gap-2 rounded-lg p-3 cursor-pointer transition-colors"
      style={{
        background: isSelected ? "var(--primary-alpha)" : "transparent",
        border: isSelected
          ? "1px solid var(--primary)"
          : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLDivElement).style.background = "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Checkbox — visible on hover or when selected */}
      <div
        onClick={handleCheckbox}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ opacity: isSelected ? 1 : undefined }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          className="w-3.5 h-3.5 accent-[var(--primary)] cursor-pointer"
        />
      </div>

      <FileIcon type={item.type} size={32} />

      <span
        className="text-xs text-center truncate w-full"
        style={{ color: "var(--text-primary)" }}
        title={item.name}
      >
        {item.name}
      </span>

      {!isDir && item.size > 0 && (
        <span
          className="text-[10px]"
          style={{ color: "var(--text-secondary)" }}
        >
          {formatSize(item.size)}
        </span>
      )}
    </div>
  );
}
