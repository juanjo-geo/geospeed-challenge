import { useEffect, useState } from 'react';
import type { City } from '@/data/cities';
import { useI18n } from '@/i18n';
import { playAccordion, playButtonTap } from '@/lib/sounds';
import { isFeature, isFlag } from '@/lib/catalog';
import { factIdOf, factRows, nearNames, usePlaceFacts, usePlaceTrivia } from '@/lib/placeFacts';
import { isReviewable, practicePlace } from '@/lib/itemMemory';

interface PlaceSheetProps {
  item: City;
  /** Mundial: el elemento es el país del futbolista (su ficha es la del país) */
  isMundial?: boolean;
  className?: string;
}

/**
 * Ficha del lugar (Fase 8, spec §11) en la revisión del final de la partida: cifras de Wikidata, dato curioso y lugares
 * cercanos. Cerrada muestra las dos primeras cifras y el dato curioso recortado; al tocarla se expande con todo y el
 * botón "Practicar este lugar" (lo manda al repaso de hoy).
 */
/** Nombre de un país por su ISO en el idioma del juego */
function isoName(iso: string, locale: string): string {
  try { return new Intl.DisplayNames([locale], { type: 'region' }).of(iso) ?? iso; } catch { return iso; }
}

export default function PlaceSheet({ item, isMundial = false, className = '' }: PlaceSheetProps) {
  const { t, locale } = useI18n();
  const facts = usePlaceFacts();
  const trivia = usePlaceTrivia();
  const [open, setOpen] = useState(false);
  const [practice, setPractice] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const id = factIdOf(isMundial ? { ...item, id: undefined } : item);
  useEffect(() => { setOpen(false); setPractice('idle'); }, [id]);

  const fact = id ? facts?.[id] ?? null : null;
  const lang = locale === 'en' ? 1 : 0;
  const curious = id ? trivia?.[id]?.[lang] ?? null : null;
  // En el Mundial el elemento es el futbolista: las filas son las del país
  const sheetItem = isMundial && id ? { ...item, id, kind: 'flag' as const } : item;
  const rows = factRows(sheetItem, fact, t as never, locale);
  const near = nearNames(fact, locale);
  const countries = isFeature(item) ? (item.isos ?? []).map((iso) => isoName(iso, locale)) : [];
  const canPractice = !!id && isReviewable(isMundial ? { id, kind: 'flag' } : item);
  if (!rows.length && !curious && !near.length) return null;

  const shown = open ? rows : rows.slice(0, 2);
  const toggle = () => { playAccordion(!open); setOpen((v) => !v); };
  const doPractice = async () => {
    if (!id || practice === 'saving' || practice === 'done') return;
    playButtonTap();
    setPractice('saving');
    setPractice((await practicePlace(id)) === 'ok' ? 'done' : 'error');
  };
  const nearKey = isFlag(sheetItem) || item.kind === 'division' ? 'fact_mainPlaces' : 'fact_near';

  return (
    <section className={`rounded-xl border-2 border-accent/35 bg-background/40 ${className}`} aria-label={t('fact_sheetTitle')}>
      <button type="button" onClick={toggle} aria-expanded={open} className="w-full text-left px-3 pt-2.5 pb-2 short:px-2 short:pt-1.5 short:pb-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-sm sm:text-base short:text-xs">📋 {t('fact_sheetTitle')}</span>
          {fact?.unesco && <span className="shrink-0 rounded-full border border-primary/60 text-primary px-2 py-0.5 text-[10px] sm:text-xs font-bold">🏛️ {t('fact_unesco')}</span>}
        </span>
        {shown.length > 0 && (
          <span className="mt-1.5 short:mt-1 grid grid-cols-2 gap-1.5">
            {shown.map((r) => (
              <span key={r.label} className="rounded-lg bg-muted/30 px-2 py-1.5 short:py-1 min-w-0">
                <span className="block text-[10px] sm:text-xs text-muted-foreground leading-tight truncate"><span aria-hidden>{r.icon}</span> {r.label}</span>
                <span className="block font-extrabold text-sm sm:text-base short:text-xs leading-tight text-primary break-words">{r.value}</span>
              </span>
            ))}
          </span>
        )}
        {curious && (
          <span className={`mt-1.5 short:mt-1 block text-xs sm:text-sm short:text-[11px] leading-snug ${open ? '' : 'line-clamp-2'}`}>
            <b className="text-accent">💡 {t('fact_curious')}:</b> {curious}
          </span>
        )}
        <span className="mt-1 flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold text-accent">
          {open ? t('fact_less') : t('fact_more')} <span className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>⌄</span>
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 short:px-2 short:pb-2 flex flex-col gap-2 short:gap-1.5 text-xs sm:text-sm short:text-[11px] animate-fade-in">
          {near.length > 0 && <p><b>📍 {t(nearKey as never)}:</b> {near.join(' · ')}</p>}
          {countries.length > 0 && <p><b>🌎 {t('fact_countries')}:</b> {countries.join(', ')}</p>}
          {canPractice && (
            <button
              type="button"
              onClick={doPractice}
              disabled={practice === 'saving' || practice === 'done'}
              className="rounded-xl border-2 border-primary/70 text-primary py-2 short:py-1 font-bold hover:bg-primary/10 transition-colors disabled:opacity-80"
            >
              {practice === 'done' ? `✓ ${t('fact_practiceDone')}` : practice === 'saving' ? '…' : `🎯 ${t('fact_practice')}`}
            </button>
          )}
          {practice === 'error' && <p className="text-destructive text-center">{t('fact_practiceFail')}</p>}
          {fact?.q && <p className="text-[10px] text-muted-foreground text-center">{t('fact_source')}</p>}
        </div>
      )}
    </section>
  );
}
