import { useEffect, useMemo, useRef, useState } from "react";

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
  const debugEnabled = !!import.meta.env.DEV;
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const normalizedSrc = useMemo(() => {
    if (typeof src !== "string") return "";
    return src.trim().replace(/^`+|`+$/g, "");
  }, [src]);
  const [imgSrc, setImgSrc] = useState(normalizedSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setImgSrc(normalizedSrc);
  }, [normalizedSrc]);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    if (shouldLoad) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
            break;
          }
        }
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad]);

  const handleError = () => {
    if (debugEnabled) console.warn("[OptimizedImage] erro ao carregar, usando fallback", { src: normalizedSrc });
    if (!hasError) {
      setImgSrc(fallback);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    if (debugEnabled) console.debug("[OptimizedImage] carregada", { src: normalizedSrc });
  };

  return (
    <img
      ref={imgRef}
      src={shouldLoad ? imgSrc : fallback}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
      decoding="async"
    />
  );
};

export default OptimizedImage;
