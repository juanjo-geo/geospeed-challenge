import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Tipografía de las maquetas (Poppins en toda la app), servida desde el propio dominio para que
// funcione sin red y dentro de la app nativa. Solo latín (incluye tildes y ñ), ~8 KB por peso;
// el navegador descarga únicamente los pesos que la pantalla usa.
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-800.css";
import "@fontsource/poppins/latin-900.css";
// Letra redondeada del wordmark GEOSPEED (solo el logo)
import "@fontsource/fredoka/latin-700.css";
import "./index.css";
import { afterAppLoad, firstInteraction } from "./lib/idle";
import { detectLocale, loadLocale } from "./i18n";
import { loadCatalogs } from "./lib/catalog";
import { initBackNavigation } from "./lib/backNav";
import { installNativeShare } from "./lib/nativeShare";

// "Atrás" del teléfono y del navegador (cada pantalla registra el de su botón visible) y, en la app nativa,
// la hoja de compartir de Android para todos los botones de compartir
initBackNavigation();
installNativeShare();

const mount = () => createRoot(document.getElementById("root")!).render(<App />);

// El inglés se descarga aparte: quien juega en inglés lo espera aquí (la pantalla de carga estática sigue a la vista),
// máximo 3 s; si tarda más, la app arranca en español y cambia sola al llegar el diccionario.
const initialLocale = detectLocale();
if (initialLocale === "es") mount();
else void Promise.race([loadLocale(initialLocale), new Promise((r) => setTimeout(r, 3000))]).catch(() => {}).finally(mount);

// Banderas, lugares, monumentos y packs Pro (~60 KB) se descargan con el primer toque: así no compiten con la pantalla
// de carga y están listos antes de que empiece una partida (las pantallas que los usan también los esperan)
void firstInteraction().then(() => loadCatalogs()).catch(() => {});

// Register service worker for PWA / offline support. Al instalarse guarda el paquete base (~6 MB):
// se registra unos segundos después de abrir para no quitarle red a la pantalla de carga y al Inicio.
if ('serviceWorker' in navigator) {
  void afterAppLoad(8000).then(() => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — app works fine without it
    });
  });
}
