import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { itemTitle } from '@/lib/catalog';
import { cityById } from '@/lib/itemMemory';
import { conqPoints, fetchPracticeSet, type ConqPracticeCity } from '@/lib/conquest';
import { conqCountryName, countryBounds, missionLayer } from '@/lib/conquestMap';
import { haversineKm } from '@/lib/flagScoring';
import { formatDistance } from '@/lib/gameUtils';
import { appNumberLocale } from '@/lib/format';
import { trackEvent } from '@/lib/analytics';
import { playBad, playButtonTap, playClick, playGo, playGood, playMedium, playPerfect, playTick, playTimeExpired } from '@/lib/sounds';
import WorldMapCanvas from './WorldMapCanvas';
import { HudIconButton } from './GameHud';
import Mascot from './Mascot';
import { errCode, useErrText } from './ConquestParts';
import type { PracticeTarget } from './ConquestBoard';

/**
 * Conquista el mapa — P3 en modo práctica (fase C4): cinco ciudades del país que NO están en el paquete oficial
 * (conq_practice_set), 15 s cada una, puntaje con la fórmula de Conquista calculado aquí, sin guardar nada ni gastar
 * misiones. Mismo aspecto que la misión oficial de C5: país y "Ciudad n de 5", pregunta con anillo de tiempo, el mapa
 * encuadrado en el país (los demás apagados, sin nombres de ciudades), mis puntos frente a lo que hay que superar,
 * y tras cada respuesta el lugar correcto, distancia, tiempo y puntos con SIGUIENTE (solo a los 3 s).
 */

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

const SECONDS = 15;
const AUTO_NEXT_MS = 3000;

