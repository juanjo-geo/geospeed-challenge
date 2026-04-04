import { useState, useEffect } from 'react';

const TUTORIAL_KEY = 'geospeed_tutorial_seen';

const STEPS = [
  {
    emoji: '🗺️',
    title: '¡Bienvenido a GeoSpeed!',
    desc: 'Tu misión es localizar ciudades del mundo en el mapa lo más rápido y preciso posible.',
  },
  {
    emoji: '📍',
    title: 'Haz click en el mapa',
    desc: 'Lee el nombre de la ciudad en el panel izquierdo y haz click donde crees que está. Cuanto más cerca, más puntos ganas.',
  },
  {
    emoji: '⚡',
    title: '¡La velocidad importa!',
    desc: 'Responder en menos de 4 segundos te da multiplicador ×2. Si tardas más de 9s, se reduce a ×0.5. ¡Si se acaba el tiempo, pierdes!',
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export default function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) {
      setVisible(true);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem(TUTORIAL_KEY, 'true');
      setVisible(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="flex min-h-[100dvh] items-center justify-center px-4 py-4 sm:py-6">
        <div
          className="bg-card border border-border rounded-2xl p-4 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-up max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-4 sm:mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/40' : 'w-4 bg-muted'
                }`}
              />
            ))}
          </div>

          <p className="text-4xl sm:text-5xl mb-3 sm:mb-4">{current.emoji}</p>
          <h3 className="text-base sm:text-xl font-black mb-2 sm:mb-3 text-primary text-balance leading-tight">
            {current.title}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-5 sm:mb-8 text-pretty">
            {current.desc}
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]"
            >
              SALTAR
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all active:scale-[0.97] bg-primary text-primary-foreground"
            >
              {step < STEPS.length - 1 ? 'SIGUIENTE' : '¡JUGAR!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
