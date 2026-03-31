import { useEffect, useRef } from "react";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";

export type TabId = "none" | "profile" | "settings";

interface SidebarTabPanelProps {
  activeTab: TabId;
  onClose: () => void;
}

export default function SidebarTabPanel({ activeTab, onClose }: SidebarTabPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the panel
  useEffect(() => {
    if (activeTab === "none") return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeTab, onClose]);

  if (activeTab === "none") return null;

  return (
    <div
      ref={panelRef}
      className="flex-1 overflow-y-auto px-3 py-2"
    >
      {activeTab === "profile" && <ProfilePanel />}
      {activeTab === "settings" && <SettingsPanel />}
    </div>
  );
}
