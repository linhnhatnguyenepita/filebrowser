import { apiPath, apiFetch } from "./client";

export interface SearchResult {
  name: string;
  path: string;
  type: string;
  size: number;
  modified: string;
  hasPreview: boolean;
  source: string;
  hidden?: boolean;
  isShared?: boolean;
}

export async function search(
  query: string,
  source: string
): Promise<SearchResult[]> {
  return apiFetch<SearchResult[]>(
    apiPath("tools/search", { query, sources: source })
  );
}
