import { useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { ArrowRight, Phone, Mail } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{0,4})(\d{0,4})/, '($1) $2-$3').trim();
    } else {
      return cleaned.replace(/(\d{2})(\d{1})(\d{0,4})(\d{0,4})/, '($1) $2 $3-$4').trim();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const base = getApiBaseUrl();
      const response = await fetch(`${base}/api/webhook/contato`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          telefone: telefone.replace(/\D/g, ''),
          origem: 'newsletter',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar dados');
      }

      alert('Cadastro realizado com sucesso! Entraremos em contato em breve.');
      setEmail('');
      setTelefone('');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar cadastro. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-20">
      <div className="container px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-primary text-sm uppercase tracking-wider mb-2">Fique por dentro</p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Receba Novidades em Primeira Mão
          </h2>
          <p className="text-muted mb-8">
            Cadastre-se para receber ofertas exclusivas, lançamentos e dicas de estilo.
          </p>
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                placeholder="Seu WhatsApp (opcional)"
                className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                maxLength={16}
              />
            </div>
            <button 
              type="submit" 
              className="w-full btn-gold inline-flex items-center justify-center gap-2 whitespace-nowrap py-3"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Receber Novidades'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="text-xs text-muted mt-4">
            Ao se inscrever, você concorda com nossa{" "}
            <a href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
