import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import type { City, MapBounds } from '@/data/cities';
import { correctPinLabel, isFlag, isMonument, itemPhotoUrl, itemSubtitle, itemTitle, usesShapeFile, CATEGORY_ART, CATEGORY_KEY } from '@/lib/catalog';
import { cityById } from '@/lib/itemMemory';
import { countryDistance } from '@/lib/flagScoring';
import { featureDistance } from '@/lib/featureScoring';
import { useFeatureShapes, usePackShapes } from '@/hooks/useFeatureShapes';
import { formatDistance } from '@/lib/gameUtils';
import { appNumberLocale } from '@/lib/format';
import { trackEvent } from '@/lib/analytics';
import { REGION_ART, DIFF_ART } from '@/lib/selectionArt';
import { normalizePin, roomLink, roomTimeline, serverNow, useRoomState, type RoomState } from '@/lib/rooms';
import WorldMapCanvas from '@/components/game/WorldMapCanvas';
import Mascot from '@/components/game/Mascot';
import { PlayerFace, formatPin } from '@/components/game/RoomParts';
import Wordmark from '@/components/ui/Wordmark';
import QrCode from '@/components/ui/QrCode';
import Flag from '@/components/ui/Flag';

/**
 * Pantalla para proyectar la sala en vivo (bloque S4, `/sala/:pin/tv`): en un computador conectado al TV o al
 * proyector, sin cuenta y sin responder. Espera con PIN y QR, cuenta regresiva, la pregunta con reloj y contador, la
 * revelación con los toques de todos y el top 10, y el podio. Si el anfitrión arma otra ronda, la sigue sola.
 */
