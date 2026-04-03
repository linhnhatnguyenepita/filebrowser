import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Toaster } from "@/components/ui/sonner";
import Login from "@/routes/Login";
import FileBrowser from "@/routes/FileBrowser";
import ShareViewer from "@/routes/ShareViewer";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    const darkMode = user?.darkMode;
    const isDark =
      darkMode === true ||
      (darkMode === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, [user?.darkMode]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/public/share/:hash/*" element={<ShareViewer />} />
        <Route path="/files/*" element={<AuthGuard><FileBrowser /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/files" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </>
  );
}
