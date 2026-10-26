import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { City } from '@/data/cities';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import { isFeature, isFlag, itemSubtitle, itemTitle } from '@/lib/catalog';
import { factIdOf, factRows, nearNames, usePlaceFacts, usePlaceTrivia } from '@/lib/placeFacts';
import { itemHint, useCityTips } from '@/lib/cityHints';
import { isReviewable, practicePlace } from '@/lib/itemMemory';
import { storySlides, useSlideCredits, type PhotoCreditInfo, type StorySlide } from '@/lib/placeStory';
import { prefersReducedMotion } from '@/lib/prefs';
import { trackEvent } from '@/lib/analytics';
import Flag from '@/components/ui/Flag';
import { HudIconButton } from './GameHud';

interface PlaceStoryModalProps {
  item: City;
  /** Desde dónde se abrió (para la medición): la tarjeta de respuesta o la revisión final */
  source: 'card' | 'review';
  onClose: () => void;
}

/** Nombre de un país por su ISO en el idioma del juego */
function isoName(iso: string, locale: string): string {
  try { return new Intl.DisplayNames([locale], { type: 'region' }).of(iso) ?? iso; } catch { return iso; }
}

/**
 * Reseña del lugar ("Conoce Medellín", docs/GeoSpeed_Resena_Lugar_Diseno.md): carrusel de fotos con créditos, cifras
 * de la ficha, dato curioso, pista para ubicarlo, lugares cercanos y "Practicar este lugar". Se abre desde la tarjeta
 * de respuesta (la partida pausa el avance mientras está abierta) y desde la revisión final.
 */
