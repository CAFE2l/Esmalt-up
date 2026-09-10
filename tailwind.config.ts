import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--bege-claro) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        bege: "rgb(var(--bege-claro) / <alpha-value>)",
        branco: "rgb(var(--branco) / <alpha-value>)",
        "rosa-claro": "rgb(var(--rosa-claro) / <alpha-value>)",
        "rosa-medio": "rgb(var(--rosa-medio) / <alpha-value>)",
        "rosa-blush": "rgb(var(--rosa-blush) / <alpha-value>)",
        "rose-gold": "rgb(var(--rose-gold) / <alpha-value>)",
        "cinza-suave": "rgb(var(--cinza-suave) / <alpha-value>)",
      },
      boxShadow: {
        card: "0 2px 4px rgba(201, 137, 145, 0.15), 0 8px 24px rgba(229, 153, 168, 0.2)",
        "card-lg": "0 4px 8px rgba(201, 137, 145, 0.2), 0 16px 40px rgba(229, 153, 168, 0.3)",
        pressed: "0 1px 2px rgba(201, 137, 145, 0.18), 0 2px 8px rgba(229, 153, 168, 0.16)",
        header: "0 1px 12px rgba(0, 0, 0, 0.4)",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-rounded", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;