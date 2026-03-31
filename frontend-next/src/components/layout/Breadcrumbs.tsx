import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
}

export default function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
  // Split path into segments, filtering empty strings
  const segments = path.split("/").filter(Boolean);

  // Build cumulative paths for each segment
  const crumbs = segments.map((segment, idx) => ({
    label: segment,
    path: "/" + segments.slice(0, idx + 1).join("/") + "/",
  }));

  return (
    <nav
      aria-label="File path"
      className="flex items-center gap-1 text-sm min-w-0 overflow-hidden"
    >
      {/* Root / Home */}
      <button
        onClick={() => onNavigate("/")}
        className="flex items-center gap-1 px-1.5 py-1 rounded transition-colors shrink-0 hover:bg-accent"
        style={{
          color: segments.length === 0 ? "var(--foreground)" : "var(--muted-foreground)",
        }}
        aria-label="Home"
        title="Home"
      >
        <Home size={15} />
      </button>

      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-1 min-w-0">
            <ChevronRight
              size={13}
              className="shrink-0 text-muted-foreground"
              style={{ opacity: 0.5 }}
            />
            <button
              onClick={() => onNavigate(crumb.path)}
              className="px-1 py-0.5 rounded transition-colors truncate max-w-[180px] hover:bg-accent"
              style={{
                color: isLast ? "var(--foreground)" : "var(--muted-foreground)",
                fontWeight: isLast ? 500 : 400,
              }}
              title={crumb.label}
            >
              {crumb.label}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
