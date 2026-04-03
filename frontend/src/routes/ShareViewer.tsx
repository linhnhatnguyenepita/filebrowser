// frontend/src/routes/ShareViewer.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { ShareInfo } from "@/lib/types/share-viewer";
import { getShareItems } from "@/lib/api/share-viewer";
import type { FileInfo } from "@/lib/api/resources";
import ShareInfoLoader from "@/components/shares/ShareInfoLoader";
import ShareHeader from "@/components/shares/ShareHeader";
import ShareBreadcrumb from "@/components/shares/ShareBreadcrumb";
import ShareFooter from "@/components/shares/ShareFooter";
import ShareError from "@/components/shares/ShareError";
import FileGrid from "@/components/files/FileGrid";
import FileList from "@/components/files/FileList";

type Items = { files: FileInfo[]; folders: FileInfo[] };

function buildSharePath(hash: string, path: string): string {
  return path && path !== "/" ? `/public/share/${hash}${path}` : `/public/share/${hash}`;
}

export default function ShareViewer() {
  const { hash } = useParams<{ hash: string }>();
  const location = useLocation();

  if (!hash) {
    return <ShareError title="Invalid link" description="No share hash found in URL." action={{ label: "Go to FileBrowser", href: "/" }} />;
  }

  return <ShareViewerInner hash={hash} location={location} />;
}

function ShareViewerInner({ hash, location }: { hash: string; location: ReturnType<typeof useLocation> }) {
  const navigate = useNavigate();

  // Parse path from URL: /public/share/{hash}/subfolder → /subfolder
  const rawPath = location.pathname.replace(/^\/public\/share\/[^/]+/, "") || "/";

  const [items, setItems] = useState<Items | null>(null);
  const [itemsError, setItemsError] = useState<{ status: number; message: string } | null>(null);
  const [itemsLoading, setItemsLoading] = useState(true);

  const fetchItems = useCallback(async (path: string) => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      const data = await getShareItems(hash, path);
      setItems(data);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "status" in err) {
        setItemsError(err as { status: number; message: string });
      } else {
        setItemsError({ status: 0, message: "Could not load files. Please check your connection." });
      }
      setItems(null);
    } finally {
      setItemsLoading(false);
    }
  }, [hash]);

  useEffect(() => {
    fetchItems(rawPath);
  }, [fetchItems, rawPath]);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(buildSharePath(hash, path));
    },
    [navigate, hash]
  );

  const handleFileClick = useCallback(
    (item: FileInfo) => {
      if (item.type === "directory") {
        const newPath = rawPath === "/" ? `/${item.name}` : `${rawPath}/${item.name}`;
        handleNavigate(newPath);
      }
      // Files are handled by FileGrid/FileList internally
    },
    [handleNavigate, rawPath]
  );

  if (itemsError) {
    if (itemsError.status === 403) {
      return <ShareError title="Folder not found" description="This folder does not exist." />;
    }
    if (itemsError.status === 0) {
      return <ShareError title="Connection error" description={itemsError.message} />;
    }
  }

  return (
    <ShareInfoLoader hash={hash}>
      {(info: ShareInfo) => {
        const viewMode = info.viewMode === "list" ? "list" : "grid";
        const allItems: FileInfo[] = [
          ...(items?.folders ?? []).filter(f => info.showHidden || !f.hidden),
          ...(items?.files ?? []).filter(f => info.showHidden || !f.hidden),
        ];

        return (
          <div className="min-h-screen bg-background flex flex-col">
            <ShareHeader info={info} hash={hash} items={items ?? { files: [], folders: [] }} />

            <ShareBreadcrumb
              shareHash={hash}
              shareTitle={info.title}
              shareURL={info.shareURL}
              currentPath={rawPath}
              onNavigate={handleNavigate}
            />

            <div className="flex-1 px-6 pb-6">
              <div className="max-w-5xl mx-auto">
                {itemsLoading ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-sm">Loading files…</span>
                    </div>
                  </div>
                ) : allItems.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    This folder is empty.
                  </div>
                ) : viewMode === "list" ? (
                  <FileList items={allItems} onNavigate={handleNavigate} />
                ) : (
                  <FileGrid items={allItems} onNavigate={handleNavigate} />
                )}
              </div>
            </div>

            <ShareFooter sourceURL={info.sourceURL} />
          </div>
        );
      }}
    </ShareInfoLoader>
  );
}
