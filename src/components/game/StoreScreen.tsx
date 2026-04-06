import { useState, useCallback } from 'react';
import {
  STORE_PRODUCTS,
  getProStatus,
  purchaseLives,
  activatePro,
  type StoreProduct,
} from '@/lib/premiumSystem';
import { getEnergy } from '@/lib/energySystem';
import { useI18n } from '@/i18n';

interface StoreScreenProps {
  onClose: () => void;
}

export default function StoreScreen({ onClose }: StoreScreenProps) {
  const { t, locale } = useI18n();
  const [proStatus, setProStatus] = useState(getProStatus());
  const [energy, setEnergy] = useState(getEnergy());
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const liveProducts = STORE_PRODUCTS.filter(p => p.type === 'lives');
  const proProducts = STORE_PRODUCTS.filter(p => p.type !== 'lives');

  const handlePurchase = useCallback(async (product: StoreProduct) => {
    setPurchasing(product.id);
    setPurchaseMessage(null);

    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 800));

    try {
      if (product.type === 'lives') {
        purchaseLives(product.id);
        setEnergy(getEnergy());
        setPurchaseMessage(t('store_livesAdded', { count: String(product.lives) }));
      } else if (product.type === 'pro_monthly') {
        activatePro('subscription', 30);
        setProStatus(getProStatus());
        setPurchaseMessage(t('store_proActivated'));
      } else if (product.type === 'pro_yearly') {
        activatePro('subscription', 365);
        setProStatus(getProStatus());
        setPurchaseMessage(t('store_proYearlyActivated'));
      } else if (product.type === 'pro_lifetime') {
        activatePro('lifetime');
        setProStatus(getProStatus());
        setPurchaseMessage(t('store_proLifetimeActivated'));
      }
    } catch {
      setPurchaseMessage(t('store_purchaseError'));
    } finally {
      setPurchasing(null);
    }
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background game-bg overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50">
        <button
          onClick={onClose}
          className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg active:scale-[0.97]"
        >
          ← {t('back')}
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: energy.maxLives }).map((_, i) => (
            <span
              key={i}
              className="text-sm sm:text-base"
              style={{
                opacity: i < energy.lives ? 1 : 0.2,
                filter: i < energy.lives ? 'none' : 'grayscale(1)',
              }}
            >
              ❤️
            </span>
          ))}
          <span className="text-[10px] sm:text-xs font-mono font-bold text-muted-foreground ml-1">
            {energy.lives}/{energy.maxLives}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 max-w-lg mx-auto w-full">
        {/* Purchase confirmation */}
        {purchaseMessage && (
          <div className="mb-4 p-3 rounded-xl border border-primary/30 bg-primary/10 text-center animate-fade-in-up">
            <p className="text-sm font-bold text-primary">{purchaseMessage}</p>
          </div>
        )}

        {/* ══ Pro Section ══ */}
        {!proStatus.isPro ? (
          <div className="mb-6 sm:mb-8">
            <div className="text-center mb-3 sm:mb-4">
              <span className="text-3xl sm:text-4xl block mb-1">⭐</span>
              <h2
                className="text-xl sm:text-2xl font-black"
                style={{ fontFamily: 'Impact, system-ui', color: 'hsl(var(--primary))' }}
              >
                GEOSPEED PRO
              </h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {t('store_proDesc')}
              </p>
            </div>

            {/* Pro benefits */}
            <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
              {[
                { emoji: '♾️', label: t('store_infiniteLives') },
                { emoji: '🚫', label: t('store_noAds') },
                { emoji: '🏆', label: t('store_exclusiveBadge') },
              ].map(b => (
                <div key={b.label} className="text-center p-2 sm:p-2.5 rounded-xl border border-border bg-card/80">
                  <span className="text-lg sm:text-xl block">{b.emoji}</span>
                  <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5 font-bold">{b.label}</p>
                </div>
              ))}
            </div>

            {/* Pro products */}
            <div className="flex flex-col gap-2">
              {proProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => handlePurchase(product)}
                  disabled={purchasing === product.id}
                  className={`relative w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all active:scale-[0.97] ${
                    product.highlight
                      ? 'border-primary bg-primary/10 hover:bg-primary/15 shadow-lg'
                      : 'border-border bg-card/80 hover:border-primary/50 hover:bg-card'
                  } ${purchasing === product.id ? 'opacity-60' : ''}`}
                >
                  <span className="text-2xl sm:text-3xl shrink-0">{product.emoji}</span>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-black text-sm sm:text-base text-foreground">{product.label}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-black text-sm sm:text-base" style={{ color: 'hsl(var(--primary))' }}>
                      {product.price}
                    </p>
                    {product.badge && (
                      <span className="inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  {purchasing === product.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-xl">
                      <span className="animate-spin text-xl">⏳</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Pro active badge */
          <div className="mb-6 sm:mb-8 text-center p-4 sm:p-5 rounded-2xl border-2 border-primary bg-primary/10">
            <span className="text-3xl block mb-1">👑</span>
            <h2 className="text-lg sm:text-xl font-black text-primary">{t('store_youArePro')}</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {proStatus.source === 'lifetime'
                ? t('store_lifetimeAccess')
                : proStatus.expiresAt
                ? t('store_activeUntil', { date: new Date(proStatus.expiresAt).toLocaleDateString(locale === 'en' ? 'en' : 'es', { day: 'numeric', month: 'long', year: 'numeric' }) })
                : t('store_activeSubscription')}
            </p>
          </div>
        )}

        {/* ══ Lives Section ══ */}
        <div className="mb-6">
          <div className="text-center mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base font-black text-foreground uppercase tracking-wider">
              {t('store_livesPacks')}
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{t('store_instantRecharge')}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {liveProducts.map(product => (
              <button
                key={product.id}
                onClick={() => handlePurchase(product)}
                disabled={purchasing === product.id}
                className={`relative flex flex-col items-center gap-1 p-3 sm:p-4 rounded-xl border-2 transition-all active:scale-[0.97] ${
                  product.badge
                    ? 'border-primary/60 bg-primary/8 hover:border-primary'
                    : 'border-border bg-card/80 hover:border-primary/40'
                } ${purchasing === product.id ? 'opacity-60' : ''}`}
              >
                {product.badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] sm:text-[8px] font-black px-2 py-0.5 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                    {product.badge}
                  </span>
                )}
                <span className="text-2xl sm:text-3xl">{product.emoji}</span>
                <p className="font-black text-xs sm:text-sm text-foreground">{product.label}</p>
                <p className="text-[8px] sm:text-[9px] text-muted-foreground">{product.description}</p>
                <p className="font-black text-sm sm:text-base mt-1" style={{ color: 'hsl(var(--primary))' }}>
                  {product.price}
                </p>
                {purchasing === product.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-xl">
                    <span className="animate-spin text-lg">⏳</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[8px] sm:text-[9px] text-muted-foreground/60 pb-4">
          {t('store_paymentNote')}
        </p>
      </div>
    </div>
  );
}
