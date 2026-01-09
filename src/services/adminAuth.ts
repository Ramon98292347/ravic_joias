import { supabase } from "@/lib/supabase";
import { adminData } from "@/services/adminData";

export const adminAuth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "admin", name: "Administrador" },
      },
    });
    if (error) throw new Error(error.message);
    // Autentica imediatamente após cadastro
    const { data: login, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (loginErr) throw new Error(loginErr.message);
    // Sincroniza admin_users com o usuário atual
    await adminData.ensureCurrentAdminUser();
    return login;
  },

  getCurrentUser: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session || null;
    if (!session) return null;
    return session.user;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },
};
