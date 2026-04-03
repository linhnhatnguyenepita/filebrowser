import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface Segment {
  label: string;
  path: string; // empty string = root
}

interface Props {
  shareHash: string;
  shareTitle: string;
  shareURL: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function ShareBreadcrumb({
  shareHash,
  shareTitle,
  shareURL,
  currentPath,
  onNavigate,
}: Props) {
  const segments: Segment[] = [
    { label: shareTitle || "Share", path: "" },
  ];

  // Parse currentPath into segments: "/folder1/folder2" → segments after root
  const parts = currentPath.split("/").filter(Boolean);
  let accumulated = "";
  for (const part of parts) {
    accumulated += `/${part}`;
    segments.push({ label: part, path: accumulated });
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-2">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          return (
            <span key={seg.path} className="flex items-center gap-1 whitespace-nowrap">
              {i > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
              {isLast ? (
                <span className="text-foreground font-medium truncate max-w-[200px]">
                  {seg.label}
                </span>
              ) : seg.path === "" ? (
                <Link
                  to={shareURL}
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Home className="h-3 w-3" />
                  {seg.label}
                </Link>
              ) : (
                <button
                  onClick={() => onNavigate(seg.path)}
                  className="hover:text-foreground transition-colors"
                >
                  {seg.label}
                </button>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
