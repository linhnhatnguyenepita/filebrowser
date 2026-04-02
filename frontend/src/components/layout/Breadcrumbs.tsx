import { ChevronRight } from "lucide-react";

interface BreadcrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
}

export default function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
  const segments = path.split("/").filter(Boolean);

  const crumbs = segments.map((segment, idx) => ({
    label: segment,
    path: "/" + segments.slice(0, idx + 1).join("/") + "/",
  }));

  return (
    <nav aria-label="File path" className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
      <button
        onClick={() => onNavigate("/")}
        className={`px-2 py-1 rounded-md transition-colors hover:text-foreground shrink-0 ${
          segments.length === 0 ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent"
        }`}
        aria-label="Home"
      >
        Home
      </button>

      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-1 min-w-0">
            <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
            <button
              onClick={() => onNavigate(crumb.path)}
              className={`px-2 py-1 rounded-md transition-colors truncate max-w-[180px] hover:bg-accent ${
                isLast ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
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
