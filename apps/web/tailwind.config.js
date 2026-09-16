import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": withOpacity("--surface"),
        "surface-dim": withOpacity("--surface-dim"),
        "surface-bright": withOpacity("--surface-bright"),
        "surface-container-lowest": withOpacity("--surface-container-lowest"),
        "surface-container-low": withOpacity("--surface-container-low"),
        "surface-container": withOpacity("--surface-container"),
        "surface-container-high": withOpacity("--surface-container-high"),
        "surface-container-highest": withOpacity("--surface-container-highest"),
        "surface-variant": withOpacity("--surface-variant"),
        "on-surface": withOpacity("--on-surface"),
        "on-surface-variant": withOpacity("--on-surface-variant"),
        "primary": withOpacity("--primary"),
        "on-primary": withOpacity("--on-primary"),
        "primary-container": withOpacity("--primary-container"),
        "on-primary-container": withOpacity("--on-primary-container"),
        "secondary": withOpacity("--secondary"),
        "on-secondary": withOpacity("--on-secondary"),
        "secondary-container": withOpacity("--secondary-container"),
        "on-secondary-container": withOpacity("--on-secondary-container"),
        "tertiary": withOpacity("--tertiary"),
        "on-tertiary": withOpacity("--on-tertiary"),
        "tertiary-container": withOpacity("--tertiary-container"),
        "on-tertiary-container": withOpacity("--on-tertiary-container"),
        "outline": withOpacity("--outline"),
        "outline-variant": withOpacity("--outline-variant"),
        "error": withOpacity("--error"),
        "on-error": withOpacity("--on-error"),
        "error-container": withOpacity("--error-container"),
        "on-error-container": withOpacity("--on-error-container"),
        "background": withOpacity("--background"),
        "on-background": withOpacity("--on-background"),
        "surface-tint": "#545e76",
        "primary-fixed": "#d7e2ff",
        "primary-fixed-dim": "#bbc6e2",
        "on-primary-fixed": "#101b30",
        "on-primary-fixed-variant": "#3c475d",
        "secondary-fixed": "#d1e4ff",
        "secondary-fixed-dim": "#afc9ea",
        "on-secondary-fixed": "#001d36",
        "on-secondary-fixed-variant": "#2f4865",
        "tertiary-fixed": "#6ffbbe",
        "tertiary-fixed-dim": "#4edea3",
        "on-tertiary-fixed": "#002113",
        "on-tertiary-fixed-variant": "#005236",
        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",
        "inverse-primary": "#bbc6e2",
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "display": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [
    forms,
    containerQueries,
  ],
}
