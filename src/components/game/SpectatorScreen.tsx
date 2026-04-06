import { useState, useEffect } from 'react';
import { type GameRoom, subscribeToRoom, fetchRoom } from '@/lib/multiplayerUtils';
import { supabase } from '@/integrations/supabase/client';
import { MODE_CONFIG } from '@/data/cities';
import { useI18n } from '@/i18n';

interface SpectatorScreenProps {
  roomId: string;
  onBack: () => void;
}

const diffLabels: Record<string, string> = { easy: '🟢 Fácil', medium: '🟡 Medio', hard: '🔴 Experto' };

export default function SpectatorScreen({ roomId, onBack }: SpectatorScreenProps) {
  const { t } = useI18n();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Initial fetch + real-time subscription
  useEffect(() => {
    let channel: ReturnType<typeof subscribeToRoom> | null = null;

    fetchRoom(roomId).then(r => {
      if (r) {
        setRoom(r);
        channel = subscribeToRoom(roomId, setRoom);
      } else {
        setError('Sala no encontrada');
      }
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Timer
  useEffect(() => {
    if (!room || room.status !== 'playing') return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [room?.status]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 game-bg">
        <p className="text-red-400 text-lg font-bold mb-4">{error}</p>
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Volver</button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 game-bg">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-3" />
        <p className="text-muted-foreground text-sm">Cargando sala...</p>
      </div>
    );
  }

  const modeLabel = MODE_CONFIG.find(m => m.key === room.mode)?.label || room.mode;
  const isFinished = room.host_finished && room.guest_finished;
  const hostWins = room.host_score > room.guest_score;
  const tie = room.host_score === room.guest_score;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 game-bg">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
            👁️ {t('spectator_title')}
          </p>
          <h1 className="text-2xl font-black" style={{ fontFamily: 'Impact, system-ui', color: 'hsl(var(--primary))' }}>
            {t('spectator_live')}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {modeLabel} · {diffLabels[room.difficulty] || room.difficulty}
          </p>
        </div>

        {/* Status badge */}
        <div className="flex justify-center mb-5">
          {room.status === 'waiting' && (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full animate-pulse">
              {t('spectator_waiting')}
            </span>
          )}
          {room.status === 'playing' && !isFinished && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full animate-pulse">
              {t('spectator_live')} · {formatTime(elapsed)}
            </span>
          )}
          {isFinished && (
            <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full">
              {t('spectator_finished')}
            </span>
          )}
        </div>

        {/* Scoreboard */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)/0) 0%, hsl(var(--primary)) 50%, hsl(var(--primary)/0) 100%)' }} />

          <div className="flex items-center gap-4">
            {/* Host */}
            <div className={`flex-1 text-center ${isFinished && hostWins && !tie ? '' : ''}`}>
              <span className="text-2xl block mb-1">👑</span>
              <p className="font-bold text-sm truncate">{room.host_name}</p>
              <p
                className="font-mono font-black text-2xl mt-1"
                style={isFinished && hostWins && !tie ? { color: 'hsl(var(--primary))' } : {}}
              >
                {room.host_score.toLocaleString()}
              </p>
              <div className="mt-1.5">
                {room.host_finished ? (
                  <span className="text-[10px] text-green-400 font-bold">TERMINÓ ✓</span>
                ) : room.status === 'playing' ? (
                  <span className="text-[10px] text-muted-foreground animate-pulse">Jugando...</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    {room.host_ready ? 'Listo ✓' : 'Esperando'}
                  </span>
                )}
              </div>
            </div>

            {/* VS */}
            <div className="text-xl font-black text-muted-foreground/50">VS</div>

            {/* Guest */}
            <div className={`flex-1 text-center`}>
              <span className="text-2xl block mb-1">{room.guest_name ? '⚔️' : '⏳'}</span>
              <p className="font-bold text-sm truncate">{room.guest_name || '???'}</p>
              <p
                className="font-mono font-black text-2xl mt-1"
                style={isFinished && !hostWins && !tie ? { color: 'hsl(var(--primary))' } : {}}
              >
                {room.guest_score.toLocaleString()}
              </p>
              <div className="mt-1.5">
                {!room.guest_name ? (
                  <span className="text-[10px] text-muted-foreground">Sin rival</span>
                ) : room.guest_finished ? (
                  <span className="text-[10px] text-green-400 font-bold">TERMINÓ ✓</span>
                ) : room.status === 'playing' ? (
                  <span className="text-[10px] text-muted-foreground animate-pulse">Jugando...</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    {room.guest_ready ? 'Listo ✓' : 'Esperando'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Result banner */}
          {isFinished && (
            <div className="mt-4 pt-3 border-t border-border text-center animate-fade-in">
              {tie ? (
                <p className="font-bold text-lg text-yellow-400">🤝 EMPATE</p>
              ) : (
                <p className="font-bold text-lg" style={{ color: 'hsl(var(--primary))' }}>
                  🏆 {hostWins ? room.host_name : room.guest_name} GANA
                </p>
              )}
            </div>
          )}
        </div>

        {/* Room info */}
        <div className="text-center text-[10px] text-muted-foreground mb-4">
          Sala: <span className="font-mono font-bold">{room.code}</span>
        </div>

        <button
          onClick={onBack}
          className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors text-center border border-border rounded-lg"
        >
          ← Volver al menú
        </button>
      </div>
    </div>
  );
}
