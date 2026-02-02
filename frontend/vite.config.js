import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      include: [/\.jsx?$/],
    }),
  ],
  envPrefix: "REACT_APP_",
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".jsx": "jsx",
      },
    },
  },
  build: {
    rollupOptions: {
      jsx: "preserve",
    },
  },
  server: {
    port: 3000,
  },
});
