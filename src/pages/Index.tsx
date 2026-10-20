import { useState, useCallback, useEffect, useRef, lazy, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { addGameHistory, getGameHistory } from '@/lib/gameUtils';
import { SCORING_VERSION } from '@/lib/scoring';
import { checkIncomingReferral } from '@/lib/referralSystem';
import { recordInstallDate, checkRetention } from '@/lib/retentionTracker';
import { type City, type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import { type RoundResult } from '@/components/game/GameScreen';
import CountdownIntro from '@/components/game/CountdownIntro';
import RotateOverlay from '@/components/game/RotateOverlay';
import DailyIntroScreen from '@/components/game/DailyIntroScreen';
import DailyResultPanel, { type DailyFinish } from '@/components/game/DailyResultPanel';
import StreakLostModal from '@/components/game/StreakLostModal';
import { OPEN_STREAK_EVENT } from '@/components/game/StreakChip';
import { gameDay, dailyNumber, dailySeed, dailyBestKey } from '@/lib/gameDay';
import { fetchDailyStatus, getCachedDailyStatus, gridFromRounds, parseDailyInvite, DAILY_STATUS_EVENT, type DailyInvite, type DailyStatus } from '@/lib/dailyChallenge';
import { syncStreakReminder, askNativeReminderPermissionOnce } from '@/lib/streakReminder';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import { OPEN_SETTINGS_EVENT } from '@/components/ui/ScreenHeader';
import { type TimeAttackResult } from '@/components/game/TimeAttackScreen';
import AppNav, { type NavTab } from '@/components/game/AppNav';
import Wordmark from '@/components/ui/Wordmark';
import { initPrefs } from '@/lib/prefs';
import { getTranslations, detectLocale, translate } from '@/i18n';

// ── Eager loads (critical path — always needed) ──
import HomeScreen from '@/components/game/HomeScreen';
import SplashScreen from '@/components/game/SplashScreen';
import NoLivesModal from '@/components/game/NoLivesModal';
import { appNumberLocale } from '@/lib/format';

// ── Error Boundary — catches lazy-load failures and render crashes ──
class PhaseErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GeoSpeed] Phase render error:', error, info.componentStack);
    const msg = error?.message || '';
    const isChunkError = /dynamically imported module|Failed to fetch|Importing a module script failed|error loading dynamically/i.test(msg);
    if (isChunkError && !sessionStorage.getItem('geospeed_chunk_reloaded')) {
      sessionStorage.setItem('geospeed_chunk_reloaded', '1');
      window.location.reload();
    }
  }
  render() {
    if (this.state.error) {
      // Class component: sin hooks, se resuelve el idioma a mano
      const dict = getTranslations(detectLocale());
      const tt = (k: Parameters<typeof translate>[1]) => translate(dict, k);
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center game-bg p-6 text-center">
          <img src="/mascot/explorer-logo.webp" alt="GeoSpeed" className="w-14 mb-4 opacity-60" />
          <h2 className="text-xl font-black mb-2" style={{ color: 'hsl(var(--primary))' }}>
            {tt('error_title')}
          </h2>
          <p className="text-sm text-muted-foreground mb-1 max-w-xs">
            {this.state.error.message || tt('error_unknown')}
          </p>
          <p className="text-xs text-muted-foreground/60 mb-6 max-w-xs break-all">
            {this.state.error.name}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); this.props.onReset(); }}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 5px 0 hsl(var(--primary-deep))' }}
          >
            {tt('error_backHome')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Lazy loads (loaded on demand per phase) ──
// Envuelve los imports dinámicos: si falla cargar un chunk (típico tras un nuevo
// deploy en que los .js viejos con hash ya no existen), recarga la página UNA vez
// para traer la versión nueva, en vez de romper con "Failed to fetch module".
function lazyWithReload<T extends { default: React.ComponentType<any> }>(factory: () => Promise<T>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const msg = (err as Error)?.message || '';
      const isChunkError = /dynamically imported module|Failed to fetch|Importing a module script failed|error loading dynamically/i.test(msg);
      const alreadyReloaded = sessionStorage.getItem('geospeed_chunk_reloaded');
      if (isChunkError && !alreadyReloaded) {
        sessionStorage.setItem('geospeed_chunk_reloaded', '1');
        window.location.reload();
        // Devolver una promesa que nunca resuelve mientras recarga
        return await new Promise<T>(() => {});
      }
      throw err;
    }
  });
}
const GameScreen = lazyWithReload(() => import('@/components/game/GameScreen'));
const ProfileScreen = lazyWithReload(() => import('@/components/game/ProfileScreen'));
const FinalResultScreen = lazyWithReload(() => import('@/components/game/FinalResultScreen'));
const MultiplayerLobby = lazyWithReload(() => import('@/components/game/MultiplayerLobby'));
const FriendsScreen = lazyWithReload(() => import('@/components/game/FriendsScreen'));
const ChallengeScreen = lazyWithReload(() => import('@/components/game/ChallengeScreen'));
const MyChallengesScreen = lazyWithReload(() => import('@/components/game/MyChallengesScreen'));
const HistoryScreen = lazyWithReload(() => import('@/components/game/HistoryScreen'));
const RankingScreen = lazyWithReload(() => import('@/components/game/RankingScreen'));
const WaitingRoom = lazyWithReload(() => import('@/components/game/WaitingRoom'));
const MultiplayerResultScreen = lazyWithReload(() => import('@/components/game/MultiplayerResultScreen'));
const TimeAttackScreen = lazyWithReload(() => import('@/components/game/TimeAttackScreen'));
const WorldChallengeScreen = lazyWithReload(() => import('@/components/game/WorldChallengeScreen'));
const TutorialOverlay = lazyWithReload(() => import('@/components/game/TutorialOverlay'));
const OnboardingGame = lazyWithReload(() => import('@/components/game/OnboardingGame'));
const StoreScreen = lazyWithReload(() => import('@/components/game/StoreScreen'));
const BattlePassScreen = lazyWithReload(() => import('@/components/game/BattlePassScreen'));
const SpectatorScreen = lazyWithReload(() => import('@/components/game/SpectatorScreen'));
const SettingsScreen = lazyWithReload(() => import('@/components/game/SettingsScreen'));
const StreakScreen = lazyWithReload(() => import('@/components/game/StreakScreen'));
const MoreModesScreen = lazyWithReload(() => import('@/components/game/MoreModesScreen'));
const HowToPlayScreen = lazyWithReload(() => import('@/components/game/HowToPlayScreen'));
import { type GameRoom, updateRoomScore, subscribeToRoom, fetchRoom } from '@/lib/multiplayerUtils';
import { supabase } from '@/integrations/supabase/client';
import { consumeLife, getEnergy, addLives } from '@/lib/energySystem';
import { incrementGameCounter, shouldShowInterstitial, refreshEntitlements, ENTITLEMENTS_EVENT, PURCHASE_PENDING_KEY, type EntitlementsResult } from '@/lib/premiumSystem';
import { toast } from 'sonner';
import { showInterstitial, initAds } from '@/lib/adSystem';
import { addBattlePassXP } from '@/lib/cosmetics';
import { initAnalytics, trackGameStart, trackGameComplete, trackRageQuit, trackShare, trackStoreView, getSessionDurationMs, incrementSessionGames } from '@/lib/analytics';
import { resetSessionFrustration } from '@/lib/frustrationDetector';
import { initFeatureFlags } from '@/lib/featureFlags';
import { challengeCitiesToGame, mockRecordMyResult, createChallenge, type Challenge, type ChallengeDetail, type MyChallenge } from '@/lib/challenges';
import type { ChallengeSource } from '@/components/game/ChallengeScreen';
import { syncAfterGame } from '@/lib/cloudSync';
import { saveGameResult, roundsFromResults, roundsFromTimeAttack, avgDistance as avgDistanceOf } from '@/lib/gameResults';
import { getStreakState } from '@/lib/dailyStreak';
import { getPlayerStats } from '@/lib/gameUtils';
import { isBusyPhase, resetHomeVisit, markHomeInterruption, homeInterruptionShown } from '@/lib/interruptions';
import { playCountdown, playGo, unlockAudio } from '@/lib/sounds';
import { hapticTap, hapticCelebration } from '@/lib/haptics';
import { useI18n } from '@/i18n';
import { useBackgroundMusic, type MusicTrack } from '@/hooks/useBackgroundMusic';
import {
  supportsNotifications,
  getPermission,
  canOfferNotifications,
  snoozeNotificationPrompt,
  requestPermission,
  scheduleDailyReminder,
  scheduleStreakWarning,
  scheduleLivesRegenerated,
  startNotificationLoop,
  subscribeToPush,
} from '@/lib/notifications';

