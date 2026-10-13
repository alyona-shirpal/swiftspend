/**
 * iOS Safari Viewport & Keyboard Blur Fallback
 *
 * When an input blurs on iOS, Safari's virtual keyboard dismiss can sometimes
 * leave the viewport scroll position offset or layout shifted.
 * This listener catches form field blur events on iOS and safely resets
 * the scroll position via window.scrollTo(0, 0).
 */
export function initIOSViewportFix(): void {
  if (typeof window === 'undefined') return;

  // Android does not have the iOS auto-zoom bug; do not intercept blur or scroll on Android
  if (/Android/i.test(navigator.userAgent)) return;

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!isIOS) return;

  window.addEventListener(
    'blur',
    (event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        // Delay slightly so the keyboard dismiss animation completes
        setTimeout(() => {
          const active = document.activeElement;
          const isAnotherInput =
            active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement ||
            active instanceof HTMLSelectElement;

          if (!isAnotherInput) {
            window.scrollTo(0, 0);
          }
        }, 50);
      }
    },
    true,
  );
}
