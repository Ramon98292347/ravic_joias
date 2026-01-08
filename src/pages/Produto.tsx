import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, Star, Truck, Shield, Package } from "lucide-react";
import { cartService } from "@/services/cart";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBar from "@/components/layout/MobileBar";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import OptimizedImage from "@/components/OptimizedImage";
import { fetchProductById, type Product as PublicProduct } from "@/services/publicData";

type Product = PublicProduct & { is_bestseller?: boolean };

const Produto = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const data = await fetchProductById(id);
        if (!data) throw new Error("Produto não encontrado");
        setProduct(data as Product);
        const imgs = data.images || [];
        if (imgs.length > 0) {
          const primary = imgs.find((i) => i?.is_primary) || imgs[0];
          setSelectedImage(primary ? imgs.indexOf(primary) : 0);
        }
      } catch (e) {
        console.error("Erro ao buscar produto:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const { displayPrice, originalPrice, discount } = useMemo(() => {
    if (!product) return { displayPrice: 0, originalPrice: undefined as number | undefined, discount: 0 };
    const promo = product.promotional_price ?? null;
    if (promo && promo < product.price) {
      const pct = Math.round(((product.price - promo) / product.price) * 100);
      return { displayPrice: promo, originalPrice: product.price, discount: pct };
    }
    return { displayPrice: product.price, originalPrice: undefined, discount: 0 };
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return;
    const hasSizes =
      (product as any).sizes && Array.isArray((product as any).sizes) && (product as any).sizes.length > 0;
    if (hasSizes && !selectedSize) {
      alert("Selecione um tamanho antes de adicionar ao carrinho.");
      return;
    }
    const unit = product.price;
    const customization = selectedSize ? { size: selectedSize } : null;
    try {
      await cartService.addItem(product.id, quantity, unit, customization || undefined);
      navigate("/carrinho");
    } catch (e) {
      alert('Erro ao adicionar ao carrinho');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: `Confira este produto: ${product?.name}`,
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const nextImage = () => {
    if (product?.product_images) {
      setSelectedImage((prev) => (prev + 1) % product.product_images.length);
    }
  };

  const prevImage = () => {
    if (product?.product_images) {
      setSelectedImage((prev) => (prev - 1 + product.product_images!.length) % product.product_images!.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-secondary/30 animate-pulse rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-secondary/30 animate-pulse rounded w-3/4"></div>
              <div className="h-6 bg-secondary/30 animate-pulse rounded w-1/4"></div>
              <div className="h-4 bg-secondary/30 animate-pulse rounded w-full"></div>
              <div className="h-4 bg-secondary/30 animate-pulse rounded w-full"></div>
              <div className="h-4 bg-secondary/30 animate-pulse rounded w-3/4"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-serif mb-4">Produto não encontrado</h1>
          <p className="text-muted mb-8">Desculpe, o produto que você está procurando não está disponível.</p>
          <Link to="/" className="text-primary hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product?.images || [];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{product.name} | RAVIC Joias</title>
        <meta name="description" content={product.description?.substring(0, 160)} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description?.substring(0, 160)} />
        {images[selectedImage] && <meta property="og:image" content={images[selectedImage].url} />}
      </Helmet>

      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted mb-8">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/categoria/${product.category.slug}`} className="hover:text-foreground">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-secondary/30 rounded-lg overflow-hidden">
              {images.length > 0 ? (
                <>
                  <OptimizedImage
                    src={images[selectedImage]?.url}
                    alt={images[selectedImage]?.alt_text || product.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  <Package className="h-16 w-16" />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-primary' : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <OptimizedImage
                      src={image.url}
                      alt={image.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              {product.collection && (
                <p className="text-sm text-primary uppercase tracking-wider mb-2">
                  {product.collection.name}
                </p>
              )}
              <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-4">
                {product.name}
              </h1>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {product.is_new && (
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs uppercase tracking-wider">
                    Novo
                  </span>
                )}
                {product.is_bestseller && (
                  <span className="px-3 py-1 bg-background text-foreground text-xs uppercase tracking-wider">
                    Mais Vendido
                  </span>
                )}
                {discount > 0 && (
                  <span className="px-3 py-1 bg-destructive text-destructive-foreground text-xs uppercase tracking-wider">
                    -{discount}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-medium text-foreground">
                  {formatPrice(displayPrice)}
                </span>
                {originalPrice && originalPrice > displayPrice && (
                  <span className="text-xl text-muted line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted">
                ou 10x de {formatPrice(product.price / 10)} sem juros
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Material */}
            {product.material && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">Material:</span>
                <span className="text-foreground font-medium">{product.material}</span>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Estoque:</span>
              <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.stock > 0 ? `${product.stock} unidades disponíveis` : 'Produto indisponível'}
              </span>
            </div>

            {/* Size Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Tamanho (obrigatório)</label>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const sizes = (product as any).sizes && Array.isArray((product as any).sizes)
                    ? (product as any).sizes as number[]
                    : Array.from({ length: 28 }, (_, i) => i + 5);
                  return sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        selectedSize === size
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {size}
                    </button>
                  ));
                })()}
              </div>
              {!selectedSize && (
                <p className="text-xs text-destructive">Selecione um tamanho para continuar.</p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Quantidade</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="h-10 w-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={
                  product.stock === 0 ||
                  (((product as any).sizes && Array.isArray((product as any).sizes) && (product as any).sizes.length > 0) &&
                    !selectedSize)
                }
                className="w-full py-4 bg-primary text-primary-foreground font-medium uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <ShoppingCart className="h-5 w-5" />
                Adicionar ao Carrinho
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex-1 py-3 border font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                    isWishlisted
                      ? 'border-destructive text-destructive hover:bg-destructive/10'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  {isWishlisted ? 'Remover' : 'Favoritar'}
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex-1 py-3 border border-border font-medium uppercase tracking-wider hover:border-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-border">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted">Frete Grátis</p>
                <p className="text-xs text-muted">acima de R$ 500</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted">Garantia</p>
                <p className="text-xs text-muted">de 1 ano</p>
              </div>
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted">Embalagem</p>
                <p className="text-xs text-muted">Especial</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <MobileBar />
      <WhatsAppButton />
    </div>
  );
};

export default Produto;
