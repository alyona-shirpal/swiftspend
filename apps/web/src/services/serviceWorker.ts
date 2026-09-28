import { registerSW } from 'virtual:pwa-register';

export const PWA_VERSION =
  typeof __PWA_VERSION__ !== 'undefined' ? __PWA_VERSION__ : 'dev';

/**
 * PWA Version Buster: unregisters all active service workers, deletes all CacheStorage
 * caches, and reloads the current page with a cache-busting timestamp.
 */
export async function bustPwaCacheAndReload(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (error) {
    console.warn('[SwiftSpend] Failed during PWA cache busting:', error);
  }

  const url = new URL(window.location.href);
  url.searchParams.set('pwa_bust', Date.now().toString());
  window.location.href = url.href;
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD) {
    return;
  }

  registerSW({
    immediate: true,
    onRegistered(registration) {
      if (registration) {
        // Check for updates when the user returns to the app
        window.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            void registration.update();
          }
        });

        // Periodically check for service worker updates (every 30 mins)
        setInterval(
          () => {
            void registration.update();
          },
          30 * 60 * 1000,
        );
      }
    },
    onRegisterError(error) {
      console.warn('[SwiftSpend] Service worker registration failed:', error);
    },
  });
}
