const PREVIEWABLE_MIME_PREFIXES = [
  "image/",
  "video/",
  "audio/",
  "text/",
];

const PREVIEWABLE_TYPES = new Set([
  "pdf",
  "application/pdf",
  "application/json",
]);

export function isPreviewable(mimeType: string): boolean {
  if (PREVIEWABLE_TYPES.has(mimeType)) return true;
  return PREVIEWABLE_MIME_PREFIXES.some((prefix) =>
    mimeType.startsWith(prefix)
  );
}

export function getPreviewType(
  mimeType: string
): "image" | "video" | "audio" | "text" | "pdf" | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("text/")) return "text";
  if (mimeType === "pdf" || mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/json") return "text";
  return null;
}
