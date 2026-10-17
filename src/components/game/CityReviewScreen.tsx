import { useEffect, useMemo, useState } from 'react';
import { type RoundResult } from './GameScreen';
import { type MapBounds } from '@/data/cities';
import { formatDistance } from '@/lib/gameUtils';
import { cityHint, playerHint } from '@/lib/cityHints';
import { playAccordion, playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import WorldMapCanvas from './WorldMapCanvas';
import Wordmark from '@/components/ui/Wordmark';
import Flag from '@/components/ui/Flag';
import CountryPhoto from '@/components/ui/CountryPhoto';

interface CityReviewScreenProps {
  rounds: RoundResult[];
  index: number;
  isMundial?: boolean;
  onIndexChange: (index: number) => void;
  onBackToList: () => void;
  onClose: () => void;
}

const WORLD: MapBounds = { latMin: -60, latMax: 80, lonMin: -180, lonMax: 180 };

/** Encuadre que muestra la respuesta y la ubicación correcta con contexto alrededor. */
function reviewBounds(a: { lat: number; lon: number }, b: { lat: number; lon: number }): MapBounds {
  const latMin = Math.min(a.lat, b.lat), latMax = Math.max(a.lat, b.lat);
  const lonMin = Math.min(a.lon, b.lon), lonMax = Math.max(a.lon, b.lon);
  const latSpan = latMax - latMin, lonSpan = lonMax - lonMin;
  if (lonSpan > 150 || latSpan > 90) return WORLD;
  const pad = Math.max(3, Math.max(latSpan, lonSpan) * 0.4);
  const cLat = (latMin + latMax) / 2, cLon = (lonMin + lonMax) / 2;
  const halfLat = Math.max(latSpan / 2 + pad, 6);
  const halfLon = Math.max(lonSpan / 2 + pad, 9);
  return {
    latMin: Math.max(-85, cLat - halfLat),
    latMax: Math.min(85, cLat + halfLat),
    lonMin: Math.max(-180, cLon - halfLon),
    lonMax: Math.min(180, cLon + halfLon),
  };
}

const noop = () => {};

/** "Revisa tu ubicación" (maqueta Revision_Ciudad_APROBADA_v1): sin temporizador, ciudad por ciudad. */
export default function CityReviewScreen({ rounds, index, isMundial = false, onIndexChange, onBackToList, onClose }: CityReviewScreenProps) {
  const { t, locale } = useI18n();
  const r = rounds[index];
  const total = rounds.length;
  const isLast = index >= total - 1;
  const [showCalc, setShowCalc] = useState(false);
  useEffect(() => { setShowCalc(false); }, [index]);

  const go = (i: number) => { if (i >= 0 && i < total) { playButtonTap(); onIndexChange(i); } };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBackToList();
      else if (e.key === 'ArrowRight') { if (index < total - 1) onIndexChange(index + 1); }
      else if (e.key === 'ArrowLeft') { if (index > 0) onIndexChange(index - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, total, onIndexChange, onBackToList]);

  // Props del mapa memoizadas: el mapa compara por identidad (ver gotcha del bloque 3)
  const userClick = useMemo(() => ({ lat: r.clickLat, lon: r.clickLon }), [r.clickLat, r.clickLon]);
  const correct = useMemo(() => ({ lat: r.city.lat, lon: r.city.lon }), [r.city.lat, r.city.lon]);
  const bounds = useMemo(() => reviewBounds(userClick, correct), [userClick, correct]);
  const pinLabels = useMemo(() => ({ you: t('game_yourAnswer'), correct: isMundial ? r.city.country : r.city.name }), [t, isMundial, r.city.country, r.city.name]);

  const lang = locale === 'en' ? 'en' : 'es';
  const playerName = r.city.name.replace(/^⚽\s*/, '');
  const hint = isMundial ? playerHint(playerName, r.city.country, r.city.lat, r.city.lon, lang) : cityHint(r.city, lang);
  // Multiplicadores restantes (racha × dificultad) = total / (base × velocidad)
  const rest = r.basePoints > 0 && r.multiplier > 0 ? r.totalPoints / (r.basePoints * r.multiplier) : 1;

  return (
    <div className="fixed inset-0 z-[105] game-bg flex flex-col gap-2 short:gap-1.5 animate-fade-in" role="dialog" aria-modal="true" aria-label={t('review_title')}
      style={{ padding: 'max(0.5rem, var(--sat)) max(0.75rem, var(--sar)) max(0.5rem, var(--sab)) max(0.75rem, var(--sal))' }}>
      {/* Cabecera (se oculta en celular horizontal: el título lo da la barra de info) */}
      <div className="relative shrink-0 flex flex-col items-center short:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
          <Wordmark size="sm" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black leading-tight">{t('review_title')}</h2>
        <button onClick={() => { playButtonTap(); onClose(); }} className="absolute right-0 top-0 w-9 h-9 rounded-full border border-border/60 bg-card/60 flex items-center justify-center text-lg hover:bg-muted transition-colors active:scale-95" aria-label={t('close')}>×</button>
      </div>

      {/* Barra de info: bandera · ciudad · país | n / total | sin límite */}
      <div className="shrink-0 w-full max-w-6xl mx-auto rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-3 py-2 short:py-1.5 flex items-center gap-2 sm:gap-3">
        <Flag country={r.city.country} className="w-8 sm:w-10 short:w-7" />
        <p className="min-w-0 flex-1 truncate">
          <span className="font-black text-sm sm:text-lg">{r.city.name}</span>
          <span className="text-muted-foreground text-xs sm:text-base"> · {r.city.country}</span>
        </p>
        <span className="shrink-0 text-xs sm:text-base text-muted-foreground whitespace-nowrap">
          {isMundial ? t('review_playerN') : t('review_cityN')} <b className="text-foreground">{index + 1}</b> / {total}
        </span>
        <span className="shrink-0 hidden min-[600px]:inline-flex items-center gap-1 rounded-xl border border-accent/70 text-accent px-2 py-0.5 text-[11px] sm:text-sm font-bold whitespace-nowrap">
          ∞ {t('review_noTimeLimit')}
        </span>
        <button onClick={() => { playButtonTap(); onClose(); }} className="hidden short:flex shrink-0 w-7 h-7 rounded-full border border-border/60 bg-muted/40 items-center justify-center text-base active:scale-95" aria-label={t('close')}>×</button>
      </div>

      {/* Cuerpo: mapa + panel "Para recordarla" */}
      <div className="flex-1 min-h-0 w-full max-w-6xl mx-auto flex flex-col landscape:flex-row gap-2 short:gap-1.5">
        <div className="relative flex-1 min-h-[180px] landscape:min-h-0 rounded-2xl overflow-hidden border border-border/80 [&>div]:!min-h-0">
          <WorldMapCanvas
            onMapClick={noop}
            clickDisabled
            userClick={userClick}
            correctLocation={correct}
            distanceKm={r.distance}
            gameMode="world"
            viewBounds={bounds}
            pinLabels={pinLabels}
            pinEmoji={isMundial ? '⚽' : null}
          />
          <div className="absolute left-2 bottom-2 rounded-xl border border-border/70 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold flex flex-col gap-1 short:hidden" style={{ background: 'hsl(var(--brand-navy-deep) / 0.8)' }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" aria-hidden /> {t('game_yourAnswer')}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent" aria-hidden /> {t('review_legendCorrect')}</span>
          </div>
        </div>

        <aside className="shrink-0 landscape:w-[min(38%,22rem)] max-h-[45%] landscape:max-h-none rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-3 short:p-2 overflow-y-auto flex flex-col gap-2 short:gap-1.5">
          <CountryPhoto country={r.city.country} className="-mx-3 -mt-3 short:-mx-2 short:-mt-2 h-24 short:h-16 rounded-t-2xl">
            <span className="text-xs font-bold text-white drop-shadow">{r.city.country}</span>
          </CountryPhoto>
          <h3 className="flex items-center gap-2 font-black text-base sm:text-xl short:text-sm border-b border-border/60 pb-1.5 short:pb-1">
            <span aria-hidden>📖</span> {t('review_toRemember')}
          </h3>
          <p className="text-sm sm:text-base short:text-xs leading-snug">{hint}</p>
          <div className="flex flex-col divide-y divide-border/50 text-sm short:text-xs">
            <ReviewStat icon="📍" label={t('game_distance')} value={formatDistance(r.distance)} />
            <ReviewStat icon="⏱️" label={t('game_time')} value={`${r.timeUsed} s`} />
            <ReviewStat icon="🏆" label={t('game_points')} value={r.totalPoints.toLocaleString()} />
          </div>
          <button
            onClick={() => { playAccordion(!showCalc); setShowCalc(v => !v); }}
            className="rounded-xl border border-border bg-muted/20 py-1.5 short:py-1 text-xs sm:text-sm font-bold hover:bg-muted transition-colors flex items-center justify-center gap-1"
            aria-expanded={showCalc}
          >
            {t('game_seeCalc')} <span className={`transition-transform ${showCalc ? 'rotate-180' : ''}`}>⌄</span>
          </button>
          {showCalc && (
            <div className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs sm:text-sm font-mono animate-fade-in">
              <CalcRow label={t('game_calcBase')} value={`${r.basePoints}`} />
              <CalcRow label={`${t('game_calcSpeed')} · ${r.timeUsed} s`} value={`× ${r.multiplier.toFixed(2)}`} />
              {Math.abs(rest - 1) > 0.01 && <CalcRow label={t('review_calcRest')} value={`× ${rest.toFixed(2)}`} />}
              <div className="flex justify-between border-t border-border/60 mt-1 pt-1 font-black text-primary">
                <span>{t('game_total')}</span><span>{r.totalPoints.toLocaleString()}</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Pie: volver al listado · anterior · siguiente */}
      <div className="shrink-0 w-full max-w-6xl mx-auto grid grid-cols-[1fr_auto_1.3fr] gap-2">
        <button onClick={() => { playButtonTap(); onBackToList(); }} className="rounded-2xl border border-border bg-muted/20 py-2.5 short:py-2 px-2 font-bold text-xs sm:text-base hover:bg-muted transition-colors active:scale-[0.98] truncate">
          🏠 {t('review_backToList')}
        </button>
        <button onClick={() => go(index - 1)} disabled={index === 0} className="rounded-2xl border border-border bg-muted/20 py-2.5 short:py-2 px-3 sm:px-6 font-bold text-xs sm:text-base disabled:opacity-35 hover:bg-muted transition-colors active:scale-[0.98]">
          ‹ <span className="hidden min-[420px]:inline">{t('review_prev')}</span>
        </button>
        <button
          onClick={() => { if (isLast) { playButtonTap(); onBackToList(); } else go(index + 1); }}
          className="btn3d rounded-2xl py-2.5 short:py-2 px-2 font-black text-xs sm:text-base text-primary-foreground truncate"
          style={{ background: 'var(--grad-cta)' }}
        >
          {isLast ? `${t('review_finish')} ✓` : `${isMundial ? t('review_nextPlayer') : t('review_next')} →`}
        </button>
      </div>
    </div>
  );
}

function ReviewStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 short:py-1">
      <span aria-hidden>{icon}</span>
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-mono font-black text-primary text-base sm:text-xl short:text-sm">{value}</span>
    </div>
  );
}

function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 py-0.5">
      <span className="text-muted-foreground truncate">{label}</span>
      <span className="font-bold shrink-0">{value}</span>
    </div>
  );
}
