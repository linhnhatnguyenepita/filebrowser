import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ShareResponse } from "@/lib/api/shares";
import type { FileInfo } from "@/lib/api/resources";

interface ShareFormProps {
  share?: ShareResponse;
  selectedFile?: FileInfo | null;
  onSubmit: (data: { password?: string; expires?: string; unit?: string }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const UNIT_OPTIONS = [
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

export default function ShareForm({ share, selectedFile, onSubmit, onCancel, saving }: ShareFormProps) {
  const isEdit = !!share;

  const [password, setPassword] = useState("");
  const [expiresEnabled, setExpiresEnabled] = useState(share ? share.expire > 0 : false);
  const [expires, setExpires] = useState(() => share ? String(Math.round((share.expire - Date.now() / 1000) / 3600)) : "24");
  const [unit, setUnit] = useState("hours");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const data: { password?: string; expires?: string; unit?: string } = {};
    if (password.trim()) {
      data.password = password;
    }
    if (expiresEnabled && expires.trim()) {
      data.expires = expires.trim();
      data.unit = unit;
    }
    await onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border border-border rounded-lg p-4 bg-muted/30"
    >
      {isEdit && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Path</label>
          <p className="text-sm font-mono text-foreground py-1.5 bg-background border border-border rounded px-2 truncate" title={`${share.source}://${share.path}`}>
            {share.source}://{share.path}
          </p>
        </div>
      )}

      {!isEdit && selectedFile && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Sharing</label>
          <p className="text-sm font-mono text-foreground py-1.5 bg-background border border-border rounded px-2 truncate" title={`${selectedFile.source}://${selectedFile.path}`}>
            {selectedFile.type === "directory" ? "📁 " : "📄 "}
            {selectedFile.source}://{selectedFile.path}
          </p>
        </div>
      )}

      {!isEdit && !selectedFile && (
        <div className="space-y-1">
          <p className="text-xs py-1.5 text-muted-foreground italic">
            No file or folder selected. Close this dialog and click Share on a file or folder first.
          </p>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Password <span className="font-normal">(optional)</span>
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEdit ? "(leave blank to keep current)" : "(no password)"}
        />
        {isEdit && share.hasPassword && (
          <p className="text-[10px] text-muted-foreground">
            Leave blank to keep the current password.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={expiresEnabled}
            onChange={(e) => setExpiresEnabled(e.target.checked)}
            className="accent-primary"
          />
          Set expiration
        </label>
        {expiresEnabled && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="w-20"
              required
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="h-8 text-sm rounded-lg border border-input bg-background px-2"
            >
              {UNIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || (!isEdit && !selectedFile)}>
          {saving ? "Saving…" : isEdit ? "Update Share" : "Create Share"}
        </Button>
      </div>
    </form>
  );
}
