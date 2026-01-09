import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className = "", 
  fallback = "/placeholder.svg" 
}: OptimizedImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  console.log('🖼️ OptimizedImage montado:', { src, alt, fallback });

  const handleError = () => {
    console.log('❌ Erro ao carregar imagem:', src, '-> usando fallback:', fallback);
    if (!hasError) {
      setImgSrc(fallback);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    console.log('✅ Imagem carregada com sucesso:', src);
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
};

export default OptimizedImage;