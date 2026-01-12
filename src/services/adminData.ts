import { supabase } from "@/lib/supabase";

const adminDataDebugEnabled = !!import.meta.env.DEV;

function adminDataLog(level: "debug" | "info" | "warn" | "error", message: string, data?: unknown) {
  if (!adminDataDebugEnabled) return;
  const prefix = "[adminData]";
  if (data === undefined) {
    console[level](`${prefix} ${message}`);
    return;
  }
  console[level](`${prefix} ${message}`, data);
}

export const adminData = {
  // Products
  async getProduct(id: string) {
    adminDataLog("debug", "getProduct:start", { id });
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      adminDataLog("error", "getProduct:error", { id, message: error.message });
      throw new Error(error.message);
    }
    adminDataLog("debug", "getProduct:ok", { id });
    return data;
  },

  async upsertProduct(id: string | null, payload: any) {
    adminDataLog("info", "upsertProduct:start", { id, hasId: !!id });
    const sanitized: any = {
      name: payload?.name,
      description: payload?.description ?? null,
      category_id: payload?.category_id ?? null,
      collection_id: payload?.collection_id ?? null,
      material: payload?.material ?? null,
      price: typeof payload?.price === "number" ? payload.price : null,
      promotional_price: payload?.promotional_price ?? null,
      stock: typeof payload?.stock === "number" ? payload.stock : null,
      tags: Array.isArray(payload?.tags) ? payload.tags : [],
      is_active: !!payload?.is_active,
      is_featured: !!payload?.is_featured,
      is_new: !!payload?.is_new,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { error } = await supabase.from("products").update(sanitized).eq("id", id);
      if (error) {
        adminDataLog("error", "upsertProduct:update:error", { id, message: error.message });
        throw new Error(error.message);
      }
      adminDataLog("info", "upsertProduct:update:ok", { id });
      return id;
    }
    const insertRow = { ...sanitized, created_at: new Date().toISOString() };
    const { data, error } = await supabase.from("products").insert(insertRow).select("id").single();
    if (error) {
      adminDataLog("error", "upsertProduct:insert:error", { message: error.message });
      throw new Error(error.message);
    }
    adminDataLog("info", "upsertProduct:insert:ok", { id: data?.id });
    return data?.id;
  },

  async deleteAllProductImagesByProduct(productId: string) {
    adminDataLog("info", "deleteAllProductImagesByProduct:start", { productId });
    const { data: images, error: imagesErr } = await supabase
      .from("imagens_do_produto")
      .select("id,bucket_name,storage_path")
      .eq("product_id", productId);
    if (imagesErr) {
      adminDataLog("error", "deleteAllProductImagesByProduct:list:error", { productId, message: imagesErr.message });
      throw new Error(imagesErr.message);
    }

    adminDataLog("debug", "deleteAllProductImagesByProduct:list:ok", {
      productId,
      count: Array.isArray(images) ? images.length : 0,
    });

    if (Array.isArray(images) && images.length > 0) {
      const byBucket: Record<string, string[]> = {};
      for (const img of images as any[]) {
        const bucket = img.bucket_name as string | null;
        const path = img.storage_path as string | null;
        if (bucket && path) {
          if (!byBucket[bucket]) byBucket[bucket] = [];
          byBucket[bucket].push(path);
        }
      }
      for (const bucket of Object.keys(byBucket)) {
        const paths = byBucket[bucket];
        if (paths.length === 0) continue;
        adminDataLog("debug", "deleteAllProductImagesByProduct:storage:remove:start", {
          productId,
          bucket,
          count: paths.length,
        });
        const { error: storageErr } = await supabase.storage
          .from(bucket)
          .remove(paths);
        if (storageErr) {
          console.warn("Falha ao remover imagens do storage:", storageErr.message);
          adminDataLog("warn", "deleteAllProductImagesByProduct:storage:remove:error", {
            productId,
            bucket,
            message: storageErr.message,
          });
        } else {
          adminDataLog("debug", "deleteAllProductImagesByProduct:storage:remove:ok", { productId, bucket });
        }
      }
    }

    const { error } = await supabase
      .from("imagens_do_produto")
      .delete()
      .eq("product_id", productId);
    if (error) {
      adminDataLog("error", "deleteAllProductImagesByProduct:db:delete:error", { productId, message: error.message });
      throw new Error(error.message);
    }
    adminDataLog("info", "deleteAllProductImagesByProduct:ok", { productId });
  },

  async deleteProduct(id: string) {
    const { data: images, error: imagesErr } = await supabase
      .from("imagens_do_produto")
      .select("id,bucket_name,storage_path")
      .eq("product_id", id);
    if (imagesErr) throw new Error(imagesErr.message);

    if (Array.isArray(images) && images.length > 0) {
      const byBucket: Record<string, string[]> = {};
      for (const img of images as any[]) {
        const bucket = img.bucket_name as string | null;
        const path = img.storage_path as string | null;
        if (bucket && path) {
          if (!byBucket[bucket]) byBucket[bucket] = [];
          byBucket[bucket].push(path);
        }
      }
      for (const bucket of Object.keys(byBucket)) {
        const paths = byBucket[bucket];
        if (paths.length === 0) continue;
        const { error: storageErr } = await supabase.storage
          .from(bucket)
          .remove(paths);
        if (storageErr) {
          console.warn("Falha ao remover imagens do storage:", storageErr.message);
        }
      }
    }

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
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session || null;
      if (!session?.user) return null;
      const u = session.user as any;
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
    adminDataLog("info", "uploadToStorage:start", {
      bucket,
      path,
      fileName: file?.name,
      fileSize: typeof file?.size === "number" ? file.size : undefined,
      fileType: file?.type,
    });
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) {
      adminDataLog("error", "uploadToStorage:error", { bucket, path, message: error.message });
      throw new Error(error.message);
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    adminDataLog("info", "uploadToStorage:ok", { bucket, path });
    return { publicUrl: data.publicUrl, storagePath: path };
  },

  async addProductImage(productId: string, payload: { url: string; alt_text?: string | null; is_primary?: boolean | null; sort_order?: number | null; bucket_name?: string | null; storage_path?: string | null }) {
    adminDataLog("debug", "addProductImage:start", {
      productId,
      is_primary: payload?.is_primary ?? null,
      sort_order: payload?.sort_order ?? null,
      bucket_name: payload?.bucket_name ?? null,
      storage_path: payload?.storage_path ?? null,
    });
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
    if (error) {
      adminDataLog("error", "addProductImage:error", { productId, message: error.message });
      throw new Error(error.message);
    }
    adminDataLog("debug", "addProductImage:ok", { productId });
  },

  async deleteProductImage(imageId: string) {
    const { data: imageRow, error: findErr } = await supabase
      .from("imagens_do_produto")
      .select("id,bucket_name,storage_path")
      .eq("id", imageId)
      .single();
    if (findErr) throw new Error(findErr.message);

    if (imageRow?.bucket_name && imageRow?.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from(imageRow.bucket_name)
        .remove([imageRow.storage_path]);
      // continua mesmo se storage falhar
      if (storageErr) {
        console.warn("Falha ao remover do storage:", storageErr.message);
      }
    }

    const { error } = await supabase
      .from("imagens_do_produto")
      .delete()
      .eq("id", imageId);
    if (error) throw new Error(error.message);
  },

  async updateProductImage(imageId: string, payload: { url: string; bucket_name?: string | null; storage_path?: string | null; alt_text?: string | null; is_primary?: boolean | null; sort_order?: number | null }) {
    const update: any = {
      url: payload.url,
      bucket_name: payload.bucket_name ?? null,
      storage_path: payload.storage_path ?? null,
      alt_text: payload.alt_text ?? null,
      is_primary: payload.is_primary ?? null,
      sort_order: payload.sort_order ?? null,
    };
    const { error } = await supabase
      .from("imagens_do_produto")
      .update(update)
      .eq("id", imageId);
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
