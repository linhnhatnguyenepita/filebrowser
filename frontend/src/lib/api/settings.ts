import { apiPath, apiFetch } from "./client";

export interface SourceInfo {
  [sourceName: string]: {
    name: string;
    path: string;
    numFiles: number;
    numFolders: number;
  };
}

export async function getSources(): Promise<SourceInfo> {
  return apiFetch<SourceInfo>(apiPath("settings/sources"));
}
