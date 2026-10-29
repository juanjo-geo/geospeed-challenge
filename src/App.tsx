import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import ScreenReaderAnnouncer from "@/components/game/ScreenReaderAnnouncer";
import Index from "./pages/Index.tsx";
const Auth = lazy(() => import("./pages/Auth.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const DeleteAccount = lazy(() => import("./pages/DeleteAccount.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Support = lazy(() => import("./pages/Support.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const RoomTv = lazy(() => import("./pages/RoomTv.tsx"));

// Los enlaces profundos renderizan <Index> DIRECTAMENTE (no un wrapper por ruta): así, cuando Index
// hace navigate('/') tras procesar el enlace, React conserva la instancia (mismo tipo en la misma
// posición) y no se pierde el estado. Con wrappers distintos se desmontaba y volvía al splash/inicio.
//
// Sin QueryClientProvider, TooltipProvider ni el Toaster de Radix (plantilla de shadcn): nadie usa
// useQuery ni Tooltip y todos los avisos van por sonner; mantenerlos sumaba ~30 KB al arranque.

const App = () => {
  // Red de seguridad: si una ruta sin pantalla de carga recibió la copia estática de index.html, retirarla
  useEffect(() => { document.getElementById('static-splash')?.remove(); }, []);
  return (
    <AuthProvider>
    <AccessibilityProvider>
    <I18nProvider>
      <Sonner />
      <ScreenReaderAnnouncer />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/daily" element={<Index deepLink={{ type: 'daily' }} />} />
            <Route path="/daily/:date" element={<Index deepLink={{ type: 'daily' }} />} />
            <Route path="/d/:n" element={<Index deepLink={{ type: 'dailyInvite' }} />} />
            <Route path="/challenge/:seed" element={<Index deepLink={{ type: 'challenge' }} />} />
            <Route path="/duel/:code" element={<Index deepLink={{ type: 'duel' }} />} />
            <Route path="/reto/:code" element={<Index deepLink={{ type: 'reto' }} />} />
            <Route path="/q/:code" element={<Index deepLink={{ type: 'quiz' }} />} />
            <Route path="/sala/:pin/tv" element={<RoomTv />} />
            <Route path="/sala/:pin" element={<Index deepLink={{ type: 'sala' }} />} />
            <Route path="/conquista" element={<Index deepLink={{ type: 'conquista' }} />} />
            <Route path="/conquista/:code" element={<Index deepLink={{ type: 'conquista' }} />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Borrar la cuenta desde la web (enlace que pide Google Play) */}
            <Route path="/eliminar-cuenta" element={<DeleteAccount />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/terms" element={<Terms />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </I18nProvider>
    </AccessibilityProvider>
    </AuthProvider>
  );
};

export default App;
