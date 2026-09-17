import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-vt323)", "monospace"],
        display: ["var(--font-vt323)", "monospace"],
        mono: ["var(--font-vt323)", "monospace"],
      },
      colors: {
        bg: "#000000",
        panel: "#0d0d0d",
        neon: "#ffffff",
        accent: "#ffffff",
      },
    },
  },
  plugins: [],
};

export default config;
