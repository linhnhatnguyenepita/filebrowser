import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  Folder,
  FileType,
  type LucideIcon,
} from "lucide-react";

const typeIconMap: Array<[RegExp, LucideIcon, string]> = [
  [/^directory$/, Folder, "var(--primary)"],
  [/^image\//, FileImage, "#e879a0"],
  [/^video\//, FileVideo, "#a78bfa"],
  [/^audio\//, FileAudio, "#fb923c"],
  [/^application\/(zip|x-tar|x-gzip|x-bzip2|x-7z|x-rar|gzip)/, FileArchive, "#facc15"],
  [/^application\/(json|xml|javascript|typescript|x-sh|x-python)/, FileCode, "#34d399"],
  [/^text\/(html|css|javascript|xml|x-python|x-go|x-rust)/, FileCode, "#34d399"],
  [/^application\/pdf$/, FileType, "#ef4444"],
  [/^application\/vnd\.(ms-excel|openxmlformats.*sheet)/, FileSpreadsheet, "#22d3ee"],
  [/^application\/vnd\.(ms-word|openxmlformats.*document)/, FileText, "#60a5fa"],
  [/^application\/vnd\.(ms-powerpoint|openxmlformats.*presentation)/, FileText, "#f97316"],
  [/^text\//, FileText, "#94a3b8"],
];

function getIconForType(mimeType: string): [LucideIcon, string] {
  for (const [pattern, icon, color] of typeIconMap) {
    if (pattern.test(mimeType)) return [icon, color];
  }
  return [File, "var(--text-secondary)"];
}

interface FileIconProps {
  type: string;
  size?: number;
  className?: string;
}

export default function FileIcon({ type, size = 20, className }: FileIconProps) {
  const [Icon, color] = getIconForType(type);
  return <Icon size={size} style={{ color }} className={className} />;
}
