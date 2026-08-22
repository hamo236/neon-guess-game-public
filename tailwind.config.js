/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-error-container": "#ffdad6",
        "surface-container-highest": "#323536",
        "surface-container-low": "#191c1d",
        "tertiary-container": "#dcd9d8",
        "on-error": "#690005",
        "on-tertiary": "#313030",
        "surface-bright": "#373a3b",
        "on-surface": "#e1e3e4",
        "surface-container-high": "#282a2b",
        "on-primary-fixed": "#002022",
        "primary": "#dbfcff",
        "primary-fixed": "#7df4ff",
        "on-secondary-container": "#e5a9ff",
        "tertiary": "#f8f5f5",
        "surface-variant": "#323536",
        "tertiary-fixed": "#e5e2e1",
        "surface": "#111415",
        "surface-dim": "#111415",
        "secondary-fixed": "#f6d9ff",
        "background": "#111415",
        "on-primary-fixed-variant": "#004f54",
        "on-secondary-fixed-variant": "#7200a3",
        "secondary-container": "#7d01b1",
        "error": "#ffb4ab",
        "on-tertiary-container": "#5f5e5e",
        "on-primary": "#00363a",
        "primary-fixed-dim": "#00dbe9",
        "on-surface-variant": "#b9cacb",
        "on-tertiary-fixed-variant": "#474746",
        "outline-variant": "#3b494b",
        "on-background": "#e1e3e4",
        "inverse-primary": "#006970",
        "surface-tint": "#00dbe9",
        "on-tertiary-fixed": "#1c1b1b",
        "surface-container-lowest": "#0c0f10",
        "tertiary-fixed-dim": "#c8c6c5",
        "inverse-on-surface": "#2e3132",
        "surface-container": "#1d2021",
        "secondary": "#e9b3ff",
        "inverse-surface": "#e1e3e4",
        "on-primary-container": "#006970",
        "primary-container": "#00f0ff",
        "on-secondary-fixed": "#310048",
        "error-container": "#93000a",
        "secondary-fixed-dim": "#e9b3ff",
        "on-secondary": "#510074",
        "outline": "#849495"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "stack-md": "16px",
        "stack-lg": "24px",
        "stack-sm": "8px",
        "gutter": "12px",
        "container-margin": "20px"
      },
      fontFamily: {
        "display-lg": ["Sora", "sans-serif"],
        "headline-md": ["Sora", "sans-serif"],
        "headline-sm": ["Sora", "sans-serif"],
        "label-caps": ["JetBrains Mono", "monospace"],
        "body-lg": ["Inter", "sans-serif"],
        "stats-num": ["Sora", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["40px", { "lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "label-caps": ["12px", { "lineHeight": "16px", "letterSpacing": "0.1em", "fontWeight": "700" }],
        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "stats-num": ["18px", { "lineHeight": "22px", "letterSpacing": "0.05em", "fontWeight": "700" }],
        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }]
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)'
      }
    },
  },
  plugins: [],
}
