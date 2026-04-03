import { useState } from "react";
import { User, Settings, Shield, Link2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import SettingsProfileTab from "./SettingsProfileTab";
import SettingsSettingsTab from "./SettingsSettingsTab";
import SettingsAdminTab from "./SettingsAdminTab";
import ShareTab from "@/components/shares/ShareTab";

type TabId = "profile" | "settings" | "admin" | "shares";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: TabId;
}

export default function SettingsDialog({ open, onClose, initialTab }: SettingsDialogProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? "profile");

  const isAdmin = user?.permissions?.admin === true;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: "profile", label: "Profile", icon: <User size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
    { id: "admin", label: "Admin", icon: <Shield size={16} />, adminOnly: true },
    { id: "shares", label: "Shares", icon: <Link2 size={16} /> },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  // Reset to profile tab when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) setActiveTab(initialTab ?? "profile");
    if (!o) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex h-[80vh]">
        {/* Vertical tab rail */}
        <div className="flex flex-col w-36 shrink-0 bg-muted border-r border-border">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors border-l-2",
                activeTab === tab.id
                  ? "bg-background border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 min-w-0">
          {activeTab === "profile" && <SettingsProfileTab />}
          {activeTab === "settings" && <SettingsSettingsTab />}
          {activeTab === "admin" && isAdmin && <SettingsAdminTab />}
          {activeTab === "shares" && <ShareTab />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
