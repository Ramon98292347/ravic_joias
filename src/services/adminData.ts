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
};

