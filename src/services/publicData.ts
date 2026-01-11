import { supabase } from "@/lib/supabase";
const __cache: Record<string, { ts: number; data: any }> = {};
const __ttl = 5 * 60 * 1000;
const __get = (k: string) => {
  const v = __cache[k];
  if (!v) return null;
  if (Date.now() - v.ts > __ttl) return null;
  return v.data;
};
const __set = (k: string, data: any) => {
  __cache[k] = { ts: Date.now(), data };
};

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
  sizes?: number[] | null;
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

export const fetchCollections = async (opts?: { includeInactive?: boolean }): Promise<Collection[]> => {
  const includeInactive = opts?.includeInactive === true;
  const ck = `collections:${includeInactive ? "all" : "active"}`;
  const cached = __get(ck);
  if (cached) return cached as Collection[];
  const { data, error } = await supabase
    .from("coleções")
    .select("id,name,slug,description,image_url,banner_url,is_active,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  const rows = includeInactive ? (data || []) : (data || []).filter((c: any) => c.is_active !== false);
  __set(ck, rows);
  return rows;
};

export const fetchCategories = async (opts?: { includeInactive?: boolean }): Promise<Category[]> => {
  const includeInactive = opts?.includeInactive === true;
  const ck = `categories:${includeInactive ? "all" : "active"}`;
  const cached = __get(ck);
  if (cached) return cached as Category[];
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,image_url,is_active,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  const rows = includeInactive ? (data || []) : (data || []).filter((c: any) => c.is_active !== false);
  __set(ck, rows);
  return rows;
};

export const fetchProducts = async (params: {
  page?: number;
  limit?: number;
  category?: string;
  collection?: string;
  search?: string;
  featured?: boolean;
  isNew?: boolean;
  active?: boolean;
  includeInactive?: boolean;
}): Promise<{ products: Product[]; total: number }> => {
  const { page = 1, limit = 20, category, collection, search, featured, isNew, active, includeInactive } = params;
  const offset = (page - 1) * limit;

  const tryQuery = async (selectClause: string) => {
    let query = supabase
      .from("products")
      .select(selectClause, { count: "exact" })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (typeof active === "boolean") query = query.eq("is_active", active);
    else if (!includeInactive) query = query.eq("is_active", true);

    if (category && category !== "all") query = query.eq("category_id", category);
    if (collection && collection !== "all") query = query.eq("collection_id", collection);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    if (featured === true) query = query.eq("is_featured", true);
    if (isNew === true) query = query.eq("is_new", true);

    return await query;
  };
  const ck = `products:${page}:${limit}:${category || ""}:${collection || ""}:${search || ""}:${featured ? "1" : "0"}:${isNew ? "1" : "0"}:${typeof active === "boolean" ? (active ? "a1" : "a0") : "an"}:${includeInactive ? "i1" : "i0"}`;
  const cached = __get(ck);
  if (cached) return cached as { products: Product[]; total: number };
  const selectClause = `*,category:categories(id,name,slug,description),collection:coleções(id,name,slug,description),images:imagens_do_produto(id,url,alt_text,sort_order,is_primary,storage_path,bucket_name)`;
  const { data, error, count } = await tryQuery(selectClause);
  if (error) return { products: [], total: 0 };
  const result = { products: (data as any) || [], total: count || 0 };
  __set(ck, result);
  return result;
};

export type CarouselItem = {
  id: string;
  product_id: string | null;
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
  product?: Product | null;
};

export const fetchCarouselItemsPublic = async (): Promise<CarouselItem[]> => {
  const ck = "carousel:public";
  const cached = __get(ck);
  if (cached) return cached as CarouselItem[];
  const selectClause = `id,product_id,title,subtitle,description,image_url,link_url,button_text,sort_order,is_active,start_date,end_date,product:products(id,name,price,promotional_price,images:imagens_do_produto(id,url,is_primary,sort_order))`;
  const res = await supabase
    .from("itens_do_carrossel")
    .select(selectClause)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (res.error) return [];
  const rows = (res.data || []) as any[];
  return rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    image_url: r.image_url,
    link_url: r.link_url,
    button_text: r.button_text,
    sort_order: r.sort_order,
    is_active: r.is_active,
    start_date: r.start_date,
    end_date: r.end_date,
    product: r.product || null,
  }));
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const attempts: string[] = [
    `id,name,description,price,promotional_price,material,stock,is_active,is_new,is_featured,sizes,category:categories(id,name,slug,description),collection:coleções(id,name,slug,description),images:imagens_do_produto(id,url,alt_text,is_primary,sort_order)`,
    `id,name,description,price,promotional_price,material,stock,is_active,is_new,is_featured,sizes,category:categories(id,name,slug,description),collection:coleções(id,name,slug,description),images:product_images(id,url,alt_text,is_primary,sort_order)`,
    `id,name,description,price,promotional_price,material,stock,is_active,is_new,is_featured,sizes,category:categories(id,name,slug,description),collection:collections(id,name,slug,description),images:product_images(id,url,alt_text,is_primary,sort_order)`,
    `id,name,description,price,promotional_price,material,stock,is_active,is_new,is_featured,sizes,category:categories(id,name,slug,description)`
  ];

  for (const selectClause of attempts) {
    const { data, error } = await supabase.from("products").select(selectClause).eq("id", id).single();
    if (!error) return (data as any) as Product;
  }

  return null;
};
