import { apiPath, apiFetch } from "./client";

export interface FileMetadata {
  duration?: number;
  albumArt?: string; // data:image/jpeg;base64,...
  width?: number;
  height?: number;
  title?: string;
  artist?: string;
}

export interface MetadataResponse {
  name: string;
  size: number;
  modified: string;
  type: string;
  metadata: FileMetadata | null;
}

export async function fetchMetadata(
  source: string,
  path: string
): Promise<MetadataResponse> {
  return apiFetch<MetadataResponse>(
    apiPath("resources/metadata", { source, path })
  );
}
