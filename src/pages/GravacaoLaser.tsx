import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBar from "@/components/layout/MobileBar";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

const GravacaoLaser = () => {
  return (
    <>
      <Helmet>
        <title>Gravação a Laser | Ravic Joias</title>
        <meta name="description" content="Gravação a laser precisa e duradoura para alianças." />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <section className="bg-secondary py-12 md:py-20">
            <div className="container text-center">
              <h1 className="text-3xl md:text-5xl font-serif text-foreground mb-4">Gravação a Laser</h1>
              <p className="text-muted max-w-2xl mx-auto">Serviço de gravação precisa e duradoura</p>
            </div>
          </section>
          <section className="py-12 md:py-20">
            <div className="container max-w-4xl">
              <div className="prose prose-lg mx-auto text-muted">
                <p>Gravação a laser precisa e duradoura.</p>
                <p>Gravação gratuita para alianças compradas na loja.</p>
                <p>Para alianças não compradas na loja: R$60,00 o par.</p>
                <p>Prazo de execução: de 10 minutos a 1 dia útil.</p>
                <p>Possibilidade de gravação de nomes, datas ou mensagens especiais.</p>
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

export default GravacaoLaser;
