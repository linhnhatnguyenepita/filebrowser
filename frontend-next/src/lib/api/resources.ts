import { apiPath, apiFetch } from "./client";

export interface FileInfo {
  name: string;
  size: number;
  modified: string;
  type: string;
  hidden: boolean;
  hasPreview: boolean;
  isShared: boolean;
  path: string;
}

export interface DirectoryResponse {
  name: string;
  size: number;
  modified: string;
  type: string;
  path: string;
  source: string;
  files: FileInfo[];
  folders: FileInfo[];
}

export interface ItemsResponse {
  files: string[];
  folders: string[];
}

export async function fetchDirectory(
  source: string,
  path: string
): Promise<DirectoryResponse> {
  return apiFetch<DirectoryResponse>(
    apiPath("resources", { path, source })
  );
}

export async function getItems(
  source: string,
  path: string,
  only?: "files" | "folders"
): Promise<ItemsResponse> {
  const params: Record<string, string> = { path, source };
  if (only) params.only = only;
  return apiFetch<ItemsResponse>(apiPath("resources/items", params));
}

export async function createDirectory(
  source: string,
  path: string
): Promise<void> {
  await apiFetch(apiPath("resources", { path, source, isDir: "true" }), {
    method: "POST",
  });
}

export async function deleteResource(
  source: string,
  path: string
): Promise<void> {
  await apiFetch(apiPath("resources", { path, source }), {
    method: "DELETE",
  });
}

export async function bulkDelete(
  items: Array<{ source: string; path: string }>
): Promise<void> {
  await apiFetch(apiPath("resources/bulk"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items),
  });
}

export interface MoveCopyItem {
  fromSource: string;
  fromPath: string;
  toSource: string;
  toPath: string;
}

export async function moveCopy(
  items: MoveCopyItem[],
  action: "move" | "copy" | "rename",
  overwrite = false
): Promise<void> {
  await apiFetch(apiPath("resources"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, action, overwrite, rename: false }),
  });
}

export function getDownloadURL(source: string, filePath: string): string {
  return window.origin + apiPath("resources/download", { source, file: filePath });
}

export async function uploadFile(
  source: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
  overwrite = false
): Promise<void> {
  const chunkSize = 10 * 1024 * 1024; // 10MB
  const totalSize = file.size;

  if (totalSize <= chunkSize) {
    // Single request upload
    const url = apiPath("resources", {
      path,
      source,
      ...(overwrite ? { override: "true" } : {}),
    });
    await apiFetch(url, {
      method: "POST",
      body: file,
    });
    onProgress?.(100);
    return;
  }

  // Chunked upload
  let offset = 0;
  while (offset < totalSize) {
    const end = Math.min(offset + chunkSize, totalSize);
    const chunk = file.slice(offset, end);
    const url = apiPath("resources", {
      path,
      source,
      ...(overwrite ? { override: "true" } : {}),
    });
    await apiFetch(url, {
      method: "POST",
      headers: {
        "X-File-Chunk-Offset": String(offset),
        "X-File-Total-Size": String(totalSize),
      },
      body: chunk,
    });
    offset = end;
    onProgress?.(Math.round((offset / totalSize) * 100));
  }
}
