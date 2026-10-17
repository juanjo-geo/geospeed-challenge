import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n, LOCALES } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useA11y } from '@/contexts/AccessibilityContext';
import { getPrefs, setPref, subscribePrefs, type Prefs } from '@/lib/prefs';
import { isMusicMuted, toggleMuted as toggleMusicMuted } from '@/hooks/useBackgroundMusic';
import { playButtonTap } from '@/lib/sounds';
import { hapticTap } from '@/lib/haptics';
import Wordmark from '@/components/ui/Wordmark';

interface SettingsScreenProps {
  onBack: () => void;
  /** Abre el banner "¿Cómo se juega?" en Inicio */
  onHowToPlay: () => void;
}

/**
 * Ajustes (maqueta GeoSpeed_Ajustes_*_APROBADA_v1):
 * Preferencias (música, efectos, vibración, reducir movimiento) · Idioma · Ayuda · Privacidad · Cuenta.
 * Las preferencias viven en src/lib/prefs.ts; la música en useBackgroundMusic (clave histórica).
 */
export default function SettingsScreen({ onBack, onHowToPlay }: SettingsScreenProps) {
  const { t, locale, setLocale } = useI18n();
  const { user, displayName, signOut, isAnonymous } = useAuth();
  const { colorblind, toggleColorblind } = useA11y();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(getPrefs);
  const [musicMuted, setMusicMuted] = useState(isMusicMuted);
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  useEffect(() => subscribePrefs(setPrefs), []);

  const toggle = (key: keyof Prefs) => {
    const next = !prefs[key];
    setPref(key, next);
    // Feedback con el nuevo estado ya aplicado (si acaba de encender vibración, que vibre)
    if (key === 'haptics' && next) hapticTap();
    if (key !== 'sfx' || next) playButtonTap();
  };

  const onToggleMusic = () => {
    toggleMusicMuted();
    setMusicMuted(isMusicMuted());
    playButtonTap();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:px-6 overflow-y-auto game-bg">
      <div className="w-full max-w-lg animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <button
            onClick={() => { playButtonTap(); onBack(); }}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-border/60 bg-card/60 hover:bg-muted transition-all active:scale-[0.95]"
            aria-label={t('back')}
          >
            <span aria-hidden className="text-lg">‹</span>
          </button>
          <div className="flex-1 flex items-center gap-2">
            <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
            <Wordmark size="sm" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-4 sm:mb-5">{t('settings_title')}</h1>

        {/* Preferencias */}
        <Section title={t('settings_prefs')}>
          <ToggleRow icon="🎵" label={t('settings_music')} on={!musicMuted} onToggle={onToggleMusic} />
          <ToggleRow icon="🔊" label={t('settings_sfx')} on={prefs.sfx} onToggle={() => toggle('sfx')} />
          <ToggleRow
            icon="📳"
            label={t('settings_haptics')}
            desc={canVibrate ? undefined : t('settings_hapticsUnsupported')}
            on={prefs.haptics && canVibrate}
            disabled={!canVibrate}
            onToggle={() => toggle('haptics')}
          />
          <ToggleRow icon="🌀" label={t('settings_reduceMotion')} desc={t('settings_reduceMotionDesc')} on={prefs.reduceMotion} onToggle={() => toggle('reduceMotion')} />
          <ToggleRow icon="👁️" label={t('settings_colorblind')} desc={t('settings_colorblindDesc')} on={colorblind} onToggle={() => { toggleColorblind(); playButtonTap(); }} last />
        </Section>

        {/* Idioma */}
        <Section title={t('settings_language')}>
          <div className="flex gap-2 p-1">
            {LOCALES.map(l => (
              <button
                key={l.key}
                onClick={() => { playButtonTap(); setLocale(l.key); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-[0.97] ${
                  locale === l.key ? 'border-accent bg-accent/15 text-foreground' : 'border-border text-muted-foreground hover:border-accent/50'
                }`}
                aria-pressed={locale === l.key}
              >
                <span className="mr-1.5" aria-hidden>{l.flag}</span>{l.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Ayuda */}
        <Section title={t('settings_help')}>
          <LinkRow icon="❓" label={t('settings_howToPlay')} onClick={() => { playButtonTap(); onHowToPlay(); }} />
          <LinkRow icon="💬" label={t('settings_support')} onClick={() => navigate('/support')} last />
        </Section>

        {/* Privacidad */}
        <Section title={t('settings_privacySection')}>
          <LinkRow icon="🛡️" label={t('settings_privacy')} onClick={() => navigate('/privacy')} />
          <LinkRow icon="📄" label={t('settings_terms')} onClick={() => navigate('/terms')} last />
        </Section>

        {/* Cuenta */}
        <Section title={t('settings_account')}>
          {user && !isAnonymous ? (
            <>
              <div className="px-3 py-3 text-sm">
                <p className="text-muted-foreground text-xs">{t('settings_signedInAs')}</p>
                <p className="font-bold truncate">{displayName || user.email}</p>
              </div>
              <LinkRow
                icon="🚪"
                label={t('home_signOut')}
                onClick={() => { if (window.confirm(t('settings_signOutConfirm'))) signOut(); }}
                last
              />
            </>
          ) : (
            <>
              <div className="px-3 py-3 text-sm">
                <p className="font-bold">{t('acc_guestTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('acc_guestDesc')}</p>
              </div>
              <LinkRow icon="✨" label={t('acc_createAccount')} onClick={() => navigate('/auth?mode=signup')} />
              <LinkRow icon="👤" label={t('acc_haveAccount')} onClick={() => navigate('/auth')} last />
            </>
          )}
        </Section>

        <div className="h-6" />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border border-border bg-card/70 overflow-hidden">
      <h2 className="px-4 pt-3 pb-1 text-base sm:text-lg font-black text-accent">{title}</h2>
      <div className="px-2 pb-2">{children}</div>
    </section>
  );
}

function ToggleRow({ icon, label, desc, on, onToggle, disabled, last }: {
  icon: string; label: string; desc?: string; on: boolean; onToggle: () => void; disabled?: boolean; last?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-2 py-3 text-left transition-colors ${last ? '' : 'border-b border-border/50'} ${disabled ? 'opacity-50' : 'hover:bg-muted/40'}`}
    >
      <span className="w-8 text-center text-lg" aria-hidden>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-sm sm:text-base">{label}</span>
        {desc && <span className="block text-[11px] sm:text-xs text-muted-foreground">{desc}</span>}
      </span>
      <span
        className={`relative inline-block w-12 h-7 rounded-full transition-colors shrink-0 ${on ? 'bg-accent' : 'bg-muted'}`}
        aria-hidden
      >
        <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}

function LinkRow({ icon, label, onClick, last }: { icon: string; label: string; onClick: () => void; last?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-muted/40 transition-colors ${last ? '' : 'border-b border-border/50'}`}
    >
      <span className="w-8 text-center text-lg" aria-hidden>{icon}</span>
      <span className="flex-1 font-bold text-sm sm:text-base">{label}</span>
      <span className="text-muted-foreground" aria-hidden>›</span>
    </button>
  );
}
