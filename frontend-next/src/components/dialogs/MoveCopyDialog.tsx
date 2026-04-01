import { useState, useEffect, useCallback } from "react";
import { ChevronRight, Folder, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { moveCopy } from "@/lib/api/resources";
import { getItems } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";

interface PickerNode {
  name: string;
  path: string;
  children: PickerNode[] | null;
  isExpanded: boolean;
  isLoading: boolean;
}

interface MoveCopyDialogProps {
  open: boolean;
  onClose: () => void;
  items: Array<{ name: string; isDir: boolean }>;
}

export default function MoveCopyDialog({
  open,
  onClose,
  items,
}: MoveCopyDialogProps) {
  const [action, setAction] = useState<"move" | "copy">("move");
  const [selectedPath, setSelectedPath] = useState("/");
  const [submitting, setSubmitting] = useState(false);
  const [root, setRoot] = useState<PickerNode>(buildRoot());
  const { path, source, fetchDirectory, clearSelection } = useFileStore();

  useEffect(() => {
    if (open) {
      setSelectedPath(path);
      setAction("move");
      setRoot(buildRoot());
      // Auto-expand root
      loadChildren("/");
    }
  }, [open, path]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadChildren = useCallback(
    async (nodePath: string) => {
      setRoot((prev) => updateNode(prev, nodePath, { isLoading: true }));
      try {
        const data = await getItems(source, nodePath, "folders");
        const children: PickerNode[] = (data.folders || []).map((name) => ({
          name,
          path: nodePath === "/" ? `/${name}/` : `${nodePath}${name}/`,
          children: null,
          isExpanded: false,
          isLoading: false,
        }));
        setRoot((prev) =>
          updateNode(prev, nodePath, {
            children,
            isLoading: false,
            isExpanded: true,
          })
        );
      } catch {
        setRoot((prev) =>
          updateNode(prev, nodePath, { isLoading: false })
        );
      }
    },
    [source]
  );

  const handleToggle = useCallback(
    (nodePath: string) => {
      setRoot((prev) => {
        const node = findNode(prev, nodePath);
        if (!node) return prev;
        if (!node.isExpanded) {
          if (node.children === null) {
            setTimeout(() => loadChildren(nodePath), 0);
          }
          return updateNode(prev, nodePath, { isExpanded: true });
        }
        return updateNode(prev, nodePath, { isExpanded: false });
      });
    },
    [loadChildren]
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const moveItems = items.map((item) => {
        const suffix = item.isDir ? "/" : "";
        const fromPath =
          path === "/"
            ? `/${item.name}${suffix}`
            : `${path}${item.name}${suffix}`;
        const toPath =
          selectedPath === "/"
            ? `/${item.name}${suffix}`
            : `${selectedPath}${item.name}${suffix}`;
        return {
          fromSource: source,
          fromPath,
          toSource: source,
          toPath,
        };
      });

      await moveCopy(moveItems, action);

      const label = action === "move" ? "Moved" : "Copied";
      toast.success(
        items.length === 1
          ? `${label} "${items[0].name}"`
          : `${label} ${items.length} items`
      );
      clearSelection();
      await fetchDirectory(path, source);
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : `Failed to ${action}`;
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === "move" ? "Move" : "Copy"}{" "}
            {items.length === 1 ? `"${items[0].name}"` : `${items.length} items`}
          </DialogTitle>
          <DialogDescription>Select a destination folder</DialogDescription>
        </DialogHeader>

        {/* Action toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={action === "move" ? "default" : "outline"}
            onClick={() => setAction("move")}
          >
            Move
          </Button>
          <Button
            size="sm"
            variant={action === "copy" ? "default" : "outline"}
            onClick={() => setAction("copy")}
          >
            Copy
          </Button>
        </div>

        {/* Directory picker */}
        <div
          className="max-h-60 overflow-auto rounded-lg border p-2 border-border"
        >
          <PickerNodeItem
            node={root}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
            onToggle={handleToggle}
            depth={0}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Destination: <code>{selectedPath}</code>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? action === "move"
                ? "Moving…"
                : "Copying…"
              : action === "move"
                ? "Move here"
                : "Copy here"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PickerNodeItem({
  node,
  selectedPath,
  onSelect,
  onToggle,
  depth,
}: {
  node: PickerNode;
  selectedPath: string;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
  depth: number;
}) {
  const isSelected = selectedPath === node.path;
  const hasChildren = node.children === null || node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-lg cursor-pointer select-none text-sm py-1.5 px-2 transition-colors ${
          isSelected
            ? "border border-primary/50 bg-primary/5 text-foreground"
            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node.path)}
      >
        <span
          className="shrink-0 cursor-pointer"
          style={{
            width: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: node.isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            opacity: hasChildren ? 1 : 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.path);
          }}
        >
          {node.isLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <ChevronRight size={12} />
          )}
        </span>
        <span>
          {node.isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
        </span>
        <span className="truncate ml-1">
          {node.name === "/" ? "Root" : node.name}
        </span>
      </div>
      {node.isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <PickerNodeItem
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Tree helpers

function buildRoot(): PickerNode {
  return {
    name: "/",
    path: "/",
    children: null,
    isExpanded: false,
    isLoading: false,
  };
}

function findNode(root: PickerNode, path: string): PickerNode | null {
  if (root.path === path) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, path);
      if (found) return found;
    }
  }
  return null;
}

function updateNode(
  node: PickerNode,
  path: string,
  updates: Partial<PickerNode>
): PickerNode {
  if (node.path === path) return { ...node, ...updates };
  if (node.children) {
    return {
      ...node,
      children: node.children.map((child) => updateNode(child, path, updates)),
    };
  }
  return node;
}
