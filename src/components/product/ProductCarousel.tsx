import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { fetchCarouselItemsPublic, fetchProducts } from "@/services/publicData";

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price?: number | null;
  description?: string | null;
  is_new?: boolean | null;
  category?: { id: string; name: string; slug: string } | null;
  collection?: { id: string; name: string; slug: string } | null;
  images?: { url: string; is_primary?: boolean | null }[] | null;
}

const ProductCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const items = await fetchCarouselItemsPublic();
        const fromCarousel = items.map((it) => it.product).filter(Boolean) as Product[];

        let next: Product[] = Array.isArray(fromCarousel) ? fromCarousel : [];

        if (next.length === 0) {
          const { products: featured } = await fetchProducts({ page: 1, limit: 10, featured: true });
          next = Array.isArray(featured) ? (featured as Product[]) : [];
        }

        if (next.length === 0) {
          const { products: isNew } = await fetchProducts({ page: 1, limit: 10, isNew: true });
          next = Array.isArray(isNew) ? (isNew as Product[]) : [];
        }

        if (!cancelled) {
          setProducts(next);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const maxIndex = Math.max(0, products.length - Math.floor(itemsPerView));
    if (currentIndex > maxIndex) {
      setCurrentIndex(0);
    }
  }, [currentIndex, itemsPerView, products.length]);

  // Atualiza quantidade de itens por view baseado no tamanho da tela
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) setItemsPerView(1.5);
      else if (window.innerWidth < 768) setItemsPerView(2);
      else if (window.innerWidth < 1024) setItemsPerView(3);
      else setItemsPerView(4);
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const maxIndex = Math.max(0, products.length - Math.floor(itemsPerView));

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [isHovered, nextSlide]);

  if (loading) {
    return (
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary text-sm uppercase tracking-wider mb-2">Exclusividade</p>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground">Novidades da Loja</h2>
            </div>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted">Carregando produtos...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-primary text-sm uppercase tracking-wider mb-2">Exclusividade</p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">Novidades da Loja</h2>
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

        {/* Carousel */}
        <div
          className="overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / itemsPerView}%` }}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.promotional_price ?? undefined}
                  image={
                    product.images?.find((img) => img?.is_primary)?.url ||
                    product.images?.[0]?.url ||
                    "/placeholder.svg"
                  }
                  category={product.category?.name || "Sem categoria"}
                  isNew={Boolean(product.is_new)}
                  isBestseller={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
