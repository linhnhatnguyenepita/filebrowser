// frontend/src/lib/api/share-viewer.ts

import { ShareInfo } from "@/lib/types/share-viewer";
import type { FileInfo } from "@/lib/api/resources";

function getBaseURL(): string {
  return window.globalVars?.baseURL ?? "/";
}

function publicPath(endpoint: string, params?: Record<string, string>): string {
  let path = `${getBaseURL()}public/api/${endpoint}`;
  if (params) {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    if (parts.length > 0) path += `?${parts.join("&")}`;
  }
  return path;
}

export interface ShareInfoResponse extends ShareInfo {}

export async function getShareInfo(hash: string): Promise<ShareInfoResponse> {
  const url = publicPath("share/info", { hash });
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    const err: { status: number; message: string } = { status: res.status, message: res.statusText };
    try {
      const body = await res.json();
      if (body.message) err.message = body.message;
    } catch { /* keep statusText */ }
    throw err;
  }
  return res.json();
}

export interface ShareItemsResponse {
  files: FileInfo[];
  folders: FileInfo[];
}

export async function getShareItems(
  hash: string,
  path: string = "/"
): Promise<ShareItemsResponse> {
  const url = publicPath("resources/items", { hash, path });
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    const err: { status: number; message: string } = { status: res.status, message: res.statusText };
    try {
      const body = await res.json();
      if (body.message) err.message = body.message;
    } catch { /* keep statusText */ }
    throw err;
  }
  return res.json();
}

export function getShareDownloadURL(hash: string, path: string): string {
  return publicPath("resources/download", { hash, path });
}
