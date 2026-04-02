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
    <div className="flex items-center justify-between px-4 py-2 bg-card/90 backdrop-blur-sm border-t border-border text-sm rounded-b-xl">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="truncate font-medium text-foreground">{name}</span>
        <span className="text-xs text-muted-foreground">
          {formatFileSize(size)} &middot; {type}
        </span>
      </div>
      {extra}
    </div>
  );
}
