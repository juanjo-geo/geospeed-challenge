import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { MODE_CONFIG, isPackMode, type Difficulty, type GameMode } from '@/data/cities';
import { CATEGORY_ART, CATEGORY_KEY, categoriesForMode, categoryForMode, type Category } from '@/lib/catalog';
import { REGION_ART, DIFF_ART, DIFF_ORDER, REGION_FLAG } from '@/lib/selectionArt';
import { isProPack } from '@/lib/packAccess';
import { isPro } from '@/lib/premiumSystem';
import { playButtonTap, playShareSuccess, playVictory } from '@/lib/sounds';
import { fireCelebration } from '@/lib/confetti';
import { trackEvent } from '@/lib/analytics';
import {
  ROOM_MAX_PLAYERS, ROOM_NAME_MIN, ROOM_ROUNDS, ROOM_SECONDS, RoomError, cancelRoom, cleanRoomName, createRoom, fetchRoomState,
  joinRoom, kickFromRoom, leaveRoom, rematchRoom, roomLink, roomTvLink, roomsMockEnabled, saveRoomName, savedRoomName, startRoom, useRoomState,
  type RoomErrorCode, type RoomPlayer, type RoomSettings, type RoomState,
} from '@/lib/rooms';
import ScreenHeader from '@/components/ui/ScreenHeader';
import QrCode from '@/components/ui/QrCode';
import { ChevronIcon } from '@/components/ui/icons';
import SelectorSheet, { type SelectorOption } from './SelectorSheet';
import Mascot from './Mascot';
import { PlayerFace, formatPin } from './RoomParts';
import { appNumberLocale } from '@/lib/format';

const RoomGame = lazy(() => import('./RoomGame'));

/** Texto de un error de la sala */
function useRoomErrorText() {
  const { t } = useI18n();
  return useCallback((code: RoomErrorCode | null | undefined) => (code ? t(`room_err_${code}` as never) : ''), [t]);
}

// ═══════════════════════════════════════ Crear sala ═══════════════════════════════════════
interface RoomCreateScreenProps {
  initialMode: GameMode;
  initialDifficulty: Difficulty;
  initialCategory: Category;
  /** Cuenta registrada (los invitados pueden unirse, no crear) */
  isRegistered: boolean;
  defaultName: string;
  onBack: () => void;
  onCreated: (s: RoomState) => void;
  onSignIn: () => void;
}

