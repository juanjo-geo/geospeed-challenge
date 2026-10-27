import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import type { City, MapBounds } from '@/data/cities';
import { correctPinLabel, isFlag, isMonument, itemPhotoUrl, itemSubtitle, itemTitle, usesShapeFile } from '@/lib/catalog';
import { cityById } from '@/lib/itemMemory';
import { countryDistance } from '@/lib/flagScoring';
import { featureDistance } from '@/lib/featureScoring';
import { useFeatureShapes, usePackShapes } from '@/hooks/useFeatureShapes';
import { useIsPortraitMobile } from '@/hooks/use-mobile';
import { formatDistance } from '@/lib/gameUtils';
import { appNumberLocale } from '@/lib/format';
import { playBad, playButtonTap, playClick, playCountdown, playGo, playGood, playMedium, playPerfect, playTick, playTimeExpired } from '@/lib/sounds';
import { RoomError, answerRoom, roomTimeline, serverNow, type RoomAnswerResult, type RoomState } from '@/lib/rooms';
import WorldMapCanvas from './WorldMapCanvas';
import RotateOverlay from './RotateOverlay';
import { HudIconButton } from './GameHud';
import Flag from '@/components/ui/Flag';
import { PlayerFace, formatPin } from './RoomParts';

interface RoomGameProps {
  state: RoomState;
  onRefresh: () => Promise<void>;
  onExit: () => void;
}

/** Mi respuesta de una ronda: el toque y, cuando el servidor contesta, mis puntos */
interface MyAnswer { lat: number; lon: number; time: number; result: RoomAnswerResult | null; late?: boolean }

/** Marco de la revelación: el lugar correcto, mi toque (siempre) y los toques cercanos de los demás (los muy lejanos no achican el mapa) */
function revealBounds(correct: { lat: number; lon: number }, others: { lat: number; lon: number }[], mine: { lat: number; lon: number } | null): MapBounds | null {
  const near = others.filter((p) => Math.abs(p.lat - correct.lat) < 35 && Math.abs(p.lon - correct.lon) < 50);
  const all = [correct, ...near, ...(mine ? [mine] : [])];
  const lats = all.map((p) => p.lat), lons = all.map((p) => p.lon);
  const latMin = Math.min(...lats), latMax = Math.max(...lats), lonMin = Math.min(...lons), lonMax = Math.max(...lons);
  if (lonMax - lonMin > 150 || latMax - latMin > 90) return null;
  const pad = Math.max(3, Math.max(latMax - latMin, lonMax - lonMin) * 0.35);
  const cLat = (latMin + latMax) / 2, cLon = (lonMin + lonMax) / 2;
  const hLat = Math.max((latMax - latMin) / 2 + pad, 6), hLon = Math.max((lonMax - lonMin) / 2 + pad, 10);
  return { latMin: Math.max(-62, cLat - hLat), latMax: Math.min(85, cLat + hLat), lonMin: Math.max(-180, cLon - hLon), lonMax: Math.min(180, cLon + hLon) };
}

/**
 * Partida de la sala en vivo (bloque S3): la ronda la marca el reloj del servidor (`roomTimeline` con `serverNow`),
 * no este teléfono. Al responder se ve "Respuesta enviada" y el contador de respuestas, pero no el lugar correcto hasta
 * que cierra la ronda. Al cerrar: el mapa con el lugar, mi toque y los de todos, mis puntos, mi puesto y el top 5.
 */