type Phase = 'splash' | 'home' | 'daily-intro' | 'streak' | 'friends' | 'challenge' | 'my-challenges' | 'history' | 'ranking' | 'profile' | 'store' | 'battlepass' | 'settings' | 'more-modes' | 'howto' | 'tutorial' | 'onboarding' | 'countdown' | 'playing' | 'final' | 'mp-lobby' | 'mp-waiting' | 'mp-playing' | 'mp-final' | 'mp-spectate' | 'ta-select' | 'ta-playing' | 'ta-final' | 'daily' | 'wc-playing';

/** Fases que conviven con la barra de navegación persistente (fuera de la partida) */
const NAV_PHASES: Phase[] = ['home', 'daily-intro', 'streak', 'profile', 'store', 'battlepass', 'settings', 'more-modes', 'howto', 'friends', 'challenge', 'my-challenges', 'history', 'ranking'];
/** Fases donde GameScreen muestra su propio boton de musica en el HUD */
const GAME_SCREEN_PHASES: Phase[] = ['playing', 'daily', 'mp-playing', 'ta-playing', 'wc-playing'];

// Mismas ciudades para todos: semilla del día de juego (medianoche de Colombia, src/lib/gameDay.ts)
function getDailySeed(): number {
  return dailySeed(gameDay());
}

