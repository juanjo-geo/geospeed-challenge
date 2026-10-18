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
        // Vendors aparte del código del juego: cambian poco entre despliegues y el navegador los
        // conserva en caché. OJO: todo lo que importa React (react, react-dom, radix, router…) debe ir en
        // EL MISMO chunk. Separar React en su propio chunk creó una importación circular entre chunks y en
        // producción `React.createContext` era undefined → pantalla azul (incidente 18 oct 2026).
        // Supabase no depende de React, así que puede ir aparte sin riesgo.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@supabase")) return "vendor-supabase";
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
