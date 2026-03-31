import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { moveCopy } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";

interface RenameDialogProps {
  open: boolean;
  onClose: () => void;
  oldName: string;
  isDir: boolean;
}

export default function RenameDialog({
  open,
  onClose,
  oldName,
  isDir,
}: RenameDialogProps) {
  const [newName, setNewName] = useState(oldName);
  const [submitting, setSubmitting] = useState(false);
  const { path, source, fetchDirectory } = useFileStore();

  useEffect(() => {
    if (open) setNewName(oldName);
  }, [open, oldName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    setSubmitting(true);
    try {
      const suffix = isDir ? "/" : "";
      const fromPath =
        path === "/"
          ? `/${oldName}${suffix}`
          : `${path}${oldName}${suffix}`;
      const toPath =
        path === "/"
          ? `/${trimmed}${suffix}`
          : `${path}${trimmed}${suffix}`;

      await moveCopy(
        [{ fromSource: source, fromPath, toSource: source, toPath }],
        "rename"
      );
      toast.success(`Renamed to "${trimmed}"`);
      await fetchDirectory(path, source);
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to rename";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              Rename <code>{oldName}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={submitting}
              onFocus={(e) => {
                // Select name without extension for files
                const dotIdx = oldName.lastIndexOf(".");
                if (!isDir && dotIdx > 0) {
                  e.currentTarget.setSelectionRange(0, dotIdx);
                } else {
                  e.currentTarget.select();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !newName.trim() || newName.trim() === oldName || submitting
              }
            >
              {submitting ? "Renaming…" : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
