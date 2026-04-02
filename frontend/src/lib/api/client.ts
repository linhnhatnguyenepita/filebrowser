// Typed fetch wrapper with cookie-based auth, auto token renewal, and 401 redirect.

interface ApiError {
  status: number;
  message: string;
}

declare global {
  interface Window {
    globalVars?: { baseURL?: string };
  }
}

function getBaseURL(): string {
  return window.globalVars?.baseURL ?? "/";
}

export function apiPath(endpoint: string, params?: Record<string, string | string[]>): string {
  let path = `${getBaseURL()}api/${endpoint}`;
  if (params) {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
    if (parts.length > 0) path += `?${parts.join("&")}`;
  }
  return path;
}

export async function apiFetch<T = unknown>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    ...opts,
    headers: {
      ...opts.headers,
    },
  });

  // Auto-renew token when backend signals near-expiry
  if (res.headers.get("X-Renew-Token") === "true") {
    await fetch(apiPath("auth/renew"), {
      method: "POST",
      credentials: "same-origin",
    });
  }

  if (res.status === 401) {
    const err: ApiError = { status: 401, message: "Unauthorized" };
    throw err;
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      // Keep statusText
    }
    const err: ApiError = { status: res.status, message };
    throw err;
  }

  // Return empty for 204 No Content
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }
  return (await res.text()) as T;
}
