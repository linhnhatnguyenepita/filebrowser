import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUser } from "@/lib/api/users";

interface UserFormProps {
  user?: AdminUser; // undefined = create mode, defined = edit mode
  onSubmit: (data: Partial<AdminUser>) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const PERMISSION_CHECKBOXES = [
  { key: "admin", label: "Admin" },
  { key: "modify", label: "Modify" },
  { key: "share", label: "Share" },
  { key: "create", label: "Create" },
  { key: "delete", label: "Delete" },
  { key: "download", label: "Download" },
  { key: "api", label: "API" },
  { key: "realtime", label: "Realtime" },
] as const;

export default function UserForm({ user, onSubmit, onCancel, saving }: UserFormProps) {
  const isEdit = !!user;

  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [scope, setScope] = useState(user?.scope ?? "global");
  const [permissions, setPermissions] = useState({
    admin: user?.permissions?.admin ?? false,
    modify: user?.permissions?.modify ?? false,
    share: user?.permissions?.share ?? false,
    create: user?.permissions?.create ?? false,
    delete: user?.permissions?.delete ?? false,
    download: user?.permissions?.download ?? false,
    api: user?.permissions?.api ?? false,
    realtime: user?.permissions?.realtime ?? false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !password.trim()) {
      setError("Password is required.");
      return;
    }
    setError(null);
    const data: Partial<AdminUser> = {
      username,
      scope,
      permissions,
    };
    if (password.trim()) {
      data.password = password;
    }
    await onSubmit(data);
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Username</label>
        {isEdit ? (
          <p className="text-sm text-muted-foreground py-1.5">{username}</p>
        ) : (
          <Input
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(null); }}
            placeholder="username"
            required
          />
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">
          Password <span className="text-muted-foreground font-normal">{isEdit ? "(leave blank to keep current)" : ""}</span>
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          placeholder={isEdit ? "(unchanged)" : "password"}
          required={!isEdit}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Scope</label>
        <Input
          value={scope}
          onChange={(e) => { setScope(e.target.value); setError(null); }}
          placeholder="global"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Permissions</label>
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          {PERMISSION_CHECKBOXES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={permissions[key]}
                onChange={() => togglePermission(key)}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
