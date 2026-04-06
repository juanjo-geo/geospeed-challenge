import { useState } from 'react';
import { type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import { createRoom, joinRoom, quickMatch, type GameRoom } from '@/lib/multiplayerUtils';
import { useI18n } from '@/i18n';

interface MultiplayerLobbyProps {
  onRoomReady: (room: GameRoom, isHost: boolean) => void;
  onBack: () => void;
  onSpectate?: (roomCode: string) => void;
}

const DIFF_OPTIONS: { key: Difficulty; label: string; emoji: string }[] = [
  { key: 'easy', emoji: '🟢', label: 'Fácil' },
  { key: 'medium', emoji: '🟡', label: 'Medio' },
  { key: 'hard', emoji: '🔴', label: 'Experto' },
];

type Tab = 'create' | 'join';

export default function MultiplayerLobby({ onRoomReady, onBack, onSpectate }: MultiplayerLobbyProps) {
  const { t } = useI18n();
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

  const handleQuickMatch = async () => {
    if (!playerName.trim()) { setError('Ingresa tu nombre'); return; }
    setLoading(true);
    setError('');
    const result = await quickMatch(playerName.trim(), difficulty, mode);
    setLoading(false);
    if (result) {
      onRoomReady(result.room, result.isHost);
    } else {
      setError('Error en matchmaking. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 game-bg">
      <div className="animate-fade-in-up mb-6">
        <h1 className="text-3xl font-black tracking-tight text-center" style={{ fontFamily: 'Impact, system-ui', color: 'hsl(var(--primary))' }}>
          🎮 {t('mp_lobby').toUpperCase()}
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

      {/* Quick Match */}
      <div className="w-full max-w-sm mb-4 animate-fade-in-up animation-delay-150">
        <button
          onClick={handleQuickMatch}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-base transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(332 47% 50%))',
            color: 'hsl(var(--primary-foreground))',
            boxShadow: '0 4px 20px hsl(var(--primary) / 0.3)',
          }}
        >
          {loading ? '⏳ BUSCANDO...' : `⚡ ${t('mp_quickMatch')}`}
        </button>
        <p className="text-[9px] text-muted-foreground text-center mt-1.5">
          Busca un rival automáticamente o crea sala si no hay disponibles
        </p>
      </div>

      <div className="flex items-center gap-3 w-full max-w-sm mb-4 animate-fade-in-up animation-delay-200">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('mp_or')}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 w-full max-w-sm animate-fade-in-up animation-delay-200">
        <button
          onClick={() => { setTab('create'); setError(''); }}
          className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97] ${
            tab === 'create' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('mp_createRoom')}
        </button>
        <button
          onClick={() => { setTab('join'); setError(''); }}
          className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97] ${
            tab === 'join' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('mp_joinRoom')}
        </button>
      </div>

      {/* Create tab */}
      {tab === 'create' && (
        <div className="w-full max-w-sm space-y-4 animate-fade-in">
          {/* Mode selector */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">{t('home_mode')}</label>
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
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">{t('home_difficulty')}</label>
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
            {loading ? 'CREANDO...' : '🎯 CONFIRMAR Y CREAR'}
          </button>
        </div>
      )}

      {/* Join tab */}
      {tab === 'join' && (
        <div className="w-full max-w-sm space-y-4 animate-fade-in">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">{t('mp_enterCode')}</label>
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
            {loading ? 'BUSCANDO...' : '🚀 ENTRAR A LA SALA'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-3 animate-fade-in">{error}</p>
      )}

      {/* Spectate option */}
      {onSpectate && (
        <div className="w-full max-w-sm mt-5 animate-fade-in-up animation-delay-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('mp_spectate')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
              placeholder="CÓDIGO"
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-foreground font-mono font-bold text-center text-sm tracking-[0.2em] focus:outline-none focus:border-primary uppercase"
              maxLength={5}
            />
            <button
              onClick={() => {
                if (!joinCode.trim()) { setError('Ingresa el código de la sala'); return; }
                onSpectate(joinCode.trim());
              }}
              className="px-4 py-2 rounded-lg border border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-[0.97]"
            >
              👁️ VER
            </button>
          </div>
        </div>
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
