import { useState, useCallback, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistance, addGameHistory } from '@/lib/gameUtils';
import { type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import HomeScreen from '@/components/game/HomeScreen';
import GameScreen, { type RoundResult } from '@/components/game/GameScreen';
import FinalResultScreen from '@/components/game/FinalResultScreen';
import MultiplayerLobby from '@/components/game/MultiplayerLobby';
import WaitingRoom from '@/components/game/WaitingRoom';
import MultiplayerResultScreen from '@/components/game/MultiplayerResultScreen';
import TimeAttackScreen, { type TimeAttackResult } from '@/components/game/TimeAttackScreen';
import TutorialOverlay from '@/components/game/TutorialOverlay';
import SplashScreen from '@/components/game/SplashScreen';
import NoLivesModal from '@/components/game/NoLivesModal';
import StoreScreen from '@/components/game/StoreScreen';
import { type GameRoom, updateRoomScore, subscribeToRoom, fetchRoom } from '@/lib/multiplayerUtils';
import { supabase } from '@/integrations/supabase/client';
import { consumeLife, getEnergy } from '@/lib/energySystem';
import { incrementGameCounter, shouldShowInterstitial } from '@/lib/premiumSystem';
import { showInterstitial, initAds } from '@/lib/adSystem';
import { syncAfterGame } from '@/lib/cloudSync';
import { addLives } from '@/lib/energySystem';
import { playCountdown, playGo } from '@/lib/sounds';
import { hapticTap, hapticCelebration } from '@/lib/haptics';

type Phase = 'splash' | 'home' | 'store' | 'tutorial' | 'rotate' | 'countdown' | 'playing' | 'final' | 'mp-lobby' | 'mp-waiting' | 'mp-playing' | 'mp-final' | 'ta-select' | 'ta-playing' | 'ta-final' | 'daily';

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
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [phaseKey]);
  return (
    <div
      className="transition-all duration-500 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.97)' }}
    >
      {children}
    </div>
  );
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: '🟢 Fácil',
  medium: '🟡 Medio',
  hard: '🔴 Experto',
};

