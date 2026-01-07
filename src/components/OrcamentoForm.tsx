import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Send, Phone, Mail, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface OrcamentoFormProps {
  cartItems?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  cartTotal?: number;
  onSuccess?: () => void;
}

const OrcamentoForm = ({ cartItems = [], cartTotal = 0, onSuccess }: OrcamentoFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_message: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/webhook/orcamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          cart_items: cartItems,
          cart_total: cartTotal
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Sua solicitação de orçamento foi enviada. Entraremos em contato em breve.",
        });
        
        // Limpa o formulário
        setFormData({
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          customer_message: ""
        });
        
        // Chama callback de sucesso
        onSuccess?.();
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error || "Erro ao enviar solicitação",
        });
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao conectar com o servidor",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Solicitar Orçamento
        </CardTitle>
        <CardDescription>
          Preencha seus dados abaixo e entraremos em contato para finalizar seu pedido
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">
                <User className="h-4 w-4 inline mr-1" />
                Nome Completo *
              </Label>
              <Input
                id="customer_name"
                name="customer_name"
                type="text"
                required
                value={formData.customer_name}
                onChange={handleInputChange}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer_email">
                <Mail className="h-4 w-4 inline mr-1" />
                Email *
              </Label>
              <Input
                id="customer_email"
                name="customer_email"
                type="email"
                required
                value={formData.customer_email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_phone">
              <Phone className="h-4 w-4 inline mr-1" />
              Telefone (WhatsApp)
            </Label>
            <Input
              id="customer_phone"
              name="customer_phone"
              type="tel"
              value={formData.customer_phone}
              onChange={handleInputChange}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_message">
              Mensagem
            </Label>
            <Textarea
              id="customer_message"
              name="customer_message"
              value={formData.customer_message}
              onChange={handleInputChange}
              placeholder="Deixe uma mensagem sobre seu pedido (opcional)"
              rows={4}
            />
          </div>

          {cartTotal > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Total do carrinho: <span className="font-semibold text-foreground">R$ {cartTotal.toFixed(2)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {cartItems.length} item(s) no carrinho
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              "Enviando..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Solicitação
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Entraremos em contato em breve via WhatsApp ou email
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrcamentoForm;