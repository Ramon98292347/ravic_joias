import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { fetchCarouselItemsPublic, fetchProducts } from "@/services/publicData";
import { supabase } from "@/lib/supabase";

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
  console.log('🎯 ProductCarousel montado!');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega produtos da API
  useEffect(() => {
    const loadProducts = async () => {
      console.log('🔄 Iniciando carregamento de produtos...');
      console.log('📊 Estado inicial - loading:', loading, 'products.length:', products.length);
      
      try {
        console.log('📋 Buscando itens do carrossel...');
        const items = await fetchCarouselItemsPublic();
        console.log('✅ Itens do carrossel:', items);
        console.log('📊 Tipo dos itens:', typeof items, Array.isArray(items));
        
        let next = items.map((it) => it.product).filter(Boolean) as any[];
        console.log('📦 Produtos do carrossel:', next);
        console.log('📊 Tipo dos produtos:', typeof next, Array.isArray(next), 'length:', next.length);
        
        if (!Array.isArray(next) || next.length === 0) {
          console.log('🔄 Tentando buscar produtos em destaque...');
          const { products: alt } = await fetchProducts({ page: 1, limit: 10, featured: true });
          console.log('✅ Produtos em destaque:', alt);
          console.log('📊 Tipo dos produtos em destaque:', typeof alt, Array.isArray(alt));
          next = Array.isArray(alt) ? alt : [];
        }
        
        if (!Array.isArray(next) || next.length === 0) {
          console.log('🔄 Tentando buscar diretamente do Supabase...');
          console.log('🔗 Config Supabase URL:', supabase.supabaseUrl);
          
          const { data: raw, error: supabaseError } = await supabase
            .from("products")
            .select(
              "id,name,price,promotional_price,is_new,category:categories(id,name,slug),images:imagens_do_produto(url,is_primary,sort_order)"
            )
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .range(0, 9);
          
          console.log('✅ Dados do Supabase:', raw);
          console.log('📊 Tipo dos dados:', typeof raw, Array.isArray(raw));
          console.log('❌ Erro do Supabase:', supabaseError);
          
          if (supabaseError) {
            console.error('❌ Detalhes do erro Supabase:', supabaseError.message, supabaseError.code);
          }
          
          next = (raw as any[]) || [];
          console.log('📦 Produtos após Supabase:', next);
        }
        
        // Log detalhado dos produtos encontrados
        console.log('🏁 Produtos finais:', next);
        console.log('📊 Resumo final:', {
          total: next.length,
          temImagens: next.some(p => p.images?.length > 0),
          exemplos: next.slice(0, 2).map(p => ({
            id: p.id,
            name: p.name,
            images: p.images?.length || 0,
            primeiraImagem: p.images?.[0]?.url || 'sem imagem'
          }))
        });
        
        setProducts(next as any[]);
      } catch (error) {
        console.error('❌ Erro no carregamento:', error);
        console.error('❌ Stack do erro:', error instanceof Error ? error.stack : 'sem stack');
        
        try {
          console.log('🔄 Tentando fallback com produtos novos...');
          const { products: alt } = await fetchProducts({ page: 1, limit: 10, isNew: true });
          console.log('✅ Produtos novos:', alt);
          setProducts(Array.isArray(alt) ? alt : []);
        } catch (fallbackError) {
          console.error('❌ Erro no fallback:', fallbackError);
          setProducts([]);
        }
      } finally {
        setLoading(false);
        console.log('✅ Carregamento finalizado - loading:', false, 'products.length:', products.length);
      }
    };
    
    console.log('🚀 Iniciando loadProducts...');
    loadProducts();
  }, []);

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
