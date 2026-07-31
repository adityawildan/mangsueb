// The Gemini API key is baked in at BUILD TIME via the VITE_GEMINI_API_KEY
// environment variable (set in Vercel/Netlify project settings, or a local
// .env.local file — never committed to git). Vite exposes any env var
// prefixed with VITE_ on import.meta.env automatically.
//
// Lock this key down in Google Cloud Console with an HTTP referrer
// restriction (e.g. https://your-deployed-domain.vercel.app/*) so it only
// works from your deployed site.

export const getApiKey = (): string => {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

export const hasApiKey = (): boolean => getApiKey().length > 0;

