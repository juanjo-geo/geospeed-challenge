import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Difficulty, GameMode, MODE_CONFIG } from '@/data/cities';
import { getPlayerStats, getLeaderboard, getGameHistory, type LeaderboardEntry, type GameHistoryEntry } from '@/lib/gameUtils';
import { useAuth } from '@/hooks/useAuth';
import { formatDistance } from '@/lib/gameUtils';
import { getPlayerLevel, getPlayerBadges } from '@/lib/levelSystem';
import { getEnergy } from '@/lib/energySystem';
import EnergyBar from './EnergyBar';
import ThemeToggle from './ThemeToggle';

interface HomeScreenProps {
  onStartGame: (difficulty: Difficulty, mode: GameMode) => void;
  onMultiplayer: () => void;
  onTimeAttack: () => void;
  onDailyChallenge: () => void;
  onStartTraining: () => void;
}

const DIFF_CONFIG: { key: Difficulty; label: string; emoji: string; desc: string; borderClass: string; glowClass: string }[] = [
  { key: 'easy',   label: 'Fácil',   emoji: '🟢', desc: '30 capitales',  borderClass: 'border-green-500/40  hover:border-green-500',  glowClass: 'hover:shadow-[0_0_18px_hsl(142_71%_45%/0.25)]' },
  { key: 'medium', label: 'Medio',   emoji: '🟡', desc: '30 regionales', borderClass: 'border-yellow-500/40 hover:border-yellow-500', glowClass: 'hover:shadow-[0_0_18px_hsl(48_96%_53%/0.25)]'  },
  { key: 'hard',   label: 'Experto', emoji: '🔴', desc: '30 difíciles',  borderClass: 'border-red-500/40    hover:border-red-500',    glowClass: 'hover:shadow-[0_0_18px_hsl(0_84%_60%/0.25)]'   },
];

const MEDALS = ['🥇', '🥈', '🥉', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];

const MODE_UNLOCK: Partial<Record<GameMode, { level: number; label: string }>> = {
  asia:   { level: 2, label: 'Nv.2' },
  africa: { level: 3, label: 'Nv.3' },
};

