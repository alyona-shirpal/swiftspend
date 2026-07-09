export function triggerSuccessfulTransactionHaptic() {
  try {
    globalThis.navigator?.vibrate?.(10);
  } catch {
    // Haptics are optional; unsupported or blocked browsers should not affect saving.
  }
}
