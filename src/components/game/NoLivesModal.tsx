import { useState, useEffect, useCallback } from 'react';
import { getEnergy, formatRegenTime } from '@/lib/energySystem';
import { showRewardedAd } from '@/lib/adSystem';
import { rewardAdWatched, isPro, STORE_PRODUCTS } from '@/lib/premiumSystem';

interface NoLivesModalProps {
  onClose: () => void;
  onOpenStore?: () => void;
}

export default function NoLivesModal({ onClose, onOpenStore }: NoLivesModalProps) {
  const [energy, setEnergy] = useState(getEnergy());
  const [watchingAd, setWatchingAd] = useState(false);
  const [lifeRestored, setLifeRestored] = useState(false);
  const userIsPro = isPro();
  const mountedAt = useState(() => Date.now())[0];
  const MIN_VISIBLE_MS = 3000; // Show at least 3 seconds

  useEffect(() => {
    const interval = setInterval(() => {
      const e = getEnergy();
      setEnergy(e);
      if (e.lives > 0) {
        const elapsed = Date.now() - mountedAt;
        if (elapsed < MIN_VISIBLE_MS) {
          // Too soon — show "life restored" message, then close after remaining time
          setLifeRestored(true);
          setTimeout(onClose, MIN_VISIBLE_MS - elapsed);
          clearInterval(interval);
        } else {
          // Enough time passed — show restored briefly then close
          setLifeRestored(true);
          setTimeout(onClose, 1200);
          clearInterval(interval);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [onClose, mountedAt]);

  const handleWatchAd = useCallback(async () => {
    setWatchingAd(true);
    try {
      const result = await showRewardedAd();
      if (result === 'completed') {
        rewardAdWatched();
        // Energy will update via interval and auto-close
      }
    } catch {
      // Ad failed silently
    } finally {
      setWatchingAd(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-3">
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-up">
        <span className="text-4xl sm:text-5xl block mb-3 sm:mb-4">{lifeRestored ? '💚' : '💔'}</span>
        <h2 className="text-lg sm:text-xl font-black mb-1.5 sm:mb-2" style={{ color: 'hsl(var(--primary))' }}>
          {lifeRestored ? '¡Vida restaurada!' : '¡Sin vidas!'}
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
          {lifeRestored
            ? '¡Ya puedes jugar de nuevo!'
            : 'Tus vidas se regeneran con el tiempo. La próxima vida llega en:'}
        </p>

        {/* Timer — hidden when life just restored */}
        {!lifeRestored && (
          <div
            className="text-2xl sm:text-3xl font-mono font-black mb-3 sm:mb-4"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {formatRegenTime(energy.nextRegenMs)}
          </div>
        )}

        {/* Hearts */}
        <div className="flex gap-0.5 justify-center mb-4 sm:mb-5">
          {Array.from({ length: energy.maxLives }).map((_, i) => (
            <span
              key={i}
              className="text-xl sm:text-2xl transition-all duration-300"
              style={{
                opacity: i < energy.lives ? 1 : 0.15,
                filter: i < energy.lives ? 'none' : 'grayscale(1)',
                transform: i < energy.lives ? 'scale(1)' : 'scale(0.8)',
              }}
            >
              ❤️
            </span>
          ))}
        </div>

        {/* ── Action buttons (hidden when life restored) ── */}
        {!lifeRestored && <div className="flex flex-col gap-2 sm:gap-2.5 mb-3 sm:mb-4">
          {/* Rewarded ad button (only for free users) */}
          {!userIsPro && (
            <button
              onClick={handleWatchAd}
              disabled={watchingAd}
              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-[0.97] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {watchingAd ? (
                <>
                  <span className="animate-spin">⏳</span> Cargando anuncio...
                </>
              ) : (
                <>🎬 VER ANUNCIO = +1 VIDA</>
              )}
            </button>
          )}

          {/* Buy lives button */}
          {onOpenStore && (
            <button
              onClick={onOpenStore}
              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-[0.97] border-2 border-primary/50 hover:border-primary bg-primary/8 text-primary"
            >
              ❤️ COMPRAR VIDAS
            </button>
          )}

          {/* Go Pro banner (only for free users) */}
          {!userIsPro && onOpenStore && (
            <button
              onClick={onOpenStore}
              className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all active:scale-[0.97] bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 text-primary hover:bg-primary/20"
            >
              ⭐ GEOSPEED PRO — Vidas infinitas · Sin anuncios
            </button>
          )}
        </div>}

        {/* Divider */}
        <div className="border-t border-border/50 pt-2.5 sm:pt-3">
          <button
            onClick={onClose}
            className="w-full py-2 sm:py-2.5 rounded-lg font-bold text-[10px] sm:text-xs border border-border text-muted-foreground hover:bg-muted transition-all active:scale-[0.97]"
          >
            VOLVER AL MENÚ
          </button>
        </div>
      </div>
    </div>
  );
}
