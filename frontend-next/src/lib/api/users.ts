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
}

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>(apiPath("users", { id: "self" }));
}

export async function updateUserPreferences(prefs: Partial<User>): Promise<void> {
  await apiFetch<User>(apiPath("users", { id: "self" }), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
}
