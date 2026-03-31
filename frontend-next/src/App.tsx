import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Toaster } from "@/components/ui/sonner";
import Login from "@/routes/Login";
import FileBrowser from "@/routes/FileBrowser";

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
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/files/*" element={<AuthGuard><FileBrowser /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/files" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </>
  );
}
