// frontend/src/routes/ShareViewer.tsx

import { useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { ShareInfo } from "@/lib/types/share-viewer";
import { getShareItems } from "@/lib/api/share-viewer";
import type { FileInfo } from "@/lib/api/resources";
import ShareInfoLoader from "@/components/shares/ShareInfoLoader";
import ShareHeader from "@/components/shares/ShareHeader";
import ShareBreadcrumb from "@/components/shares/ShareBreadcrumb";
import ShareFooter from "@/components/shares/ShareFooter";
import ShareError from "@/components/shares/ShareError";
import ShareFileGrid from "@/components/shares/ShareFileGrid";
import ShareFileList from "@/components/shares/ShareFileList";
import SharePreview from "@/components/shares/SharePreview";

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

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(buildSharePath(hash, path));
    },
    [navigate, hash]
  );

  return (
    <ShareInfoLoader hash={hash}>
      {(info: ShareInfo) => {
        // Fetch items inside ShareInfoLoader so we can access info.sourceURL to detect single-file shares.
        // Single-file shares cause the /resources/items endpoint to return a 500, so we detect them here
        // and skip the call — sourceFile below handles rendering the file preview.
        if (items === null && !itemsError) {
          if (rawPath === "/" && info.sourceURL && !info.sourceURL.endsWith("/")) {
            // Single-file share: skip the endpoint call, set empty items so sourceFile activates
            setItems({ files: [], folders: [] });
            setItemsLoading(false);
          } else {
            getShareItems(hash, rawPath)
              .then(data => {
                setItems(data);
                setItemsLoading(false);
              })
              .catch((err: unknown) => {
                if (err && typeof err === "object" && "status" in err) {
                  setItemsError(err as { status: number; message: string });
                } else {
                  setItemsError({ status: 0, message: "Could not load files. Please check your connection." });
                }
                setItems(null);
                setItemsLoading(false);
              });
          }
        }

        // compact/normal/gallery all map to grid; only "list" uses the list layout
        const viewMode = info.viewMode === "list" ? "list" : "grid";
        const allItems: FileInfo[] = [
          ...(items?.folders ?? []).filter(f => info.showHidden || !f.hidden),
          ...(items?.files ?? []).filter(f => info.showHidden || !f.hidden),
        ];

        // Single-file share: items returned empty but sourceURL points to a file (not a directory)
        // When sharing a single file, the items endpoint returns {}, and the file path lives in info.sourceURL
        const sourceIsFile =
          items !== null &&
          !itemsLoading &&
          (items?.files ?? []).length === 0 &&
          (items?.folders ?? []).length === 0 &&
          !!info.sourceURL &&
          !info.sourceURL.endsWith("/");

        const singleFile =
          !sourceIsFile &&
          rawPath === "/" &&
          allItems.length === 1 &&
          (items?.folders ?? []).length === 0;

// Build a synthetic FileInfo from share info when sourceURL points to a file
const sourceFile: FileInfo | null = sourceIsFile
  ? {
      name: info.sourceURL.split("/").pop() ?? info.sourceURL,
      size: 0,
      modified: "",
      type: info.sourceURL.split(".").pop()?.toLowerCase() ?? "octet-stream",
      hidden: false,
      hasPreview: false,
              isShared: false,
              path: info.sourceURL,
              source: "",
            }
          : null;

        return (
          <div className="min-h-screen bg-background flex flex-col">
            <ShareHeader info={info} hash={hash} items={items ?? { files: [], folders: [] }} />

            <ShareBreadcrumb
              shareTitle={info.title}
              shareURL={info.shareURL}
              currentPath={rawPath}
              onNavigate={handleNavigate}
            />

            <div className="flex-1 px-6 pb-6">
              <div className="max-w-5xl mx-auto">
                {itemsError ? (
                  <ShareError
                    title="Error loading files"
                    description={itemsError.status > 0 ? itemsError.message : itemsError.message}
                  />
                ) : itemsLoading ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-sm">Loading files…</span>
                    </div>
                  </div>
                ) : singleFile && allItems.length === 1 ? (
                  <SharePreview file={allItems[0]} hash={hash} />
                ) : sourceFile ? (
                  <SharePreview file={sourceFile} hash={hash} />
                ) : allItems.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    This folder is empty.
                  </div>
                ) : viewMode === "list" ? (
                  <ShareFileList items={allItems} hash={hash} currentPath={rawPath} onNavigate={handleNavigate} />
                ) : (
                  <ShareFileGrid items={allItems} hash={hash} currentPath={rawPath} onNavigate={handleNavigate} />
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
