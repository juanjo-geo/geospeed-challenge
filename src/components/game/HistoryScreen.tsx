import { useCallback, useEffect, useMemo, useState } from 'react';
import { MODE_CONFIG, type Difficulty, type GameMode } from '@/data/cities';
import { fetchHistoryPage, hasAnyHistory, loadRounds, type HistoryItem, type HistoryFilters } from '@/lib/history';
import { formatDistance } from '@/lib/gameUtils';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SelectorSheet, { type SelectorOption } from './SelectorSheet';
import Mascot from './Mascot';
import CityAnswersScreen from './CityAnswersScreen';
import CityReviewScreen from './CityReviewScreen';
import { type RoundResult } from './GameScreen';
import { appNumberLocale } from '@/lib/format';

interface HistoryScreenProps {
  onBack: () => void;
  onPlay: () => void;
  onMyChallenges: () => void;
}

const DIFFS: Difficulty[] = ['basic', 'easy', 'medium', 'hard'];
const DIFF_EMOJI: Record<Difficulty, string> = { basic: '🎒', easy: '🧭', medium: '⚡', hard: '🔥' };

/** Historial de partidas (maquetas Historial / Historial_Vacio): filtros, tabla, cargar más, detalle por ciudad. */
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

  const modeOptions: SelectorOption<string>[] = [
    { key: '', emoji: '🌐', label: t('hist_all'), desc: t('hist_allRegionsDesc') },
    ...MODE_CONFIG.map(m => ({ key: m.key, emoji: m.emoji, label: t(`mode_${m.key}` as never) || m.label, desc: '' })),
    { key: 'mundial', emoji: '⚽', label: t('wc_modeName'), desc: '' },
  ];
  const diffOptions: SelectorOption<string>[] = [
    { key: '', emoji: '🌐', label: t('hist_all'), desc: t('hist_allDiffsDesc') },
    ...DIFFS.map(d => ({ key: d, emoji: DIFF_EMOJI[d], label: t(`diff_${d}` as never), desc: '' })),
  ];
  const modeLabel = filters.mode ? (filters.mode === 'mundial' ? t('wc_modeName') : t(`mode_${filters.mode}` as never)) : t('hist_all');
  const diffLabel = filters.difficulty ? t(`diff_${filters.difficulty}` as never) : t('hist_all');
  const filtered = !!filters.mode || !!filters.difficulty;

  // ── Detalle por ciudad (reutiliza F2) ──
  if (detail?.view === 'list') {
    return <CityAnswersScreen rounds={detail.rounds} isMundial={detail.item.gameType === 'mundial'} focusIndex={detail.idx} onOpenCity={(i) => setDetail({ ...detail, view: 'city', idx: i })} onReviewAll={() => setDetail({ ...detail, view: 'city', idx: 0 })} onClose={() => setDetail(null)} />;
  }
  if (detail?.view === 'city') {
    return <CityReviewScreen rounds={detail.rounds} index={detail.idx} isMundial={detail.item.gameType === 'mundial'} onIndexChange={(i) => setDetail({ ...detail, idx: i })} onBackToList={() => setDetail({ ...detail, view: 'list' })} onClose={() => setDetail(null)} />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-5xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('hist_title')} subtitle={t('hist_subtitle')} right={<Mascot state="wink" className="hidden md:block w-16 -my-2" />} />

        {/* Filtros + orden */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <FilterButton icon="🌐" label={t('ch_region')} value={modeLabel} onClick={() => { playButtonTap(); setSheet('mode'); }} />
          <FilterButton icon="🧭" label={t('ch_difficulty')} value={diffLabel} onClick={() => { playButtonTap(); setSheet('difficulty'); }} />
          <button onClick={() => { playButtonTap(); setNewestFirst(v => !v); }} className="ml-auto text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
            ⇅ {newestFirst ? t('hist_newestFirst') : t('hist_oldestFirst')}
          </button>
        </div>

        {error ? (
          <Empty mascot="sad" title={t('mc_loadError')} cta={`🔄 ${t('mc_retry')}`} onCta={() => load(filters)} onBack={onBack} t={t} />
        ) : items === null ? (
          <div className="flex justify-center py-12"><Mascot state="idle" className="w-20 animate-mascot-float" /></div>
        ) : items.length === 0 ? (
          anyGames === false || !filtered
            ? <Empty mascot="idle" lead={t('hist_emptyLead')} tail={t('hist_emptyTail')} desc={t('hist_emptyDesc')} cta={`▶ ${t('hist_playNow')}`} onCta={onPlay} onBack={onBack} t={t} />
            : <Empty mascot="wink" title={t('hist_noMatchTitle')} desc={t('hist_noMatchDesc')} cta={t('hist_clearFilters')} onCta={() => setFilters({})} onBack={onBack} t={t} />
        ) : (
          <>
            <div className="rounded-3xl border border-border bg-card/70 overflow-hidden">
              {/* Encabezado de tabla (md+) */}
              <div className="hidden md:grid grid-cols-[6.5rem_1fr_9rem_5.5rem_5.5rem_7rem_7rem] gap-2 px-4 py-2 text-xs font-bold text-muted-foreground border-b border-border/60">
                <span>{t('hist_date')}</span><span>{t('hist_game')}</span><span>{t('hist_status')}</span><span className="text-right">{t('game_points')}</span><span className="text-right">{t('final_cities')}</span><span className="text-right">{t('final_avgDist')}</span><span className="text-right">{t('hist_detail')}</span>
              </div>
              <ul className="divide-y divide-border/50">
                {shown.map(item => <Row key={item.id} item={item} locale={locale} opening={opening === item.id} onOpen={() => openDetail(item)} />)}
              </ul>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-[11px] sm:text-xs text-muted-foreground">ⓘ {t('hist_detailHint')}</p>
              {hasMore && (
                <button onClick={loadMore} disabled={loadingMore} className="rounded-2xl border-2 border-accent text-accent px-5 py-2.5 font-black text-sm hover:bg-accent/10 disabled:opacity-60">
                  {loadingMore ? '⏳' : '🔄'} {t('hist_loadMore')}
                </button>
              )}
            </div>
          </>
        )}

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-xs sm:text-sm text-muted-foreground">📋 {t('hist_friendsQ')} <button onClick={() => { playButtonTap(); onMyChallenges(); }} className="font-bold text-accent hover:underline">{t('hist_goToChallenges')} →</button></p>
          <button onClick={() => { playButtonTap(); onBack(); }} className="rounded-2xl border border-border bg-muted/20 px-4 py-2 font-bold text-sm hover:bg-muted">🏠 {t('ob_backHome')}</button>
        </div>
      </div>

      {sheet === 'mode' && (
        <SelectorSheet<string> title={t('hist_pickRegion')} subtitle={t('hist_pickRegionSub')} options={modeOptions} selected={filters.mode ?? ''} confirmLabel={t('hist_apply')}
          onConfirm={(k) => { setFilters(f => ({ ...f, mode: k || undefined })); setSheet(null); }} onClose={() => setSheet(null)} closeLabel={t('close')} />
      )}
      {sheet === 'difficulty' && (
        <SelectorSheet<string> title={t('hist_pickDiff')} subtitle={t('hist_pickDiffSub')} options={diffOptions} selected={filters.difficulty ?? ''} confirmLabel={t('hist_apply')}
          onConfirm={(k) => { setFilters(f => ({ ...f, difficulty: k || undefined })); setSheet(null); }} onClose={() => setSheet(null)} closeLabel={t('close')} />
      )}
    </div>
  );
}

