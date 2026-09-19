import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if (!import.meta.env.PROD) {
    return;
  }

  registerSW({
    immediate: true,
    onRegistered(registration) {
      if (registration) {
        window.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            void registration.update();
          }
        });
      }
    },
    onRegisterError(error) {
      console.warn('[SwiftSpend] Service worker registration failed:', error);
    },
  });
}