export function RoomCreateScreen({ initialMode, initialDifficulty, initialCategory, isRegistered, defaultName, onBack, onCreated, onSignIn }: RoomCreateScreenProps) {
  const { t } = useI18n();
  const errText = useRoomErrorText();
  const pro = isPro();
  const [mode, setMode] = useState<GameMode>(() => (isProPack(initialMode) && !pro ? 'world' : initialMode));
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [category, setCategory] = useState<Category>(() => categoryForMode(initialCategory, isProPack(initialMode) && !pro ? 'world' : initialMode));
  const [rounds, setRounds] = useState<number>(10);
  const [seconds, setSeconds] = useState<number>(15);
  const [hostPlays, setHostPlays] = useState(true);
  const [sheet, setSheet] = useState<null | 'region' | 'difficulty' | 'category'>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<RoomErrorCode | null>(null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const regionOptions: SelectorOption<GameMode>[] = useMemo(() => MODE_CONFIG.filter((m) => pro || !isProPack(m.key)).map((m) => ({
    key: m.key, emoji: REGION_ART[m.key].emoji, art: REGION_ART[m.key].art,
    icon: REGION_FLAG[m.key] ? <img src={REGION_FLAG[m.key]} alt="" className="w-12 short:w-9 aspect-[3/2] object-cover rounded-md ring-1 ring-black/20" /> : undefined,
    label: t(`mode_${m.key}` as never) || m.label, desc: t(`region_desc_${m.key}` as never),
  })), [t, pro]);
  const difficultyOptions: SelectorOption<Difficulty>[] = useMemo(() => DIFF_ORDER.map((d) => {
    const cap = d.charAt(0).toUpperCase() + d.slice(1);
    return { key: d, emoji: DIFF_ART[d].emoji, art: DIFF_ART[d].art, label: t(`home_diff${cap}` as never), desc: t(`home_diff${cap}Desc` as never) };
  }), [t]);
  const categoryOptions: SelectorOption<Category>[] = useMemo(() => categoriesForMode(mode).map((c) => ({
    key: c, emoji: CATEGORY_ART[c].emoji, art: CATEGORY_ART[c].art, label: t(CATEGORY_KEY[c] as never), desc: t((c === 'cities' && isPackMode(mode) ? 'cat_citiesPackDesc' : `${CATEGORY_KEY[c]}Desc`) as never),
  })), [t, mode]);

  const create = async () => {
    if (creating) return;
    playButtonTap();
    setCreating(true);
    setError(null);
    try {
      const s = await createRoom({ mode, difficulty, category, rounds, seconds, hostPlays, requestId });
      setRequestId(crypto.randomUUID());
      trackEvent('room_create', { mode, category, rounds, seconds, host_plays: hostPlays });
      onCreated(s);
    } catch (e) {
      setError(e instanceof RoomError ? e.code : 'network');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-3xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('room_createTitle')} subtitle={t('room_createSubtitle')} />

        {!isRegistered && !roomsMockEnabled() ? (
          <section className="rounded-3xl border-2 border-accent/50 bg-card/80 p-5 text-center flex flex-col items-center gap-3">
            <Mascot state="wink" className="w-20" />
            <p className="font-extrabold text-lg sm:text-xl">{t('room_accountTitle')}</p>
            <p className="text-sm sm:text-base text-foreground/80 max-w-md">{t('room_accountDesc')}</p>
            <button onClick={() => { playButtonTap(); onSignIn(); }} className="btn3d rounded-2xl px-6 py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
              {t('room_accountCta')}
            </button>
          </section>
        ) : (
          <section className="rounded-3xl border-2 border-accent/50 bg-card/80 p-4 sm:p-5 flex flex-col gap-4 shadow-[0_0_20px_hsl(var(--accent)/0.12)]">
            <div className="grid grid-cols-3 gap-2">
              <PickButton label={t('ch_category')} emoji={CATEGORY_ART[category].emoji} value={t(CATEGORY_KEY[category] as never)} onClick={() => { playButtonTap(); setSheet('category'); }} />
              <PickButton label={t('ch_region')} emoji={REGION_FLAG[mode] ? <img src={REGION_FLAG[mode]} alt="" className="w-6 aspect-[3/2] object-cover rounded-[3px] ring-1 ring-black/20" /> : REGION_ART[mode].emoji} value={regionOptions.find((o) => o.key === mode)?.label ?? mode} onClick={() => { playButtonTap(); setSheet('region'); }} />
              <PickButton label={t('ch_difficulty')} emoji={DIFF_ART[difficulty].emoji} value={difficultyOptions.find((o) => o.key === difficulty)?.label ?? difficulty} onClick={() => { playButtonTap(); setSheet('difficulty'); }} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Chips label={t('room_rounds')} options={ROOM_ROUNDS.map((n) => ({ key: n, label: String(n) }))} value={rounds} onChange={setRounds} />
              <Chips label={t('room_seconds')} options={ROOM_SECONDS.map((n) => ({ key: n, label: `${n} s` }))} value={seconds} onChange={setSeconds} />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-background/40 px-4 py-3 cursor-pointer">
              <span className="min-w-0">
                <span className="block font-bold">{t('room_hostPlays')}</span>
                <span className="block text-xs sm:text-sm text-muted-foreground">{hostPlays ? (defaultName ? t('room_hostPlaysOn', { name: defaultName }) : t('room_hostPlaysOnAnon')) : t('room_hostPlaysOff')}</span>
              </span>
              <input type="checkbox" className="sr-only peer" checked={hostPlays} onChange={(e) => { playButtonTap(); setHostPlays(e.target.checked); }} />
              <span className="relative shrink-0 w-14 h-8 rounded-full bg-muted peer-checked:bg-accent transition-colors after:absolute after:top-1 after:left-1 after:w-6 after:h-6 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-6" aria-hidden />
            </label>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">{t('room_createInfo', { n: ROOM_MAX_PLAYERS, min: Math.round((rounds * (seconds + 8) + 5) / 60) })}</p>
            {error && <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-center" role="alert">{errText(error)}</p>}
            <button onClick={create} disabled={creating} className="btn3d w-full rounded-2xl py-3.5 short:py-2.5 font-black text-lg sm:text-xl text-primary-foreground disabled:opacity-60" style={{ background: 'var(--grad-cta)' }}>
              {creating ? '⏳' : '📡'} {t('room_create')}
            </button>
          </section>
        )}
      </div>

      {sheet === 'region' && (
        <SelectorSheet<GameMode> title={t('region_title')} subtitle={t('region_subtitle')} options={regionOptions} selected={mode} confirmLabel={t('region_confirm')}
          onConfirm={(k) => { setMode(k); setCategory((c) => categoryForMode(c, k)); setSheet(null); }} onClose={() => setSheet(null)} closeLabel={t('close')} />
      )}
      {sheet === 'category' && (
        <SelectorSheet<Category> title={t('cat_title')} subtitle={t('cat_subtitle')} options={categoryOptions} selected={category} confirmLabel={t('cat_confirm')}
          onConfirm={(k) => { setCategory(k); setSheet(null); }} onClose={() => setSheet(null)} closeLabel={t('close')} />
      )}
      {sheet === 'difficulty' && (
        <SelectorSheet<Difficulty> title={t('diff_title')} subtitle={t('diff_subtitle')} options={difficultyOptions} selected={difficulty} confirmLabel={t('diff_confirm')}
          onConfirm={(k) => { setDifficulty(k); setSheet(null); }} onClose={() => setSheet(null)} closeLabel={t('close')} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════ Unirse con el PIN ═══════════════════════════════════════
interface RoomJoinScreenProps {
  pin: string;
  defaultName: string;
  onBack: () => void;
  onJoined: (s: RoomState) => void;
}

export function RoomJoinScreen({ pin, defaultName, onBack, onJoined }: RoomJoinScreenProps) {
  const { t } = useI18n();
  const errText = useRoomErrorText();
  const [preview, setPreview] = useState<RoomState | null>(null);
  const [loadError, setLoadError] = useState<RoomErrorCode | null>(null);
  const [name, setName] = useState(() => defaultName || savedRoomName());
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<RoomErrorCode | null>(null);

  useEffect(() => {
    let alive = true;
    fetchRoomState({ pin }).then((s) => {
      if (!alive) return;
      // Ya estoy adentro (volví al link, o la sala la creé yo): directo a la sala
      if (s.i_am_player || s.i_am_host) { onJoined(s); return; }
      setPreview(s);
    }).catch((e) => { if (alive) setLoadError(e instanceof RoomError ? e.code : 'network'); });
    return () => { alive = false; };
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  const join = async () => {
    const n = name.trim();
    if (joining || n.length < ROOM_NAME_MIN) return;
    playButtonTap();
    setJoining(true);
    setError(null);
    try {
      const s = await joinRoom(pin, n);
      saveRoomName(n);
      trackEvent('room_join', { players: s.player_count });
      onJoined(s);
    } catch (e) {
      setError(e instanceof RoomError ? e.code : 'network');
    } finally {
      setJoining(false);
    }
  };

  const started = preview && preview.status !== 'lobby';
  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('room_joinTitle')} subtitle={t('room_pinLabel', { pin: formatPin(pin) })} />
        <section className="rounded-3xl border-2 border-accent/50 bg-card/80 p-5 flex flex-col items-center gap-3 text-center">
          {loadError ? (
            <>
              <Mascot state="sad" className="w-20" />
              <p className="font-extrabold text-lg">{errText(loadError)}</p>
              <BackHome onClick={onBack} />
            </>
          ) : !preview ? (
            <p className="py-8 text-muted-foreground">{t('loading')}</p>
          ) : started ? (
            <>
              <Mascot state="wink" className="w-20" />
              <p className="font-extrabold text-lg">{preview.status === 'playing' ? t('room_err_started') : t('room_err_unavailable')}</p>
              <BackHome onClick={onBack} />
            </>
          ) : (
            <>
              <Mascot state="celebrate" className="w-20" />
              <p className="font-extrabold text-lg sm:text-xl">{t('room_joinHost', { name: preview.host_name ?? '' })}</p>
              <SettingsLine s={preview.settings} />
              <p className="text-sm text-muted-foreground">{t('room_playersCount', { n: preview.player_count, max: preview.settings.max_players })}</p>
              <form className="w-full flex flex-col gap-2.5 mt-1" onSubmit={(e) => { e.preventDefault(); void join(); }}>
                <label className="text-left text-sm font-semibold" htmlFor="room-name">{t('room_nameLabel')}</label>
                <input
                  id="room-name"
                  value={name}
                  onChange={(e) => setName(cleanRoomName(e.target.value))}
                  placeholder={t('room_namePlaceholder')}
                  autoComplete="nickname"
                  maxLength={20}
                  className="w-full rounded-2xl border-2 border-foreground/20 bg-background/50 px-4 py-3 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {error && <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-2.5 text-sm" role="alert">{errText(error)}</p>}
                <button type="submit" disabled={joining || name.trim().length < ROOM_NAME_MIN} className="btn3d w-full rounded-2xl py-3.5 font-black text-lg text-primary-foreground disabled:opacity-50" style={{ background: 'var(--grad-cta)' }}>
                  {joining ? '⏳' : '🚪'} {t('room_joinCta')}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════ La sala (espera; la partida llega en S3) ═══════════════════════════════════════
interface RoomScreenProps {
  roomId: string;
  onExit: () => void;
}

export function RoomScreen({ roomId, onExit }: RoomScreenProps) {
  const { t } = useI18n();
  const errText = useRoomErrorText();
  // "Otra ronda" lleva a todos a una sala nueva con los mismos jugadores
  const [id, setId] = useState(roomId);
  useEffect(() => { setId(roomId); }, [roomId]);
  const { state, setState, error, refresh } = useRoomState({ id });

  if (!state) {
    return (
      <Centered>
        {error ? <><Mascot state="sad" className="w-20" /><p className="font-extrabold text-lg">{errText(error.code)}</p><BackHome onClick={onExit} /></>
          : <p className="text-muted-foreground">{t('loading')}</p>}
      </Centered>
    );
  }
  if (state.kicked) return <Centered><Mascot state="sad" className="w-20" /><p className="font-extrabold text-lg">{t('room_err_kicked')}</p><BackHome onClick={onExit} /></Centered>;
  if (state.status === 'cancelled') return <Centered><Mascot state="sad" className="w-20" /><p className="font-extrabold text-lg">{t('room_cancelled')}</p><BackHome onClick={onExit} /></Centered>;
  if (state.status === 'lobby') return <RoomLobby state={state} onState={setState} onRefresh={refresh} onExit={onExit} />;
  if (state.status === 'finished') return <RoomFinal state={state} onExit={onExit} onSwitch={setId} />;
  return <Suspense fallback={<Centered><p className="text-muted-foreground">{t('loading')}</p></Centered>}><RoomGame state={state} onRefresh={refresh} onExit={onExit} /></Suspense>;
}

/** Resultado de la sala: podio, tabla completa y "Otra ronda" (el anfitrión la arma; a los demás los lleva solos) */
function RoomFinal({ state, onExit, onSwitch }: { state: RoomState; onExit: () => void; onSwitch: (id: string) => void }) {
  const { t } = useI18n();
  const errText = useRoomErrorText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<RoomErrorCode | null>(null);
  const me = state.players.find((p) => p.me) ?? null;
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());
  const celebrated = useRef(false);
  useEffect(() => {
    if (celebrated.current || !me) return;
    celebrated.current = true;
    trackEvent('room_finish', { players: state.player_count, rank: me.rank });
    if (me.rank === 1) { playVictory(); fireCelebration(); }
  }, [me, state.player_count]);
  // Otra ronda armada por el anfitrión: los jugadores pasan solos a la sala nueva
  useEffect(() => {
    if (state.next_room && !state.i_am_host && state.next_room.status === 'lobby') onSwitch(state.next_room.id);
  }, [state.next_room, state.i_am_host, onSwitch]);

  const rematch = async () => {
    if (busy) return;
    playButtonTap();
    setBusy(true);
    setError(null);
    try {
      const n = await rematchRoom(state.id, state.settings, state.items.map((i) => i.name));
      trackEvent('room_rematch', { players: n.player_count });
      onSwitch(n.id);
    } catch (e) {
      setError(e instanceof RoomError ? e.code : 'network');
    } finally {
      setBusy(false);
    }
  };

  const podium = state.players.slice(0, 3);
  const order = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;
  const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉');
  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-4xl animate-fade-in-up flex flex-col gap-4" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <h1 className="text-center font-extrabold text-3xl sm:text-4xl">{t('room_finalTitle')} <span className="text-primary">{t('room_finalTitleTail')}</span></h1>
        {me && <p className="text-center font-bold text-lg">{t('room_finalYou', { n: me.rank, total: state.player_count, points: fmt(me.total) })}</p>}

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] short:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
          {/* Podio */}
          <section className="rounded-3xl border-2 border-primary/60 bg-card/85 p-4 flex items-end justify-center gap-2 sm:gap-4 min-h-[13rem] short:min-h-0">
            {order.map((p) => (
              <div key={p.slot} className={`flex flex-col items-center gap-1 text-center min-w-0 w-1/3 ${p.rank === 1 ? 'animate-score-pop' : ''}`}>
                <span className="text-3xl" aria-hidden>{medal(p.rank)}</span>
                <PlayerFace player={p} size="lg" />
                <span className={`block w-full truncate font-bold ${p.me ? 'text-primary' : ''}`}>{p.name}</span>
                <span className="font-black tabular-nums">{fmt(p.total)}</span>
                <span className={`w-full rounded-t-xl bg-gradient-to-t from-accent/10 to-accent/40 ${p.rank === 1 ? 'h-16' : p.rank === 2 ? 'h-11' : 'h-7'} short:h-4`} aria-hidden />
              </div>
            ))}
          </section>

          {/* Tabla completa */}
          <section className="rounded-3xl border-2 border-accent/50 bg-card/85 p-3 sm:p-4">
            <ol className="flex flex-col gap-1">
              {state.players.map((p) => (
                <li key={p.slot} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm sm:text-base ${p.me ? 'bg-primary/15 border border-primary/50' : 'bg-background/40'}`}>
                  <span className="w-6 text-center font-black text-muted-foreground">{p.rank}</span>
                  <PlayerFace player={p} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{p.name}{p.me ? ` · ${t('ch_you')}` : ''}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">🎯 {p.hits}</span>
                  <span className="font-black tabular-nums">{fmt(p.total)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {error && <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-center" role="alert">{errText(error)}</p>}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {state.i_am_host && (
            <button onClick={rematch} disabled={busy} className="btn3d rounded-2xl px-8 py-3.5 font-black text-lg text-primary-foreground disabled:opacity-60" style={{ background: 'var(--grad-cta)' }}>
              {busy ? '⏳' : '🔁'} {t('room_rematch')}
            </button>
          )}
          {!state.i_am_host && <p className="text-center text-sm text-muted-foreground self-center">{t('room_rematchWaiting', { name: state.host_name ?? '' })}</p>}
          <button onClick={() => { playButtonTap(); onExit(); }} className="rounded-2xl border-2 border-accent/50 px-8 py-3 font-bold hover:bg-accent/10">{t('ob_backHome')}</button>
        </div>
        <p className="text-center text-xs text-muted-foreground">{t('room_finalSaved')}</p>
      </div>
    </div>
  );
}

function RoomLobby({ state, onState, onRefresh, onExit }: { state: RoomState; onState: (s: RoomState) => void; onRefresh: () => Promise<void>; onExit: () => void }) {
  const { t } = useI18n();
  const errText = useRoomErrorText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<RoomErrorCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [kickSlot, setKickSlot] = useState<number | null>(null);
  const link = roomLink(state.pin);
  const host = state.i_am_host;
  const enough = state.player_count >= 2;
  const shareText = t('room_shareText', { pin: formatPin(state.pin), link });

  const run = async (fn: () => Promise<RoomState | void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const s = await fn();
      if (s) onState(s); else await onRefresh();
    } catch (e) {
      setError(e instanceof RoomError ? e.code : 'network');
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    playButtonTap();
    try { await navigator.clipboard.writeText(link); setCopied(true); playShareSuccess(); setTimeout(() => setCopied(false), 1800); } catch { /* sin portapapeles */ }
  };
  const nativeShare = async () => {
    playButtonTap();
    try { await navigator.share({ title: 'GeoSpeed', text: shareText, url: link }); } catch { /* cancelado */ }
  };
  const leave = () => {
    playButtonTap();
    if (host && !window.confirm(t('room_cancelConfirm'))) return;
    void (host ? cancelRoom(state.id) : leaveRoom(state.id)).catch(() => {}).finally(onExit);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg px-3 pt-4 sm:px-4 sm:pt-6 md:px-6">
      <div className="w-full max-w-5xl animate-fade-in-up flex flex-col gap-4" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={leave} className="rounded-full border-2 border-accent/60 w-11 h-11 flex items-center justify-center hover:bg-accent/15 shrink-0" aria-label={host ? t('room_cancel') : t('room_leave')}>
            <ChevronIcon dir="left" className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-2xl sm:text-3xl leading-tight">{t('room_lobbyTitle')} <span className="text-primary">{t('room_lobbyTitleTail')}</span></h1>
            <SettingsLine s={state.settings} left />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] short:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* PIN y compartir */}
          <section className="rounded-3xl border-2 border-primary/60 bg-card/85 p-4 sm:p-5 flex flex-col items-center gap-3 text-center shadow-[0_0_24px_hsl(var(--primary)/0.15)]">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t('room_pin')}</p>
            <p className="font-black text-5xl sm:text-6xl short:text-4xl tracking-[0.12em] text-primary tabular-nums" aria-label={state.pin.split('').join(' ')}>{formatPin(state.pin)}</p>
            <p className="text-xs sm:text-sm text-muted-foreground break-all">{link.replace(/^https?:\/\//, '')}</p>
            <div className="grid grid-cols-3 gap-2 w-full">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={() => { playButtonTap(); trackEvent('room_share', { method: 'whatsapp' }); }}
                className="rounded-2xl border-2 border-accent/50 py-2.5 font-bold text-sm hover:bg-accent/10 flex flex-col items-center gap-0.5"><span aria-hidden className="text-xl">💬</span>WhatsApp</a>
              <button onClick={copy} className="rounded-2xl border-2 border-accent/50 py-2.5 font-bold text-sm hover:bg-accent/10 flex flex-col items-center gap-0.5">
                <span aria-hidden className="text-xl">{copied ? '✅' : '🔗'}</span>{copied ? t('room_copied') : t('room_copy')}
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator ? (
                <button onClick={nativeShare} className="rounded-2xl border-2 border-accent/50 py-2.5 font-bold text-sm hover:bg-accent/10 flex flex-col items-center gap-0.5"><span aria-hidden className="text-xl">📤</span>{t('room_share')}</button>
              ) : <span />}
            </div>
            <p className="text-xs text-muted-foreground">{t('room_pinHint')}</p>
            <QrCode text={link} label={t('room_tvQr')} className="w-32 short:w-24 sm:w-36" />
            {host && (
              <a href={roomTvLink(state.pin)} target="_blank" rel="noopener noreferrer" onClick={() => playButtonTap()}
                className="w-full rounded-2xl border-2 border-primary/60 py-2.5 font-bold text-sm hover:bg-primary/10 flex flex-col items-center gap-0.5">
                <span>📺 {t('room_tvOpen')}</span>
                <span className="text-[11px] font-normal text-muted-foreground">{t('room_tvOpenDesc')}</span>
              </a>
            )}
          </section>

          {/* Jugadores */}
          <section className="rounded-3xl border-2 border-accent/50 bg-card/85 p-4 sm:p-5 flex flex-col gap-3">
            <p className="flex items-center justify-between">
              <span className="font-extrabold text-lg">{t('room_players')}</span>
              <span className="rounded-full border border-accent/50 px-3 py-0.5 text-sm font-bold text-accent">{state.player_count}/{state.settings.max_players}</span>
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2" aria-live="polite">
              {state.players.map((p) => (
                <li key={p.slot} className={`relative flex items-center gap-2 rounded-2xl border px-2.5 py-2 animate-fade-in ${p.me ? 'border-primary bg-primary/10' : 'border-accent/30 bg-background/40'}`}>
                  <PlayerFace player={p} />
                  <span className="min-w-0">
                    <span className="block font-bold text-sm truncate">{p.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{p.is_host ? `👑 ${t('room_host')}` : p.me ? t('ch_you') : ''}</span>
                  </span>
                  {host && !p.is_host && (
                    <button onClick={() => { playButtonTap(); setKickSlot(p.slot); }} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-destructive text-white text-xs font-black" aria-label={t('room_kick', { name: p.name })}>×</button>
                  )}
                </li>
              ))}
              {Array.from({ length: Math.max(0, Math.min(3, state.settings.max_players - state.player_count)) }).map((_, i) => (
                <li key={`e${i}`} className="rounded-2xl border border-dashed border-accent/25 px-2.5 py-2 text-xs text-muted-foreground flex items-center justify-center min-h-[52px]">{t('room_waitingPlayer')}</li>
              ))}
            </ul>
          </section>
        </div>

        {error && <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-center" role="alert">{errText(error)}</p>}
        {/* Barra fija abajo: con el QR, la tarjeta del PIN llena la pantalla y el botón quedaba fuera de la vista.
            A la derecha deja libre el botón flotante de música (bajo md) */}
        {host ? (
          <div className="sticky bottom-0 z-10 -mx-3 sm:-mx-4 md:-mx-6 pl-3 sm:pl-4 md:px-6 pr-[60px] pt-3 flex flex-col items-center gap-1.5 bg-gradient-to-t from-background via-background/95 to-transparent"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
            <button onClick={() => { playButtonTap(); trackEvent('room_start', { players: state.player_count }); void run(() => startRoom(state.id)); }} disabled={!enough || busy}
              className="btn3d w-full max-w-xl rounded-2xl py-4 short:py-2.5 font-black text-xl text-primary-foreground disabled:opacity-50" style={{ background: 'var(--grad-cta)' }}>
              {busy ? '⏳' : '▶'} {t('room_start')}
            </button>
            <p className="text-sm text-muted-foreground text-center">{enough ? t('room_startHint') : t('room_needTwo')}</p>
          </div>
        ) : (
          <div className="sticky bottom-0 z-10 -mx-3 sm:-mx-4 md:-mx-6 pl-3 sm:pl-4 md:px-6 pr-[60px] pt-3 flex flex-col items-center gap-1.5 text-center bg-gradient-to-t from-background via-background/95 to-transparent"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
            <p className="font-bold text-lg animate-pulse">⏳ {t('room_waitingHost', { name: state.host_name ?? '' })}</p>
            <button onClick={leave} className="text-sm text-muted-foreground underline hover:text-foreground">{t('room_leave')}</button>
          </div>
        )}
      </div>

      {kickSlot != null && (
        <div className="modal-layer z-[130] bg-black/60" onClick={() => setKickSlot(null)} role="dialog" aria-modal="true">
          <div className="modal-panel w-full max-w-sm rounded-3xl border-2 border-accent/40 bg-card p-5 text-center flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <p className="font-extrabold text-lg">{t('room_kickConfirm', { name: state.players.find((p) => p.slot === kickSlot)?.name ?? '' })}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setKickSlot(null)} className="rounded-2xl border-2 border-accent/50 py-2.5 font-bold">{t('cancel')}</button>
              <button onClick={() => { const s = kickSlot; setKickSlot(null); void run(() => kickFromRoom(state.id, s)); }} className="rounded-2xl bg-destructive text-white py-2.5 font-black">{t('room_kickCta')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════ Piezas ═══════════════════════════════════════
function SettingsLine({ s, left = false }: { s: RoomSettings; left?: boolean }) {
  const { t } = useI18n();
  const cap = s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1);
  return (
    <p className={`flex flex-wrap gap-1.5 text-xs sm:text-sm ${left ? '' : 'justify-center'}`}>
      {[`${CATEGORY_ART[s.category].emoji} ${t(CATEGORY_KEY[s.category] as never)}`, `${REGION_ART[s.mode].emoji} ${t(`mode_${s.mode}` as never)}`,
        `${DIFF_ART[s.difficulty].emoji} ${t(`home_diff${cap}` as never)}`, t('room_roundsShort', { n: s.rounds_total }), `⏱ ${s.seconds} s`].map((x) => (
        <span key={x} className="rounded-full border border-accent/40 bg-background/40 px-2.5 py-0.5 font-semibold">{x}</span>
      ))}
    </p>
  );
}

function Chips<K extends number>({ label, options, value, onChange }: { label: string; options: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-foreground/70 mb-1">{label}</span>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.key} type="button" role="radio" aria-checked={o.key === value} onClick={() => { playButtonTap(); onChange(o.key); }}
            className={`rounded-xl border-2 py-2 font-black transition-colors ${o.key === value ? 'border-primary bg-primary/15 text-primary' : 'border-accent/30 bg-background/40 hover:border-accent'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PickButton({ label, emoji, value, onClick }: { label: string; emoji: ReactNode; value: string; onClick: () => void }) {
  return (
    <div className="min-w-0">
      <span className="block text-xs font-semibold text-foreground/70 mb-1">{label}</span>
      <button onClick={onClick} aria-haspopup="dialog" aria-label={`${label}: ${value}`}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border border-accent/40 bg-background/50 hover:border-accent transition-colors active:scale-[0.98] text-left">
        <span className="text-xl shrink-0" aria-hidden>{emoji}</span>
        <span className="flex-1 min-w-0 font-bold text-sm sm:text-base truncate">{value}</span>
        <ChevronIcon dir="down" className="w-4 h-4 text-foreground/70" />
      </button>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="min-h-[100dvh] game-bg flex flex-col items-center justify-center gap-4 p-6 text-center animate-fade-in">{children}</div>;
}

function BackHome({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button onClick={() => { playButtonTap(); onClick(); }} className="rounded-2xl border-2 border-accent/50 px-6 py-2.5 font-bold hover:bg-accent/10">
      {t('ob_backHome')}
    </button>
  );
}
