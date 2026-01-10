import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/product/ProductCard";
import { fetchProducts } from "@/services/publicData";

interface CollectionInfo {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price?: number | null;
  description?: string | null;
  is_new?: boolean | null;
  category?: { id: string; name: string; slug: string } | null;
  images?: { url: string; is_primary?: boolean | null }[] | null;
}

const CollectionProductsCarousel = ({ collection }: { collection: CollectionInfo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { products } = await fetchProducts({ page: 1, limit: 10, collection: collection.id });
        setProducts(Array.isArray(products) ? products : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [collection.id]);

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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

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
  }, [isHovered, isVisible, maxIndex]);

  if (loading) {
    return (
      <section className="py-8">
        <div className="container">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h3 className="font-serif text-2xl text-foreground">{collection.name}</h3>
            </div>
          </div>
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted">Carregando produtos...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-8" ref={sectionRef}>
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h3 className="font-serif text-2xl text-foreground">{collection.name}</h3>
          </div>
          <Link to={`/categoria/${collection.slug}`} className="text-primary hover:underline">Ver coleção</Link>
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
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 px-2" style={{ width: `${100 / itemsPerView}%` }}>
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
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextSlide}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="hidden md:flex items-center justify-center gap-2">
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
      </div>
    </section>
  );
};

export default CollectionProductsCarousel;
