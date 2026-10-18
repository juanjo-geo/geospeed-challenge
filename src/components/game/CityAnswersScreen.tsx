import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { type RoundResult } from './GameScreen';
import { formatDistance } from '@/lib/gameUtils';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';
import Flag from '@/components/ui/Flag';
import { appNumberLocale, formatNumber } from '@/lib/format';
import { HudIconButton } from './GameHud';
import { PinIcon, StopwatchIcon, HomeIcon, ChevronIcon, BookIcon, CityIcon } from '@/components/ui/icons';
const WorldBackdrop = lazy(() => import('./WorldBackdrop'));

interface CityAnswersScreenProps {
  rounds: RoundResult[];
  /** Mundial: las filas son futbolistas y el país es el lugar a ubicar */
  isMundial?: boolean;
  /** Ciudad a mostrar al abrir (al volver de la revisión se abre la página de esa ciudad) */
  focusIndex?: number;
  onOpenCity: (index: number) => void;
  onReviewAll: () => void;
  onClose: () => void;
}

/** Filas por página según el alto disponible (celular horizontal ≈ 320-375 px). */
function useRowsPerPage(): number {
  const calc = () => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return h <= 340 ? 3 : h <= 430 ? 4 : h <= 600 ? 5 : 6;
  };
  const [rows, setRows] = useState(calc);
  useEffect(() => {
    const onResize = () => setRows(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return rows;
}

/** "Tus respuestas por ciudad" (maqueta Respuestas_Por_Ciudad_APROBADA_v1). */
export default function CityAnswersScreen({ rounds, isMundial = false, focusIndex = 0, onOpenCity, onReviewAll, onClose }: CityAnswersScreenProps) {
  const { t } = useI18n();
  const perPage = useRowsPerPage();
  const pages = Math.max(1, Math.ceil(rounds.length / perPage));
  const [page, setPage] = useState(() => Math.min(Math.floor(focusIndex / perPage), pages - 1));
  useEffect(() => { setPage(p => Math.min(p, pages - 1)); }, [pages]);

  const bestIdx = useMemo(() => {
    let b = -1, bp = -1;
    rounds.forEach((r, i) => { if (r.totalPoints > bp) { bp = r.totalPoints; b = i; } });
    return bp > 0 ? b : -1;
  }, [rounds]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setPage(p => Math.min(pages - 1, p + 1));
      else if (e.key === 'ArrowLeft') setPage(p => Math.max(0, p - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pages]);

  const from = page * perPage;
  const slice = rounds.slice(from, from + perPage);
  const cols = 'grid-cols-[1.5rem_minmax(0,1fr)_3.75rem_3rem_2.75rem] min-[520px]:grid-cols-[2rem_minmax(0,1fr)_4.5rem_3.5rem_4rem_4.75rem] md:grid-cols-[3rem_minmax(0,1fr)_7rem_6rem_6rem_8rem]';

  return (
    <div className="fixed inset-0 z-[105] isolate flex flex-col animate-fade-in" role="dialog" aria-modal="true" aria-label={t('answers_title')}
      style={{ background: 'hsl(var(--brand-navy-deep))', padding: 'max(0.5rem, var(--sat)) max(0.75rem, var(--sar)) max(0.5rem, var(--sab)) max(0.75rem, var(--sal))' }}>
      {/* Mapa de continentes tenue detrás (como el cierre) */}
      <div className="absolute inset-0 pointer-events-none opacity-45 -z-10" aria-hidden>
        <Suspense fallback={null}><WorldBackdrop tone="continents" /></Suspense>
      </div>
      <div className="absolute inset-0 pointer-events-none -z-10" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 45%, hsl(var(--brand-navy) / 0.25), hsl(var(--brand-navy-deep) / 0.7))' }} aria-hidden />
      {/* Cabecera */}
      <div className="relative shrink-0 flex flex-col items-center text-center mb-2 short:mb-1">
        <div className="flex items-center gap-2 short:hidden">
          <img src="/mascot/explorer-logo.webp" alt="" className="w-9 h-9 sm:w-11 sm:h-11 object-contain" />
          <Wordmark size="md" />
        </div>
        <h2 className="text-2xl sm:text-[2.6rem] short:text-lg font-extrabold leading-tight mt-1 short:mt-0 pr-12 pl-12">
          {t('answers_titleLead')} <span className="text-accent">{isMundial ? t('answers_titlePlayer') : t('answers_titleCity')}</span>
        </h2>
        <p className="text-sm sm:text-base text-foreground/80 short:hidden">{t('answers_sub')}</p>
        <span className="absolute right-0 top-0"><HudIconButton icon="close" label={t('close')} onClick={() => { playButtonTap(); onClose(); }} size="md" /></span>
      </div>

      {/* Tabla */}
      <div className="flex-initial min-h-0 w-full max-w-5xl mx-auto rounded-3xl border-2 border-accent/30 bg-card/85 backdrop-blur-md p-2 sm:p-4 short:p-2 flex flex-col">
        <p className="text-right text-[11px] sm:text-xs text-muted-foreground px-1 mb-1 short:mb-0.5">
          {t('answers_range', { from: from + 1, to: from + slice.length, total: rounds.length })}
        </p>
        <div className={`grid ${cols} gap-1.5 items-center px-2 py-2 short:py-1 rounded-xl bg-background/40 border border-border/60 text-[10px] sm:text-sm font-semibold text-foreground/80`}>
          <span className="text-center">N.º</span>
          <span>{isMundial ? t('rb_player') : t('rb_city')}</span>
          <span className="flex items-center justify-center gap-1.5"><PinIcon className="w-4 h-4 text-accent" /><span className="hidden sm:inline">{t('game_distance')}</span><span className="sm:hidden">{t('rb_dist')}</span></span>
          <span className="hidden min-[520px]:flex items-center justify-center gap-1.5"><StopwatchIcon className="w-4 h-4" /><span className="hidden md:inline">{t('game_time')}</span></span>
          <span className="flex items-center justify-center gap-1.5"><span aria-hidden>🏆</span><span className="hidden md:inline">{t('game_points')}</span></span>
          <span className="flex items-center justify-center gap-1.5"><CityIcon className="w-4 h-4 text-foreground/70" /><span className="hidden md:inline">{t('answers_map')}</span></span>
        </div>

        <div className="flex-initial min-h-0 overflow-y-auto mt-1 flex flex-col gap-1">
          {slice.map((r, i) => {
            const idx = from + i;
            const isBest = idx === bestIdx;
            return (
              <div key={idx} className={`grid ${cols} gap-1.5 items-center px-2 py-1.5 sm:py-2 short:py-1 rounded-xl border ${isBest ? 'border-accent bg-accent/10 shadow-[0_0_14px_hsl(var(--accent)/0.25)]' : 'border-transparent border-b-border/50 rounded-none'}`}>
                <span className={`mx-auto w-6 h-6 sm:w-8 sm:h-8 short:w-6 short:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-black ${isBest ? 'bg-accent text-accent-foreground' : 'bg-muted/60'}`}>{idx + 1}</span>
                <span className="flex items-center gap-2 min-w-0">
                  <Flag country={r.city.country} className="w-7 sm:w-9 short:w-7" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-sm sm:text-lg truncate">{r.city.name}</span>
                      {isBest && (
                        <span className="shrink-0 rounded-full border-2 border-primary/80 text-primary px-2 py-px text-[10px] sm:text-sm font-bold">
                          👑<span className="hidden sm:inline"> {t('answers_best')}</span>
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] sm:text-xs text-muted-foreground truncate">{r.city.country}</span>
                  </span>
                </span>
                <span className="text-center font-bold text-xs sm:text-lg">{formatDistance(r.distance)}</span>
                <span className="text-center font-bold text-xs sm:text-lg hidden min-[520px]:block">{formatNumber(r.timeExact ?? r.timeUsed, 1)} s</span>
                <span className="text-center font-extrabold text-xs sm:text-xl text-primary">{r.totalPoints.toLocaleString(appNumberLocale())}</span>
                <button
                  onClick={() => { playButtonTap(); onOpenCity(idx); }}
                  className="justify-self-stretch rounded-xl border-2 border-accent/70 text-foreground font-bold text-xs sm:text-base py-1.5 short:py-1 hover:bg-accent/10 transition-colors active:scale-[0.97] flex items-center justify-center gap-1.5"
                  aria-label={`${t('answers_view')} ${r.city.name}`}
                >
                  <PinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" /><span className="hidden min-[520px]:inline">{t('answers_view')}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Pie: volver · paginador · repasar */}
        <div className="shrink-0 mt-2 short:mt-1.5 grid grid-cols-2 min-[520px]:grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <button onClick={() => { playButtonTap(); onClose(); }} className="rounded-2xl border-2 border-foreground/25 bg-background/30 py-2.5 sm:py-3 short:py-2 px-2 font-bold text-xs sm:text-base hover:bg-muted/50 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 min-w-0">
            <HomeIcon className="w-5 h-5" /><span className="truncate">{t('answers_backToResult')}</span>
          </button>
          <div className="flex items-center justify-center gap-1.5 col-span-2 order-first min-[520px]:col-span-1 min-[520px]:order-none">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl border border-accent/40 bg-background/40 flex items-center justify-center disabled:opacity-35 active:scale-95" aria-label={t('review_prev')}><ChevronIcon dir="left" className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <span className="font-bold text-xs sm:text-lg min-w-[3rem] text-center">{page + 1} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl border border-accent/40 bg-background/40 flex items-center justify-center disabled:opacity-35 active:scale-95" aria-label={t('review_next')}><ChevronIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
          <button onClick={() => { playButtonTap(); onReviewAll(); }} className="btn3d rounded-2xl py-2.5 sm:py-3 short:py-2 px-2 font-black text-xs sm:text-lg text-primary-foreground flex items-center justify-center gap-2 min-w-0" style={{ background: 'var(--grad-cta)' }}>
            <BookIcon className="w-5 h-5 sm:w-7 sm:h-7" /><span className="truncate">{t('answers_reviewAll')}</span>
          </button>
        </div>
        <p className="text-center text-[10px] sm:text-sm text-foreground/70 mt-2 short:hidden">{t('answers_tapHint')}</p>
      </div>
    </div>
  );
}
