import { apiPath, apiFetch, setToken, clearToken } from "./client";

export async function login(username: string, password: string): Promise<void> {
  const url = apiPath("auth/login", { username });
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "X-Password": encodeURIComponent(password),
    },
  });
  if (!res.ok) {
    let message = "Login failed";
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      // Keep default
    }
    throw new Error(message);
  }
  const token = await res.text();
  if (token) setToken(token.trim());
}

export async function logout(): Promise<void> {
  await apiFetch(apiPath("auth/logout"), { method: "POST" });
  clearToken();
}

export async function renewToken(): Promise<void> {
  const res = await fetch(apiPath("auth/renew"), {
    method: "POST",
    credentials: "same-origin",
    headers: getAuthHeader(),
  });
  if (res.ok) {
    const token = await res.text();
    if (token) setToken(token.trim());
  }
}

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("filebrowser_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
