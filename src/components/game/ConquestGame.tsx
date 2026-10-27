import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { itemTitle } from '@/lib/catalog';
import { cityById } from '@/lib/itemMemory';
import {
  ConqError, abandonAttempt, answerRound, answeredRounds, conqPoints, conqServerNow, currentRound, fetchAttempt, fetchMap,
  fetchPracticeSet, forgetActiveMission, openRound, rememberActiveMission, startAttempt,
  type ConqAttempt, type ConqErrorCode, type ConqMap, type ConqPracticeCity, type ConqRound,
} from '@/lib/conquest';
import { conquestBetaOn } from '@/lib/conquestBeta';
import { netAverage, reportMissionNet, type NetSample, type NetSummary } from '@/lib/conquestNet';
import { badgePoint, conqCountryName, countryBounds, missionLayer, myStanding, playerStyles, sheetLayer } from '@/lib/conquestMap';
import { haversineKm } from '@/lib/flagScoring';
import { formatDistance } from '@/lib/gameUtils';
import { appNumberLocale } from '@/lib/format';
import { trackEvent } from '@/lib/analytics';
import { fireCelebration } from '@/lib/confetti';
import { playBad, playButtonTap, playClick, playCountdown, playGo, playGood, playMedium, playPerfect, playShareSuccess, playTick, playTimeExpired, playVictory } from '@/lib/sounds';
import WorldMapCanvas from './WorldMapCanvas';
import { HudIconButton } from './GameHud';
import Mascot from './Mascot';
import { ConqFace, errCode, useErrText } from './ConquestParts';
import type { PracticeTarget } from './ConquestBoard';

/**
 * Conquista el mapa — P3 partida y P4 resultado (docs/GeoSpeed_Conquista_Plan.md).
 * · Práctica (C4, export por defecto): cinco ciudades del país fuera del paquete oficial (conq_practice_set), puntaje
 *   con la fórmula de Conquista calculado aquí, sin guardar nada ni gastar misiones.
 * · Misión oficial (C5, `ConquestMission`): el servidor reserva el país, abre cada ronda y mide el tiempo; aquí solo se
 *   muestra su reloj (estimado con `conqServerNow`) y se manda el toque. Recargar, abrir otra pestaña o volver a la app
 *   retoma el mismo intento con el mismo reloj; la × abandona (cuenta como usada y no conquista).
 * Las dos comparten el marco: país y "Ciudad n de 5", pregunta con anillo de tiempo, el mapa encuadrado en el país (los
 * demás apagados, sin nombres de ciudades), mis puntos frente a lo que hay que superar y, tras cada respuesta, el lugar
 * correcto con distancia, tiempo y puntos, SIGUIENTE y avance solo a los 3 s.
 */

const SECONDS = 15;
const AUTO_NEXT_MS = 3000;
const fmtN = (n: number) => n.toLocaleString(appNumberLocale());
const fmtS = (s: number) => s.toLocaleString(appNumberLocale(), { maximumFractionDigits: 1 });
const cityLabel = (placeId: string | null | undefined, fallback: string | null | undefined, locale: string) => {
  const c = placeId ? cityById(placeId) : undefined;
  return c ? itemTitle(c, locale) : fallback ?? '';
};
function resultSound(points: number, answered: boolean) {
  if (!answered) playTimeExpired();
  else if (points >= 900) playPerfect();
  else if (points >= 600) playGood();
  else if (points >= 250) playMedium();
  else playBad();
}

// ═══════════════════════════════════════ Marco común ═══════════════════════════════════════
interface PlayFrameProps {
  iso: string;
  country: string;
  practice: boolean;
  cityN: number;
  cityTotal: number;
  /** Reserva que queda (misión oficial) */
  clock?: string | null;
  musicMuted: boolean;
  onToggleMusic: () => void;
  exitLabel: string;
  onExit: () => void;
  prompt: string;
  secsLeft: number | null;
  frac: number;
  map: ReactNode;
  strip: ReactNode;
  you: number;
  targetLabel: string;
  targetValue: string;
  hint: string | null;
}

