type IconName =
  | "File"
  | "Folder"
  | "Image"
  | "Video"
  | "Music"
  | "FileText"
  | "FileCode"
  | "FileArchive"
  | "FileSpreadsheet"
  | "Presentation";

export function getIconForType(type: string): { icon: IconName; color: string } {
  if (type === "directory") return { icon: "Folder", color: "#7bd0ff" };
  if (type.startsWith("image/")) return { icon: "Image", color: "#22C55E" };
  if (type.startsWith("video/")) return { icon: "Video", color: "#F97316" };
  if (type.startsWith("audio/")) return { icon: "Music", color: "#A855F7" };
  if (type.startsWith("text/")) return { icon: "FileText", color: "#91aaeb" };
  if (type.includes("pdf")) return { icon: "FileText", color: "#ee7d77" };
  if (type.includes("zip") || type.includes("tar") || type.includes("compressed"))
    return { icon: "FileArchive", color: "#EAB308" };
  if (type.includes("spreadsheet") || type.includes("excel"))
    return { icon: "FileSpreadsheet", color: "#22C55E" };
  if (type.includes("presentation") || type.includes("powerpoint"))
    return { icon: "Presentation", color: "#F97316" };
  if (type.includes("json") || type.includes("javascript") || type.includes("xml"))
    return { icon: "FileCode", color: "#7bd0ff" };
  return { icon: "File", color: "#91aaeb" };
}
