import { useState, useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";

interface FileUpload {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error" | "conflict";
  error?: string;
}

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function UploadDialog({ open, onClose }: UploadDialogProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { path, source, fetchDirectory } = useFileStore();

  const addFiles = useCallback((files: FileList | File[]) => {
    const newUploads: FileUpload[] = Array.from(files).map((file) => ({
      file,
      progress: 0,
      status: "pending",
    }));
    setUploads((prev) => [...prev, ...newUploads]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleUpload = async () => {
    if (uploads.length === 0) return;
    setUploading(true);

    for (let i = 0; i < uploads.length; i++) {
      const upload = uploads[i];
      if (upload.status === "done") continue;

      setUploads((prev) =>
        prev.map((u, idx) =>
          idx === i ? { ...u, status: "uploading", progress: 0 } : u
        )
      );

      const filePath =
        path === "/"
          ? `/${upload.file.name}`
          : `${path}${upload.file.name}`;
      const overwrite = upload.status === "conflict";

      try {
        await uploadFile(
          source,
          filePath,
          upload.file,
          (percent) => {
            setUploads((prev) =>
              prev.map((u, idx) =>
                idx === i ? { ...u, progress: percent } : u
              )
            );
          },
          overwrite
        );
        setUploads((prev) =>
          prev.map((u, idx) =>
            idx === i ? { ...u, status: "done", progress: 100 } : u
          )
        );
      } catch (err: unknown) {
        const apiErr = err as { status?: number; message?: string };
        if (apiErr.status === 409) {
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === i
                ? {
                    ...u,
                    status: "conflict",
                    error: "File already exists. Click upload again to overwrite.",
                  }
                : u
            )
          );
        } else {
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === i
                ? {
                    ...u,
                    status: "error",
                    error: apiErr.message || "Upload failed",
                  }
                : u
            )
          );
        }
      }
    }

    setUploading(false);
    const hasErrors = uploads.some(
      (u) => u.status === "error" || u.status === "conflict"
    );
    if (!hasErrors) {
      toast.success(
        uploads.length === 1
          ? `"${uploads[0].file.name}" uploaded`
          : `${uploads.length} files uploaded`
      );
    }
    await fetchDirectory(path, source);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !uploading) {
      setUploads([]);
      onClose();
    }
  };

  const allDone = uploads.length > 0 && uploads.every((u) => u.status === "done");
  const hasPending = uploads.some(
    (u) => u.status === "pending" || u.status === "conflict"
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload files to <code>{path}</code>
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm transition-colors border-border text-muted-foreground"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={24} style={{ opacity: 0.5 }} />
          <span>Drop files here or click to browse</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* File list */}
        {uploads.length > 0 && (
          <div className="max-h-48 space-y-2 overflow-auto">
            {uploads.map((upload, i) => (
              <div
                key={`${upload.file.name}-${i}`}
                className="flex items-center gap-2 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{upload.file.name}</span>
                    {upload.status === "pending" && !uploading && (
                      <button
                        onClick={() => removeFile(i)}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {/* Progress bar */}
                  {upload.status === "uploading" && (
                    <div
                      className="mt-1 h-1 w-full rounded-full overflow-hidden bg-muted"
                    >
                      <div
                        className="h-full rounded-full transition-all bg-foreground"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  {upload.status === "done" && (
                    <span className="text-sm text-green-600">Done</span>
                  )}
                  {(upload.status === "error" ||
                    upload.status === "conflict") && (
                    <span className="text-sm text-destructive">
                      {upload.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={uploading}
          >
            {allDone ? "Close" : "Cancel"}
          </Button>
          {!allDone && (
            <Button
              onClick={handleUpload}
              disabled={uploading || (!hasPending && uploads.length > 0)}
            >
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
