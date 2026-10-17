import { useState } from 'react';
import { MODE_CONFIG, type Difficulty, type GameMode } from '@/data/cities';
import { createChallenge, normalizeCode, isValidCode, ChallengeError, type Challenge } from '@/lib/challenges';
import { getFlag } from '@/lib/featureFlags';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Mascot from './Mascot';

interface FriendsScreenProps {
  initialMode: GameMode;
  initialDifficulty: Difficulty;
  onBack: () => void;
  onCreated: (ch: Challenge) => void;
  /** Abre la invitación de un código (pantalla de reto) */
  onOpenCode: (code: string) => void;
  onSignIn: () => void;
  /** Duelo en vivo (oculto tras el flag live_duel_enabled, D8) */
  onLiveDuel?: () => void;
}

const DIFFS: Difficulty[] = ['basic', 'easy', 'medium', 'hard'];

/** "Jugar con amigos" (maqueta Amigos_Asincronico_APROBADA_v2): crear reto o unirse con código. */
export default function FriendsScreen({ initialMode, initialDifficulty, onBack, onCreated, onOpenCode, onSignIn, onLiveDuel }: FriendsScreenProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<'auth_required' | 'network' | null>(null);
  // Un id por intento: si el usuario toca dos veces o se reintenta, el servidor devuelve el mismo reto
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const create = async () => {
    if (creating) return;
    playButtonTap();
    setCreating(true);
    setError(null);
    try {
      const ch = await createChallenge({ mode, difficulty, requestId });
      setRequestId(crypto.randomUUID());
      onCreated(ch);
    } catch (e) {
      setError(e instanceof ChallengeError && e.code === 'auth_required' ? 'auth_required' : 'network');
    } finally {
      setCreating(false);
    }
  };

  const normalized = normalizeCode(code);
  const canJoin = isValidCode(normalized);
  const showLiveDuel = !!onLiveDuel && getFlag('live_duel_enabled');

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-5xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('friends_title')} subtitle={t('friends_subtitle')} />

        <div className="flex items-center justify-center gap-3 mb-4 short:hidden" aria-hidden>
          <Mascot state="wink" className="w-16 sm:w-20" />
          <span className="rounded-full border-2 border-primary px-4 py-1 text-xs sm:text-sm font-black tracking-wide">{t('friends_badge')}</span>
          <Mascot state="celebrate" className="w-16 sm:w-20 hue-rotate-[140deg]" />
        </div>

        {error && (
          <div className="mb-3 rounded-2xl border border-destructive/50 bg-destructive/10 p-3 text-sm flex flex-wrap items-center justify-center gap-3 text-center" role="alert">
            <span>{error === 'auth_required' ? t('friends_needLogin') : t('friends_errorNetwork')}</span>
            {error === 'auth_required' && (
              <button onClick={() => { playButtonTap(); onSignIn(); }} className="rounded-xl bg-primary text-primary-foreground px-3 py-1.5 font-black text-xs">{t('friends_signIn')}</button>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
          {/* ── Crear un reto ── */}
          <section className="rounded-3xl border border-accent/40 bg-card/70 p-4 sm:p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl sm:text-5xl" aria-hidden>🎮</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black leading-tight">{t('friends_createLead')} <span className="text-primary">{t('friends_createTail')}</span></h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('friends_createDesc')}</p>
              </div>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{t('ch_region')}</p>
            <div className="grid grid-cols-5 gap-1.5 mb-3" role="radiogroup" aria-label={t('ch_region')}>
              {MODE_CONFIG.map(m => (
                <button key={m.key} role="radio" aria-checked={mode === m.key} onClick={() => { playButtonTap(); setMode(m.key); }}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border-2 py-1.5 transition-all active:scale-[0.97] ${mode === m.key ? 'border-accent bg-accent/10' : 'border-border bg-muted/20 hover:border-accent/50'}`}>
                  <span className="text-lg" aria-hidden>{m.emoji}</span>
                  <span className={`text-[10px] sm:text-xs font-bold ${mode === m.key ? 'text-accent' : ''}`}>{t(`mode_${m.key}` as never) || m.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{t('ch_difficulty')}</p>
            <div className="grid grid-cols-4 gap-1.5 mb-4" role="radiogroup" aria-label={t('ch_difficulty')}>
              {DIFFS.map(d => (
                <button key={d} role="radio" aria-checked={difficulty === d} onClick={() => { playButtonTap(); setDifficulty(d); }}
                  className={`rounded-xl border-2 py-2 text-[11px] sm:text-xs font-bold transition-all active:scale-[0.97] ${difficulty === d ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-muted/20 hover:border-accent/50'}`}>
                  {t(`diff_${d}` as never)}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <button onClick={create} disabled={creating} className="btn3d w-full rounded-2xl py-3.5 short:py-2.5 font-black text-base sm:text-lg text-primary-foreground disabled:opacity-60" style={{ background: 'var(--grad-cta)' }}>
              {creating ? '⏳' : '＋'} {t('friends_create')}
            </button>
          </section>

          {/* ── Unirse con código ── */}
          <section className="rounded-3xl border border-accent/40 bg-card/70 p-4 sm:p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl sm:text-5xl" aria-hidden>🔗</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black leading-tight">{t('friends_joinLead')} <span className="text-primary">{t('friends_joinTail')}</span></h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('friends_joinDesc')}</p>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (canJoin) { playButtonTap(); onOpenCode(normalized); } }} className="flex flex-col gap-3 mt-auto">
              <label className="relative">
                <span className="sr-only">{t('friends_codePlaceholder')}</span>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden>🔗</span>
                <input
                  value={code}
                  onChange={(e) => setCode(normalizeCode(e.target.value))}
                  placeholder={t('friends_codePlaceholder')}
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={7}
                  className="w-full rounded-2xl border border-accent/40 bg-muted/30 pl-10 pr-3 py-3 font-mono font-black text-lg tracking-[0.35em] uppercase placeholder:tracking-normal placeholder:font-sans placeholder:font-semibold placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <button type="submit" disabled={!canJoin}
                className="w-full rounded-2xl py-3 short:py-2.5 border-2 border-accent text-accent font-black text-base sm:text-lg hover:bg-accent/10 transition-colors active:scale-[0.98] disabled:opacity-40">
                {t('friends_join')}
              </button>
            </form>
          </section>
        </div>

        <p className="mt-4 text-center text-xs sm:text-sm text-muted-foreground">ⓘ {t('friends_info')}</p>
        {showLiveDuel && (
          <p className="mt-2 text-center">
            <button onClick={() => { playButtonTap(); onLiveDuel?.(); }} className="text-xs text-muted-foreground underline hover:text-foreground">{t('friends_liveDuel')}</button>
          </p>
        )}
      </div>
    </div>
  );
}
