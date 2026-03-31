import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/stores/auth-store";

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
      navigate("/files", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit}
            className="w-full max-w-sm p-8 rounded-xl space-y-6 bg-card border border-border shadow-lg">
        <h1 className="text-2xl font-semibold text-center text-card-foreground">
          Sign In
        </h1>
        {error && (
          <div className="p-3 rounded-lg text-sm bg-destructive/10 text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <input
            id="login-username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all bg-input text-foreground border border-transparent"
          />
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all bg-input text-foreground border border-transparent"
          />
        </div>
        <button
          id="login-submit"
          type="submit"
          disabled={loading || !username}
          className="w-full py-3 rounded-full font-bold text-sm transition-all disabled:opacity-45 disabled:cursor-not-allowed bg-primary text-primary-foreground"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
