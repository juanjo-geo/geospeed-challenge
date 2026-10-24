import { useCallback, useMemo, useState, lazy, Suspense, type ReactNode } from 'react';
import { CATEGORY_ART, CATEGORY_KEY, categoriesForMode, categoryForMode, type Category } from '@/lib/catalog';
import { MODE_CONFIG, isPackMode, type Difficulty, type GameMode } from '@/data/cities';
import { createChallenge, normalizeCode, isValidCode, ChallengeError, type Challenge } from '@/lib/challenges';
import { getFlag } from '@/lib/featureFlags';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { ChevronIcon } from '@/components/ui/icons';
import { REGION_ART, DIFF_ART, DIFF_ORDER, REGION_FLAG } from '@/lib/selectionArt';
import { isProPack } from '@/lib/packAccess';
import SelectorSheet, { type SelectorOption } from './SelectorSheet';
import Mascot from './Mascot';
// Globo que gira entre los dos exploradores (polígonos en carga diferida)
const SplashGlobe = lazy(() => import('./SplashGlobe'));

interface FriendsScreenProps {
  initialMode: GameMode;
  initialDifficulty: Difficulty;
  /** Fase 6: ciudades o banderas */
  initialCategory?: Category;
  onBack: () => void;
  onCreated: (ch: Challenge) => void;
  /** Abre la invitación de un código (pantalla de reto) */
  onOpenCode: (code: string) => void;
  onSignIn: () => void;
  /** Duelo en vivo (oculto tras el flag live_duel_enabled, D8) */
  onLiveDuel?: () => void;
}

/**
 * "Jugar con amigos" (maqueta Amigos_Asincronico_APROBADA_v2): dos exploradores con el globo y la insignia
 * "Reto entre amigos", crear un reto (región y dificultad en las mismas hojas del Inicio) o unirse con código.
 */
