import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-secondary-fixed-variant": "#2f4865",
        "surface-dim": "#d8dadc",
        "secondary-container": "#c2dcff",
        "on-primary-container": "#79849d",
        "on-error-container": "#93000a",
        "surface-container-low": "#f2f4f6",
        "surface-tint": "#545e76",
        "surface-container-lowest": "#ffffff",
        "secondary": "#47607e",
        "on-tertiary-fixed-variant": "#005236",
        "tertiary-fixed-dim": "#4edea3",
        "tertiary-container": "#002113",
        "on-surface-variant": "#44474c",
        "surface-container-high": "#e6e8ea",
        "on-primary": "#ffffff",
        "on-background": "#191c1e",
        "error-container": "#ffdad6",
        "on-tertiary-fixed": "#002113",
        "primary": "#000000",
        "error": "#ba1a1a",
        "surface-bright": "#f7f9fb",
        "primary-fixed-dim": "#bbc6e2",
        "outline": "#74777d",
        "surface-container-highest": "#e0e3e5",
        "surface-container": "#eceef0",
        "inverse-primary": "#bbc6e2",
        "secondary-fixed": "#d1e4ff",
        "tertiary-fixed": "#6ffbbe",
        "tertiary": "#000000",
        "on-error": "#ffffff",
        "outline-variant": "#c4c6cc",
        "on-tertiary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-secondary-fixed": "#001d36",
        "on-primary-fixed": "#101b30",
        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",
        "secondary-fixed-dim": "#afc9ea",
        "on-tertiary-container": "#009668",
        "background": "#f7f9fb",
        "on-secondary-container": "#48617e",
        "primary-container": "#101b30",
        "surface-variant": "#e0e3e5",
        "surface": "#f7f9fb",
        "primary-fixed": "#d7e2ff",
        "on-surface": "#191c1e",
        "on-primary-fixed-variant": "#3c475d"
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
