import { lazy, Suspense, useState } from 'react';
import type { City } from '@/data/cities';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import { itemTitle } from '@/lib/catalog';
import { factIdOf, factRows, usePlaceFacts, usePlaceTrivia } from '@/lib/placeFacts';
import { mundialStoryItem } from '@/lib/placeStory';

const PlaceStoryModal = lazy(() => import('./PlaceStoryModal'));

interface PlaceSheetProps {
  item: City;
  /** Mundial: el elemento es el país del futbolista (su ficha es la del país) */
  isMundial?: boolean;
  className?: string;
}

/**
 * Ficha del lugar (Fase 8, spec §11) en la revisión del final de la partida: las dos primeras cifras de Wikidata y el
 * dato curioso recortado. "Ver más sobre X" abre la reseña completa (PlaceStoryModal: fotos, todas las cifras,
 * lugares cercanos y "Practicar este lugar").
 */
export default function PlaceSheet({ item, isMundial = false, className = '' }: PlaceSheetProps) {
  const { t, locale } = useI18n();
  const facts = usePlaceFacts();
  const trivia = usePlaceTrivia();
  const [storyOpen, setStoryOpen] = useState(false);
  // En el Mundial el elemento es el futbolista: la ficha y la reseña son las del país
  const storyItem = isMundial ? mundialStoryItem(item.country) : item;
  const id = factIdOf(storyItem ?? (isMundial ? { ...item, id: undefined } : item));
  const fact = id ? facts?.[id] ?? null : null;
  const curious = id ? trivia?.[id]?.[locale === 'en' ? 1 : 0] ?? null : null;
  const rows = factRows(storyItem ?? item, fact, t as never, locale).slice(0, 2);
  if (!storyItem && !rows.length && !curious) return null;

  return (
    <section className={`rounded-xl border-2 border-accent/35 bg-background/40 px-3 pt-2.5 pb-2 short:px-2 short:pt-1.5 short:pb-1 ${className}`} aria-label={t('fact_sheetTitle')}>
      <p className="flex items-center justify-between gap-2">
        <span className="font-extrabold text-sm sm:text-base short:text-xs">📋 {t('fact_sheetTitle')}</span>
        {fact?.unesco && <span className="shrink-0 rounded-full border border-primary/60 text-primary px-2 py-0.5 text-[10px] sm:text-xs font-bold">🏛️ {t('fact_unesco')}</span>}
      </p>
      {rows.length > 0 && (
        <span className="mt-1.5 short:mt-1 grid grid-cols-2 gap-1.5">
          {rows.map((r) => (
            <span key={r.label} className="rounded-lg bg-muted/30 px-2 py-1.5 short:py-1 min-w-0">
              <span className="block text-[10px] sm:text-xs text-muted-foreground leading-tight truncate"><span aria-hidden>{r.icon}</span> {r.label}</span>
              <span className="block font-extrabold text-sm sm:text-base short:text-xs leading-tight text-primary break-words">{r.value}</span>
            </span>
          ))}
        </span>
      )}
      {curious && (
        <p className="mt-1.5 short:mt-1 text-xs sm:text-sm short:text-[11px] leading-snug line-clamp-2">
          <b className="text-accent">💡 {t('fact_curious')}:</b> {curious}
        </p>
      )}
      {storyItem && (
        <button
          type="button"
          onClick={() => { playButtonTap(); setStoryOpen(true); }}
          className="mt-1.5 short:mt-1 w-full rounded-lg border border-accent/50 bg-accent/10 text-accent font-bold py-1.5 short:py-1 text-xs sm:text-sm hover:bg-accent/20 transition-colors"
        >
          🔎 {t('story_more', { name: itemTitle(storyItem, locale) })} ›
        </button>
      )}
      {storyOpen && storyItem && (
        <Suspense fallback={null}><PlaceStoryModal item={storyItem} source="review" onClose={() => setStoryOpen(false)} /></Suspense>
      )}
    </section>
  );
}
