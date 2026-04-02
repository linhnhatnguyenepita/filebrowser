import type { ReactNode } from "react";
import {
  Download,
  Pencil,
  FolderInput,
  Copy,
  Trash2,
} from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";
import { useUIStore } from "@/lib/stores/ui-store";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

interface FileContextMenuProps {
  item: FileInfo;
  children: ReactNode;
}

export default function FileContextMenu({ item, children }: FileContextMenuProps) {
  const { source, toggleSelect, selected } = useFileStore();
  const { openDialog } = useUIStore();
  const isDir = item.type === "directory";

  const ensureSelected = () => {
    if (!selected.has(item.name)) {
      toggleSelect(item.name);
    }
  };

  const handleDownload = () => {
    window.open(getDownloadURL(source, item.path), "_blank");
  };

  const handleRename = () => {
    ensureSelected();
    openDialog("rename");
  };

  const handleMove = () => {
    ensureSelected();
    openDialog("moveCopy");
  };

  const handleCopy = () => {
    ensureSelected();
    openDialog("moveCopy");
  };

  const handleDelete = () => {
    ensureSelected();
    openDialog("delete");
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="contents">{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {!isDir && (
          <>
            <ContextMenuItem onClick={handleDownload}>
              <Download size={14} />
              Download
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={handleRename}>
          <Pencil size={14} />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={handleMove}>
          <FolderInput size={14} />
          Move
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopy}>
          <Copy size={14} />
          Copy
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 size={14} />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
