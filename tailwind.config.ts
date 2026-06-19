import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AppForge brand
        background: "#0d0d1a",
        surface: "#15152b",
        "surface-2": "#1d1d38",
        border: "#2a2a4a",
        primary: {
          DEFAULT: "#534AB7",
          hover: "#6259cc",
          muted: "#3a3480",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
