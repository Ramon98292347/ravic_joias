import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBar from "@/components/layout/MobileBar";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

const Institucional = () => {
  return (
    <>
      <Helmet>
        <title>Institucional | Ravic Joias</title>
        <meta name="description" content="Informações institucionais: gravação a laser, garantias e trocas." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <section className="bg-secondary py-12 md:py-20">
            <div className="container text-center">
              <h1 className="text-3xl md:text-5xl font-serif text-foreground mb-4">Institucional</h1>
              <p className="text-muted max-w-2xl mx-auto">Políticas e serviços da loja</p>
            </div>
          </section>

          <section className="py-12 md:py-20">
            <div className="container max-w-4xl">
              <div className="prose prose-lg mx-auto text-muted">
                <h2 className="text-2xl font-serif text-foreground mb-4">Gravação a Laser</h2>
                <p>Gravação a laser precisa e duradoura.</p>
                <p>Gravação gratuita para alianças compradas na loja.</p>
                <p>Para alianças não compradas na loja: R$60,00 o par.</p>
                <p>Prazo de execução: de 10 minutos a 1 dia útil.</p>
                <p>Possibilidade de gravação de nomes, datas ou mensagens especiais.</p>

                <h2 className="text-2xl font-serif text-foreground mt-12 mb-4">Garantia</h2>
                <p>Alianças de Ouro 18k possuem garantia eterna do teor do ouro.</p>
                <p>Alianças de Prata 925 possuem garantia eterna do teor da prata.</p>
                <p>Pedrinhas não possuem garantia contra quebras ou pedras soltas.</p>
                <p>A garantia não cobre perdas ou quebras da peça.</p>
                <p>Alianças de moda não possuem garantia, podendo escurecer com o tempo.</p>

                <h2 className="text-2xl font-serif text-foreground mt-12 mb-4">Trocas</h2>
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

export default Institucional;
