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
import { cn } from "@/lib/utils";

type IconSize = "lg" | "sm";

interface FileIconProps {
  type: string;
  iconSize?: IconSize;
  className?: string;
}

type IconConfig = {
  icon: LucideIcon;
  bg: string;
  color: string;
};

// Vercel-palette icon configs
const typeIconMap: Array<[RegExp, IconConfig]> = [
  [/^directory$/,     { icon: Folder,          bg: "rgba(10, 114, 239, 0.1)",  color: "#0a72ef" }],
  [/^image\//,        { icon: FileImage,        bg: "rgba(121, 40, 202, 0.1)", color: "#7928ca" }],
  [/^video\//,        { icon: FileVideo,        bg: "rgba(222, 29, 141, 0.1)", color: "#de1d8d" }],
  [/^audio\//,        { icon: FileAudio,        bg: "rgba(0, 112, 243, 0.1)",  color: "#0070f3" }],
  [/^application\/(zip|x-tar|x-gzip|x-bzip2|x-7z|x-rar|gzip)/,
                      { icon: FileArchive,      bg: "rgba(121, 40, 202, 0.1)", color: "#7928ca" }],
  [/^application\/(json|xml|javascript|typescript|x-sh|x-python)/,
                      { icon: FileCode,         bg: "rgba(10, 114, 239, 0.1)", color: "#0a72ef" }],
  [/^text\/(html|css|javascript|xml|x-python|x-go|x-rust)/,
                      { icon: FileCode,         bg: "rgba(10, 114, 239, 0.1)", color: "#0a72ef" }],
  [/^application\/pdf$/,
                      { icon: FileType,         bg: "rgba(255, 91, 79, 0.1)",  color: "#ff5b4f" }],
  [/^application\/vnd\.(ms-excel|openxmlformats.*sheet)/,
                      { icon: FileSpreadsheet,  bg: "rgba(0, 112, 243, 0.08)", color: "#0070f3" }],
  [/^application\/vnd\.(ms-word|openxmlformats.*document)/,
                      { icon: FileText,         bg: "rgba(10, 114, 239, 0.1)", color: "#0a72ef" }],
  [/^application\/vnd\.(ms-powerpoint|openxmlformats.*presentation)/,
                      { icon: FileText,         bg: "rgba(255, 91, 79, 0.1)",  color: "#ff5b4f" }],
  [/^text\//,         { icon: FileText,         bg: "rgba(0, 112, 243, 0.1)",  color: "#0070f3" }],
];

const fallbackConfig: IconConfig = {
  icon: File,
  bg: "rgba(0, 0, 0, 0.06)",
  color: "#666666",
};

function getIconConfig(mimeType: string): IconConfig {
  for (const [pattern, config] of typeIconMap) {
    if (pattern.test(mimeType)) return config;
  }
  return fallbackConfig;
}

export default function FileIcon({ type, iconSize = "sm", className }: FileIconProps) {
  const { icon: Icon, bg, color } = getIconConfig(type);

  const isLg = iconSize === "lg";
  const sizeClass = isLg ? "h-10 w-10 rounded-lg" : "h-8 w-8 rounded-md";
  const iconSizeClass = isLg ? "h-5 w-5" : "h-4 w-4";

  return (
    <div
      className={cn("flex items-center justify-center shrink-0", sizeClass, className)}
      style={{ backgroundColor: bg }}
    >
      <Icon className={cn(iconSizeClass)} style={{ color }} />
    </div>
  );
}
