import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cartService, CartItem } from "@/services/cart";
import { checkoutService } from "@/services/checkout";

const Finalizar = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const canSubmit = () =>
    name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    phone.trim().length >= 8 &&
    paymentMethod.trim().length > 0 &&
    items.length > 0 &&
    !saving;

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setSaving(true);
    setError(null);
    try {
      await checkoutService.finalizeOrder({ name, email, phone, paymentMethod });
      navigate("/"); 
    } catch (e: any) {
      setError("Erro ao finalizar pedido. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/carrinho">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-serif">Finalizar Compra</h1>
          <div></div>
        </div>
        <p className="text-muted">Carregando itens...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/carrinho">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-serif">Finalizar Compra</h1>
          <div></div>
        </div>

        {items.length === 0 ? (
          <div className="text-center">
            <p className="text-muted mb-6">Seu carrinho está vazio.</p>
            <Link to="/">
              <Button variant="outline">Voltar para a loja</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-secondary/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Seus dados</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded px-3 py-2 bg-background text-foreground"
                    placeholder="Ex: Maria Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded px-3 py-2 bg-background text-foreground"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border rounded px-3 py-2 bg-background text-foreground"
                    placeholder="(xx) xxxxx-xxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border rounded px-3 py-2 bg-background text-foreground"
                  >
                    <option value="">Selecione uma forma de pagamento</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">Pix</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Resumo do pedido</h2>
              <ul className="space-y-3">
                {items.map((it) => (
                  <li key={it.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          it.product?.images?.find((img) => img?.is_primary)?.url ||
                          it.product?.images?.[0]?.url ||
                          "/placeholder.svg"
                        }
                        className="w-10 h-10 rounded object-cover"
                      />
                      <span className="text-sm">{it.product?.name || "Produto"}</span>
                      {it.customization?.size && (
                        <span className="text-xs text-muted">• Tam {it.customization.size}</span>
                      )}
                    </div>
                    <div className="text-sm">
                      {it.quantity} x R$ {it.unit_price.toFixed(2)} ={" "}
                      <span className="font-medium">R$ {it.total_price.toFixed(2)}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t mt-4 pt-4">
                <p className="text-muted">Total</p>
                <p className="text-xl font-semibold">R$ {subtotal.toFixed(2)}</p>
              </div>
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <Button onClick={handleSubmit} disabled={!canSubmit()}>
              {saving ? "Finalizando..." : "Finalizar Pedido"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Finalizar;
