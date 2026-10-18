import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import Mascot from './Mascot';

const AVATAR_KEY = 'geospeed_avatar';

/**
 * Botón de cuenta del encabezado (maquetas Inicio v2): avatar redondo + nombre.
 * Con cuenta abre el perfil; invitado (o sesión anónima) va a iniciar sesión.
 */
export function AccountButton({ onOpenProfile, showName = true, nameClassName = '' }: { onOpenProfile?: () => void; showName?: boolean; nameClassName?: string }) {
  const { user, displayName, isAnonymous, avatar: serverAvatar } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const hasAccount = !!user && !isAnonymous;
  let avatar = serverAvatar || 'mascot';
  try { avatar = serverAvatar || localStorage.getItem(AVATAR_KEY) || 'mascot'; } catch { /* sin almacenamiento */ }
  const name = hasAccount ? (displayName || user?.email?.split('@')[0] || '') : t('home_signIn');

  return (
    <button
      onClick={() => { playButtonTap(); if (hasAccount) onOpenProfile?.(); else navigate('/auth'); }}
      className="flex items-center gap-2 min-w-0 rounded-full pr-1 hover:opacity-90 active:scale-[0.97] transition"
      aria-label={hasAccount ? t('nav_profile') : t('home_signIn')}
      title={hasAccount ? name : t('home_saveProgress')}
    >
      <span className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full border-2 border-accent/70 bg-card/80 flex items-center justify-center overflow-hidden text-accent">
        {hasAccount ? (
          avatar === 'mascot'
            ? <Mascot className="w-[80%]" />
            : <span className="text-lg" aria-hidden>{avatar}</span>
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
        )}
      </span>
      {showName && <span className={`font-bold text-sm truncate max-w-[9rem] ${nameClassName}`}>{name}</span>}
    </button>
  );
}

/** Engranaje de ajustes (mismo estilo en el encabezado del celular y en la barra del computador). */
export function SettingsButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button
      onClick={() => { playButtonTap(); onClick(); }}
      className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-[0.95] shrink-0"
      aria-label={t('home_settings')}
      title={t('home_settings')}
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </svg>
    </button>
  );
}
