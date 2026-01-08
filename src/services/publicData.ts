import { supabase } from "@/lib/supabase";

export type ProductImage = {
  id?: string;
  url: string;
  alt_text?: string;
  sort_order?: number | null;
  is_primary?: boolean | null;
  storage_path?: string | null;
  bucket_name?: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  promotional_price?: number | null;
  is_new?: boolean | null;
  is_featured?: boolean | null;
  category?: { id: string; name: string; slug: string; description?: string | null } | null;
  collection?: { id: string; name: string; slug: string; description?: string | null } | null;
  images?: ProductImage[] | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  cover_image_url?: string | null;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  banner_url?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

export const fetchCollections = async (): Promise<Collection[]> => {
  const { data, error } = await supabase
    .from("coleções")
    .select("id,name,slug,description,image_url,banner_url,is_active,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  return (data || []).filter((c: any) => c.is_active !== false);
};

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,image_url,is_active,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  return (data || []).filter((c: any) => c.is_active !== false);
};

export const fetchProducts = async (params: {
  page?: number;
  limit?: number;
  category?: string;
  collection?: string;
  search?: string;
  featured?: boolean;
  isNew?: boolean;
}): Promise<{ products: Product[]; total: number }> => {
  const { page = 1, limit = 20, category, collection, search, featured, isNew } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("products")
    .select(
      `*,
      category:categories(id,name,slug,description),
      collection:coleções(id,name,slug,description),
      images:imagens_do_produto(id,url,alt_text,sort_order,is_primary,storage_path,bucket_name)`,
      { count: "exact" }
    )
    .eq("is_active", true)
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (category && category !== "all") query = query.eq("category_id", category);
  if (collection && collection !== "all") query = query.eq("collection_id", collection);
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  if (featured === true) query = query.eq("is_featured", true);
  if (isNew === true) query = query.eq("is_new", true);

  const { data, error, count } = await query;
  if (error) return { products: [], total: 0 };
  return { products: (data as any) || [], total: count || 0 };
};

