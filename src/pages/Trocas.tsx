import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBar from "@/components/layout/MobileBar";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

const Trocas = () => {
  return (
    <>
      <Helmet>
        <title>Trocas | Ravic Joias</title>
        <meta name="description" content="Política de trocas das peças Ravic Joias." />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <section className="bg-secondary py-12 md:py-20">
            <div className="container text-center">
              <h1 className="text-3xl md:text-5xl font-serif text-foreground mb-4">Trocas</h1>
              <p className="text-muted max-w-2xl mx-auto">Regras de trocas e prazos</p>
            </div>
          </section>
          <section className="py-12 md:py-20">
            <div className="container max-w-4xl">
              <div className="prose prose-lg mx-auto text-muted">
                <p>Prazo para troca: 7 dias corridos, podendo ser estendido para 15 dias corridos, desde que solicitado previamente.</p>
                <p>As alianças devem ser apresentadas na caixinha original, com carimbo interno de identificação.</p>
                <p>A troca só será realizada se a peça estiver em perfeito estado e sem gravações internas.</p>
                <p>Não realizamos trocas de:</p>
                <ul>
                  <li>Alianças com pedras, gravações ou desenhos externos;</li>
                  <li>Solitários ou aparadores com pedras coloridas;</li>
                  <li>Peças que tenham sido ajustadas.</li>
                </ul>
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

export default Trocas;