function PlayFrame(p: PlayFrameProps) {
  const { t } = useI18n();
  const ring = 2 * Math.PI * 20;
  const urgent = p.secsLeft != null && p.secsLeft <= 3;
  return (
    <div className="fixed inset-0 z-40 h-[100dvh] min-h-0 overflow-hidden game-bg flex flex-col" role="main" aria-label={p.practice ? t('cq_practiceTag') : t('cq_missionTag')} data-game-container>
      <header className="shrink-0 bg-brand-navy-deep border-b-2 border-accent/50 px-2 sm:px-4 py-1.5 flex items-center gap-2" style={{ paddingTop: 'max(0.375rem, var(--sat))', paddingLeft: 'max(0.5rem, var(--sal))', paddingRight: 'max(0.5rem, var(--sar))' }}>
        <img src={`/flags/${p.iso}.svg`} alt="" aria-hidden className="w-9 aspect-[3/2] object-cover rounded-[3px] ring-1 ring-black/20 shrink-0" />
        <p className="min-w-0 flex-1 leading-tight truncate"><span className="font-black">{p.country}</span> <span className="text-muted-foreground">· {t('cq_cityN', { n: Math.min(p.cityN, p.cityTotal), total: p.cityTotal })}</span></p>
        {p.practice
          ? <span className="shrink-0 rounded-full border border-accent/60 px-2.5 py-0.5 text-[11px] sm:text-xs font-black text-accent">🎯 {t('cq_practiceTag')}</span>
          : p.clock && <span className="shrink-0 rounded-full border border-primary/60 px-2.5 py-0.5 text-[11px] sm:text-xs font-black text-primary tabular-nums" title={t('cq_reservation')}>⚔️ {p.clock}</span>}
        <HudIconButton icon={p.musicMuted ? 'mute' : 'sound'} label={p.musicMuted ? t('music_on') : t('music_off')} onClick={p.onToggleMusic} size="sm" />
        <HudIconButton icon="close" label={p.exitLabel} onClick={p.onExit} size="sm" />
      </header>

      <div className="flex-1 min-h-0 grid grid-rows-[auto_minmax(0,1fr)_auto] short:grid-rows-[auto_minmax(0,1fr)] short:grid-cols-[minmax(0,1fr)_15rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Pregunta y anillo de tiempo */}
        <section className="short:col-start-2 short:row-start-1 lg:col-start-2 lg:row-start-1 m-2 mb-0 rounded-2xl border-2 border-accent/40 bg-card/85 px-3 py-2 flex items-center gap-3" aria-live="polite">
          <p className="min-w-0 flex-1 leading-tight">
            <span className="block text-sm sm:text-base font-bold">{t('game_whereIsLead')}</span>
            <span className="block font-black text-2xl sm:text-3xl short:text-xl text-primary truncate">{p.prompt}</span>
          </p>
          <svg viewBox="0 0 48 48" className="w-14 h-14 short:w-11 short:h-11 shrink-0 -rotate-90" aria-label={p.secsLeft != null ? t('cq_secondsLeft', { s: p.secsLeft }) : undefined} role="img">
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="5" className="stroke-muted/40" />
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="5" strokeLinecap="round" className={urgent ? 'stroke-destructive' : 'stroke-accent'}
              strokeDasharray={ring} strokeDashoffset={ring * (1 - p.frac)} style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
            <text x="24" y="24" textAnchor="middle" dominantBaseline="central" className="fill-foreground font-black" fontSize="15" transform="rotate(90 24 24)">{p.secsLeft != null ? `${p.secsLeft}s` : '–'}</text>
          </svg>
        </section>

        {/* Mapa del país (los demás apagados) */}
        <div className="relative min-h-0 m-2 short:mr-0 lg:mr-0 short:col-start-1 short:row-start-1 short:row-span-2 lg:col-start-1 lg:row-start-1 lg:row-span-2 rounded-2xl overflow-hidden border-2 border-accent/30">
          {p.map}
        </div>

        {/* Mis puntos, lo que hay que superar y la respuesta */}
        <section className="short:col-start-2 short:row-start-2 lg:col-start-2 lg:row-start-2 m-2 mt-0 short:mt-2 lg:mt-2 flex flex-col gap-2 min-h-0" style={{ paddingBottom: 'var(--sab)' }}>
          {p.strip}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border-2 border-primary/50 bg-card/85 px-3 py-1.5 text-center">
              <p className="text-xs text-muted-foreground font-bold">📍 {t('cq_you')}</p>
              <p className="font-black text-2xl short:text-xl text-primary tabular-nums leading-tight">{fmtN(p.you)}</p>
            </div>
            <div className="rounded-2xl border-2 border-accent/40 bg-card/85 px-3 py-1.5 text-center">
              <p className="text-xs text-muted-foreground font-bold truncate">{p.targetLabel}</p>
              <p className="font-black text-2xl short:text-xl tabular-nums leading-tight">{p.targetValue}</p>
            </div>
          </div>
          {p.hint && <p className="rounded-full border border-accent/40 bg-card/70 px-3 py-1.5 text-center text-sm font-bold">{p.hint}</p>}
        </section>
      </div>
    </div>
  );
}

/** Resultado de una ronda: lugar, distancia · tiempo, +puntos y SIGUIENTE con la cuenta */
function AnswerStrip({ title, sub, points, nextIn, onNext }: { title: string; sub: string; points: number; nextIn: number; onNext: () => void }) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border-2 border-primary/60 bg-card/95 px-3 py-2 flex items-center gap-3 animate-fade-in-up" role="status">
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block font-black truncate">{title}</span>
        <span className="block text-xs sm:text-sm text-muted-foreground">{sub}</span>
      </span>
      <span className="font-black text-2xl text-primary tabular-nums">+{fmtN(points)}</span>
      <button onClick={() => { playButtonTap(); onNext(); }} className="shrink-0 rounded-xl px-3 py-2 font-black text-sm text-primary-foreground btn3d" style={{ background: 'var(--grad-cta)' }}>
        {t('game_next')} <span className="opacity-75">{nextIn}</span>
      </button>
    </div>
  );
}