function PhaseTransition({ children, phaseKey }: { children: React.ReactNode; phaseKey: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Reset for new phase
    setVisible(false);
    // Double-rAF guarantees at least one paint at opacity 0 before transitioning
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    // Failsafe: if rAF doesn't fire (tab hidden, throttled), force visible after 100ms
    const timer = setTimeout(() => setVisible(true), 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [phaseKey]);
  return (
    <div
      className="transition-opacity duration-500 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {children}
    </div>
  );
}

// Difficulty labels — now resolved via i18n inside the component
// (kept as fallback for non-i18n contexts)
const difficultyLabelsEs: Record<Difficulty, string> = {
  basic: '🌍 Básico',
  easy: '🧭 Intermedio',
  medium: '⚡ Avanzado',
  hard: '🔥 Experto',
};

export interface DeepLinkProps {
  deepLink?: { type: 'daily' | 'challenge' | 'duel' | 'reto' | 'dailyInvite' };
}

const Index = ({ deepLink }: DeepLinkProps = {}) => {
  // Si llegamos a montar bien, limpiar el flag de recarga por chunk viejo (permite
  // que un futuro deploy vuelva a auto-recargar si hace falta).
  useEffect(() => { try { sessionStorage.removeItem('geospeed_chunk_reloaded'); } catch {} }, []);

  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;
  // Reglas de interrupciones (2026-10-19): los mensajes (toasts) que llegan durante la carga, la cuenta
  // regresiva o la partida esperan a que el jugador termine. phaseRef se actualiza tras declarar `phase`.
  const phaseRef = useRef<string>('splash');
  const deferredToastsRef = useRef<Array<() => void>>([]);
  const showToastWhenFree = useCallback((show: () => void) => {
    if (isBusyPhase(phaseRef.current)) deferredToastsRef.current.push(show);
    else show();
  }, []);
  // Compras web (Mercado Pago): al volver del checkout, o al reabrir la app con una compra en
  // curso (efectivo/PSE se aprueban más tarde), traer lo que el servidor acreditó y avisarlo.
  // El cliente NUNCA acredita pagos por sí mismo (tabla purchases, refreshEntitlements).
  useEffect(() => {
    const tt = (k: Parameters<typeof t>[0], p?: Record<string, string | number>) => tRef.current(k, p);
    const onCredit = (e: Event) => {
      const r = (e as CustomEvent<EntitlementsResult>).detail;
      if (r?.livesAdded > 0) showToastWhenFree(() => toast.success(tt('purchase_creditedLives', { count: r.livesAdded })));
      if (r?.proActivated) showToastWhenFree(() => toast.success(tt('purchase_creditedPro')));
    };
    window.addEventListener(ENTITLEMENTS_EVENT, onCredit);

    const status = new URLSearchParams(window.location.search).get('purchase');
    if (status) {
      const url = new URL(window.location.href);
      url.searchParams.delete('purchase');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
    let cancelled = false;
    let timer: number | undefined;
    if (status === 'failure') showToastWhenFree(() => toast.error(tt('purchase_failed')));
    if (status === 'success' || status === 'pending') {
      if (status === 'pending') showToastWhenFree(() => toast(tt('purchase_pending')));
      // El webhook puede tardar unos segundos en registrar el pago
      let tries = 0;
      const poll = async () => {
        tries++;
        const r = await refreshEntitlements().catch(() => null);
        if (cancelled || (r && (r.livesAdded > 0 || r.proActivated))) return;
        if (tries < 8) timer = window.setTimeout(poll, 3000);
        else if (status === 'success') showToastWhenFree(() => toast(tt('purchase_processing')));
      };
      poll();
    }

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const pending = JSON.parse(localStorage.getItem(PURCHASE_PENDING_KEY) || 'null') as { at?: number } | null;
        if (!pending) return;
        if (Date.now() - (pending.at ?? 0) > 7 * 86400000) { localStorage.removeItem(PURCHASE_PENDING_KEY); return; }
      } catch { return; }
      refreshEntitlements().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener(ENTITLEMENTS_EVENT, onCredit);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  const isMobile = useIsMobile();
  const routeParams = useParams<{ date?: string; seed?: string; code?: string; n?: string }>();
  const { user, isAnonymous: isAnonymousUser, displayName: authDisplayName } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('splash');
  phaseRef.current = phase;
  // Al salir de una fase ocupada, se muestran los mensajes que esperaban (con una pausa breve)
  useEffect(() => {
    if (isBusyPhase(phase) || deferredToastsRef.current.length === 0) return;
    const id = setTimeout(() => { deferredToastsRef.current.splice(0).forEach(show => show()); }, 700);
    return () => clearTimeout(id);
  }, [phase]);
  const [difficulty, setDifficulty] = useState<Difficulty>('basic');
  const [gameMode, setGameMode] = useState<GameMode>('world');
  const [finalRounds, setFinalRounds] = useState<RoundResult[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [endReason, setEndReason] = useState<'timeout' | 'complete'>('complete');
  const [taResult, setTaResult] = useState<TimeAttackResult | null>(null);
  const [taPrevBest, setTaPrevBest] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [showNoLives, setShowNoLives] = useState(false);
  // Desafío diario (Fase 2): día/número/semilla fijados al empezar (si la partida cruza la medianoche
  // sigue siendo el diario de ese día), resultado para el cierre, racha del servidor y link de un amigo
  const dailyRunRef = useRef<{ day: string; no: number; seed: number } | null>(null);
  const [dailyFinish, setDailyFinish] = useState<DailyFinish | null>(null);
  const [dailyAfter, setDailyAfter] = useState<DailyStatus | null>(null);
  const [dailyInvite, setDailyInvite] = useState<DailyInvite | null>(null);
  const [streakLost, setStreakLost] = useState<{ lost: number; best: number; on: string } | null>(null);
  const showNoLivesRef = useRef(false);
  showNoLivesRef.current = showNoLives;
  // Se recuerda en qué pantalla se abrió: si el jugador cambia de pantalla, se cierra (antes quedaba
  // abierta y otras ventanas se apilaban encima)
  const noLivesPhaseRef = useRef<string | null>(null);
  useEffect(() => { if (showNoLives) noLivesPhaseRef.current = phase; }, [showNoLives]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (showNoLives && noLivesPhaseRef.current && noLivesPhaseRef.current !== phase) setShowNoLives(false);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const [isTraining, setIsTraining] = useState(false);
  const [revengeCities, setRevengeCities] = useState<City[] | null>(null);
  const [replayCities, setReplayCities] = useState<City[] | null>(null);
  // F3: reto asincrónico que se está jugando y fuente de la pantalla del reto
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [challengeSource, setChallengeSource] = useState<ChallengeSource | null>(null);
  const [revengeUsed, setRevengeUsed] = useState(false);
  const [originalScore, setOriginalScore] = useState(0);
  const [originalWorstScores, setOriginalWorstScores] = useState<number[]>([]);
  // Multiplayer state
  const [mpRoom, setMpRoom] = useState<GameRoom | null>(null);
  const [mpIsHost, setMpIsHost] = useState(false);
  const mpRoomRef = useRef<GameRoom | null>(null);
  const [spectateRoomId, setSpectateRoomId] = useState<string>('');
  // Stable game key — only increments when a NEW game is explicitly started
  const gameKeyRef = useRef(0);
  // Semilla de la partida en curso: permite que "Reta a un amigo" comparta EXACTAMENTE
  // las mismas ciudades (antes se generaba una semilla nueva al compartir → bug B1).
  const gameSeedRef = useRef<number>(Math.floor(Math.random() * 1_000_000));
  const newGameSeed = () => { gameSeedRef.current = Math.floor(Math.random() * 1_000_000); };
  // Overlay-based rotate screen — keeps game mounted so state is preserved
  const [showRotateOverlay, setShowRotateOverlay] = useState(false);
  // Declarados aquí (antes de handleGameOver) para que sus deps no los lean en TDZ
  const [isSpeedDemon, setIsSpeedDemon] = useState(false);
  // Challenge a Friend state
  const [challengeSeed, setChallengeSeed] = useState<number | null>(null);
  const [challengerScore, setChallengerScore] = useState<number | null>(null);
  const autoStartedSeedRef = useRef<number | null>(null);
  // Notification permission prompt
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const notifPendingRef = useRef(false);
  // Pestaña inicial del perfil (la pestaña "Progreso" de la barra abre el historial)
  const [profileTab, setProfileTab] = useState<'overview' | 'history'>('overview');

  // ── Background music — single track, always on from splash ──
  const { toggle: toggleMusic, muted: isMusicMuted } = useBackgroundMusic('on');

  // Initialize ads on mount
  useEffect(() => { initPrefs(); initAds(); initAnalytics(); initFeatureFlags(); checkIncomingReferral(); resetSessionFrustration(); recordInstallDate(); checkRetention(); }, []);

  useEffect(() => { mpRoomRef.current = mpRoom; }, [mpRoom]);

  // Keep room subscription alive for the whole match lifecycle.
  // Only re-subscribe when the room ID changes, not when phase changes,
  // so we don't miss real-time updates during the mp-playing → mp-final transition.
  const mpPhaseActive = phase === 'mp-playing' || phase === 'mp-final';
  useEffect(() => {
    if (!mpPhaseActive || !mpRoom) return;
    // Merge DB update with local state — preserve MY score/finished if I already
    // finished (optimistic update), so no race resets my score to 0.
    const applyUpdate = (updated: GameRoom) => {
      setMpRoom(prev => {
        if (!prev) return updated;
        const myScoreKey = mpIsHost ? 'host_score' : 'guest_score';
        const myFinishedKey = mpIsHost ? 'host_finished' : 'guest_finished';
        const iAlreadyFinished = prev[myFinishedKey];
        return {
          ...updated,
          ...(iAlreadyFinished ? { [myScoreKey]: prev[myScoreKey], [myFinishedKey]: true } : {}),
        };
      });
    };
    const channel = subscribeToRoom(mpRoom.id, applyUpdate);
    // Polling de respaldo (Realtime bloqueado por RLS sobre la tabla base game_rooms)
    const poll = setInterval(async () => {
      const r = await fetchRoom(mpRoom.id);
      if (r) applyUpdate(r);
    }, 2000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpRoom?.id, mpPhaseActive]);

  // Countdown — 3 → 2 → 1 → 0 (GO!) → fase de juego. Se inicializa al entrar y solo avanza
  // mientras el telefono esta en horizontal (showRotateOverlay pausa el tic).
  useEffect(() => {
    if (phase !== 'countdown') return;
    unlockAudio(); // Ensure AudioContext is running before any sounds
    setCountdown(3);
  }, [phase]);
  useEffect(() => {
    if (phase !== 'countdown' || showRotateOverlay) return;
    playCountdown();
    hapticTap();
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          const next = countdownNextRef.current;
          countdownNextRef.current = 'playing'; // reset para la próxima cuenta
          setPhase(next);
          return 0;
        }
        if (prev === 1) {
          // Next tick will be GO!
          playGo();
          hapticCelebration();
        } else {
          playCountdown();
          hapticTap();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, showRotateOverlay]);

  const pendingStartRef = useRef<{ diff: Difficulty; mode: GameMode } | null>(null);
  const countdownNextRef = useRef<Phase>('playing'); // a qué fase saltar tras la cuenta regresiva

  const handleSelectDifficulty = useCallback((diff: Difficulty, mode: GameMode) => {
    unlockAudio(); // Pre-unlock audio on user gesture so sounds work on mobile
    const onboardingDone = localStorage.getItem('geospeed_onboarding_done');
    // La práctica (jugador nuevo) no gasta vida: se cobra al pasar a la partida real (HELP-01)
    if (onboardingDone && !consumeLife()) {
      setShowNoLives(true);
      return;
    }
    setIsTraining(false);
    setIsSpeedDemon(false);
    setActiveChallenge(null);
    setReplayCities(null); // partida nueva: ciudades frescas (no reusar las de "Otra vez")
    newGameSeed();
    setDifficulty(diff);
    setGameMode(mode);
    if (!onboardingDone) {
      setPhase('onboarding');
      return;
    }
    trackGameStart(mode, diff);
    const tutorialSeen = localStorage.getItem('geospeed_tutorial_seen');
    if (!tutorialSeen) {
      setPhase('tutorial');
      return;
    }
    gameKeyRef.current += 1;
    setPhase('countdown');
  }, [isMobile]);

  // Back gesture / hardware back button → return to home instead of leaving the app.
  // Works for Android swipe-back and browser back. (Native Capacitor back button also emits popstate.)
  useEffect(() => {
    const inGamePhases: Phase[] = [
      'countdown', 'playing', 'final', 'onboarding', 'tutorial',
      'ta-select', 'ta-playing', 'ta-final', 'daily',
      'mp-lobby', 'mp-waiting', 'mp-playing', 'mp-final', 'mp-spectate',
      'store', 'profile', 'battlepass', 'settings', 'more-modes', 'howto', 'daily-intro',
    ];
    if (!inGamePhases.includes(phase)) return;
    // Push a sentinel entry so the first back press is captured here
    window.history.pushState({ geospeedGuard: true }, '');
    const onPop = () => {
      setPhase('home');
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [phase]);

  // Detect portrait rotation DURING gameplay → show overlay (game stays mounted)
  // Uses touch detection instead of isMobile so it works on all tablets/phones
  useEffect(() => {
    // Maqueta Girar_APROBADA: el aviso de girar aparece ANTES de la cuenta regresiva y la cuenta
    // espera en vertical ("La cuenta regresiva empieza despues").
    const playPhases: Phase[] = ['countdown', 'playing', 'ta-playing', 'mp-playing', 'daily', 'onboarding'];
    const isTouch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    if (!playPhases.includes(phase) || !isTouch) {
      // Outside gameplay or desktop: always hide overlay
      setShowRotateOverlay(false);
      return;
    }
    const check = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowRotateOverlay(isPortrait);
    };
    // Check immediately
    check();
    const onOrientationChange = () => setTimeout(check, 200);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', onOrientationChange);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, [phase]);

  const handleGameOver = useCallback((rounds: RoundResult[], reason: 'timeout' | 'complete') => {
    const total = rounds.reduce((s, r) => s + r.totalPoints, 0);
    const avgDist = rounds.length > 0 ? rounds.reduce((s, r) => s + r.distance, 0) / rounds.length : 0;

    if (revengeCities) {
      // Revenge game finished — calculate improvement over original worst scores
      const revengeScore = total;
      const originalWorstTotal = originalWorstScores.reduce((s, v) => s + v, 0);
      const improvement = Math.max(0, revengeScore - originalWorstTotal);
      const combinedScore = originalScore + improvement;
      setFinalRounds(rounds);
      setFinalScore(combinedScore);
      setEndReason('complete');
      setRevengeUsed(true);
      setRevengeCities(null);
      setPhase('final');
      return;
    }

    // F3: partida de un reto — se guarda en el reto (el servidor marca al jugador como terminado)
    if (activeChallenge) {
      setFinalRounds(rounds);
      setFinalScore(total);
      setEndReason(reason);
      incrementGameCounter();
      addBattlePassXP(total);
      syncAfterGame();
      saveGameResult({
        gameType: 'challenge',
        mode: gameMode,
        difficulty,
        score: total,
        roundsPlayed: rounds.length,
        roundsTotal: activeChallenge.rounds_total,
        avgDistanceKm: avgDist,
        endReason: reason,
        seed: null,
        challengeId: activeChallenge.id,
        rounds: roundsFromResults(rounds),
      });
      mockRecordMyResult(activeChallenge.id, {
        score: total, end_reason: reason,
        rounds: roundsFromResults(rounds).map(r => ({ ...r, city_lat: r.city_lat ?? 0, city_lon: r.city_lon ?? 0, city_country: r.city_country ?? null, click_lat: r.click_lat ?? null, click_lon: r.click_lon ?? null, distance_km: r.distance_km ?? null, time_s: r.time_s ?? null, base_points: r.base_points ?? null, multiplier: r.multiplier ?? null })),
      });
      setPhase('final');
      return;
    }

    // Normal game — store original score for potential revenge
    setOriginalScore(total);
    setRevengeUsed(false);
    setFinalRounds(rounds);
    setFinalScore(total);
    setEndReason(reason);
    // El diario tiene su propio cierre (fase 'daily'); antes cualquier partida Crack + Mundo se tomaba
    // por diario y daba una vida extra.
    setDailyFinish(null);
    addGameHistory({
      date: new Date().toISOString(),
      score: total,
      rounds: rounds.length,
      difficulty,
      mode: gameMode,
      avgDistance: Math.round(avgDist),
      type: 'classic',
    });

    // Track game for ad cadence, battle pass XP, analytics, and sync to cloud
    incrementGameCounter();
    addBattlePassXP(total);
    trackGameComplete({ score: total, rounds: rounds.length, mode: gameMode, difficulty, avgDistance: avgDist, reason, durationMs: getSessionDurationMs() });
    syncAfterGame();
    // F1: partida + detalle por ciudad en servidor (fire-and-forget; encola si no hay sesión)
    saveGameResult({
      gameType: isTraining ? 'training' : isSpeedDemon ? 'speeddemon' : challengeSeed !== null ? 'challenge' : 'classic',
      mode: gameMode,
      difficulty,
      score: total,
      roundsPlayed: rounds.length,
      roundsTotal: isSpeedDemon ? 30 : isTraining ? 6 : 13,
      avgDistanceKm: avgDist,
      endReason: reason,
      seed: replayCities ? null : gameSeedRef.current,
      rounds: roundsFromResults(rounds),
    });

    // Show interstitial ad between games (every 3 games for free users)
    if (shouldShowInterstitial()) {
      showInterstitial().finally(() => setPhase('final'));
    } else {
      setPhase('final');
    }
  }, [difficulty, gameMode, revengeCities, originalScore, originalWorstScores, isTraining, isSpeedDemon, challengeSeed, replayCities, activeChallenge]);

  // ── Notifications: start check loop + schedule after each game ──
  // Recordatorio de la racha: se reprograma cada vez que cambia el estado del diario (al abrir, al terminarlo)
  useEffect(() => {
    syncStreakReminder();
    const on = () => syncStreakReminder();
    window.addEventListener(DAILY_STATUS_EVENT, on);
    return () => window.removeEventListener(DAILY_STATUS_EVENT, on);
  }, []);
  useEffect(() => {
    startNotificationLoop();
    // Reintenta guardar la suscripción push en cada apertura (idempotente) si ya hay permiso —
    // cubre el caso en que el permiso se concedió pero el guardado en BD falló una vez.
    if (getPermission() === 'granted') subscribeToPush();
  }, []);

  // Al terminar una partida: programar los avisos (si ya hay permiso) o dejar pendiente la oferta del
  // permiso para cuando el jugador vuelva al inicio. Mundial termina dentro de su pantalla (wc-playing).
  useEffect(() => {
    if (phase !== 'final' && phase !== 'ta-final' && phase !== 'wc-playing') return;
    if (getPermission() === 'granted') {
      if (phase === 'wc-playing') return;
      scheduleDailyReminder();
      const energy = getEnergy();
      if (energy.lives < energy.maxLives && energy.nextRegenMs > 0) {
        // Schedule for when ALL lives are full (se vuelve a comprobar al momento de avisar)
        const msPerLife = 20 * 60 * 1000;
        const livesNeeded = energy.maxLives - energy.lives;
        const totalMs = energy.nextRegenMs + (livesNeeded - 1) * msPerLife;
        scheduleLivesRegenerated(totalMs);
      }
    } else {
      notifPendingRef.current = true;
    }
  }, [phase]);

  // Oferta del permiso al volver al inicio: solo si en esta visita no salió otra ventana (p. ej. el
  // cofre), no está abierto "sin vidas" y el jugador ya terminó 3 partidas ("Ahora no" = 7 días; máx. 2 veces)
  useEffect(() => {
    if (phase !== 'home') { resetHomeVisit(); setShowNotifPrompt(false); return; }
    if (!notifPendingRef.current) return;
    const id = setTimeout(() => {
      notifPendingRef.current = false;
      if (homeInterruptionShown() || showNoLivesRef.current) return;
      if (!canOfferNotifications(getPlayerStats().gamesPlayed)) return;
      markHomeInterruption();
      setShowNotifPrompt(true);
    }, 1200);
    return () => clearTimeout(id);
  }, [phase]);

  const handleNotifAccept = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) subscribeToPush();
    setShowNotifPrompt(false);
    // Schedule immediately if granted
    if (getPermission() === 'granted') {
      scheduleDailyReminder();
      syncStreakReminder();
    }
  }, []);

  const handleNotifDismiss = useCallback(() => {
    snoozeNotificationPrompt();
    setShowNotifPrompt(false);
  }, []);

  const handlePlayAgain = useCallback(() => {
    // "Otra vez" repite las MISMAS ciudades de la última partida (modo aprendizaje)
    const sameCities = finalRounds.map(r => r.city);
    setReplayCities(sameCities.length > 0 ? sameCities : null);
    setRevengeCities(null);
    setChallengeSeed(null);
    setChallengerScore(null);
    gameKeyRef.current += 1;
    setPhase('countdown');
  }, [finalRounds]);
  // "Nueva partida" desde el cierre: mismas condiciones, ciudades nuevas (consume vida como un inicio normal)
  const handleNewGame = useCallback(() => {
    if (!consumeLife()) { setShowNoLives(true); return; }
    setReplayCities(null);
    setRevengeCities(null);
    setChallengeSeed(null);
    setChallengerScore(null);
    setActiveChallenge(null); // tras un reto, "Nueva partida" es una partida normal
    newGameSeed();
    gameKeyRef.current += 1;
    setPhase('countdown');
  }, []);
  // Cancelar durante la cuenta regresiva / aviso de giro: la partida no empezo → se devuelve la vida
  const handleCancelCountdown = useCallback(() => {
    if (!isTraining) addLives(1);
    setChallengeSeed(null);
    setChallengerScore(null);
    setIsTraining(false); setRevengeCities(null); setReplayCities(null); setActiveChallenge(null);
    setPhase('home'); window.scrollTo(0, 0); navigate('/', { replace: true });
  }, [isTraining, navigate]);

  // ── F3: retos asincrónicos ──
  const handleFriends = useCallback(() => { setPhase('friends'); window.scrollTo(0, 0); }, []);
  const handleChallengeCreated = useCallback((ch: Challenge) => { setChallengeSource({ type: 'challenge', challenge: ch }); setPhase('challenge'); window.scrollTo(0, 0); }, []);
  const handleOpenChallengeCode = useCallback((code: string) => { setChallengeSource({ type: 'code', code }); setPhase('challenge'); window.scrollTo(0, 0); }, []);
  const handlePlayChallenge = useCallback((ch: Challenge) => {
    unlockAudio();
    if (!consumeLife()) { setShowNoLives(true); return; }
    setIsTraining(false); setIsSpeedDemon(false); setRevengeCities(null); setReplayCities(null);
    setChallengeSeed(null); setChallengerScore(null);
    setDifficulty(ch.difficulty);
    setGameMode(ch.mode);
    setActiveChallenge(ch);
    setChallengeSource({ type: 'challenge', challenge: ch });
    trackGameStart(ch.mode, ch.difficulty);
    gameKeyRef.current += 1;
    countdownNextRef.current = 'playing';
    setPhase('countdown');
  }, []);
  const handleViewChallenge = useCallback(() => { setActiveChallenge(null); setPhase('challenge'); window.scrollTo(0, 0); }, []);
  const handleMyChallenges = useCallback(() => { setActiveChallenge(null); setPhase('my-challenges'); window.scrollTo(0, 0); }, []);
  const handleOpenMyChallenge = useCallback((item: MyChallenge) => { setChallengeSource({ type: 'code', code: item.code }); setPhase('challenge'); window.scrollTo(0, 0); }, []);
  const [rematchBusy, setRematchBusy] = useState(false);
  // Revancha (F4): mismo rival y condiciones, ciudades nuevas; el rival la recibe en Mis retos
  const handleRematch = useCallback(async (parent: ChallengeDetail) => {
    if (rematchBusy) return;
    setRematchBusy(true);
    try {
      const ch = await createChallenge({ mode: parent.mode, difficulty: parent.difficulty, requestId: `rematch-${parent.id}`, parentId: parent.id, excludeCities: parent.cities.map(c => c.name) });
      setChallengeSource({ type: 'challenge', challenge: ch });
      setPhase('challenge'); window.scrollTo(0, 0);
    } catch { /* la pantalla del reto muestra el error si se reintenta */ }
    finally { setRematchBusy(false); }
  }, [rematchBusy]);
  const handleRevenge = useCallback((rounds: RoundResult[]) => {
    // Pick worst 5 rounds (lowest score) — one-time only
    const worst = [...rounds].sort((a, b) => a.totalPoints - b.totalPoints).slice(0, 5);
    setOriginalWorstScores(worst.map(r => r.totalPoints));
    setRevengeCities(worst.map(r => r.city));
    setRevengeUsed(true);
    gameKeyRef.current += 1;
    setPhase('countdown');
  }, []);
  const handleGoHome = useCallback(() => { setIsTraining(false); setRevengeCities(null); setReplayCities(null); setActiveChallenge(null); setPhase('home'); window.scrollTo(0, 0); navigate('/', { replace: true }); }, [navigate]);
  const handleOpenStore = useCallback(() => { trackStoreView(); setPhase('store'); }, []);
  const handleOpenProfile = useCallback(() => { setProfileTab('overview'); setPhase('profile'); }, []);
  const handleOpenSettings = useCallback(() => setPhase('settings'), []);
  // El engranaje de ScreenHeader (Tienda, Perfil, retos…) pide abrir Ajustes con un evento global
  useEffect(() => {
    const open = () => setPhase('settings');
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);
  // El chip 🔥 (Inicio, barra, cierre del diario) abre la pantalla de la racha
  useEffect(() => {
    const open = () => { window.scrollTo(0, 0); setPhase('streak'); };
    window.addEventListener(OPEN_STREAK_EVENT, open);
    return () => window.removeEventListener(OPEN_STREAK_EVENT, open);
  }, []);
  // Racha perdida: pantalla empática una vez por racha (cuenta como la ventana de esta visita al inicio)
  useEffect(() => {
    if (phase !== 'home') return;
    let alive = true;
    const id = setTimeout(async () => {
      const st = (await fetchDailyStatus()) ?? getCachedDailyStatus();
      if (!alive || !st || st.lost_streak < 2 || !st.lost_on) return;
      try { if (localStorage.getItem('geospeed_streak_lost_seen') === st.lost_on) return; } catch { return; }
      if (homeInterruptionShown() || showNoLivesRef.current) return;
      markHomeInterruption();
      setStreakLost({ lost: st.lost_streak, best: st.best_streak, on: st.lost_on });
    }, 900);
    return () => { alive = false; clearTimeout(id); };
  }, [phase]);
  const closeStreakLost = useCallback(() => {
    setStreakLost((s) => { if (s) { try { localStorage.setItem('geospeed_streak_lost_seen', s.on); } catch { /* sin almacenamiento */ } } return null; });
  }, []);
  const handleMoreModes = useCallback(() => { window.scrollTo(0, 0); setPhase('more-modes'); }, []);
  const handleHowTo = useCallback(() => { window.scrollTo(0, 0); setPhase('howto'); }, []);
  // Tarjeta del Inicio → presentación del Desafío diario (maqueta); JUGAR DESAFÍO llama a handleDailyChallenge
  const handleDailyIntro = useCallback(() => { window.scrollTo(0, 0); setPhase('daily-intro'); }, []);
  const handleOpenHistory = useCallback(() => { setPhase('history'); window.scrollTo(0, 0); }, []);
  const handleOpenRanking = useCallback(() => { setPhase('ranking'); window.scrollTo(0, 0); }, []);
  const handleWorldChallenge = useCallback(() => { unlockAudio(); gameKeyRef.current += 1; setPhase('wc-playing'); }, []);
  const handleOpenBattlePass = useCallback(() => setPhase('battlepass'), []);

  // Barra de navegación persistente (Inicio · Progreso · Tienda · Pass · Perfil)
  const showNav = NAV_PHASES.includes(phase);
  const activeNavTab: NavTab | null =
    phase === 'home' || phase === 'daily-intro' || phase === 'more-modes' || phase === 'howto' ? 'home'
    : phase === 'store' ? 'store'
    : phase === 'battlepass' ? 'pass'
    : phase === 'history' || phase === 'ranking' ? 'progress'
    : phase === 'profile' ? (profileTab === 'history' ? 'progress' : 'profile')
    : null;
  const handleNav = useCallback((tab: NavTab) => {
    window.scrollTo(0, 0);
    switch (tab) {
      case 'home': handleGoHome(); break;
      case 'progress': setPhase('history'); window.scrollTo(0, 0); break;
      case 'store': handleOpenStore(); break;
      case 'pass': handleOpenBattlePass(); break;
      case 'profile': setProfileTab('overview'); setPhase('profile'); break;
    }
  }, [handleGoHome, handleOpenStore, handleOpenBattlePass]);

  const handleMultiplayer = useCallback(() => setPhase('mp-lobby'), []);
  const handleSpectate = useCallback(async (code: string) => {
    // Find room by code to get the ID
    const { data } = await (supabase
      .from('game_rooms_public' as any)
      .select('id')
      .eq('code', code.toUpperCase())
      .single() as any);
    if (data?.id) {
      setSpectateRoomId(data.id);
      setPhase('mp-spectate');
    }
  }, []);
  const handleTimeAttack = useCallback(() => {
    unlockAudio();
    if (!consumeLife()) { setShowNoLives(true); return; }
    setPhase('ta-select');
  }, []);
  const handleDailyChallenge = useCallback(() => {
    unlockAudio();
    if (!consumeLife()) { setShowNoLives(true); return; }
    setDifficulty('medium');
    setGameMode('world');
    setIsTraining(false);
    setIsSpeedDemon(false);
    const day = gameDay();
    dailyRunRef.current = { day, no: dailyNumber(day), seed: dailySeed(day) };
    setDailyFinish(null);
    setDailyAfter(null);
    gameSeedRef.current = dailyRunRef.current.seed; // "Reta a un amigo" tras el Diario comparte las ciudades del día
    gameKeyRef.current += 1;
    countdownNextRef.current = 'daily'; // el Diario ahora muestra la cuenta regresiva primero
    setPhase('countdown');
  }, []);


  const handleStartTraining = useCallback(() => {
    unlockAudio();
    setIsTraining(true);
    setIsSpeedDemon(false);
    setReplayCities(null);
    newGameSeed();
    setDifficulty('basic');
    setGameMode('world');
    gameKeyRef.current += 1;
    setPhase('countdown');
  }, [isMobile]);

  const handleSpeedDemon = useCallback(() => {
    unlockAudio();
    if (!consumeLife()) { setShowNoLives(true); return; }
    setIsTraining(false);
    setIsSpeedDemon(true);
    setReplayCities(null);
    newGameSeed();
    setDifficulty('basic');
    setGameMode('world');
    gameKeyRef.current += 1;
    setPhase('countdown');
  }, []);

  // ── Challenge a Friend ──
  // Usa la semilla REAL de la partida que acaba de jugarse: el amigo recibe las mismas ciudades.
  const generateChallengeLink = useCallback((score: number) => {
    const seed = gameSeedRef.current;
    // Clean URL: /challenge/SEED?d=difficulty&m=mode&s=score
    const params = new URLSearchParams({ d: difficulty, m: gameMode, s: String(score) });
    return `${window.location.origin}/challenge/${seed}?${params.toString()}`;
  }, [difficulty, gameMode]);

  const handleShareChallenge = useCallback(async () => {
    const link = generateChallengeLink(finalScore);
    const text = t('challenge_shareText', { score: finalScore.toLocaleString(appNumberLocale()) });
    if (navigator.share) {
      try {
        await navigator.share({ title: 'GeoSpeed Challenge', text, url: link });
      } catch (_) {}
    } else {
      await navigator.clipboard?.writeText(`${text}\n${link}`);
    }
  }, [finalScore, generateChallengeLink, t]);

  /** Generate a shareable daily challenge URL */
  const getDailyShareLink = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return `${window.location.origin}/daily/${today}`;
  }, []);

  // Parse challenge URL on mount (supports both old ?ch= query params and new /challenge/:seed route)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Old format: /?ch=123&d=easy&m=world&s=5000
    const ch = params.get('ch');
    // New format: /challenge/123?d=easy&m=world&s=5000
    const seedFromRoute = deepLink?.type === 'challenge' ? routeParams.seed : null;
    const seed = ch || seedFromRoute;
    const d = params.get('d');
    const m = params.get('m');
    const s = params.get('s');
    if (seed) {
      setChallengeSeed(Number(seed));
      if (d && ['basic', 'easy', 'medium', 'hard'].includes(d)) setDifficulty(d as Difficulty);
      if (m) setGameMode(m as GameMode);
      if (s) setChallengerScore(Number(s));
      // Clean URL without reloading
      window.history.replaceState({}, '', '/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start challenge after splash completes (query-param or deep link)
  useEffect(() => {
    // Una sola vez por enlace: antes, al volver al inicio el mismo reto arrancaba otra vez (o salía
    // "sin vidas" en cada visita al inicio)
    if (challengeSeed !== null && phase === 'home' && autoStartedSeedRef.current !== challengeSeed) {
      autoStartedSeedRef.current = challengeSeed;
      unlockAudio();
      if (!consumeLife()) { setShowNoLives(true); return; }
      setIsTraining(false);
      setIsSpeedDemon(false);
      setReplayCities(null);
      gameSeedRef.current = challengeSeed;
      gameKeyRef.current += 1;
      setPhase('countdown');
    }
  }, [challengeSeed, phase]);

  // ── Deep link processing — /daily, /challenge/:seed, /duel/:code ──
  const deepLinkProcessed = useRef(false);
  useEffect(() => {
    if (phase !== 'home' || deepLinkProcessed.current || !deepLink) return;
    deepLinkProcessed.current = true;

    if (deepLink.type === 'dailyInvite') {
      // /d/<número>?r=Juanjo&h=8&t=42&g=… → presentación del diario de hoy con el resultado del amigo
      const no = Number(routeParams.n);
      const invite = parseDailyInvite(no, window.location.search);
      setDailyInvite(invite);
      trackEvent('daily_link_open', { daily_no: no, today: dailyNumber(gameDay()) });
      setPhase('daily-intro');
      navigate('/', { replace: true });
      return;
    }
    if (deepLink.type === 'daily') {
      // /daily or /daily/2026-05-12 → start daily challenge
      unlockAudio();
      if (!consumeLife()) { setShowNoLives(true); navigate('/', { replace: true }); return; }
      setDifficulty('medium');
      setGameMode('world');
      setPhase('daily');
      // Don't navigate away — keep URL clean after game
    } else if (deepLink.type === 'challenge' && routeParams.seed) {
      // /challenge/123456 → start challenge with seed
      const seed = Number(routeParams.seed);
      if (!isNaN(seed)) {
        setChallengeSeed(seed);
        // challengeSeed effect will auto-start the game
      }
      navigate('/', { replace: true });
    } else if (deepLink.type === 'reto' && routeParams.code) {
      // /reto/ABC12 → invitación al reto (D3: el código se valida en el servidor)
      setChallengeSource({ type: 'code', code: routeParams.code.toUpperCase() });
      setPhase('challenge');
      navigate('/', { replace: true });
    } else if (deepLink.type === 'duel' && routeParams.code) {
      // /duel/ABC12 → go to multiplayer lobby with pre-filled code
      setPhase('mp-lobby');
      navigate('/', { replace: true });
    }
  }, [phase, deepLink, routeParams, navigate]);

  const handleRoomReady = useCallback((room: GameRoom, isHost: boolean) => {
    setMpRoom(room);
    setMpIsHost(isHost);
    setPhase('mp-waiting');
  }, []);

  const handleMpGameStart = useCallback((room: GameRoom) => {
    setMpRoom(room);
    setDifficulty(room.difficulty as Difficulty);
    setGameMode(room.mode as GameMode);
    setPhase('mp-playing');
  }, []);

  const handleMpGameOver = useCallback((rounds: RoundResult[], reason: 'timeout' | 'complete') => {
    const total = rounds.reduce((s, r) => s + r.totalPoints, 0);
    setFinalRounds(rounds);
    setFinalScore(total);
    // F1: el duelo también queda en el historial del servidor (antes no se registraba)
    saveGameResult({
      gameType: 'duel',
      mode: mpRoomRef.current?.mode ?? 'world',
      difficulty: mpRoomRef.current?.difficulty ?? 'easy',
      score: total,
      roundsPlayed: rounds.length,
      roundsTotal: 13,
      avgDistanceKm: avgDistanceOf(rounds),
      endReason: reason,
      seed: mpRoomRef.current?.seed ?? null,
      rounds: roundsFromResults(rounds),
    });
    if (mpRoomRef.current) {
      // Save score to DB via edge function (broadcast is handled by MultiplayerResultScreen)
      updateRoomScore(mpRoomRef.current.id, mpIsHost, total, rounds.length);
      // Optimistic local update so the result screen shows correct score immediately
      setMpRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(mpIsHost
            ? { host_score: total, host_finished: true }
            : { guest_score: total, guest_finished: true }),
          current_round: rounds.length,
        };
      });
    }
    // Go to result screen immediately — MultiplayerResultScreen waits for opponentFinished flag
    setPhase('mp-final');
  }, [mpIsHost]);

  const handleMpPlayAgain = useCallback(() => setPhase('mp-lobby'), []);

  const modeLabel = t(`mode_${gameMode}` as any) || MODE_CONFIG.find(m => m.key === gameMode)?.label || 'World';
  const diffLabel = t(`diff_${difficulty}` as any) || difficultyLabelsEs[difficulty];

  // --- Render ---
  const renderPhase = () => {
    if (phase === 'splash') {
      return <SplashScreen onComplete={() => setPhase('home')} />;
    }

    if (phase === 'store') {
      return <StoreScreen onClose={handleGoHome} />;
    }

    if (phase === 'battlepass') {
      return <BattlePassScreen onClose={handleGoHome} onOpenStore={handleOpenStore} />;
    }

    if (phase === 'profile') {
      return <ProfileScreen key={profileTab} onBack={handleGoHome} initialTab={profileTab} onMyChallenges={handleMyChallenges} onOpenHistory={handleOpenHistory} onOpenRanking={handleOpenRanking} />;
    }

    if (phase === 'history') {
      return <HistoryScreen onBack={handleGoHome} onPlay={() => handleSelectDifficulty(difficulty, gameMode)} onMyChallenges={handleMyChallenges} />;
    }

    if (phase === 'ranking') {
      return <RankingScreen initialMode={gameMode} initialDifficulty={difficulty} onBack={handleGoHome} onSignIn={() => navigate('/auth')} />;
    }

    if (phase === 'settings') {
      return <SettingsScreen onBack={handleGoHome} onHowToPlay={handleHowTo} />;
    }

    if (phase === 'more-modes') {
      return <MoreModesScreen onBack={handleGoHome} onTimeAttack={handleTimeAttack} onSpeedDemon={handleSpeedDemon} onWorldChallenge={handleWorldChallenge} />;
    }

    if (phase === 'daily-intro') {
      return <DailyIntroScreen onBack={handleGoHome} onPlay={handleDailyChallenge} invite={dailyInvite} />;
    }

    if (phase === 'streak') {
      return <StreakScreen onBack={handleGoHome} onPlayDaily={handleDailyIntro} />;
    }

    if (phase === 'howto') {
      return <HowToPlayScreen onBack={handleGoHome} onStartTraining={handleStartTraining} />;
    }

    if (phase === 'onboarding') {
      return <OnboardingGame
        onComplete={() => {
          // "¡Jugar de verdad!" / "Saltar práctica": aquí se cobra la vida de la partida real
          if (!consumeLife()) { setShowNoLives(true); setPhase('home'); return; }
          try { localStorage.setItem('geospeed_tutorial_seen', 'true'); } catch { /* sin almacenamiento */ }
          trackGameStart(gameMode, difficulty);
          gameKeyRef.current += 1;
          setPhase('countdown');
        }}
        onGoHome={handleGoHome}
      />;
    }

    if (phase === 'tutorial') {
      return <TutorialOverlay onComplete={() => {
        gameKeyRef.current += 1;
        setPhase('countdown');
      }} />;
    }

    // 'rotate' phase is no longer used — handled via overlay (showRotateOverlay)

    if (phase === 'countdown') {
      return (
        <CountdownIntro
          count={countdown}
          label={activeChallenge ? `⚔️ ${t('ch_countdownLabel')} · ${modeLabel} · ${diffLabel}` : isTraining ? t('game_training') : isSpeedDemon ? `👹 ${t('home_speedDemon')} · 5s` : `${countdownNextRef.current === 'daily' ? t('home_dailyCard') : t('countdown_classic')} · ${modeLabel} · ${diffLabel}`}
          onCancel={handleCancelCountdown}
          running={!showRotateOverlay}
        />
      );
    }

    if (phase === 'ta-select') {
      return (
        <div className="modal-layer z-50 game-bg">
          <div className="modal-panel bg-card/95 backdrop-blur-md border border-border rounded-2xl p-5 sm:p-6 md:p-8 short:p-4 max-w-md w-full shadow-2xl text-center animate-fade-in-up">
            {/* Logo + nombre */}
            <div className="flex items-center justify-center gap-2.5 mb-3 short:hidden">
              <img src="/mascot/explorer-logo.webp" alt="GeoSpeed" className="w-16 sm:w-20 short:w-10 object-contain" />
              <Wordmark size="md" />
            </div>
            <h2 className="text-2xl sm:text-3xl short:text-xl font-black mb-1 short:mb-0" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>⚡ {t('ta_title').toUpperCase()}</h2>
            <p className="text-muted-foreground text-[10px] sm:text-xs mb-4 sm:mb-6 short:mb-2 italic">{t('ta_subtitle')}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 short:mb-1.5 uppercase tracking-widest">{t('ta_selectDifficulty')}</p>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-3 sm:mb-4 short:mb-2">
              {MODE_CONFIG.map(m => (
                <button
                  key={m.key}
                  onClick={() => setGameMode(m.key)}
                  className={`flex flex-col items-center gap-1 p-2 short:p-1.5 short:gap-0.5 rounded-lg border-2 transition-all active:scale-[0.97] ${
                    gameMode === m.key ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/40'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className={`text-xs font-bold ${gameMode === m.key ? 'text-primary' : 'text-foreground'}`}>{m.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mb-4 sm:mb-6 short:mb-3">
              {(['basic', 'easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold border-2 transition-all active:scale-[0.97] ${
                    difficulty === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                  }`}
                >
                  {t(`diff_${d}` as any) || difficultyLabelsEs[d]}
                </button>
              ))}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button onClick={handleGoHome} className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]">
                {t('back').toUpperCase()}
              </button>
              <button
                onClick={() => { gameKeyRef.current += 1; setPhase('ta-playing'); }}
                className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-[0.97]"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 5px 0 hsl(var(--primary-deep))' }}
              >
                {t('ta_start')} ⚡
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (phase === 'wc-playing') {
      return (
        <WorldChallengeScreen
          key={`wc-${gameKeyRef.current}`}
          onExit={handleGoHome}
          onNoLives={() => setShowNoLives(true)}
          musicMuted={isMusicMuted}
          onToggleMusic={toggleMusic}
        />
      );
    }

    if (phase === 'ta-playing') {
      return (
        <TimeAttackScreen
          key={`ta-${gameKeyRef.current}`}
          difficulty={difficulty}
          gameMode={gameMode}
          onExit={handleGoHome}
          musicMuted={isMusicMuted}
          onToggleMusic={toggleMusic}
          onGameOver={(result) => {
            setTaResult(result);
            setTaPrevBest(Math.max(0, ...getGameHistory().filter(h => h.type === 'timeattack' && h.v === SCORING_VERSION).map(h => h.score)));
            const avgD = result.rounds.length > 0 ? result.rounds.reduce((s, r) => s + r.distance, 0) / result.rounds.length : 0;
            addGameHistory({
              date: new Date().toISOString(),
              score: result.totalScore,
              rounds: result.rounds.length,
              difficulty,
              mode: gameMode,
              avgDistance: Math.round(avgD),
              type: 'timeattack',
            });
            saveGameResult({
              gameType: 'timeattack',
              mode: gameMode,
              difficulty,
              score: result.totalScore,
              roundsPlayed: result.rounds.length,
              roundsTotal: result.rounds.length,
              avgDistanceKm: avgDistanceOf(result.rounds),
              endReason: 'complete',
              rounds: roundsFromTimeAttack(result.rounds),
            });
            setPhase('ta-final');
          }}
        />
      );
    }

    if (phase === 'ta-final' && taResult) {
      return (
        <FinalResultScreen
          musicMuted={isMusicMuted}
          onToggleMusic={toggleMusic}
          variant="timeattack"
          rounds={taResult.rounds}
          totalScore={taResult.totalScore}
          difficulty={difficulty}
          mode={gameMode}
          reason="complete"
          totalRounds={taResult.rounds.length}
          previousBestOverride={taPrevBest}
          onNewGame={() => { gameKeyRef.current += 1; setPhase('ta-playing'); }}
          onGoHome={handleGoHome}
          onOpenStore={handleOpenStore}
        />
      );
    }

    if (phase === 'friends') {
      return (
        <FriendsScreen
          initialMode={gameMode}
          initialDifficulty={difficulty}
          onBack={handleGoHome}
          onCreated={handleChallengeCreated}
          onOpenCode={handleOpenChallengeCode}
          onSignIn={() => navigate('/auth')}
          onLiveDuel={handleMultiplayer}
        />
      );
    }

    if (phase === 'challenge' && challengeSource) {
      return (
        <ChallengeScreen
          key={challengeSource.type === 'code' ? challengeSource.code : challengeSource.challenge.id}
          source={challengeSource}
          onPlay={handlePlayChallenge}
          onBack={handleGoHome}
          onSignIn={() => navigate('/auth')}
          onCreateAnother={handleFriends}
          onMyChallenges={handleMyChallenges}
          onRematch={handleRematch}
        />
      );
    }

    if (phase === 'my-challenges') {
      return <MyChallengesScreen onBack={handleGoHome} onOpen={handleOpenMyChallenge} onCreate={handleFriends} onSignIn={() => navigate('/auth')} />;
    }

    if (phase === 'mp-lobby') {
      return <MultiplayerLobby onRoomReady={handleRoomReady} onBack={handleGoHome} onSpectate={handleSpectate} />;
    }

    if (phase === 'mp-spectate' && spectateRoomId) {
      return <SpectatorScreen roomId={spectateRoomId} onBack={handleGoHome} />;
    }

    if (phase === 'mp-waiting' && mpRoom) {
      return <WaitingRoom room={mpRoom} isHost={mpIsHost} onGameStart={handleMpGameStart} onBack={handleGoHome} />;
    }

    if (phase === 'mp-playing') {
      return (
        <GameScreen
          key={`mp-${mpRoom?.id}`}
          difficulty={difficulty}
          gameMode={gameMode}
          onRoundComplete={() => {}}
          onExit={handleGoHome}
          musicMuted={isMusicMuted}
          onToggleMusic={toggleMusic}
          onGameOver={handleMpGameOver}
          seed={mpRoom?.seed}
        />
      );
    }

    if (phase === 'mp-final' && mpRoom) {
      return <MultiplayerResultScreen room={mpRoom} isHost={mpIsHost} onPlayAgain={handleMpPlayAgain} onGoHome={handleGoHome} onRoomUpdate={setMpRoom} />;
    }

    if (phase === 'daily') {
      const run = dailyRunRef.current ?? { day: gameDay(), no: dailyNumber(gameDay()), seed: getDailySeed() };
      return (
        <GameScreen
          key={`daily-${run.seed}`}
          difficulty="medium"
          gameMode="world"
          onRoundComplete={() => {}}
          onExit={handleGoHome}
          musicMuted={isMusicMuted}
          onToggleMusic={toggleMusic}
          onGameOver={(rounds, reason) => {
            const total = rounds.reduce((s, r) => s + r.totalPoints, 0);
            const avgDist = rounds.length > 0 ? rounds.reduce((s, r) => s + r.distance, 0) / rounds.length : 0;
            setFinalRounds(rounds);
            setFinalScore(total);
            setEndReason(reason);
            setDifficulty('medium');
            setGameMode('world');
            addGameHistory({
              date: new Date().toISOString(),
              score: total,
              rounds: rounds.length,
              difficulty: 'medium',
              mode: 'world',
              avgDistance: Math.round(avgDist),
              type: 'daily',
            });
            // Mejor puntaje del día (local) + 1 vida la primera vez que se termina el diario de hoy
            const todayKey = dailyBestKey(run.day);
            const prevBest = parseInt(localStorage.getItem(todayKey) || '0', 10);
            if (!prevBest) addLives(1);
            if (total > prevBest) localStorage.setItem(todayKey, total.toString());
            // Cierre: cuadritos al instante; la racha llega del servidor al guardar
            const grid = gridFromRounds(rounds, 13);
            setDailyFinish({
              dailyNo: run.no,
              hits: rounds.filter((r) => r.basePoints >= 400).length,
              total: 13,
              timeMs: Math.round(rounds.reduce((s, r) => s + (r.timeExact ?? r.timeUsed), 0) * 1000),
              grid,
            });
            setDailyAfter(null);
            trackEvent('daily_complete', { daily_no: run.no, hits: rounds.filter((r) => r.basePoints >= 400).length, from_link: !!dailyInvite });
            saveGameResult({
              gameType: 'daily',
              mode: 'world',
              difficulty: 'medium',
              score: total,
              roundsPlayed: rounds.length,
              roundsTotal: 13,
              avgDistanceKm: avgDist,
              endReason: reason,
              seed: run.seed,
              dailyNo: run.no,
              rounds: roundsFromResults(rounds),
            }).then(() => fetchDailyStatus()).then((st) => {
              setDailyAfter(st);
              // App instalada: tras el primer diario con racha, pedir el permiso del recordatorio (una vez)
              if (st && st.current_streak >= 1) askNativeReminderPermissionOnce();
            });
            setPhase('final');
          }}
          seed={run.seed}
        />
      );
    }

    if (phase === 'playing') {
      return (
        <GameScreen
          key={`classic-${gameKeyRef.current}`}
          difficulty={difficulty}
          gameMode={gameMode}
          onRoundComplete={() => {}}
          onExit={handleGoHome}
          musicMuted={isMusicMuted}
          onToggleMusic={toggleMusic}
          onGameOver={handleGameOver}
          isTraining={isTraining}
          {...(isSpeedDemon ? { maxTimeOverride: 5, totalRoundsOverride: 30 } : {})}
          {...(activeChallenge
            ? { citiesOverride: challengeCitiesToGame(activeChallenge), totalRoundsOverride: activeChallenge.rounds_total, maxTimeOverride: activeChallenge.seconds_per_round }
            : revengeCities ? { citiesOverride: revengeCities, totalRoundsOverride: revengeCities.length } : replayCities ? { citiesOverride: replayCities, totalRoundsOverride: replayCities.length } : {})}
          seed={gameSeedRef.current}
        />
      );
    }

    if (phase === 'final') {
      // "Reta a un amigo" solo cuando la partida salió de una semilla reproducible
      // (no tras "Otra vez" ni tras la revancha, que juegan listas fijas sin semilla).
      const canShareChallenge = !replayCities && !revengeUsed && !isTraining && !activeChallenge;
      const playedChallenge = activeChallenge;
      return (
        <FinalResultScreen
          noOffers={isTraining}
          musicMuted={isMusicMuted}
          onToggleMusic={toggleMusic}
          rounds={finalRounds}
          totalScore={finalScore}
          difficulty={difficulty}
          mode={gameMode}
          reason={endReason}
          onPlayAgain={playedChallenge ? undefined : handlePlayAgain}
          onNewGame={handleNewGame}
          onGoHome={handleGoHome}
          onRevenge={revengeUsed || activeChallenge ? undefined : handleRevenge}
          onShareChallenge={canShareChallenge && !dailyFinish ? handleFriends : undefined}
          onViewChallenge={playedChallenge ? handleViewChallenge : undefined}
          onOpenStore={handleOpenStore}
          challengerScore={challengerScore}
          totalRounds={isSpeedDemon ? 30 : isTraining ? 6 : 13}
          topPanel={dailyFinish ? (
            <DailyResultPanel
              result={dailyFinish}
              status={dailyAfter}
              invite={dailyInvite}
              playerName={authDisplayName || t('ch_you')}
              isGuest={!user || isAnonymousUser}
              onCreateAccount={() => navigate('/auth')}
            />
          ) : undefined}
        />
      );
    }

    return (
      <HomeScreen onStartGame={handleSelectDifficulty} onMultiplayer={handleFriends} onMyChallenges={handleMyChallenges} onTimeAttack={handleTimeAttack} onDailyChallenge={handleDailyIntro} onWorldChallenge={handleWorldChallenge} onStartTraining={handleStartTraining} onSpeedDemon={handleSpeedDemon} onOpenStore={handleOpenStore} onOpenProfile={handleOpenProfile} onOpenBattlePass={handleOpenBattlePass} onOpenSettings={handleOpenSettings} onOpenHistory={handleOpenHistory} onOpenRanking={handleOpenRanking} onMoreModes={handleMoreModes} onHowToPlay={handleHowTo} />
    );
  };

  // Preload game-critical chunks when user is on home screen
  useEffect(() => {
    if (phase === 'home') {
      // Warm up the GameScreen and WorldMapCanvas chunks so play start is instant
      import('@/components/game/GameScreen').catch(() => {});
      import('@/components/game/TimeAttackScreen').catch(() => {});
    }
  }, [phase]);

  // Phases with their own full-screen animations skip PhaseTransition
  const skipTransition = ['splash', 'countdown', 'tutorial', 'onboarding'].includes(phase);

  // Minimal loading fallback for lazy components
  const lazyFallback = (
    <div className="fixed inset-0 flex items-center justify-center game-bg">
      <div className="text-center animate-pulse">
        <img src="/mascot/explorer-logo.webp" alt="GeoSpeed" className="w-10 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    </div>
  );

  return (
    <>
      <PhaseErrorBoundary onReset={handleGoHome}>
        <Suspense fallback={lazyFallback}>
          <div className={showNav ? 'with-app-nav' : undefined}>
            {skipTransition ? renderPhase() : (
              <PhaseTransition phaseKey={phase}>
                {renderPhase()}
              </PhaseTransition>
            )}
          </div>
        </Suspense>
      </PhaseErrorBoundary>
      {showNav && <AppNav active={activeNavTab} onNavigate={handleNav} onOpenSettings={handleOpenSettings} />}
      {showNoLives && <NoLivesModal onClose={() => setShowNoLives(false)} onOpenStore={() => { setShowNoLives(false); handleOpenStore(); }} />}
      {streakLost && phase === 'home' && (
        <StreakLostModal lost={streakLost.lost} best={streakLost.best} onClose={closeStreakLost} onPlay={() => { closeStreakLost(); handleDailyIntro(); }} />
      )}

      {/* Notification permission prompt — shown after first game */}
      {showNotifPrompt && (
        <div className="modal-layer z-[80] bg-black/50 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-label={t('notif_title')}>
          <div className="modal-panel bg-card border border-border rounded-2xl p-5 short:p-4 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <p className="text-2xl text-center mb-2">🔔</p>
            <p className="text-sm font-bold text-center mb-1" style={{ color: 'hsl(var(--primary))' }}>{t('notif_title')}</p>
            <p className="text-xs text-muted-foreground text-center mb-4">
              {t('notif_desc')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleNotifAccept}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97]"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 5px 0 hsl(var(--primary-deep))' }}
              >
                {t('notif_yes')}
              </button>
              <button
                onClick={handleNotifDismiss}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm border border-border transition-all active:scale-[0.97] hover:bg-muted"
              >
                {t('notif_no')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rotate overlay — shown on top of game when portrait during gameplay */}
      {showRotateOverlay && <RotateOverlay t={t} beforeCountdown={phase === 'countdown'} onBack={phase === 'countdown' ? handleCancelCountdown : handleGoHome} />}

      {/* Floating music toggle — en partida; fuera de ella la música se controla desde Ajustes */}
      {phase !== 'splash' && !showNav && !GAME_SCREEN_PHASES.includes(phase) && phase !== 'final' && phase !== 'ta-final' && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 shadow-lg"
          style={{
            background: 'hsl(var(--background) / 0.7)',
            borderColor: 'hsl(var(--primary) / 0.3)',
          }}
          aria-label={isMusicMuted ? t('music_on') : t('music_off')}
          title={isMusicMuted ? t('music_on') : t('music_off')}
        >
          <span className="text-base">{isMusicMuted ? '🔇' : '🎵'}</span>
        </button>
      )}
    </>
  );
};

export default Index;
