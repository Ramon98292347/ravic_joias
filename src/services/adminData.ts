import { supabase } from "@/lib/supabase";

export const adminData = {
  // Products
  async getProduct(id: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async upsertProduct(id: string | null, payload: any) {
    if (id) {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    }
    const { data, error } = await supabase.from("products").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return data?.id;
  },

  async deleteProduct(id: string) {
    // delete dependent rows first to satisfy FK constraints
    await supabase.from("inventário").delete().eq("product_id", id);
    await supabase.from("imagens_do_produto").delete().eq("product_id", id);
    await supabase.from("itens_do_carrossel").delete().eq("product_id", id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  // Categories
  async upsertCategory(id: string | null, payload: any) {
    if (id) {
      const { error } = await supabase.from("categories").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    }
    const { data, error } = await supabase.from("categories").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return data?.id;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  // Collections (Portuguese table name)
  async upsertCollection(id: string | null, payload: any) {
    if (id) {
      const { error } = await supabase.from("coleções").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    }
    const { data, error } = await supabase.from("coleções").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return data?.id;
  },

  async deleteCollection(id: string) {
    const { error } = await supabase.from("coleções").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  // Admin users
  async listAdminUsers() {
    const { data, error } = await supabase
      .from("admin_users")
      .select("id,email,name,role,is_active,created_at,last_login")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async upsertAdminUser(id: string | null, payload: any) {
    if (id) {
      const { error } = await supabase.from("admin_users").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    }
    const { data, error } = await supabase.from("admin_users").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return data?.id;
  },

  async deleteAdminUser(id: string) {
    const { error } = await supabase.from("admin_users").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
