import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getDefaultSource } from "@/lib/stores/source-utils";
import { HardDrive } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/files", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      const source = await getDefaultSource();
      navigate(`/files?source=${encodeURIComponent(source)}`, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <HardDrive className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1
            className="text-xl font-semibold text-foreground"
            style={{ letterSpacing: "-0.02em" }}
          >
            FileBrowser
          </h1>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-lg p-8 space-y-4"
          style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 8px" }}
        >
          <p className="text-sm text-muted-foreground text-center mb-6">
            Sign in to your account
          </p>

          {error && (
            <div
              className="p-3 rounded-md text-sm text-destructive bg-destructive/10 border border-destructive/20"
            >
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              id="login-username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              className="w-full px-3 h-9 rounded-md text-sm bg-secondary text-foreground placeholder:text-muted-foreground outline-none transition-all dark:shadow-border"
              onFocus={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-border-light)")}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-border)")}
            />
            <input
              id="login-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 h-9 rounded-md text-sm bg-secondary text-foreground placeholder:text-muted-foreground outline-none transition-all dark:shadow-border"
              onFocus={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-border-light)")}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-border)")}
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading || !username}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
