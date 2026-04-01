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
      style={{ width: "360px" }}
    >
      {/* Brand header */}
      <div className="flex items-center gap-3 px-4 border-b border-border shrink-0" style={{ height: "52px" }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
          <HardDrive className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">FileBrowser</h1>
          <p className="text-xs text-muted-foreground">File Manager</p>
        </div>
      </div>

      {/* Source selector */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <button
            onClick={() => setSourceDropdownOpen((o) => !o)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-secondary border border-border text-foreground hover:bg-secondary/80"
          >
            <HardDrive className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left truncate font-semibold">
              {activeSource || "default"}
            </span>
            {sourceNames.length > 1 && (
              <ChevronDown
                className={`h-3 w-3 shrink-0 transition-transform ${sourceDropdownOpen ? "rotate-180" : ""}`}
              />
            )}
          </button>

          {sourceDropdownOpen && sourceNames.length > 1 && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-50 bg-card border border-border shadow-md">
              {sourceNames.map((name) => (
                <button
                  key={name}
                  onClick={() => handleSourceSelect(name)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary/50 text-left ${
                    name === activeSource ? "bg-secondary text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <HardDrive className="h-3 w-3 shrink-0" />
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
