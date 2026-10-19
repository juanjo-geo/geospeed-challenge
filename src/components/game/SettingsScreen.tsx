import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n, LOCALES, type Locale } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useA11y } from '@/contexts/AccessibilityContext';
import { getPrefs, setPref, subscribePrefs, type Prefs } from '@/lib/prefs';
import { isMusicMuted, toggleMuted as toggleMusicMuted } from '@/hooks/useBackgroundMusic';
import { playButtonTap } from '@/lib/sounds';
import { hapticTap } from '@/lib/haptics';
import Wordmark from '@/components/ui/Wordmark';
import { HudIconButton } from './GameHud';
import Flag from '@/components/ui/Flag';
import { ChevronIcon } from '@/components/ui/icons';
import Mascot from './Mascot';
import SelectorSheet from './SelectorSheet';
import DeleteAccountDialog from '@/components/account/DeleteAccountDialog';
const SplashGlobe = lazy(() => import('./SplashGlobe'));

interface SettingsScreenProps {
  onBack: () => void;
  /** Abre ¿Cómo jugar? */
  onHowToPlay: () => void;
}

/** Cada idioma se describe en su propia lengua (así lo reconoce quien no entiende el actual) */
const LANG_DESC: Record<Locale, string> = { es: 'Textos del juego en español', en: 'Game texts in English' };
const LANG_FLAG_COUNTRY: Record<Locale, string> = { es: 'España', en: 'Reino Unido' };

/**
 * Ajustes (maquetas GeoSpeed_Ajustes_Movil/Computador_APROBADA_v1): tarjetas con borde turquesa e íconos de
 * línea — Preferencias (música, efectos, vibración, reducir movimiento y, aunque no está en la maqueta, modo
 * daltónico) · Idioma (fila que abre el selector) · Ayuda · Privacidad (+ Términos) · Cuenta.
 * En computador: Preferencias a la izquierda y el resto en una columna a la derecha.
 * Las preferencias viven en src/lib/prefs.ts; la música en useBackgroundMusic (clave histórica).
 */
