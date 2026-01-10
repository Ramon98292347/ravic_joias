import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBar from "@/components/layout/MobileBar";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

const Garantia = () => {
  return (
    <>
      <Helmet>
        <title>Garantia | Ravic Joias</title>
        <meta name="description" content="Informações de garantia das peças Ravic Joias." />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <section className="bg-secondary py-12 md:py-20">
            <div className="container text-center">
              <h1 className="text-3xl md:text-5xl font-serif text-foreground mb-4">Garantia</h1>
              <p className="text-muted max-w-2xl mx-auto">Política de garantia das peças</p>
            </div>
          </section>
          <section className="py-12 md:py-20">
            <div className="container max-w-4xl">
              <div className="prose prose-lg mx-auto text-muted">
                <p>Alianças de Ouro 18k possuem garantia eterna do teor do ouro.</p>
                <p>Alianças de Prata 925 possuem garantia eterna do teor da prata.</p>
                <p>Pedrinhas não possuem garantia contra quebras ou pedras soltas.</p>
                <p>A garantia não cobre perdas ou quebras da peça.</p>
                <p>Alianças de moda não possuem garantia, podendo escurecer com o tempo.</p>
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

export default Garantia;
