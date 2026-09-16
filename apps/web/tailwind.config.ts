import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: { colors: { school: { 50: "#E6F4EC", 100: "#D2EDDD", 600: "#087443", 700: "#065B35", ink: "#10261A", muted: "#52665A" } } } },
  plugins: []
} satisfies Config;
