import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zai: {
          blue: "#0078c8",
          ink: "#0f2d3d",
          mist: "#f5f9fc"
        }
      }
    }
  },
  plugins: []
};

export default config;
