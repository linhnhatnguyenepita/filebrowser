import { apiPath, apiFetch } from "./client";

export interface ShareResponse {
  hash: string;
  source: string;
  path: string;
  expire: number;
  hasPassword: boolean;
  downloads: number;
  username: string;
  pathExists: boolean;
  downloadURL: string;
  shareURL: string;
  [key: string]: unknown;
}

export interface CreateShareBody {
  path: string;
  source: string;
  hash?: string;
  password?: string;
  expires?: string;
  unit?: string;
}

export async function getShares(): Promise<ShareResponse[]> {
  return apiFetch<ShareResponse[]>(apiPath("share/list"));
}

export async function createShare(body: CreateShareBody): Promise<ShareResponse> {
  return apiFetch<ShareResponse>(apiPath("share"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteShare(hash: string): Promise<void> {
  await apiFetch(apiPath("share", { hash }), { method: "DELETE" });
}
