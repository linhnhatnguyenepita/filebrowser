import { apiPath, apiFetch } from "./client";

export interface User {
  id: number;
  username: string;
  scope: string;
  scopes: Array<{ name: string; scope: string }>;
  permissions: {
    admin: boolean;
    modify: boolean;
    share: boolean;
    create: boolean;
    delete: boolean;
    download: boolean;
  };
  viewMode: string;
  darkMode: boolean | null;
  locale: string;
  sorting: { by: string; asc: boolean };
  singleClick: boolean;
  showHidden: boolean;
  stickySidebar: boolean;
  fileLoading?: {
    maxConcurrentUpload?: number;
    uploadChunkSizeMb?: number;
    clearAll?: boolean;
    downloadChunkSizeMb?: number;
  };
}

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>(apiPath("users", { id: "self" }));
}

// Maps frontend User JSON keys to backend Go struct field names used in `which`
const prefKeyToField: Record<string, string> = {
  darkMode: "DarkMode",
  sorting: "Sorting",
  viewMode: "ViewMode",
  locale: "Locale",
  singleClick: "SingleClick",
  showHidden: "ShowHidden",
  stickySidebar: "StickySidebar",
  dateFormat: "DateFormat",
  gallerySize: "GallerySize",
  themeColor: "ThemeColor",
  quickDownload: "QuickDownload",
  disablePreviewExt: "DisablePreviewExt",
  disableViewingExt: "DisableViewingExt",
  deleteWithoutConfirming: "DeleteWithoutConfirming",
  deleteAfterArchive: "DeleteAfterArchive",
  editorQuickSave: "EditorQuickSave",
  hideSidebarFileActions: "HideSidebarFileActions",
  disableQuickToggles: "DisableQuickToggles",
  disableSearchOptions: "DisableSearchOptions",
  showSelectMultiple: "ShowSelectMultiple",
  hideFilesInTree: "HideFilesInTree",
  preferEditorForMarkdown: "PreferEditorForMarkdown",
  password: "Password",
};

export async function updateUserPreferences(currentUser: User, prefs: Partial<User>): Promise<void> {
  const which = Object.keys(prefs)
    .map((k) => prefKeyToField[k])
    .filter(Boolean);

  await apiFetch<User>(apiPath("users", { id: "self" }), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ which, data: { ...currentUser, ...prefs } }),
  });
}

export interface AdminUser {
  id: number;
  username: string;
  password?: string;
  scope: string;
  scopes: Array<{ name: string; scope: string }>;
  permissions: {
    admin: boolean;
    modify: boolean;
    share: boolean;
    create: boolean;
    delete: boolean;
    download: boolean;
    api: boolean;
    realtime: boolean;
  };
  loginMethod?: string;
  locale: string;
  sorting: { by: string; asc: boolean };
  viewMode: string;
  singleClick: boolean;
  showHidden: boolean;
  stickySidebar: boolean;
  fileLoading: {
    maxConcurrentUpload: number;
    uploadChunkSizeMb: number;
    clearAll: boolean;
    downloadChunkSizeMb: number;
  };
}

export async function getUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>(apiPath("users"));
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch(apiPath("users", { id: String(id) }), { method: "DELETE" });
}

export async function createUser(userData: Partial<AdminUser>): Promise<void> {
  await apiFetch(apiPath("users"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ which: [], data: userData }),
  });
}

export async function updateUser(
  id: number,
  userData: Partial<AdminUser>,
  which: string[]
): Promise<void> {
  await apiFetch(apiPath("users", { id: String(id) }), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ which, data: { ...userData, id } }),
  });
}
