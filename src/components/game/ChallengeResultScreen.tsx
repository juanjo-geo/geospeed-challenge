import { useEffect, useMemo, useState } from 'react';
import { type ChallengeDetail, type ChallengeRound, challengeLink } from '@/lib/challenges';
import { type MapBounds } from '@/data/cities';
import { formatDistance } from '@/lib/gameUtils';
import { cityHint } from '@/lib/cityHints';
import { playButtonTap, playShareSuccess, playVictory, playGameOver } from '@/lib/sounds';
import { fireCelebration } from '@/lib/confetti';
import { useI18n } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Flag from '@/components/ui/Flag';
import CountryPhoto from '@/components/ui/CountryPhoto';
import Mascot from './Mascot';
import WorldMapCanvas from './WorldMapCanvas';
import CityAnswersScreen from './CityAnswersScreen';
import CityReviewScreen from './CityReviewScreen';
import { type RoundResult } from './GameScreen';
import { appNumberLocale } from '@/lib/format';

interface ChallengeResultScreenProps {
  detail: ChallengeDetail;
  onBack: () => void;
  onCreateAnother: () => void;
  onRefresh: () => void;
  onRematch: () => void;
  onMyChallenges: () => void;
}

type View = 'result' | 'compare' | 'map' | 'answers' | 'answer-city';
type Outcome = 'pending' | 'win' | 'lose' | 'tie';

const noop = () => {};

function toRoundResults(d: ChallengeDetail, rounds: ChallengeRound[]): RoundResult[] {
  return rounds.map(r => ({
    city: { name: r.city_name, country: r.city_country ?? '', lat: r.city_lat, lon: r.city_lon, difficulty: d.difficulty },
    clickLat: r.click_lat ?? r.city_lat, clickLon: r.click_lon ?? r.city_lon,
    distance: r.distance_km ?? 0, basePoints: r.base_points ?? 0, multiplier: r.multiplier ?? 1,
    totalPoints: r.points, timeUsed: r.time_s ?? 0,
  }));
}

