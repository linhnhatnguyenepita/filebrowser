import { useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

type TabId = "none" | "settings";

interface SidebarFooterProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function SidebarFooter({ activeTab, onTabChange }: SidebarFooterProps) {
  const { logout, user } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <div className="px-3 py-3 shrink-0 border-t border-border space-y-1">
      {/* User identity pill */}
      <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-secondary/50">
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">{user?.username ?? "User"}</p>
          {user?.permissions?.admin && (
            <p className="text-xs text-muted-foreground">Admin</p>
          )}
        </div>
      </div>

      {/* Settings */}
      <button
        onClick={() => onTabChange(activeTab === "settings" ? "none" : "settings")}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          activeTab === "settings"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        }`}
      >
        <Settings size={16} />
        Settings
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary/50 hover:text-foreground disabled:opacity-50"
      >
        <LogOut size={16} />
        {loggingOut ? "Logging out…" : "Logout"}
      </button>
    </div>
  );
}
