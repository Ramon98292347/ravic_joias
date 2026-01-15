import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_KEY são obrigatórias');
}

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const timeoutMs = 15000;
  const controller = new AbortController();
  const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), timeoutMs);
  const debugEnabled = !!import.meta.env.DEV;
  const startedAt = Date.now();

  const safeUrl = (() => {
    try {
      if (typeof input === "string") return input;
      if (input instanceof URL) return input.toString();
      if (input instanceof Request) return input.url;
      return String(input);
    } catch {
      return "<url-indisponivel>";
    }
  })();

  const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (debugEnabled) {
    console.debug("[supabase:fetch] start", { method, url: safeUrl });
  }

  try {
    const mergedInit: RequestInit = { ...(init || {}) };

    if (mergedInit.signal) {
      const signal = mergedInit.signal;
      if (signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
      signal.addEventListener('abort', () => controller.abort(), { once: true });
      delete mergedInit.signal;
    }

    const res = await fetch(input, { ...mergedInit, signal: controller.signal });
    if (debugEnabled) {
      console.debug("[supabase:fetch] ok", {
        method,
        url: safeUrl,
        status: res.status,
        ms: Date.now() - startedAt,
      });
    }
    return res;
  } catch (error: any) {
    if (debugEnabled) {
      if (error?.name === "AbortError") {
        console.debug("[supabase:fetch] aborted", {
          method,
          url: safeUrl,
          ms: Date.now() - startedAt,
        });
      } else {
        console.error("[supabase:fetch] erro", {
          method,
          url: safeUrl,
          ms: Date.now() - startedAt,
          name: error?.name,
          message: error?.message,
        });
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: fetchWithTimeout,
    headers: {
      apikey: supabaseKey,
    },
  },
});
