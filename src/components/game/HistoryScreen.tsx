import { useCallback, useEffect, useMemo, useState } from 'react';
import { MODE_CONFIG, type Difficulty, type GameMode } from '@/data/cities';
import { fetchHistoryPage, hasAnyHistory, loadRounds, type HistoryItem, type HistoryFilters } from '@/lib/history';
import { formatDistance } from '@/lib/gameUtils';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { ArrowRightIcon, ChevronIcon, HomeIcon, LegendPin } from '@/components/ui/icons';
import { REGION_ART, DIFF_ART, DIFF_ORDER } from '@/lib/selectionArt';
import { formatNumber } from '@/lib/format';
import SelectorSheet, { type SelectorOption } from './SelectorSheet';
import Mascot, { type MascotState } from './Mascot';
import HeaderBackdrop from './HeaderBackdrop';
import PropExplorer from './PropExplorer';
import FilterButton from './FilterButton';
import CityAnswersScreen from './CityAnswersScreen';
import CityReviewScreen from './CityReviewScreen';
import { type RoundResult } from './GameScreen';

interface HistoryScreenProps {
  onBack: () => void;
  onPlay: () => void;
  onMyChallenges: () => void;
}

type T = (k: never, p?: Record<string, string | number>) => string;

const DIFF_LABEL: Record<Difficulty, string> = { basic: 'home_diffBasic', easy: 'home_diffEasy', medium: 'home_diffMedium', hard: 'home_diffHard' };
const DIFF_COLOR: Record<string, string> = { basic: 'text-primary', easy: 'text-accent', medium: 'text-brand-sky', hard: 'text-destructive' };
/** Globo de la tarjeta según la región (maqueta: un globo centrado en la zona jugada) */
const REGION_GLOBE: Record<string, string> = { world: '🌍', europe: '🌍', africa: '🌍', asia: '🌏', americas: '🌎' };

/**
 * Historial de partidas (maquetas Historial / Historial_Vacio, celular y computador): filtros Región/Dificultad
 * y orden, tarjetas agrupadas por día en el celular y tabla en computador (la mejor partida cargada resaltada en
 * amarillo), cargar más, detalle por ciudad (reutiliza CityAnswers/CityReview), vacío ≠ sin coincidencias.
 */
