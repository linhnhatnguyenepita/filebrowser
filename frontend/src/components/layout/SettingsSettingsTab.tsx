import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  PreferenceSection,
  PreferenceToggle,
  PreferenceSegment,
  PreferenceSelect,
  PreferenceInput,
} from "@/components/ui/form";

function themeToString(darkMode: boolean | null): "light" | "dark" | "system" {
  if (darkMode === null) return "system";
  return darkMode ? "dark" : "light";
}

function themeToDarkMode(theme: "light" | "dark" | "system"): boolean | null {
  if (theme === "system") return null;
  return theme === "dark";
}

export default function SettingsSettingsTab() {
  const { user, updatePreferences } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [locale, setLocale] = useState("en");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [singleClick, setSingleClick] = useState(false);
  const [stickySidebar, setStickySidebar] = useState(false);
  const [uploadChunkSize, setUploadChunkSize] = useState(5);
  const [downloadChunkSize, setDownloadChunkSize] = useState(5);

  // Local-only notification preferences
  const [showUploadNotifications, setShowUploadNotifications] = useState(true);
  const [showDeleteConfirmations, setShowDeleteConfirmations] = useState(true);

  useEffect(() => {
    if (!user) return;
    setTheme(themeToString(user.darkMode));
    setLocale(user.locale || "en");
    setViewMode(user.viewMode || "grid");
    setSortBy(user.sorting?.by || "name");
    setSortAsc(user.sorting?.asc ?? true);
    setShowHidden(user.showHidden ?? false);
    setSingleClick(user.singleClick ?? false);
    setStickySidebar(user.stickySidebar ?? false);
    setUploadChunkSize(user.fileLoading?.uploadChunkSizeMb ?? 5);
    setDownloadChunkSize(user.fileLoading?.downloadChunkSizeMb ?? 5);
    setIsDirty(false);
  }, [user]);

  const markDirty = () => setIsDirty(true);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      const changes: Record<string, unknown> = {};
      if (themeToDarkMode(theme) !== user.darkMode) changes.darkMode = themeToDarkMode(theme);
      if (locale !== user.locale) changes.locale = locale;
      if (viewMode !== user.viewMode) changes.viewMode = viewMode;
      if (sortBy !== user.sorting?.by) changes.sorting = { ...user.sorting, by: sortBy };
      if (sortAsc !== user.sorting?.asc) changes.sorting = { ...(changes.sorting ?? user.sorting), asc: sortAsc };
      if (showHidden !== user.showHidden) changes.showHidden = showHidden;
      if (singleClick !== user.singleClick) changes.singleClick = singleClick;
      if (stickySidebar !== user.stickySidebar) changes.stickySidebar = stickySidebar;
      if (uploadChunkSize !== (user.fileLoading?.uploadChunkSizeMb ?? 5)) {
        changes.fileLoading = { ...user.fileLoading, uploadChunkSizeMb: uploadChunkSize };
      }
      if (downloadChunkSize !== (user.fileLoading?.downloadChunkSizeMb ?? 5)) {
        changes.fileLoading = { ...(changes.fileLoading ?? user.fileLoading), downloadChunkSizeMb: downloadChunkSize };
      }

      if (Object.keys(changes).length > 0) {
        await updatePreferences(changes as Parameters<typeof updatePreferences>[0]);
      }
      setIsDirty(false);
    } catch {
      setSaveError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PreferenceSection title="Display">
        <PreferenceSegment
          label="Theme"
          value={theme}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]}
          onChange={(v) => {
            setTheme(v as typeof theme);
            markDirty();
          }}
        />
        <PreferenceSelect
          label="Language"
          value={locale}
          options={[
            { value: "en", label: "English" },
            { value: "vi", label: "Vietnamese" },
            { value: "de", label: "German" },
            { value: "fr", label: "French" },
            { value: "es", label: "Spanish" },
            { value: "ja", label: "Japanese" },
          ]}
          onChange={setLocale}
          onValueChange={markDirty}
        />
        <PreferenceSegment
          label="Default View"
          value={viewMode}
          options={[
            { value: "grid", label: "Grid" },
            { value: "list", label: "List" },
          ]}
          onChange={(v) => {
            setViewMode(v);
            markDirty();
          }}
        />
        <div className="flex items-center justify-between py-2">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-sm font-medium text-foreground leading-none">Default Sort</p>
          </div>
          <div className="flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                markDirty();
              }}
              className="h-7 text-sm rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none"
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="modified">Modified</option>
            </select>
            <select
              value={sortAsc ? "asc" : "desc"}
              onChange={(e) => {
                setSortAsc(e.target.value === "asc");
                markDirty();
              }}
              className="h-7 text-sm rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
        <PreferenceToggle
          label="Show Hidden Files"
          checked={showHidden}
          onChange={(v) => {
            setShowHidden(v);
            markDirty();
          }}
        />
        <PreferenceToggle
          label="Single Click to Open"
          checked={singleClick}
          onChange={(v) => {
            setSingleClick(v);
            markDirty();
          }}
        />
        <PreferenceToggle
          label="Sticky Sidebar"
          checked={stickySidebar}
          onChange={(v) => {
            setStickySidebar(v);
            markDirty();
          }}
        />
      </PreferenceSection>

      <PreferenceSection title="Behavior">
        <PreferenceInput
          label="Upload Chunk Size"
          description="Size in MB (1–100)"
          type="number"
          value={uploadChunkSize}
          onChange={(v) => {
            setUploadChunkSize(Number(v));
            markDirty();
          }}
          min={1}
          max={100}
        />
        <PreferenceInput
          label="Download Chunk Size"
          description="Size in MB (1–100)"
          type="number"
          value={downloadChunkSize}
          onChange={(v) => {
            setDownloadChunkSize(Number(v));
            markDirty();
          }}
          min={1}
          max={100}
        />
      </PreferenceSection>

      <PreferenceSection title="Notifications">
        <PreferenceToggle
          label="Show Upload Notifications"
          description="Show a toast when uploads complete"
          checked={showUploadNotifications}
          onChange={setShowUploadNotifications}
        />
        <PreferenceToggle
          label="Show Delete Confirmations"
          description="Ask before deleting files or folders"
          checked={showDeleteConfirmations}
          onChange={setShowDeleteConfirmations}
        />
      </PreferenceSection>

      <div className="space-y-1.5">
        <Button onClick={handleSave} disabled={!isDirty || saving} className="w-full" size="lg">
          {saving ? "Saving…" : "Save"}
        </Button>
        {saveError && (
          <p className="text-[10px] text-destructive text-center">{saveError}</p>
        )}
      </div>
    </div>
  );
}
