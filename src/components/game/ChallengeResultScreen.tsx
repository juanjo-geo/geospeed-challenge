import { useEffect, useMemo, useState } from 'react';
import { type ChallengeDetail, type ChallengeRound, challengeLink } from '@/lib/challenges';
import { type MapBounds } from '@/data/cities';
import { formatDistance } from '@/lib/gameUtils';
import { cityHint, useCityTips } from '@/lib/cityHints';
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
import { appNumberLocale, formatNumber } from '@/lib/format';
import { PinIcon, StopwatchIcon, HomeIcon, ChevronIcon, ArrowRightIcon, LegendPin } from '@/components/ui/icons';

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
/** Las etiquetas del mapa del reto evitan la leyenda (tú · rival · correcta) de la esquina */
const CHALLENGE_LEGEND_AVOID = { corner: { w: 210, h: 112 } };

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
  const diffLabel = diffName(detail.difficulty, t);

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
  // Gana → salta · pierde → decidido (¡revancha!) · empate → sorprendido · esperando al rival → dormido
  const mascot = outcome === 'win' ? 'cheer' : outcome === 'lose' ? 'angry' : outcome === 'tie' ? 'surprised' : 'sleepy';
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());

  return (
    <Shell onBack={onBack} title={title} subtitle={subtitle}>
      {/* El Explorador con su insignia (✓ terminado · 🏆 ganador · 🗺️ derrota · ⚌ empate) */}
      <div className="relative flex justify-center -mt-1 mb-3 short:hidden" aria-hidden>
        <div className="relative">
          <Mascot state={mascot} className="w-28 sm:w-32" />
          {outcome === 'pending' && <span className="absolute -right-10 top-6 w-12 h-12 rounded-full bg-accent/90 text-accent-foreground flex items-center justify-center shadow-[0_0_18px_hsl(var(--accent)/0.7)]"><CheckIcon className="w-7 h-7" /></span>}
          {outcome === 'win' && <span className="absolute -right-10 top-2 text-5xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">🏆</span>}
          {outcome === 'lose' && <span className="absolute -right-9 bottom-1 text-4xl">🗺️</span>}
          {outcome === 'tie' && <span className="absolute -right-9 top-4 text-4xl">🤝</span>}
          <span className="absolute -left-6 top-6 text-primary text-lg">✦</span>
        </div>
      </div>

      {done && (
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 sm:gap-3 rounded-full border-2 border-accent/50 bg-card/70 px-3 sm:px-4 py-1.5 sm:py-2 text-xs min-[400px]:text-sm sm:text-base font-semibold whitespace-nowrap">
            <GlobeIcon className="w-6 h-6 text-accent" /> {modeLabel} · <span className="text-accent -ml-1">{diffLabel}</span>
            <span className="w-px h-6 bg-border" aria-hidden />
            <CheckCircleIcon className="w-6 h-6 text-accent" /> {t('chr_bothDone')}
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-start">
        {/* Puntajes */}
        {outcome === 'pending' ? (
          <Card>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm sm:text-base font-bold uppercase tracking-wide">{t('chr_yourScore')}</p>
              <span className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-foreground/20 bg-background/40 px-2.5 py-1.5 text-xs sm:text-sm font-semibold">
                <GlobeIcon className="w-5 h-5 text-accent" /> {modeLabel} · <span className="text-accent">{diffLabel}</span>
              </span>
            </div>
            <p className="font-extrabold text-primary text-[2.6rem] sm:text-5xl leading-tight whitespace-nowrap">{mine ? fmt(mine.score) : '—'} <span className="text-2xl sm:text-3xl text-foreground">{t('game_pointsWord')}</span></p>
            <div className="h-px bg-border my-3" />
            <div className="grid grid-cols-2 gap-2.5">
              <Tile icon={<PinIcon className="w-8 h-8 text-accent" />} label={t('final_cities')} value={`${mine?.rounds.length ?? 0} / ${detail.rounds_total}`} />
              <Tile icon={<RouteIcon className="w-8 h-8 text-accent" />} label={t('final_avgDist')} value={formatDistance(avgDistance(mine?.rounds ?? []))} />
            </div>
          </Card>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <PlayerCard name={myName} score={mine!.score} tag={outcome === 'win' ? 'winner' : outcome === 'tie' ? 'tie' : 'done'} mine showYou={!!displayName} t={t} />
              <PlayerCard name={rivalName} score={rival!.score} tag={outcome === 'lose' ? 'winner' : outcome === 'tie' ? 'tie' : 'done'} t={t} />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex-1 h-px bg-border" aria-hidden />
              <p className="text-base sm:text-lg font-bold whitespace-nowrap">
                {outcome === 'tie' ? <>{t('chr_sameScore')}</>
                  : outcome === 'win' ? <><b className="text-primary text-3xl font-extrabold">+{fmt(diff)}</b> {t('chr_pointsDiff')}</>
                  : <>{t('chr_pointsToWinLead')} <b className="text-primary text-3xl font-extrabold">{fmt(diff)}</b> {t('chr_pointsToWinTail')}</>}
              </p>
              <span className="flex-1 h-px bg-border" aria-hidden />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {outcome === 'pending' ? (
            <>
              <Card>
                <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl font-extrabold mb-3"><PeopleIcon className="w-7 h-7 text-accent" /> {t('chr_compareLead')} <span className="text-primary -ml-1">{t('chr_compareTail')}</span></h2>
                <div className="flex flex-col gap-2">
                  <Participant name={myName} youTag={displayName ? t('ch_you') : undefined} ok label={t('chr_completed')} me />
                  <Participant name={rivalName} ok={false} label={detail.rival ? t('chr_notFinished') : t('ch_statusToJoin')} />
                </div>
                <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-foreground/80"><InfoIcon className="w-5 h-5 text-accent" /> {t('chr_finalWhenBoth')}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <LinkIcon className="w-14 h-14 text-accent drop-shadow-[0_0_10px_hsl(var(--accent)/0.6)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-extrabold">{t('ch_codeLead')} <span className="text-primary">{t('ch_codeTail')}</span></p>
                    <div className="mt-2 flex items-stretch gap-2">
                      <span className="flex-1 min-w-0 rounded-2xl border-2 border-foreground/15 bg-background/60 py-2 text-center font-extrabold text-2xl tracking-[0.35em] pl-[0.35em] truncate">{detail.code}</span>
                      <button onClick={copy} className="rounded-2xl border-2 border-accent/70 px-3 font-bold text-sm hover:bg-accent/10 flex items-center gap-1.5">{copied ? '✓' : <CopyIcon className="w-5 h-5" />}<span>{copied ? t('ch_copied') : t('ch_copy')}</span></button>
                    </div>
                  </div>
                </div>
                <button onClick={share} className="mt-3 w-full rounded-2xl py-3 border-2 border-accent text-accent font-black hover:bg-accent/10 flex items-center justify-center gap-2.5"><ShareIcon className="w-6 h-6" /> {t('ch_share')}</button>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl font-extrabold mb-2"><BarsIcon className="w-7 h-7 text-accent" /> {t('chr_howItWent')}</h2>
                <table className="w-full text-sm sm:text-base border-separate border-spacing-0">
                  <thead><tr><th /><th className="text-primary font-bold pb-1">{t('ch_you')}</th><th className="text-accent font-bold pb-1 truncate max-w-[6rem]">{rivalName}</th></tr></thead>
                  <tbody>
                    <tr><td className="py-2 pl-1 border-t border-l border-foreground/15 rounded-tl-xl"><span className="flex items-center gap-2"><PinIcon className="w-6 h-6 text-accent" /> {t('final_cities')}</span></td><td className="text-center font-extrabold border-t border-l border-foreground/15">{mine!.rounds.length} / {detail.rounds_total}</td><td className="text-center font-extrabold border-t border-l border-r border-foreground/15 rounded-tr-xl">{rival!.rounds.length} / {detail.rounds_total}</td></tr>
                    <tr><td className="py-2 pl-1 border-t border-b border-l border-foreground/15 rounded-bl-xl"><span className="flex items-center gap-2"><RouteIcon className="w-6 h-6 text-accent" /> {t('final_avgDist')}</span></td><td className="text-center font-extrabold border-t border-b border-l border-foreground/15">{formatDistance(avgDistance(mine!.rounds))}</td><td className="text-center font-extrabold border border-foreground/15 rounded-br-xl">{formatDistance(avgDistance(rival!.rounds))}</td></tr>
                  </tbody>
                </table>
                <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-foreground/80"><InfoIcon className="w-5 h-5 text-accent" /> {t('chr_sameForBoth')}</p>
              </Card>
              {outcome === 'win' ? (
                <>
                  <button onClick={() => { playButtonTap(); setView('compare'); }} className="btn3d w-full rounded-2xl py-3.5 short:py-2.5 font-black text-base sm:text-xl text-primary-foreground flex items-center justify-center gap-2.5" style={{ background: 'var(--grad-cta)' }}>
                    <DocIcon className="w-7 h-7" /> {t('chr_compareByCity')}
                  </button>
                  <button onClick={() => { playButtonTap(); onCreateAnother(); }} className="w-full rounded-2xl py-3 border-2 border-accent text-accent font-black text-base sm:text-lg hover:bg-accent/10 flex items-center justify-center gap-2.5">
                    <PlusIcon className="w-6 h-6" /> {t('chr_createAnother')}
                  </button>
                </>
              ) : (
                /* Derrota y empate: Pedir revancha es la acción principal (consolidado §5) */
                <>
                  <button onClick={() => { playButtonTap(); onRematch(); }} className="btn3d w-full rounded-2xl py-3 short:py-2.5 px-4 text-primary-foreground flex items-center justify-center gap-3 leading-tight" style={{ background: 'var(--grad-cta)' }}>
                    <DocIcon className="w-8 h-8 shrink-0" />
                    <span className="flex flex-col items-center"><span className="font-black text-lg sm:text-xl">{t('chr_rematch')}</span><span className="text-xs sm:text-sm font-semibold opacity-80">{t('chr_rematchSub')}</span></span>
                  </button>
                  <button onClick={() => { playButtonTap(); setView('compare'); }} className="w-full rounded-2xl py-3 border-2 border-accent text-accent font-black text-base sm:text-lg hover:bg-accent/10 flex items-center justify-center gap-2.5">
                    <BarsIcon className="w-6 h-6" /> {t('chr_compareByCity')}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {outcome === 'pending' ? (
        <>
          <div className="mt-4 rounded-2xl border-2 border-accent/40 bg-card/60 p-3 sm:p-4 flex items-center gap-3 max-w-xl mx-auto">
            <InfoIcon className="w-8 h-8 text-accent" />
            <p className="text-sm sm:text-base"><b>{t('chr_canLeave')}</b><span className="block text-foreground/75 text-xs sm:text-sm">{t('chr_saved')}</span></p>
          </div>
          <div className="mt-4 flex flex-col items-center gap-2.5">
            <button onClick={() => { playButtonTap(); onBack(); }} className="btn3d w-full max-w-xl rounded-2xl py-4 short:py-2.5 font-black text-xl text-primary-foreground flex items-center justify-center gap-3" style={{ background: 'var(--grad-cta)' }}>
              <HomeIcon className="w-7 h-7" /> {t('ob_backHome').toUpperCase()}
            </button>
            <button onClick={() => { playButtonTap(); setView('answers'); }} className="w-full max-w-sm rounded-full py-2.5 border-2 border-accent/50 font-bold flex items-center justify-center gap-2 hover:bg-accent/10"><DocIcon className="w-5 h-5" /> {t('chr_myAnswers')}</button>
          </div>
        </>
      ) : (
        <div className="mt-5 pt-4 border-t border-border grid grid-cols-[1fr_auto_1fr] items-center">
          <button onClick={share} className="flex items-center justify-center gap-2 font-semibold text-sm sm:text-base hover:text-accent"><ShareIcon className="w-6 h-6" /> {t('chr_shareResult')}</button>
          <span className="w-px h-8 bg-border" aria-hidden />
          <button onClick={() => { playButtonTap(); onBack(); }} className="flex items-center justify-center gap-2 font-semibold text-sm sm:text-base hover:text-accent"><HomeIcon className="w-6 h-6" /> {t('ob_backHome')}</button>
        </div>
      )}
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
  const perPage = typeof window !== 'undefined' && window.innerHeight <= 500 && window.innerWidth < 1024 ? 2 : 3;
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
        <span className="inline-flex items-center gap-2.5 rounded-full border-2 border-accent/50 bg-card/70 px-4 py-1.5 text-sm font-semibold">
          <GlobeIcon className="w-5 h-5 text-accent" /> {t(`mode_${detail.mode}` as never)} · <span className="text-accent -ml-1">{diffName(detail.difficulty, t)}</span>
          <span className="w-px h-5 bg-border" aria-hidden />
          <PinIcon className="w-5 h-5 text-accent" /> {t('chc_nCities', { n: rows.length })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 max-w-xl mx-auto mb-4">
        <ScorePill name={t('ch_you')} score={mine.score} me winner={mine.score >= rival.score} />
        <ScorePill name={rivalName} score={rival.score} winner={rival.score >= mine.score} />
      </div>

      <div className={`grid gap-3 ${perPage === 2 ? 'grid-cols-2' : 'lg:grid-cols-3'}`}>
        {slice.map((row, i) => {
          const idx = page * perPage + i;
          const mp = row.me?.points ?? 0, rp = row.rv?.points ?? 0;
          const who = mp > rp ? 'me' : rp > mp ? 'rival' : 'tie';
          return (
            <section key={idx} className="rounded-3xl border-2 border-accent/40 bg-card/75 p-2.5 sm:p-3 flex gap-2.5 lg:flex-col">
              <CountryPhoto country={row.city.country} size="sm" className="w-24 sm:w-28 lg:w-auto lg:h-24 shrink-0 rounded-2xl" />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Flag country={row.city.country} className="w-8 shrink-0" />
                  <p className="min-w-0 truncate flex-1"><span className="font-extrabold text-base sm:text-lg">{row.city.name}</span><span className="text-foreground/75 text-sm"> · {row.city.country}</span></p>
                  <button onClick={() => { playButtonTap(); onOpenMap(idx); }} className="shrink-0 rounded-xl border-2 border-accent/70 px-2 py-1 text-xs font-bold hover:bg-accent/10 flex items-center gap-1"><MapIcon className="w-4 h-4 text-accent" />{t('chc_viewMap')}</button>
                </div>
                <table className="w-full text-xs sm:text-sm">
                  <thead><tr className="text-xs"><th className="text-left font-semibold"></th><th className="text-primary font-bold">{t('ch_you')}</th><th className="text-accent font-bold truncate">{rivalName}</th></tr></thead>
                  <tbody className="font-bold">
                    <CmpRow icon={<PinIcon className="w-4 h-4" />} label={t('game_distance')} a={row.me?.distance_km != null ? formatDistance(row.me.distance_km) : '—'} b={row.rv?.distance_km != null ? formatDistance(row.rv.distance_km) : '—'} hiA={(row.me?.distance_km ?? 1e9) < (row.rv?.distance_km ?? 1e9)} hiB={(row.rv?.distance_km ?? 1e9) < (row.me?.distance_km ?? 1e9)} />
                    <CmpRow icon={<StopwatchIcon className="w-4 h-4" />} label={t('game_time')} a={row.me?.time_s != null ? `${formatNumber(row.me.time_s, 1)} s` : '—'} b={row.rv?.time_s != null ? `${formatNumber(row.rv.time_s, 1)} s` : '—'} hiA={(row.me?.time_s ?? 1e9) < (row.rv?.time_s ?? 1e9)} hiB={(row.rv?.time_s ?? 1e9) < (row.me?.time_s ?? 1e9)} />
                    <CmpRow icon={<span aria-hidden>🏆</span>} label={t('game_points')} a={mp.toLocaleString(appNumberLocale())} b={rp.toLocaleString(appNumberLocale())} hiA={who === 'me'} hiB={who === 'rival'} />
                  </tbody>
                </table>
                <span className={`self-start rounded-full px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 ${who === 'me' ? 'bg-primary text-primary-foreground' : who === 'rival' ? 'bg-accent text-accent-foreground' : 'border border-border text-muted-foreground'}`}>
                  🏆 {who === 'me' ? t('chc_morePointsYou') : who === 'rival' ? t('chc_morePointsRival') : t('chc_evenPoints')}
                </span>
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-11 h-11 rounded-full border-2 border-accent/60 flex items-center justify-center disabled:opacity-35" aria-label={t('review_prev')}><ChevronIcon dir="left" className="w-5 h-5" /></button>
        <span className="text-sm sm:text-base font-bold whitespace-nowrap">{t('chc_range', { from: page * perPage + 1, to: page * perPage + slice.length, total: rows.length })}</span>
        <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="w-11 h-11 rounded-full border-2 border-accent/60 flex items-center justify-center disabled:opacity-35" aria-label={t('review_next')}><ChevronIcon className="w-5 h-5" /></button>
      </div>
      <p className="mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-foreground/80"><InfoIcon className="w-5 h-5 text-accent" /> {t('chc_mapHint')}</p>
      <button onClick={() => { playButtonTap(); onBack(); }} className="mt-4 w-full max-w-xl mx-auto flex items-center justify-center gap-2.5 rounded-2xl py-3 border-2 border-accent/60 font-bold text-base sm:text-lg hover:bg-accent/10">
        <ArrowRightIcon className="w-5 h-5 rotate-180" /> {t('chc_backToResult')}
      </button>
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
  useCityTips();
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
          <WorldMapCanvas onMapClick={noop} clickDisabled userClick={me} correctLocation={correct} distanceKm={row.me?.distance_km ?? null} gameMode="world" viewBounds={bounds} pinLabels={pinLabels} rivalClick={rv} labelAvoid={CHALLENGE_LEGEND_AVOID} />
          <div className="absolute left-2 bottom-2 rounded-xl border border-accent/40 px-3 py-2 text-xs sm:text-sm font-semibold flex flex-col gap-1 short:hidden" style={{ background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>
            <span className="flex items-center gap-2"><LegendPin color="hsl(var(--primary))" className="w-5 h-5" /> {t('ch_you')}</span>
            <span className="flex items-center gap-2"><LegendPin color="hsl(var(--accent))" className="w-5 h-5" /> {rivalName}</span>
            <span className="flex items-center gap-2"><LegendPin color="white" className="w-5 h-5" /> {t('chm_correct')}</span>
          </div>
        </div>
        <aside className="shrink-0 landscape:w-[min(38%,22rem)] max-h-[45%] landscape:max-h-none rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-3 short:p-2 overflow-y-auto flex flex-col gap-2 short:gap-1.5">
          <h3 className="font-black text-base sm:text-lg short:text-sm">{t('chm_compareLead')} <span className="text-primary">{t('chm_compareTail')}</span></h3>
          <table className="w-full text-xs sm:text-sm">
            <thead><tr className="text-[11px] text-muted-foreground"><th></th><th className="text-primary font-black">{t('ch_you')}</th><th className="text-accent font-black">{rivalName}</th></tr></thead>
            <tbody className="font-bold">
              <CmpRow icon={<PinIcon className="w-4 h-4" />} label={t('game_distance')} a={row.me?.distance_km != null ? formatDistance(row.me.distance_km) : '—'} b={row.rv?.distance_km != null ? formatDistance(row.rv.distance_km) : '—'} />
              <CmpRow icon={<StopwatchIcon className="w-4 h-4" />} label={t('game_time')} a={row.me?.time_s != null ? `${formatNumber(row.me.time_s, 1)} s` : '—'} b={row.rv?.time_s != null ? `${formatNumber(row.rv.time_s, 1)} s` : '—'} />
              <CmpRow icon={<span aria-hidden>🏆</span>} label={t('game_points')} a={`+${mp.toLocaleString(appNumberLocale())}`} b={`+${rp.toLocaleString(appNumberLocale())}`} hiA={who === 'me'} hiB={who === 'rival'} />
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

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border-2 border-accent/45 bg-card/75 p-4 sm:p-5 shadow-[0_0_20px_hsl(var(--accent)/0.10)] ${className}`}>{children}</section>;
}

function diffName(d: string, t: (k: never) => string): string {
  return t(`home_diff${d.charAt(0).toUpperCase()}${d.slice(1)}` as never);
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-foreground/15 bg-background/40 px-3 py-2.5 flex items-center gap-3 text-left">
      {icon}
      <span className="min-w-0"><span className="block text-xs sm:text-sm text-foreground/75">{label}</span><span className="block font-extrabold text-lg sm:text-xl truncate">{value}</span></span>
    </div>
  );
}

function PlayerCard({ name, score, tag, mine, showYou, t }: { name: string; score: number; tag: 'winner' | 'done' | 'tie'; mine?: boolean; showYou?: boolean; t: (k: never) => string }) {
  return (
    <div className={`rounded-3xl border-2 p-3 sm:p-4 text-center flex flex-col items-center ${mine ? 'border-primary bg-primary/5 shadow-[0_0_18px_hsl(var(--primary)/0.25)]' : 'border-accent/60 bg-accent/5 shadow-[0_0_18px_hsl(var(--accent)/0.2)]'}`}>
      <div className="relative">
        {tag === 'winner' && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl z-10" aria-hidden>👑</span>}
        <span className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] flex items-center justify-center overflow-hidden ${mine ? 'border-primary' : 'border-accent'} bg-background/60`}>
          <Mascot state={tag === 'winner' ? 'celebrate' : 'wink'} className={`w-[78%] ${mine ? '' : 'grayscale brightness-110'}`} />
        </span>
      </div>
      <p className="mt-1.5 font-bold text-sm sm:text-base truncate max-w-full">{name}{showYou && <span className="text-primary"> · {t('ch_you' as never)}</span>}</p>
      <p className={`font-extrabold text-[2.1rem] sm:text-5xl leading-none mt-0.5 ${mine ? 'text-primary' : ''}`}>{score.toLocaleString(appNumberLocale())}</p>
      <p className="text-sm sm:text-base font-bold">{t('game_pointsWord' as never)}</p>
      <span className={`mt-2 w-full rounded-full px-2 py-1.5 text-xs sm:text-base font-extrabold flex items-center justify-center gap-1.5 ${tag === 'winner' ? 'bg-primary text-primary-foreground' : tag === 'tie' ? 'border-2 border-primary text-primary' : 'border-2 border-accent text-accent'}`}>
        {tag === 'winner' ? <><span aria-hidden>🏆</span> {t('chr_winner' as never)}</> : tag === 'tie' ? <>⚌ {t('chr_tie' as never)}</> : <><CheckCircleIcon className="w-5 h-5" /> {t('chr_completed' as never)}</>}
      </span>
    </div>
  );
}

function Participant({ name, youTag, ok, label, me }: { name: string; youTag?: string; ok: boolean; label: string; me?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-foreground/15 bg-background/40 px-3 py-2">
      <Mascot state={me ? 'idle' : 'wink'} className={`w-9 shrink-0 ${me ? '' : 'grayscale brightness-75'}`} />
      <span className="flex-1 font-bold truncate">{name}{youTag && <span className="text-primary"> · {youTag}</span>}</span>
      <span className={`rounded-full border-2 px-2.5 py-1 text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-1.5 ${ok ? 'border-accent text-accent' : 'border-foreground/30 text-foreground/85'}`}>
        {ok ? <CheckCircleIcon className="w-4 h-4" /> : <ClockIcon className="w-4 h-4" />} {label}
      </span>
    </div>
  );
}

function ScorePill({ name, score, me, winner }: { name: string; score: number; me?: boolean; winner: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-3xl border-2 px-3 py-2 ${me ? 'border-primary bg-primary/5' : 'border-accent/60 bg-accent/5'}`}>
      <div className="relative shrink-0">
        {winner && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base z-10" aria-hidden>👑</span>}
        <span className={`w-12 h-12 rounded-full border-2 ${me ? 'border-primary' : 'border-accent'} flex items-center justify-center overflow-hidden bg-background/60`}>
          <Mascot state={winner ? 'celebrate' : 'wink'} className={`w-[78%] ${me ? '' : 'grayscale brightness-110'}`} />
        </span>
      </div>
      <span className="min-w-0 text-center flex-1">
        <span className={`block text-xs sm:text-sm font-bold truncate ${me ? 'text-primary' : 'text-accent'}`}>{name}</span>
        <span className={`block font-extrabold text-2xl sm:text-3xl leading-none ${me ? 'text-primary' : ''}`}>{score.toLocaleString(appNumberLocale())}</span>
      </span>
    </div>
  );
}

function CmpRow({ icon, label, a, b, hiA, hiB }: { icon: React.ReactNode; label: string; a: string; b: string; hiA?: boolean; hiB?: boolean }) {
  return (
    <tr className="border-t border-border/60">
      <td className="py-1 font-semibold text-foreground/80 whitespace-nowrap"><span className="flex items-center gap-1.5">{icon} {label}</span></td>
      <td className={`py-1 text-center ${hiA ? 'text-primary' : ''}`}>{a}</td>
      <td className={`py-1 text-center ${hiB ? 'text-accent' : ''}`}>{b}</td>
    </tr>
  );
}

type I = { className?: string };
const svgI = (className: string, children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
);
const CheckIcon = ({ className = '' }: I) => svgI(className, <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth="3.2" />);
const CheckCircleIcon = ({ className = '' }: I) => svgI(className, <><circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" /><path d="m7.5 12.5 3 3 6-6.5" stroke="hsl(var(--background))" strokeWidth="2.8" /></>);
const ClockIcon = ({ className = '' }: I) => svgI(className, <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
const GlobeIcon = ({ className = '' }: I) => svgI(className, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>);
const RouteIcon = ({ className = '' }: I) => svgI(className, <><path d="M6 20s3.5-3.5 3.5-6.2A3.5 3.5 0 0 0 2.5 13.8C2.5 16.5 6 20 6 20Z" fill="currentColor" stroke="none" /><path d="M18 11s3.5-3.5 3.5-6.2a3.5 3.5 0 0 0-7 0C14.5 7.5 18 11 18 11Z" fill="currentColor" stroke="none" /><path d="M8 19c3 0 3-4 6-4s3-2 4-3" strokeDasharray="2 2.5" /></>);
const PeopleIcon = ({ className = '' }: I) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="currentColor" aria-hidden><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="2.8" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0Z" /><path d="M15 20a5 5 0 0 1 7-4.6V20Z" /></svg>
);
const BarsIcon = ({ className = '' }: I) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="currentColor" aria-hidden><rect x="3" y="13" width="4" height="8" rx="1" /><rect x="10" y="8" width="4" height="13" rx="1" /><rect x="17" y="4" width="4" height="17" rx="1" /></svg>
);
const DocIcon = ({ className = '' }: I) => svgI(className, <><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h6" /></>);
const PlusIcon = ({ className = '' }: I) => svgI(className, <path d="M12 5v14M5 12h14" strokeWidth="3.2" />);
const MapIcon = ({ className = '' }: I) => svgI(className, <><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2Z" /><path d="M9 4v14M15 6v14" /></>);
const LinkIcon = ({ className = '' }: I) => svgI(className, <><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" /></>);
const CopyIcon = ({ className = '' }: I) => svgI(className, <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2" /></>);
const ShareIcon = ({ className = '' }: I) => svgI(className, <><circle cx="18" cy="5.5" r="2.5" fill="currentColor" /><circle cx="6" cy="12" r="2.5" fill="currentColor" /><circle cx="18" cy="18.5" r="2.5" fill="currentColor" /><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" /></>);
const InfoIcon = ({ className = '' }: I) => svgI(className, <><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r="0.6" fill="currentColor" /></>);