/** Pantalla completa sencilla (cargando, error, avisos) */
function Centered({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 z-40 game-bg flex flex-col items-center justify-center gap-4 text-center px-6">{children}</div>;
}

// ═══════════════════════════════════════ Práctica (C4) ═══════════════════════════════════════
interface ConquestPracticeProps {
  seasonId: string;
  iso: string;
  target: PracticeTarget | null;
  musicMuted: boolean;
  onToggleMusic: () => void;
  onExit: () => void;
}

type Stage = 'loading' | 'ready' | 'question' | 'answer' | 'done' | 'error';
interface Answer { lat: number | null; lon: number | null; km: number | null; t: number; points: number }

export default function ConquestPractice({ seasonId, iso, target, musicMuted, onToggleMusic, onExit }: ConquestPracticeProps) {
  const { t, locale } = useI18n();
  const errText = useErrText();
  const [stage, setStage] = useState<Stage>('loading');
  const [cities, setCities] = useState<ConqPracticeCity[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState<ConqErrorCode | null>(null);
  const [now, setNow] = useState(() => performance.now());
  const openedAt = useRef(0);
  const answeredAt = useRef(0);

  const load = useCallback(async () => {
    setStage('loading');
    setError(null);
    try {
      const set = await fetchPracticeSet(seasonId, iso);
      if (!set.length) { setStage('error'); return; }
      setCities(set);
      setIdx(0);
      setAnswers([]);
      setStage('ready');
    } catch (e) {
      setError(errCode(e));
      setStage('error');
    }
  }, [seasonId, iso]);
  useEffect(() => { void load(); }, [load]);

  // Reloj de la ronda (y de la cuenta para seguir)
  useEffect(() => {
    if (stage !== 'question' && stage !== 'answer') return;
    const id = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(id);
  }, [stage]);

  const city = cities[idx] ?? null;
  const cityName = useMemo(() => (city ? cityLabel(city.id, city.name, locale) : ''), [city, locale]);

  const open = useCallback(() => {
    openedAt.current = performance.now();
    setNow(openedAt.current);
    setStage('question');
  }, []);
  const start = () => { playButtonTap(); playGo(); trackEvent('conq_practice_start', { iso }); open(); };

  const finishRound = useCallback((a: Answer) => {
    answeredAt.current = performance.now();
    setAnswers((list) => [...list, a]);
    setStage('answer');
    resultSound(a.points, a.lat != null);
  }, []);

  const elapsed = stage === 'question' ? (now - openedAt.current) / 1000 : 0;
  const secsLeft = Math.max(0, Math.ceil(SECONDS - elapsed));

  // Tiempo agotado: 0 puntos y se sigue con la próxima (regla de Conquista; no termina la misión)
  useEffect(() => {
    if (stage === 'question' && elapsed >= SECONDS) finishRound({ lat: null, lon: null, km: null, t: SECONDS, points: 0 });
  }, [stage, elapsed, finishRound]);
  // Tictac en los últimos 3 segundos
  const lastTick = useRef(0);
  useEffect(() => {
    if (stage !== 'question' || secsLeft > 3 || secsLeft < 1 || lastTick.current === secsLeft) return;
    lastTick.current = secsLeft;
    playTick(secsLeft);
  }, [stage, secsLeft]);

  const onMapClick = useCallback((lat: number, lon: number) => {
    if (stage !== 'question' || !city) return;
    const time = Math.min(SECONDS, (performance.now() - openedAt.current) / 1000);
    const km = haversineKm(lat, lon, city.lat, city.lon);
    playClick();
    finishRound({ lat, lon, km, t: time, points: conqPoints(km, time, SECONDS) });
  }, [stage, city, finishRound]);

  const next = useCallback(() => {
    if (stage !== 'answer') return;
    lastTick.current = 0;
    if (idx + 1 >= cities.length) { setStage('done'); trackEvent('conq_practice_done', { iso }); return; }
    setIdx((i) => i + 1);
    open();
  }, [stage, idx, cities.length, open, iso]);
  // Avance automático a los 3 s (como la misión oficial)
  const nextIn = stage === 'answer' ? Math.max(0, Math.ceil((AUTO_NEXT_MS - (now - answeredAt.current)) / 1000)) : 0;
  useEffect(() => { if (stage === 'answer' && now - answeredAt.current >= AUTO_NEXT_MS) next(); }, [stage, now, next]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && stage === 'answer') { e.preventDefault(); next(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, next]);

  const last = stage === 'answer' ? answers[answers.length - 1] ?? null : null;
  const total = answers.reduce((a, x) => a + x.points, 0);
  const country = conqCountryName(iso, locale);

  // Props del mapa memoizados: el lienzo reinicia su animación si cambian de identidad
  const bounds = useMemo(() => countryBounds(iso, 0.06), [iso]);
  const layer = useMemo(() => missionLayer(iso), [iso]);
  const userClick = useMemo(() => (last && last.lat != null && last.lon != null ? { lat: last.lat, lon: last.lon } : null), [last]);
  const correct = useMemo(() => (stage === 'answer' && city ? { lat: city.lat, lon: city.lon } : null), [stage, city]);
  const pinLabels = useMemo(() => (stage === 'answer' ? { you: t('game_yourAnswer'), correct: cityName } : null), [stage, t, cityName]);

  const exit = () => {
    playButtonTap();
    if (stage === 'question' || stage === 'answer') { if (!window.confirm(t('cq_exitPracticeConfirm'))) return; }
    onExit();
  };
  const targetLabel = target?.kind === 'capture' ? t('cq_toCaptureShort') : target?.kind === 'own' ? t('cq_yourMark') : t('cq_rivalMark');

  // ── Cargando / sin ciudades / error ──
  if (stage === 'loading' || stage === 'error') {
    return (
      <Centered>
        {stage === 'loading' ? <p className="text-muted-foreground">{t('loading')}</p> : (
          <>
            <Mascot state="sad" className="w-20" />
            <p className="font-extrabold text-lg max-w-sm">{error ? errText(error) : t('cq_practiceEmpty')}</p>
            <div className="flex gap-2">
              {error && <button onClick={() => { playButtonTap(); void load(); }} className="rounded-2xl border-2 border-accent px-5 py-2.5 font-bold text-accent">{t('retry')}</button>}
              <button onClick={() => { playButtonTap(); onExit(); }} className="rounded-2xl border-2 border-foreground/30 px-5 py-2.5 font-bold">{t('cq_backToTerritory')}</button>
            </div>
          </>
        )}
      </Centered>
    );
  }

  // ── Resumen de la práctica ──
  if (stage === 'done') {
    const verdict = !target ? '' : target.kind === 'own' ? t('cq_practiceOwn', { mark: fmtN(target.mark) })
      : target.kind === 'capture' ? (total >= target.mark ? t('cq_practiceWouldCapture', { country }) : t('cq_practiceShortCapture', { n: fmtN(target.mark - total), country }))
      : total > target.mark ? t('cq_practiceWouldConquer', { name: target.ownerName ?? t('cq_retired'), mark: fmtN(target.mark) })
      : total === target.mark ? t('cq_practiceTie', { name: target.ownerName ?? t('cq_retired') })
      : t('cq_practiceShortConquer', { n: fmtN(target.mark - total + 1), name: target.ownerName ?? t('cq_retired') });
    const good = !!target && (target.kind === 'own' || (target.kind === 'capture' ? total >= target.mark : total > target.mark));
    return (
      <div className="fixed inset-0 z-40 game-bg overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center gap-3 px-4 py-6 max-w-lg mx-auto text-center" style={{ paddingTop: 'max(1.5rem, var(--sat))' }}>
          <Mascot state={good ? 'celebrate' : 'wink'} className="w-20 short:w-14" />
          <p className="text-sm font-bold text-accent uppercase tracking-widest">🎯 {t('cq_practiceTag')} · {country}</p>
          <h1 className="font-black text-3xl short:text-2xl">{t('cq_practiceDone')}</h1>
          <p className="font-black text-4xl text-primary tabular-nums">{t('cq_practiceTotal', { n: fmtN(total), max: fmtN(cities.length * 1000) })}</p>
          {verdict && <p className="text-base font-semibold">{verdict}</p>}
          <ol className="w-full flex flex-col gap-1.5 text-left">
            {answers.map((a, i) => (
              <li key={i} className="flex items-center gap-2 rounded-xl border border-accent/25 bg-card/70 px-3 py-1.5 text-sm">
                <span className="w-5 text-center font-black text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{cityLabel(cities[i]?.id, cities[i]?.name, locale)}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{a.km == null ? t('cq_noAnswer') : `${formatDistance(a.km)} · ${fmtS(a.t)} s`}</span>
                <span className="w-12 text-right font-black tabular-nums">{fmtN(a.points)}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">{t('cq_practiceNote')}</p>
          <div className="w-full flex flex-col gap-2">
            <button onClick={() => { playButtonTap(); void load(); }} className="btn3d w-full rounded-2xl py-3.5 short:py-2.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>🎯 {t('cq_practiceAgain')}</button>
            <button onClick={() => { playButtonTap(); onExit(); }} className="w-full rounded-2xl py-3 short:py-2 border-2 border-accent text-accent font-black hover:bg-accent/10">{t('cq_backToTerritory')}</button>
          </div>
        </div>
      </div>
    );
  }

  const map = (
    <>
      <WorldMapCanvas onMapClick={onMapClick} clickDisabled={stage !== 'question'} userClick={userClick} correctLocation={correct} distanceKm={last?.km ?? null}
        gameMode="world" viewBounds={bounds} territories={layer} pinLabels={pinLabels} showZoomControls={stage === 'question'} />
      {stage === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center p-4" style={{ background: 'hsl(var(--brand-navy-deep) / 0.55)' }}>
          <div className="max-w-sm w-full rounded-3xl border-2 border-accent/50 bg-card/95 p-4 short:p-3 text-center flex flex-col items-center gap-2">
            <p className="font-black text-xl short:text-lg">🎯 {t('cq_readyTitle', { country })}</p>
            <p className="text-sm text-foreground/85">{t('cq_readyDesc', { n: cities.length, s: SECONDS })}</p>
            <button onClick={start} autoFocus className="btn3d w-full rounded-2xl py-3 short:py-2 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('cq_go')}</button>
          </div>
        </div>
      )}
    </>
  );
  return (
    <PlayFrame iso={iso} country={country} practice cityN={idx + 1} cityTotal={cities.length} musicMuted={musicMuted} onToggleMusic={onToggleMusic}
      exitLabel={t('cq_exitPractice')} onExit={exit} prompt={stage === 'ready' ? '…' : `${cityName}?`}
      secsLeft={stage === 'question' ? secsLeft : null} frac={stage === 'question' ? Math.max(0, Math.min(1, 1 - elapsed / SECONDS)) : 0}
      map={map}
      strip={last ? <AnswerStrip title={last.lat == null ? `⏰ ${t('cq_timeout')}` : `✓ ${cityName}`} sub={last.km == null ? t('cq_noAnswer') : `${formatDistance(last.km)} · ${fmtS(last.t)} s`} points={last.points} nextIn={nextIn} onNext={next} /> : null}
      you={total} targetLabel={targetLabel} targetValue={target ? fmtN(target.mark) : '–'} hint={stage === 'question' ? t('game_tapToAnswer') : null} />
  );
}

// ═══════════════════════════════════════ Misión oficial (C5) ═══════════════════════════════════════
interface ConquestMissionProps {
  seasonId: string;
  /** País al iniciar (con `attemptId` se toma del intento) */
  iso: string | null;
  /** Retomar un intento en curso (recarga, otra pestaña, "Continuar misión") */
  attemptId: string | null;
  /** Clave de idempotencia del inicio: reintentar no gasta otra misión */
  requestId: string;
  musicMuted: boolean;
  onToggleMusic: () => void;
  onExit: () => void;
}

type MissionView = 'starting' | 'countdown' | 'question' | 'reveal' | 'result' | 'error';
const COUNTDOWN_MS = 3000;

/** Reintenta solo los fallos de red (el servidor es idempotente: repetir no duplica nada) */
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      if (!(e instanceof ConqError) || e.code !== 'network') throw e;
      await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw last;
}

export function ConquestMission({ seasonId, iso: isoProp, attemptId, requestId, musicMuted, onToggleMusic, onExit }: ConquestMissionProps) {
  const { t, locale } = useI18n();
  const errText = useErrText();
  const [attempt, setAttempt] = useState<ConqAttempt | null>(null);
  const [view, setView] = useState<MissionView>('starting');
  const [idx, setIdx] = useState(1);
  const [pending, setPending] = useState<{ lat: number; lon: number } | null>(null);
  const [err, setErr] = useState<ConqErrorCode | null>(null);
  const [now, setNow] = useState(conqServerNow);
  const attemptRef = useRef<ConqAttempt | null>(null);
  attemptRef.current = attempt;
  const idxRef = useRef(1);
  idxRef.current = idx;
  const viewRef = useRef<MissionView>('starting');
  viewRef.current = view;
  const busy = useRef(false);
  const retryRef = useRef<(() => void) | null>(null);
  const countdownAt = useRef(0);
  const revealAt = useRef(0);
  const lastSync = useRef(0);
  // Medición de la red (C7): cuándo apareció la pregunta en este teléfono, cuánto tardó en llegar y cuándo toqué
  const shownAt = useRef<number | null>(null);
  const openRtt = useRef(0);
  const tapAt = useRef(0);
  const samples = useRef<NetSample[]>([]);
  const [net, setNet] = useState<NetSummary | null>(null);

  useEffect(() => { const id = setInterval(() => setNow(conqServerNow()), 100); return () => clearInterval(id); }, []);

  const fail = useCallback((e: unknown, again: (() => void) | null) => {
    setErr(errCode(e));
    retryRef.current = again;
    setView('error');
  }, []);

  /** Muestra la ronda `r` ya cerrada (mi toque o el tiempo agotado) */
  const reveal = useCallback((r: ConqRound) => {
    setIdx(r.idx);
    setPending(null);
    revealAt.current = Date.now();
    setView('reveal');
    resultSound(r.answer?.points ?? 0, r.answer?.lat != null);
  }, []);

  /** Lleva la pantalla al punto en que va el intento: al empezar, al retomarlo (recarga, otra pestaña) o tras un reintento.
   *  Entre dos rondas se vuelve a mostrar la última respuesta, con SIGUIENTE (la siguiente no se abre sola sin verla) */
  const route = useCallback((a: ConqAttempt) => {
    setAttempt(a);
    shownAt.current = null;
    if (a.status !== 'active') { setView('result'); return; }
    rememberActiveMission({ attemptId: a.id, seasonId: a.season_id, iso: a.country });
    const cur = currentRound(a);
    if (!cur) { setView('result'); return; }
    if (cur.opened_at) { setIdx(cur.idx); setView('question'); return; }
    if (cur.idx === 1) { countdownAt.current = Date.now(); setIdx(1); setView('countdown'); return; }
    setIdx(cur.idx - 1);
    revealAt.current = Date.now();
    setView('reveal');
  }, []);

  const load = useCallback(async () => {
    setView('starting');
    setErr(null);
    try {
      const a = attemptId ? await withRetry(() => fetchAttempt(attemptId)) : await withRetry(() => startAttempt(seasonId, isoProp ?? '', requestId));
      if (!attemptId) trackEvent('conq_mission_start', { iso: a.country, kind: a.kind });
      route(a);
    } catch (e) {
      fail(e, () => void load());
    }
  }, [attemptId, seasonId, isoProp, requestId, route, fail]);
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = useCallback(async (n: number) => {
    const a = attemptRef.current;
    if (!a || busy.current) return;
    busy.current = true;
    const t0 = performance.now();
    try {
      const res = await withRetry(() => openRound(a.id, n));
      setAttempt(res);
      const r = res.rounds.find((x) => x.idx === n);
      shownAt.current = null;
      if (res.status !== 'active') setView('result');
      else if (r?.closed) reveal(r);
      else {
        shownAt.current = performance.now();
        openRtt.current = shownAt.current - t0;
        setIdx(n); setView('question'); if (n === 1) playGo();
      }
    } catch (e) {
      fail(e, () => void open(n));
    } finally {
      busy.current = false;
    }
  }, [reveal, fail]);

  /** Vuelve a leer el intento (ronda vencida, reserva agotada, volver a la pestaña) */
  const sync = useCallback(async () => {
    const a = attemptRef.current;
    if (!a || busy.current || Date.now() - lastSync.current < 1500) return;
    lastSync.current = Date.now();
    busy.current = true;
    try {
      const res = await withRetry(() => fetchAttempt(a.id));
      const r = res.rounds.find((x) => x.idx === idxRef.current);
      setAttempt(res);
      // La ronda en pantalla se cerró (vencida aquí o respondida en otra pestaña): se muestra; si el intento terminó
      // entretanto, el resultado llega con SIGUIENTE
      if (viewRef.current === 'question' && r?.closed) reveal(r);
      else if (res.status !== 'active' && viewRef.current !== 'reveal') setView('result');
    } catch {
      /* se reintenta en el próximo tictac */
    } finally {
      busy.current = false;
    }
  }, [reveal]);

  const send = useCallback(async (n: number, lat: number, lon: number) => {
    const a = attemptRef.current;
    if (!a) return;
    busy.current = true;
    try {
      const res = await withRetry(() => answerRound(a.id, n, lat, lon));
      setAttempt(res);
      const r = res.rounds.find((x) => x.idx === n);
      const ans = r?.answer;
      if (shownAt.current != null && ans?.lat != null && ans.time_s != null && !samples.current.some((x) => x.idx === n)) {
        samples.current.push({ idx: n, openRttMs: openRtt.current, thinkMs: tapAt.current - shownAt.current, answerRttMs: performance.now() - tapAt.current,
          serverS: Number(ans.time_s), km: ans.distance_km != null ? Number(ans.distance_km) : null });
      }
      shownAt.current = null;
      if (r?.closed) reveal(r);
      else if (res.status !== 'active') setView('result');
    } catch (e) {
      fail(e, () => void send(n, lat, lon));
    } finally {
      busy.current = false;
    }
  }, [reveal, fail]);

  const round = attempt?.rounds.find((r) => r.idx === idx) ?? null;
  const deadline = round?.deadline_at ? Date.parse(round.deadline_at) : 0;
  const secsLeft = view === 'question' && deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;

  const onMapClick = useCallback((lat: number, lon: number) => {
    if (view !== 'question' || pending || !round?.opened_at || busy.current) return;
    tapAt.current = performance.now();
    playClick();
    setPending({ lat, lon });
    void send(round.idx, lat, lon);
  }, [view, pending, round, send]);

  // ── Relojes: cuenta inicial, vencimiento de la ronda, avance automático y reserva ──
  const countdownLeft = view === 'countdown' ? Math.max(0, Math.ceil((COUNTDOWN_MS - (Date.now() - countdownAt.current)) / 1000)) : 0;
  const lastCount = useRef(0);
  useEffect(() => {
    if (view !== 'countdown') return;
    if (countdownLeft > 0 && lastCount.current !== countdownLeft) { lastCount.current = countdownLeft; playCountdown(); }
    if (countdownLeft === 0) void open(1);
  }, [view, countdownLeft, open]);
  const lastTick = useRef(0);
  useEffect(() => {
    if (view !== 'question' || secsLeft == null) return;
    if (secsLeft <= 3 && secsLeft >= 1 && lastTick.current !== secsLeft) { lastTick.current = secsLeft; playTick(secsLeft); }
    // El servidor cierra la ronda vencida con 0: se pide el estado un poco después del plazo
    if (!pending && deadline && now >= deadline + 700) void sync();
  }, [view, secsLeft, pending, deadline, now, sync]);
  const next = useCallback(() => {
    const a = attemptRef.current;
    if (!a || view !== 'reveal') return;
    lastTick.current = 0;
    if (a.status !== 'active') { setView('result'); return; }
    const cur = currentRound(a);
    if (cur) void open(cur.idx); else void sync();
  }, [view, open, sync]);
  const nextIn = view === 'reveal' ? Math.max(0, Math.ceil((AUTO_NEXT_MS - (Date.now() - revealAt.current)) / 1000)) : 0;
  useEffect(() => { if (view === 'reveal' && Date.now() - revealAt.current >= AUTO_NEXT_MS) next(); }, [view, now, next]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && view === 'reveal') { e.preventDefault(); next(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, next]);
  const expiresAt = attempt ? Date.parse(attempt.expires_at) : 0;
  useEffect(() => {
    if (attempt?.status === 'active' && expiresAt && now >= expiresAt + 500 && view !== 'result' && view !== 'error') void sync();
  }, [attempt?.status, expiresAt, now, view, sync]);
  // Al volver a la pestaña o a la app: el reloj del servidor siguió corriendo
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible' && view !== 'result') { lastSync.current = 0; void sync(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [view, sync]);

  useEffect(() => {
    if (view === 'result' && attempt && attempt.status !== 'active' && samples.current.length) setNet(reportMissionNet(attempt.id, attempt.country, samples.current, attempt.seconds));
  }, [view, attempt]);

  const iso = attempt?.country ?? isoProp ?? '';
  const country = conqCountryName(iso, locale);
  const exit = async () => {
    playButtonTap();
    const a = attemptRef.current;
    if (!a || a.status !== 'active' || view === 'result') { onExit(); return; }
    if (!window.confirm(t('cq_abandonConfirm', { country }))) return;
    try {
      const res = await abandonAttempt(a.id);
      setAttempt(res);
      setView('result');
      trackEvent('conq_mission_abandon', { iso: a.country, round: idxRef.current });
    } catch {
      onExit();
    }
  };

  // Props del mapa memoizados (el lienzo reinicia su animación si cambian de identidad)
  const bounds = useMemo(() => countryBounds(iso || 'CO', 0.06), [iso]);
  const layer = useMemo(() => missionLayer(iso || 'CO'), [iso]);
  const shown = view === 'reveal' ? round : null;
  const userClick = useMemo(() => {
    if (shown?.answer?.lat != null && shown.answer.lon != null) return { lat: shown.answer.lat, lon: shown.answer.lon };
    return null;
  }, [shown]);
  const correct = useMemo(() => (shown?.correct ? { lat: shown.correct.lat, lon: shown.correct.lon } : null), [shown]);
  const name = round ? cityLabel(round.place_id, round.name, locale) : '';
  const pinLabels = useMemo(() => (shown ? { you: t('game_yourAnswer'), correct: name } : null), [shown, t, name]);
  // Mi toque mientras se envía (antes de que el servidor confirme)
  const markers = useMemo(() => (pending ? [{ lat: pending.lat, lon: pending.lon, on: true }] : null), [pending]);

  if (view === 'result' && attempt) {
    return <MissionResult attempt={attempt} seasonId={seasonId} net={net} onBoard={() => { playButtonTap(); onExit(); }} />;
  }
  if (view === 'starting' || !attempt) {
    if (view === 'error') return <MissionError text={errText(err)} onRetry={retryRef.current} onBack={onExit} />;
    return <Centered><Mascot state="idle" className="w-16" /><p className="text-muted-foreground font-bold">{t('cq_starting')}</p></Centered>;
  }
  if (view === 'error') return <MissionError text={errText(err)} onRetry={retryRef.current} onBack={onExit} />;

  const total = attempt.rounds.reduce((x, r) => x + (r.closed ? r.answer?.points ?? 0 : 0), 0);
  const free = attempt.kind === 'capture';
  const targetValue = free ? attempt.threshold : attempt.defense_at_start;
  const clockMs = expiresAt - now;
  const clock = clockMs > 0 ? `${Math.floor(clockMs / 60000)}:${String(Math.floor((clockMs % 60000) / 1000)).padStart(2, '0')}` : '0:00';
  const frac = view === 'question' && secsLeft != null && deadline ? Math.max(0, Math.min(1, (deadline - now) / (attempt.seconds * 1000))) : 0;
  const ans = shown?.answer ?? null;

  const map = (
    <>
      <WorldMapCanvas onMapClick={onMapClick} clickDisabled={view !== 'question' || !!pending} userClick={userClick} correctLocation={correct}
        distanceKm={shown && ans?.distance_km != null ? Number(ans.distance_km) : null} gameMode="world" viewBounds={bounds} territories={layer}
        pinLabels={pinLabels} markers={markers} showZoomControls={view === 'question'} />
      {view === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center p-4" style={{ background: 'hsl(var(--brand-navy-deep) / 0.6)' }}>
          <div className="text-center flex flex-col items-center gap-2">
            <p className="font-black text-xl short:text-lg">⚔️ {t(free ? 'cq_sheetCapture' : attempt.kind === 'recover' ? 'cq_sheetRecover' : 'cq_sheetAttack', { country })}</p>
            <span key={countdownLeft} className="font-black text-[min(26vw,22dvh,7rem)] text-primary leading-none animate-score-pop">{countdownLeft || '…'}</span>
            <p className="text-sm text-foreground/85">{t('cq_countdownDesc', { s: attempt.seconds })}</p>
          </div>
        </div>
      )}
    </>
  );
  const strip = view === 'reveal' && shown ? (
    <AnswerStrip title={ans?.lat == null ? `⏰ ${t('cq_timeout')}` : `✓ ${name}`}
      sub={ans?.lat == null || ans.distance_km == null ? t('cq_noAnswer') : `${formatDistance(Number(ans.distance_km))} · ${fmtS(Number(ans.time_s ?? 0))} s`}
      points={ans?.points ?? 0} nextIn={nextIn} onNext={next} />
  ) : null;
  return (
    <PlayFrame iso={iso} country={country} practice={false} cityN={idx} cityTotal={attempt.rounds.length} clock={clock} musicMuted={musicMuted} onToggleMusic={onToggleMusic}
      exitLabel={t('cq_abandon')} onExit={() => void exit()} prompt={view === 'countdown' ? '…' : `${name}?`}
      secsLeft={secsLeft} frac={frac} map={map} strip={strip}
      you={total} targetLabel={free ? t('cq_toCaptureShort') : t('cq_rivalMark')} targetValue={fmtN(targetValue)}
      hint={view === 'question' ? (pending ? t('cq_sending') : t('game_tapToAnswer')) : null} />
  );
}

function MissionError({ text, onRetry, onBack }: { text: string; onRetry: (() => void) | null; onBack: () => void }) {
  const { t } = useI18n();
  return (
    <Centered>
      <Mascot state="sad" className="w-20" />
      <p className="font-extrabold text-lg max-w-sm">{text}</p>
      <div className="flex gap-2">
        {onRetry && <button onClick={() => { playButtonTap(); onRetry(); }} className="rounded-2xl border-2 border-accent px-5 py-2.5 font-bold text-accent">{t('retry')}</button>}
        <button onClick={() => { playButtonTap(); onBack(); }} className="rounded-2xl border-2 border-foreground/30 px-5 py-2.5 font-bold">{t('cq_backToMap')}</button>
      </div>
    </Centered>
  );
}

// ═══════════════════════════════════════ P4 Resultado ═══════════════════════════════════════
function MissionResult({ attempt, seasonId, net, onBoard }: { attempt: ConqAttempt; seasonId: string; net: NetSummary | null; onBoard: () => void }) {
  const { t, locale } = useI18n();
  const [map, setMap] = useState<ConqMap | null>(null);
  const [review, setReview] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);
  const iso = attempt.country;
  const country = conqCountryName(iso, locale);
  const outcome = attempt.outcome ?? 'expired';
  const won = outcome === 'captured' || outcome === 'conquered';

  useEffect(() => {
    forgetActiveMission(attempt.id);
    let alive = true;
    fetchMap(seasonId).then((m) => { if (alive) setMap(m); }).catch(() => {});
    trackEvent('conq_mission_done', { iso, outcome, total: attempt.total });
    if (won) { playVictory(); fireCelebration(); }
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const styles = useMemo(() => playerStyles(map?.players ?? [], map?.my_id ?? null), [map]);
  const owner = attempt.owner_at_start ? styles.get(attempt.owner_at_start) : undefined;
  const ownerName = owner?.name ?? t('cq_retired');
  const free = attempt.kind === 'capture';
  const mark = free ? attempt.threshold : attempt.defense_at_start;
  const total = attempt.total;
  const vars = { country, name: ownerName, mark: fmtN(mark), total: fmtN(total), threshold: fmtN(attempt.threshold),
    n: fmtN(outcome === 'failed' ? attempt.threshold - total : outcome === 'defended' ? mark - total + 1 : 0) };
  const titleKey = outcome === 'conquered' && attempt.kind === 'recover' ? 'cq_res_recovered_title' : `cq_res_${outcome}_title`;
  const mine = map ? myStanding(map) : null;

  // Mapa: el país con su dueño final, o la ronda que se está revisando
  const terrNow = map?.territories.find((x) => x.iso === iso) ?? null;
  const bounds = useMemo(() => countryBounds(iso, 0.08), [iso]);
  const layer = useMemo(() => {
    const base = sheetLayer(terrNow, iso, styles);
    const o = terrNow?.owner_id ? styles.get(terrNow.owner_id) : undefined;
    return o ? { ...base, badges: [{ ...badgePoint(iso), text: o.initial, color: o.color }] } : base;
  }, [terrNow, iso, styles]);
  const rv = review != null ? attempt.rounds.find((r) => r.idx === review) ?? null : null;
  const rvClick = useMemo(() => (rv?.answer?.lat != null && rv.answer.lon != null ? { lat: rv.answer.lat, lon: rv.answer.lon } : null), [rv]);
  const rvCorrect = useMemo(() => (rv?.correct ? { ...rv.correct } : null), [rv]);
  const rvLabels = useMemo(() => (rv ? { you: t('game_yourAnswer'), correct: cityLabel(rv.place_id, rv.name, locale) } : null), [rv, t, locale]);
  const missionLayerFor = useMemo(() => missionLayer(iso), [iso]);

  const shareText = t('cq_shareWin', { country, total: fmtN(total) });
  const share = async () => {
    playButtonTap();
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://geospeed-challenge.vercel.app';
    try {
      if ('share' in navigator) { await navigator.share({ text: shareText, url }); playShareSuccess(); trackEvent('conq_share_result', { method: 'native' }); return; }
    } catch { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`, '_blank', 'noopener');
    trackEvent('conq_share_result', { method: 'whatsapp' });
  };

  return (
    <div className="fixed inset-0 z-40 game-bg overflow-y-auto">
      <div className="min-h-full max-w-4xl mx-auto px-4 py-5 flex flex-col gap-3" style={{ paddingTop: 'max(1.25rem, var(--sat))', paddingBottom: 'max(1.25rem, var(--sab))' }}>
        <header className="text-center">
          <h1 className={`font-black text-3xl sm:text-4xl short:text-2xl leading-tight ${won ? 'text-primary' : ''}`}>{t(titleKey as never, vars)}</h1>
          <p className="text-base sm:text-lg text-foreground/85">{t(`cq_res_${outcome}_sub` as never, vars)}</p>
        </header>

        <div className="grid gap-3 md:grid-cols-2 items-start">
          <div className="min-w-0 flex flex-col gap-2">
            <div className="relative rounded-3xl overflow-hidden border-2 border-accent/40 h-[clamp(14rem,40dvh,24rem)] short:h-[60dvh]">
              <WorldMapCanvas onMapClick={() => {}} clickDisabled gameMode="world" viewBounds={bounds} territories={rv ? missionLayerFor : layer}
                userClick={rvClick} correctLocation={rvCorrect} distanceKm={rv?.answer?.distance_km != null ? Number(rv.answer.distance_km) : null}
                pinLabels={rv ? rvLabels : null} showZoomControls={false} />
              {rv && <span className="absolute left-2 top-2 rounded-full border border-accent/50 px-3 py-1 text-xs font-bold" style={{ background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>{t('cq_cityN', { n: rv.idx, total: attempt.rounds.length })} · {cityLabel(rv.place_id, rv.name, locale)}</span>}
            </div>
          </div>

          <div className="min-w-0 flex flex-col gap-3">
            {/* Ambas marcas y la diferencia */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border-2 border-primary/60 bg-card/85 px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground font-bold">📍 {t('cq_you')}</p>
                <p className="font-black text-3xl text-primary tabular-nums leading-tight">{fmtN(total)}</p>
              </div>
              <div className="rounded-2xl border-2 border-accent/40 bg-card/85 px-3 py-2 text-center flex flex-col items-center">
                <p className="text-xs text-muted-foreground font-bold truncate max-w-full">{free ? t('cq_toCaptureShort') : ownerName}</p>
                <p className="font-black text-3xl tabular-nums leading-tight">{fmtN(mark)}</p>
              </div>
            </div>
            {outcome === 'conquered' && <p className="rounded-2xl border-2 border-accent/60 bg-accent/10 px-3 py-2 text-center font-black text-accent">{t('cq_resAdvantage', { n: fmtN(total - mark) })}</p>}
            {outcome === 'captured' && <p className="rounded-2xl border-2 border-accent/60 bg-accent/10 px-3 py-2 text-center font-black text-accent">{t('cq_resOverThreshold', { n: fmtN(total - mark) })}</p>}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-accent/30 bg-card/70 px-3 py-2 text-center"><p className="font-black text-xl">🏙️ {answeredRounds(attempt)}/{attempt.rounds.length}</p><p className="text-xs text-muted-foreground">{t('cq_resCities')}</p></div>
              <div className="rounded-2xl border border-accent/30 bg-card/70 px-3 py-2 text-center"><p className="font-black text-xl">🚩 {mine ? mine.territories : '…'}</p><p className="text-xs text-muted-foreground">{t('cq_resTerritories')}</p></div>
            </div>
            {owner && !won && <p className="flex items-center justify-center gap-2 text-sm"><ConqFace player={owner} color={owner.color} /> {t('cq_resKeeps', { name: ownerName, country })}</p>}

            <button onClick={onBoard} className="btn3d w-full rounded-2xl py-3.5 short:py-2.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>🗺️ {t('cq_resultBoard')}</button>
            {won && <button onClick={() => void share()} className="w-full rounded-2xl py-3 short:py-2 border-2 border-accent text-accent font-black hover:bg-accent/10">📤 {t('cq_resultShare')}</button>}
            {attempt.rounds.some((r) => r.opened_at) && (
              <button onClick={() => { playButtonTap(); setShowReview((v) => !v); if (showReview) setReview(null); }} className="py-1 font-bold text-accent hover:underline underline-offset-4">
                📖 {showReview ? t('cq_resultHideReview') : t('cq_resultReview')}
              </button>
            )}
            {showReview && (
              <ol className="flex flex-col gap-1.5">
                {attempt.rounds.map((r) => {
                  const a = r.answer;
                  return (
                    <li key={r.idx}>
                      <button disabled={!r.opened_at} onClick={() => { playButtonTap(); setReview(review === r.idx ? null : r.idx); }}
                        className={`w-full flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm text-left ${review === r.idx ? 'border-primary bg-primary/10' : 'border-accent/25 bg-card/70'} disabled:opacity-60`}>
                        <span className="w-5 text-center font-black text-muted-foreground">{r.idx}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold">{r.opened_at ? cityLabel(r.place_id, r.name, locale) : t('cq_roundNotOpened')}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{a?.lat == null || a.distance_km == null ? t('cq_noAnswer') : `${formatDistance(Number(a.distance_km))} · ${fmtS(Number(a.time_s ?? 0))} s`}</span>
                        <span className="w-12 text-right font-black tabular-nums">{fmtN(a?.points ?? 0)}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
            {net && (conquestBetaOn() || import.meta.env.DEV) && <NetPanel net={net} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Solo en los teléfonos de prueba (`?conquista=beta`): cuánto le sumó la red al tiempo que contó el servidor */
function NetPanel({ net }: { net: NetSummary }) {
  const { t } = useI18n();
  const avg = useMemo(() => netAverage(), []);
  const s = (ms: number) => (ms / 1000).toLocaleString(appNumberLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="rounded-2xl border border-dashed border-accent/50 bg-card/60 px-3 py-2 text-sm">
      <p className="font-black text-accent">📶 {t('cq_netTitle')}</p>
      <p>{t('cq_netDelay', { s: s(net.avgDelayMs), max: s(net.maxDelayMs), n: net.rounds })}</p>
      <p>{t('cq_netRtt', { ms: fmtN(net.avgRttMs) })}</p>
      <p>{t('cq_netLost', { n: fmtN(net.lostPoints) })}</p>
      {avg && avg.missions > 1 && <p className="text-muted-foreground">{t('cq_netAverage', { n: avg.missions, s: s(avg.avgDelayMs), pts: fmtN(avg.lostPoints) })}</p>}
      <p className="text-xs text-muted-foreground mt-1">{t('cq_netNote')}</p>
    </div>
  );
}
