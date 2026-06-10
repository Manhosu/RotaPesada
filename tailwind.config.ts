import type { Config } from "tailwindcss";

/**
 * Rota Pesada — Tailwind config.
 * Brand palette + fonts mirror the design-system tokens in app/globals.css
 * (amber #F59E0B on graphite #111827). Values match so Tailwind utilities and
 * the token-driven component classes stay in lockstep.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: { DEFAULT: "#F59E0B", 300: "#FCD34D", 400: "#FBBF24", 500: "#F59E0B", 600: "#D97706" },
        hazard: { DEFAULT: "#EF4444", 300: "#FCA5A5", 400: "#F87171", 500: "#EF4444", 600: "#DC2626" },
        clear: { DEFAULT: "#22C55E", 500: "#22C55E", 600: "#16A34A" },
        route: { DEFAULT: "#3B82F6", 500: "#3B82F6" },
        graphite: {
          950: "#0A0F1A",
          900: "#111827",
          850: "#161E2E",
          800: "#1F2937",
          750: "#28323F",
          700: "#374151",
          600: "#4B5563",
          500: "#6B7280",
          400: "#9CA3AF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
