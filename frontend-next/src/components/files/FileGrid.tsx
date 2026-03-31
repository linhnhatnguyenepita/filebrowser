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
        className="flex items-center justify-center h-full text-sm text-muted-foreground"
      >
        This folder is empty
      </div>
    );
  }

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
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
