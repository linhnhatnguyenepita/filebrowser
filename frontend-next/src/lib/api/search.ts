import { apiPath, apiFetch } from "./client";

export interface SearchResult {
  path: string;
  type: string;
  size: number;
  source: string;
}

export async function search(
  query: string,
  source: string
): Promise<SearchResult[]> {
  return apiFetch<SearchResult[]>(
    apiPath("tools/search", { query, sources: source })
  );
}
