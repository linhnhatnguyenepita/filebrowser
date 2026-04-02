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

  const inputStyle = {
    boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px",
  };

  const inputFocusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.2) 0px 0px 0px 1px";
  };

  const inputBlurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#171717]">
            <HardDrive className="h-5 w-5 text-white" />
          </div>
          <h1
            className="text-xl font-semibold text-[#171717]"
            style={{ letterSpacing: "-0.02em" }}
          >
            FileBrowser
          </h1>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg p-8 space-y-4"
          style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 8px" }}
        >
          <p className="text-sm text-[#666666] text-center mb-6">
            Sign in to your account
          </p>

          {error && (
            <div
              className="p-3 rounded-md text-sm text-[#ff5b4f]"
              style={{ backgroundColor: "rgba(255, 91, 79, 0.08)", border: "1px solid rgba(255, 91, 79, 0.2)" }}
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
              className="w-full px-3 h-9 rounded-md text-sm bg-[#fafafa] text-[#171717] placeholder:text-[#666666] outline-none transition-all"
              style={inputStyle}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
            <input
              id="login-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 h-9 rounded-md text-sm bg-[#fafafa] text-[#171717] placeholder:text-[#666666] outline-none transition-all"
              style={inputStyle}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading || !username}
            className="w-full h-9 rounded-md bg-[#171717] text-white text-sm font-medium hover:bg-[#333333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
