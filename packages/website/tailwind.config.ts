import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#f4f4f5",
        muted: "#a1a1aa",
        card: "#18181b",
        primary: "#38bdf8",
        border: "#27272a",
      },
    },
  },
  plugins: [],
};

export default config;
