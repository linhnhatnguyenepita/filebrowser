import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { getUsers, deleteUser, createUser, updateUser } from "@/lib/api/users";
import type { AdminUser } from "@/lib/api/users";
import UserForm from "@/components/admin/UserForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreferenceSection } from "@/components/ui/form";

export default function SettingsAdminTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // Create/edit form state
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | undefined>();
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setFetchError("Failed to load users. Click retry to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCreate = () => {
    setEditUser(undefined);
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (user: AdminUser) => {
    setEditUser(user);
    setFormError(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: Partial<AdminUser>) => {
    setFormSaving(true);
    setFormError(null);
    try {
      if (editUser) {
        await updateUser(editUser.id, data, ["Permissions"]);
      } else {
        await createUser(data);
      }
      setShowForm(false);
      setEditUser(undefined);
      await loadUsers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save user.";
      setFormError(msg);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: unknown) {
      // Keep row visible on error
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Users section */}
      <PreferenceSection title="Users">
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter users…"
              className="flex-1 h-8 text-sm"
            />
            <Button onClick={handleCreate} size="sm" className="shrink-0">
              <Plus size={14} className="mr-1" />
              Create User
            </Button>
            <Button onClick={loadUsers} size="sm" variant="ghost" className="shrink-0" disabled={loading}>
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
              Loading users…
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
              <UserForm
                user={editUser}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditUser(undefined);
                  setFormError(null);
                }}
                saving={formSaving}
              />
            </div>
          )}

          {/* User table */}
          {!loading && !fetchError && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Username</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Scope</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Role</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                        {filter ? `No users matching "${filter}"` : "No users found"}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium text-foreground">{u.username}</td>
                        <td className="px-3 py-2 text-muted-foreground">{u.scope || "—"}</td>
                        <td className="px-3 py-2">
                          {u.permissions?.admin ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              Admin
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              Member
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(u)}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            {deletingId === u.id ? (
                              <span className="text-xs text-destructive px-2">Deleting…</span>
                            ) : (
                              <button
                                onClick={() => handleDelete(u.id)}
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

      {/* System Settings section — read-only */}
      <PreferenceSection title="System Settings">
        <div className="space-y-2">
          <div className="flex justify-between text-sm py-1 border-b border-border/50">
            <span className="text-muted-foreground">Hostname</span>
            <span className="text-foreground font-mono">fileb</span>
          </div>
          <div className="flex justify-between text-sm py-1 border-b border-border/50">
            <span className="text-muted-foreground">Port</span>
            <span className="text-foreground font-mono">8080</span>
          </div>
          <div className="flex justify-between text-sm py-1 border-b border-border/50">
            <span className="text-muted-foreground">Registered Users</span>
            <span className="text-foreground font-mono">{users.length}</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Full system configuration is managed server-side in the config file.
        </p>
      </PreferenceSection>
    </div>
  );
}
