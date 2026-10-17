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
      output: {
        // Vendors en chunks propios: cambian poco entre despliegues y el navegador los conserva en caché.
        // Los datos pesados (polígonos del mapa, catálogo de ciudades) también van aparte: solo se
        // descargan cuando una pantalla los necesita (mapa, splash, demo del inicio).
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (/[\/]react(-dom|-router|-router-dom)?[\/]|[\/]scheduler[\/]/.test(id)) return "vendor-react";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("@radix-ui") || id.includes("@tanstack")) return "vendor-ui";
            return "vendor";
          }
          if (id.includes("/src/data/countries.ts")) return "data-countries";
          if (id.includes("/src/data/cities.ts")) return "data-cities";
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
