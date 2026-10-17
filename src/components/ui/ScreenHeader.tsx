import type { ReactNode } from 'react';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import Wordmark from './Wordmark';

interface ScreenHeaderProps {
  onBack: () => void;
  /** Título; la última palabra va resaltada en amarillo (estilo de las maquetas: "Mi perfil") */
  title: string;
  subtitle?: string;
  /** Contenido a la derecha (vidas, ajustes…) */
  right?: ReactNode;
}

/** Cabecera común de las pantallas de menú v2 (Tienda, Pass, Perfil): volver · marca · acción y título grande. */
export default function ScreenHeader({ onBack, title, subtitle, right }: ScreenHeaderProps) {
  const { t } = useI18n();
  const words = title.split(' ');
  const head = words.slice(0, -1).join(' ');
  const tail = words[words.length - 1];
  return (
    <header className="w-full mb-4 sm:mb-5 short:mb-2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => { playButtonTap(); onBack(); }}
          className="w-10 h-10 short:w-9 short:h-9 shrink-0 rounded-full flex items-center justify-center border border-border/60 bg-card/60 hover:bg-muted transition-all active:scale-[0.95]"
          aria-label={t('back')}
        >
          <span aria-hidden className="text-lg">‹</span>
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0 md:hidden">
          <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
          <Wordmark size="sm" />
        </div>
        <div className="hidden md:block flex-1" />
        {right}
      </div>
      <h1 className="mt-3 short:mt-1 text-3xl sm:text-4xl short:text-2xl font-black leading-tight">
        {head && <>{head} </>}<span className="text-primary">{tail}</span>
      </h1>
      {subtitle && <p className="text-sm sm:text-base short:text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </header>
  );
}