export default function HistoryScreen({ onBack, onPlay, onMyChallenges }: HistoryScreenProps) {
  const { t, locale } = useI18n();
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [anyGames, setAnyGames] = useState<boolean | null>(null);
  const [newestFirst, setNewestFirst] = useState(true);
  const [sheet, setSheet] = useState<'mode' | 'difficulty' | null>(null);
  const [detail, setDetail] = useState<{ item: HistoryItem; rounds: RoundResult[]; view: 'list' | 'city'; idx: number } | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);

  const load = useCallback(async (f: HistoryFilters) => {
    setItems(null); setError(false);
    try {
      const [page, any] = await Promise.all([fetchHistoryPage(f), hasAnyHistory()]);
      setItems(page.items); setHasMore(page.hasMore); setAnyGames(any);
    } catch { setError(true); }
  }, []);
  useEffect(() => { load(filters); }, [filters, load]);

  const loadMore = async () => {
    if (!items || loadingMore) return;
    playButtonTap();
    setLoadingMore(true);
    try {
      const last = items[items.length - 1];
      const page = await fetchHistoryPage(filters, last?.createdAt);
      setItems([...items, ...page.items]); setHasMore(page.hasMore);
    } catch { setError(true); }
    finally { setLoadingMore(false); }
  };

  const openDetail = async (item: HistoryItem, view: 'list' | 'city' = 'list') => {
    if (!item.hasDetail || opening) return;
    playButtonTap();
    setOpening(item.id);
    try {
      const rounds = await loadRounds(item);
      if (rounds.length > 0) setDetail({ item, rounds, view, idx: 0 });
    } finally { setOpening(null); }
  };

  const shown = useMemo(() => {
    if (!items) return [];
    return newestFirst ? items : [...items].slice().reverse();
  }, [items, newestFirst]);
  // La mejor partida de las cargadas va resaltada (borde y puntos en amarillo)
  const bestId = useMemo(() => shown.reduce<HistoryItem | null>((b, it) => (!b || it.score > b.score ? it : b), null)?.id, [shown]);
  const groups = useMemo(() => groupByDay(shown, locale, t as T), [shown, locale, t]);

  const modeOptions: SelectorOption<string>[] = [
    { key: '', emoji: '🌐', label: t('hist_all'), desc: t('hist_allRegionsDesc') },
    ...MODE_CONFIG.map(m => ({ key: m.key, emoji: REGION_ART[m.key as GameMode]?.emoji ?? m.emoji, art: REGION_ART[m.key as GameMode]?.art, label: t(`mode_${m.key}` as never) || m.label, desc: '' })),
    { key: 'mundial', emoji: '⚽', label: t('wc_modeName'), desc: '' },
  ];
  const diffOptions: SelectorOption<string>[] = [
    { key: '', emoji: '🌐', label: t('hist_all'), desc: t('hist_allDiffsDesc') },
    ...DIFF_ORDER.map(d => ({ key: d, emoji: DIFF_ART[d].emoji, art: DIFF_ART[d].art, label: t(DIFF_LABEL[d] as never), desc: '' })),
  ];
  const modeLabel = filters.mode ? (filters.mode === 'mundial' ? t('wc_modeName') : t(`mode_${filters.mode}` as never)) : t('hist_all');
  const diffLabel = filters.difficulty ? t(DIFF_LABEL[filters.difficulty as Difficulty] as never) : t('hist_all');
  const filtered = !!filters.mode || !!filters.difficulty;
  // Las maquetas de historial vacío no llevan la mascota en la cabecera (ya está en la tarjeta)
  const emptyView = error || (items !== null && items.length === 0);

  // ── Detalle por ciudad (reutiliza F2) ──
  if (detail?.view === 'list') {
    return <CityAnswersScreen rounds={detail.rounds} isMundial={detail.item.gameType === 'mundial'} focusIndex={detail.idx} onOpenCity={(i) => setDetail({ ...detail, view: 'city', idx: i })} onReviewAll={() => setDetail({ ...detail, view: 'city', idx: 0 })} onClose={() => setDetail(null)} />;
  }
  if (detail?.view === 'city') {
    return <CityReviewScreen rounds={detail.rounds} index={detail.idx} isMundial={detail.item.gameType === 'mundial'} onIndexChange={(i) => setDetail({ ...detail, idx: i })} onBackToList={() => setDetail({ ...detail, view: 'list' })} onClose={() => setDetail(null)} />;
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <HeaderBackdrop pins="top" />
      <div className="relative w-full max-w-lg md:max-w-6xl animate-fade-in-up pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader
          onBack={onBack}
          title={t('hist_title')}
          subtitle={t('hist_subtitle')}
          align="left"
          titleClassName="text-[6vw] sm:text-5xl md:text-6xl short:text-2xl whitespace-nowrap"
          subtitleClassName="text-[3.4vw] sm:text-lg md:text-xl short:text-xs"
          titleAside={emptyView ? undefined : <PropExplorer prop="book" className="w-[22vw] sm:w-36 md:w-44 shrink-0 -mt-2 short:hidden" />}
        />

        {/* Filtros + orden */}
        <div className={`grid grid-cols-2 md:flex md:items-center gap-2 sm:gap-3 ${emptyView ? '' : 'md:-mt-6'}`}>
          <FilterButton icon="globe" label={t('ch_region')} value={modeLabel} onClick={() => { playButtonTap(); setSheet('mode'); }} />
          <FilterButton icon="compass" label={t('ch_difficulty')} value={diffLabel} onClick={() => { playButtonTap(); setSheet('difficulty'); }} />
          <button onClick={() => { playButtonTap(); setNewestFirst(v => !v); }} className="col-span-2 justify-self-end md:ml-auto flex items-center gap-2 text-sm sm:text-base text-foreground/85 hover:text-foreground">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 6h11M4 12h8M4 18h5M18 5v14M15 16l3 3 3-3" /></svg>
            {newestFirst ? t('hist_newestFirst') : t('hist_oldestFirst')}
            <ChevronIcon dir="down" className="w-4 h-4 hidden md:block" />
          </button>
        </div>

        <div className="mt-3 sm:mt-4">
          {error ? (
            <EmptyState mascot="confused" title={t('mc_loadError')} cta={t('mc_retry')} ctaIcon="retry" onCta={() => load(filters)} onBack={onBack} t={t as T} />
          ) : items === null ? (
            <div className="flex justify-center py-12"><Mascot state="reading" className="w-20 animate-mascot-float" /></div>
          ) : items.length === 0 ? (
            anyGames === false || !filtered
              ? <EmptyState mascot="reading" lead={t('hist_emptyLead')} tail={t('hist_emptyTail')} desc={t('hist_emptyDesc')} cta={t('hist_playNow')} ctaIcon="play" onCta={onPlay} onBack={onBack} t={t as T} />
              : <EmptyState mascot="thinking" title={t('hist_noMatchTitle')} desc={t('hist_noMatchDesc')} cta={t('hist_clearFilters')} onCta={() => setFilters({})} onBack={onBack} t={t as T} />
          ) : (
            <>
              {/* Celular: tarjetas agrupadas por día */}
              <div className="md:hidden flex flex-col gap-3">
                {groups.map(g => (
                  <div key={g.key} className="flex flex-col gap-3">
                    <h2 className="text-2xl font-extrabold px-1 -mb-1">{g.label}</h2>
                    {g.items.map(item => <HistoryCard key={item.id} item={item} best={item.id === bestId} locale={locale} opening={opening === item.id} onOpen={() => openDetail(item)} />)}
                  </div>
                ))}
              </div>

              {/* Computador: tabla */}
              <div className="hidden md:block rounded-3xl border-2 border-accent/50 bg-card/70 p-3 shadow-[0_0_20px_hsl(var(--accent)/0.12)]">
                <div className={`grid ${TABLE_COLS} gap-3 px-4 pt-1 pb-3 text-sm font-semibold text-foreground/85`}>
                  <span>{t('hist_date')}</span><span>{t('hist_game')}</span><span>{t('hist_status')}</span><span>{t('game_points')}</span><span>{t('final_cities')}</span><span>{t('final_avgDist')}</span><span className="text-center">{t('hist_detail')}</span>
                </div>
                <ul className="flex flex-col">
                  {shown.map(item => <HistoryRow key={item.id} item={item} best={item.id === bestId} locale={locale} opening={opening === item.id} onOpen={() => openDetail(item)} />)}
                </ul>
              </div>

              <div className="mt-4 grid md:grid-cols-[1fr_auto_1fr] items-center gap-3">
                <p className="hidden md:flex items-center gap-2 text-sm text-foreground/80"><InfoIcon className="w-6 h-6 text-accent" /> {t('hist_detailHint')}</p>
                {hasMore ? (
                  <button onClick={loadMore} disabled={loadingMore} className="w-full md:w-auto md:px-12 h-12 rounded-2xl border-2 border-accent/80 bg-brand-navy-deep/60 text-accent font-black text-base sm:text-lg flex items-center justify-center gap-3 hover:bg-accent/10 disabled:opacity-60 shadow-[0_0_14px_hsl(var(--accent)/0.15)]">
                    <RetryIcon className={`w-6 h-6 ${loadingMore ? 'animate-spin' : ''}`} /> {t('hist_loadMore')}
                  </button>
                ) : <span className="hidden md:block" />}
                <span className="hidden md:block" />
              </div>
            </>
          )}
        </div>

        {/* Pie: Mis retos · Volver al inicio (no en el vacío: la tarjeta ya trae Volver al inicio) */}
        {!emptyView && <div className="mt-5 pt-4 border-t border-accent/20 flex flex-col md:flex-row items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 text-center md:text-left">
            <ClipboardIcon className="w-8 h-8 shrink-0" />
            <p className="text-base font-bold leading-tight md:flex md:items-center md:gap-4">
              {t('hist_friendsQ')}
              <button onClick={() => { playButtonTap(); onMyChallenges(); }} className="block md:inline-flex items-center gap-1 font-semibold text-accent hover:underline">{t('hist_goToChallenges')} →</button>
            </p>
          </div>
          <div className="w-full h-px bg-accent/20 md:hidden" />
          <button onClick={() => { playButtonTap(); onBack(); }} className="flex items-center gap-2.5 font-semibold text-foreground/90 hover:text-foreground">
            <HomeIcon className="w-6 h-6" /> {t('ob_backHome')}
          </button>
        </div>}
      </div>

      {sheet === 'mode' && (
        <SelectorSheet<string> title={t('hist_pickRegion')} subtitle={t('hist_pickRegionSub')} options={modeOptions} selected={filters.mode ?? ''} confirmLabel={t('hist_apply')}
          onConfirm={(k) => { setFilters(f => ({ ...f, mode: k || undefined })); setSheet(null); }} onClose={closeSheet} closeLabel={t('close')} />
      )}
      {sheet === 'difficulty' && (
        <SelectorSheet<string> title={t('hist_pickDiff')} subtitle={t('hist_pickDiffSub')} options={diffOptions} selected={filters.difficulty ?? ''} confirmLabel={t('hist_apply')}
          onConfirm={(k) => { setFilters(f => ({ ...f, difficulty: k || undefined })); setSheet(null); }} onClose={closeSheet} closeLabel={t('close')} />
      )}
    </div>
  );
}