export default function HomeScreen({ onStartGame, onMultiplayer, onTimeAttack, onDailyChallenge, onStartTraining }: HomeScreenProps) {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const stats = getPlayerStats();
  const avgDist = stats.totalRounds > 0 ? Math.round(stats.totalDistance / stats.totalRounds) : 0;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedMode, setSelectedMode] = useState<GameMode>('world');
  const [rankingMode, setRankingMode] = useState<string>('all');
  const [showRanking, setShowRanking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMoreModes, setShowMoreModes] = useState(false);
  const history = getGameHistory();
  const playerLevel = getPlayerLevel();
  const isNewPlayer = stats.gamesPlayed === 0;

  useEffect(() => {
    if (showRanking) {
      getLeaderboard(rankingMode === 'all' ? undefined : rankingMode).then(setLeaderboard);
    }
  }, [rankingMode, showRanking]);

  return (
    <main
      className="min-h-[100dvh] flex flex-col items-center px-3 pb-4 sm:px-4 sm:pb-6 md:px-6 md:pb-6 overflow-y-auto game-bg home-safe-top"
      aria-label="Pantalla de inicio GeoSpeed"
    >
      {/* ── Top bar: energy + user + theme toggle ── */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mb-3 sm:mb-4 animate-fade-in-up flex items-center justify-between gap-2">
        <EnergyBar />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[100px]">
                👤 <span className="font-bold text-foreground">{displayName || user.email?.split('@')[0]}</span>
              </span>
              <button
                onClick={signOut}
                className="text-[10px] sm:text-xs text-muted-foreground hover:text-red-400 transition-colors px-1.5 sm:px-2 py-1 rounded border border-border active:scale-[0.97]"
                aria-label="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-0.5">
              <button
                onClick={() => navigate('/auth')}
                className="text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all active:scale-[0.97] btn-glow"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                aria-label="Iniciar sesión"
              >
                INICIAR SESIÓN
              </button>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground max-w-[130px] sm:max-w-[160px] text-right leading-tight">
                Guarda tu historial y puntuaciones
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Logo ── */}
      <div className="animate-fade-in-up mb-1 sm:mb-2 text-center">
        <span
          className="text-3xl sm:text-4xl md:text-5xl block mb-0.5 sm:mb-1"
        >📍</span>
        <h1
          className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-none"
          style={{ fontFamily: 'Impact, system-ui', color: 'hsl(var(--primary))' }}
        >
          GEOSPEED IQ CHALLENGE
        </h1>
      </div>
      <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-3 sm:mb-5 md:mb-6 animate-fade-in-up animation-delay-100 italic">
        ¿Cuánto conoces el mundo?
      </p>

      {/* ══════════════════════════════════════════
          NUEVO JUGADOR — layout simplificado
      ══════════════════════════════════════════ */}
      {isNewPlayer && (
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col gap-3 sm:gap-4 md:gap-5">

          {/* Guía de inicio */}
          <p className="text-center text-[11px] sm:text-xs text-muted-foreground uppercase tracking-widest animate-fade-in">
            ¿Por dónde quieres empezar?
          </p>

          {/* ── Hero card: Entrenamiento ── */}
          <div
            className="relative rounded-2xl border-2 border-blue-500/60 overflow-hidden animate-fade-in-up"
            style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, rgba(59,130,246,0.10) 100%)' }}
          >
            {/* Línea top accent */}
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,179,237,1), transparent)' }} />
            {/* Badge recomendado */}
            <div className="absolute top-3 right-3 bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg">
              ✨ Recomendado
            </div>
            <div className="p-4 sm:p-5 md:p-6">
              <div className="flex items-start gap-3 md:gap-4 mb-3 sm:mb-4">
                <span className="text-4xl sm:text-5xl md:text-6xl leading-none">🎓</span>
                <div>
                  <h2 className="font-black text-base sm:text-lg md:text-xl text-blue-400 leading-tight">Modo Entrenamiento</h2>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5">Pistas visuales en el mapa · 6 ciudades · sin presión de tiempo</p>
                </div>
              </div>
              <ul className="text-[10px] sm:text-xs md:text-sm text-muted-foreground space-y-1.5 mb-4 md:mb-5 pl-1">
                <li className="flex items-center gap-1.5"><span className="text-blue-400 font-bold">✓</span> El mapa te muestra la zona donde está la ciudad</li>
                <li className="flex items-center gap-1.5"><span className="text-blue-400 font-bold">✓</span> Aprende las ubicaciones sin frustrarte</li>
                <li className="flex items-center gap-1.5"><span className="text-blue-400 font-bold">✓</span> Ideal si nunca has jugado antes</li>
              </ul>
              <button
                onClick={onStartTraining}
                className="w-full py-3 sm:py-3.5 md:py-4 rounded-xl font-black text-sm sm:text-base md:text-lg tracking-wide transition-all active:scale-[0.97] hover:opacity-90 shadow-lg"
                style={{ background: 'linear-gradient(135deg, rgb(59,130,246), rgb(99,102,241))', color: '#fff' }}
              >
                COMENZAR ENTRENAMIENTO →
              </button>
            </div>
          </div>

          {/* Divisor */}
          <div className="flex items-center gap-2 animate-fade-in animation-delay-150">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest shrink-0">o si prefieres saltar directo</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Jugar ahora (fácil + mundo) ── */}
          <button
            onClick={() => onStartGame('easy', 'world')}
            className="w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 md:p-5 rounded-xl border-2 border-green-500/40 hover:border-green-500 bg-card transition-all duration-200 active:scale-[0.97] hover:shadow-[0_0_20px_hsl(142_71%_45%/0.2)] animate-fade-in animation-delay-200"
          >
            <span className="text-3xl sm:text-4xl md:text-5xl leading-none">🟢</span>
            <div className="text-left flex-1 min-w-0">
              <div className="font-black text-sm sm:text-base md:text-lg text-green-400">Jugar ahora</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Modo Fácil · Mapamundi · 13 ciudades · 15s por ronda</div>
            </div>
            <span className="text-muted-foreground text-lg md:text-xl shrink-0">▶</span>
          </button>

          {/* ── Ver más modos (acordeón) ── */}
          <div className="animate-fade-in animation-delay-300">
            <button
              onClick={() => setShowMoreModes(p => !p)}
              className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl border border-border bg-card/50 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-[0.97]"
            >
              🗂 Ver todos los modos
              <span className={`transition-transform duration-300 ${showMoreModes ? 'rotate-180' : ''}`}>▾</span>
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-out ${showMoreModes ? 'max-h-[600px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
              <div className="flex flex-col gap-2">
                {/* Desafío Diario */}
                <button
                  onClick={onDailyChallenge}
                  className="w-full flex items-center gap-2 sm:gap-3 p-3 rounded-xl border-2 border-amber-500/50 hover:border-amber-500 bg-gradient-to-r from-amber-500/10 to-orange-500/10 transition-all duration-200 active:scale-[0.97]"
                >
                  <span className="text-xl sm:text-2xl shrink-0">📅</span>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-black text-xs sm:text-sm text-amber-400">Desafío Diario</div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground">Mismas ciudades para todos · {new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' })}</div>
                  </div>
                </button>
                {/* Contrareloj + Duelo */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={onTimeAttack}
                    className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border-2 border-red-500/40 hover:border-red-500 bg-gradient-to-br from-red-500/10 to-orange-500/5 transition-all duration-200 active:scale-[0.97]"
                  >
                    <span className="text-lg sm:text-xl shrink-0">⚡</span>
                    <div className="text-left min-w-0">
                      <div className="font-bold text-[10px] sm:text-xs text-red-400">Contrareloj</div>
                      <div className="text-[8px] sm:text-[9px] text-muted-foreground">60s infinitas</div>
                    </div>
                  </button>
                  <button
                    onClick={onMultiplayer}
                    className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border-2 border-primary/40 hover:border-primary bg-gradient-to-br from-primary/10 to-emerald-500/5 transition-all duration-200 active:scale-[0.97]"
                  >
                    <span className="text-lg sm:text-xl shrink-0">🎮</span>
                    <div className="text-left min-w-0">
                      <div className="font-bold text-[10px] sm:text-xs text-primary">Modo Duelo</div>
                      <div className="text-[8px] sm:text-[9px] text-muted-foreground">1v1 en vivo</div>
                    </div>
                  </button>
                </div>
                {/* Modalidad + Dificultad compactas */}
                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2 text-center">Elegir modalidad y dificultad</p>
                  <div className="grid grid-cols-5 gap-1 mb-2" role="radiogroup">
                    {MODE_CONFIG.map(m => {
                      const lock = MODE_UNLOCK[m.key];
                      const isLocked = !!(lock && playerLevel.level < lock.level);
                      const isSelected = selectedMode === m.key;
                      return (
                        <button key={m.key} onClick={() => !isLocked && setSelectedMode(m.key)} disabled={isLocked}
                          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg border transition-all ${isLocked ? 'border-border opacity-40 cursor-not-allowed' : isSelected ? 'border-primary bg-primary/10' : 'border-border bg-muted/50 hover:border-primary/50'}`}>
                          <span className="text-base">{isLocked ? '🔒' : m.emoji}</span>
                          <span className={`text-[8px] font-bold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {DIFF_CONFIG.map(d => (
                      <button key={d.key} onClick={() => onStartGame(d.key, selectedMode)}
                        className={`flex items-center justify-center gap-1 p-2 rounded-lg border-2 bg-card transition-all active:scale-[0.97] ${d.borderClass}`}>
                        <span className="text-sm">{d.emoji}</span>
                        <span className="font-bold text-[10px] sm:text-xs text-foreground">{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom spacer */}
          <div className="h-4 sm:h-6 shrink-0" />
        </div>
      )}

      {/* ══════════════════════════════════════════
          JUGADOR RECURRENTE — layout completo
      ══════════════════════════════════════════ */}
      {!isNewPlayer && (
        <>
      {/* ── Level badge ── */}
      {stats.gamesPlayed > 0 && (() => {
        const level = getPlayerLevel();
        const badges = getPlayerBadges();
        const unlockedCount = badges.filter(b => b.unlocked).length;
        return (
          <div className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mb-3 sm:mb-4 animate-fade-in-up animation-delay-150">
            <div className="bg-card border border-border rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)/0) 0%, hsl(var(--primary)) 50%, hsl(var(--primary)/0) 100%)' }} />
              <span className="text-xl sm:text-2xl">{level.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--primary))' }}>Nv.{level.level} {level.title}</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">{level.xp.toLocaleString()} XP</span>
                </div>
                <div className="w-full h-1 sm:h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${level.progress}%`, background: 'hsl(var(--primary))' }} />
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">🏅 {unlockedCount}/{badges.length}</span>
            </div>
          </div>
        );
      })()}

      {/* ── Stats ── */}
      {stats.gamesPlayed > 0 && (
        <div
          className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-5 md:mb-6 w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl animate-fade-in-up animation-delay-200"
          role="group"
          aria-label="Estadísticas del jugador"
        >
          <StatCard label="Partidas"   value={stats.gamesPlayed.toString()} />
          <StatCard label="Récord"     value={stats.bestScore.toLocaleString()} />
          <StatCard label="Dist. prom." value={`${avgDist.toLocaleString()} km`} />
        </div>
      )}

      {/* ── Modo Entrenamiento ── */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mb-2 sm:mb-3 animate-fade-in-up animation-delay-250">
        <button
          onClick={onStartTraining}
          className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border-2 border-blue-500/40 hover:border-blue-500 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 transition-all duration-200 active:scale-[0.97] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
          aria-label="Modo entrenamiento para novatos"
        >
          <span className="text-xl sm:text-2xl shrink-0">🎓</span>
          <div className="text-left flex-1 min-w-0">
            <div className="font-bold text-xs sm:text-sm text-blue-400">Modo Entrenamiento</div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground">Pistas en el mapa · 6 ciudades · aprende geografía</div>
          </div>
        </button>
      </div>

      {/* ── Desafío Diario ── */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mb-2 sm:mb-3 animate-fade-in-up animation-delay-300">
        <button
          onClick={onDailyChallenge}
          className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 border-amber-500/50 hover:border-amber-500 bg-gradient-to-r from-amber-500/10 to-orange-500/10 transition-all duration-200 active:scale-[0.97] animate-pulse-glow-subtle"
          aria-label="Desafío diario"
        >
          <span className="text-xl sm:text-2xl shrink-0">📅</span>
          <div className="text-left flex-1 min-w-0">
            <div className="font-black text-xs sm:text-sm text-amber-400">DESAFÍO DIARIO</div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate">Mismas ciudades para todos · ¿Quién hace más puntos?</div>
          </div>
          <span className="text-[10px] sm:text-xs font-mono text-muted-foreground shrink-0">
            {new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' })}
          </span>
        </button>
      </div>

      {/* ── Contrareloj + Duelo ── */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mb-3 sm:mb-4 animate-fade-in-up animation-delay-350 grid grid-cols-2 gap-1.5 sm:gap-2">
        <button
          onClick={onTimeAttack}
          className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 border-red-500/40 hover:border-red-500 bg-gradient-to-br from-red-500/10 to-orange-500/5 transition-all duration-200 active:scale-[0.97] hover:shadow-[0_0_20px_hsl(0_84%_60%/0.2)]"
          aria-label="Modo contrareloj extremo"
        >
          <span className="text-lg sm:text-xl shrink-0">⚡</span>
          <div className="text-left min-w-0">
            <div className="font-bold text-[10px] sm:text-xs text-red-400">Contrareloj</div>
            <div className="text-[8px] sm:text-[10px] text-muted-foreground">60s · infinitas</div>
          </div>
        </button>
        <button
          onClick={onMultiplayer}
          className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 border-primary/40 hover:border-primary bg-gradient-to-br from-primary/10 to-emerald-500/5 transition-all duration-200 active:scale-[0.97] hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
          aria-label="Modo duelo 1 contra 1"
        >
          <span className="text-lg sm:text-xl shrink-0">🎮</span>
          <div className="text-left min-w-0">
            <div className="font-bold text-[10px] sm:text-xs text-primary">Modo Duelo</div>
            <div className="text-[8px] sm:text-[10px] text-muted-foreground">1v1 en vivo</div>
          </div>
        </button>
      </div>

      {/* ── Modalidad ── */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mb-3 sm:mb-4 animate-fade-in-up animation-delay-400">
        <p className="text-[10px] sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 text-center uppercase tracking-widest" id="mode-label">Modalidad</p>
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5 md:gap-2" role="radiogroup" aria-labelledby="mode-label">
          {MODE_CONFIG.map(m => {
            const lock = MODE_UNLOCK[m.key];
            const isLocked = lock && playerLevel.level < lock.level;
            const isSelected = selectedMode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => !isLocked && setSelectedMode(m.key)}
                role="radio"
                aria-checked={isSelected}
                disabled={!!isLocked}
                className={`relative flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] ${
                  isLocked
                    ? 'border-border bg-card/50 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'border-primary bg-primary/10 btn-glow'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <span className="text-lg sm:text-xl md:text-2xl">{isLocked ? '🔒' : m.emoji}</span>
                <span className={`text-[9px] sm:text-[11px] md:text-sm font-bold leading-tight text-center ${isLocked ? 'text-muted-foreground' : isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {m.label}
                </span>
                {isLocked && <span className="text-[7px] sm:text-[8px] text-muted-foreground">{lock.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Dificultad ── */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mb-3 sm:mb-5 animate-fade-in-up animation-delay-450" role="group" aria-label="Seleccionar dificultad">
        <p className="text-[10px] sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 text-center uppercase tracking-widest">Elige dificultad</p>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {DIFF_CONFIG.map(d => (
            <button
              key={d.key}
              onClick={() => onStartGame(d.key, selectedMode)}
              className={`flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-xl border-2 bg-card transition-all duration-200 active:scale-[0.97] ${d.borderClass} ${d.glowClass}`}
              aria-label={`Dificultad ${d.label}: ${d.desc}`}
            >
              <span className="text-base sm:text-lg">{d.emoji}</span>
              <div className="font-bold text-xs sm:text-sm text-foreground">{d.label}</div>
              <div className="text-[8px] sm:text-[10px] text-muted-foreground text-center leading-tight">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Collapsible Ranking ── */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl animate-fade-in-up animation-delay-400">
        <button
          onClick={() => setShowRanking(prev => !prev)}
          className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl border border-border bg-card/50 text-xs sm:text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-[0.97]"
          aria-expanded={showRanking}
          aria-controls="ranking-panel"
        >
          🏆 Ranking Top 10
          <span className={`transition-transform duration-300 ${showRanking ? 'rotate-180' : ''}`}>▾</span>
        </button>

        <div
          id="ranking-panel"
          className={`overflow-hidden transition-all duration-500 ease-out ${showRanking ? 'max-h-[600px] opacity-100 mt-2 sm:mt-3' : 'max-h-0 opacity-0'}`}
        >
          <div className="grid grid-cols-6 gap-1 sm:gap-1.5 mb-2 sm:mb-3 w-full" role="tablist" aria-label="Filtrar ranking por modo">
            {[{ key: 'all', label: 'Todos' }, ...MODE_CONFIG].map(m => (
              <button
                key={m.key}
                onClick={() => setRankingMode(m.key)}
                role="tab"
                aria-selected={rankingMode === m.key}
                className={`flex-1 px-0.5 sm:px-1 py-1 sm:py-1.5 rounded-md text-[8px] sm:text-[10px] font-bold whitespace-nowrap transition-all active:scale-[0.97] ${
                  rankingMode === m.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="bg-card rounded-xl border overflow-hidden" role="table" aria-label="Tabla de ranking">
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs sm:text-sm py-4 sm:py-6">🌍 ¡Sé el primero en conquistar el ranking!</p>
            ) : (
              leaderboard.map((entry: LeaderboardEntry, i: number) => (
                <div key={i} className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border-b border-border last:border-0" role="row">
                  <span className="w-6 sm:w-7 text-center text-xs sm:text-sm">{MEDALS[i] || `${i + 1}.`}</span>
                  <span className="font-mono font-bold flex-1 text-xs sm:text-sm" style={{ color: 'hsl(var(--primary))' }}>{entry.initials}</span>
                  <span className="font-mono text-[8px] sm:text-[10px] text-muted-foreground mr-1 sm:mr-1.5">{MODE_CONFIG.find(m => m.key === entry.mode)?.label || entry.mode}</span>
                  <span className="font-mono text-[8px] sm:text-[10px] text-muted-foreground mr-1.5 sm:mr-2">{entry.difficulty}</span>
                  <span className="font-mono font-bold text-xs sm:text-sm">{entry.score.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Collapsible History ── */}
      {history.length > 0 && (
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mt-2 sm:mt-3 animate-fade-in-up animation-delay-400">
          <button
            onClick={() => setShowHistory(prev => !prev)}
            className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl border border-border bg-card/50 text-xs sm:text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-[0.97]"
            aria-expanded={showHistory}
            aria-controls="history-panel"
          >
            📋 Historial de partidas
            <span className={`transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`}>▾</span>
          </button>

          <div
            id="history-panel"
            className={`overflow-hidden transition-all duration-500 ease-out ${showHistory ? 'max-h-[500px] opacity-100 mt-2 sm:mt-3' : 'max-h-0 opacity-0'}`}
          >
            <div className="bg-card rounded-xl border overflow-hidden divide-y divide-border max-h-[300px] sm:max-h-[350px] overflow-y-auto">
              {history.map((entry: GameHistoryEntry, i: number) => {
                const dateStr = new Date(entry.date).toLocaleDateString('es', { day: 'numeric', month: 'short' });
                const modeLabel = MODE_CONFIG.find(m => m.key === entry.mode)?.label || entry.mode;
                return (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs">
                    <span className="text-muted-foreground w-[44px] sm:w-[52px] shrink-0">{dateStr}</span>
                    <span className="shrink-0">{entry.type === 'timeattack' ? '⚡' : '🎮'}</span>
                    <span className="text-muted-foreground shrink-0">{modeLabel}</span>
                    <span className="text-muted-foreground shrink-0">{entry.difficulty}</span>
                    <span className="flex-1" />
                    <span className="font-mono text-[8px] sm:text-[10px] text-muted-foreground">{formatDistance(entry.avgDistance)}</span>
                    <span className="font-mono font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--primary))' }}>{entry.score.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-4 sm:h-6 shrink-0" />
        </>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-2 sm:p-2.5 md:p-3 text-center relative overflow-hidden">
      {/* Accent top line */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: 'hsl(var(--primary))' }} />
      <div className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mb-0.5 mt-0.5">{label}</div>
      <div className="text-sm sm:text-base md:text-lg font-bold font-mono" style={{ color: 'hsl(var(--primary))' }}>{value}</div>
    </div>
  );
}
