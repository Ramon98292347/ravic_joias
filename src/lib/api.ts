export const getApiBaseUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");
  const v = String(raw).trim();
  if (!v) return "";
  const noSlash = v.replace(/\/$/, "");
  return noSlash.endsWith("/api") ? noSlash.slice(0, -4) : noSlash;
};