const TABLE_COLS = 'grid-cols-[7rem_minmax(0,1fr)_10.5rem_6rem_6rem_8rem_9.5rem]';

function gameInfo(item: HistoryItem, t: T): { icon: string; name: string; diff: string } {
  const region = t(`mode_${item.mode}` as never) || item.mode;
  const diff = t(DIFF_LABEL[item.difficulty as Difficulty] as never) || item.difficulty;
  const globe = REGION_GLOBE[item.mode] ?? '🌍';
  const flags = item.category === 'flags' ? ` · 🚩 ${t('cat_flags' as never)}` : '';
  switch (item.gameType) {
    case 'mundial': return { icon: '⚽', name: t('wc_modeName' as never), diff: t(`wc_diff_${item.difficulty}` as never) };
    case 'timeattack': return { icon: '⚡', name: `${t('ta_hud' as never)} · ${region}`, diff };
    case 'daily': return { icon: '📅', name: `${t('home_dailyCard' as never)} · ${region}`, diff };
    case 'challenge': return { icon: '⚔️', name: `${t('ch_countdownLabel' as never)} · ${region}${flags}`, diff };
    case 'training': return { icon: '🎯', name: `${t('game_training' as never)} · ${region}${flags}`, diff };
    default: return item.category === 'flags' ? { icon: '🚩', name: `${t('cat_flags' as never)} · ${region}`, diff } : { icon: globe, name: region, diff };
  }
}

