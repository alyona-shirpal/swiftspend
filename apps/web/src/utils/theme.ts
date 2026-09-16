export type Theme = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'pref_theme';

export const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
};

export const applyTheme = (theme: Theme = getStoredTheme()) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }
};

export const setStoredTheme = (theme: Theme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
  }
};

// Initialize system theme listener
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  };

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleChange);
  } else if (typeof (mediaQuery as { addListener?: (cb: () => void) => void }).addListener === 'function') {
    (mediaQuery as { addListener: (cb: () => void) => void }).addListener(handleChange);
  }

  // Initial apply
  applyTheme();
}
