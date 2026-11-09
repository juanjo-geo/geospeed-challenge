import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { getPrefs, setPref, subscribePrefs } from '@/lib/prefs';
import { playButtonTap } from '@/lib/sounds';
import { BACK_LAYER, useBackHandler } from '@/lib/backNav';

type HudIcon = 'music' | 'musicOff' | 'sound' | 'mute' | 'vibrate' | 'gear' | 'close' | 'home' | 'back';

// Los mismos dibujos de Ajustes: nota = música de fondo, parlante = efectos de sonido
const MUSIC_NOTE = (<><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" fill="currentColor" /><circle cx="17.5" cy="16" r="2.5" fill="currentColor" /></>);
const SPEAKER = <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />;

const ICON_PATHS: Record<HudIcon, JSX.Element> = {
  music: MUSIC_NOTE,
  musicOff: (<>{MUSIC_NOTE}<path d="m3 3 18 18" /></>),
  sound: (<>{SPEAKER}<path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>),
  mute: (<>{SPEAKER}<path d="m16 9.5 5 5" /><path d="m21 9.5-5 5" /></>),
  vibrate: (<><rect x="8" y="3.5" width="8" height="17" rx="2" /><path d="M4.5 8.5 3 10l1.5 1.5L3 13l1.5 1.5M19.5 8.5 21 10l-1.5 1.5L21 13l-1.5 1.5" /></>),
  gear: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>),
  close: (<><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>),
  back: (<path d="m14.5 5.5-6.5 6.5 6.5 6.5" />),
  home: (<><path d="M3.5 11.5 12 4l8.5 7.5" /><path d="M6 10v9.5h4.5V15h3v4.5H18V10" /></>),
};

/** Botón redondo del HUD de partida (maqueta Partida: sonido · ajustes · salir, borde turquesa). */
export function HudIconButton({ icon, label, onClick, size = 'md' }: { icon: HudIcon; label: string; onClick: () => void; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pointer-events-auto shrink-0 rounded-full border-2 border-accent/70 text-foreground flex items-center justify-center backdrop-blur-md transition-all active:scale-90 hover:bg-accent/15 ${size === 'sm' ? 'w-8 h-8' : 'w-11 h-11'}`}
      style={{ background: 'hsl(var(--brand-navy-deep) / 0.8)' }}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {ICON_PATHS[icon]}
      </svg>
    </button>
  );
}

/** Los dos sonidos del juego, cada uno con su ícono: música de fondo (nota) y efectos (parlante). */
export function AudioButtons({ musicMuted, onToggleMusic, size = 'md' }: { musicMuted?: boolean; onToggleMusic?: () => void; size?: 'sm' | 'md' }) {
  const { t } = useI18n();
  const [sfx, setSfx] = useState(() => getPrefs().sfx);
  useEffect(() => subscribePrefs((p) => setSfx(p.sfx)), []);
  const toggleSfx = () => {
    const next = !getPrefs().sfx;
    setPref('sfx', next);
    if (next) playButtonTap();
  };
  return (
    <>
      {onToggleMusic && <HudIconButton size={size} icon={musicMuted ? 'musicOff' : 'music'} label={musicMuted ? t('music_on') : t('music_off')} onClick={onToggleMusic} />}
      <HudIconButton size={size} icon={sfx ? 'sound' : 'mute'} label={sfx ? t('sfx_off') : t('sfx_on')} onClick={toggleSfx} />
    </>
  );
}

/**
 * Ajustes rápidos dentro de la partida (engranaje del HUD): música, efectos y vibración.
 * Mientras está abierto, el reloj de la ronda se pausa (lo controla GameScreen).
 */
export function InGameSettings({ musicMuted, onToggleMusic, onClose }: { musicMuted?: boolean; onToggleMusic?: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const [prefs, setPrefsState] = useState(getPrefs());
  // "Atrás" del teléfono cierra estos ajustes y la ronda sigue (no sale de la partida)
  useBackHandler(onClose, { layer: BACK_LAYER.modal });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (key: 'sfx' | 'haptics') => {
    const next = !prefs[key];
    setPref(key, next);
    setPrefsState({ ...prefs, [key]: next });
    if (key === 'sfx' && next) playButtonTap();
  };

  return (
    <div className="modal-layer z-[90] bg-black/55 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-label={t('settings_title')} onClick={onClose}>
      <div className="modal-panel w-full max-w-xs rounded-3xl border border-accent/40 bg-card p-5 short:p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{t('game_paused')}</p>
        <h2 className="text-2xl short:text-xl font-extrabold mt-0.5 mb-3 short:mb-2">{t('settings_title')}</h2>
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-background/40">
          {onToggleMusic && <ToggleRow icon="music" label={t('settings_music')} on={!musicMuted} onClick={onToggleMusic} />}
          <ToggleRow icon="sound" label={t('settings_sfx')} on={prefs.sfx} onClick={() => toggle('sfx')} />
          <ToggleRow icon="vibrate" label={t('settings_haptics')} on={prefs.haptics} onClick={() => toggle('haptics')} />
        </div>
        <button
          onClick={onClose}
          className="btn3d mt-4 short:mt-3 w-full py-3 short:py-2.5 rounded-2xl font-black text-primary-foreground"
          style={{ background: 'var(--grad-cta)' }}
        >
          {t('game_resume')}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, on, onClick }: { icon: HudIcon; label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="flex items-center justify-between gap-3 px-3 py-3 short:py-2 text-left">
      <span className="flex items-center gap-2.5 font-semibold text-sm min-w-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICON_PATHS[icon]}</svg>
        {label}
      </span>
      <span className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-muted'}`} aria-hidden>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[1.375rem]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
