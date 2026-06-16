import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // @revenuecat/purchases-capacitor es un plugin NATIVO (Capacitor), solo se usa en la app móvil.
      // En la web nunca se ejecuta (PaymentProvider.load() no se llama), así que lo marcamos externo
      // para que el build de Vite/Rollup no intente resolverlo y falle.
      external: ["@revenuecat/purchases-capacitor"],
    },
  },
}));