export default function RoomGame({ state, onRefresh, onExit }: RoomGameProps) {
  const { t, locale } = useI18n();
  const isPortraitMobile = useIsPortraitMobile();
  const [now, setNow] = useState(serverNow);
  useEffect(() => { const id = setInterval(() => setNow(serverNow()), 200); return () => clearInterval(id); }, []);
  const tl = roomTimeline(state, now);
  const s = state.settings;
  const isPlayer = state.i_am_player;

  // ── Mis respuestas: las del servidor + la que acabo de mandar ──
  const [mine, setMine] = useState<Record<number, MyAnswer>>({});
  useEffect(() => {
    const fromServer = state.me?.answers ?? [];
    if (!fromServer.length) return;
    setMine((m) => {
      const next = { ...m };
      for (const a of fromServer) {
        if (next[a.round]?.result) continue;
        next[a.round] = { lat: a.lat, lon: a.lon, time: a.time_s, result: { round: a.round, km: a.km, base: a.base, points: a.points, combo: a.combo, combo_mult: a.combo_mult, time_s: a.time_s, total: state.me?.total ?? 0, repeat: true } };
      }
      return next;
    });
  }, [state.me]);

  const raw = state.items.find((i) => i.n === tl.round) ?? null;
  const item: City | null = useMemo(() => {
    if (!raw) return null;
    const c = cityById(raw.id);
    return c ? { ...c, lat: raw.lat ?? c.lat, lon: raw.lon ?? c.lon } : { id: raw.id, kind: raw.kind as City['kind'], name: raw.name, country: raw.country ?? '', lat: raw.lat ?? 0, lon: raw.lon ?? 0, difficulty: s.difficulty };
  }, [raw?.id, raw?.lat]); // eslint-disable-line react-hooks/exhaustive-deps
  const myAns = mine[tl.round];

  // ── Responder ──
  const sending = useRef<number | null>(null);
  const onMapClick = useCallback((lat: number, lon: number) => {
    const cur = roomTimeline(state, serverNow());
    if (cur.phase !== 'question' || !isPlayer || mine[cur.round] || sending.current === cur.round) return;
    const round = cur.round;
    const time = Math.max(0, (serverNow() - cur.opensAt) / 1000);
    sending.current = round;
    playClick();
    setMine((m) => ({ ...m, [round]: { lat, lon, time, result: null } }));
    const send = (attempt: number): Promise<void> => answerRoom(state.id, round, lat, lon, time)
      .then((r) => { setMine((m) => ({ ...m, [round]: { lat, lon, time, result: r } })); void onRefresh(); })
      .catch((e) => {
        if (e instanceof RoomError && e.code === 'round_closed') { setMine((m) => ({ ...m, [round]: { lat, lon, time, result: null, late: true } })); return; }
        if (attempt < 2) return new Promise<void>((res) => setTimeout(res, 600)).then(() => send(attempt + 1));
      });
    void send(0).finally(() => { sending.current = null; });
  }, [state, isPlayer, mine, onRefresh]);

  // ── Momentos de la línea de tiempo: consultas y sonidos ──
  const lastPhase = useRef('');
  const lastTick = useRef(-1);
  useEffect(() => {
    const key = `${tl.phase}:${tl.round}`;
    if (lastPhase.current === key) return;
    lastPhase.current = key;
    if (tl.phase === 'question') { playGo(); void onRefresh(); }
    if (tl.phase === 'reveal') {
      // Los toques de todos llegan con la consulta (los que respondieron en el margen de 1 s incluidos)
      const id = setTimeout(() => void onRefresh(), 1200);
      return () => clearTimeout(id);
    }
    if (tl.phase === 'finished') void onRefresh();
  }, [tl.phase, tl.round, onRefresh]);
  const secsLeft = tl.phase === 'question' ? Math.max(0, Math.ceil((tl.closesAt - now) / 1000)) : tl.phase === 'countdown' ? Math.max(1, Math.ceil((tl.opensAt - now) / 1000)) : 0;
  useEffect(() => {
    if (secsLeft === lastTick.current) return;
    lastTick.current = secsLeft;
    if (tl.phase === 'countdown') playCountdown();
    else if (tl.phase === 'question' && secsLeft <= 3 && secsLeft > 0 && !myAns) playTick(secsLeft);
  }, [secsLeft, tl.phase, myAns]);

  // ── Revelación ──
  const revealed = tl.phase === 'reveal' && state.reveal?.round === tl.round && raw?.lat != null;
  const featureShapes = useFeatureShapes(item?.kind === 'feature');
  const packShapes = usePackShapes(item?.kind === 'division' ? item.id ?? null : null);
  const highlightShape = useMemo(() => {
    if (!revealed || !item?.id || (item.kind !== 'feature' && item.kind !== 'division')) return null;
    return (item.kind === 'division' ? packShapes : featureShapes)?.[item.id] ?? null;
  }, [revealed, item, featureShapes, packShapes]);
  const target = useMemo(() => {
    if (!revealed || !item) return null;
    if (myAns) {
      const hit = isFlag(item) ? countryDistance(item.name, myAns.lat, myAns.lon) : usesShapeFile(item) ? featureDistance(item, myAns.lat, myAns.lon) : null;
      if (hit) return { lat: hit.nearest.lat, lon: hit.nearest.lon, inside: hit.inside };
    }
    return { lat: item.lat, lon: item.lon, inside: false };
  }, [revealed, item, myAns]);
  const others = useMemo(() => (revealed ? (state.reveal?.clicks ?? []).filter((c) => !c.me) : []), [revealed, state.reveal]);
  const userClick = useMemo(() => (revealed && myAns ? { lat: myAns.lat, lon: myAns.lon } : null), [revealed, myAns]);
  const correct = useMemo(() => (revealed && target && myAns ? { lat: target.lat, lon: target.lon } : null), [revealed, target, myAns]);
  const markers = useMemo(() => {
    if (revealed) {
      const pts = others.map((c) => ({ lat: c.lat, lon: c.lon, on: false }));
      // Sin respuesta mía: el lugar correcto va como punto amarillo
      return myAns || !item ? pts : [...pts, { lat: item.lat, lon: item.lon, on: true }];
    }
    return myAns && tl.phase === 'question' ? [{ lat: myAns.lat, lon: myAns.lon, on: true }] : null;
  }, [revealed, others, myAns, item, tl.phase]);
  const bounds = useMemo(() => (revealed && item ? revealBounds({ lat: item.lat, lon: item.lon }, others, myAns ?? null) : null), [revealed, item, others, myAns]);
  const pinLabels = useMemo(() => (item ? { you: t('game_yourAnswer'), correct: correctPinLabel({ city: item, inside: target?.inside }, t as never, itemTitle(item, locale)) } : null), [item, target, t, locale]);

  // Puesto: cambio frente a la ronda anterior
  const me = state.players.find((p) => p.me) ?? null;
  const prevRank = useRef<{ round: number; rank: number } | null>(null);
  const [rankDelta, setRankDelta] = useState(0);
  useEffect(() => {
    if (!revealed || !me) return;
    if (prevRank.current && prevRank.current.round < tl.round) setRankDelta(prevRank.current.rank - me.rank);
    if (!prevRank.current || prevRank.current.round < tl.round) prevRank.current = { round: tl.round, rank: me.rank };
  }, [revealed, tl.round, me]);

  // Sonido del resultado al revelar
  const soundedRound = useRef(0);
  useEffect(() => {
    if (!revealed || soundedRound.current === tl.round || !isPlayer) return;
    soundedRound.current = tl.round;
    const b = myAns?.result?.base;
    if (b == null) playTimeExpired();
    else if (b >= 950) playPerfect();
    else if (b >= 800) playGood();
    else if (b >= 400) playMedium();
    else playBad();
  }, [revealed, tl.round, myAns, isPlayer]);

  const confirmExit = () => { playButtonTap(); if (window.confirm(t('room_exitConfirm'))) onExit(); };
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());
  const total = me?.total ?? 0;

  // ── Cuenta regresiva ──
  if (tl.phase === 'countdown') {
    return (
      <div className="fixed inset-0 z-40 game-bg flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="font-black text-3xl sm:text-4xl">{t('room_getReady')}</p>
        <div className="relative w-[min(48vw,40dvh,14rem)] aspect-square rounded-full border-4 border-primary flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.4)]">
          <span key={secsLeft} className="font-black text-[min(30vw,24dvh,8rem)] text-primary leading-none animate-score-pop">{secsLeft}</span>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">{t('room_countdownInfo', { n: s.rounds_total, s: s.seconds, players: state.player_count })}</p>
      </div>
    );
  }

  const clickable = tl.phase === 'question' && isPlayer && !myAns;
  const answeredLine = t('room_answered', { n: state.answered_count, total: state.player_count });
  const timeFrac = tl.phase === 'question' ? Math.max(0, Math.min(1, (tl.closesAt - now) / (s.seconds * 1000))) : 0;
  const nextIn = Math.max(0, Math.ceil((tl.opensAt + (s.seconds + s.reveal) * 1000 - now) / 1000));
  const top = state.players.slice(0, 5);

  return (
    <div className="fixed inset-0 z-40 h-[100dvh] min-h-0 overflow-hidden game-bg flex flex-col" role="main" aria-label={t('room_lobbyTitle')} data-game-container>
      {isPortraitMobile && <RotateOverlay t={t as never} beforeCountdown={false} onBack={onExit} />}

      {/* Encabezado: ronda, pregunta, reloj, respuestas y mis puntos */}
      <header className="shrink-0 bg-brand-navy-deep border-b-2 border-accent/50 px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3" style={{ paddingTop: 'max(0.375rem, var(--sat))', paddingLeft: 'max(0.5rem, var(--sal))', paddingRight: 'max(0.5rem, var(--sar))' }}>
        <span className="shrink-0 rounded-full border border-accent/50 px-2.5 py-0.5 text-[11px] sm:text-xs font-black text-accent whitespace-nowrap">📡 {tl.round}/{s.rounds_total}</span>
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {item && isFlag(item) && <Flag country={item.name} className="w-10 sm:w-14 shrink-0 rounded shadow" />}
          {item && isMonument(item) && itemPhotoUrl(item, 'sm') && <img src={itemPhotoUrl(item, 'sm')!} alt="" className="w-10 h-8 sm:w-14 sm:h-10 object-cover rounded-md shrink-0" />}
          <p className="min-w-0 leading-tight">
            <span className="block text-[10px] sm:text-xs text-muted-foreground font-semibold">{item && isFlag(item) ? t('flag_whichCountry') : t('game_whereIsLead')}</span>
            <span className="block font-black text-base sm:text-xl truncate">{item ? (isFlag(item) ? (tl.phase === 'question' ? '' : itemTitle(item, locale)) : `${itemTitle(item, locale)}?`) : '…'}</span>
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-0.5 min-w-[4.5rem]">
          {tl.phase === 'question'
            ? <span className={`font-black text-lg sm:text-2xl tabular-nums ${secsLeft <= 3 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>⏱ {secsLeft} s</span>
            : <span className="font-bold text-xs sm:text-sm text-accent">{tl.phase === 'finished' ? '' : t('room_nextIn', { s: nextIn })}</span>}
          <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{answeredLine}</span>
        </div>
        {isPlayer && <span className="shrink-0 rounded-xl border border-primary/50 px-2 py-0.5 text-center"><span className="block text-[9px] sm:text-[10px] text-muted-foreground uppercase">{t('game_points')}</span><span className="block font-black text-sm sm:text-lg text-primary tabular-nums">{fmt(total)}</span></span>}
        <HudIconButton icon="close" label={t('room_exit')} onClick={confirmExit} size="sm" />
      </header>
      {tl.phase === 'question' && <div className="shrink-0 h-1.5 bg-muted/50"><div className={`h-full transition-[width] duration-200 ${secsLeft <= 3 ? 'bg-destructive' : 'bg-accent'}`} style={{ width: `${timeFrac * 100}%` }} /></div>}

      <div className="relative flex-1 min-h-0">
        <WorldMapCanvas
          onMapClick={onMapClick}
          clickDisabled={!clickable}
          userClick={userClick}
          correctLocation={correct}
          distanceKm={revealed && myAns?.result && !target?.inside ? Number(myAns.result.km ?? 0) : null}
          gameMode={s.mode}
          viewBounds={bounds}
          pinLabels={revealed ? pinLabels : null}
          highlightCountry={revealed && item && isFlag(item) ? item.name : null}
          highlightShape={highlightShape}
          markers={markers}
          showZoomControls={tl.phase === 'question'}
          labelAvoid={revealed ? { right: 0.36 } : null}
        />

        {/* Pregunta abierta: aviso para tocar o "respuesta enviada" con el contador */}
        {tl.phase === 'question' && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 rounded-full border border-accent/50 px-4 py-1.5 text-xs sm:text-sm font-bold whitespace-nowrap pointer-events-none" style={{ background: 'hsl(var(--brand-navy-deep) / 0.88)' }}>
            {!isPlayer ? `👀 ${t('room_presenting')} · ${answeredLine}`
              : myAns ? `✓ ${t('room_sent', { s: myAns.time.toLocaleString(appNumberLocale(), { maximumFractionDigits: 1 }) })} · ${answeredLine}`
              : t('game_tapToAnswer')}
          </div>
        )}

        {/* Revelación: mi resultado, mi puesto y el top 5 */}
        {tl.phase === 'reveal' && (
          <aside className="absolute z-10 right-2 top-2 bottom-2 w-[clamp(15rem,34vw,22rem)] rounded-3xl border-2 border-accent/40 bg-card/92 backdrop-blur-md p-3 sm:p-4 short:p-2 flex flex-col gap-2 short:gap-1 overflow-y-auto animate-slide-in-right" aria-live="polite">
            {item && (
              <p className="leading-tight">
                <span className="block font-black text-lg sm:text-xl short:text-base truncate">{itemTitle(item, locale)}</span>
                <span className="block text-xs sm:text-sm text-muted-foreground truncate">{itemSubtitle(item, locale)}</span>
              </p>
            )}
            {isPlayer && (
              myAns?.result ? (
                <div className="rounded-2xl border border-primary/50 bg-primary/10 px-3 py-2 short:py-1 flex items-center justify-between gap-2">
                  <span className="font-black text-2xl text-primary tabular-nums">+{fmt(myAns.result.points)}</span>
                  <span className="text-right text-xs sm:text-sm leading-tight">
                    <span className="block font-bold">{target?.inside ? t('flag_insideShort') : formatDistance(Number(myAns.result.km ?? 0))}</span>
                    <span className="block text-muted-foreground">{myAns.result.time_s.toLocaleString(appNumberLocale(), { maximumFractionDigits: 1 })} s{myAns.result.combo >= 2 ? ` · 🔥 ×${myAns.result.combo_mult.toLocaleString(appNumberLocale())}` : ''}</span>
                  </span>
                </div>
              ) : (
                <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 font-bold text-sm text-center">{myAns?.late ? t('room_late') : myAns ? '…' : t('room_noAnswer')}</p>
              )
            )}
            {me && (
              <p className="text-sm font-bold text-center">
                {t('room_yourPlace', { n: me.rank, total: state.player_count })}
                {rankDelta > 0 && <span className="ml-1.5 text-accent">↑{rankDelta}</span>}
                {rankDelta < 0 && <span className="ml-1.5 text-destructive">↓{-rankDelta}</span>}
              </p>
            )}
            <ol className="flex flex-col gap-1">
              {top.map((p) => (
                <li key={p.slot} className={`flex items-center gap-2 rounded-xl px-2 py-1 short:py-0 text-sm short:text-xs ${p.me ? 'bg-primary/15 border border-primary/50' : 'bg-background/40'}`}>
                  <span className="w-5 text-center font-black text-muted-foreground">{p.rank}</span>
                  <PlayerFace player={p} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                  <span className="font-black tabular-nums">{fmt(p.total)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-auto text-center text-xs text-muted-foreground">{tl.round < s.rounds_total ? t('room_nextIn', { s: nextIn }) : t('room_resultsIn', { s: nextIn })}</p>
          </aside>
        )}
      </div>

      {/* Pie solo con el PIN (por si alguien llega tarde a mirar) */}
      <p className="sr-only">{t('room_pinLabel', { pin: formatPin(state.pin) })}</p>
    </div>
  );
}
