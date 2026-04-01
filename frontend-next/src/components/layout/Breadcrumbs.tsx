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
        className={`px-2 py-1 rounded-md transition-colors hover:text-[#171717] shrink-0 ${
          segments.length === 0 ? "font-medium text-[#171717]" : "text-[#666666] hover:bg-[#fafafa]"
        }`}
        aria-label="Home"
      >
        Home
      </button>

      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-1 min-w-0">
            <ChevronRight size={14} className="shrink-0 text-[#666666]" />
            <button
              onClick={() => onNavigate(crumb.path)}
              className={`px-2 py-1 rounded-md transition-colors truncate max-w-[180px] hover:bg-[#fafafa] ${
                isLast ? "font-medium text-[#171717]" : "text-[#666666] hover:text-[#171717]"
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
