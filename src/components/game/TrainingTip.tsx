import { useI18n } from '@/i18n';
import { itemHint, useCityTips } from '@/lib/cityHints';
import type { City } from '@/data/cities';

/** Entrenamiento y repaso (Fase 4): el dato del lugar en la tarjeta de respuesta, para recordarlo */
export default function TrainingTip({ city }: { city: City }) {
  const { t, locale } = useI18n();
  useCityTips(); // la pista escrita a mano llega en su propio archivo; hasta entonces, la generada
  return (
    <div className="rounded-xl border border-accent/40 bg-background/40 px-3 py-2 text-left text-xs sm:text-sm leading-snug">
      <span className="font-extrabold text-accent">{t('train_remember')} </span>
      <span className="text-foreground/90">{itemHint(city, locale === 'en' ? 'en' : 'es')}</span>
    </div>
  );
}
