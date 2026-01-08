import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MobileBar from "@/components/layout/MobileBar";
import ProductCard from "@/components/product/ProductCard";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { fetchCategories, fetchCollections, fetchProducts } from "@/services/publicData";

interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface PublicCollection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface ProductImage {
  url: string;
  is_primary?: boolean | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price?: number | null;
  description?: string | null;
  is_new?: boolean | null;
  category?: { id: string; name: string; slug: string } | null;
  collection?: { id: string; name: string; slug: string } | null;
  images?: ProductImage[] | null;
}

type Source =
  | { kind: "category"; id: string; name: string; description: string }
  | { kind: "collection"; id: string; name: string; description: string };

const getApiBase = () => getApiBaseUrl();

const Categoria = () => {
  const { slug } = useParams<{ slug: string }>();
  const baseUrl = useMemo(() => "", []);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<Source | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!slug) return;
      setLoading(true);
      setNotFound(false);
      setSource(null);
      setProducts([]);

      try {
        const categories: PublicCategory[] = await fetchCategories();
        const collections: PublicCollection[] = await fetchCollections();

        const matchedCategory = categories.find((c) => c?.slug === slug);
        const matchedCollection = matchedCategory ? null : collections.find((c) => c?.slug === slug);

        if (!matchedCategory && !matchedCollection) {
          setNotFound(true);
          return;
        }

        const nextSource: Source = matchedCategory
          ? {
              kind: "category",
              id: matchedCategory.id,
              name: matchedCategory.name || "",
              description: matchedCategory.description || "",
            }
          : {
              kind: "collection",
              id: matchedCollection!.id,
              name: matchedCollection!.name || "",
              description: matchedCollection!.description || "",
            };

        setSource(nextSource);

        const queryParam = nextSource.kind === "category" ? { category: nextSource.id } : { collection: nextSource.id };
        const { products } = await fetchProducts({ page: 1, limit: 200, ...queryParam });
        setProducts(Array.isArray(products) ? products : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [baseUrl, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Carregando produtos...</p>
          </div>
        </main>
        <Footer />
        <MobileBar />
        <WhatsAppButton />
      </div>
    );
  }

  if (notFound || !source) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-serif text-foreground mb-4">
              Categoria/Coleção não encontrada
            </h1>
            <Link to="/" className="text-primary hover:underline">
              Voltar para a home
            </Link>
          </div>
        </main>
        <Footer />
        <MobileBar />
        <WhatsAppButton />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{source.name} | Ravic Joias</title>
        <meta name="description" content={source.description} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-secondary py-12 md:py-20">
            <div className="container px-4 sm:px-6">
              <div className="text-center mb-8 xs:mb-10 sm:mb-12">
                <h1 className="font-serif text-3xl xs:text-4xl md:text-5xl text-foreground mb-3 xs:mb-4">
                  {source.name}
                </h1>
                <p className="text-base xs:text-lg text-muted max-w-2xl mx-auto">
                  {source.description}
                </p>
              </div>
            </div>
          </section>

          {/* Products Grid */}
          <section className="py-12 md:py-20">
            <div className="container px-4 sm:px-6">
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
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
                ))}
              </div>

              {products.length === 0 && (
                <p className="text-center text-muted py-12">
                  Nenhum produto encontrado nesta categoria.
                </p>
              )}
            </div>
          </section>
        </main>

        <Footer />
        <MobileBar />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default Categoria;