const Index = () => {
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>('splash');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameMode, setGameMode] = useState<GameMode>('world');
  const [finalRounds, setFinalRounds] = useState<RoundResult[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [endReason, setEndReason] = useState<'timeout' | 'complete'>('complete');
  const [taResult, setTaResult] = useState<TimeAttackResult | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [showNoLives, setShowNoLives] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  // Multiplayer state
  const [mpRoom, setMpRoom] = useState<GameRoom | null>(null);
  const [mpIsHost, setMpIsHost] = useState(false);
  const mpRoomRef = useRef<GameRoom | null>(null);
  // Stable game key — only increments when a NEW game is explicitly started
  const gameKeyRef = useRef(0);

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
      setMpRoom(updated);
    });
    // Use removeChannel for proper cleanup — unsubscribe() alone leaves the
    // channel in Supabase's internal registry, blocking future resubscriptions.
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpRoom?.id, mpPhaseActive]);

  // Countdown logic — goes 3 → 2 → 1 → 0 (GO!) → start playing
  useEffect(() => {
    if (phase !== 'countdown') return;
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
    if (!consumeLife()) {
      setShowNoLives(true);
      return;
    }
    setIsTraining(false);
    setDifficulty(diff);
    setGameMode(mode);
    // Onboarding is now embedded in HomeScreen ("¿Cómo se juega?"),
    // so the old tutorial overlay is no longer needed.
    localStorage.setItem('geospeed_tutorial_seen', '1');
    if (isMobile && window.innerHeight > window.innerWidth) {
      setPhase('rotate');
    } else {
      gameKeyRef.current += 1;
      setPhase('countdown');
    }
  }, [isMobile]);

  // Auto-detect landscape while on rotate screen
  useEffect(() => {
    if (phase !== 'rotate') return;
    const check = () => {
      if (window.innerWidth > window.innerHeight) {
        gameKeyRef.current += 1;
        setPhase('countdown');
      }
    };
    const onOrientationChange = () => setTimeout(check, 300);
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
  }, [difficulty, gameMode]);

  const handlePlayAgain = useCallback(() => { gameKeyRef.current += 1; setPhase('countdown'); }, []);
  const handleGoHome = useCallback(() => { setIsTraining(false); setPhase('home'); }, []);
  const handleOpenStore = useCallback(() => setPhase('store'), []);

  const handleMultiplayer = useCallback(() => setPhase('mp-lobby'), []);
  const handleTimeAttack = useCallback(() => {
    if (!consumeLife()) { setShowNoLives(true); return; }
    setPhase('ta-select');
  }, []);
  const handleDailyChallenge = useCallback(() => {
    if (!consumeLife()) { setShowNoLives(true); return; }
    setDifficulty('medium');
    setGameMode('world');
    setPhase('daily');
  }, []);

  const handleStartTraining = useCallback(() => {
    setIsTraining(true);
    setDifficulty('easy');
    setGameMode('world');
    gameKeyRef.current += 1;
    if (isMobile && window.innerHeight > window.innerWidth) {
      setPhase('rotate');
    } else {
      setPhase('countdown');
    }
  }, [isMobile]);

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

  const modeLabel = MODE_CONFIG.find(m => m.key === gameMode)?.label || 'Mapamundi';

  // --- Render ---
  const renderPhase = () => {
    if (phase === 'splash') {
      return <SplashScreen onComplete={() => setPhase('home')} />;
    }

    if (phase === 'store') {
      return <StoreScreen onClose={handleGoHome} />;
    }

    if (phase === 'tutorial') {
      return <TutorialOverlay onComplete={() => {
        if (isMobile && window.innerHeight > window.innerWidth) {
          setPhase('rotate');
        } else {
          gameKeyRef.current += 1;
          setPhase('countdown');
        }
      }} />;
    }

    if (phase === 'rotate') {
      return <RotateScreen onLandscapeDetected={() => setPhase('countdown')} />;
    }

    if (phase === 'countdown') {
      const isGo = countdown === 0;
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-[100dvh] game-bg overflow-hidden">
          <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4 animate-fade-in">
            {isTraining ? '🎓 Modo Entrenamiento' : `${modeLabel} — ${difficultyLabels[difficulty]}`}
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
            {isGo ? '¡A jugar!' : 'Localiza las ciudades lo más rápido posible'}
          </p>
        </div>
      );
    }

    if (phase === 'ta-select') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 overflow-y-auto game-bg">
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-2xl text-center animate-fade-in-up my-4">
            <p className="text-3xl sm:text-4xl mb-2 sm:mb-3">⚡</p>
            <h2 className="text-xl sm:text-2xl font-black mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>CONTRARRELOJ EXTREMO</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">60 segundos · ciudades infinitas · ¿cuántas puedes acertar?</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 uppercase tracking-widest">Elige modalidad y dificultad</p>
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
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold border-2 transition-all active:scale-[0.97] ${
                    difficulty === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                  }`}
                >
                  {difficultyLabels[d]}
                </button>
              ))}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button onClick={handleGoHome} className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]">
                VOLVER
              </button>
              <button
                onClick={() => { gameKeyRef.current += 1; setPhase('ta-playing'); }}
                className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-[0.97]"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                ¡EMPEZAR! ⚡
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
            <p className="text-3xl sm:text-4xl mb-2">⚡</p>
            <h2 className="text-xl sm:text-2xl font-black mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>¡TIEMPO!</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">Contrareloj Extremo</p>

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
      return <MultiplayerLobby onRoomReady={handleRoomReady} onBack={handleGoHome} />;
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
              type: 'classic',
            });
            // Save daily best to localStorage
            const todayKey = `geospeed_daily_${new Date().toISOString().split('T')[0]}`;
            const prevBest = parseInt(localStorage.getItem(todayKey) || '0', 10);
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
          totalRounds={isTraining ? 6 : 13}
        />
      );
    }

    return (
      <HomeScreen onStartGame={handleSelectDifficulty} onMultiplayer={handleMultiplayer} onTimeAttack={handleTimeAttack} onDailyChallenge={handleDailyChallenge} onStartTraining={handleStartTraining} onOpenStore={handleOpenStore} />
    );
  };

  // Phases with their own full-screen animations skip PhaseTransition
  const skipTransition = ['splash', 'countdown', 'rotate', 'tutorial'].includes(phase);

  return (
    <>
      {skipTransition ? renderPhase() : (
        <PhaseTransition phaseKey={phase}>
          {renderPhase()}
        </PhaseTransition>
      )}
      {showNoLives && <NoLivesModal onClose={() => setShowNoLives(false)} onOpenStore={() => { setShowNoLives(false); handleOpenStore(); }} />}
    </>
  );
};

/** Rotate-screen that auto-advances once landscape is detected */
function RotateScreen({ onLandscapeDetected }: { onLandscapeDetected: () => void }) {
  useEffect(() => {
    const check = () => {
      if (window.innerWidth > window.innerHeight) {
        onLandscapeDetected();
      }
    };
    const onOrientationChange = () => setTimeout(check, 200);
    // Check immediately in case already landscape
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', onOrientationChange);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, [onLandscapeDetected]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-[100dvh] gap-6 game-bg">
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
          📱 GIRA TU TELÉFONO
        </p>
        <p className="text-sm text-muted-foreground">
          Para jugar necesitas modo horizontal
        </p>
      </div>
    </div>
  );
}

export default Index;
