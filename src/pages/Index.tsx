import { useState, useCallback, useEffect, useRef, lazy, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistance, addGameHistory } from '@/lib/gameUtils';
import { type City, type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import { type RoundResult } from '@/components/game/GameScreen';
import { type TimeAttackResult } from '@/components/game/TimeAttackScreen';

// ── Eager loads (critical path — always needed) ──
import HomeScreen from '@/components/game/HomeScreen';
import SplashScreen from '@/components/game/SplashScreen';
import NoLivesModal from '@/components/game/NoLivesModal';

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
  }
  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center game-bg p-6 text-center">
          <img src="/logo.png" alt="GeoSpeed" className="w-14 mb-4 opacity-60" />
          <h2 className="text-xl font-black mb-2" style={{ color: 'hsl(var(--primary))' }}>
            Algo salió mal
          </h2>
          <p className="text-sm text-muted-foreground mb-1 max-w-xs">
            {this.state.error.message || 'Error desconocido'}
          </p>
          <p className="text-xs text-muted-foreground/60 mb-6 max-w-xs break-all">
            {this.state.error.name}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); this.props.onReset(); }}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            ← VOLVER AL INICIO
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Lazy loads (loaded on demand per phase) ──
const GameScreen = lazy(() => import('@/components/game/GameScreen'));
const ProfileScreen = lazy(() => import('@/components/game/ProfileScreen'));
const FinalResultScreen = lazy(() => import('@/components/game/FinalResultScreen'));
const MultiplayerLobby = lazy(() => import('@/components/game/MultiplayerLobby'));
const WaitingRoom = lazy(() => import('@/components/game/WaitingRoom'));
const MultiplayerResultScreen = lazy(() => import('@/components/game/MultiplayerResultScreen'));
const TimeAttackScreen = lazy(() => import('@/components/game/TimeAttackScreen'));
const TutorialOverlay = lazy(() => import('@/components/game/TutorialOverlay'));
const StoreScreen = lazy(() => import('@/components/game/StoreScreen'));
const SpectatorScreen = lazy(() => import('@/components/game/SpectatorScreen'));
import { type GameRoom, updateRoomScore, subscribeToRoom, fetchRoom } from '@/lib/multiplayerUtils';
import { supabase } from '@/integrations/supabase/client';
import { consumeLife, getEnergy, addLives } from '@/lib/energySystem';
import { incrementGameCounter, shouldShowInterstitial } from '@/lib/premiumSystem';
import { showInterstitial, initAds } from '@/lib/adSystem';
import { syncAfterGame } from '@/lib/cloudSync';
import { checkStreak } from '@/lib/dailyStreak';
import { playCountdown, playGo, unlockAudio } from '@/lib/sounds';
import { hapticTap, hapticCelebration } from '@/lib/haptics';
import { useI18n } from '@/i18n';
import { useBackgroundMusic, type MusicTrack } from '@/hooks/useBackgroundMusic';
import {
  supportsNotifications,
  getPermission,
  hasBeenAsked,
  requestPermission,
  scheduleDailyReminder,
  scheduleStreakWarning,
  scheduleLivesRegenerated,
  startNotificationLoop,
} from '@/lib/notifications';

type Phase = 'splash' | 'home' | 'profile' | 'store' | 'tutorial' | 'countdown' | 'playing' | 'final' | 'mp-lobby' | 'mp-waiting' | 'mp-playing' | 'mp-final' | 'mp-spectate' | 'ta-select' | 'ta-playing' | 'ta-final' | 'daily';