export default function RoomTv() {
  const { t, locale } = useI18n();
  const params = useParams<{ pin: string }>();
  const [pin, setPin] = useState(() => normalizePin(params.pin ?? ''));
  const { state, error, refresh } = useRoomState({ pin });
  const [now, setNow] = useState(serverNow);
  useEffect(() => { const id = setInterval(() => setNow(serverNow()), 250); return () => clearInterval(id); }, []);
  useEffect(() => { trackEvent('room_tv_open', {}); }, []);
  useEffect(() => { document.title = `GeoSpeed · ${t('room_historyName')}`; }, [t]);
  // Otra ronda: la sala nueva tiene otro PIN
  useEffect(() => { if (state?.next_room?.pin && state.next_room.pin !== pin) setPin(state.next_room.pin); }, [state?.next_room, pin]);

  const tl = state ? roomTimeline(state, now) : null;
  // Los toques de todos llegan con la consulta de después del cierre (incluye el margen de 1 s)
  const lastKey = useRef('');
  useEffect(() => {
    if (!tl) return;
    const key = `${tl.phase}:${tl.round}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    if (tl.phase === 'reveal') { const id = setTimeout(() => void refresh(), 1200); return () => clearTimeout(id); }
    if (tl.phase === 'question' || tl.phase === 'finished') void refresh();
  }, [tl?.phase, tl?.round, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state || !tl) {
    return (
      <Shell pin={pin}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <Mascot state={error ? 'sad' : 'idle'} className="w-[min(18vw,22vh)]" />
          <p className="font-black text-[clamp(1.5rem,3vw,3rem)]">{error ? t('room_err_unavailable') : t('loading')}</p>
        </div>
      </Shell>
    );
  }
  if (state.status === 'cancelled') {
    return <Shell pin={pin}><div className="flex-1 flex items-center justify-center"><p className="font-black text-[clamp(1.5rem,3vw,3rem)]">{t('room_cancelled')}</p></div></Shell>;
  }
  if (tl.phase === 'lobby') return <TvLobby state={state} />;
  if (tl.phase === 'countdown') {
    const n = Math.max(1, Math.ceil((tl.opensAt - now) / 1000));
    return (
      <Shell pin={state.pin}>
        <div className="flex-1 flex flex-col items-center justify-center gap-[3vh]">
          <p className="font-black text-[clamp(2rem,5vw,5rem)]">{t('room_getReady')}</p>
          <div className="w-[min(32vw,42vh)] aspect-square rounded-full border-[0.6vw] border-primary flex items-center justify-center shadow-[0_0_60px_hsl(var(--primary)/0.45)]">
            <span key={n} className="font-black text-[min(20vw,26vh)] leading-none text-primary animate-score-pop">{n}</span>
          </div>
          <p className="text-[clamp(1rem,1.8vw,1.8rem)] text-muted-foreground">{t('room_countdownInfo', { n: state.settings.rounds_total, s: state.settings.seconds, players: state.player_count })}</p>
        </div>
      </Shell>
    );
  }
  if (tl.phase === 'finished' || state.status === 'finished') return <TvFinal state={state} />;
  return <TvRound state={state} phase={tl.phase} round={tl.round} closesAt={tl.closesAt} opensAt={tl.opensAt} now={now} locale={locale} />;
}

// ═══════════════════════════ Espera ═══════════════════════════
function TvLobby({ state }: { state: RoomState }) {
  const { t } = useI18n();
  const link = roomLink(state.pin);
  const s = state.settings;
  const cap = s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1);
  return (
    <Shell pin={state.pin} hidePin>
      <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-[2.5vw] items-stretch">
        <section className="rounded-[2vw] border-4 border-primary/60 bg-card/85 p-[2vw] flex flex-col items-center justify-center gap-[1.6vh] text-center">
          <p className="text-[clamp(1rem,1.7vw,1.9rem)] font-bold">{t('room_tvJoinAt')}</p>
          <p className="text-[clamp(1.1rem,2vw,2.3rem)] font-black text-accent break-all">{link.replace(/^https?:\/\//, '').replace(/\/sala\/\d+$/, '')}</p>
          <p className="text-[clamp(0.9rem,1.4vw,1.5rem)] text-muted-foreground">{t('room_tvPinThen')}</p>
          <p className="font-black text-primary tracking-[0.1em] leading-none text-[min(9vw,15vh)] tabular-nums">{formatPin(state.pin)}</p>
          <QrCode text={link} label={t('room_tvQr')} className="w-[min(18vw,30vh)]" />
          <p className="text-[clamp(0.8rem,1.1vw,1.2rem)] text-muted-foreground">{t('room_tvQr')}</p>
        </section>
        <section className="rounded-[2vw] border-4 border-accent/50 bg-card/85 p-[2vw] flex flex-col gap-[1.6vh] min-h-0">
          <div className="flex items-center justify-between gap-4">
            <p className="font-black text-[clamp(1.4rem,2.6vw,3rem)]">{t('room_players')}</p>
            <span className="rounded-full border-2 border-accent/60 px-[1.2vw] py-[0.4vh] font-black text-accent text-[clamp(1.1rem,2vw,2.4rem)] tabular-nums">{state.player_count}/{s.max_players}</span>
          </div>
          <ul className="grid grid-cols-3 xl:grid-cols-4 gap-[0.8vw] content-start min-h-0 overflow-hidden flex-1">
            {state.players.map((p) => (
              <li key={p.slot} className="flex items-center gap-[0.6vw] rounded-[1vw] border-2 border-accent/30 bg-background/40 px-[0.7vw] py-[0.8vh] animate-fade-in min-w-0">
                <PlayerFace player={p} />
                <span className="truncate font-bold text-[clamp(0.85rem,1.3vw,1.6rem)]">{p.name}</span>
              </li>
            ))}
          </ul>
          <p className="flex flex-wrap gap-[0.6vw] text-[clamp(0.85rem,1.2vw,1.4rem)]">
            {[`${CATEGORY_ART[s.category].emoji} ${t(CATEGORY_KEY[s.category] as never)}`, `${REGION_ART[s.mode].emoji} ${t(`mode_${s.mode}` as never)}`,
              `${DIFF_ART[s.difficulty].emoji} ${t(`home_diff${cap}` as never)}`, t('room_roundsShort', { n: s.rounds_total }), `⏱ ${s.seconds} s`].map((x) => (
              <span key={x} className="rounded-full border border-accent/40 bg-background/40 px-[0.9vw] py-[0.3vh] font-semibold">{x}</span>
            ))}
          </p>
          <p className="text-center font-bold text-[clamp(1rem,1.8vw,2rem)] animate-pulse">⏳ {t('room_waitingHost', { name: state.host_name ?? '' })}</p>
        </section>
      </div>
    </Shell>
  );
}

// ═══════════════════════════ Pregunta y revelación ═══════════════════════════
function TvRound({ state, phase, round, closesAt, opensAt, now, locale }: { state: RoomState; phase: string; round: number; closesAt: number; opensAt: number; now: number; locale: string }) {
  const { t } = useI18n();
  const s = state.settings;
  const raw = state.items.find((i) => i.n === round) ?? null;
  const item: City | null = useMemo(() => {
    if (!raw) return null;
    const c = cityById(raw.id);
    return c ? { ...c, lat: raw.lat ?? c.lat, lon: raw.lon ?? c.lon } : { id: raw.id, kind: raw.kind as City['kind'], name: raw.name, country: raw.country ?? '', lat: raw.lat ?? 0, lon: raw.lon ?? 0, difficulty: s.difficulty };
  }, [raw?.id, raw?.lat]); // eslint-disable-line react-hooks/exhaustive-deps
  const revealed = phase === 'reveal' && state.reveal?.round === round && raw?.lat != null;
  const clicks = useMemo(() => (revealed ? state.reveal?.clicks ?? [] : []), [revealed, state.reveal]);
  const best = clicks[0] ?? null; // el servidor las ordena por puntos

  const featureShapes = useFeatureShapes(item?.kind === 'feature');
  const packShapes = usePackShapes(item?.kind === 'division' ? item.id ?? null : null);
  const highlightShape = useMemo(() => {
    if (!revealed || !item?.id || (item.kind !== 'feature' && item.kind !== 'division')) return null;
    return (item.kind === 'division' ? packShapes : featureShapes)?.[item.id] ?? null;
  }, [revealed, item, featureShapes, packShapes]);
  // La línea va del toque del mejor jugador al lugar (al borde más cercano en banderas y lugares)
  const target = useMemo(() => {
    if (!revealed || !item) return null;
    if (best) {
      const hit = isFlag(item) ? countryDistance(item.name, best.lat, best.lon) : usesShapeFile(item) ? featureDistance(item, best.lat, best.lon) : null;
      if (hit) return { lat: hit.nearest.lat, lon: hit.nearest.lon, inside: hit.inside };
    }
    return { lat: item.lat, lon: item.lon, inside: false };
  }, [revealed, item, best]);
  const userClick = useMemo(() => (best ? { lat: best.lat, lon: best.lon } : null), [best]);
  const correct = useMemo(() => (best && target ? { lat: target.lat, lon: target.lon } : null), [best, target]);
  const markers = useMemo(() => {
    if (!revealed) return null;
    const pts = clicks.slice(1).map((c) => ({ lat: c.lat, lon: c.lon, on: false }));
    return best || !item ? pts : [{ lat: item.lat, lon: item.lon, on: true }];
  }, [revealed, clicks, best, item]);
  const bounds = useMemo<MapBounds | null>(() => {
    if (!revealed || !item) return null;
    const near = clicks.filter((c) => Math.abs(c.lat - item.lat) < 35 && Math.abs(c.lon - item.lon) < 50);
    const pts = [{ lat: item.lat, lon: item.lon }, ...near];
    const lats = pts.map((p) => p.lat), lons = pts.map((p) => p.lon);
    const latMin = Math.min(...lats), latMax = Math.max(...lats), lonMin = Math.min(...lons), lonMax = Math.max(...lons);
    if (lonMax - lonMin > 150 || latMax - latMin > 90) return null;
    const pad = Math.max(3, Math.max(latMax - latMin, lonMax - lonMin) * 0.35);
    const cLat = (latMin + latMax) / 2, cLon = (lonMin + lonMax) / 2;
    const hLat = Math.max((latMax - latMin) / 2 + pad, 6), hLon = Math.max((lonMax - lonMin) / 2 + pad, 10);
    return { latMin: Math.max(-62, cLat - hLat), latMax: Math.min(85, cLat + hLat), lonMin: Math.max(-180, cLon - hLon), lonMax: Math.min(180, cLon + hLon) };
  }, [revealed, item, clicks]);
  const pinLabels = useMemo(() => (item && best ? { you: best.name, correct: correctPinLabel({ city: item, inside: target?.inside }, t as never, itemTitle(item, locale)) } : null), [item, best, target, t, locale]);

  const secsLeft = Math.max(0, Math.ceil((closesAt - now) / 1000));
  const frac = phase === 'question' ? Math.max(0, Math.min(1, (closesAt - now) / (s.seconds * 1000))) : 0;
  const nextIn = Math.max(0, Math.ceil((opensAt + (s.seconds + s.reveal) * 1000 - now) / 1000));
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());
  const photo = item && isMonument(item) ? itemPhotoUrl(item, 'lg') : null;

  return (
    <Shell pin={state.pin}>
      {/* La pregunta, el reloj y las respuestas */}
      <div className="shrink-0 flex items-center gap-[2vw] rounded-[1.5vw] border-2 border-accent/50 bg-card/85 px-[2vw] py-[1.4vh]">
        <span className="shrink-0 rounded-full border-2 border-accent/60 px-[1vw] py-[0.4vh] font-black text-accent text-[clamp(1rem,1.8vw,2.2rem)]">📡 {round}/{s.rounds_total}</span>
        {item && isFlag(item) && <Flag country={item.name} className="w-[9vw] shrink-0 rounded-lg shadow-lg" />}
        {photo && <img src={photo} alt="" className="h-[11vh] aspect-[4/3] object-cover rounded-xl shrink-0" />}
        <p className="min-w-0 flex-1 leading-tight">
          <span className="block text-[clamp(0.9rem,1.5vw,1.8rem)] text-muted-foreground font-bold">{item && isFlag(item) ? t('flag_whichCountry') : t('game_whereIs')}</span>
          <span className="block font-black text-[clamp(1.6rem,3.6vw,4.4rem)] truncate">{item ? (isFlag(item) && phase === 'question' ? '' : itemTitle(item, locale)) : '…'}</span>
        </p>
        {phase === 'question' ? (
          <span className={`shrink-0 font-black tabular-nums text-[clamp(2rem,5vw,6rem)] leading-none ${secsLeft <= 3 ? 'text-destructive animate-pulse' : 'text-primary'}`}>{secsLeft}</span>
        ) : (
          <span className="shrink-0 font-bold text-accent text-[clamp(1rem,1.8vw,2rem)]">{round < s.rounds_total ? t('room_nextIn', { s: nextIn }) : t('room_resultsIn', { s: nextIn })}</span>
        )}
        <span className="shrink-0 text-right">
          <span className="block font-black text-[clamp(1.4rem,3vw,3.6rem)] tabular-nums leading-none">{state.answered_count}/{state.player_count}</span>
          <span className="block text-[clamp(0.8rem,1.2vw,1.4rem)] text-muted-foreground">{t('room_tvAnswered')}</span>
        </span>
      </div>
      {phase === 'question' && <div className="shrink-0 h-[1vh] rounded-full bg-muted/50 overflow-hidden"><div className={`h-full transition-[width] duration-200 ${secsLeft <= 3 ? 'bg-destructive' : 'bg-accent'}`} style={{ width: `${frac * 100}%` }} /></div>}

      <div className="flex-1 min-h-0 grid gap-[1.5vw]" style={{ gridTemplateColumns: phase === 'reveal' ? 'minmax(0,1fr) minmax(0,0.42fr)' : 'minmax(0,1fr)' }}>
        <div className="relative min-h-0 rounded-[1.5vw] overflow-hidden border-2 border-accent/40">
          <WorldMapCanvas
            onMapClick={() => {}}
            clickDisabled
            userClick={revealed ? userClick : null}
            correctLocation={revealed ? correct : null}
            distanceKm={revealed && best && !target?.inside ? Number(best.km ?? 0) : null}
            gameMode={s.mode}
            viewBounds={bounds}
            pinLabels={revealed ? pinLabels : null}
            highlightCountry={revealed && item && isFlag(item) ? item.name : null}
            highlightShape={highlightShape}
            markers={markers}
            showZoomControls={false}
          />
        </div>
        {phase === 'reveal' && (
          <aside className="min-h-0 rounded-[1.5vw] border-2 border-accent/40 bg-card/90 p-[1.2vw] flex flex-col gap-[1vh] overflow-hidden animate-slide-in-right">
            {item && (
              <p className="leading-tight">
                <span className="block font-black text-[clamp(1.2rem,2.2vw,2.8rem)] truncate">{itemTitle(item, locale)}</span>
                <span className="block text-[clamp(0.8rem,1.2vw,1.4rem)] text-muted-foreground truncate">{itemSubtitle(item, locale)}</span>
              </p>
            )}
            {best ? (
              <p className="rounded-[1vw] border-2 border-primary/50 bg-primary/10 px-[1vw] py-[0.8vh] font-bold text-[clamp(0.9rem,1.4vw,1.7rem)]">
                🎯 {t('room_tvClosest', { name: best.name, km: target?.inside ? t('flag_insideShort') : formatDistance(Number(best.km ?? 0)) })}
              </p>
            ) : (
              <p className="rounded-[1vw] border border-border bg-muted/30 px-[1vw] py-[0.8vh] font-bold text-center text-[clamp(0.9rem,1.4vw,1.7rem)]">{t('room_tvNobody')}</p>
            )}
            <ol className="flex flex-col gap-[0.5vh] min-h-0 overflow-hidden">
              {state.players.slice(0, 10).map((p) => (
                <li key={p.slot} className="flex items-center gap-[0.6vw] rounded-[0.8vw] bg-background/40 px-[0.6vw] py-[0.3vh] text-[clamp(0.85rem,1.3vw,1.6rem)]">
                  <span className="w-[2vw] text-center font-black text-muted-foreground">{p.rank}</span>
                  <PlayerFace player={p} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                  <span className="font-black tabular-nums">{fmt(p.total)}</span>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </Shell>
  );
}

// ═══════════════════════════ Podio ═══════════════════════════
function TvFinal({ state }: { state: RoomState }) {
  const { t } = useI18n();
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());
  const podium = state.players.slice(0, 3);
  const order = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;
  const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉');
  return (
    <Shell pin={state.pin}>
      <h1 className="shrink-0 text-center font-black text-[clamp(2rem,4.5vw,5.5rem)]">{t('room_finalTitle')} <span className="text-primary">{t('room_finalTitleTail')}</span></h1>
      <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-[2vw]">
        <section className="rounded-[2vw] border-4 border-primary/60 bg-card/85 p-[2vw] flex items-end justify-center gap-[2vw]">
          {order.map((p) => (
            <div key={p.slot} className={`flex flex-col items-center gap-[1vh] text-center w-1/3 min-w-0 ${p.rank === 1 ? 'animate-score-pop' : ''}`}>
              <span className="text-[min(6vw,9vh)] leading-none" aria-hidden>{medal(p.rank)}</span>
              <span className="scale-150 my-[1.5vh]"><PlayerFace player={p} size="lg" /></span>
              <span className="block w-full truncate font-black text-[clamp(1.1rem,2.2vw,2.8rem)]">{p.name}</span>
              <span className="font-black tabular-nums text-primary text-[clamp(1.1rem,2.2vw,2.8rem)]">{fmt(p.total)}</span>
              <span className={`w-full rounded-t-[1vw] bg-gradient-to-t from-accent/10 to-accent/45 ${p.rank === 1 ? 'h-[20vh]' : p.rank === 2 ? 'h-[14vh]' : 'h-[9vh]'}`} aria-hidden />
            </div>
          ))}
        </section>
        <section className="rounded-[2vw] border-4 border-accent/50 bg-card/85 p-[1.5vw] min-h-0 overflow-hidden">
          <ol className="flex flex-col gap-[0.6vh]">
            {state.players.slice(0, 10).map((p) => (
              <li key={p.slot} className="flex items-center gap-[0.8vw] rounded-[0.8vw] bg-background/40 px-[0.8vw] py-[0.5vh] text-[clamp(0.9rem,1.5vw,1.9rem)]">
                <span className="w-[2.4vw] text-center font-black text-muted-foreground">{p.rank}</span>
                <PlayerFace player={p} />
                <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                <span className="text-muted-foreground whitespace-nowrap">🎯 {p.hits}</span>
                <span className="font-black tabular-nums">{fmt(p.total)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <p className="shrink-0 text-center text-[clamp(0.9rem,1.5vw,1.8rem)] text-muted-foreground">{t('room_tvThanks')}</p>
    </Shell>
  );
}

/** Marco común: logo, "Sala en vivo" y el PIN pequeño (para quien llega tarde a mirar) */
function Shell({ pin, hidePin = false, children }: { pin: string; hidePin?: boolean; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="h-[100dvh] w-full overflow-hidden game-bg flex flex-col gap-[1.6vh] px-[2.5vw] py-[2vh]">
      <header className="shrink-0 flex items-center justify-between gap-4">
        <span className="flex items-center gap-[1vw]">
          <img src="/mascot/explorer-logo.webp" alt="" className="h-[clamp(2rem,5vh,4rem)]" />
          <Wordmark size="custom" className="text-[clamp(1.4rem,2.6vw,3rem)]" />
          <span className="rounded-full border-2 border-primary/60 px-[1vw] py-[0.3vh] font-black text-primary text-[clamp(0.9rem,1.4vw,1.6rem)]">📡 {t('room_lobbyTitle')} {t('room_lobbyTitleTail')}</span>
        </span>
        {!hidePin && pin && <span className="font-bold text-muted-foreground text-[clamp(0.9rem,1.4vw,1.7rem)]">{t('room_pinLabel', { pin: formatPin(pin) })}</span>}
      </header>
      {children}
    </div>
  );
}
