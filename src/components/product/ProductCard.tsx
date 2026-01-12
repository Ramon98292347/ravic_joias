import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { cartService } from "@/services/cart";
import OptimizedImage from "@/components/OptimizedImage";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  isBestseller?: boolean;
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  category,
  isNew,
  isBestseller,
}: ProductCardProps) => {
  const navigate = useNavigate();

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await cartService.addItem(id, 1, price);
      navigate("/carrinho");
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      alert("Erro ao adicionar ao carrinho. Tente novamente.");
    }
  };

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <Link to={`/produto/${id}`} className="product-card group block">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30">
        <OptimizedImage
          src={image}
          alt={name}
          className="w-full h-full object-cover img-zoom"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <span className="px-2 py-1 bg-primary text-primary-foreground text-[10px] font-medium uppercase tracking-wider">
              Novo
            </span>
          )}
          {isBestseller && (
            <span className="px-2 py-1 bg-background text-foreground text-[10px] font-medium uppercase tracking-wider">
              Mais Vendido
            </span>
          )}
          {discount > 0 && (
            <span className="px-2 py-1 bg-destructive text-destructive-foreground text-[10px] font-medium uppercase tracking-wider">
              -{discount}%
            </span>
          )}
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleAddToCart}
          className="absolute top-2 xs:top-3 sm:top-4 right-2 xs:right-3 sm:right-4 z-10 bg-background/95 backdrop-blur-sm text-foreground p-1.5 xs:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
          aria-label="Adicionar ao carrinho"
        >
          <ShoppingBag className="h-3 w-3 xs:h-4 xs:w-4" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 xs:p-4">
        <p className="text-[9px] xs:text-[10px] uppercase tracking-wider text-primary mb-0.5 xs:mb-1">{category}</p>
        <h3 className="font-serif text-xs xs:text-sm md:text-base text-foreground mb-1 xs:mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <div className="flex items-baseline gap-1 xs:gap-2">
          <span className="text-sm xs:text-base font-medium text-foreground">{formatPrice(price)}</span>
          {originalPrice && (
            <span className="text-xs xs:text-sm text-muted line-through">{formatPrice(originalPrice)}</span>
          )}
        </div>
        <p className="text-[9px] xs:text-[10px] text-muted mt-0.5 xs:mt-1">
          ou 10x de {formatPrice(price / 10)} sem juros
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
