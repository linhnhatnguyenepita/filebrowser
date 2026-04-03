import { Download, ExternalLink } from "lucide-react";
import type { ShareInfo } from "@/lib/types/share-viewer";
import { getShareDownloadURL } from "@/lib/api/share-viewer";

interface Props {
  info: ShareInfo;
  hash: string;
  items: { files: Array<{ name: string; path: string }>; folders: unknown[] };
}

export default function ShareHeader({ info, hash, items }: Props) {
  const hasBanner = Boolean(info.bannerUrl);
  const hasFilesOnly = items.files.length === 1 && items.folders.length === 0;
  const singleFile = hasFilesOnly ? items.files[0] : null;

  const handleQuickDownload = () => {
    if (!singleFile) return;
    const url = getShareDownloadURL(hash, singleFile.path);
    const a = document.createElement("a");
    a.href = url;
    a.download = singleFile.name;
    a.click();
  };

  return (
    <div className="w-full">
      {/* Banner */}
      {hasBanner && (
        <div className="w-full h-48 overflow-hidden bg-muted">
          <img
            src={info.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1
              className="text-2xl font-semibold text-foreground truncate"
              style={{ letterSpacing: "-0.02em" }}
            >
              {info.title || "Shared Files"}
            </h1>
            {info.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {info.description}
              </p>
            )}
            {info.sourceURL && (
              <a
                href={info.sourceURL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {info.sourceURL}
              </a>
            )}
          </div>

          {/* Quick Download */}
          {info.quickDownload && hasFilesOnly && (
            <button
              onClick={handleQuickDownload}
              className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
