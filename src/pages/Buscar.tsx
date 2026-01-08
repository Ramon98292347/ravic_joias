import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import ProductCard from "@/components/product/ProductCard";
import { getApiBaseUrl } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number;
  images?: Array<{
    id: string;
    url: string;
    alt_text?: string;
    is_primary?: boolean;
  }>;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

const Buscar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!searchTerm.trim()) {
      setProducts([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const baseUrl = getApiBaseUrl();
      console.log("Buscando produtos por:", searchTerm);
      
      const res = await fetch(`${baseUrl}/api/public/products?search=${encodeURIComponent(searchTerm)}&limit=20`);
      console.log("Resposta da busca:", res.status, res.statusText);
      
      if (!res.ok) throw new Error(`Erro na busca: ${res.status}`);
      
      const data = await res.json();
      console.log("Produtos encontrados:", data.products?.length || 0);
      
      setProducts(Array.isArray(data?.products) ? data.products : []);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Atualizar URL quando o termo mudar
  useEffect(() => {
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm });
    } else if (hasSearched) {
      setSearchParams({});
    }
  }, [searchTerm, hasSearched, setSearchParams]);

  // Buscar automaticamente quando o termo mudar (com debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        setProducts([]);
        setHasSearched(false);
      }
    }, 500); // 500ms de debounce

    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-serif">Buscar Produtos</h1>
          <div></div> {/* Espaço vazio para centralizar o título */}
        </div>
        
        <form onSubmit={handleSearch} className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted h-5 w-5" />
          <Input
            type="text"
            placeholder="Digite o que está procurando..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 w-full"
          />
        </form>

        {/* Resultados da Busca */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Buscando produtos...</p>
          </div>
        )}

        {!loading && hasSearched && (
          <div>
            <div className="mb-6">
              <p className="text-muted">
                {products.length > 0 
                  ? `Encontrados ${products.length} produto${products.length !== 1 ? 's' : ''}`
                  : 'Nenhum produto encontrado'
                }
              </p>
            </div>

            {products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !hasSearched && (
          <div className="text-center">
            <p className="text-muted mb-4">Digite algo na barra de busca acima</p>
            <p className="text-sm text-muted/70">Busque por joias, relógios, canetas e mais</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Buscar;
