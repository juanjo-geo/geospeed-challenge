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

/**
 * Precarga de las fuentes de la pantalla de carga (wordmark en Fredoka 700, lema en Poppins 700,
 * "Preparando…" en 600). Sin esto el navegador las pide cuando ya está pintando y el texto cambia de letra
 * a mitad de la pantalla. Los archivos llevan hash, así que se resuelven con el bundle (solo en build).
 */
const PRELOAD_FONTS = [/^fredoka-latin-700-normal/, /^poppins-latin-700-normal/, /^poppins-latin-600-normal/];
function fontPreload(): Plugin {
  return {
    name: "geospeed-font-preload",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const tags = Object.keys(ctx.bundle ?? {})
          .filter((f) => f.endsWith(".woff2") && PRELOAD_FONTS.some((re) => re.test(path.basename(f))))
          // En el orden de PRELOAD_FONTS: el bundle no garantiza un orden estable entre builds
          .sort((a, b) => PRELOAD_FONTS.findIndex((re) => re.test(path.basename(a))) - PRELOAD_FONTS.findIndex((re) => re.test(path.basename(b))))
          .map((f) => ({ tag: "link", attrs: { rel: "preload", as: "font", type: "font/woff2", crossorigin: true, href: "/" + f }, injectTo: "head" as const }));
        return { html, tags };
      },
    },
  };
}

/**
 * El módulo de entrada se evalúa DESPUÉS del primer pintado: esta etiqueta pasa a ser un modulepreload
 * con data-entry (se descarga igual de pronto) y boot.js inserta el <script type="module"> tras el primer
 * cuadro. Sin esto, cuando el JavaScript llegaba antes de que el navegador pintara, su evaluación
 * (200–300 ms) retrasaba la pantalla de carga estática, y Lighthouse contaba dentro del LCP todo lo
 * descargado hasta ese momento (LCP simulado 1,9 s → 4,4 s según la carrera).
 */
function deferEntry(): Plugin {
  return {
    name: "geospeed-defer-entry",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        let out = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, '<link rel="modulepreload" crossorigin href="$1" data-entry>');
        // Las hojas de estilo (lo único que bloquea el pintado) van ANTES de los modulepreload: el navegador pide
        // los <link> en el orden del documento y Vite las deja al final de la cabecera, detrás de ~400 KB de JS.
        const css = [...out.matchAll(/^[ \t]*<link rel="stylesheet"[^>]*>\r?\n/gm)].map((m) => m[0]);
        if (css.length && /<link rel="modulepreload"/.test(out)) {
          for (const tag of css) out = out.replace(tag, '');
          out = out.replace(/([ \t]*<link rel="modulepreload")/, css.join('') + '$1');
        }
        return out;
      },
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
  plugins: [react(), mode === "development" && componentTagger(), offlineManifest(), fontPreload(), deferEntry()].filter(Boolean),
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
            // Generador de QR (sala en vivo): solo se importa de forma diferida; no debe ir en la carga inicial
            if (id.includes("qrcode-generator")) return "vendor-qrcode";
            // Plugins de la app nativa (AdMob, RevenueCat): se importan de forma diferida y solo dentro
            // de Capacitor; en "vendor" engordaban la carga inicial de la web
            if (id.includes("@capacitor-community/admob") || id.includes("@revenuecat")) return "vendor-native";
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
