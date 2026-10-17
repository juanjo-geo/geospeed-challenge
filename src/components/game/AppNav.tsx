import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import Wordmark from '@/components/ui/Wordmark';

export type NavTab = 'home' | 'progress' | 'store' | 'pass' | 'profile';

interface AppNavProps {
  active: NavTab | null;
  onNavigate: (tab: NavTab) => void;
}

const ICONS: Record<NavTab, JSX.Element> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M5 20V12" /><path d="M12 20V4" /><path d="M19 20v-7" />
    </svg>
  ),
  store: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="10" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" />
    </svg>
  ),
  pass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" /><path d="m12 9 1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 11.3l2-.3Z" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
};

/**
 * Barra de navegación persistente (maquetas oct 2026):
 * móvil → 5 pestañas abajo; escritorio (md+) → barra superior con wordmark.
 * Pestañas: Inicio · Progreso · Tienda · Pass · Perfil.
 * Se muestra solo fuera de la partida (Index decide en qué fases).
 */
export default function AppNav({ active, onNavigate }: AppNavProps) {
  const { t } = useI18n();
  const tabs: { key: NavTab; label: string }[] = [
    { key: 'home', label: t('nav_home') },
    { key: 'progress', label: t('nav_progress') },
    { key: 'store', label: t('nav_store') },
    { key: 'pass', label: t('nav_pass') },
    { key: 'profile', label: t('nav_profile') },
  ];

  const go = (tab: NavTab) => {
    if (tab === active) return;
    playButtonTap();
    onNavigate(tab);
  };

  return (
    <nav
      className="app-nav fixed z-40 inset-x-0 bottom-0 md:top-0 md:bottom-auto border-t md:border-t-0 md:border-b border-border/60 backdrop-blur-md"
      style={{ background: 'hsl(var(--brand-navy-deep) / 0.92)', paddingBottom: 'var(--sab)' }}
      aria-label="Navegación principal"
    >
      <div className="mx-auto max-w-5xl flex items-center md:gap-6 px-1 md:px-4" style={{ height: 'var(--nav-h)' }}>
        <div className="hidden md:flex items-center gap-2 mr-2">
          <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
          <Wordmark size="xs" />
        </div>
        <div className="flex-1 flex items-stretch justify-around md:justify-center md:gap-2 h-full">
          {tabs.map(tab => {
            const isActive = tab.key === active;
            return (
              <button
                key={tab.key}
                onClick={() => go(tab.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 px-2 md:px-4 min-w-[56px] md:min-w-0 rounded-xl md:my-2 transition-all active:scale-[0.95] ${
                  isActive ? 'text-accent md:bg-accent/10' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className={`w-6 h-6 md:w-5 md:h-5 ${isActive ? 'drop-shadow-[0_0_8px_hsl(var(--accent)/0.6)]' : ''}`}>{ICONS[tab.key]}</span>
                <span className={`text-[10px] md:text-sm font-bold leading-none ${isActive ? '' : 'font-semibold'}`}>{tab.label}</span>
                {isActive && <span className="md:hidden absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-accent" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
