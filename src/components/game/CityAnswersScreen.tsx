import { useEffect, useMemo, useState } from 'react';
import { type RoundResult } from './GameScreen';
import { formatDistance } from '@/lib/gameUtils';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';
import Flag from '@/components/ui/Flag';

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
    <div className="fixed inset-0 z-[105] game-bg flex flex-col animate-fade-in" role="dialog" aria-modal="true" aria-label={t('answers_title')}
      style={{ padding: 'max(0.5rem, var(--sat)) max(0.75rem, var(--sar)) max(0.5rem, var(--sab)) max(0.75rem, var(--sal))' }}>
      {/* Cabecera */}
      <div className="relative shrink-0 flex flex-col items-center text-center mb-2 short:mb-1">
        <div className="flex items-center gap-2 short:hidden">
          <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
          <Wordmark size="sm" />
        </div>
        <h2 className="text-2xl sm:text-3xl short:text-lg font-black leading-tight mt-1 short:mt-0 pr-10 pl-10">
          {t('answers_titleLead')} <span className="text-accent">{isMundial ? t('answers_titlePlayer') : t('answers_titleCity')}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground short:hidden">{t('answers_sub')}</p>
        <button onClick={() => { playButtonTap(); onClose(); }} className="absolute right-0 top-0 w-9 h-9 short:w-8 short:h-8 rounded-full border border-border/60 bg-card/60 flex items-center justify-center text-lg hover:bg-muted transition-colors active:scale-95" aria-label={t('close')}>
          ×
        </button>
      </div>

      {/* Tabla */}
      <div className="flex-initial min-h-0 w-full max-w-5xl mx-auto rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md p-2 sm:p-3 short:p-2 flex flex-col">
        <p className="text-right text-[11px] sm:text-xs text-muted-foreground px-1 mb-1 short:mb-0.5">
          {t('answers_range', { from: from + 1, to: from + slice.length, total: rounds.length })}
        </p>
        <div className={`grid ${cols} gap-1.5 items-center px-2 py-1.5 short:py-1 rounded-xl bg-muted/30 text-[10px] sm:text-xs font-bold text-muted-foreground`}>
          <span className="text-center">N.º</span>
          <span>{isMundial ? t('rb_player') : t('rb_city')}</span>
          <span className="text-center">📍 <span className="hidden sm:inline">{t('game_distance')}</span><span className="sm:hidden">{t('rb_dist')}</span></span>
          <span className="text-center hidden min-[520px]:block">⏱ <span className="hidden md:inline">{t('game_time')}</span></span>
          <span className="text-center">🏆 <span className="hidden md:inline">{t('game_points')}</span></span>
          <span className="text-center">🗺️ <span className="hidden md:inline">{t('answers_map')}</span></span>
        </div>

        <div className="flex-initial min-h-0 overflow-y-auto mt-1 flex flex-col gap-1">
          {slice.map((r, i) => {
            const idx = from + i;
            const isBest = idx === bestIdx;
            return (
              <div key={idx} className={`grid ${cols} gap-1.5 items-center px-2 py-1.5 sm:py-2 short:py-1 rounded-xl border ${isBest ? 'border-accent/70 bg-accent/10' : 'border-border/50 bg-muted/10'}`}>
                <span className={`mx-auto w-6 h-6 sm:w-8 sm:h-8 short:w-6 short:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-black ${isBest ? 'bg-accent text-accent-foreground' : 'bg-muted/60'}`}>{idx + 1}</span>
                <span className="flex items-center gap-2 min-w-0">
                  <Flag country={r.city.country} className="w-7 sm:w-9 short:w-7" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="font-black text-sm sm:text-base truncate">{r.city.name}</span>
                      {isBest && (
                        <span className="shrink-0 rounded-full border border-primary/70 text-primary px-1.5 py-px text-[10px] font-bold">
                          👑<span className="hidden sm:inline"> {t('answers_best')}</span>
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] sm:text-xs text-muted-foreground truncate">{r.city.country}</span>
                  </span>
                </span>
                <span className="text-center font-mono font-bold text-xs sm:text-base">{formatDistance(r.distance)}</span>
                <span className="text-center font-mono font-bold text-xs sm:text-base hidden min-[520px]:block">{r.timeUsed} s</span>
                <span className="text-center font-mono font-black text-xs sm:text-lg text-primary">{r.totalPoints.toLocaleString()}</span>
                <button
                  onClick={() => { playButtonTap(); onOpenCity(idx); }}
                  className="justify-self-stretch rounded-xl border border-accent/70 text-accent font-bold text-xs sm:text-sm py-1.5 short:py-1 hover:bg-accent/10 transition-colors active:scale-[0.97]"
                  aria-label={`${t('answers_view')} ${r.city.name}`}
                >
                  📍<span className="hidden min-[520px]:inline"> {t('answers_view')}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Pie: volver · paginador · repasar */}
        <div className="shrink-0 mt-2 short:mt-1.5 grid grid-cols-2 min-[520px]:grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <button onClick={() => { playButtonTap(); onClose(); }} className="rounded-2xl border border-border bg-muted/20 py-2.5 short:py-2 px-2 font-bold text-xs sm:text-sm hover:bg-muted transition-colors active:scale-[0.98] truncate">
            🏠 {t('answers_backToResult')}
          </button>
          <div className="flex items-center justify-center gap-1.5 col-span-2 order-first min-[520px]:col-span-1 min-[520px]:order-none">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-border bg-muted/20 font-black disabled:opacity-35 active:scale-95" aria-label={t('review_prev')}>‹</button>
            <span className="font-mono font-bold text-xs sm:text-sm min-w-[2.5rem] text-center">{page + 1} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-border bg-muted/20 font-black disabled:opacity-35 active:scale-95" aria-label={t('review_next')}>›</button>
          </div>
          <button onClick={() => { playButtonTap(); onReviewAll(); }} className="btn3d rounded-2xl py-2.5 short:py-2 px-2 font-black text-xs sm:text-sm text-primary-foreground truncate" style={{ background: 'var(--grad-cta)' }}>
            📖 {t('answers_reviewAll')}
          </button>
        </div>
        <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-1.5 short:hidden">{t('answers_tapHint')}</p>
      </div>
    </div>
  );
}
