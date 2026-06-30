import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#000000",
        panel: "#0a0a0a",
        elevated: "#111111",
        hairline: "rgba(255,255,255,0.10)",
        accent: {
          DEFAULT: "#ffffff",
          blue: "#3b82f6",
          violet: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "1100px",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        kenburns: {
          "0%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1.0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        kenburns: "kenburns 16s ease-out forwards",
        marquee: "marquee 32s linear infinite",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
