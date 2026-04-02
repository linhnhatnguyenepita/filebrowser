import { useEffect, useState } from "react";
import { HardDrive, ChevronDown, Plus } from "lucide-react";
import { useFileStore } from "@/lib/stores/file-store";
import { getSources } from "@/lib/api/settings";
import type { SourceInfo } from "@/lib/api/settings";
import DirectoryTree from "./DirectoryTree";
import SidebarFooter from "./SidebarFooter";
import SidebarTabPanel from "./SidebarTabPanel";
import type { TabId } from "./SidebarTabPanel";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate: (path: string, source?: string) => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { source: activeSource, path: activePath } = useFileStore();

  const [sources, setSources] = useState<SourceInfo>({});
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("none");

  useEffect(() => {
    getSources()
      .then(setSources)
      .catch(() => {});
  }, []);

  const sourceNames = Object.keys(sources);

  const handleSourceSelect = (name: string) => {
    setSourceDropdownOpen(false);
    onNavigate("/", name);
  };

  return (
    <aside
      className="flex flex-col shrink-0 bg-[#fafafa]"
      style={{ width: "260px", boxShadow: "rgba(0, 0, 0, 0.08) 1px 0px 0px 0px" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#171717] shrink-0">
          <HardDrive className="h-4 w-4 text-white" />
        </div>
        <span
          className="text-base font-semibold text-[#171717]"
          style={{ letterSpacing: "-0.02em" }}
        >
          FileBrowser
        </span>
      </div>

      {/* New / Source button */}
      <div className="px-4 pb-4 shrink-0">
        {sourceNames.length > 1 ? (
          <div className="relative">
            <button
              onClick={() => setSourceDropdownOpen((o) => !o)}
              className="w-full flex items-center gap-2 h-9 px-3 rounded-md bg-[#171717] text-white text-sm font-medium hover:bg-[#333333] transition-colors"
            >
              <HardDrive className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left truncate">{activeSource || "default"}</span>
              <ChevronDown
                className={cn("h-3 w-3 shrink-0 transition-transform", sourceDropdownOpen && "rotate-180")}
              />
            </button>

            {sourceDropdownOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-md overflow-hidden z-50 bg-white"
                style={{ boxShadow: "rgba(0,0,0,0.12) 0px 4px 16px, rgba(0,0,0,0.08) 0px 0px 0px 1px" }}
              >
                {sourceNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleSourceSelect(name)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[#fafafa]",
                      name === activeSource ? "text-[#171717] font-medium" : "text-[#666666]"
                    )}
                  >
                    <HardDrive className="h-3 w-3 shrink-0" />
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button className="w-full flex items-center justify-center gap-2 h-9 rounded-md bg-[#171717] text-white text-sm font-medium hover:bg-[#333333] transition-colors">
            <Plus className="h-4 w-4" />
            New
          </button>
        )}
      </div>

      {/* Directory tree or panel */}
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
