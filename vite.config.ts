import { defineConfig, type Plugin } from "vite";
import { readdirSync, statSync, writeFileSync } from "fs";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Fase 11 (juego sin conexión): al terminar el build escribe dist/offline-manifest.json con el paquete base (todo lo
 * que necesita el juego para abrir y jugar sin señal: código, datos, mascota, banderas, música) y los packs de fotos
 * que se descargan aparte desde "Descargas", cada uno con su tamaño. El service worker guarda el paquete base al
 * instalarse; los packs los guarda la pantalla Descargas (src/lib/offline.ts).
 */
export const PHOTO_PACKS: { id: string; test: (url: string) => boolean }[] = [
  { id: "countries", test: (u) => u.startsWith("/countries/") && !u.endsWith(".md") },
  { id: "cities-world", test: (u) => u.startsWith("/cities/") && !/^\/cities\/(co|ci)-/.test(u) },
  { id: "cities-colombia", test: (u) => u.startsWith("/cities/co-") },
  { id: "cities-latam", test: (u) => u.startsWith("/cities/ci-") },
  { id: "landmarks", test: (u) => u.startsWith("/landmarks/") },
];
const NOT_BASE = /^\/(sw\.js|offline-manifest\.json|og-image[^/]*|email-logo\.png|robots\.txt|placeholder\.svg)$|\.map$|\.md$|^\/(countries|cities|landmarks)\//;

function offlineManifest(): Plugin {
  return {
    name: "geospeed-offline-manifest",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const files: { url: string; bytes: number }[] = [];
      const walk = (dir: string, rel: string) => {
        for (const name of readdirSync(dir)) {
          const full = path.join(dir, name);
          const url = `${rel}/${name}`;
          const st = statSync(full);
          if (st.isDirectory()) walk(full, url);
          else files.push({ url, bytes: st.size });
        }
      };
      walk(dist, "");
      const packs = PHOTO_PACKS.map((p) => {
        const list = files.filter((f) => p.test(f.url));
        return { id: p.id, files: list.map((f) => f.url), bytes: list.reduce((n, f) => n + f.bytes, 0) };
      });
      const base = files.filter((f) => !NOT_BASE.test(f.url));
      writeFileSync(path.join(dist, "offline-manifest.json"), JSON.stringify({
        base: ["/", ...base.map((f) => f.url)],
        baseBytes: base.reduce((n, f) => n + f.bytes, 0),
        packs,
      }));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), offlineManifest()].filter(Boolean),
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
          // Catálogos de banderas y lugares (Fase 6): aparte para que la caché no los mezcle con el código
          if (id.includes("/src/data/flagCatalog.ts") || id.includes("/src/data/featureCatalog.ts") || id.includes("/src/data/landmarkCatalog.ts") || id.includes("/src/data/proPackCatalog.ts")) return "data-catalogs";
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
