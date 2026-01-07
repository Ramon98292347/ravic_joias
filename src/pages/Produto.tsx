import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, Star, Truck, Shield, Package } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBar from "@/components/layout/MobileBar";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import OptimizedImage from "@/components/OptimizedImage";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  material?: string;
  stock: number;
  is_active: boolean;
  is_new: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  categories?: {
    name: string;
    slug: string;
  };
  collections?: {
    name: string;
    slug: string;
  };
  product_images?: Array<{
    id: string;
    url: string;
    alt_text: string;
    is_primary: boolean;
    sort_order: number;
  }>;
}

const Produto = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/products/${id}`);
        if (!response.ok) {
          throw new Error('Produto não encontrado');
        }
        const data = await response.json();
        setProduct(data.product);
        
        // Set first image as selected if available
        if (data.product.product_images && data.product.product_images.length > 0) {
          const primaryImage = data.product.product_images.find((img: any) => img.is_primary);
          setSelectedImage(primaryImage ? data.product.product_images.indexOf(primaryImage) : 0);
        }
      } catch (error) {
        console.error('Erro ao buscar produto:', error);
        // Redirect to 404 or show error message
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const calculateDiscount = () => {
    if (product?.original_price && product.price < product.original_price) {
      return Math.round(((product.original_price - product.price) / product.original_price) * 100);
    }
    return 0;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Add to cart logic here
    console.log('Adicionando ao carrinho:', {
      product: product.id,
      quantity,
      size: selectedSize
    });
    
    // Show success message
    alert('Produto adicionado ao carrinho!');
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

  const discount = calculateDiscount();
  const images = product.product_images || [];

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
          {product.categories && (
            <>
              <Link to={`/categoria/${product.categories.slug}`} className="hover:text-foreground">
                {product.categories.name}
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
              {product.collections && (
                <p className="text-sm text-primary uppercase tracking-wider mb-2">
                  {product.collections.name}
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
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-xl text-muted line-through">
                    {formatPrice(product.original_price)}
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
              <label className="text-sm font-medium text-foreground">Tamanho</label>
              <div className="flex flex-wrap gap-2">
                {['PP', 'P', 'M', 'G', 'GG'].map((size) => (
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
                ))}
              </div>
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
                disabled={product.stock === 0}
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