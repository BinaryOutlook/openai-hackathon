import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        paper: "#f7f5ef",
        surface: "#fffdf8",
        line: "#ddd7c9",
        cedar: "#6f4436",
        teal: "#146c63",
        mint: "#d8eee7",
        amber: "#bb7b17",
        coral: "#b94c3b",
        graphite: "#4c5754"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 33, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
