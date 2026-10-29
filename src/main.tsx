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
import { afterAppLoad } from "./lib/idle";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA / offline support. Al instalarse guarda el paquete base (~6 MB):
// se registra unos segundos después de abrir para no quitarle red a la pantalla de carga y al Inicio.
if ('serviceWorker' in navigator) {
  void afterAppLoad(8000).then(() => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — app works fine without it
    });
  });
}