export default function SettingsScreen({ onBack, onHowToPlay }: SettingsScreenProps) {
  const { t, locale, setLocale } = useI18n();
  const { user, displayName, signOut, isAnonymous } = useAuth();
  const { colorblind, toggleColorblind } = useA11y();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(getPrefs);
  const [musicMuted, setMusicMuted] = useState(isMusicMuted);
  const [langOpen, setLangOpen] = useState(false);
  // Borrar la cuenta / los datos de invitado (requisito de Google Play)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  const closeLang = useCallback(() => setLangOpen(false), []);

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

  const go = (path: string) => { playButtonTap(); navigate(path); };
  const currentLang = LOCALES.find(l => l.key === locale) ?? LOCALES[0];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:px-6 overflow-y-auto game-bg">
      <div className="w-full max-w-lg md:max-w-5xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        {/* Cabecera: celular = volver · logo, y debajo "Ajustes" con el Explorador a la derecha;
            computador = volver · Explorador · "Ajustes" en una fila (el logo ya está en la barra superior) */}
        <header className="mb-3 sm:mb-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 md:hidden">
            <HudIconButton icon="back" label={t('back')} onClick={() => { playButtonTap(); onBack(); }} />
            <div className="flex items-center justify-center gap-2 min-w-0">
              <img src="/mascot/explorer-logo.webp" alt="" className="w-10 h-10 short:w-8 short:h-8 object-contain" />
              <Wordmark size="custom" className="text-[1.6rem] short:text-xl" />
            </div>
            <span className="w-11" />
          </div>
          <div className="flex items-center gap-3 md:gap-5 -mt-1 md:mt-0">
            <span className="hidden md:block"><HudIconButton icon="back" label={t('back')} onClick={() => { playButtonTap(); onBack(); }} /></span>
            <div className="relative order-last md:order-none w-36 sm:w-40 md:w-36 shrink-0 short:hidden" aria-hidden>
              <div className="absolute right-0 top-0 w-[76%] rounded-full shadow-[0_0_30px_hsl(var(--accent)/0.35)]">
                <Suspense fallback={<div className="w-full aspect-square rounded-full bg-accent/20" />}><SplashGlobe /></Suspense>
              </div>
              <div className="relative w-[60%] pt-[22%] drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)]"><Mascot state="celebrate" className="w-full" /></div>
              <span className="absolute -left-3 top-[8%] text-primary text-lg">✦</span>
              <span className="absolute left-[44%] -top-2 text-primary text-sm">✦</span>
              <span className="absolute -right-2 bottom-[6%] text-primary text-base">✦</span>
            </div>
            <h1 className="flex-1 md:flex-none text-[2.4rem] sm:text-5xl md:text-6xl short:text-2xl font-black leading-none">{t('settings_title')}</h1>
          </div>
        </header>

        {/* Celular: Preferencias · Idioma · Ayuda · Privacidad · Cuenta. Computador: Preferencias y Cuenta a la
            izquierda, el resto a la derecha */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-[1.15fr_1fr] md:items-start">
          <Section title={t('settings_prefs')} separated className="md:col-start-1 md:row-start-1">
            <ToggleRow icon="music" label={t('settings_music')} on={!musicMuted} onToggle={onToggleMusic} />
            <ToggleRow icon="sound" label={t('settings_sfx')} on={prefs.sfx} onToggle={() => toggle('sfx')} />
            <ToggleRow
              icon="vibrate"
              label={t('settings_haptics')}
              desc={canVibrate ? t('settings_hapticsDesc') : t('settings_hapticsUnsupported')}
              on={prefs.haptics && canVibrate}
              disabled={!canVibrate}
              onToggle={() => toggle('haptics')}
            />
            <ToggleRow icon="motion" label={t('settings_reduceMotion')} desc={t('settings_reduceMotionDesc')} on={prefs.reduceMotion} onToggle={() => toggle('reduceMotion')} />
            <ToggleRow icon="eye" label={t('settings_colorblind')} desc={t('settings_colorblindDesc')} on={colorblind} onToggle={() => { toggleColorblind(); playButtonTap(); }} />
          </Section>

          <div className="flex flex-col gap-3 sm:gap-4 md:col-start-2 md:row-start-1 md:row-span-2">
            <Section title={t('settings_language')}>
              <LinkRow icon="globe" label={currentLang.label} onClick={() => { playButtonTap(); setLangOpen(true); }} />
            </Section>

            <Section title={t('settings_help')}>
              <LinkRow icon="help" label={t('settings_howToPlay')} onClick={() => { playButtonTap(); onHowToPlay(); }} />
              <LinkRow icon="chat" label={t('settings_support')} onClick={() => go('/support')} />
            </Section>

            <Section title={t('settings_privacySection')}>
              <LinkRow icon="shield" label={t('settings_privacy')} onClick={() => go('/privacy')} />
              <LinkRow icon="doc" label={t('settings_terms')} onClick={() => go('/terms')} />
            </Section>
          </div>

          <Section title={t('settings_account')} className="md:col-start-1 md:row-start-2">
              {user && !isAnonymous ? (
                <>
                  <div className="flex items-center gap-3 sm:gap-4 px-3 py-3">
                    <SettingIcon name="user" className="w-7 h-7 text-accent shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-xs sm:text-sm text-foreground/65">{t('settings_signedInAs')}</span>
                      <span className="block font-bold text-base sm:text-lg truncate">{displayName || user.email}</span>
                    </span>
                  </div>
                  <LinkRow icon="logout" label={t('home_signOut')} onClick={() => { if (window.confirm(t('settings_signOutConfirm'))) signOut(); }} />
                  <LinkRow icon="trash" danger label={t('settings_deleteAccount')} onClick={() => { playButtonTap(); setDeleteOpen(true); }} />
                </>
              ) : (
                <>
                  <div className="px-3 py-3">
                    <p className="font-bold text-base sm:text-lg leading-tight">{t('acc_guestTitle')}</p>
                    <p className="text-xs sm:text-sm text-foreground/65 leading-snug mt-0.5">{t('acc_guestDesc')}</p>
                  </div>
                  <LinkRow icon="userPlus" label={t('acct_createAccount')} onClick={() => go('/auth?mode=signup')} />
                  <LinkRow icon="user" label={t('acc_haveAccount')} onClick={() => go('/auth')} />
                  {/* Invitado con sesión anónima: sus partidas y retos viven en el servidor */}
                  {user && isAnonymous && (
                    <LinkRow icon="trash" danger label={t('settings_deleteGuestData')} onClick={() => { playButtonTap(); setDeleteOpen(true); }} />
                  )}
                </>
              )}
          </Section>
        </div>

        <div className="h-6" />
      </div>

      {deleteOpen && <DeleteAccountDialog guest={isAnonymous} onClose={() => setDeleteOpen(false)} />}
      {langOpen && (
        <SelectorSheet<Locale>
          title={t('settings_pickLanguage')}
          subtitle={t('settings_pickLanguageSub')}
          options={LOCALES.map(l => ({ key: l.key, emoji: l.flag, label: l.label, desc: LANG_DESC[l.key], icon: <Flag country={LANG_FLAG_COUNTRY[l.key]} className="w-12" /> }))}
          selected={locale}
          confirmLabel={t('settings_apply')}
          closeLabel={t('close')}
          onConfirm={(k) => { setLocale(k); setLangOpen(false); }}
          onClose={closeLang}
        />
      )}
    </div>
  );
}

/** Tarjeta con borde turquesa y título; las filas van en un panel interior con divisores
 *  (o como filas sueltas con borde en computador, `separated`, maqueta Ajustes_Computador). */
