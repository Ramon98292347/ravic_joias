import { supabase } from "@/lib/supabase";

const MASTER = import.meta.env.VITE_ADMIN_MASTER_PASSWORD || "";

export const adminAuth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  signUp: async (email: string, password: string, masterPassword: string) => {
    if (!MASTER || masterPassword !== MASTER) {
      throw new Error("Senha mestre inválida");
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "admin" },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    return data.user;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },
};

