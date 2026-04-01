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
    <nav aria-label="File path" className="flex items-center gap-0.5 text-sm min-w-0 overflow-hidden">
      <button
        onClick={() => onNavigate("/")}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors shrink-0 hover:bg-secondary/50 ${
          segments.length === 0 ? "text-foreground" : "text-muted-foreground"
        }`}
        aria-label="Home"
        title="Home"
      >
        <Home size={15} />
      </button>

      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-0.5 min-w-0">
            <ChevronRight size={13} className="shrink-0 text-muted-foreground opacity-50" />
            <button
              onClick={() => onNavigate(crumb.path)}
              className={`px-2 py-1 rounded-lg transition-colors truncate max-w-[180px] hover:bg-secondary/50 ${
                isLast ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
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
