import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import OptimizedImage from "@/components/OptimizedImage";
import { supabase } from "@/lib/supabase";

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  url: string;
  is_primary?: boolean | null;
}

interface Product {
  images?: ProductImage[] | null;
}

interface SlideItem {
  image: string;
  slug: string;
  name: string;
}

const CollectionsCarousel = () => {
  const [itemsPerView, setItemsPerView] = useState(2);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<SlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: cols, error: colsErr } = await supabase
          .from("coleções")
          .select("id,name,slug")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
          .range(0, 4);
        if (colsErr || !Array.isArray(cols)) throw colsErr || new Error("Falha coleções");
        const collections: Collection[] = (cols as any[]) as Collection[];

        const perCollection = await Promise.all(
          collections.map(async (c) => {
            const { data: prods } = await supabase
              .from("products")
              .select(
                "id,images:imagens_do_produto(id,url,is_primary,sort_order)"
              )
              .eq("is_active", true)
              .eq("collection_id", c.id)
              .order("created_at", { ascending: false })
              .range(0, 9);
            const products: Product[] = (prods as any[]) || [];
            const images: SlideItem[] = products
              .map((p) => p.images?.find((img) => img?.is_primary)?.url || p.images?.[0]?.url)
              .filter(Boolean)
              .slice(0, 10)
              .map((url) => ({ image: url as string, slug: c.slug, name: c.name }));
            return images;
          })
        );

        setItems(perCollection.flat());
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 768) setItemsPerView(1.5);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(2);
    };
    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const maxIndex = Math.max(0, items.length - Math.floor(itemsPerView));

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (el) {
      const obs = new IntersectionObserver((entries) => {
        setIsVisible(entries[0]?.isIntersecting ?? true);
      }, { threshold: 0.2 });
      obs.observe(el);
      return () => obs.disconnect();
    }
  }, []);

  useEffect(() => {
    if (isHovered || !isVisible) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [isHovered, isVisible, nextSlide]);

  if (loading) {
    return (
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary text-sm uppercase tracking-wider mb-2">Coleções</p>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground">Destaques por Coleção</h2>
            </div>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted">Carregando imagens...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-20" ref={sectionRef}>
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-primary text-sm uppercase tracking-wider mb-2">Coleções</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">Destaques por Coleção</h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
          >
            {items.map((item, idx) => (
              <div key={`${item.slug}-${idx}`} className="flex-shrink-0 px-2" style={{ width: `${100 / itemsPerView}%` }}>
                <Link to={`/categoria/${item.slug}`} className="block group">
                  <div className="aspect-[3/4] relative rounded-md overflow-hidden">
                    <OptimizedImage
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover img-zoom"
                    />
                    <div className="absolute inset-0 z-10 flex items-end p-3">
                      <span className="bg-background/70 px-2 py-1 rounded text-sm group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionsCarousel;
