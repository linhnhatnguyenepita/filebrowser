import type { FileInfo } from "@/lib/api/resources";
import FileCard from "./FileCard";
import FileContextMenu from "./FileContextMenu";

interface FileGridProps {
  items: FileInfo[];
  onNavigate: (path: string) => void;
}

export default function FileGrid({ items, onNavigate }: FileGridProps) {
  if (items.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        This folder is empty
      </div>
    );
  }

  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      }}
    >
      {items.map((item) => (
        <FileContextMenu key={item.name} item={item}>
          <FileCard item={item} onNavigate={onNavigate} />
        </FileContextMenu>
      ))}
    </div>
  );
}
