import { Instagram } from "lucide-react";
import productRing from "@/assets/product-ring.jpg";
import productNecklace from "@/assets/product-necklace.jpg";
import productWatch from "@/assets/product-watch.jpg";
import productPen from "@/assets/product-pen.jpg";
import productBracelet from "@/assets/product-bracelet.jpg";
import productAliancas from "@/assets/product-aliancas.jpg";

const images = [
  productRing,
  productNecklace,
  productWatch,
  productPen,
  productBracelet,
  productAliancas,
];

const InstagramGallery = () => {
  return (
    <section className="py-16 md:py-20 border-t border-border/50">
      <div className="container">
        <div className="text-center mb-10">
          <a
            href="https://www.instagram.com/ravicjoias?igsh=MTV6MzNveGRjNHRyZQ%3D%3D&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <Instagram className="h-5 w-5" />
            <span className="font-medium">@ravicjoias</span>
          </a>
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-3">
            Siga-nos no Instagram
          </h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
          {images.map((image, index) => (
            <a
              key={index}
              href="https://www.instagram.com/ravicjoias?igsh=MTV6MzNveGRjNHRyZQ%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden"
            >
              <img
                src={image}
                alt={`Instagram post ${index + 1}`}
                className="w-full h-full object-cover img-zoom"
              />
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Instagram className="h-8 w-8 text-foreground" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramGallery;
