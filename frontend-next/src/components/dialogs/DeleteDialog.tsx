import { useState } from "react";
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
import { deleteResource, bulkDelete } from "@/lib/api/resources";
import { useFileStore } from "@/lib/stores/file-store";

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  items: Array<{ name: string; isDir: boolean }>;
}

export default function DeleteDialog({
  open,
  onClose,
  items,
}: DeleteDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const { path, source, fetchDirectory, clearSelection } = useFileStore();

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      if (items.length === 1) {
        const item = items[0];
        const suffix = item.isDir ? "/" : "";
        const itemPath =
          path === "/"
            ? `/${item.name}${suffix}`
            : `${path}${item.name}${suffix}`;
        await deleteResource(source, itemPath);
      } else {
        const deleteItems = items.map((item) => {
          const suffix = item.isDir ? "/" : "";
          const itemPath =
            path === "/"
              ? `/${item.name}${suffix}`
              : `${path}${item.name}${suffix}`;
          return { source, path: itemPath };
        });
        await bulkDelete(deleteItems);
      }

      const label =
        items.length === 1
          ? `"${items[0].name}" deleted`
          : `${items.length} items deleted`;
      toast.success(label);
      clearSelection();
      await fetchDirectory(path, source);
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to delete";
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
        <DialogHeader>
          <DialogTitle>Delete</DialogTitle>
          <DialogDescription>
            {items.length === 1 ? (
              <>
                Are you sure you want to delete <code>{items[0].name}</code>?
              </>
            ) : (
              <>
                Are you sure you want to delete{" "}
                <strong>{items.length} items</strong>?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {items.length > 1 && (
          <ul className="max-h-40 overflow-auto text-sm text-muted-foreground list-disc pl-5">
            {items.map((item) => (
              <li key={item.name}>{item.name}</li>
            ))}
          </ul>
        )}
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
            variant="destructive"
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
