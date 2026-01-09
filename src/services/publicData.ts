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
  console.log('🔍 fetchProducts iniciado com params:', params);
  const { page = 1, limit = 20, category, collection, search, featured, isNew } = params;
  const offset = (page - 1) * limit;

  const tryQuery = async (selectClause: string) => {
    console.log('📋 Tentando query com select:', selectClause.substring(0, 100) + '...');
    let query = supabase
      .from("products")
      .select(selectClause, { count: "exact" })
      .eq("is_active", true)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (category && category !== "all") query = query.eq("category_id", category);
    if (collection && collection !== "all") query = query.eq("collection_id", collection);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    if (featured === true) query = query.eq("is_featured", true);
    if (isNew === true) query = query.eq("is_new", true);

    const result = await query;
    console.log('📊 Query resultado - Status:', result.status);
    console.log('📊 Query resultado - Dados:', result.data?.length || 0, 'produtos');
    console.log('📊 Query resultado - Total:', result.count);
    console.log('📊 Query resultado - Erro:', result.error);
    
    return result;
  };

  const attempts: string[] = [
    `*,category:categories(id,name,slug,description),collection:coleções(id,name,slug,description),images:imagens_do_produto(id,url,alt_text,sort_order,is_primary,storage_path,bucket_name)`,
    `*,category:categories(id,name,slug,description),collection:coleções(id,name,slug,description),images:product_images(id,url,alt_text,sort_order,is_primary,storage_path,bucket_name)`,
    `*,category:categories(id,name,slug,description),collection:collections(id,name,slug,description),images:product_images(id,url,alt_text,sort_order,is_primary,storage_path,bucket_name)`,
    `*,category:categories(id,name,slug,description)`
  ];

  for (let i = 0; i < attempts.length; i++) {
    const selectClause = attempts[i];
    console.log(`🔄 Tentativa ${i + 1} de ${attempts.length}`);
    const { data, error, count } = await tryQuery(selectClause);
    if (!error) {
      console.log(`✅ Sucesso na tentativa ${i + 1}!`);
      return { products: (data as any) || [], total: count || 0 };
    } else {
      console.log(`❌ Falha na tentativa ${i + 1}:`, error.message);
    }
  }

  console.log('🏁 fetchProducts finalizado - nenhuma tentativa funcionou');
  return { products: [], total: 0 };
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
  console.log('🔍 fetchCarouselItemsPublic iniciado');
  const attemptSelects: string[] = [
    `id,product_id,title,subtitle,description,image_url,link_url,button_text,sort_order,is_active,start_date,end_date,product:products(id,name,price,promotional_price,images:imagens_do_produto(id,url,is_primary,sort_order))`,
    `id,product_id,title,subtitle,description,image_url,link_url,button_text,sort_order,is_active,start_date,end_date,product:products(id,name,price,promotional_price,images:product_images(id,url,is_primary,sort_order))`,
    `id,product_id,title,subtitle,description,image_url,link_url,button_text,sort_order,is_active,start_date,end_date,product:products(id,name,price,promotional_price)`
  ];

  let data: any[] | null = null;
  for (let i = 0; i < attemptSelects.length; i++) {
    const selectClause = attemptSelects[i];
    console.log(`🔄 Tentativa ${i + 1}:`, selectClause.substring(0, 100) + '...');
    
    try {
      const res = await supabase
        .from("itens_do_carrossel")
        .select(selectClause)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      console.log(`📊 Tentativa ${i + 1} - Status:`, res.status);
      console.log(`📊 Tentativa ${i + 1} - Dados:`, res.data?.length || 0, 'itens');
      console.log(`📊 Tentativa ${i + 1} - Erro:`, res.error);

      if (!res.error) {
        data = (res.data || []) as any[];
        console.log(`✅ Sucesso na tentativa ${i + 1}!`);
        break;
      } else {
        console.log(`❌ Falha na tentativa ${i + 1}:`, res.error.message);
      }
    } catch (error) {
      console.log(`❌ Exceção na tentativa ${i + 1}:`, error);
    }
  }
  
  console.log('🏁 fetchCarouselItemsPublic finalizado, dados:', data?.length || 0);

  if (!data) return [];
  const rows = (data || []) as any[];
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
