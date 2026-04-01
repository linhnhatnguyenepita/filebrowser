import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronRight, Folder, FolderOpen, Loader2 } from "lucide-react";
import { getItems } from "@/lib/api/resources";

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[] | null; // null = not yet loaded, [] = loaded empty
  isExpanded: boolean;
  isLoading: boolean;
}

interface DirectoryTreeProps {
  source: string;
  activePath: string;
  onNavigate: (path: string) => void;
}

function buildRootNode(): TreeNode {
  return {
    name: "/",
    path: "/",
    children: null,
    isExpanded: false,
    isLoading: false,
  };
}

function TreeNodeItem({
  node,
  source,
  activePath,
  onNavigate,
  onToggle,
  depth,
}: {
  node: TreeNode;
  source: string;
  activePath: string;
  onNavigate: (path: string) => void;
  onToggle: (path: string) => void;
  depth: number;
}) {
  const isActive = activePath === node.path;
  const hasChildren = node.children === null || node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1 rounded-md cursor-pointer select-none transition-colors py-2 pr-3"
        style={{
          paddingLeft: `${depth * 12 + 10}px`,
          backgroundColor: isActive ? "#ffffff" : undefined,
          color: isActive ? "#171717" : "#666666",
          boxShadow: isActive ? "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" : undefined,
        }}
        onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff"; }}
        onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
        onClick={() => {
          onNavigate(node.path);
          onToggle(node.path);
        }}
      >
        {/* Expand/Collapse indicator */}
        <span
          className="shrink-0 transition-transform"
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

        {/* Folder icon */}
        <span
          className="shrink-0"
          style={{
            width: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0a72ef",
          }}
        >
          {node.isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
        </span>

        {/* Folder name */}
        <span
          className="text-lg truncate flex-1"
          style={{
            fontWeight: isActive ? 500 : 400,
            fontSize: "14px",
            marginLeft: "4px",
          }}
          title={node.name}
        >
          {node.name === "/" ? "Root" : node.name}
        </span>
      </div>

      {/* Children */}
      {node.isExpanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              source={source}
              activePath={activePath}
              onNavigate={onNavigate}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DirectoryTree({
  source,
  activePath,
  onNavigate,
}: DirectoryTreeProps) {
  const [root, setRoot] = useState<TreeNode>(buildRootNode());
  const initialExpandDone = useRef(false);

  // Load children for a node at the given path
  const loadChildren = useCallback(
    async (nodePath: string) => {
      if (!source) return; // Guard: don't fetch with empty source
      setRoot((prev) => updateNode(prev, nodePath, { isLoading: true }));
      try {
        const data = await getItems(source, nodePath, "folders");
        const children: TreeNode[] = (data.folders || []).map((name) => ({
          name,
          path: nodePath === "/" ? `/${name}/` : `${nodePath}${name}/`,
          children: null,
          isExpanded: false,
          isLoading: false,
        }));
        setRoot((prev) =>
          updateNode(prev, nodePath, { children, isLoading: false })
        );
      } catch {
        setRoot((prev) => updateNode(prev, nodePath, { isLoading: false }));
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
          // Expanding: load children if not yet loaded
          if (node.children === null) {
            // Trigger async load after state update
            setTimeout(() => loadChildren(nodePath), 0);
          }
          return updateNode(prev, nodePath, { isExpanded: true });
        } else {
          // Collapsing
          return updateNode(prev, nodePath, { isExpanded: false });
        }
      });
    },
    [loadChildren]
  );

  // Auto-expand root on initial mount (once), and reset on source change.
  // Deferred via setTimeout to avoid setState-in-effect lint rule.
  useEffect(() => {
    if (!source) return; // Guard: don't expand until source is available
    if (!initialExpandDone.current) {
      initialExpandDone.current = true;
      const t = setTimeout(() => handleToggle("/"), 0);
      return () => clearTimeout(t);
    } else {
      // Source changed: reset tree and schedule re-expand
      const t = setTimeout(() => {
        setRoot(buildRootNode());
        initialExpandDone.current = false;
        handleToggle("/");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [source, handleToggle]);

  return (
    <div className="flex-1 overflow-y-auto py-1">
      <TreeNodeItem
        node={root}
        source={source}
        activePath={activePath}
        onNavigate={onNavigate}
        onToggle={handleToggle}
        depth={0}
      />
    </div>
  );
}

// Immutable tree update helpers

function findNode(root: TreeNode, path: string): TreeNode | null {
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
  node: TreeNode,
  path: string,
  updates: Partial<TreeNode>
): TreeNode {
  if (node.path === path) {
    return { ...node, ...updates };
  }
  if (node.children) {
    return {
      ...node,
      children: node.children.map((child) => updateNode(child, path, updates)),
    };
  }
  return node;
}