export default function PlaceStoryModal({ item, source, onClose }: PlaceStoryModalProps) {
  const { t, locale } = useI18n();
  const facts = usePlaceFacts();
  const trivia = usePlaceTrivia();
  useCityTips();
  const [practice, setPractice] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const id = factIdOf(item);
  const fact = id ? facts?.[id] ?? null : null;
  const lang = locale === 'en' ? 'en' : 'es';
  const curious = id ? trivia?.[id]?.[lang === 'en' ? 1 : 0] ?? null : null;
  const rows = factRows(item, fact, t as never, locale);
  const near = nearNames(fact, locale);
  const countries = isFeature(item) ? (item.isos ?? []).map((iso) => isoName(iso, locale)) : [];
  const hint = itemHint(item, lang);
  const slides = useMemo(() => storySlides(item, fact, locale), [item, fact, locale]);
  const credits = useSlideCredits(slides);
  const canPractice = !!id && isReviewable(item);
  const name = itemTitle(item, locale);
  const nearKey = isFlag(item) || item.kind === 'division' ? 'fact_mainPlaces' : 'fact_near';
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    trackEvent('place_story_open', { kind: item.kind ?? 'city', source });
    closeRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => { playButtonTap(); onClose(); }, [onClose]);
  // Esc cierra solo la reseña (la revisión de debajo también escucha Esc y las flechas)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.stopPropagation(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [close]);

  const doPractice = async () => {
    if (!id || practice === 'saving' || practice === 'done') return;
    playButtonTap();
    setPractice('saving');
    const r = await practicePlace(id);
    setPractice(r === 'ok' ? 'done' : 'error');
    if (r === 'ok') trackEvent('place_story_practice', { kind: item.kind ?? 'city' });
  };

  const body = (
    <div className="modal-layer z-[140] bg-black/70 backdrop-blur-sm animate-fade-in" onClick={close} role="dialog" aria-modal="true" aria-label={t('story_title', { name })}>
      <div
        className="modal-panel w-full max-w-4xl rounded-3xl border-2 border-accent/40 bg-card shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] short:max-h-[calc(100dvh-1rem)] md:max-h-[calc(100dvh-3rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 px-4 py-3 short:px-3 short:py-1.5 border-b border-border/60 shrink-0">
          {(item.country || item.kind === 'flag') && <Flag country={item.kind === 'flag' ? item.name : item.country} className="w-8 short:w-6 shrink-0" />}
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold text-lg sm:text-2xl short:text-base leading-tight truncate">{t('story_title', { name })}</h2>
            <p className="text-muted-foreground text-xs sm:text-sm short:text-[11px] font-semibold truncate">{itemSubtitle(item, locale)}</p>
          </div>
          <span ref={closeRef as never} tabIndex={-1} className="outline-none">
            <HudIconButton icon="close" label={t('story_close')} onClick={close} size="sm" />
          </span>
        </header>

        <div className="min-h-0 flex-1 grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] short:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] overflow-y-auto md:overflow-hidden short:overflow-hidden">
          <div className="p-3 sm:p-4 short:p-2 md:min-h-0 short:min-h-0 flex flex-col">
            <Carousel slides={slides} credits={credits} />
          </div>

          <div className="p-3 sm:p-4 short:p-2 pt-0 md:pt-4 short:pt-2 md:min-h-0 short:min-h-0 md:overflow-y-auto short:overflow-y-auto flex flex-col gap-3 short:gap-2 text-sm sm:text-base short:text-xs">
            {rows.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {rows.map((r) => (
                  <div key={r.label} className="rounded-xl bg-muted/30 border border-accent/20 px-2.5 py-1.5 short:py-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate"><span aria-hidden>{r.icon}</span> {r.label}</p>
                    <p className="font-extrabold text-sm sm:text-base short:text-xs leading-tight text-primary break-words">{r.value}</p>
                  </div>
                ))}
              </div>
            )}
            {fact?.unesco && <p className="self-start rounded-full border border-primary/60 text-primary px-2.5 py-0.5 text-xs font-bold">🏛️ {t('fact_unesco')}</p>}
            {curious && (
              <section>
                <h3 className="font-black text-accent text-sm sm:text-base short:text-xs">💡 {t('fact_curious')}</h3>
                <p className="leading-snug mt-0.5">{curious}</p>
              </section>
            )}
            <section>
              <h3 className="font-black text-accent text-sm sm:text-base short:text-xs">🧭 {t('story_locate')}</h3>
              <p className="leading-snug mt-0.5">{hint}</p>
            </section>
            {near.length > 0 && (
              <section>
                <h3 className="font-black text-accent text-sm sm:text-base short:text-xs">📍 {t(nearKey as never)}</h3>
                <p className="flex flex-wrap gap-1.5 mt-1">
                  {near.map((n) => <span key={n} className="rounded-full border border-accent/40 bg-background/40 px-2.5 py-0.5 text-xs sm:text-sm">{n}</span>)}
                </p>
              </section>
            )}
            {countries.length > 0 && <p><b>🌎 {t('fact_countries')}:</b> {countries.join(', ')}</p>}

            {/* Fijos al pie de la columna: en un teléfono horizontal el texto se desplaza y los botones siguen a mano */}
            <div className="mt-auto sticky bottom-0 z-10 -mx-1 px-1 pt-2 pb-0.5 bg-card flex flex-col sm:flex-row short:flex-row gap-2">
              {canPractice && (
                <button
                  type="button"
                  onClick={doPractice}
                  disabled={practice === 'saving' || practice === 'done'}
                  className="flex-1 rounded-2xl border-2 border-primary/70 text-primary py-2.5 short:py-1.5 font-bold hover:bg-primary/10 transition-colors disabled:opacity-80 text-sm short:text-xs"
                >
                  {practice === 'done' ? `✓ ${t('fact_practiceDone')}` : practice === 'saving' ? '…' : `🎯 ${t('fact_practice')}`}
                </button>
              )}
              <button
                type="button"
                onClick={close}
                className="btn3d flex-1 rounded-2xl font-black text-primary-foreground py-2.5 short:py-1.5 text-sm sm:text-base short:text-xs tracking-wide"
                style={{ background: 'var(--grad-cta)' }}
              >
                {source === 'card' ? t('story_continue') : t('story_close')}
              </button>
            </div>
            {practice === 'error' && <p className="text-destructive text-center text-xs">{t('fact_practiceFail')}</p>}
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center">{t('story_sources')}</p>
          </div>
        </div>
      </div>
    </div>
  );
  return typeof document === 'undefined' ? body : createPortal(body, document.body);
}