export default function ConquestPractice({ seasonId, iso, target, musicMuted, onToggleMusic, onExit }: ConquestPracticeProps) {
  const { t, locale } = useI18n();
  const errText = useErrText();
  const [stage, setStage] = useState<Stage>('loading');
  const [cities, setCities] = useState<ConqPracticeCity[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState<ReturnType<typeof errCode> | null>(null);
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
  const cityName = useMemo(() => {
    if (!city) return '';
    const c = cityById(city.id);
    return c ? itemTitle(c, locale) : city.name;
  }, [city, locale]);

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
    if (a.lat == null) playTimeExpired();
    else if (a.points >= 900) playPerfect();
    else if (a.points >= 600) playGood();
    else if (a.points >= 250) playMedium();
    else playBad();
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
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());
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
      <div className="fixed inset-0 z-40 game-bg flex flex-col items-center justify-center gap-4 text-center px-6">
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
      </div>
    );
  }

  // ── Resumen de la práctica ──
  if (stage === 'done') {
    const verdict = !target ? '' : target.kind === 'own' ? t('cq_practiceOwn', { mark: fmt(target.mark) })
      : target.kind === 'capture' ? (total >= target.mark ? t('cq_practiceWouldCapture', { country }) : t('cq_practiceShortCapture', { n: fmt(target.mark - total), country }))
      : total > target.mark ? t('cq_practiceWouldConquer', { name: target.ownerName ?? t('cq_retired'), mark: fmt(target.mark) })
      : total === target.mark ? t('cq_practiceTie', { name: target.ownerName ?? t('cq_retired') })
      : t('cq_practiceShortConquer', { n: fmt(target.mark - total + 1), name: target.ownerName ?? t('cq_retired') });
    const good = !!target && (target.kind === 'own' || (target.kind === 'capture' ? total >= target.mark : total > target.mark));
    return (
      <div className="fixed inset-0 z-40 game-bg overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center gap-3 px-4 py-6 max-w-lg mx-auto text-center" style={{ paddingTop: 'max(1.5rem, var(--sat))' }}>
          <Mascot state={good ? 'celebrate' : 'wink'} className="w-20 short:w-14" />
          <p className="text-sm font-bold text-accent uppercase tracking-widest">🎯 {t('cq_practiceTag')} · {country}</p>
          <h1 className="font-black text-3xl short:text-2xl">{t('cq_practiceDone')}</h1>
          <p className="font-black text-4xl text-primary tabular-nums">{t('cq_practiceTotal', { n: fmt(total), max: fmt(cities.length * 1000) })}</p>
          {verdict && <p className="text-base font-semibold">{verdict}</p>}
          <ol className="w-full flex flex-col gap-1.5 text-left">
            {answers.map((a, i) => {
              const c = cities[i];
              const item = c ? cityById(c.id) : undefined;
              return (
                <li key={i} className="flex items-center gap-2 rounded-xl border border-accent/25 bg-card/70 px-3 py-1.5 text-sm">
                  <span className="w-5 text-center font-black text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{item ? itemTitle(item, locale) : c?.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{a.km == null ? t('cq_noAnswer') : `${formatDistance(a.km)} · ${a.t.toLocaleString(appNumberLocale(), { maximumFractionDigits: 1 })} s`}</span>
                  <span className="w-12 text-right font-black tabular-nums">{fmt(a.points)}</span>
                </li>
              );
            })}
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

  // ── Partida: pregunta arriba, mapa, mis puntos y la marca abajo (en horizontal y computador, a un lado) ──
  const frac = stage === 'question' ? Math.max(0, Math.min(1, 1 - elapsed / SECONDS)) : 0;
  const ring = 2 * Math.PI * 20;
  return (
    <div className="fixed inset-0 z-40 h-[100dvh] min-h-0 overflow-hidden game-bg flex flex-col" role="main" aria-label={t('cq_practiceTag')} data-game-container>
      <header className="shrink-0 bg-brand-navy-deep border-b-2 border-accent/50 px-2 sm:px-4 py-1.5 flex items-center gap-2" style={{ paddingTop: 'max(0.375rem, var(--sat))', paddingLeft: 'max(0.5rem, var(--sal))', paddingRight: 'max(0.5rem, var(--sar))' }}>
        <img src={`/flags/${iso}.svg`} alt="" aria-hidden className="w-9 aspect-[3/2] object-cover rounded-[3px] ring-1 ring-black/20 shrink-0" />
        <p className="min-w-0 flex-1 leading-tight truncate"><span className="font-black">{country}</span> <span className="text-muted-foreground">· {t('cq_cityN', { n: Math.min(idx + 1, cities.length), total: cities.length })}</span></p>
        <span className="shrink-0 rounded-full border border-accent/60 px-2.5 py-0.5 text-[11px] sm:text-xs font-black text-accent">🎯 {t('cq_practiceTag')}</span>
        <HudIconButton icon={musicMuted ? 'mute' : 'sound'} label={musicMuted ? t('music_on') : t('music_off')} onClick={onToggleMusic} size="sm" />
        <HudIconButton icon="close" label={t('cq_exitPractice')} onClick={exit} size="sm" />
      </header>

      <div className="flex-1 min-h-0 grid grid-rows-[auto_minmax(0,1fr)_auto] short:grid-rows-[auto_minmax(0,1fr)] short:grid-cols-[minmax(0,1fr)_15rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Pregunta y anillo de tiempo */}
        <section className="short:col-start-2 short:row-start-1 lg:col-start-2 lg:row-start-1 m-2 mb-0 short:mb-0 rounded-2xl border-2 border-accent/40 bg-card/85 px-3 py-2 flex items-center gap-3" aria-live="polite">
          <p className="min-w-0 flex-1 leading-tight">
            <span className="block text-sm sm:text-base font-bold">{t('game_whereIsLead')}</span>
            <span className="block font-black text-2xl sm:text-3xl short:text-xl text-primary truncate">{stage === 'ready' ? '…' : `${cityName}?`}</span>
          </p>
          <svg viewBox="0 0 48 48" className="w-14 h-14 short:w-11 short:h-11 shrink-0 -rotate-90" aria-label={t('cq_secondsLeft', { s: secsLeft })} role="img">
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="5" className="stroke-muted/40" />
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="5" strokeLinecap="round" className={secsLeft <= 3 && stage === 'question' ? 'stroke-destructive' : 'stroke-accent'}
              strokeDasharray={ring} strokeDashoffset={ring * (1 - frac)} style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
            <text x="24" y="24" textAnchor="middle" dominantBaseline="central" className="fill-foreground font-black" fontSize="15" transform="rotate(90 24 24)">{stage === 'question' ? `${secsLeft}s` : '–'}</text>
          </svg>
        </section>

        {/* Mapa del país (los demás apagados) */}
        <div className="relative min-h-0 m-2 short:mr-0 lg:mr-0 short:col-start-1 short:row-start-1 short:row-span-2 lg:col-start-1 lg:row-start-1 lg:row-span-2 rounded-2xl overflow-hidden border-2 border-accent/30">
          <WorldMapCanvas
            onMapClick={onMapClick}
            clickDisabled={stage !== 'question'}
            userClick={userClick}
            correctLocation={correct}
            distanceKm={last?.km ?? null}
            gameMode="world"
            viewBounds={bounds}
            territories={layer}
            pinLabels={pinLabels}
            showZoomControls={stage === 'question'}
          />
          {stage === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center p-4" style={{ background: 'hsl(var(--brand-navy-deep) / 0.55)' }}>
              <div className="max-w-sm w-full rounded-3xl border-2 border-accent/50 bg-card/95 p-4 short:p-3 text-center flex flex-col items-center gap-2">
                <p className="font-black text-xl short:text-lg">🎯 {t('cq_readyTitle', { country })}</p>
                <p className="text-sm text-foreground/85">{t('cq_readyDesc', { n: cities.length, s: SECONDS })}</p>
                <button onClick={start} autoFocus className="btn3d w-full rounded-2xl py-3 short:py-2 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('cq_go')}</button>
              </div>
            </div>
          )}
        </div>

        {/* Mis puntos, lo que hay que superar y la respuesta */}
        <section className="short:col-start-2 short:row-start-2 lg:col-start-2 lg:row-start-2 m-2 mt-0 short:mt-2 lg:mt-2 flex flex-col gap-2 min-h-0" style={{ paddingBottom: 'var(--sab)' }}>
          {stage === 'answer' && last && (
            <div className="rounded-2xl border-2 border-primary/60 bg-card/95 px-3 py-2 flex items-center gap-3 animate-fade-in-up" role="status">
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block font-black truncate">{last.lat == null ? `⏰ ${t('cq_timeout')}` : `✓ ${cityName}`}</span>
                <span className="block text-xs sm:text-sm text-muted-foreground">{last.km == null ? t('cq_noAnswer') : `${formatDistance(last.km)} · ${last.t.toLocaleString(appNumberLocale(), { maximumFractionDigits: 1 })} s`}</span>
              </span>
              <span className="font-black text-2xl text-primary tabular-nums">+{fmt(last.points)}</span>
              <button onClick={() => { playButtonTap(); next(); }} className="shrink-0 rounded-xl px-3 py-2 font-black text-sm text-primary-foreground btn3d" style={{ background: 'var(--grad-cta)' }}>
                {t('game_next')} <span className="opacity-75">{nextIn}</span>
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border-2 border-primary/50 bg-card/85 px-3 py-1.5 text-center">
              <p className="text-xs text-muted-foreground font-bold">📍 {t('cq_you')}</p>
              <p className="font-black text-2xl short:text-xl text-primary tabular-nums leading-tight">{fmt(total)}</p>
            </div>
            <div className="rounded-2xl border-2 border-accent/40 bg-card/85 px-3 py-1.5 text-center">
              <p className="text-xs text-muted-foreground font-bold truncate">{targetLabel}</p>
              <p className="font-black text-2xl short:text-xl tabular-nums leading-tight">{target ? fmt(target.mark) : '–'}</p>
            </div>
          </div>
          {stage === 'question' && <p className="rounded-full border border-accent/40 bg-card/70 px-3 py-1.5 text-center text-sm font-bold">{t('game_tapToAnswer')}</p>}
        </section>
      </div>
    </div>
  );
}
