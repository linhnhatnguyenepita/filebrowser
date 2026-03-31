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
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: "linear-gradient(135deg, var(--surface-0), var(--surface-2))" }}>
      <form onSubmit={handleSubmit}
            className="w-full max-w-sm p-8 rounded-xl space-y-6"
            style={{
              background: "rgba(6, 18, 45, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
            }}>
        <h1 className="text-2xl font-semibold text-center" style={{ color: "var(--text-primary)" }}>
          Sign In
        </h1>
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(238,125,119,0.15)", color: "var(--error)" }}>
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
            className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
            style={{
              background: "var(--surface-3)",
              color: "var(--text-primary)",
              border: "1px solid transparent",
            }}
          />
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
            style={{
              background: "var(--surface-3)",
              color: "var(--text-primary)",
              border: "1px solid transparent",
            }}
          />
        </div>
        <button
          id="login-submit"
          type="submit"
          disabled={loading || !username}
          className="w-full py-3 rounded-full font-bold text-sm transition-all disabled:opacity-45 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-container))",
            color: "#004560",
          }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
