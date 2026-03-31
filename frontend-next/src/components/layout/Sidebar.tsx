import { useEffect, useState } from "react";
import { HardDrive, ChevronDown } from "lucide-react";
import { useFileStore } from "@/lib/stores/file-store";
import { getSources } from "@/lib/api/settings";
import type { SourceInfo } from "@/lib/api/settings";
import DirectoryTree from "./DirectoryTree";
import SidebarFooter from "./SidebarFooter";
import SidebarTabPanel from "./SidebarTabPanel";
import type { TabId } from "./SidebarTabPanel";

interface SidebarProps {
  onNavigate: (path: string, source?: string) => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { source: activeSource, path: activePath } = useFileStore();

  const [sources, setSources] = useState<SourceInfo>({});
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("none");

  // Load available sources on mount
  useEffect(() => {
    getSources()
      .then(setSources)
      .catch(() => {
        // Fall back silently — sidebar remains usable with just the active source
      });
  }, []);

  const sourceNames = Object.keys(sources);

  const handleSourceSelect = (name: string) => {
    setSourceDropdownOpen(false);
    onNavigate("/", name);
  };

  return (
    <aside
      className="flex flex-col shrink-0 bg-card border-r border-border"
      style={{ width: "260px" }}
    >
      {/* App title */}
      <div
        className="flex items-center gap-2 px-4 shrink-0 border-b border-border"
        style={{ height: "52px" }}
      >
        <HardDrive
          size={18}
          className="shrink-0"
        />
        <span
          className="font-semibold text-sm truncate text-foreground"
        >
          FileBrowser
        </span>
      </div>

      {/* Source selector */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <button
            onClick={() => setSourceDropdownOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-border bg-background text-foreground hover:bg-accent"
          >
            <HardDrive size={12} className="shrink-0" />
            <span
              className="flex-1 text-left truncate"
              style={{ fontSize: "14px", fontWeight: 700 }}
            >
              {activeSource || "default"}
            </span>
            {sourceNames.length > 1 && (
              <ChevronDown
                size={12}
                className="shrink-0 transition-transform"
                style={{
                  transform: sourceDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            )}
          </button>

          {/* Source dropdown */}
          {sourceDropdownOpen && sourceNames.length > 1 && (
            <div
              className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-50 bg-card border border-border shadow-md"
            >
              {sourceNames.map((name) => (
                <button
                  key={name}
                  onClick={() => handleSourceSelect(name)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-accent"
                  style={{
                    color: name === activeSource ? "var(--foreground)" : "var(--muted-foreground)",
                    background: name === activeSource ? "var(--accent)" : "transparent",
                    textAlign: "left",
                  }}
                >
                  <HardDrive size={12} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeTab === "none" ? (
        <div className="flex-1 overflow-hidden px-2">
          <DirectoryTree
            source={activeSource}
            activePath={activePath}
            onNavigate={(path) => onNavigate(path)}
          />
        </div>
      ) : (
        <SidebarTabPanel activeTab={activeTab} onClose={() => setActiveTab("none")} />
      )}

      <SidebarFooter activeTab={activeTab} onTabChange={setActiveTab} />
    </aside>
  );
}
