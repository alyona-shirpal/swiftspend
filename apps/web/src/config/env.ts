/**
 * API base URL for the web app (not used by the Express API server).
 *
 * Vite loads env files from apps/web/ in this order (later wins):
 *   .env → .env.local → .env.[mode] → .env.[mode].local
 *
 * Local development (npm run dev):
 *   - apps/web/.env          → production default (committed)
 *   - apps/web/.env.local    → overrides with http://localhost:3000 (git-ignored)
 *
 * Vercel production build (vite build):
 *   - apps/web/.env          → https://swiftspend-api.vercel.app (committed)
 *   - .env.local is NOT deployed (git-ignored)
 *   - Vercel dashboard env vars override file values if set
 */
const DEV_FALLBACK = 'http://localhost:3000';

export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL?.trim();

  if (url) {
    if (import.meta.env.DEV) {
      console.info(`[SwiftSpend] API: ${url}`);
    }
    return url;
  }

  if (import.meta.env.DEV) {
    console.warn(`[SwiftSpend] VITE_API_URL not set — using ${DEV_FALLBACK}`);
    return DEV_FALLBACK;
  }

  throw new Error(
    'VITE_API_URL is missing. Set it in apps/web/.env or in Vercel project environment variables.'
  );
}
