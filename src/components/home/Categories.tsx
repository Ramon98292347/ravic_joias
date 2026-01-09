import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OptimizedImage from "@/components/OptimizedImage";
import { fetchCollections } from "@/services/publicData";
import { supabase } from "@/lib/supabase";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string | null;
  banner_url?: string | null;
}

const Categories = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchCollections();
        let rows = Array.isArray(data) ? data : [];
        if (!rows || rows.length === 0) {
          const { data: prods } = await supabase
            .from("products")
            .select(
              "id,name,category:categories(slug,name),images:imagens_do_produto(url,is_primary,sort_order)"
            )
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .range(0, 9);
          const list: any[] = (prods as any[]) || [];
          rows = list.slice(0, 5).map((p) => ({
            id: p.id,
            name: p.category?.name || p.name,
            slug: p.category?.slug || "colecao",
            description: p.category?.name || "",
            image_url:
              p.images?.find((img: any) => img?.is_primary)?.url ||
              p.images?.[0]?.url ||
              null,
            banner_url: null,
          }));
        }
        setCollections(rows);
      } catch {
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-secondary/30">
      <div className="container px-4 sm:px-6">
        <div className="text-center mb-8 xs:mb-10 sm:mb-12">
          <p className="text-primary text-xs xs:text-sm uppercase tracking-wider mb-1 xs:mb-2">Explore</p>
          <h2 className="font-serif text-2xl xs:text-3xl md:text-4xl text-foreground">Nossas Coleções</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 xs:gap-4 md:gap-6">
          {loading &&
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="category-card aspect-[3/4] bg-secondary/40 animate-pulse" />
            ))}

          {!loading &&
            collections.slice(0, 5).map((collection) => (
              <Link
                key={collection.id}
                to={`/categoria/${collection.slug}`}
                className="category-card group aspect-[3/4]"
              >
                <OptimizedImage
                  src={collection.image_url || collection.banner_url || "/placeholder.svg"}
                  alt={collection.name}
                  className="w-full h-full object-cover img-zoom"
                />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-end p-3 xs:p-4 md:p-6">
                  <h3 className="font-serif text-lg xs:text-xl md:text-2xl text-foreground mb-0.5 xs:mb-1 group-hover:text-primary transition-colors">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="text-[10px] xs:text-xs text-muted">{collection.description}</p>
                  )}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
