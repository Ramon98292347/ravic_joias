import { Helmet } from "react-helmet-async";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBar from "@/components/layout/MobileBar";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Contato = () => {
  return (
    <>
      <Helmet>
        <title>Contato | Ravic Joias</title>
        <meta name="description" content="Entre em contato com a Ravic Joias. Atendimento personalizado via WhatsApp, telefone ou e-mail." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <section className="bg-secondary py-12 md:py-20">
            <div className="container text-center">
              <h1 className="text-3xl md:text-5xl font-serif text-foreground mb-4">
                Contato
              </h1>
              <p className="text-muted max-w-2xl mx-auto">
                Estamos à disposição para atendê-lo
              </p>
            </div>
          </section>

          <section className="py-12 md:py-20">
            <div className="container">
              <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                {/* Contact Info */}
                <div>
                  <h2 className="text-2xl font-serif text-foreground mb-8">Informações</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">Telefone / WhatsApp</h3>
                        <p className="text-muted">(27) 99734-0566</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">E-mail</h3>
                        <p className="text-muted">marketing@ravicjoias.com.br</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">Endereço</h3>
                        <p className="text-muted">
                          Avenida Expedito Garcia, 94
                          <br />
                          Cariacica - Espírito Santo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">Horário de Funcionamento</h3>
                        <p className="text-muted">
                          Seg a Sex: 9h às 18h
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div>
                  <h2 className="text-2xl font-serif text-foreground mb-8">Envie uma mensagem</h2>
                  
                  <form className="space-y-6">
                    <div>
                      <Input
                        type="text"
                        placeholder="Seu nome"
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Seu e-mail"
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <Input
                        type="tel"
                        placeholder="Seu telefone"
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Sua mensagem"
                        rows={5}
                        className="bg-secondary border-border resize-none"
                      />
                    </div>
                    <Button variant="gold" className="w-full">
                      Enviar mensagem
                    </Button>
                  </form>
                </div>
              </div>
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

export default Contato;
