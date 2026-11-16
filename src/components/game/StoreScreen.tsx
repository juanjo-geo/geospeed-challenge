import { useState, useCallback, useEffect, useRef } from 'react';
import { playButtonTap } from '@/lib/sounds';
import {
  STORE_PRODUCTS,
  getProStatus,
  purchaseLives,
  awaitPurchasedLives,
  activatePro,
  refreshEntitlements,
  ENTITLEMENTS_EVENT,
  type StoreProduct,
} from '@/lib/premiumSystem';
import { getEnergy } from '@/lib/energySystem';
import { useI18n } from '@/i18n';
import { paymentProvider, paymentProviderKind } from '@/lib/paymentProvider';
import { displayPrice, localPrice, useLocalPrices } from '@/lib/storePrices';
import { discountedUsd, offerFor, useStoreOffers, type ProductOffer } from '@/lib/storeOffers';
import ScreenHeader from '@/components/ui/ScreenHeader';

interface StoreScreenProps {
  onClose: () => void;
}

export default function StoreScreen({ onClose }: StoreScreenProps) {
  const { t, locale } = useI18n();
  const [proStatus, setProStatus] = useState(getProStatus());
  const [energy, setEnergy] = useState(getEnergy());
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const liveProducts = STORE_PRODUCTS.filter(p => p.type === 'lives');
  const proProducts = STORE_PRODUCTS.filter(p => p.type !== 'lives');

  const handlePurchase = useCallback(async (product: StoreProduct) => {
    setPurchasing(product.id);
    setPurchaseMessage(null);

    try {
      const result = await paymentProvider.purchase(product.id, { campaign: offerOfRef.current(product)?.kind === 'campaign' });

      if (!result.success) {
        // Si el usuario canceló, no mostramos error.
        if (result.code === 'login_required') {
          setPurchaseMessage(t('store_loginRequired'));
        } else if (!result.cancelled) {
          setPurchaseMessage(result.error || t('store_purchaseError'));
        }
        return;
      }

      // Si abrió un checkout externo (Mercado Pago web), NO acreditar en cliente:
      // el webhook del servidor acredita tras el pago real. Aquí solo redirige.
      if (result.redirecting) {
        return;
      }

      // (Solo proveedores nativos que confirman en el cliente, p.ej. RevenueCat)
      // Payment succeeded — apply the entitlement locally
      if (product.type === 'lives') {
        if (paymentProviderKind === 'mock') {
          purchaseLives(product.id); // pruebas locales: no hay servidor que las registre
          setEnergy(getEnergy());
          setPurchaseMessage(t('store_livesAdded', { count: String(product.lives) }));
        } else {
          // Google Play: el servidor registra la compra y desde ahí se recoge (no se pierde si el pago tarda)
          setPurchaseMessage(t('store_livesCrediting'));
          const n = await awaitPurchasedLives();
          setEnergy(getEnergy());
          setPurchaseMessage(n > 0 ? t('store_livesAdded', { count: String(n) }) : t('store_livesSoon'));
        }
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

  const handleRestorePurchases = useCallback(async () => {
    setRestoring(true);
    setPurchaseMessage(null);

    try {
      const result = await paymentProvider.restorePurchases();
      if (!result.success) {
        setPurchaseMessage(result.code === 'login_required' ? t('store_loginRequired') : result.error || t('store_purchaseError'));
        return;
      }
      // Servidor (compras web) + tienda nativa (RevenueCat): Pro y vidas pendientes
      const ent = await refreshEntitlements();
      setProStatus(getProStatus());
      setEnergy(getEnergy());
      if (ent.livesAdded > 0) setPurchaseMessage(t('store_livesAdded', { count: String(ent.livesAdded) }));
      else if (ent.isPro) setPurchaseMessage(t('store_proActivated'));
      else setPurchaseMessage(t('store_noPurchasesToRestore'));
    } catch {
      setPurchaseMessage(t('store_purchaseError'));
    } finally {
      setRestoring(false);
    }
  }, []);

  // Al abrir la tienda y cuando llega una compra: traer lo acreditado por el servidor
  useEffect(() => {
    const sync = () => { setProStatus(getProStatus()); setEnergy(getEnergy()); };
    refreshEntitlements().then(sync).catch(() => {});
    window.addEventListener(ENTITLEMENTS_EVENT, sync);
    return () => window.removeEventListener(ENTITLEMENTS_EVENT, sync);
  }, []);

  // Textos del producto traducidos por id (premiumSystem guarda los de español como respaldo)
  const txt = (p: StoreProduct, field: 'label' | 'desc' | 'badge'): string => {
    const k = `prod_${p.id}_${field}`;
    const v = t(k as never);
    if (v && v !== k) return v;
    return field === 'label' ? p.label : field === 'desc' ? p.description : (p.badge ?? '');
  };
  // App nativa: el precio de Google Play en la moneda del jugador; web: US$ del catálogo
  useLocalPrices();
  const price = (p: StoreProduct) => displayPrice(p, { month: t('store_perMonth'), year: t('store_perYear') });

  // ── Ofertas reales (docs/GeoSpeed_Ofertas.md): bienvenida en Pro mensual y campañas con fecha ──
  const offers = useStoreOffers();
  const native = paymentProviderKind === 'revenuecat';
  /** Precio de la oferta en Google Play (solo llega si Google se la ofrece a este jugador) */
  const playOfferPrice = (p: StoreProduct, o: ProductOffer) =>
    o.kind === 'welcome' ? localPrice('pro_monthly@welcome') : p.id === 'pro_yearly' ? localPrice('pro_yearly@campaign') : p.id === 'pro_lifetime' ? localPrice('pro_lifetime_promo') : null;
  const offerOf = (p: StoreProduct): ProductOffer | null => {
    let o = offerFor(p.id, offers);
    // En la app la bienvenida la decide Google: se muestra si Google trae su precio aunque el servidor no lo sepa
    if (!o && native && p.id === 'pro_monthly' && offers?.welcome && localPrice('pro_monthly@welcome')) o = { kind: 'welcome', percent: offers.welcome.percent };
    if (o && native && !playOfferPrice(p, o)) return null; // sin la oferta configurada en Play no se promete
    return o;
  };
  const offerOfRef = useRef(offerOf);
  offerOfRef.current = offerOf;
  const periodSuffix = (p: StoreProduct) => (p.type === 'pro_monthly' ? t('store_perMonth') : p.type === 'pro_yearly' ? t('store_perYear') : '');
  const offerPrice = (p: StoreProduct, o: ProductOffer) => `${native ? playOfferPrice(p, o) : discountedUsd(p.priceCents, o.percent)}${periodSuffix(p)}`;
  const offerLabel = (o: ProductOffer) => o.kind === 'welcome'
    ? t('store_offerWelcome', { p: o.percent })
    : t('store_offerCampaign', {
        name: locale === 'en' ? o.campaign!.name_en : o.campaign!.name_es,
        p: o.percent,
        date: new Date(o.campaign!.ends_at).toLocaleString(locale === 'en' ? 'en' : 'es', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
      });

  const livesPill = (
    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
      {energy.unlimited ? (
        <span className="text-sm font-bold" aria-label={t('store_infiniteLives')}>❤️ <span aria-hidden>∞</span></span>
      ) : energy.lives > energy.maxLives ? (
        <span className="text-sm font-bold">❤️ <span className="font-mono">×{energy.lives}</span></span>
      ) : (
        <>
          {Array.from({ length: energy.maxLives }).map((_, i) => (
            <span key={i} className="text-sm" style={{ opacity: i < energy.lives ? 1 : 0.2, filter: i < energy.lives ? 'none' : 'grayscale(1)' }}>❤️</span>
          ))}
          <span className="text-xs font-mono font-bold text-muted-foreground ml-1">{energy.lives}/{energy.maxLives}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-5xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onClose} title={t('store_title')} subtitle={t('store_subtitle')} right={livesPill} />

        {/* Confirmación de compra */}
        {purchaseMessage && (
          <div className="mb-4 p-3 rounded-2xl border border-primary/40 bg-primary/10 text-center animate-fade-in-up" role="status">
            <p className="text-sm font-bold text-primary">{purchaseMessage}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[1.15fr_1fr] md:items-start">
          {/* ══ GeoSpeed Pro ══ */}
          {!proStatus.isPro ? (
            <section className="rounded-3xl border border-border bg-card/70 p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl" aria-hidden>👑</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black leading-tight">GeoSpeed <span className="text-primary">Pro</span></h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('store_proDesc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { emoji: '♾️', label: t('store_infiniteLives') },
                  { emoji: '🚫', label: t('store_noAds') },
                  { emoji: '🏆', label: t('store_exclusiveBadge') },
                ].map(b => (
                  <div key={b.label} className="text-center p-2 sm:p-2.5 rounded-2xl border border-border bg-muted/20">
                    <span className="text-xl sm:text-2xl block">{b.emoji}</span>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-bold leading-tight">{b.label}</p>
                  </div>
                ))}
              </div>

              {/* La "Oferta de hoy" con cuenta atrás no tenía descuento detrás (auditoría 2026-11-16, P6): fuera hasta
                  que existan descuentos reales con precio rebajado en Google Play y Mercado Pago */}
              <div className="flex flex-col gap-3">
                {proProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handlePurchase(product)}
                    disabled={purchasing === product.id}
                    className={`relative w-full flex items-center gap-3 p-3 sm:p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                      product.highlight
                        ? 'border-primary bg-primary/10 hover:bg-primary/15 shadow-[0_0_18px_hsl(var(--primary)/0.25)]'
                        : 'border-border bg-muted/20 hover:border-accent/60'
                    } ${purchasing === product.id ? 'opacity-60' : ''}`}
                  >
                    {product.highlight && (
                      <span className="absolute -top-2.5 left-4 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
                        {t('store_recommended')}
                      </span>
                    )}
                    <span className="text-2xl sm:text-3xl shrink-0" aria-hidden>{product.emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-black text-sm sm:text-base">{txt(product, 'label')}</span>
                      <span className="block text-[11px] sm:text-xs text-muted-foreground leading-snug">{txt(product, 'desc')}</span>
                      {(() => { const o = offerOf(product); return o ? <span className="inline-block mt-1 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full bg-primary/20 text-primary leading-snug">{offerLabel(o)}</span> : null; })()}
                    </span>
                    <span className="shrink-0 text-right">
                      {(() => {
                        const o = offerOf(product);
                        if (!o) return <span className="block font-black font-mono text-base sm:text-lg text-primary">{price(product)}</span>;
                        return (
                          <>
                            <span className="block text-[11px] font-mono text-muted-foreground line-through">{price(product)}</span>
                            <span className="block font-black font-mono text-base sm:text-lg text-primary">{offerPrice(product, o)}</span>
                          </>
                        );
                      })()}
                      {product.badge && (
                        <span className="inline-block mt-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">{txt(product, 'badge')}</span>
                      )}
                    </span>
                    {purchasing === product.id && (
                      <span className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-2xl"><span className="animate-spin text-xl">⏳</span></span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border-2 border-primary bg-primary/10 p-5 text-center">
              <span className="text-4xl block mb-1" aria-hidden>👑</span>
              <h2 className="text-xl sm:text-2xl font-black text-primary">{t('store_youArePro')}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {proStatus.source === 'lifetime'
                  ? t('store_lifetimeAccess')
                  : proStatus.expiresAt
                  ? t('store_activeUntil', { date: new Date(proStatus.expiresAt).toLocaleDateString(locale === 'en' ? 'en' : 'es', { day: 'numeric', month: 'long', year: 'numeric' }) })
                  : t('store_activeSubscription')}
              </p>
            </section>
          )}

          {/* ══ Paquetes de vidas ══ */}
          <div className="flex flex-col gap-4">
            <section className="rounded-3xl border border-border bg-card/70 p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-black">❤️ {t('store_livesPacks')}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">{t('store_instantRecharge')}</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {liveProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handlePurchase(product)}
                    disabled={purchasing === product.id}
                    className={`relative flex flex-col items-center gap-1 p-3 sm:p-4 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                      product.badge ? 'border-primary/70 bg-primary/10 hover:border-primary' : 'border-border bg-muted/20 hover:border-accent/60'
                    } ${purchasing === product.id ? 'opacity-60' : ''}`}
                  >
                    {product.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                        {txt(product, 'badge')}
                      </span>
                    )}
                    <span className="text-3xl" aria-hidden>{product.emoji}</span>
                    <span className="font-black text-xs sm:text-sm">{txt(product, 'label')}</span>
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground text-center leading-tight">{txt(product, 'desc')}</span>
                    <span className="font-black font-mono text-sm sm:text-base mt-1 text-primary">{price(product)}</span>
                    {purchasing === product.id && (
                      <span className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-2xl"><span className="animate-spin text-lg">⏳</span></span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <div className="text-center">
              <button
                onClick={handleRestorePurchases}
                disabled={restoring}
                className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-xl border border-border/60 hover:border-border bg-card/50 active:scale-[0.97] disabled:opacity-50"
              >
                {restoring ? '⏳ ' : '🔄 '}{t('store_restorePurchases')}
              </button>
              {/* Web: se muestra en US$ pero la cuenta de Mercado Pago (Colombia) cobra en COP */}
              {paymentProviderKind === 'mercadopago' && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-3 max-w-xl mx-auto">{t('store_webCurrencyNote')}</p>
              )}
              {/* AUD03: en la web Pro mensual/anual son pagos únicos; solo en Google Play hay suscripción que cancelar */}
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-3 pb-4">{t(paymentProviderKind === 'mercadopago' ? 'store_paymentNoteWeb' : 'store_paymentNote')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
