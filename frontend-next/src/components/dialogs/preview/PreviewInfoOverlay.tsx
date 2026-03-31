import { formatFileSize } from "@/lib/utils/format";

interface PreviewInfoOverlayProps {
  name: string;
  size: number;
  type: string;
  extra?: React.ReactNode;
}

export default function PreviewInfoOverlay({
  name,
  size,
  type,
  extra,
}: PreviewInfoOverlayProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-black/60 text-xs text-white/80 rounded-b-xl">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="truncate font-medium text-white">{name}</span>
        <span className="text-white/60">
          {formatFileSize(size)} &middot; {type}
        </span>
      </div>
      {extra}
    </div>
  );
}
