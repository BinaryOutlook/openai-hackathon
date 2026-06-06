import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#212121",
        paper: "#ffffff",
        surface: "#ffffff",
        line: "#e0e0e0",
        cedar: "#303030",
        teal: "#bf360c",
        mint: "#ffebe6",
        amber: "#ffb020",
        coral: "#b3261e",
        graphite: "#616161",
        shrimp: {
          orange: "#ff5722",
          orangeHover: "#a62f08",
          orangeActive: "#bf360c",
          orangeTint: "#ffebe6",
          orangeSoft: "#fff7f4",
          mint: "#00bfa5",
          mintSoft: "#d1f4ef",
          charcoal: "#212121"
        }
      },
      boxShadow: {
        soft: "0 8px 24px rgba(33, 33, 33, 0.10)",
        brand: "0 12px 32px rgba(255, 87, 34, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
