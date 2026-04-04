import { useState } from 'react';
import { type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import { createRoom, joinRoom, type GameRoom } from '@/lib/multiplayerUtils';

interface MultiplayerLobbyProps {
  onRoomReady: (room: GameRoom, isHost: boolean) => void;
  onBack: () => void;
}

const DIFF_OPTIONS: { key: Difficulty; label: string; emoji: string }[] = [
  { key: 'easy', emoji: '🟢', label: 'Fácil' },
  { key: 'medium', emoji: '🟡', label: 'Medio' },
  { key: 'hard', emoji: '🔴', label: 'Experto' },
];

type Tab = 'create' | 'join';

export default function MultiplayerLobby({ onRoomReady, onBack }: MultiplayerLobbyProps) {
  const [tab, setTab] = useState<Tab>('create');
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<GameMode>('world');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!playerName.trim()) { setError('Ingresa tu nombre'); return; }
    setLoading(true);
    setError('');
    const room = await createRoom(playerName.trim(), difficulty, mode);
    setLoading(false);
    if (room) {
      onRoomReady(room, true);
    } else {
      setError('Error al crear la sala. Intenta de nuevo.');
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) { setError('Ingresa tu nombre'); return; }
    if (!joinCode.trim()) { setError('Ingresa el código de la sala'); return; }
    setLoading(true);
    setError('');
    const room = await joinRoom(joinCode.trim(), playerName.trim());
    setLoading(false);
    if (room) {
      onRoomReady(room, false);
    } else {
      setError('Sala no encontrada o ya está llena.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 game-bg">
      <div className="animate-fade-in-up mb-6">
        <h1 className="text-3xl font-black tracking-tight text-center" style={{ fontFamily: 'Impact, system-ui', color: 'hsl(var(--primary))' }}>
          🎮 MODO DUELO
        </h1>
        <p className="text-muted-foreground text-sm text-center mt-1 italic">Compite contra otro jugador en tiempo real</p>
      </div>

      {/* Name input */}
      <div className="w-full max-w-sm mb-5 animate-fade-in-up animation-delay-100">
        <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Tu nombre</label>
        <input
          type="text"
          value={playerName}
          onChange={e => setPlayerName(e.target.value.slice(0, 12))}
          placeholder="Máx 12 caracteres"
          className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-bold text-center focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 w-full max-w-sm animate-fade-in-up animation-delay-200">
        <button
          onClick={() => { setTab('create'); setError(''); }}
          className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97] ${
            tab === 'create' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          CREAR SALA
        </button>
        <button
          onClick={() => { setTab('join'); setError(''); }}
          className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97] ${
            tab === 'join' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          UNIRSE
        </button>
      </div>

      {/* Create tab */}
      {tab === 'create' && (
        <div className="w-full max-w-sm space-y-4 animate-fade-in">
          {/* Mode selector */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Modalidad</label>
            <div className="grid grid-cols-5 gap-1.5">
              {MODE_CONFIG.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all active:scale-[0.97] text-xs ${
                    mode === m.key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className="font-bold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Dificultad</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFF_OPTIONS.map(d => (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-lg border transition-all active:scale-[0.97] ${
                    difficulty === d.key ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}
                >
                  <span>{d.emoji}</span>
                  <span className={`font-bold text-sm ${difficulty === d.key ? 'text-primary' : 'text-foreground'}`}>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-base transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {loading ? 'CREANDO...' : 'CREAR SALA 🎯'}
          </button>
        </div>
      )}

      {/* Join tab */}
      {tab === 'join' && (
        <div className="w-full max-w-sm space-y-4 animate-fade-in">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Código de sala</label>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
              placeholder="Ej: AB3K9"
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-mono font-bold text-center text-2xl tracking-[0.3em] focus:outline-none focus:border-primary transition-colors uppercase"
              maxLength={5}
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-base transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {loading ? 'BUSCANDO...' : 'UNIRSE 🚀'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-3 animate-fade-in">{error}</p>
      )}

      <button
        onClick={onBack}
        className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Volver al inicio
      </button>
    </div>
  );
}
