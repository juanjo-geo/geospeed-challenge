import { useEffect, useState } from 'react';
import { type FrustrationOffer, markOfferShown } from '@/lib/frustrationDetector';
import { playButtonTap } from '@/lib/sounds';
import { trackEvent } from '@/lib/analytics';

interface FrustrationOfferModalProps {
  offer: FrustrationOffer;
  onAccept: (action: string) => void;
  onDismiss: () => void;
}

export default function FrustrationOfferModal({ offer, onAccept, onDismiss }: FrustrationOfferModalProps) {
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
    low: { bg: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/40', cta: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    medium: { bg: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/40', cta: 'linear-gradient(135deg, #f59e0b, #ea580c)' },
    high: { bg: 'from-red-500/20 to-pink-500/10', border: 'border-red-500/40', cta: 'linear-gradient(135deg, #ef4444, #ec4899)' },
  };

  const colors = urgencyColors[offer.urgency];

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label={offer.headline}
    >
      <div
        className={`bg-card border-2 ${colors.border} rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl transform transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-sm transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* Emoji hero */}
        <div className="text-center mb-3">
          <span
            className="text-5xl block animate-bounce"
            style={{ animationDuration: '1.5s', animationIterationCount: '2' }}
          >
            {offer.emoji}
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-center font-black text-lg sm:text-xl text-foreground mb-1">
          {offer.headline}
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-5">
          {offer.subtext}
        </p>

        {/* CTA Button */}
        <button
          onClick={handleAccept}
          className="w-full py-3.5 rounded-xl font-black text-base sm:text-lg transition-all active:scale-[0.95] shadow-lg hover:scale-[1.02] hover:brightness-110"
          style={{
            background: colors.cta,
            color: '#fff',
            boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
          }}
        >
          {offer.ctaLabel}
        </button>

        {/* Dismiss link */}
        <button
          onClick={handleDismiss}
          className="w-full mt-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          No gracias, seguir jugando
        </button>
      </div>
    </div>
  );
}
