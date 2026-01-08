import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { cartService, CartItem } from "@/services/cart";

const Carrinho = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await cartService.listItems();
      setItems(data);
      setLoading(false);
    };
    load();
  }, []);

  const subtotal = items.reduce((sum, it) => sum + (it.total_price || 0), 0);

  const updateQty = async (id: string, qty: number) => {
    await cartService.updateQuantity(id, qty);
    const data = await cartService.listItems();
    setItems(data);
  };

  const remove = async (id: string) => {
    await cartService.removeItem(id);
    const data = await cartService.listItems();
    setItems(data);
  };

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
          <h1 className="text-3xl font-serif">Carrinho de Compras</h1>
          <div></div> {/* Espaço vazio para centralizar o título */}
        </div>
        {loading ? (
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted animate-pulse" />
            <p className="text-muted">Carregando...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted" />
            <p className="text-muted mb-8">Seu carrinho está vazio no momento.</p>
            <div className="bg-secondary/30 rounded-lg p-6">
              <p className="text-sm text-muted mb-4">Adicione produtos ao carrinho para visualizá-los aqui.</p>
              <Link to="/">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Continuar Comprando
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-4 border rounded-lg p-4">
                  <img
                    src={it.product?.images?.find(img => img?.is_primary)?.url || it.product?.images?.[0]?.url || "/placeholder.svg"}
                    alt={it.product?.name || "Produto"}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{it.product?.name || 'Produto'}</p>
                    <p className="text-sm text-muted">{it.customization?.size ? `Tamanho: ${it.customization.size}` : ''}</p>
                    <p className="text-sm">R$ {it.unit_price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQty(it.id, Math.max(1, it.quantity - 1))} className="h-8 w-8 border rounded">-</button>
                    <span className="w-10 text-center">{it.quantity}</span>
                    <button onClick={() => updateQty(it.id, it.quantity + 1)} className="h-8 w-8 border rounded">+</button>
                  </div>
                  <div className="w-24 text-right font-medium">R$ {it.total_price.toFixed(2)}</div>
                  <button onClick={() => remove(it.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-muted">Subtotal</p>
              <p className="text-xl font-semibold">R$ {subtotal.toFixed(2)}</p>
            </div>
            <div className="flex gap-3">
              <Link to="/">
                <Button variant="outline" className="flex-1">Continuar Comprando</Button>
              </Link>
              <Link to="/finalizar" className="flex-1">
                <Button className="w-full">
                  Finalizar
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Carrinho;
