import { useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFileStore } from "@/lib/stores/file-store";
import { useUIStore } from "@/lib/stores/ui-store";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StatusBar from "@/components/layout/StatusBar";
import FileGrid from "@/components/files/FileGrid";
import FileList from "@/components/files/FileList";
import UploadDialog from "@/components/dialogs/UploadDialog";
import CreateFolderDialog from "@/components/dialogs/CreateFolderDialog";
import RenameDialog from "@/components/dialogs/RenameDialog";
import DeleteDialog from "@/components/dialogs/DeleteDialog";
import MoveCopyDialog from "@/components/dialogs/MoveCopyDialog";
import PreviewModal from "@/components/dialogs/PreviewModal";

export default function FileBrowser() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchDirectory, source, items, loading, selected } = useFileStore();
  const { viewMode, activeDialog, openDialog, closeDialog } = useUIStore();

  const urlPath = location.pathname.replace(/^\/files/, "") || "/";
  const urlSource = new URLSearchParams(location.search).get("source") || "";

  // Sync source from URL to store — this ensures the store is set to the URL source
  // even before fetchUser() completes its own source initialization.
  useEffect(() => {
    if (urlSource && urlSource !== source) {
      useFileStore.setState({ source: urlSource });
    }
  }, [urlSource, source]);

  useEffect(() => {
    if (source) {
      fetchDirectory(urlPath, source);
    }
  }, [urlPath, source]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNavigate = useCallback(
    (newPath: string, newSource?: string) => {
      const effectiveSource = newSource ?? source;
      if (newSource && newSource !== source) {
        useFileStore.setState({ source: newSource });
      }
      const encodedPath = newPath
        .split("/")
        .map((seg) => (seg ? encodeURIComponent(seg) : seg))
        .join("/");
      navigate(`/files${encodedPath === "/" ? "" : encodedPath}?source=${encodeURIComponent(effectiveSource)}`);
    },
    [navigate, source]
  );

  const selectedItems = useMemo(
    () =>
      items
        .filter((item) => selected.has(item.name))
        .map((item) => ({ name: item.name, isDir: item.type === "directory" })),
    [items, selected]
  );

  const renameTarget = selectedItems[0] ?? { name: "", isDir: false };

  return (
    <div
      className="flex h-screen overflow-hidden bg-background"
    >
      <Sidebar onNavigate={handleNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onNavigate={handleNavigate}
          onUpload={() => openDialog("upload")}
          onNewFolder={() => openDialog("newFolder")}
        />

        <main className="flex-1 overflow-auto p-4">
          {loading ? (
            <div
              className="flex items-center justify-center h-full text-muted-foreground"
            >
              Loading…
            </div>
          ) : viewMode === "grid" ? (
            <FileGrid items={items} onNavigate={handleNavigate} />
          ) : (
            <FileList items={items} onNavigate={handleNavigate} />
          )}
        </main>

        <StatusBar />
      </div>

      <UploadDialog
        open={activeDialog === "upload"}
        onClose={closeDialog}
      />
      <CreateFolderDialog
        open={activeDialog === "newFolder"}
        onClose={closeDialog}
      />
      <RenameDialog
        open={activeDialog === "rename"}
        onClose={closeDialog}
        oldName={renameTarget.name}
        isDir={renameTarget.isDir}
      />
      <DeleteDialog
        open={activeDialog === "delete"}
        onClose={closeDialog}
        items={selectedItems}
      />
      <MoveCopyDialog
        open={
          activeDialog === "moveCopy" ||
          activeDialog === "move" ||
          activeDialog === "copy"
        }
        onClose={closeDialog}
        items={selectedItems}
      />
      <PreviewModal />
    </div>
  );
}
