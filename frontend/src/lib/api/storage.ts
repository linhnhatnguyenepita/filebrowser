import { apiPath, apiFetch } from "./client";

export interface StorageInfo {
  total: number;
  free: number;
}

export async function getStorage(): Promise<StorageInfo> {
  return apiFetch<StorageInfo>(apiPath("storage"));
}
