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

  // Carousel items
  async listCarouselItems() {
    const { data, error } = await supabase
      .from("itens_do_carrossel")
      .select("id,product_id,sort_order,is_active")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async addCarouselItem(payload: {
    product_id: string;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    image_url: string;
    link_url?: string | null;
    button_text?: string | null;
    sort_order: number;
    is_active: boolean;
    start_date?: string | null;
    end_date?: string | null;
    created_by?: string | null;
  }) {
    const { data, error } = await supabase
      .from("itens_do_carrossel")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data?.id as string;
  },

  async deleteCarouselItem(id: string) {
    const { error } = await supabase.from("itens_do_carrossel").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async updateCarouselItem(id: string, payload: Partial<{ sort_order: number; is_active: boolean }>) {
    const { error } = await supabase.from("itens_do_carrossel").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async syncCurrentAdminUser(): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc("admin_users_sync_current_user");
      if (error) return null;
      return (data as any) || null;
    } catch {
      return null;
    }
  },

  async ensureCurrentAdminUser(): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return null;
      const u = data.user as any;
      const payload = {
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || "",
        role: u.user_metadata?.role || "editor",
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      const { error: upErr } = await supabase
        .from("admin_users")
        .upsert(payload, { onConflict: "id" });
      if (upErr) return null;
      return u.id as string;
    } catch {
      return null;
    }
  },

  async uploadToStorage(bucket: string, path: string, file: File): Promise<{ publicUrl: string; storagePath: string }> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { publicUrl: data.publicUrl, storagePath: path };
  },

  async addProductImage(productId: string, payload: { url: string; alt_text?: string | null; is_primary?: boolean | null; sort_order?: number | null; bucket_name?: string | null; storage_path?: string | null }) {
    const insert: any = {
      product_id: productId,
      url: payload.url,
      alt_text: payload.alt_text ?? null,
      is_primary: payload.is_primary ?? null,
      sort_order: payload.sort_order ?? null,
      bucket_name: payload.bucket_name ?? null,
      storage_path: payload.storage_path ?? null,
    };
    const { error } = await supabase.from("imagens_do_produto").insert(insert);
    if (error) throw new Error(error.message);
  },

  async deleteProductImage(imageId: string) {
    const { error } = await supabase.from("imagens_do_produto").delete().eq("id", imageId);
    if (error) throw new Error(error.message);
  },

  // Settings
  async listSettings(): Promise<Array<{ key: string; value: string | null; type: string }>> {
    const { data, error } = await supabase
      .from("settings")
      .select("key,value,type")
      .order("key", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as any) || [];
  },

  async upsertSettings(items: Array<{ key: string; value: string | null; type: string }>, updatedBy?: string | null) {
    const rows = items.map((i) => ({ ...i, updated_by: updatedBy ?? null, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
  },
};
