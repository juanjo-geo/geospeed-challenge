import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Tipografía de marca de las maquetas (wordmark y titulares), servida desde el propio dominio:
// solo latín 700/800 (~16 KB) para que funcione sin red y dentro de la app nativa.
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-800.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA / offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — app works fine without it
    });
  });
}