// Generate a deterministic seed from today's date so all players get the same cities
function getDailySeed(): number {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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

const Index = () => {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>('splash');
  const [difficulty, setDifficulty] = useState<Difficulty>('basic');
  const [gameMode, setGameMode] = useState<GameMode>('world');
  const [finalRounds, setFinalRounds] = useState<RoundResult[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [endReason, setEndReason] = useState<'timeout' | 'complete'>('complete');
  const [taResult, setTaResult] = useState<TimeAttackResult | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [showNoLives, setShowNoLives] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [revengeCities, setRevengeCities] = useState<City[] | null>(null);
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
  // Overlay-based rotate screen — keeps game mounted so state is preserved
  const [showRotateOverlay, setShowRotateOverlay] = useState(false);

  // ── Background music — single track, always on from splash ──
  const { toggle: toggleMusic, muted: isMusicMuted } = useBackgroundMusic('on');

  // Initialize ads on mount
  useEffect(() => { initAds(); }, []);

  useEffect(() => { mpRoomRef.current = mpRoom; }, [mpRoom]);

  // Keep room subscription alive for the whole match lifecycle.
  // Only re-subscribe when the room ID changes, not when phase changes,
  // so we don't miss real-time updates during the mp-playing → mp-final transition.
  const mpPhaseActive = phase === 'mp-playing' || phase === 'mp-final';
  useEffect(() => {
    if (!mpPhaseActive || !mpRoom) return;
    const channel = subscribeToRoom(mpRoom.id, (updated) => {
      // Merge DB update with local state — preserve MY score/finished if I already
      // finished (optimistic update), so a race with the opponent's DB write
      // doesn't reset my score to 0.
      setMpRoom(prev => {
        if (!prev) return updated;
        const myScoreKey = mpIsHost ? 'host_score' : 'guest_score';
        const myFinishedKey = mpIsHost ? 'host_finished' : 'guest_finished';
        const iAlreadyFinished = prev[myFinishedKey];
        return {
          ...updated,
          // Keep my local score/finished if I already finished
          ...(iAlreadyFinished ? {
            [myScoreKey]: prev[myScoreKey],
            [myFinishedKey]: true,
          } : {}),
        };
      });
    });
    // Use removeChannel for proper cleanup — unsubscribe() alone leaves the
    // channel in Supabase's internal registry, blocking future resubscriptions.
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpRoom?.id, mpPhaseActive]);

  // Countdown logic — goes 3 → 2 → 1 → 0 (GO!) → start playing
  useEffect(() => {
    if (phase !== 'countdown') return;
    unlockAudio(); // Ensure AudioContext is running before any sounds
    setCountdown(3);
    playCountdown();
    hapticTap();
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          setPhase('playing');
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
  }, [phase]);

  const pendingStartRef = useRef<{ diff: Difficulty; mode: GameMode } | null>(null);

  const handleSelectDifficulty = useCallback((diff: Difficulty, mode: GameMode) => {
    unlockAudio(); // Pre-unlock audio on user gesture so sounds work on mobile
    if (!consumeLife()) {
      setShowNoLives(true);
      return;
    }
    setIsTraining(false);
    setIsSpeedDemon(false);
    setDifficulty(diff);
    setGameMode(mode);
    // Show tutorial overlay for first-time players
    const tutorialSeen = localStorage.getItem('geospeed_tutorial_seen');
    if (!tutorialSeen) {
      setPhase('tutorial');
      return;
    }
    gameKeyRef.current += 1;
    setPhase('countdown');
  }, [isMobile]);

  // Detect portrait rotation DURING gameplay → show overlay (game stays mounted)
  useEffect(() => {
    const playPhases: Phase[] = ['playing', 'ta-playing', 'mp-playing', 'daily'];
    if (!playPhases.includes(phase) || !isMobile) {
      // Outside gameplay: always hide overlay
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
  }, [phase, isMobile]);

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

    // Normal game — store original score for potential revenge
    setOriginalScore(total);
    setRevengeUsed(false);
    setFinalRounds(rounds);
    setFinalScore(total);
    setEndReason(reason);
    // Determine if this was a daily challenge
    const today = new Date().toISOString().split('T')[0];
    const isDailyGame = phase === 'daily' || (difficulty === 'medium' && gameMode === 'world');
    const dailyKey = `geospeed_daily_${today}`;

    addGameHistory({
      date: new Date().toISOString(),
      score: total,
      rounds: rounds.length,
      difficulty,
      mode: gameMode,
      avgDistance: Math.round(avgDist),
      type: isDailyGame && !localStorage.getItem(dailyKey) ? 'daily' : 'classic',
    });

    // Grant daily challenge bonus: +1 life (first completion only)
    if (isDailyGame && !localStorage.getItem(dailyKey)) {
      localStorage.setItem(dailyKey, String(total));
      addLives(1);
    }

    // Track game for ad cadence and sync to cloud
    incrementGameCounter();
    syncAfterGame();

    // Show interstitial ad between games (every 3 games for free users)
    if (shouldShowInterstitial()) {
      showInterstitial().finally(() => setPhase('final'));
    } else {
      setPhase('final');
    }
  }, [difficulty, gameMode, revengeCities, originalScore, originalWorstScores]);

  // ── Notifications: start check loop + schedule after each game ──
  useEffect(() => {
    startNotificationLoop();
  }, []);

  // After a game ends, schedule contextual notifications + offer permission
  useEffect(() => {
    if (phase !== 'final') return;

    // Schedule notifications if already granted
    if (getPermission() === 'granted') {
      scheduleDailyReminder();
      const streak = checkStreak();
      if (streak.currentStreak >= 2) {
        scheduleStreakWarning(streak.currentStreak);
      }
      const energy = getEnergy();
      if (energy.lives < energy.maxLives && energy.nextRegenMs > 0) {
        // Schedule for when ALL lives are full
        const msPerLife = 20 * 60 * 1000;
        const livesNeeded = energy.maxLives - energy.lives;
        const totalMs = energy.nextRegenMs + (livesNeeded - 1) * msPerLife;
        scheduleLivesRegenerated(totalMs);
      }
    } else if (supportsNotifications() && !hasBeenAsked()) {
      // Show prompt after first game only
      setTimeout(() => setShowNotifPrompt(true), 2000);
    }
  }, [phase]);

  const handleNotifAccept = useCallback(async () => {
    await requestPermission();
    setShowNotifPrompt(false);
    // Schedule immediately if granted
    if (getPermission() === 'granted') {
      scheduleDailyReminder();
      const streak = checkStreak();
      if (streak.currentStreak >= 2) scheduleStreakWarning(streak.currentStreak);
    }
  }, []);

  const handleNotifDismiss = useCallback(() => {
    setShowNotifPrompt(false);
  }, []);

  const handlePlayAgain = useCallback(() => { setRevengeCities(null); setChallengeSeed(null); setChallengerScore(null); gameKeyRef.current += 1; setPhase('countdown'); }, []);
  const handleRevenge = useCallback((rounds: RoundResult[]) => {
    // Pick worst 5 rounds (lowest score) — one-time only
    const worst = [...rounds].sort((a, b) => a.totalPoints - b.totalPoints).slice(0, 5);
    setOriginalWorstScores(worst.map(r => r.totalPoints));
    setRevengeCities(worst.map(r => r.city));
    setRevengeUsed(true);
    gameKeyRef.current += 1;
    setPhase('countdown');
  }, []);
  const handleGoHome = useCallback(() => { setIsTraining(false); setRevengeCities(null); setPhase('home'); window.scrollTo(0, 0); }, []);
  const handleOpenStore = useCallback(() => setPhase('store'), []);
  const handleOpenProfile = useCallback(() => setPhase('profile'), []);

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
    setPhase('daily');
  }, []);

  const [isSpeedDemon, setIsSpeedDemon] = useState(false);
  // Challenge a Friend state
  const [challengeSeed, setChallengeSeed] = useState<number | null>(null);
  const [challengerScore, setChallengerScore] = useState<number | null>(null);
  // Notification permission prompt
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  const handleStartTraining = useCallback(() => {
    unlockAudio();
    setIsTraining(true);
    setIsSpeedDemon(false);
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
    setDifficulty('basic');
    setGameMode('world');
    gameKeyRef.current += 1;
    setPhase('countdown');
  }, []);

  // ── Challenge a Friend ──
  const generateChallengeLink = useCallback((score: number) => {
    const seed = Math.floor(Math.random() * 1_000_000);
    const params = new URLSearchParams({
      ch: String(seed),
      d: difficulty,
      m: gameMode,
      s: String(score),
    });
    return `${window.location.origin}/?${params.toString()}`;
  }, [difficulty, gameMode]);

  const handleShareChallenge = useCallback(async () => {
    const link = generateChallengeLink(finalScore);
    const text = `🌍 GeoSpeed Challenge: Hice ${finalScore.toLocaleString()} pts. ¿Puedes superarme? ¡Juega las mismas ciudades!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'GeoSpeed Challenge', text, url: link });
      } catch (_) {}
    } else {
      await navigator.clipboard?.writeText(`${text}\n${link}`);
    }
  }, [finalScore, generateChallengeLink]);

  // Parse challenge URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ch = params.get('ch');
    const d = params.get('d');
    const m = params.get('m');
    const s = params.get('s');
    if (ch) {
      setChallengeSeed(Number(ch));
      if (d && ['basic', 'easy', 'medium', 'hard'].includes(d)) setDifficulty(d as Difficulty);
      if (m) setGameMode(m as GameMode);
      if (s) setChallengerScore(Number(s));
      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Auto-start challenge after splash completes
  useEffect(() => {
    if (challengeSeed !== null && phase === 'home') {
      unlockAudio();
      if (!consumeLife()) { setShowNoLives(true); return; }
      setIsTraining(false);
      setIsSpeedDemon(false);
      gameKeyRef.current += 1;
      setPhase('countdown');
    }
  }, [challengeSeed, phase]);

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

    if (phase === 'profile') {
      return <ProfileScreen onBack={handleGoHome} />;
    }

    if (phase === 'tutorial') {
      return <TutorialOverlay onComplete={() => {
        gameKeyRef.current += 1;
        setPhase('countdown');
      }} />;
    }

    // 'rotate' phase is no longer used — handled via overlay (showRotateOverlay)

    if (phase === 'countdown') {
      const isGo = countdown === 0;
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-[100dvh] game-bg overflow-hidden">
          {/* Logo pequeño */}
          <img src="/logo.png" alt="GeoSpeed" className="w-12 sm:w-14 md:w-16 object-contain mb-3 sm:mb-4 animate-fade-in" />

          <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4 animate-fade-in">
            {isTraining ? t('game_training') : isSpeedDemon ? '👹 SPEED DEMON — 5s/city' : `${modeLabel} — ${diffLabel}`}
          </p>

          <div className="relative flex items-center justify-center">
            {/* Expanding ring on GO */}
            {isGo && (
              <div
                className="absolute w-24 h-24 rounded-full border-4 animate-ring-expand"
                style={{ borderColor: 'hsl(var(--primary))' }}
              />
            )}

            <div
              key={countdown}
              className={`font-black font-mono ${isGo
                ? 'text-8xl sm:text-9xl md:text-[10rem] animate-go-impact'
                : 'text-7xl sm:text-8xl md:text-9xl animate-countdown-zoom'
              }`}
              style={{ color: 'hsl(var(--primary))' }}
            >
              {isGo ? 'GO!' : countdown}
            </div>
          </div>

          <p className="text-muted-foreground mt-4 sm:mt-6 text-xs sm:text-sm animate-fade-in">
            {isGo ? t('countdown_go') : t('countdown_ready')}
          </p>
        </div>
      );
    }

    if (phase === 'ta-select') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 overflow-y-auto game-bg">
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-2xl text-center animate-fade-in-up my-4">
            {/* Logo + nombre */}
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <img src="/logo.png" alt="GeoSpeed" className="w-16 sm:w-20 object-contain" />
              <span
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  fontFamily: 'Impact, system-ui',
                  background: 'linear-gradient(180deg, #F5D060 0%, #F0A030 40%, #D48020 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                GEOSPEED
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>⚡ Blitz, Contrarreloj Extremo</h2>
            <p className="text-muted-foreground text-[10px] sm:text-xs mb-4 sm:mb-6 italic">{t('ta_subtitle')}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 uppercase tracking-widest">{t('ta_selectDifficulty')}</p>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {MODE_CONFIG.map(m => (
                <button
                  key={m.key}
                  onClick={() => setGameMode(m.key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all active:scale-[0.97] ${
                    gameMode === m.key ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/40'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className={`text-xs font-bold ${gameMode === m.key ? 'text-primary' : 'text-foreground'}`}>{m.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mb-4 sm:mb-6">
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
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                {t('ta_start')} ⚡
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (phase === 'ta-playing') {
      return (
        <TimeAttackScreen
          key={`ta-${gameKeyRef.current}`}
          difficulty={difficulty}
          gameMode={gameMode}
          onGameOver={(result) => {
            setTaResult(result);
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
            setPhase('ta-final');
          }}
        />
      );
    }

    if (phase === 'ta-final' && taResult) {
      const avgDist = taResult.rounds.length > 0
        ? taResult.rounds.reduce((s, r) => s + r.distance, 0) / taResult.rounds.length
        : 0;
      return (
        <div className="min-h-[100dvh] flex items-center justify-center px-3 py-4 sm:p-6 game-bg">
          <div className="bg-card border rounded-xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in-up text-center">
            {/* Logo + nombre */}
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <img src="/logo.png" alt="GeoSpeed" className="w-16 sm:w-20 object-contain" />
              <span
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  fontFamily: 'Impact, system-ui',
                  background: 'linear-gradient(180deg, #F5D060 0%, #F0A030 40%, #D48020 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                GEOSPEED
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>⚡ ¡TIEMPO!</h2>
            <p className="text-muted-foreground text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6">Blitz, Contrarreloj Extremo</p>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-muted rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Ciudades</p>
                <p className="text-xl sm:text-2xl font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{taResult.cities}</p>
              </div>
              <div className="bg-muted rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Puntuación</p>
                <p className="text-xl sm:text-2xl font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{taResult.totalScore.toLocaleString()}</p>
              </div>
              <div className="bg-muted rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Dist. prom.</p>
                <p className="text-xs sm:text-sm font-mono font-bold">{formatDistance(avgDist)}</p>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button onClick={() => { gameKeyRef.current += 1; setPhase('ta-playing'); }} className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-[0.97]" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                REINTENTAR ⚡
              </button>
              <button onClick={handleGoHome} className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm border border-border transition-all active:scale-[0.97] hover:bg-muted">
                MENÚ
              </button>
            </div>
          </div>
        </div>
      );
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
          onGameOver={handleMpGameOver}
          seed={mpRoom?.seed}
        />
      );
    }

    if (phase === 'mp-final' && mpRoom) {
      return <MultiplayerResultScreen room={mpRoom} isHost={mpIsHost} onPlayAgain={handleMpPlayAgain} onGoHome={handleGoHome} onRoomUpdate={setMpRoom} />;
    }

    if (phase === 'daily') {
      return (
        <GameScreen
          key={`daily-${getDailySeed()}`}
          difficulty="medium"
          gameMode="world"
          onRoundComplete={() => {}}
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
            // Save daily best to localStorage + grant +1 life on first daily completion
            const todayKey = `geospeed_daily_${new Date().toISOString().split('T')[0]}`;
            const prevBest = parseInt(localStorage.getItem(todayKey) || '0', 10);
            if (!prevBest) {
              // First completion today — reward +1 life
              addLives(1);
            }
            if (total > prevBest) localStorage.setItem(todayKey, total.toString());
            setPhase('final');
          }}
          seed={getDailySeed()}
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
          onGameOver={handleGameOver}
          isTraining={isTraining}
          {...(isSpeedDemon ? { maxTimeOverride: 5, totalRoundsOverride: 30 } : {})}
          {...(revengeCities ? { citiesOverride: revengeCities, totalRoundsOverride: revengeCities.length } : {})}
          {...(challengeSeed !== null ? { seed: challengeSeed } : {})}
        />
      );
    }

    if (phase === 'final') {
      return (
        <FinalResultScreen
          rounds={finalRounds}
          totalScore={finalScore}
          difficulty={difficulty}
          mode={gameMode}
          reason={endReason}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
          onRevenge={revengeUsed ? undefined : handleRevenge}
          onShareChallenge={handleShareChallenge}
          challengerScore={challengerScore}
          totalRounds={isSpeedDemon ? 30 : isTraining ? 6 : 13}
        />
      );
    }

    return (
      <HomeScreen onStartGame={handleSelectDifficulty} onMultiplayer={handleMultiplayer} onTimeAttack={handleTimeAttack} onDailyChallenge={handleDailyChallenge} onStartTraining={handleStartTraining} onSpeedDemon={handleSpeedDemon} onOpenStore={handleOpenStore} onOpenProfile={handleOpenProfile} />
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
  const skipTransition = ['splash', 'countdown', 'tutorial'].includes(phase);

  // Minimal loading fallback for lazy components
  const lazyFallback = (
    <div className="fixed inset-0 flex items-center justify-center game-bg">
      <div className="text-center animate-pulse">
        <img src="/logo.png" alt="GeoSpeed" className="w-10 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    </div>
  );

  return (
    <>
      <PhaseErrorBoundary onReset={handleGoHome}>
        <Suspense fallback={lazyFallback}>
          {skipTransition ? renderPhase() : (
            <PhaseTransition phaseKey={phase}>
              {renderPhase()}
            </PhaseTransition>
          )}
        </Suspense>
      </PhaseErrorBoundary>
      {showNoLives && <NoLivesModal onClose={() => setShowNoLives(false)} onOpenStore={() => { setShowNoLives(false); handleOpenStore(); }} />}

      {/* Notification permission prompt — shown after first game */}
      {showNotifPrompt && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <p className="text-2xl text-center mb-2">🔔</p>
            <p className="text-sm font-bold text-center mb-1" style={{ color: 'hsl(var(--primary))' }}>¿Activar notificaciones?</p>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Te avisamos cuando tu racha esté en riesgo, tus vidas estén llenas o haya un nuevo desafío diario.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleNotifAccept}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97]"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                Sí, activar
              </button>
              <button
                onClick={handleNotifDismiss}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm border border-border transition-all active:scale-[0.97] hover:bg-muted"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rotate overlay — shown on top of game when portrait during gameplay */}
      {showRotateOverlay && <RotateOverlay t={t} />}

      {/* Floating music toggle — always visible */}
      {phase !== 'splash' && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 shadow-lg"
          style={{
            background: 'hsl(var(--background) / 0.7)',
            borderColor: 'hsl(var(--primary) / 0.3)',
          }}
          aria-label={isMusicMuted ? 'Activar música' : 'Silenciar música'}
          title={isMusicMuted ? 'Activar música' : 'Silenciar música'}
        >
          <span className="text-base">{isMusicMuted ? '🔇' : '🎵'}</span>
        </button>
      )}
    </>
  );
};

/** Pure overlay — no internal orientation detection (parent controls visibility via state) */
function RotateOverlay({ t }: { t: (key: string) => string }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center min-h-[100dvh] gap-6 game-bg">
      <div className="animate-bounce" style={{ animationDuration: '2s' }}>
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="12" y1="18" x2="12" y2="18.01" />
        </svg>
      </div>
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-[spin_3s_ease-in-out_infinite]" style={{ transformOrigin: 'center' }}>
          <path d="M7.5 21L3 12l4.5-9h9L21 12l-4.5 9z" opacity="0" />
          <polyline points="15 3 21 3 21 9" />
          <path d="M21 3l-7 7" />
        </svg>
      </div>
      <div className="text-center px-8">
        <p className="text-xl font-black mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
          {t('rotate_title')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('rotate_desc')}
        </p>
      </div>
    </div>
  );
}

export default Index;
