import { useState } from "react";
import { LogOut, User, Settings } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

type TabId = "none" | "profile" | "settings";

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
    <div className="px-3 py-2 shrink-0 border-t border-border space-y-1.5">
      {/* User identity pill */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50">
        <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate text-foreground">{user?.username ?? "User"}</p>
          {user?.permissions?.admin && (
            <p className="text-[10px] text-muted-foreground">Admin</p>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1">
        <button
          onClick={() => onTabChange(activeTab === "profile" ? "none" : "profile")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "profile"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <User size={12} />
          Profile
        </button>
        <button
          onClick={() => onTabChange(activeTab === "settings" ? "none" : "settings")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "settings"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Settings size={12} />
          Settings
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        <LogOut size={12} />
        Logout
      </button>
    </div>
  );
}
