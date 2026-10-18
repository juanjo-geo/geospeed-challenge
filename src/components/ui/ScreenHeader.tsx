import type { ReactNode } from 'react';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import Wordmark from './Wordmark';
import { HudIconButton } from '@/components/game/GameHud';

interface ScreenHeaderProps {
  onBack: () => void;
  /** Título; la última palabra va resaltada en amarillo (estilo de las maquetas: "Mi perfil") */
  title: string;
  subtitle?: string;
  /** Contenido a la derecha (vidas…). Si no se pasa, va el engranaje de ajustes en el celular. */
  right?: ReactNode;
  /** Alineación del título: centrado (por defecto, como casi todas las maquetas) o a la izquierda */
  align?: 'center' | 'left';
}

/** Evento global para abrir Ajustes desde cualquier pantalla (Index lo escucha). */
export const OPEN_SETTINGS_EVENT = 'geospeed:open-settings';
export function requestOpenSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

/**
 * Cabecera común de las pantallas de menú v2 (maquetas Perfil, Jugar con amigos, Mis retos, Tienda…):
 * volver (anillo turquesa) · logo centrado · ajustes, y debajo el título grande con la última palabra en
 * amarillo. En computador el logo y los ajustes ya están en la barra superior (AppNav).
 */
export default function ScreenHeader({ onBack, title, subtitle, right, align = 'center' }: ScreenHeaderProps) {
  const { t } = useI18n();
  const words = title.split(' ');
  const head = words.slice(0, -1).join(' ');
  const tail = words[words.length - 1];
  const centered = align === 'center';
  return (
    <header className="w-full mb-4 sm:mb-6 short:mb-2">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <HudIconButton icon="back" label={t('back')} onClick={() => { playButtonTap(); onBack(); }} />
        <div className="flex items-center justify-center gap-2 min-w-0 md:invisible">
          <img src="/mascot/explorer-logo.webp" alt="" className="w-10 h-10 short:w-8 short:h-8 object-contain" />
          <Wordmark size="custom" className="text-[1.6rem] short:text-xl" />
        </div>
        <div className="min-w-[2.75rem] flex justify-end">
          {right ?? <span className="md:hidden"><HudIconButton icon="gear" label={t('settings_title')} onClick={() => { playButtonTap(); requestOpenSettings(); }} /></span>}
        </div>
      </div>
      <h1 className={`mt-4 short:mt-1 text-[2.1rem] sm:text-5xl short:text-2xl font-extrabold leading-tight ${centered ? 'text-center' : ''}`}>
        {head && <>{head} </>}<span className="text-primary">{tail}</span>
      </h1>
      {subtitle && <p className={`text-base sm:text-lg short:text-xs text-foreground/80 mt-1 ${centered ? 'text-center' : ''}`}>{subtitle}</p>}
    </header>
  );
}