function parseDate(raw: string): Date | null {
  const d = new Date(raw);
  // Partidas de la cola offline anteriores a F5 no traen fecha (quedan en 1970): no se muestra
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.UTC(2000, 0, 1) ? d : null;
}

/** "13 oct 2026" y "19:20" (24 h en español, como la maqueta) sin el "de" que añade es-CO */
function fmtDate(d: Date, locale: string): { date: string; time: string } {
  const loc = locale === 'en' ? 'en-US' : 'es-CO';
  const parts = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(d);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const month = get('month').replace('.', '');
  const date = locale === 'en' ? `${month} ${get('day')}, ${get('year')}` : `${get('day')} ${month} ${get('year')}`;
  const time = d.toLocaleTimeString(loc, locale === 'en' ? { hour: 'numeric', minute: '2-digit' } : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return { date, time };
}

/** Agrupa por día para el celular: Hoy · Ayer · fecha · Sin fecha */
function groupByDay(items: HistoryItem[], locale: string, t: T): { key: string; label: string; items: HistoryItem[] }[] {
  const out: { key: string; label: string; items: HistoryItem[] }[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;
  for (const it of items) {
    const d = parseDate(it.createdAt);
    let key = 'none', label = t('hist_noDate' as never);
    if (d) {
      const day = new Date(d); day.setHours(0, 0, 0, 0);
      const diff = Math.round((today.getTime() - day.getTime()) / dayMs);
      key = day.toISOString();
      label = diff === 0 ? t('hist_today' as never) : diff === 1 ? t('hist_yesterday' as never) : fmtDate(d, locale).date;
    }
    const last = out[out.length - 1];
    if (last && last.key === key) last.items.push(it);
    else out.push({ key, label, items: [it] });
  }
  return out;
}

function useRowData(item: HistoryItem, locale: string) {
  const { t } = useI18n();
  const d = parseDate(item.createdAt);
  const when = d ? fmtDate(d, locale) : null;
  const g = gameInfo(item, t as T);
  const cities = item.gameType === 'timeattack' ? String(item.roundsPlayed) : `${item.roundsPlayed} / ${item.roundsTotal}`;
  const dist = item.gameType === 'mundial' || item.avgDistanceKm == null ? '—' : formatDistance(item.avgDistanceKm);
  return { t, when, g, cities, dist };
}

function StatusPill({ reason, t, size = 'md' }: { reason: HistoryItem['endReason']; t: T; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-3 py-1 text-sm gap-1.5';
  if (reason === 'complete') return <span className={`inline-flex items-center rounded-full bg-primary text-primary-foreground font-bold whitespace-nowrap ${cls}`}><TrophyMini /> {t('hist_completed' as never)}</span>;
  if (reason === 'timeout') return <span className={`inline-flex items-center rounded-full border-2 border-foreground/40 bg-brand-navy-deep/60 font-semibold whitespace-nowrap ${cls}`}><HourglassMini /> {t('hist_timeout' as never)}</span>;
  return <span className={`inline-flex items-center rounded-full border-2 border-foreground/25 text-foreground/70 font-semibold whitespace-nowrap ${cls}`}>{t('hist_abandoned' as never)}</span>;
}

function DetailButton({ item, opening, onOpen, label, className }: { item: HistoryItem; opening: boolean; onOpen: () => void; label: string; className: string }) {
  const { t } = useI18n();
  if (!item.hasDetail) return <span className="text-xs text-foreground/60 text-center" title={t('hist_noDetail')}>{t('hist_noDetail')}</span>;
  return (
    <button onClick={onOpen} disabled={opening} className={`rounded-2xl border-2 border-accent/80 text-accent font-extrabold flex items-center justify-center gap-2 hover:bg-accent/10 disabled:opacity-60 ${className}`}>
      {opening ? '…' : <>{label} <ArrowRightIcon className="w-4 h-4" /></>}
    </button>
  );
}

/** Tarjeta del celular (maqueta Historial_Movil) */
function HistoryCard({ item, best, locale, opening, onOpen }: { item: HistoryItem; best: boolean; locale: string; opening: boolean; onOpen: () => void }) {
  const { t, when, g, cities, dist } = useRowData(item, locale);
  return (
    <div className={`rounded-3xl border-2 bg-card/70 p-3 ${best ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]' : 'border-accent/50 shadow-[0_0_16px_hsl(var(--accent)/0.12)]'}`}>
      <div className="flex items-start gap-2.5">
        <GlobeBadge icon={g.icon} className="w-14 h-14 text-[2.3rem]" />
        <div className="flex-1 min-w-0 pt-1">
          <p className="font-extrabold text-base leading-tight truncate">{g.name} · <span className={DIFF_COLOR[item.difficulty] ?? 'text-accent'}>{g.diff}</span></p>
          {when && <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/85 whitespace-nowrap"><CalendarIcon className="w-4 h-4 shrink-0" /> {when.date} · {when.time}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusPill reason={item.endReason} t={t as T} size="sm" />
          <span className={`font-extrabold text-[1.4rem] leading-none whitespace-nowrap ${best ? 'text-primary' : ''}`}>{formatNumber(item.score)} <span className="text-base">pts</span></span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_1.2fr_1.35fr] gap-1.5 items-stretch">
        <MiniStat icon={<BarsIcon className="w-[18px] h-[18px]" />} label={t('final_cities')} value={cities} />
        <MiniStat icon={<LegendPin color="hsl(var(--accent))" className="w-[18px] h-[18px]" />} label={t('final_avgDist')} value={dist} />
        <DetailButton item={item} opening={opening} onOpen={onOpen} label={t('hist_viewDetailCity')} className="px-1.5 text-[11px] leading-tight uppercase" />
      </div>
    </div>
  );
}

/** Fila de la tabla (maqueta Historial_Computador) */
function HistoryRow({ item, best, locale, opening, onOpen }: { item: HistoryItem; best: boolean; locale: string; opening: boolean; onOpen: () => void }) {
  const { t, when, g, cities, dist } = useRowData(item, locale);
  return (
    <li className={`grid ${TABLE_COLS} gap-3 items-center px-4 py-3 rounded-2xl ${best ? 'border-2 border-primary shadow-[0_0_18px_hsl(var(--primary)/0.3)]' : 'border-2 border-transparent border-b-accent/15'}`}>
      <div className="leading-tight">{when ? <><span className="block font-bold text-base">{when.date}</span><span className="text-sm text-foreground/80">{when.time}</span></> : <span className="text-foreground/50">—</span>}</div>
      <div className="flex items-center gap-3 min-w-0">
        <GlobeBadge icon={g.icon} className="w-12 h-12 text-[2rem]" />
        <span className="font-extrabold text-lg truncate">{g.name} · <span className={DIFF_COLOR[item.difficulty] ?? 'text-accent'}>{g.diff}</span></span>
      </div>
      <div><StatusPill reason={item.endReason} t={t as T} /></div>
      <div className={`font-extrabold text-2xl ${best ? 'text-primary' : ''}`}>{formatNumber(item.score)}</div>
      <div className="flex items-center gap-2 font-bold text-lg whitespace-nowrap"><BarsIcon className="w-6 h-6 shrink-0" /> {cities}</div>
      <div className="flex items-center gap-2 font-bold text-lg whitespace-nowrap"><LegendPin color="hsl(var(--accent))" className="w-6 h-6 shrink-0" /> {dist}</div>
      <div className="flex justify-center"><DetailButton item={item} opening={opening} onOpen={onOpen} label={t('hist_viewDetail')} className="h-10 px-4 text-base whitespace-nowrap" /></div>
    </li>
  );
}

function GlobeBadge({ icon, className }: { icon: string; className: string }) {
  return (
    <span className={`rounded-full border-2 border-accent/60 bg-brand-navy-deep/70 flex items-center justify-center leading-none shrink-0 shadow-[0_0_14px_hsl(var(--accent)/0.3)] ${className}`} aria-hidden>{icon}</span>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-accent/30 bg-brand-navy-deep/50 px-1.5 py-1.5 flex items-center gap-1 min-w-0">
      <span className="shrink-0" aria-hidden>{icon}</span>
      <span className="min-w-0 text-center flex-1">
        <span className="block text-[10px] leading-[1.1] text-foreground/80">{label}</span>
        <span className="block font-extrabold text-sm leading-tight whitespace-nowrap">{value}</span>
      </span>
    </div>
  );
}

function EmptyState({ mascot, lead, tail, title, desc, cta, ctaIcon, onCta, onBack, t }: {
  mascot: MascotState; lead?: string; tail?: string; title?: string; desc?: string; cta: string; ctaIcon?: 'play' | 'retry'; onCta: () => void; onBack: () => void; t: T;
}) {
  return (
    <section className="rounded-3xl border-2 border-accent/60 bg-card/70 p-5 sm:p-8 shadow-[0_0_24px_hsl(var(--accent)/0.18)] md:grid md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-8">
      <PropExplorer prop="book" mascot={mascot} className="w-40 sm:w-52 md:w-64 mx-auto" />
      <div className="text-center mt-4 md:mt-0">
        <h2 className="text-[min(7.4vw,1.9rem)] sm:text-[2.4rem] font-black leading-tight">{title ?? <>{lead}<br /><span className="text-primary">{tail}</span></>}</h2>
        {desc && <p className="mt-3 text-base sm:text-lg text-foreground/85 max-w-md mx-auto">{desc}</p>}
        <button onClick={() => { playButtonTap(); onCta(); }} className="btn3d mt-6 w-full max-w-sm mx-auto h-14 rounded-2xl font-black text-xl text-primary-foreground flex items-center justify-center gap-3 shadow-[0_0_24px_hsl(var(--primary)/0.35)]" style={{ background: 'var(--grad-cta)' }}>
          {ctaIcon === 'play' && <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>}
          {ctaIcon === 'retry' && <RetryIcon className="w-6 h-6" />}
          {cta}
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex-1 h-px bg-accent/40 md:hidden" />
          <button onClick={() => { playButtonTap(); onBack(); }} className="mx-auto flex items-center gap-2 font-semibold text-accent hover:text-foreground md:underline md:underline-offset-4">
            <HomeIcon className="w-5 h-5" /> {t('ob_backHome' as never)}
          </button>
          <span className="flex-1 h-px bg-accent/40 md:hidden" />
        </div>
      </div>
    </section>
  );
}

type I = { className?: string };
const CalendarIcon = ({ className = '' }: I) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
);
const BarsIcon = ({ className = '' }: I) => (
  <svg viewBox="0 0 24 24" className={`text-brand-sky ${className}`} fill="currentColor" aria-hidden><rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></svg>
);
const InfoIcon = ({ className = '' }: I) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M12 11v6" /><circle cx="12" cy="7.5" r="0.6" fill="currentColor" /></svg>
);
const RetryIcon = ({ className = '' }: I) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" /></svg>
);
const ClipboardIcon = ({ className = '' }: I) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 9h6M9 13h6M9 17h4" /></svg>
);
const TrophyMini = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden><path d="M7 3h10v2h3v2.5A4.5 4.5 0 0 1 16.2 12 5 5 0 0 1 13 14.7V17h3v3H8v-3h3v-2.3A5 5 0 0 1 7.8 12 4.5 4.5 0 0 1 4 7.5V5h3V3Z" /></svg>
);
const HourglassMini = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden><path d="M6 2h12v2h-1c0 3-2 5-3.5 6.5v3C15 15 17 17 17 20h1v2H6v-2h1c0-3 2-5 3.5-6.5v-3C9 9 7 7 7 4H6V2Z" /></svg>
);
