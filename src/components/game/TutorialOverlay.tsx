import { useState, useEffect, useCallback } from 'react';
import { haversineDistance, formatDistance } from '@/lib/gameUtils';
import WorldMapCanvas from './WorldMapCanvas';

const TUTORIAL_KEY = 'geospeed_tutorial_seen';

// Tutorial uses Paris — a well-known, easy-to-locate city
const PRACTICE_CITY = { name: 'París', country: 'Francia', lat: 48.86, lon: 2.35 };

type TutorialStep = 'welcome' | 'rules' | 'practice' | 'result';

interface TutorialOverlayProps {
  onComplete: () => void;
}

export default function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<TutorialStep>('welcome');
  const [clickResult, setClickResult] = useState<{ lat: number; lon: number; distance: number } | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) {
      setVisible(true);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setVisible(false);
    onComplete();
  };

  const handleFinish = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setVisible(false);
    onComplete();
  };

  const handleMapClick = useCallback((lat: number, lon: number) => {
    const distance = haversineDistance(lat, lon, PRACTICE_CITY.lat, PRACTICE_CITY.lon);
    setClickResult({ lat, lon, distance });
    setTimeout(() => setStep('result'), 1800);
  }, []);

  if (!visible) return null;

  // ── Step: Welcome ──
  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="flex min-h-[100dvh] items-center justify-center px-4 py-4">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-up">
            <StepDots current={0} total={3} />
            <p className="text-4xl sm:text-5xl mb-3">🗺️</p>
            <h3 className="text-lg sm:text-xl font-black mb-2 text-primary">¡Bienvenido a GeoSpeed!</h3>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6">
              Tu misión es localizar ciudades del mundo en el mapa lo más rápido y preciso posible.
            </p>
            <div className="flex gap-3">
              <button onClick={handleSkip} className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]">
                SALTAR
              </button>
              <button onClick={() => setStep('rules')} className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all active:scale-[0.97] bg-primary text-primary-foreground">
                SIGUIENTE
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Rules ──
  if (step === 'rules') {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="flex min-h-[100dvh] items-center justify-center px-4 py-4">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-up">
            <StepDots current={1} total={3} />
            <p className="text-4xl sm:text-5xl mb-3">⚡</p>
            <h3 className="text-lg sm:text-xl font-black mb-2 text-primary">¿Cómo funciona?</h3>
            <div className="text-left space-y-3 mb-6">
              <div className="flex items-start gap-2.5">
                <span className="text-lg shrink-0">📍</span>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  <strong className="text-foreground">Haz click</strong> donde crees que está la ciudad. Cuanto más cerca, más puntos.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg shrink-0">🚀</span>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  <strong className="text-foreground">Sé rápido:</strong> menos de 4s = multiplicador ×2. Más de 9s = ×0.5
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg shrink-0">⏱️</span>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  <strong className="text-foreground">15 segundos</strong> por ronda. Si se acaba el tiempo, ¡pierdes!
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSkip} className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]">
                SALTAR
              </button>
              <button onClick={() => setStep('practice')} className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all active:scale-[0.97] bg-primary text-primary-foreground">
                ¡PRACTICAR!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Practice (interactive map) ──
  if (step === 'practice') {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-fade-in">
        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <StepDots current={2} total={3} />
          </div>
          <div className="text-center flex-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Encuentra esta ciudad</p>
            <p className="text-lg sm:text-xl font-black" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
              📍 {PRACTICE_CITY.name}, {PRACTICE_CITY.country}
            </p>
          </div>
          <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
            Saltar
          </button>
        </div>

        {/* Hint */}
        <div className="shrink-0 text-center py-2 bg-primary/10 border-b border-primary/20">
          <p className="text-xs sm:text-sm text-primary font-bold animate-pulse">
            👆 Toca el mapa donde crees que está {PRACTICE_CITY.name}
          </p>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-0">
          <WorldMapCanvas
            onMapClick={handleMapClick}
            clickDisabled={!!clickResult}
            userClick={clickResult ? { lat: clickResult.lat, lon: clickResult.lon } : null}
            correctLocation={clickResult ? { lat: PRACTICE_CITY.lat, lon: PRACTICE_CITY.lon } : null}
            distanceKm={clickResult?.distance ?? null}
            gameMode="world"
          />
        </div>
      </div>
    );
  }

  // ── Step: Result ──
  if (step === 'result' && clickResult) {
    const isGood = clickResult.distance < 500;
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="flex min-h-[100dvh] items-center justify-center px-4 py-4">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-up">
            <p className="text-5xl sm:text-6xl mb-3">{isGood ? '🎉' : '💪'}</p>
            <h3 className="text-lg sm:text-xl font-black mb-2 text-primary">
              {isGood ? '¡Excelente puntería!' : '¡Buen intento!'}
            </h3>
            <p className="text-muted-foreground text-sm mb-1">
              Tu click estuvo a <strong className="text-foreground">{formatDistance(clickResult.distance)}</strong> de {PRACTICE_CITY.name}
            </p>
            <p className="text-muted-foreground text-xs mb-6">
              {isGood
                ? 'Así se juega. En el juego real tendrás 15 segundos por ciudad.'
                : `No te preocupes, con la práctica mejorarás. ${PRACTICE_CITY.name} está en Europa occidental.`
              }
            </p>
            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-lg text-sm font-bold transition-all active:scale-[0.97] bg-primary text-primary-foreground"
            >
              ¡EMPEZAR A JUGAR! 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 mb-4">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? 'w-8 bg-primary' : i < current ? 'w-4 bg-primary/40' : 'w-4 bg-muted'
          }`}
        />
      ))}
    </div>
  );
}