function Section({ title, children, separated, className = '' }: { title: string; children: ReactNode; separated?: boolean; className?: string }) {
  const panel = 'rounded-2xl border border-accent/25 bg-brand-navy-deep/40 divide-y divide-accent/15 overflow-hidden';
  const loose = 'md:border-0 md:bg-transparent md:divide-y-0 md:overflow-visible md:flex md:flex-col md:gap-3 md:[&>*]:rounded-2xl md:[&>*]:border md:[&>*]:border-accent/25 md:[&>*]:bg-brand-navy-deep/40';
  return (
    <section className={`rounded-3xl border-2 border-accent/50 bg-card/70 p-3 sm:p-4 shadow-[0_0_20px_hsl(var(--accent)/0.12)] ${className}`}>
      <h2 className="px-1 mb-2 text-xl sm:text-2xl font-extrabold text-accent">{title}</h2>
      <div className={`${panel} ${separated ? loose : ''}`}>{children}</div>
    </section>
  );
}

function ToggleRow({ icon, label, desc, on, onToggle, disabled }: {
  icon: SettingIconName; label: string; desc?: string; on: boolean; onToggle: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={`w-full flex items-center gap-3 sm:gap-4 px-3 py-3 sm:py-3.5 text-left transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/5'}`}
    >
      <SettingIcon name={icon} className="w-7 h-7 text-accent shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-base sm:text-lg leading-tight">{label}</span>
        {desc && <span className="block text-xs sm:text-sm text-foreground/65 leading-snug">{desc}</span>}
      </span>
      <span
        className={`relative inline-block w-14 h-8 rounded-full border-2 transition-colors shrink-0 ${on ? 'bg-accent border-accent shadow-[0_0_12px_hsl(var(--accent)/0.45)]' : 'bg-muted border-foreground/20'}`}
        aria-hidden
      >
        <span className={`absolute top-0.5 left-0 w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[26px]' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}

function LinkRow({ icon, label, onClick, danger = false }: { icon: SettingIconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 sm:gap-4 px-3 py-3 sm:py-3.5 text-left transition-colors ${danger ? 'hover:bg-destructive/10' : 'hover:bg-accent/5'}`}>
      <SettingIcon name={icon} className={`w-7 h-7 shrink-0 ${danger ? 'text-destructive' : 'text-accent'}`} />
      <span className={`flex-1 min-w-0 font-bold text-base sm:text-lg leading-tight ${danger ? 'text-destructive' : ''}`}>{label}</span>
      <ChevronIcon className="w-6 h-6 text-foreground/85" />
    </button>
  );
}

type SettingIconName = 'music' | 'sound' | 'vibrate' | 'motion' | 'eye' | 'globe' | 'help' | 'chat' | 'shield' | 'doc' | 'logout' | 'user' | 'userPlus' | 'trash';

/** Íconos de línea turquesa de la maqueta */
function SettingIcon({ name, className }: { name: SettingIconName; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {name === 'music' && <><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" fill="currentColor" /><circle cx="17.5" cy="16" r="2.5" fill="currentColor" /></>}
      {name === 'sound' && <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" /><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>}
      {name === 'vibrate' && <><rect x="8" y="3.5" width="8" height="17" rx="2" /><path d="M4.5 8.5 3 10l1.5 1.5L3 13l1.5 1.5M19.5 8.5 21 10l-1.5 1.5L21 13l-1.5 1.5" /></>}
      {name === 'motion' && <><path d="M6 19c-2-4-2-10 1-14M10.5 19.5c-2.5-4-2.5-11 1-15.5M15 19c-1.5-3-1.5-8 .5-11" /><path d="m4 4 16 16" /></>}
      {name === 'eye' && <><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>}
      {name === 'globe' && <><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c2.8 3 2.8 16 0 19M12 2.5c-2.8 3-2.8 16 0 19" /></>}
      {name === 'help' && <><circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.2" /><path d="M9.3 9.3a2.8 2.8 0 1 1 3.8 2.6c-.7.3-1.1.9-1.1 1.6v.5" /><circle cx="12" cy="17.2" r="0.6" fill="currentColor" /></>}
      {name === 'chat' && <><path d="M4 18.5V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6.5a3 3 0 0 1-3 3H8z" fill="currentColor" fillOpacity="0.2" /><circle cx="8.5" cy="10.3" r="0.8" fill="currentColor" /><circle cx="12" cy="10.3" r="0.8" fill="currentColor" /><circle cx="15.5" cy="10.3" r="0.8" fill="currentColor" /></>}
      {name === 'shield' && <><path d="M12 2.8 4.5 5.6v5.6c0 4.6 3.1 8.5 7.5 10 4.4-1.5 7.5-5.4 7.5-10V5.6z" fill="currentColor" fillOpacity="0.2" /><path d="m8.6 12 2.4 2.4 4.4-4.6" /></>}
      {name === 'doc' && <><path d="M6.5 2.5h7.5l4.5 4.5v14.5h-12z" /><path d="M13.5 2.5V7h5M9 12h6M9 15.5h6" /></>}
      {name === 'logout' && <><path d="M14 4.5h4.5v15H14" /><path d="M10 8l-4 4 4 4M6 12h10" /></>}
      {name === 'user' && <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>}
      {name === 'userPlus' && <><circle cx="10" cy="8" r="4" /><path d="M2.5 21c0-4.4 3.4-7 7.5-7 1.6 0 3 .4 4.2 1M18.5 14v6M15.5 17h6" /></>}
      {name === 'trash' && <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />}
    </svg>
  );
}
