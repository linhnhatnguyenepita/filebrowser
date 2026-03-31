import { apiPath, apiFetch } from "./client";

export async function login(username: string, password: string): Promise<void> {
  const url = apiPath("auth/login", { username });
  await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "X-Password": encodeURIComponent(password),
    },
  }).then(async (res) => {
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
  });
}

export async function logout(): Promise<void> {
  await apiFetch(apiPath("auth/logout"), { method: "POST" });
}

export async function renewToken(): Promise<void> {
  await apiFetch(apiPath("auth/renew"), { method: "POST" });
}