/** Carrusel con desplazamiento nativo (dedo o trackpad), flechas, puntos y el crédito de cada foto */
function Carousel({ slides, credits }: { slides: StorySlide[]; credits: Record<string, PhotoCreditInfo> }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const shown = slides.filter((s) => !failed.includes(s.url));
  const current = shown[Math.min(idx, shown.length - 1)];
  const credit = current ? credits[current.url] : undefined;

  const go = useCallback((i: number) => {
    const el = ref.current;
    if (!el || !shown.length) return;
    const next = (i + shown.length) % shown.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    setIdx(next);
  }, [shown.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(idx - 1);
      else if (e.key === 'ArrowRight') go(idx + 1);
    };
    // En captura, como el de la ventana: ese corta las flechas para la revisión de debajo, no para el carrusel
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go, idx]);

  if (!shown.length) {
    return (
      <div className="aspect-[4/3] short:aspect-auto short:flex-1 rounded-2xl border-2 border-dashed border-accent/30 bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm text-center p-4">
        <span className="text-4xl" aria-hidden>🗺️</span>
        {t('story_noPhoto')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 short:min-h-0 short:flex-1">
      <div className="relative aspect-[4/3] short:aspect-auto short:min-h-0 short:flex-1 rounded-2xl overflow-hidden border-2 border-accent/30 bg-brand-navy-deep">
        <div
          ref={ref}
          className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hidden"
          onScroll={(e) => { const el = e.currentTarget; if (el.clientWidth) setIdx(Math.round(el.scrollLeft / el.clientWidth)); }}
        >
          {shown.map((s, i) => (
            <figure key={s.url} className="relative shrink-0 w-full h-full snap-center" aria-label={t('story_photoOf', { n: i + 1, total: shown.length })}>
              <img
                src={s.url}
                alt={s.caption}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="w-full h-full object-cover"
                onError={() => setFailed((f) => [...f, s.url])}
                draggable={false}
              />
              <figcaption className="absolute left-0 right-0 bottom-0 px-3 pt-6 pb-2 text-white text-sm sm:text-base short:text-xs font-bold bg-gradient-to-t from-black/75 to-transparent truncate">
                {s.caption}
              </figcaption>
            </figure>
          ))}
        </div>
        {shown.length > 1 && (
          <>
            <button type="button" onClick={() => go(idx - 1)} aria-label={t('story_prev')}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 short:w-7 short:h-7 rounded-full bg-black/55 text-white text-lg leading-none flex items-center justify-center hover:bg-black/75">‹</button>
            <button type="button" onClick={() => go(idx + 1)} aria-label={t('story_next')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 short:w-7 short:h-7 rounded-full bg-black/55 text-white text-lg leading-none flex items-center justify-center hover:bg-black/75">›</button>
            <span className="absolute right-2 top-2 rounded-full bg-black/60 text-white text-[11px] font-bold px-2 py-0.5">{Math.min(idx, shown.length - 1) + 1}/{shown.length}</span>
          </>
        )}
      </div>
      {shown.length > 1 && (
        <div className="flex justify-center gap-1.5" aria-hidden>
          {shown.map((s, i) => (
            <span key={s.url} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-accent' : 'w-1.5 bg-muted-foreground/50'}`} />
          ))}
        </div>
      )}
      <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate min-h-[1em]">
        {credit && (
          <>
            {t('story_photo')}: {credit.url
              ? <a href={credit.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{credit.author || 'Wikimedia Commons'}</a>
              : (credit.author || 'Wikimedia Commons')}
            {credit.license ? ` · ${credit.license}` : ''}
          </>
        )}
      </p>
    </div>
  );
}
