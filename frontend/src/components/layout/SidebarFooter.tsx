import { useState } from "react";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="shrink-0" style={{ borderTop: "1px solid #ebebeb" }}>
      {/* Storage indicator */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #ebebeb" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#666666]">Storage</span>
          <span className="text-xs text-[#666666] font-mono">3.4 MB / 100 GB</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[#ebebeb]">
          <div className="h-full w-[1%] rounded-full bg-[#171717]" />
        </div>
      </div>

      {/* User dropdown */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-3 rounded-md p-2 transition-colors hover:bg-white text-left cursor-pointer bg-transparent border-0 outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-white text-xs font-semibold shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#171717] truncate">{user?.username ?? "User"}</p>
              <p className="text-xs text-[#666666]">
                {user?.permissions?.admin ? "Admin" : "Free Plan"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#666666] shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() => onTabChange(activeTab === "settings" ? "none" : "settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loggingOut ? "Logging out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
