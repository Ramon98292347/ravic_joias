import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { fetchCollections } from "@/services/publicData";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string | null;
  banner_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

const Colecoes = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCollections();
        setCollections(Array.isArray(data) ? data : []);
      } catch {
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-serif">Coleções</h1>
          <div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-secondary/30 rounded-lg p-6 text-center animate-pulse">
              <div className="h-6 bg-secondary/50 rounded mb-2"></div>
              <div className="h-4 bg-secondary/50 rounded mb-4"></div>
              <div className="h-10 bg-secondary/50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <Link to="/">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-serif">Coleções</h1>
        <div></div>
      </div>
      {collections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted">Nenhuma coleção encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.slug} className="bg-secondary/30 rounded-lg p-6 text-center hover:bg-secondary/50 transition-colors">
              <h3 className="text-xl font-semibold mb-2">{collection.name}</h3>
              <p className="text-muted mb-4">{collection.description || "Sem descrição"}</p>
              <Link to={`/categoria/${collection.slug}`}>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Ver Produtos
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Colecoes;
