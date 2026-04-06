import { useState, useEffect, useRef } from 'react';
import { type GameRoom, fetchRoom, setupFinishedBroadcast } from '@/lib/multiplayerUtils';
import { MODE_CONFIG } from '@/data/cities';
import { useI18n } from '@/i18n';

interface MultiplayerResultScreenProps {
  room: GameRoom;
  isHost: boolean;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onRoomUpdate?: (room: GameRoom) => void;
}

const diffLabels: Record<string, string> = { easy: '🟢 Fácil', medium: '🟡 Medio', hard: '🔴 Experto' };

const POLL_INTERVAL = 2000;
const POLL_MAX_DURATION = 5 * 60 * 1000;

export default function MultiplayerResultScreen({ room, isHost, onPlayAgain, onGoHome, onRoomUpdate }: MultiplayerResultScreenProps) {
  const { t } = useI18n();
  const myScore = isHost ? room.host_score : room.guest_score;
  const myName = isHost ? room.host_name : (room.guest_name || '???');
  const opponentName = isHost ? (room.guest_name || '???') : room.host_name;

  // --- Opponent-finished detection (3 independent signals) ---
  const dbFinished = isHost ? room.guest_finished : room.host_finished;
  const [broadcastScore, setBroadcastScore] = useState<number | null>(null);
  const broadcastReceivedRef = useRef(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  // Opponent is done if ANY signal fires
  const opponentFinished = dbFinished === true || broadcastScore !== null;
  const opponentScore = broadcastScore !== null
    ? broadcastScore
    : (isHost ? room.guest_score : room.host_score);

  const iWon = opponentFinished && myScore > opponentScore;
  const tie = opponentFinished && myScore === opponentScore;
  const modeLabel = MODE_CONFIG.find(m => m.key === room.mode)?.label || room.mode;

  // PRIMARY: Realtime broadcast — sends "I finished" repeatedly AND listens for opponent.
  // Uses role-specific channel names so send/listen channels never collide.
  useEffect(() => {
    if (opponentFinished) return;

    const cleanup = setupFinishedBroadcast(room.id, isHost, myScore, (oppScore) => {
      if (!broadcastReceivedRef.current) {
        broadcastReceivedRef.current = true;
        setBroadcastScore(oppScore);
      }
    });

    return cleanup;
  }, [room.id, isHost, myScore, opponentFinished]);

  // FALLBACK: Poll the DB every 2 s for score changes / finished flags.
  // Works even if broadcast fails (e.g. firewalls, Realtime outage).
  useEffect(() => {
    if (opponentFinished) return;

    const checkRoom = async () => {
      try {
        const freshRoom = await fetchRoom(room.id);
        if (!freshRoom) return;

        // Signal 1: finished flag (if migration applied)
        const oppDoneFlag = isHost ? freshRoom.guest_finished : freshRoom.host_finished;
        if (oppDoneFlag) {
          const freshOppScore = isHost ? freshRoom.guest_score : freshRoom.host_score;
          if (!broadcastReceivedRef.current) {
            broadcastReceivedRef.current = true;
            setBroadcastScore(freshOppScore);
          }
          if (onRoomUpdate) onRoomUpdate(freshRoom);
          return;
        }

        // Signal 2: opponent score is > 0 in the DB (they must have submitted)
        // This is more reliable than checking "changed from initial" because
        // the initial value may already reflect the opponent's score if they
        // finished while we were still playing.
        const freshOppScore = isHost ? freshRoom.guest_score : freshRoom.host_score;
        if (freshOppScore > 0) {
          if (!broadcastReceivedRef.current) {
            broadcastReceivedRef.current = true;
            setBroadcastScore(freshOppScore);
          }
          if (onRoomUpdate) onRoomUpdate(freshRoom);
          return;
        }
      } catch (err) {
        console.warn('[multiplayer] poll error:', err);
      }
    };

    checkRoom(); // immediate check

    const startTime = Date.now();
    const interval = setInterval(async () => {
      if (Date.now() - startTime > POLL_MAX_DURATION) {
        clearInterval(interval);
        setPollTimedOut(true);
        return;
      }
      await checkRoom();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [room.id, isHost, opponentFinished, onRoomUpdate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 game-bg">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Result header */}
        <div className="text-center mb-8">
          {!opponentFinished ? (
            <>
              <p className="text-5xl mb-3 animate-pulse">{pollTimedOut ? '⚠️' : '⏳'}</p>
              <h1 className="text-2xl font-black text-foreground">
                {pollTimedOut ? 'El rival no respondió' : t('mp_result_waiting')}
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Tu puntuación: <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>{myScore.toLocaleString()}</span>
              </p>
              {pollTimedOut ? (
                <p className="text-muted-foreground text-xs mt-1">Parece que el rival abandonó la partida</p>
              ) : (
                <p className="text-muted-foreground text-xs mt-1 animate-pulse">El rival sigue jugando…</p>
              )}
            </>
          ) : (
            <>
              <p className="text-6xl mb-3">{tie ? '🤝' : iWon ? '🏆' : '😔'}</p>
              <h1 className="text-3xl font-black" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
                {tie ? t('mp_result_draw') : iWon ? t('mp_result_victory') : t('mp_result_defeat')}
              </h1>
            </>
          )}
          <p className="text-muted-foreground text-sm mt-1">{modeLabel} — {diffLabels[room.difficulty]}</p>
        </div>

        {/* Scoreboard */}
        <div className="space-y-3 mb-8">
          {/* My row */}
          <div className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
            opponentFinished && (iWon || tie) ? 'border-primary/60 bg-primary/10' : 'border-border bg-card'
          }`}>
            <span className="text-3xl">{opponentFinished && (iWon || tie) ? '👑' : '⚔️'}</span>
            <div className="flex-1">
              <p className="font-bold text-foreground text-lg">{myName} <span className="text-xs text-muted-foreground">({t('mp_result_you')})</span></p>
              <p className="text-[10px] text-green-400">✓ {t('mp_result_finished')}</p>
            </div>
            <p className="text-3xl font-mono font-black" style={{ color: 'hsl(var(--primary))' }}>{myScore.toLocaleString()}</p>
          </div>

          {/* Opponent row */}
          <div className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
            opponentFinished && !iWon && !tie ? 'border-primary/60 bg-primary/10' : 'border-border bg-card'
          }`}>
            <span className="text-3xl">{opponentFinished && !iWon && !tie ? '👑' : '⚔️'}</span>
            <div className="flex-1">
              <p className="font-bold text-foreground text-lg">{opponentName}</p>
              {opponentFinished
                ? <p className="text-[10px] text-green-400">✓ {t('mp_result_finished')}</p>
                : <p className="text-[10px] text-muted-foreground animate-pulse">Jugando…</p>
              }
            </div>
            <p className="text-3xl font-mono font-black" style={{ color: 'hsl(var(--primary))' }}>
              {opponentFinished ? opponentScore.toLocaleString() : '…'}
            </p>
          </div>
        </div>

        {/* Actions — show full actions when both finished OR poll timed out */}
        {opponentFinished || pollTimedOut ? (
          <div className="flex gap-3">
            <button
              onClick={onGoHome}
              className="flex-1 py-3 rounded-lg font-bold text-sm border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]"
            >
              INICIO
            </button>
            <button
              onClick={onPlayAgain}
              className="flex-1 py-3 rounded-lg font-bold text-sm transition-all active:scale-[0.97]"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {opponentFinished ? 'REVANCHA 🔄' : 'NUEVA PARTIDA 🔄'}
            </button>
          </div>
        ) : (
          <button
            onClick={onGoHome}
            className="w-full py-3 rounded-lg font-bold text-sm border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]"
          >
            ABANDONAR PARTIDA
          </button>
        )}
      </div>
    </div>
  );
}
