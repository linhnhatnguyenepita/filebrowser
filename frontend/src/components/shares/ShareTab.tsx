import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, RefreshCw, Link2 } from "lucide-react";
import { getShares, deleteShare, createShare, type ShareResponse } from "@/lib/api/shares";
import { useFileStore } from "@/lib/stores/file-store";
import ShareForm from "./ShareForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreferenceSection } from "@/components/ui/form";

function formatExpire(timestamp: number): string {
  if (timestamp === 0) return "Never";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatCreated(): string {
  return "—";
}

export default function ShareTab() {
  const selectedForShare = useFileStore((s) => s.selectedForShare);
  const [shares, setShares] = useState<ShareResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editShare, setEditShare] = useState<ShareResponse | undefined>();
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingHash, setDeletingHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getShares();
      setShares(data);
    } catch {
      setFetchError("Failed to load shares. Click retry to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const filteredShares = shares.filter((s) => {
    const term = filter.toLowerCase();
    return (
      s.path.toLowerCase().includes(term) ||
      s.source.toLowerCase().includes(term) ||
      s.username.toLowerCase().includes(term)
    );
  });

  const handleCreate = () => {
    setEditShare(undefined);
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (share: ShareResponse) => {
    setEditShare(share);
    setFormError(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: { password?: string; expires?: string; unit?: string }) => {
    setFormSaving(true);
    setFormError(null);
    try {
      if (editShare) {
        await createShare({
          hash: editShare.hash,
          source: editShare.source,
          path: editShare.path,
          ...data,
        });
      } else {
        if (!selectedForShare) {
          throw new Error("Select a file or folder to share first.");
        }
        await createShare({
          source: selectedForShare.source,
          path: selectedForShare.path,
          ...data,
        });
      }
      setShowForm(false);
      setEditShare(undefined);
      await loadShares();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save share.";
      setFormError(msg);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (hash: string) => {
    setDeletingHash(hash);
    try {
      await deleteShare(hash);
      setShares((prev) => prev.filter((s) => s.hash !== hash));
    } catch {
      // Keep row visible on error
    } finally {
      setDeletingHash(null);
    }
  };

  const handleCopyLink = async (share: ShareResponse) => {
    try {
      await navigator.clipboard.writeText(share.shareURL);
      setCopiedHash(share.hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="space-y-4">
      <PreferenceSection title="Shared Links">
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter shares…"
              className="flex-1 h-8 text-sm"
            />
            <Button onClick={handleCreate} size="sm" className="shrink-0">
              <Plus size={14} className="mr-1" />
              New Share
            </Button>
            <Button onClick={loadShares} size="sm" variant="ghost" className="shrink-0" disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>

          {/* Error state */}
          {fetchError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle size={14} />
              {fetchError}
            </div>
          )}

          {/* Loading state */}
          {loading && !fetchError && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              Loading shares…
            </div>
          )}

          {/* Create/Edit form */}
          {showForm && (
            <div className="space-y-2">
              {formError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle size={14} />
                  {formError}
                </div>
              )}
              <ShareForm
                share={editShare}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditShare(undefined);
                  setFormError(null);
                }}
                saving={formSaving}
              />
            </div>
          )}

          {/* Shares table */}
          {!loading && !fetchError && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Path</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Created</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Expires</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Protected</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShares.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                        {filter ? `No shares matching "${filter}"` : "No shares yet"}
                      </td>
                    </tr>
                  ) : (
                    filteredShares.map((s) => (
                      <tr key={s.hash} className="border-t border-border hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs px-1 rounded bg-muted text-muted-foreground font-mono">
                              {s.source}
                            </span>
                            <span className="font-medium text-foreground truncate max-w-[200px]" title={s.path}>
                              {s.path}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{formatCreated()}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatExpire(s.expire)}</td>
                        <td className="px-3 py-2">
                          {s.hasPassword ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              Yes
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleCopyLink(s)}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title={copiedHash === s.hash ? "Copied!" : "Copy link"}
                            >
                              {copiedHash === s.hash ? (
                                <span className="text-[10px] text-primary">Copied</span>
                              ) : (
                                <Link2 size={13} />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(s)}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            {deletingHash === s.hash ? (
                              <span className="text-xs text-destructive px-2">Deleting…</span>
                            ) : (
                              <button
                                onClick={() => handleDelete(s.hash)}
                                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PreferenceSection>
    </div>
  );
}
