import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import ScreenReaderAnnouncer from "@/components/game/ScreenReaderAnnouncer";
import Index from "./pages/Index.tsx";
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Support = lazy(() => import("./pages/Support.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

/** Thin wrapper that extracts route params and forwards them to Index as props */
function DailyRoute() {
  return <Index deepLink={{ type: 'daily' }} />;
}
function ChallengeRoute() {
  return <Index deepLink={{ type: 'challenge' }} />;
}
function DuelRoute() {
  return <Index deepLink={{ type: 'duel' }} />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <AccessibilityProvider>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ScreenReaderAnnouncer />
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/daily" element={<DailyRoute />} />
              <Route path="/daily/:date" element={<DailyRoute />} />
              <Route path="/challenge/:seed" element={<ChallengeRoute />} />
              <Route path="/duel/:code" element={<DuelRoute />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/support" element={<Support />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
    </AccessibilityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
