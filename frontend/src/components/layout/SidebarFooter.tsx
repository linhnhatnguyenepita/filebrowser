import { useState, useEffect } from "react";
import { LogOut, ChevronDown, Settings2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import SettingsDialog from "./SettingsDialog";
import { getStorage } from "@/lib/api/storage";
import { formatBytes } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SidebarFooter() {
  const { logout, user } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storage, setStorage] = useState<{ total: number; free: number } | null>(null);

  useEffect(() => {
    getStorage()
      .then(setStorage)
      .catch(() => {});
  }, []);

  const used = storage ? storage.total - storage.free : null;
  const pct = storage ? Math.round((used / storage.total) * 100) : null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      window.location.href = "/login";
    } catch {
      setLoggingOut(false);
    }
  };

  const initial = user?.username?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      <div className="shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        {/* Storage indicator */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Storage</span>
            {storage ? (
              <span className="text-xs text-muted-foreground font-mono">
                {formatBytes(used)} / {formatBytes(storage.total)}
              </span>
            ) : null}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            {pct !== null && (
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            )}
          </div>
        </div>

        {/* User row: avatar pill opens settings dialog */}
        <div className="p-3 flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex flex-1 items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent text-left cursor-pointer bg-transparent border-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.username ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.permissions?.admin ? "Admin" : "Member"}
              </p>
            </div>
          </button>

          {/* Settings gear icon */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
            title="Settings"
          >
            <Settings2 size={16} />
          </button>

          {/* Logout dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
              title="More options"
            >
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={loggingOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {loggingOut ? "Logging out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
