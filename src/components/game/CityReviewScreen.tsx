import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { itemTitleAuto, itemSubtitleAuto } from '@/lib/catalog';
import { type RoundResult, correctPinLabel } from './GameScreen';
import { useFeatureShapes } from '@/hooks/useFeatureShapes';
import { type MapBounds } from '@/data/cities';
import { formatDistance } from '@/lib/gameUtils';
import { itemHint, playerHint, useCityTips } from '@/lib/cityHints';
import { playAccordion, playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import WorldMapCanvas from './WorldMapCanvas';
import Wordmark from '@/components/ui/Wordmark';
import Flag from '@/components/ui/Flag';
import CountryPhoto from '@/components/ui/CountryPhoto';
import { appNumberLocale, formatNumber } from '@/lib/format';
import { HudIconButton } from './GameHud';
import { PinIcon, StopwatchIcon, HomeIcon, ChevronIcon, ArrowRightIcon, BookIcon, InfinityIcon, LegendPin } from '@/components/ui/icons';
const WorldBackdrop = lazy(() => import('./WorldBackdrop'));

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
/** Las etiquetas del mapa evitan la leyenda de la esquina inferior izquierda */
const LEGEND_AVOID = { corner: { w: 210, h: 88 } };

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
  // Banderas: el punto "correcto" es la frontera más cercana (o el propio clic si cayó dentro); el país se resalta
  const correct = useMemo(() => ({ lat: r.targetLat ?? r.city.lat, lon: r.targetLon ?? r.city.lon }), [r.targetLat, r.targetLon, r.city.lat, r.city.lon]);
  const bounds = useMemo(() => reviewBounds(userClick, correct), [userClick, correct]);
  const pinLabels = useMemo(() => ({ you: t('game_yourAnswer'), correct: isMundial ? r.city.country : correctPinLabel(r, t, r.city.name) }), [t, isMundial, r]);
  // Contorno del lugar (Fase 6b): se carga si la partida tiene lugares y se resalta en el mapa
  const featureShapes = useFeatureShapes(r.city.kind === 'feature');
  const highlightShape = useMemo(() => (r.city.kind === 'feature' && r.city.id && featureShapes ? featureShapes[r.city.id] ?? null : null), [r.city, featureShapes]);

  const lang = locale === 'en' ? 'en' : 'es';
  useCityTips();
  const playerName = r.city.name.replace(/^⚽\s*/, '');
  const hint = isMundial ? playerHint(playerName, r.city.country, r.city.lat, r.city.lon, lang) : itemHint(r.city, lang);
  // Multiplicadores restantes (racha × dificultad) = total / (base × velocidad)
  const rest = r.basePoints > 0 && r.multiplier > 0 ? r.totalPoints / (r.basePoints * r.multiplier) : 1;
  const secs = `${formatNumber(r.timeExact ?? r.timeUsed, 1)} s`;

  return (
    <div className="fixed inset-0 z-[105] isolate flex flex-col gap-2 short:gap-1.5 animate-fade-in" role="dialog" aria-modal="true" aria-label={t('review_title')}
      style={{ background: 'hsl(var(--brand-navy-deep))', padding: 'max(0.5rem, var(--sat)) max(0.75rem, var(--sar)) max(0.5rem, var(--sab)) max(0.75rem, var(--sal))' }}>
      {/* Mapa de continentes tenue detrás (como el cierre) */}
      <div className="absolute inset-0 pointer-events-none opacity-45 -z-10" aria-hidden>
        <Suspense fallback={null}><WorldBackdrop tone="continents" /></Suspense>
      </div>
      <div className="absolute inset-0 pointer-events-none -z-10" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 45%, hsl(var(--brand-navy) / 0.25), hsl(var(--brand-navy-deep) / 0.7))' }} aria-hidden />
      {/* Cabecera (se oculta en celular horizontal: el título lo da la barra de info) */}
      <div className="relative shrink-0 flex flex-col items-center short:hidden">
        <div className="flex items-center gap-2">
          <img src="/mascot/explorer-logo.webp" alt="" className="w-9 h-9 sm:w-11 sm:h-11 object-contain" />
          <Wordmark size="md" />
        </div>
        <h2 className="text-2xl sm:text-[2.6rem] font-extrabold leading-tight">{t('review_title')}</h2>
        <span className="absolute right-0 top-0"><HudIconButton icon="close" label={t('close')} onClick={() => { playButtonTap(); onClose(); }} /></span>
      </div>

      {/* Barra de info: bandera · ciudad · país | n / total | sin límite */}
      <div className="shrink-0 w-full max-w-6xl mx-auto rounded-2xl border-2 border-accent/30 bg-card/85 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 short:py-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <p className="min-w-0 flex items-center gap-2 sm:gap-3">
          <Flag country={r.city.country} className="w-8 sm:w-11 short:w-7" />
          <span className="min-w-0 truncate">
            <span className="font-bold text-sm sm:text-xl">{itemTitleAuto(r.city)}</span>
            <span className="text-foreground/75 text-xs sm:text-lg"> · {itemSubtitleAuto(r.city)}</span>
          </span>
        </p>
        <span className="shrink-0 text-xs sm:text-lg whitespace-nowrap">
          {isMundial ? t('review_playerN') : t('review_cityN')} <b className="text-primary">{index + 1}</b> / {total}
        </span>
        <span className="justify-self-end flex items-center gap-2">
          <span className="hidden min-[600px]:inline-flex items-center gap-1.5 rounded-xl border-2 border-accent/70 text-accent px-3 py-1 text-[11px] sm:text-base font-bold whitespace-nowrap">
            <InfinityIcon className="w-5 h-5" /> {t('review_noTimeLimit')}
          </span>
          <span className="hidden short:inline-flex"><HudIconButton icon="close" size="sm" label={t('close')} onClick={() => { playButtonTap(); onClose(); }} /></span>
        </span>
      </div>

      {/* Cuerpo: mapa + panel "Para recordarla" */}
      <div className="flex-1 min-h-0 w-full max-w-6xl mx-auto flex flex-col landscape:flex-row gap-2 short:gap-1.5">
        <div className="relative flex-1 min-h-[180px] landscape:min-h-0 rounded-2xl overflow-hidden border-2 border-accent/30 [&>div]:!min-h-0">
          <WorldMapCanvas
            onMapClick={noop}
            clickDisabled
            userClick={userClick}
            correctLocation={correct}
            distanceKm={r.inside ? null : r.distance}
            gameMode="world"
            viewBounds={bounds}
            pinLabels={pinLabels}
            pinEmoji={isMundial ? '⚽' : null}
            highlightCountry={r.city.kind === 'flag' ? r.city.name : null}
            highlightShape={highlightShape}
            labelAvoid={LEGEND_AVOID}
          />
          <div className="absolute left-3 bottom-3 rounded-xl border border-accent/40 px-3 py-2 text-xs sm:text-sm font-semibold flex flex-col gap-1.5 short:hidden" style={{ background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>
            <span className="flex items-center gap-2"><LegendPin color="hsl(var(--primary))" className="w-5 h-5" /> {t('game_yourAnswer')}</span>
            <span className="flex items-center gap-2"><LegendPin color="hsl(var(--accent))" className="w-5 h-5" /> {t('review_legendCorrect')}</span>
          </div>
        </div>

        <aside className="shrink-0 landscape:w-[min(38%,26rem)] max-h-[45%] landscape:max-h-none rounded-2xl border-2 border-accent/30 bg-card/85 backdrop-blur-md p-3 sm:p-5 short:p-2 overflow-y-auto flex flex-col gap-2 sm:gap-3 short:gap-1.5">
          <CountryPhoto country={r.city.country} className="-mx-3 -mt-3 short:-mx-2 short:-mt-2 h-24 short:h-16 rounded-t-2xl">
            <span className="text-xs font-bold text-white drop-shadow">{r.city.country}</span>
          </CountryPhoto>
          <h3 className="flex items-center gap-3 font-extrabold text-base sm:text-2xl short:text-sm border-b border-border/60 pb-2 short:pb-1">
            <BookIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> {t('review_toRemember')}
          </h3>
          <p className="text-sm sm:text-lg short:text-xs leading-snug">{hint}</p>
          <div className="flex flex-col divide-y divide-border/50 text-sm short:text-xs">
            <ReviewStat icon={<PinIcon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/80" />} label={t('game_distance')} value={formatDistance(r.distance)} />
            <ReviewStat icon={<StopwatchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/80" />} label={t('game_time')} value={secs} />
            <ReviewStat icon={<span className="text-lg sm:text-xl" aria-hidden>🏆</span>} label={t('game_points')} value={r.totalPoints.toLocaleString(appNumberLocale())} />
          </div>
          <button
            onClick={() => { playAccordion(!showCalc); setShowCalc(v => !v); }}
            className="rounded-xl border-2 border-accent/40 bg-background/40 py-2 sm:py-2.5 short:py-1 text-xs sm:text-base font-semibold hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5"
            aria-expanded={showCalc}
          >
            {t('game_seeCalc')} <ChevronIcon dir="down" className={`w-4 h-4 transition-transform ${showCalc ? '-scale-x-100' : ''}`} />
          </button>
          {showCalc && (
            <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs sm:text-sm animate-fade-in">
              <CalcRow label={t('game_calcBase')} value={`${r.basePoints}`} />
              <CalcRow label={`${t('game_calcSpeed')} · ${secs}`} value={`× ${r.multiplier.toFixed(2)}`} />
              {Math.abs(rest - 1) > 0.01 && <CalcRow label={t('review_calcRest')} value={`× ${rest.toFixed(2)}`} />}
              <div className="flex justify-between border-t border-border/60 mt-1 pt-1 font-black text-primary">
                <span>{t('game_total')}</span><span>{r.totalPoints.toLocaleString(appNumberLocale())}</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Pie: volver al listado · anterior · siguiente */}
      <div className="shrink-0 w-full max-w-6xl mx-auto grid grid-cols-[1fr_auto_1.3fr] gap-2">
        <button onClick={() => { playButtonTap(); onBackToList(); }} className="rounded-2xl border-2 border-foreground/25 bg-background/30 py-2.5 sm:py-3.5 short:py-2 px-2 font-bold text-xs sm:text-lg hover:bg-muted/50 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 min-w-0">
          <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6" /><span className="truncate">{t('review_backToList')}</span>
        </button>
        <button onClick={() => go(index - 1)} disabled={index === 0} className="rounded-2xl border-2 border-foreground/25 bg-background/30 py-2.5 sm:py-3.5 short:py-2 px-3 sm:px-10 font-bold text-xs sm:text-lg disabled:opacity-35 hover:bg-muted/50 transition-colors active:scale-[0.98] flex items-center justify-center gap-2">
          <ChevronIcon dir="left" className="w-5 h-5" /><span className="hidden min-[420px]:inline">{t('review_prev')}</span>
        </button>
        <button
          onClick={() => { if (isLast) { playButtonTap(); onBackToList(); } else go(index + 1); }}
          className="btn3d rounded-2xl py-2.5 sm:py-3.5 short:py-2 px-2 font-black text-xs sm:text-lg text-primary-foreground flex items-center justify-center gap-2 min-w-0"
          style={{ background: 'var(--grad-cta)' }}
        >
          <span className="truncate">{isLast ? t('review_finish') : (isMundial ? t('review_nextPlayer') : t('review_next'))}</span>
          {isLast ? <span aria-hidden>✓</span> : <ArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </div>
    </div>
  );
}

function ReviewStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 short:gap-2 py-2 short:py-0.5">
      <span className="w-6 flex justify-center" aria-hidden>{icon}</span>
      <span className="flex-1 text-foreground/85 sm:text-lg short:text-xs">{label}</span>
      <span className="font-extrabold text-primary text-base sm:text-2xl short:text-sm">{value}</span>
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
