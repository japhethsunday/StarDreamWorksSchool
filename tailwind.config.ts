import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a5f",
        secondary: "#f59e0b",
        accent: "#10b981",
        "school-blue": "#0f4c81",
        "school-gold": "#d4a843",
        "school-green": "#2d6a4f",
        "school-dark": "#0a1628",
        // STAR DreamWorks brand palette, extracted from the school's
        // flyer/exercise-book cover and student uniform.
        // Primary navy (STAR masthead), secondary red (DreamWorks wordmark
        // + tie), golden yellow (flyer background), white + deep blue
        // (uniform shirt + trousers), green (cover accents).
        "brand-navy": "#1f2a5e",
        "brand-navy-deep": "#131a3e",
        "brand-ink": "#1b2340",
        "brand-body": "#3f4756",
        "brand-muted": "#6b7280",
        "brand-red": "#c93720",
        "brand-red-dark": "#a82a18",
        "brand-yellow": "#f5b301",
        "brand-yellow-soft": "#fce9b8",
        "brand-paper": "#fff9ec",
        "brand-cream": "#fdf3d7",
        "brand-green": "#1e7a4c",
        "brand-line": "#e9e2cf",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
        "144": "36rem",
        "160": "40rem",
        "192": "48rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "soft-sm": "0 2px 8px rgba(0, 0, 0, 0.06)",
        "soft": "0 4px 16px rgba(0, 0, 0, 0.08)",
        "soft-md": "0 6px 24px rgba(0, 0, 0, 0.1)",
        "soft-lg": "0 8px 32px rgba(0, 0, 0, 0.12)",
        "soft-xl": "0 12px 48px rgba(0, 0, 0, 0.15)",
        "glow-blue": "0 0 20px rgba(15, 76, 129, 0.3)",
        "glow-gold": "0 0 20px rgba(212, 168, 67, 0.3)",
        "glow-green": "0 0 20px rgba(45, 106, 79, 0.3)",
        "inner-soft": "inset 0 2px 8px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
