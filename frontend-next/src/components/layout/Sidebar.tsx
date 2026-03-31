import { useEffect, useState } from "react";
import { LogOut, HardDrive, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useFileStore } from "@/lib/stores/file-store";
import { getSources } from "@/lib/api/settings";
import type { SourceInfo } from "@/lib/api/settings";
import DirectoryTree from "./DirectoryTree";

interface SidebarProps {
  onNavigate: (path: string, source?: string) => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { logout, user } = useAuthStore();
  const { source: activeSource, path: activePath } = useFileStore();

  const [sources, setSources] = useState<SourceInfo>({});
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Load available sources on mount
  useEffect(() => {
    getSources()
      .then(setSources)
      .catch(() => {
        // Fall back silently — sidebar remains usable with just the active source
      });
  }, []);

  const sourceNames = Object.keys(sources);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      window.location.href = "/login";
    } catch {
      setLoggingOut(false);
    }
  };

  const handleSourceSelect = (name: string) => {
    setSourceDropdownOpen(false);
    onNavigate("/", name);
  };

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: "260px",
        background: "var(--surface-1)",
        borderRight: "1px solid var(--border-strong)",
      }}
    >
      {/* App title */}
      <div
        className="flex items-center gap-2 px-4 shrink-0"
        style={{
          height: "52px",
          borderBottom: "1px solid var(--border-strong)",
        }}
      >
        <HardDrive
          size={18}
          style={{ color: "var(--primary)", flexShrink: 0 }}
        />
        <span
          className="font-semibold text-sm truncate"
          style={{ color: "var(--text-primary)" }}
        >
          FileBrowser
        </span>
      </div>

      {/* Source selector */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <button
            onClick={() => setSourceDropdownOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-strong)",
            }}
          >
            <HardDrive size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <span className="flex-1 text-left truncate" style={{ color: "var(--text-primary)" }}>
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
              className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-50"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-strong)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              {sourceNames.map((name) => (
                <button
                  key={name}
                  onClick={() => handleSourceSelect(name)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                  style={{
                    color:
                      name === activeSource
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                    background:
                      name === activeSource ? "var(--surface-3)" : "transparent",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (name !== activeSource)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--surface-3)";
                  }}
                  onMouseLeave={(e) => {
                    if (name !== activeSource)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                  }}
                >
                  <HardDrive size={12} style={{ color: "var(--primary)" }} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Directory tree — fills remaining space */}
      <div className="flex-1 overflow-hidden px-2">
        <DirectoryTree
          source={activeSource}
          activePath={activePath}
          onNavigate={(path) => onNavigate(path)}
        />
      </div>

      {/* Footer: user + logout */}
      <div
        className="px-3 py-2 shrink-0 flex items-center gap-2"
        style={{ borderTop: "1px solid var(--border-strong)" }}
      >
        {/* Username */}
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {user?.username ?? "User"}
          </div>
          {user?.permissions?.admin && (
            <div
              className="text-[10px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Admin
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--surface-3)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--error)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-secondary)";
          }}
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
