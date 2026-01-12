import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabase";

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { authReady, session } = useAuth();
  const navigate = useNavigate();
  const timeoutMs = 6000;

  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as any;
    const isReload = !!nav && nav.type === "reload";
    if (isReload) {
      (async () => {
        try { await supabase.auth.signOut(); } catch {}
        try { localStorage.removeItem("admin_token"); } catch {}
        navigate("/admin/login", { replace: true });
      })();
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (authReady) return;
    const id = setTimeout(() => {
      (async () => {
        try { await supabase.auth.signOut(); } catch {}
        try { localStorage.removeItem("admin_token"); } catch {}
        navigate("/admin/login", { replace: true });
      })();
    }, timeoutMs);
    return () => clearTimeout(id);
  }, [authReady, navigate]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-200">Carregando sessão...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
