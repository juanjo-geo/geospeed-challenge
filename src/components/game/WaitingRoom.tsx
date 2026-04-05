import { useState, useEffect } from 'react';
import { type GameRoom, subscribeToRoom, setPlayerReady } from '@/lib/multiplayerUtils';
import { supabase } from '@/integrations/supabase/client';
import { MODE_CONFIG } from '@/data/cities';

interface WaitingRoomProps {
  room: GameRoom;
  isHost: boolean;
  onGameStart: (room: GameRoom) => void;
  onBack: () => void;
}

const diffLabels: Record<string, string> = { easy: '🟢 Fácil', medium: '🟡 Medio', hard: '🔴 Experto' };

export default function WaitingRoom({ room: initialRoom, isHost, onGameStart, onBack }: WaitingRoomProps) {
  const [room, setRoom] = useState<GameRoom>(initialRoom);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const channel = subscribeToRoom(initialRoom.id, (updated) => {
      setRoom(updated);
      // Both players ready → start game
      if (updated.host_ready && updated.guest_ready) {
        onGameStart(updated);
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [initialRoom.id, onGameStart]);

  const handleReady = async () => {
    setReady(true);
    await setPlayerReady(room.id, isHost);
  };

  const modeLabel = MODE_CONFIG.find(m => m.key === room.mode)?.label || room.mode;
  const hasGuest = !!room.guest_name;
  const myReady = isHost ? room.host_ready : room.guest_ready;
  const opponentReady = isHost ? room.guest_ready : room.host_ready;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 game-bg">
      <div className="w-full max-w-md">
        {/* Room code */}
        <div className="text-center mb-8 animate-fade-in-up">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Código de sala</p>
          <p className="text-5xl font-mono font-black tracking-[0.4em] select-all" style={{ color: 'hsl(var(--primary))' }}>
            {room.code}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Comparte este código con tu oponente</p>
        </div>

        {/* Config */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 animate-fade-in-up animation-delay-100">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Modalidad</span>
            <span className="font-bold text-foreground">{modeLabel}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted-foreground">Dificultad</span>
            <span className="font-bold text-foreground">{diffLabels[room.difficulty] || room.difficulty}</span>
          </div>
        </div>

        {/* Players */}
        <div className="space-y-3 mb-8 animate-fade-in-up animation-delay-200">
          <p className="text-xs text-muted-foreground uppercase tracking-widest text-center">Jugadores</p>

          {/* Host */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            room.host_ready ? 'border-green-500/60 bg-green-500/10' : 'border-border bg-card'
          }`}>
            <span className="text-2xl">👑</span>
            <div className="flex-1">
              <p className="font-bold text-foreground">{room.host_name}</p>
              <p className="text-xs text-muted-foreground">Anfitrión</p>
            </div>
            {room.host_ready && <span className="text-green-400 font-bold text-sm">LISTO ✓</span>}
          </div>

          {/* Guest */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            hasGuest
              ? room.guest_ready ? 'border-green-500/60 bg-green-500/10' : 'border-border bg-card'
              : 'border-dashed border-muted-foreground/30 bg-card/50'
          }`}>
            <span className="text-2xl">{hasGuest ? '⚔️' : '⏳'}</span>
            <div className="flex-1">
              {hasGuest ? (
                <>
                  <p className="font-bold text-foreground">{room.guest_name}</p>
                  <p className="text-xs text-muted-foreground">Retador</p>
                </>
              ) : (
                <p className="text-muted-foreground italic text-sm">Esperando oponente...</p>
              )}
            </div>
            {hasGuest && room.guest_ready && <span className="text-green-400 font-bold text-sm">LISTO ✓</span>}
          </div>
        </div>

        {/* Ready button */}
        {hasGuest && !myReady && (
          <button
            onClick={handleReady}
            disabled={ready}
            className="w-full py-3.5 rounded-xl font-bold text-lg transition-all active:scale-[0.97] disabled:opacity-50 animate-fade-in"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {ready ? 'ESPERANDO AL RIVAL...' : '¡ESTOY LISTO! 🎯'}
          </button>
        )}

        {myReady && !opponentReady && (
          <p className="text-center text-muted-foreground text-sm animate-pulse">
            Esperando a que {isHost ? room.guest_name : room.host_name} esté listo...
          </p>
        )}

        {!hasGuest && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
              Esperando que alguien se una...
            </div>
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          ← Cancelar y volver
        </button>
      </div>
    </div>
  );
}
