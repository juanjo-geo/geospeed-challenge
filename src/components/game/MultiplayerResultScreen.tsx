import { type GameRoom } from '@/lib/multiplayerUtils';
import { MODE_CONFIG } from '@/data/cities';

interface MultiplayerResultScreenProps {
  room: GameRoom;
  isHost: boolean;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

const diffLabels: Record<string, string> = { easy: '🟢 Fácil', medium: '🟡 Medio', hard: '🔴 Experto' };

export default function MultiplayerResultScreen({ room, isHost, onPlayAgain, onGoHome }: MultiplayerResultScreenProps) {
  const myScore = (isHost ? room.host_score : room.guest_score) ?? 0;
  const opponentScore = (isHost ? room.guest_score : room.host_score) ?? null;
  const myName = isHost ? room.host_name : (room.guest_name || '???');
  const opponentName = isHost ? (room.guest_name || '???') : room.host_name;
  const opponentFinished = opponentScore !== null;
  const iWon = opponentFinished && myScore > opponentScore;
  const tie = opponentFinished && myScore === opponentScore;
  const modeLabel = MODE_CONFIG.find(m => m.key === room.mode)?.label || room.mode;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 game-bg">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Result header */}
        <div className="text-center mb-8">
          {!opponentFinished ? (
            <>
              <p className="text-5xl mb-3 animate-pulse">⏳</p>
              <h1 className="text-2xl font-black text-foreground">Esperando al rival…</h1>
              <p className="text-muted-foreground text-sm mt-2">Tu puntuación: {myScore.toLocaleString()}</p>
            </>
          ) : (
            <>
              <p className="text-6xl mb-3">{tie ? '🤝' : iWon ? '🏆' : '😔'}</p>
              <h1 className="text-3xl font-black" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
                {tie ? '¡EMPATE!' : iWon ? '¡VICTORIA!' : 'DERROTA'}
              </h1>
            </>
          )}
          <p className="text-muted-foreground text-sm mt-1">{modeLabel} — {diffLabels[room.difficulty]}</p>
        </div>

        {/* Scoreboard */}
        <div className="space-y-3 mb-8">
          <div className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
            iWon || tie ? 'border-primary/60 bg-primary/10' : 'border-border bg-card'
          }`}>
            <span className="text-3xl">{iWon || tie ? '👑' : '⚔️'}</span>
            <div className="flex-1">
              <p className="font-bold text-foreground text-lg">{myName} <span className="text-xs text-muted-foreground">(Tú)</span></p>
            </div>
            <p className="text-3xl font-mono font-black" style={{ color: 'hsl(var(--primary))' }}>{myScore.toLocaleString()}</p>
          </div>

          <div className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
            opponentFinished && !iWon && !tie ? 'border-primary/60 bg-primary/10' : 'border-border bg-card'
          }`}>
            <span className="text-3xl">{opponentFinished && !iWon && !tie ? '👑' : '⚔️'}</span>
            <div className="flex-1">
              <p className="font-bold text-foreground text-lg">{opponentName}</p>
            </div>
            <p className="text-3xl font-mono font-black" style={{ color: 'hsl(var(--primary))' }}>
              {opponentFinished ? opponentScore.toLocaleString() : '…'}
            </p>
          </div>
        </div>

        {/* Actions */}
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
            REVANCHA 🔄
          </button>
        </div>
      </div>
    </div>
  );
}
