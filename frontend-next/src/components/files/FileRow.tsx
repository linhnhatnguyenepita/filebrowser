import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import { TableRow, TableCell } from "@/components/ui/table";
import FileIcon from "./FileIcon";

function formatSize(bytes: number): string {
  if (bytes === 0) return "\u2014";
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

  return (
    <TableRow
      onClick={handleClick}
      className="cursor-pointer"
      data-state={isSelected ? "selected" : undefined}
      style={{
        background: isSelected ? "var(--primary-alpha)" : undefined,
      }}
    >
      <TableCell className="w-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelect(item.name)}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 accent-[var(--primary)] cursor-pointer"
        />
      </TableCell>
      <TableCell className="w-10">
        <FileIcon type={item.type} size={16} />
      </TableCell>
      <TableCell
        className="font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {item.name}
      </TableCell>
      <TableCell style={{ color: "var(--text-secondary)" }}>
        {isDir ? "\u2014" : formatSize(item.size)}
      </TableCell>
      <TableCell style={{ color: "var(--text-secondary)" }}>
        {formatDate(item.modified)}
      </TableCell>
      <TableCell style={{ color: "var(--text-secondary)" }}>
        {formatType(item.type)}
      </TableCell>
    </TableRow>
  );
}
