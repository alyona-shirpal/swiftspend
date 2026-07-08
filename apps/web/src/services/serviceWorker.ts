import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if (!import.meta.env.PROD) {
    return;
  }

  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.warn('[SwiftSpend] Service worker registration failed:', error);
    },
  });
}