function avgDistance(rounds: ChallengeRound[]): number {
  const v = rounds.map(r => r.distance_km).filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

/** Encuadre que muestra las dos respuestas y la ciudad */
function boundsFor(pts: { lat: number; lon: number }[]): MapBounds {
  const lats = pts.map(p => p.lat), lons = pts.map(p => p.lon);
  const latMin = Math.min(...lats), latMax = Math.max(...lats), lonMin = Math.min(...lons), lonMax = Math.max(...lons);
  if (lonMax - lonMin > 150 || latMax - latMin > 90) return { latMin: -60, latMax: 80, lonMin: -180, lonMax: 180 };
  const pad = Math.max(3, Math.max(latMax - latMin, lonMax - lonMin) * 0.4);
  const cLat = (latMin + latMax) / 2, cLon = (lonMin + lonMax) / 2;
  const hLat = Math.max((latMax - latMin) / 2 + pad, 6), hLon = Math.max((lonMax - lonMin) / 2 + pad, 9);
  return { latMin: Math.max(-85, cLat - hLat), latMax: Math.min(85, cLat + hLat), lonMin: Math.max(-180, cLon - hLon), lonMax: Math.min(180, cLon + hLon) };
}

/**
 * Resultado del reto (maquetas Reto_Resultado_Pendiente / Final / Derrota / Empate, Comparación por
 * ciudad y Revisión del mapa). Se muestra cuando el jugador ya terminó su partida del reto.
 */
export default function ChallengeResultScreen({ detail, onBack, onCreateAnother, onRefresh, onRematch, onMyChallenges }: ChallengeResultScreenProps) {
  const { t, locale } = useI18n();
  const { displayName } = useAuth();
  const myName = displayName || t('ch_you');
  const [view, setView] = useState<View>('result');
  const [cityIdx, setCityIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const mine = detail.my_result;
  const rival = detail.rival_result;
  const done = detail.status === 'completed' && !!mine && !!rival;
  const outcome: Outcome = !done ? 'pending' : mine!.score > rival!.score ? 'win' : mine!.score < rival!.score ? 'lose' : 'tie';
  const rivalName = detail.rival?.name ?? t('ch_yourFriend');
  const diff = done ? Math.abs(mine!.score - rival!.score) : 0;

  useEffect(() => {
    if (outcome === 'win') { playVictory(); setTimeout(() => fireCelebration(), 300); }
    else if (outcome === 'lose') playGameOver();
  }, [outcome]);

  // Mientras falta el rival, refrescar cada 15 s
  useEffect(() => {
    if (done) return;
    const id = setInterval(onRefresh, 15000);
    return () => clearInterval(id);
  }, [done, onRefresh]);

  const myRounds = useMemo(() => (mine ? toRoundResults(detail, mine.rounds) : []), [detail, mine]);
  const rows = useMemo(() => {
    if (!mine) return [];
    return detail.cities.map((c, i) => ({
      city: c,
      me: mine.rounds.find(r => r.round_no === i + 1) ?? null,
      rv: rival?.rounds.find(r => r.round_no === i + 1) ?? null,
    }));
  }, [detail, mine, rival]);

  const share = async () => {
    const text = done
      ? t('chr_shareFinal', { mine: mine!.score.toLocaleString(appNumberLocale()), rival: rival!.score.toLocaleString(appNumberLocale()), name: rivalName })
      : t('ch_shareText', { code: detail.code, link: challengeLink(detail.code) });
    try {
      if (navigator.share) await navigator.share({ title: 'GeoSpeed', text, url: challengeLink(detail.code) });
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }
      playShareSuccess();
    } catch { /* cancelado */ }
  };
  const copy = async () => { playButtonTap(); try { await navigator.clipboard.writeText(detail.code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* sin portapapeles */ } };

  const modeLabel = t(`mode_${detail.mode}` as never);
  const diffLabel = t(`diff_${detail.difficulty}` as never);

  // ── Mis respuestas (reutiliza la revisión por ciudad de F2) ──
  if (view === 'answers') {
    return <CityAnswersScreen rounds={myRounds} focusIndex={cityIdx} onOpenCity={(i) => { setCityIdx(i); setView('answer-city'); }} onReviewAll={() => { setCityIdx(0); setView('answer-city'); }} onClose={() => setView('result')} />;
  }
  if (view === 'answer-city') {
    return <CityReviewScreen rounds={myRounds} index={cityIdx} onIndexChange={setCityIdx} onBackToList={() => setView('answers')} onClose={() => setView('result')} />;
  }

  // ── Revisión del mapa del reto: ambas respuestas ──
  if (view === 'map' && done) {
    return <ChallengeMapReview detail={detail} rows={rows} index={cityIdx} rivalName={rivalName} onIndexChange={setCityIdx} onBack={() => setView('compare')} />;
  }

  // ── Comparación por ciudad ──
  if (view === 'compare' && done) {
    return <ChallengeCompare detail={detail} rows={rows} rivalName={rivalName} onOpenMap={(i) => { setCityIdx(i); setView('map'); }} onBack={() => setView('result')} />;
  }

  // ── Resultado ──
  const title = outcome === 'pending' ? t('chr_pendingTitle') : outcome === 'win' ? t('chr_winTitle') : outcome === 'lose' ? t('chr_loseTitle') : t('chr_tieTitle');
  const subtitle = outcome === 'pending' ? t('chr_pendingSub') : outcome === 'win' ? t('chr_winSub') : outcome === 'lose' ? t('chr_loseSub') : t('chr_tieSub');
  const mascot = outcome === 'win' ? 'celebrate' : outcome === 'lose' ? 'sad' : outcome === 'tie' ? 'wink' : 'idle';

  return (
    <Shell onBack={onBack} title={title} subtitle={subtitle}>
      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-card/60 px-4 py-1.5 text-xs sm:text-sm font-bold">
          🌍 {modeLabel} · <span className="text-accent">{diffLabel}</span>
          {done && <><span className="text-muted-foreground">|</span> ✅ {t('chr_bothDone')}</>}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-start">
        {/* Puntajes */}
        <section className="rounded-3xl border border-accent/40 bg-card/70 p-4 sm:p-5">
          {outcome === 'pending' ? (
            <div className="flex flex-col items-center text-center">
              <Mascot state="idle" className="w-24 sm:w-28 short:w-16" />
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('chr_yourScore')}</p>
              <p className="font-black font-mono text-4xl sm:text-5xl text-primary">{mine?.score.toLocaleString(appNumberLocale()) ?? '—'} <span className="text-base text-foreground">pts</span></p>
              <div className="grid grid-cols-2 gap-2 w-full mt-3">
                <Tile icon="📍" label={t('final_cities')} value={`${mine?.rounds.length ?? 0} / ${detail.rounds_total}`} />
                <Tile icon="🗺️" label={t('final_avgDist')} value={formatDistance(avgDistance(mine?.rounds ?? []))} />
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2 mb-2 short:hidden" aria-hidden>
                <Mascot state={mascot} className="w-20 sm:w-24" />
                <Mascot state={outcome === 'lose' ? 'celebrate' : 'wink'} className="w-20 sm:w-24 hue-rotate-[140deg]" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <PlayerCard name={myName} score={mine!.score} tag={outcome === 'win' ? 'winner' : outcome === 'tie' ? 'tie' : 'done'} mine showYou={!!displayName} t={t} />
                <PlayerCard name={rivalName} score={rival!.score} tag={outcome === 'lose' ? 'winner' : outcome === 'tie' ? 'tie' : 'done'} t={t} />
              </div>
              <p className="mt-3 text-center text-sm sm:text-base">
                {outcome === 'tie' ? <b>⚌ {t('chr_sameScore')}</b>
                  : outcome === 'win' ? <><b className="text-primary font-mono text-lg">+{diff.toLocaleString(appNumberLocale())}</b> {t('chr_pointsDiff')}</>
                  : <b>{t('chr_pointsToWin', { n: diff.toLocaleString(appNumberLocale()) })}</b>}
              </p>
            </>
          )}
        </section>

        <div className="flex flex-col gap-4">
          {outcome === 'pending' ? (
            <>
              <section className="rounded-3xl border border-border bg-card/70 p-4 sm:p-5">
                <h2 className="text-lg sm:text-xl font-black mb-3">👥 {t('chr_compareLead')} <span className="text-primary">{t('chr_compareTail')}</span></h2>
                <div className="flex flex-col gap-2">
                  <Participant name={myName} ok label={t('chr_completed')} me />
                  <Participant name={rivalName} ok={false} label={detail.rival ? t('chr_notFinished') : t('ch_statusToJoin')} />
                </div>
                <p className="mt-2 text-[11px] sm:text-xs text-muted-foreground text-center">ⓘ {t('chr_finalWhenBoth')}</p>
              </section>
              <section className="rounded-3xl border border-border bg-card/70 p-4 sm:p-5">
                <h2 className="text-lg sm:text-xl font-black mb-2">🔗 {t('ch_codeLead')} <span className="text-primary">{t('ch_codeTail')}</span></h2>
                <div className="flex items-stretch gap-2">
                  <span className="flex-1 rounded-2xl border border-border bg-muted/30 py-2 text-center font-mono font-black text-xl tracking-[0.4em] pl-[0.4em]">{detail.code}</span>
                  <button onClick={copy} className="rounded-2xl border border-accent/60 text-accent px-3 font-bold text-sm hover:bg-accent/10">{copied ? '✓' : '📋'} <span className="hidden min-[420px]:inline">{copied ? t('ch_copied') : t('ch_copy')}</span></button>
                </div>
                <button onClick={share} className="mt-2 w-full rounded-2xl py-2.5 border-2 border-accent text-accent font-black hover:bg-accent/10">🔗 {t('ch_share')}</button>
              </section>
            </>
          ) : (
            <>
              <section className="rounded-3xl border border-border bg-card/70 p-4 sm:p-5">
                <h2 className="text-lg sm:text-xl font-black mb-2">📊 {t('chr_howItWent')}</h2>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-muted-foreground"><th className="text-left font-semibold pb-1"></th><th className="text-primary font-black pb-1">{t('ch_you')}</th><th className="text-accent font-black pb-1">{rivalName}</th></tr></thead>
                  <tbody>
                    <tr className="border-t border-border/60"><td className="py-1.5">📍 {t('final_cities')}</td><td className="text-center font-mono font-bold">{mine!.rounds.length} / {detail.rounds_total}</td><td className="text-center font-mono font-bold">{rival!.rounds.length} / {detail.rounds_total}</td></tr>
                    <tr className="border-t border-border/60"><td className="py-1.5">🗺️ {t('final_avgDist')}</td><td className="text-center font-mono font-bold">{formatDistance(avgDistance(mine!.rounds))}</td><td className="text-center font-mono font-bold">{formatDistance(avgDistance(rival!.rounds))}</td></tr>
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] sm:text-xs text-muted-foreground text-center">ⓘ {t('chr_sameForBoth')}</p>
              </section>
              {outcome === 'win' ? (
                <>
                  <button onClick={() => { playButtonTap(); setView('compare'); }} className="btn3d w-full rounded-2xl py-3.5 short:py-2.5 font-black text-base sm:text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
                    📋 {t('chr_compareByCity')}
                  </button>
                  <button onClick={() => { playButtonTap(); onCreateAnother(); }} className="w-full rounded-2xl py-3 border-2 border-accent text-accent font-black hover:bg-accent/10">
                    ＋ {t('chr_createAnother')}
                  </button>
                </>
              ) : (
                /* Derrota y empate: Pedir revancha es la acción principal (consolidado §5) */
                <>
                  <button onClick={() => { playButtonTap(); onRematch(); }} className="btn3d w-full rounded-2xl py-3 short:py-2.5 px-4 text-primary-foreground flex flex-col items-center leading-tight" style={{ background: 'var(--grad-cta)' }}>
                    <span className="font-black text-base sm:text-lg">↻ {t('chr_rematch')}</span>
                    <span className="text-[11px] sm:text-xs font-semibold opacity-80">{t('chr_rematchSub')}</span>
                  </button>
                  <button onClick={() => { playButtonTap(); setView('compare'); }} className="w-full rounded-2xl py-3 border-2 border-accent text-accent font-black hover:bg-accent/10">
                    📋 {t('chr_compareByCity')}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {outcome === 'pending' && (
        <p className="mt-4 rounded-2xl border border-border bg-muted/20 p-3 text-center text-xs sm:text-sm"><b>{t('chr_canLeave')}</b> <span className="text-muted-foreground">{t('chr_saved')}</span></p>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1.4fr_1fr]">
        <button onClick={() => { playButtonTap(); onBack(); }} className="btn3d rounded-2xl py-3.5 short:py-2.5 font-black text-lg text-primary-foreground" style={{ background: outcome === 'pending' ? 'var(--grad-cta)' : undefined, ...(outcome !== 'pending' ? { background: 'hsl(var(--muted) / 0.4)', boxShadow: 'none', color: 'hsl(var(--foreground))' } : {}) }}>
          🏠 {t('ob_backHome')}
        </button>
        {outcome === 'pending'
          ? <button onClick={() => { playButtonTap(); setView('answers'); }} className="rounded-2xl py-3 border border-border bg-muted/20 font-bold hover:bg-muted">📄 {t('chr_myAnswers')}</button>
          : <button onClick={share} className="rounded-2xl py-3 border border-border bg-muted/20 font-bold hover:bg-muted">📤 {t('chr_shareResult')}</button>}
      </div>
      <p className="mt-3 text-center">
        <button onClick={() => { playButtonTap(); onMyChallenges(); }} className="text-xs sm:text-sm font-bold text-accent hover:underline">📋 {t('mc_viewMine')}</button>
      </p>
    </Shell>
  );
}

// ───────────────────────── Comparación por ciudad ─────────────────────────
type Row = { city: ChallengeDetail['cities'][number]; me: ChallengeRound | null; rv: ChallengeRound | null };

function ChallengeCompare({ detail, rows, rivalName, onOpenMap, onBack }: { detail: ChallengeDetail; rows: Row[]; rivalName: string; onOpenMap: (i: number) => void; onBack: () => void }) {
  const { t } = useI18n();
  const perPage = typeof window !== 'undefined' && window.innerWidth >= 768 ? 3 : typeof window !== 'undefined' && window.innerHeight <= 500 ? 2 : 1;
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const slice = rows.slice(page * perPage, page * perPage + perPage);
  const mine = detail.my_result!, rival = detail.rival_result!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); else if (e.key === 'ArrowRight') setPage(p => Math.min(pages - 1, p + 1)); else if (e.key === 'ArrowLeft') setPage(p => Math.max(0, p - 1)); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [onBack, pages]);

  return (
    <Shell onBack={onBack} title={t('chc_title')} subtitle={t('chc_sub')}>
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-bold">🌍 {t(`mode_${detail.mode}` as never)} · <span className="text-accent">{t(`diff_${detail.difficulty}` as never)}</span> · {t('chc_nCities', { n: rows.length })}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 max-w-md mx-auto mb-4">
        <ScorePill name={t('ch_you')} score={mine.score} me winner={mine.score >= rival.score} />
        <ScorePill name={rivalName} score={rival.score} winner={rival.score >= mine.score} />
      </div>

      <div className={`grid gap-3 ${perPage === 3 ? 'md:grid-cols-3' : perPage === 2 ? 'grid-cols-2' : ''}`}>
        {slice.map((row, i) => {
          const idx = page * perPage + i;
          const mp = row.me?.points ?? 0, rp = row.rv?.points ?? 0;
          const who = mp > rp ? 'me' : rp > mp ? 'rival' : 'tie';
          return (
            <section key={idx} className="rounded-3xl border border-border bg-card/70 p-3 sm:p-4 flex flex-col gap-2">
              <CountryPhoto country={row.city.country} size="sm" className="-mx-3 -mt-3 sm:-mx-4 sm:-mt-4 h-24 rounded-t-3xl" />
              <div className="flex items-center gap-2">
                <Flag country={row.city.country} className="w-8" />
                <p className="min-w-0 truncate"><span className="font-black text-base sm:text-lg">{row.city.name}</span><span className="text-muted-foreground text-sm"> · {row.city.country}</span></p>
                <span className="ml-auto text-xs text-muted-foreground font-mono">{idx + 1}/{rows.length}</span>
              </div>
              <table className="w-full text-xs sm:text-sm">
                <thead><tr className="text-[11px] text-muted-foreground"><th className="text-left font-semibold"></th><th className="text-primary font-black">{t('ch_you')}</th><th className="text-accent font-black">{rivalName}</th></tr></thead>
                <tbody className="font-mono font-bold">
                  <CmpRow icon="📍" label={t('game_distance')} a={row.me?.distance_km != null ? formatDistance(row.me.distance_km) : '—'} b={row.rv?.distance_km != null ? formatDistance(row.rv.distance_km) : '—'} />
                  <CmpRow icon="⏱️" label={t('game_time')} a={row.me?.time_s != null ? `${row.me.time_s} s` : '—'} b={row.rv?.time_s != null ? `${row.rv.time_s} s` : '—'} />
                  <CmpRow icon="🏆" label={t('game_points')} a={mp.toLocaleString(appNumberLocale())} b={rp.toLocaleString(appNumberLocale())} hiA={who === 'me'} hiB={who === 'rival'} />
                </tbody>
              </table>
              <div className="grid grid-cols-[1.3fr_1fr] gap-2 mt-auto">
                <span className={`rounded-xl py-1.5 text-center text-[11px] sm:text-xs font-black ${who === 'me' ? 'bg-primary text-primary-foreground' : who === 'rival' ? 'bg-accent text-accent-foreground' : 'border border-border text-muted-foreground'}`}>
                  🏆 {who === 'me' ? t('chc_morePointsYou') : who === 'rival' ? t('chc_morePointsRival') : t('chc_evenPoints')}
                </span>
                <button onClick={() => { playButtonTap(); onOpenMap(idx); }} className="rounded-xl border border-accent/70 text-accent py-1.5 text-[11px] sm:text-xs font-bold hover:bg-accent/10">🗺️ {t('chc_viewMap')}</button>
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">ⓘ {t('chc_mapHint')}</p>
        <div className="flex items-center gap-2 col-start-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-9 h-9 rounded-xl border border-border bg-muted/20 font-black disabled:opacity-35" aria-label={t('review_prev')}>‹</button>
          <span className="text-xs sm:text-sm font-bold whitespace-nowrap">{t('chc_range', { from: page * perPage + 1, to: page * perPage + slice.length, total: rows.length })}</span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="w-9 h-9 rounded-xl border border-border bg-muted/20 font-black disabled:opacity-35" aria-label={t('review_next')}>›</button>
        </div>
        <button onClick={() => { playButtonTap(); onBack(); }} className="justify-self-end rounded-2xl px-4 py-2 border border-border bg-muted/20 font-bold text-xs sm:text-sm hover:bg-muted">← {t('chc_backToResult')}</button>
      </div>
    </Shell>
  );
}

// ───────────────────────── Revisión del mapa del reto ─────────────────────────
function ChallengeMapReview({ detail, rows, index, rivalName, onIndexChange, onBack }: { detail: ChallengeDetail; rows: Row[]; index: number; rivalName: string; onIndexChange: (i: number) => void; onBack: () => void }) {
  const { t, locale } = useI18n();
  const row = rows[index];
  const total = rows.length;
  const correct = useMemo(() => ({ lat: row.city.lat, lon: row.city.lon }), [row.city.lat, row.city.lon]);
  const me = useMemo(() => (row.me?.click_lat != null && row.me.click_lon != null ? { lat: row.me.click_lat, lon: row.me.click_lon } : correct), [row.me, correct]);
  const rv = useMemo(() => (row.rv?.click_lat != null && row.rv.click_lon != null ? { lat: row.rv.click_lat, lon: row.rv.click_lon, label: rivalName, distanceKm: row.rv.distance_km } : null), [row.rv, rivalName]);
  const bounds = useMemo(() => boundsFor([me, correct, ...(rv ? [rv] : [])]), [me, correct, rv]);
  const pinLabels = useMemo(() => ({ you: t('ch_you'), correct: `${row.city.name} · ${t('chm_correct')}` }), [t, row.city.name]);
  const hint = cityHint({ name: row.city.name, country: row.city.country, lat: row.city.lat, lon: row.city.lon }, locale === 'en' ? 'en' : 'es');
  const mp = row.me?.points ?? 0, rp = row.rv?.points ?? 0;
  const who = mp > rp ? 'me' : rp > mp ? 'rival' : 'tie';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); else if (e.key === 'ArrowRight' && index < total - 1) onIndexChange(index + 1); else if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [index, total, onIndexChange, onBack]);

  return (
    <div className="fixed inset-0 z-[105] game-bg flex flex-col gap-2 short:gap-1.5 animate-fade-in" role="dialog" aria-modal="true" aria-label={t('chm_title')}
      style={{ padding: 'max(0.5rem, var(--sat)) max(0.75rem, var(--sar)) max(0.5rem, var(--sab)) max(0.75rem, var(--sal))' }}>
      <div className="shrink-0 w-full max-w-6xl mx-auto rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-3 py-2 short:py-1.5 flex items-center gap-2 sm:gap-3">
        <button onClick={() => { playButtonTap(); onBack(); }} className="shrink-0 rounded-full border border-border/60 px-3 py-1 text-xs sm:text-sm font-bold hover:bg-muted">← <span className="hidden sm:inline">{t('chm_backToCompare')}</span></button>
        <Flag country={row.city.country} className="w-7 sm:w-9" />
        <p className="min-w-0 flex-1 truncate text-center"><span className="font-black text-sm sm:text-lg">{row.city.name}</span><span className="text-muted-foreground text-xs sm:text-base"> · {row.city.country}</span></p>
        <span className="shrink-0 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{t('review_cityN')} <b className="text-foreground">{index + 1}</b> / {total}</span>
        <span className="hidden min-[640px]:inline rounded-xl border border-accent/70 text-accent px-2 py-0.5 text-[11px] font-bold whitespace-nowrap">🗺️ {t('chm_badge')}</span>
      </div>

      <div className="flex-1 min-h-0 w-full max-w-6xl mx-auto flex flex-col landscape:flex-row gap-2 short:gap-1.5">
        <div className="relative flex-1 min-h-[180px] landscape:min-h-0 rounded-2xl overflow-hidden border border-border/80 [&>div]:!min-h-0">
          <WorldMapCanvas onMapClick={noop} clickDisabled userClick={me} correctLocation={correct} distanceKm={row.me?.distance_km ?? null} gameMode="world" viewBounds={bounds} pinLabels={pinLabels} rivalClick={rv} />
          <div className="absolute left-2 bottom-2 rounded-xl border border-border/70 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold flex items-center gap-3 short:hidden" style={{ background: 'hsl(var(--brand-navy-deep) / 0.8)' }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" aria-hidden /> {t('ch_you')}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent" aria-hidden /> {rivalName}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-foreground" aria-hidden /> {t('chm_correct')}</span>
          </div>
        </div>
        <aside className="shrink-0 landscape:w-[min(38%,22rem)] max-h-[45%] landscape:max-h-none rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-3 short:p-2 overflow-y-auto flex flex-col gap-2 short:gap-1.5">
          <h3 className="font-black text-base sm:text-lg short:text-sm">{t('chm_compareLead')} <span className="text-primary">{t('chm_compareTail')}</span></h3>
          <table className="w-full text-xs sm:text-sm">
            <thead><tr className="text-[11px] text-muted-foreground"><th></th><th className="text-primary font-black">{t('ch_you')}</th><th className="text-accent font-black">{rivalName}</th></tr></thead>
            <tbody className="font-mono font-bold">
              <CmpRow icon="📍" label={t('game_distance')} a={row.me?.distance_km != null ? formatDistance(row.me.distance_km) : '—'} b={row.rv?.distance_km != null ? formatDistance(row.rv.distance_km) : '—'} />
              <CmpRow icon="⏱️" label={t('game_time')} a={row.me?.time_s != null ? `${row.me.time_s} s` : '—'} b={row.rv?.time_s != null ? `${row.rv.time_s} s` : '—'} />
              <CmpRow icon="🏆" label={t('game_points')} a={`+${mp.toLocaleString(appNumberLocale())}`} b={`+${rp.toLocaleString(appNumberLocale())}`} hiA={who === 'me'} hiB={who === 'rival'} />
            </tbody>
          </table>
          <span className={`self-center rounded-full px-3 py-1 text-[11px] sm:text-xs font-black ${who === 'me' ? 'bg-primary text-primary-foreground' : who === 'rival' ? 'bg-accent text-accent-foreground' : 'border border-border text-muted-foreground'}`}>
            🏆 {who === 'me' ? t('chc_morePointsYou') : who === 'rival' ? t('chc_morePointsRival') : t('chc_evenPoints')}
          </span>
          <div className="rounded-2xl border border-border bg-muted/20 p-2.5 short:p-2">
            <p className="font-black text-sm short:text-xs">🧭 {t('review_toRemember')}</p>
            <p className="text-xs sm:text-sm short:text-[11px] text-muted-foreground leading-snug mt-0.5">{hint}</p>
          </div>
        </aside>
      </div>

      <div className="shrink-0 w-full max-w-6xl mx-auto grid grid-cols-[1fr_auto_1.3fr] gap-2">
        <button onClick={() => { playButtonTap(); onBack(); }} className="rounded-2xl border border-border bg-muted/20 py-2.5 short:py-2 px-2 font-bold text-xs sm:text-base hover:bg-muted truncate">← {t('chm_backToCompare')}</button>
        <button onClick={() => { if (index > 0) { playButtonTap(); onIndexChange(index - 1); } }} disabled={index === 0} className="rounded-2xl border border-border bg-muted/20 py-2.5 short:py-2 px-3 sm:px-6 font-bold text-xs sm:text-base disabled:opacity-35 hover:bg-muted">‹ <span className="hidden min-[420px]:inline">{t('review_prev')}</span></button>
        <button onClick={() => { playButtonTap(); if (index >= total - 1) onBack(); else onIndexChange(index + 1); }} className="btn3d rounded-2xl py-2.5 short:py-2 px-2 font-black text-xs sm:text-base text-primary-foreground truncate" style={{ background: 'var(--grad-cta)' }}>
          {index >= total - 1 ? `${t('review_finish')} ✓` : `${t('review_next')} →`}
        </button>
      </div>
    </div>
  );
}

// ───────────────────────── Piezas ─────────────────────────
function Shell({ onBack, title, subtitle, children }: { onBack: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-5xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={title} subtitle={subtitle} />
        {children}
      </div>
    </div>
  );
}

function Tile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-2.5 flex items-center gap-2 text-left">
      <span className="text-2xl" aria-hidden>{icon}</span>
      <span className="min-w-0"><span className="block text-[11px] text-muted-foreground">{label}</span><span className="block font-mono font-black text-base sm:text-lg truncate">{value}</span></span>
    </div>
  );
}

function PlayerCard({ name, score, tag, mine, showYou, t }: { name: string; score: number; tag: 'winner' | 'done' | 'tie'; mine?: boolean; showYou?: boolean; t: (k: never) => string }) {
  return (
    <div className={`rounded-2xl border-2 p-3 sm:p-4 text-center ${tag === 'winner' ? 'border-primary bg-primary/10 shadow-[0_0_18px_hsl(var(--primary)/0.3)]' : 'border-border bg-muted/20'}`}>
      <div className="relative inline-block">
        <Mascot state={tag === 'winner' ? 'celebrate' : 'wink'} className={`w-12 sm:w-14 ${mine ? '' : 'hue-rotate-[140deg]'}`} />
        {tag === 'winner' && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-base" aria-hidden>👑</span>}
      </div>
      <p className="font-bold text-sm sm:text-base truncate">{name}{showYou && <span className="text-primary"> · {t('ch_you' as never)}</span>}</p>
      <p className={`font-black font-mono text-3xl sm:text-4xl ${mine ? 'text-primary' : ''}`}>{score.toLocaleString(appNumberLocale())}</p>
      <p className="text-xs text-muted-foreground -mt-1">{t('game_points' as never).toLowerCase()}</p>
      <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[11px] sm:text-xs font-black ${tag === 'winner' ? 'bg-primary text-primary-foreground' : tag === 'tie' ? 'border border-primary text-primary' : 'border border-accent text-accent'}`}>
        {tag === 'winner' ? `🏆 ${t('chr_winner' as never)}` : tag === 'tie' ? `⚌ ${t('chr_tie' as never)}` : `✅ ${t('chr_completed' as never)}`}
      </span>
    </div>
  );
}

function Participant({ name, ok, label, me }: { name: string; ok: boolean; label: string; me?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 px-3 py-2">
      <Mascot state={me ? 'idle' : 'wink'} className={`w-8 shrink-0 ${me ? '' : 'hue-rotate-[140deg] opacity-80'}`} />
      <span className="flex-1 font-bold truncate">{name}</span>
      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] sm:text-xs font-bold whitespace-nowrap ${ok ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`}>{ok ? '✅' : '🕒'} {label}</span>
    </div>
  );
}

function ScorePill({ name, score, me, winner }: { name: string; score: number; me?: boolean; winner: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2 ${winner ? (me ? 'border-primary' : 'border-accent') : 'border-border'} bg-card/70`}>
      <Mascot state={winner ? 'celebrate' : 'wink'} className={`w-9 ${me ? '' : 'hue-rotate-[140deg]'}`} />
      <span className="min-w-0"><span className={`block text-[11px] font-bold truncate ${me ? 'text-primary' : 'text-accent'}`}>{name}</span><span className="block font-mono font-black text-xl leading-none">{score.toLocaleString(appNumberLocale())}</span></span>
    </div>
  );
}

function CmpRow({ icon, label, a, b, hiA, hiB }: { icon: string; label: string; a: string; b: string; hiA?: boolean; hiB?: boolean }) {
  return (
    <tr className="border-t border-border/60">
      <td className="py-1 font-sans font-semibold text-muted-foreground whitespace-nowrap">{icon} {label}</td>
      <td className={`py-1 text-center ${hiA ? 'text-primary' : ''}`}>{a}</td>
      <td className={`py-1 text-center ${hiB ? 'text-accent' : ''}`}>{b}</td>
    </tr>
  );
}