function FilterButton({ icon, label, value, onClick }: { icon: string; label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-2xl border border-accent/50 bg-card/60 px-3 py-2 text-sm hover:border-accent">
      <span aria-hidden>{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-black text-primary">{value}</span>
      <span className="text-accent" aria-hidden>⌄</span>
    </button>
  );
}

function gameLabel(item: HistoryItem, t: (k: never, p?: Record<string, string | number>) => string): { emoji: string; name: string; sub: string } {
  const diff = t(`diff_${item.difficulty}` as never);
  switch (item.gameType) {
    case 'mundial': return { emoji: '⚽', name: t('wc_modeName' as never), sub: t(`wc_diff_${item.difficulty}` as never) };
    case 'timeattack': return { emoji: '⚡', name: t('ta_hud' as never), sub: `${t(`mode_${item.mode}` as never)} · ${diff}` };
    case 'daily': return { emoji: '📅', name: t('home_dailyCard' as never), sub: `${t(`mode_${item.mode}` as never)} · ${diff}` };
    case 'challenge': return { emoji: '⚔️', name: t('ch_countdownLabel' as never), sub: `${t(`mode_${item.mode}` as never)} · ${diff}` };
    case 'training': return { emoji: '🎯', name: t('game_training' as never), sub: `${t(`mode_${item.mode}` as never)} · ${diff}` };
    default: return { emoji: '🌍', name: t(`mode_${item.mode}` as never) || item.mode, sub: diff };
  }
}

function Row({ item, locale, opening, onOpen }: { item: HistoryItem; locale: string; opening: boolean; onOpen: () => void }) {
  const { t } = useI18n();
  const d = new Date(item.createdAt);
  // Partidas de la cola offline anteriores a F5 no traen fecha (quedan en 1970): no se muestra
  const valid = !Number.isNaN(d.getTime()) && d.getTime() > Date.UTC(2000, 0, 1);
  const date = valid ? d.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const time = valid ? d.toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
  const g = gameLabel(item, t as never);
  const status = item.endReason === 'complete'
    ? { label: t('hist_completed'), cls: 'bg-primary text-primary-foreground' }
    : item.endReason === 'timeout' ? { label: t('hist_timeout'), cls: 'border border-accent/60 text-accent' }
    : { label: t('hist_abandoned'), cls: 'border border-border text-muted-foreground' };
  const cities = item.gameType === 'timeattack' ? String(item.roundsPlayed) : `${item.roundsPlayed} / ${item.roundsTotal}`;
  const dist = item.gameType === 'mundial' || item.avgDistanceKm == null ? '—' : formatDistance(item.avgDistanceKm);

  return (
    <li className="px-3 sm:px-4 py-2.5 md:grid md:grid-cols-[6.5rem_1fr_9rem_5.5rem_5.5rem_7rem_7rem] md:gap-2 md:items-center">
      {/* Móvil: tarjeta; escritorio: fila de tabla */}
      <div className="text-xs text-muted-foreground md:text-sm md:text-foreground"><span className="font-bold text-foreground">{date}</span> <span className="md:block">{time}</span></div>
      <div className="flex items-center gap-2 mt-1 md:mt-0 min-w-0">
        <span className="text-xl" aria-hidden>{g.emoji}</span>
        <span className="min-w-0 truncate"><span className="font-black">{g.name}</span><span className="text-muted-foreground"> · </span><span className="font-bold text-accent">{g.sub}</span></span>
      </div>
      <div className="mt-1.5 md:mt-0"><span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.cls}`}>{status.label}</span></div>
      <div className="mt-1.5 md:mt-0 flex md:block items-center gap-3 text-sm md:text-right">
        <span className="font-mono font-black text-primary text-base">{item.score.toLocaleString(appNumberLocale())}<span className="md:hidden text-xs text-foreground"> pts</span></span>
        <span className="md:hidden font-mono text-muted-foreground">📊 {cities}</span>
        <span className="md:hidden font-mono text-muted-foreground">📍 {dist}</span>
      </div>
      <div className="hidden md:block text-right font-mono font-bold">📊 {cities}</div>
      <div className="hidden md:block text-right font-mono font-bold">📍 {dist}</div>
      <div className="mt-2 md:mt-0 md:text-right">
        {item.hasDetail ? (
          <button onClick={onOpen} disabled={opening} className="rounded-xl border border-accent/70 text-accent px-3 py-1.5 text-xs font-bold hover:bg-accent/10 disabled:opacity-60">{opening ? '⏳' : `${t('hist_viewDetail')} →`}</button>
        ) : (
          <span className="text-[11px] text-muted-foreground" title={t('hist_noDetail')}>{t('hist_noDetail')}</span>
        )}
      </div>
    </li>
  );
}

function Empty({ mascot, lead, tail, title, desc, cta, onCta, onBack, t }: { mascot: 'idle' | 'wink' | 'sad'; lead?: string; tail?: string; title?: string; desc?: string; cta: string; onCta: () => void; onBack: () => void; t: (k: never) => string }) {
  return (
    <section className="max-w-xl mx-auto rounded-3xl border border-accent/50 bg-card/70 p-6 sm:p-8 text-center">
      <Mascot state={mascot} className="w-24 sm:w-28 mx-auto" />
      <h2 className="mt-3 text-2xl sm:text-3xl font-black leading-tight">{title ?? <>{lead} <span className="text-primary">{tail}</span></>}</h2>
      {desc && <p className="mt-2 text-sm sm:text-base text-muted-foreground">{desc}</p>}
      <button onClick={() => { playButtonTap(); onCta(); }} className="btn3d mt-5 w-full max-w-xs rounded-2xl py-3.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{cta}</button>
      <button onClick={() => { playButtonTap(); onBack(); }} className="mt-3 block mx-auto text-sm font-bold text-accent hover:underline">🏠 {t('ob_backHome' as never)}</button>
    </section>
  );
}
