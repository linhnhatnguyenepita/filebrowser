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
  containerClass: string;
  iconClass: string;
};

const typeIconMap: Array<[RegExp, IconConfig]> = [
  [/^directory$/, { icon: Folder, containerClass: "bg-primary/15", iconClass: "text-primary" }],
  [/^image\//, { icon: FileImage, containerClass: "bg-purple-500/15", iconClass: "text-purple-400" }],
  [/^video\//, { icon: FileVideo, containerClass: "bg-rose-500/15", iconClass: "text-rose-400" }],
  [/^audio\//, { icon: FileAudio, containerClass: "bg-cyan-500/15", iconClass: "text-cyan-400" }],
  [/^application\/(zip|x-tar|x-gzip|x-bzip2|x-7z|x-rar|gzip)/, { icon: FileArchive, containerClass: "bg-amber-500/15", iconClass: "text-amber-500" }],
  [/^application\/(json|xml|javascript|typescript|x-sh|x-python)/, { icon: FileCode, containerClass: "bg-blue-500/15", iconClass: "text-blue-400" }],
  [/^text\/(html|css|javascript|xml|x-python|x-go|x-rust)/, { icon: FileCode, containerClass: "bg-blue-500/15", iconClass: "text-blue-400" }],
  [/^application\/pdf$/, { icon: FileType, containerClass: "bg-red-500/15", iconClass: "text-red-400" }],
  [/^application\/vnd\.(ms-excel|openxmlformats.*sheet)/, { icon: FileSpreadsheet, containerClass: "bg-green-500/15", iconClass: "text-green-400" }],
  [/^application\/vnd\.(ms-word|openxmlformats.*document)/, { icon: FileText, containerClass: "bg-blue-500/15", iconClass: "text-blue-400" }],
  [/^application\/vnd\.(ms-powerpoint|openxmlformats.*presentation)/, { icon: FileText, containerClass: "bg-orange-500/15", iconClass: "text-orange-400" }],
  [/^text\//, { icon: FileText, containerClass: "bg-blue-500/15", iconClass: "text-blue-400" }],
];

const fallbackConfig: IconConfig = {
  icon: File,
  containerClass: "bg-secondary",
  iconClass: "text-muted-foreground",
};

function getIconConfig(mimeType: string): IconConfig {
  for (const [pattern, config] of typeIconMap) {
    if (pattern.test(mimeType)) return config;
  }
  return fallbackConfig;
}

export default function FileIcon({ type, iconSize = "sm", className }: FileIconProps) {
  const { icon: Icon, containerClass, iconClass } = getIconConfig(type);

  const isLg = iconSize === "lg";
  const containerSizeClass = isLg ? "h-12 w-12 rounded-xl" : "h-9 w-9 rounded-lg";
  const iconSizeClass = isLg ? "h-6 w-6" : "h-4 w-4";

  return (
    <div className={cn("flex items-center justify-center shrink-0", containerSizeClass, containerClass, className)}>
      <Icon className={cn(iconSizeClass, iconClass)} />
    </div>
  );
}
