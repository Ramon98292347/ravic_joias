import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  authReady: boolean;
  session: any | null;
};

const AuthContext = createContext<AuthContextValue>({ authReady: false, session: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<any | null>(null);
  const mounted = useRef(false);
  const timeoutMs = 6000;

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const nav = performance.getEntriesByType("navigation")[0] as any;
      const isReload = !!nav && nav.type === "reload";
      const isAdminRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
      if (isReload && isAdminRoute) {
        try { await supabase.auth.signOut(); } catch {}
        try { localStorage.removeItem("admin_token"); } catch {}
        if (!mounted.current) return;
        setSession(null);
        setAuthReady(true);
        window.location.replace("/admin/login");
        return;
      }
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => reject(new Error("SESSION_BOOTSTRAP_TIMEOUT")), timeoutMs);
        (sessionPromise as Promise<any>).finally(() => clearTimeout(id));
      });
      try {
        const { data } = await Promise.race([sessionPromise, timeoutPromise]);
        if (!mounted.current) return;
        setSession((data as any)?.session || null);
      } catch (e: any) {
        if (e?.message === "SESSION_BOOTSTRAP_TIMEOUT") {
          try {
            await supabase.auth.signOut();
          } catch {}
          try {
            localStorage.removeItem("admin_token");
          } catch {}
          if (!mounted.current) return;
          setSession(null);
        }
      } finally {
        if (mounted.current) setAuthReady(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted.current) return;
      setSession(s || null);
    });

    return () => {
      mounted.current = false;
      sub.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ authReady, session }), [authReady, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
