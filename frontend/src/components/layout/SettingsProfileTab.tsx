import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  PreferenceSection,
  PreferenceToggle,
  PreferenceSegment,
  PreferenceSelect,
} from "@/components/ui/form";
import { Shield, Eye, Share2, FolderPlus, Trash2, Download } from "lucide-react";

function themeToString(darkMode: boolean | null): "light" | "dark" | "system" {
  if (darkMode === null) return "system";
  return darkMode ? "dark" : "light";
}

function themeToDarkMode(theme: "light" | "dark" | "system"): boolean | null {
  if (theme === "system") return null;
  return theme === "dark";
}

export default function SettingsProfileTab() {
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
    setIsDirty(false);
  }, [user]);

  const markDirty = () => setIsDirty(true);

  const permissionIcons: Record<string, React.ReactNode> = {
    admin: <Shield size={10} />,
    modify: <Eye size={10} />,
    share: <Share2 size={10} />,
    create: <FolderPlus size={10} />,
    delete: <Trash2 size={10} />,
    download: <Download size={10} />,
  };

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
      {/* Identity card */}
      <div className="border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{user.username}</p>
            <p className="text-[10px] text-muted-foreground">{user.scope}</p>
          </div>
        </div>
        {user.scopes?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {user.scopes.map((s) => (
              <span
                key={s.scope}
                className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {Object.entries(user.permissions ?? {}).map(([key, val]) =>
            val ? (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
              >
                {permissionIcons[key]} {key}
              </span>
            ) : null
          )}
        </div>
      </div>

      <PreferenceSection title="Preferences">
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
