export function triggerSuccessfulTransactionHaptic() {
  try {
    globalThis.navigator?.vibrate?.(10);
  } catch {
    // Haptics are optional; unsupported or blocked browsers should not affect saving.
  }
}

export function triggerAvatarHaptic() {
  try {
    // Light double-tap / crisp pop pattern [15ms buzz, 30ms gap, 20ms buzz] or fallback to short buzz
    if (globalThis.navigator?.vibrate) {
      globalThis.navigator.vibrate([15, 30, 20]);
    }
  } catch {
    // Ignore unsupported devices / permissions
  }
}