export default function FriendsScreen({ initialMode, initialDifficulty, initialCategory = 'cities', onBack, onCreated, onOpenCode, onSignIn, onLiveDuel }: FriendsScreenProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [category, setCategory] = useState<Category>(() => categoryForMode(initialCategory, initialMode));
  const [sheet, setSheet] = useState<null | 'region' | 'difficulty' | 'category'>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
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
      const ch = await createChallenge({ mode, difficulty, category, requestId });
      setRequestId(crypto.randomUUID());
      onCreated(ch);
    } catch (e) {
      setError(e instanceof ChallengeError && e.code === 'auth_required' ? 'auth_required' : 'network');
    } finally {
      setCreating(false);
    }
  };

  const regionOptions: SelectorOption<GameMode>[] = useMemo(() => MODE_CONFIG.filter(m => !isProPack(m.key)).map(m => ({
    key: m.key, emoji: REGION_ART[m.key].emoji, art: REGION_ART[m.key].art,
    icon: REGION_FLAG[m.key] ? <img src={REGION_FLAG[m.key]} alt="" className="w-12 short:w-9 aspect-[3/2] object-cover rounded-md ring-1 ring-black/20" /> : undefined,
    label: t(`mode_${m.key}` as never) || m.label, desc: t(`region_desc_${m.key}` as never),
  })), [t]);
  const difficultyOptions: SelectorOption<Difficulty>[] = useMemo(() => DIFF_ORDER.map(d => {
    const cap = d.charAt(0).toUpperCase() + d.slice(1);
    return { key: d, emoji: DIFF_ART[d].emoji, art: DIFF_ART[d].art, label: t(`home_diff${cap}` as never), desc: t(`home_diff${cap}Desc` as never) };
  }), [t]);
  const regionLabel = regionOptions.find(o => o.key === mode)?.label ?? mode;
  const diffLabel = difficultyOptions.find(o => o.key === difficulty)?.label ?? difficulty;
  const categoryOptions: SelectorOption<Category>[] = useMemo(() => categoriesForMode(mode).map(c => ({
    key: c, emoji: CATEGORY_ART[c].emoji, art: CATEGORY_ART[c].art, label: t(CATEGORY_KEY[c] as never), desc: t((c === 'cities' && isPackMode(mode) ? 'cat_citiesPackDesc' : `${CATEGORY_KEY[c]}Desc`) as never),
  })), [t, mode]);
  const categoryLabel = t(CATEGORY_KEY[category] as never);

  const normalized = normalizeCode(code);
  const canJoin = isValidCode(normalized);
  const showLiveDuel = !!onLiveDuel && getFlag('live_duel_enabled');

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-5xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('friends_title')} subtitle={t('friends_subtitle')} />

        {/* Ilustración: explorador amarillo · globo · explorador turquesa, e insignia */}
        <div className="relative flex flex-col items-center -mt-1 mb-4 short:hidden" aria-hidden>
          <div className="relative flex items-end justify-center gap-1 sm:gap-3">
            <span className="block w-[30vw] max-w-[150px] -rotate-6"><Mascot state="celebrate" className="w-full" /></span>
            <div className="w-[24vw] max-w-[120px] mb-2 rounded-full shadow-[0_0_30px_hsl(var(--accent)/0.45)]">
              <Suspense fallback={<div className="w-full aspect-square rounded-full bg-accent/20" />}><SplashGlobe /></Suspense>
            </div>
            <span className="block w-[30vw] max-w-[150px] rotate-6 -scale-x-100 [filter:hue-rotate(125deg)_saturate(1.3)]"><Mascot state="celebrate" className="w-full" /></span>
          </div>
          <span className="-mt-3 relative rounded-full border-2 border-primary bg-background/90 px-5 py-1.5 text-sm sm:text-base font-extrabold tracking-wide shadow-[0_0_18px_hsl(var(--primary)/0.35)]">
            {t('friends_badge').split(' ').slice(0, -1).join(' ')} <span className="text-primary">{t('friends_badge').split(' ').slice(-1)[0]}</span>
          </span>
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
          <section className="rounded-3xl border-2 border-accent/50 bg-card/75 p-4 sm:p-5 flex flex-col shadow-[0_0_20px_hsl(var(--accent)/0.12)]">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-5xl sm:text-6xl" aria-hidden>🎮</span>
              <div className="min-w-0">
                <h2 className="text-[min(5.6vw,1.5rem)] sm:text-3xl font-extrabold leading-tight">{t('friends_createLead')} <span className="text-primary">{t('friends_createTail')}</span></h2>
                <p className="text-sm sm:text-base text-foreground/80">{t('friends_createDesc')}</p>
              </div>
            </div>
            {/* Partida del reto: las mismas hojas de Región y Dificultad del Inicio */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <PickButton label={t('ch_category')} emoji={CATEGORY_ART[category].emoji} value={categoryLabel} onClick={() => { playButtonTap(); setSheet('category'); }} />
              <PickButton label={t('ch_region')} emoji={REGION_FLAG[mode] ? <img src={REGION_FLAG[mode]} alt="" className="w-6 aspect-[3/2] object-cover rounded-[3px] ring-1 ring-black/20" /> : REGION_ART[mode].emoji} value={regionLabel} onClick={() => { playButtonTap(); setSheet('region'); }} />
              <PickButton label={t('ch_difficulty')} emoji={DIFF_ART[difficulty].emoji} value={diffLabel} onClick={() => { playButtonTap(); setSheet('difficulty'); }} />
            </div>
            <div className="flex-1" />
            <button onClick={create} disabled={creating} className="btn3d w-full rounded-2xl py-3.5 short:py-2.5 font-black text-lg sm:text-xl text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2.5" style={{ background: 'var(--grad-cta)' }}>
              {creating ? <span aria-hidden>⏳</span> : <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>}
              {t('friends_create')}
            </button>
          </section>

          {/* ── Unirse con código ── */}
          <section className="rounded-3xl border-2 border-accent/50 bg-card/75 p-4 sm:p-5 flex flex-col shadow-[0_0_20px_hsl(var(--accent)/0.12)]">
            <div className="flex items-center gap-3 mb-3">
              <LinkIcon className="w-14 h-14 sm:w-16 sm:h-16 text-accent drop-shadow-[0_0_10px_hsl(var(--accent)/0.6)]" />
              <div className="min-w-0">
                <h2 className="text-[min(5.6vw,1.5rem)] sm:text-3xl font-extrabold leading-tight">{t('friends_joinLead')} <span className="text-primary">{t('friends_joinTail')}</span></h2>
                <p className="text-sm sm:text-base text-foreground/80">{t('friends_joinDesc')}</p>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (canJoin) { playButtonTap(); onOpenCode(normalized); } }} className="flex flex-col gap-3 mt-auto">
              <label className="relative">
                <span className="sr-only">{t('friends_codePlaceholder')}</span>
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/60" />
                <input
                  value={code}
                  onChange={(e) => setCode(normalizeCode(e.target.value))}
                  placeholder={t('friends_codePlaceholder')}
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={7}
                  className="w-full rounded-2xl border-2 border-foreground/20 bg-background/50 pl-11 pr-3 py-3.5 font-extrabold text-lg tracking-[0.35em] uppercase placeholder:tracking-normal placeholder:normal-case placeholder:font-medium placeholder:text-base placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <button type="submit" disabled={!canJoin}
                className="w-full rounded-2xl py-3.5 short:py-2.5 border-2 border-accent text-accent font-black text-lg sm:text-xl hover:bg-accent/10 transition-colors active:scale-[0.98] disabled:opacity-45">
                {t('friends_join')}
              </button>
            </form>
          </section>
        </div>

        <div className="mt-4 flex items-start justify-center gap-3 text-left max-w-xl mx-auto">
          <InfoIcon className="w-7 h-7 text-accent mt-0.5" />
          <p className="text-sm sm:text-base">
            <span className="font-semibold">{t('friends_infoLead')}</span>
            <span className="block text-foreground/70 text-xs sm:text-sm">{t('friends_infoTail')}</span>
          </p>
        </div>
        {showLiveDuel && (
          <p className="mt-2 text-center">
            <button onClick={() => { playButtonTap(); onLiveDuel?.(); }} className="text-xs text-muted-foreground underline hover:text-foreground">{t('friends_liveDuel')}</button>
          </p>
        )}
        <button onClick={() => { playButtonTap(); onBack(); }} className="mt-4 mb-2 w-full max-w-xl mx-auto flex items-center justify-center gap-2 rounded-2xl border-2 border-accent/50 py-3 font-bold hover:bg-accent/10 transition-colors active:scale-[0.98]">
          <ChevronIcon dir="left" className="w-5 h-5" /> {t('ob_backHome')}
        </button>
      </div>

      {sheet === 'region' && (
        <SelectorSheet<GameMode>
          title={t('region_title')} subtitle={t('region_subtitle')} options={regionOptions} selected={mode}
          confirmLabel={t('region_confirm')} footnote={t('region_keepDifficulty')}
          onConfirm={(k) => { setMode(k); setCategory((c) => categoryForMode(c, k)); setSheet(null); }} onClose={closeSheet} closeLabel={t('close')}
        />
      )}
      {sheet === 'category' && (
        <SelectorSheet<Category>
          title={t('cat_title')} subtitle={t('cat_subtitle')} options={categoryOptions} selected={category}
          confirmLabel={t('cat_confirm')}
          onConfirm={(k) => { setCategory(k); setSheet(null); }} onClose={closeSheet} closeLabel={t('close')}
        />
      )}
      {sheet === 'difficulty' && (
        <SelectorSheet<Difficulty>
          title={t('diff_title')} subtitle={t('diff_subtitle')} options={difficultyOptions} selected={difficulty}
          confirmLabel={t('diff_confirm')} footnote={t('diff_keepRegion')}
          onConfirm={(k) => { setDifficulty(k); setSheet(null); }} onClose={closeSheet} closeLabel={t('close')}
        />
      )}
    </div>
  );
}

function PickButton({ label, emoji, value, onClick }: { label: string; emoji: ReactNode; value: string; onClick: () => void }) {
  return (
    <div className="min-w-0">
      <span className="block text-xs font-semibold text-foreground/70 mb-1">{label}</span>
      <button onClick={onClick} aria-haspopup="dialog" aria-label={`${label}: ${value}`}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border border-accent/40 bg-background/50 hover:border-accent transition-colors active:scale-[0.98] text-left">
        <span className="text-xl shrink-0" aria-hidden>{emoji}</span>
        <span className="flex-1 min-w-0 font-bold text-sm sm:text-base truncate">{value}</span>
        <ChevronIcon dir="down" className="w-4 h-4 text-foreground/70" />
      </button>
    </div>
  );
}

const LinkIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
  </svg>
);

const InfoIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="9.5" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r="0.6" fill="currentColor" />
  </svg>
);
