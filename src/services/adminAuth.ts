import adminService from "@/services/adminService";

const MASTER = import.meta.env.VITE_ADMIN_MASTER_PASSWORD || "";

export const adminAuth = {
  signIn: async (email: string, password: string) => {
    const data = await adminService.login(email, password);
    return data;
  },

  signUp: async (email: string, password: string, masterPassword: string) => {
    if (!MASTER || masterPassword !== MASTER) {
      throw new Error("Senha mestre inválida");
    }
    const data = await adminService.register(email, password, masterPassword, "Administrador", "admin");
    return data;
  },

  getCurrentUser: async () => {
    const resp = await adminService.getCurrentUser();
    return resp.user;
  },

  signOut: async () => {
    await adminService.logout();
  },
};
