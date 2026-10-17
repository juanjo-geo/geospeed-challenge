import { useEffect, useState } from 'react';
import { type FrustrationOffer, markOfferShown } from '@/lib/frustrationDetector';
import { playButtonTap } from '@/lib/sounds';
import { trackEvent } from '@/lib/analytics';
import { useI18n } from '@/i18n';

interface FrustrationOfferModalProps {
  offer: FrustrationOffer;
  onAccept: (action: string) => void;
  onDismiss: () => void;
}

export default function FrustrationOfferModal({ offer, onAccept, onDismiss }: FrustrationOfferModalProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay for dramatic entrance
    const timer = setTimeout(() => setVisible(true), 300);
    markOfferShown();
    trackEvent('frustration_modal_shown', { type: offer.type, urgency: offer.urgency });
    return () => clearTimeout(timer);
  }, [offer]);

  const handleAccept = () => {
    playButtonTap();
    trackEvent('frustration_modal_accept', { type: offer.type, action: offer.ctaAction });
    onAccept(offer.ctaAction);
  };

  const handleDismiss = () => {
    trackEvent('frustration_modal_dismiss', { type: offer.type });
    setVisible(false);
    setTimeout(onDismiss, 200);
  };

  const urgencyColors = {
    low: { bg: '', border: 'border-accent/50', cta: 'var(--grad-cta)' },
    medium: { bg: '', border: 'border-primary/50', cta: 'var(--grad-cta)' },
    high: { bg: '', border: 'border-primary', cta: 'var(--grad-cta)' },
  };

  const colors = urgencyColors[offer.urgency];
  // Textos traducidos por variante de oferta (el detector deja los de español como respaldo)
  const k = offer.textKey;
  const headline = k ? t(`offer_${k}_head` as never) : offer.headline;
  const subtext = k ? t(`offer_${k}_sub` as never) : offer.subtext;
  const ctaLabel = k ? t(`offer_${k}_cta` as never) : offer.ctaLabel;

  return (
    <div
      className={`modal-layer z-[100] transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label={headline}
    >
      <div
        className={`modal-panel relative bg-card border-2 ${colors.border} rounded-2xl p-5 sm:p-6 short:p-4 max-w-sm w-full shadow-2xl transform transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-sm transition-colors"
          aria-label={t('close')}
        >
          ✕
        </button>

        {/* Emoji hero */}
        <div className="text-center mb-3 short:mb-1">
          <span
            className="text-5xl short:text-4xl block animate-bounce"
            style={{ animationDuration: '1.5s', animationIterationCount: '2' }}
          >
            {offer.emoji}
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-center font-black text-lg sm:text-xl text-foreground mb-1">
          {headline}
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-5 short:mb-3">
          {subtext}
        </p>

        {/* CTA Button */}
        <button
          onClick={handleAccept}
          className="btn3d w-full py-3.5 short:py-2.5 rounded-2xl font-black text-base sm:text-lg text-primary-foreground"
          style={{ background: colors.cta }}
        >
          {ctaLabel}
        </button>

        {/* Dismiss link */}
        <button
          onClick={handleDismiss}
          className="w-full mt-3 short:mt-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('offer_dismiss')}
        </button>
      </div>
    </div>
  );
}
