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

const typeIconMap: Array<[RegExp, LucideIcon]> = [
  [/^directory$/, Folder],
  [/^image\//, FileImage],
  [/^video\//, FileVideo],
  [/^audio\//, FileAudio],
  [/^application\/(zip|x-tar|x-gzip|x-bzip2|x-7z|x-rar|gzip)/, FileArchive],
  [/^application\/(json|xml|javascript|typescript|x-sh|x-python)/, FileCode],
  [/^text\/(html|css|javascript|xml|x-python|x-go|x-rust)/, FileCode],
  [/^application\/pdf$/, FileType],
  [/^application\/vnd\.(ms-excel|openxmlformats.*sheet)/, FileSpreadsheet],
  [/^application\/vnd\.(ms-word|openxmlformats.*document)/, FileText],
  [/^application\/vnd\.(ms-powerpoint|openxmlformats.*presentation)/, FileText],
  [/^text\//, FileText],
];

function getIconForType(mimeType: string): LucideIcon {
  for (const [pattern, icon] of typeIconMap) {
    if (pattern.test(mimeType)) return icon;
  }
  return File;
}

interface FileIconProps {
  type: string;
  size?: number;
  className?: string;
}

export default function FileIcon({ type, size = 20, className }: FileIconProps) {
  const Icon = getIconForType(type);
  return <Icon size={size} className={className} />;
}
