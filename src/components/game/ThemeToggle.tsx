import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? 'Modo oscuro' : 'Modo claro'}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border transition-colors duration-300 ${isLight ? 'bg-primary/20' : 'bg-muted/80'} ${className}`}
    >
      <span
        className="absolute left-[5px] text-[10px] leading-none pointer-events-none select-none transition-opacity duration-200"
        style={{ opacity: isLight ? 0 : 1 }}
      >🌙</span>
      <span
        className="absolute right-[5px] text-[10px] leading-none pointer-events-none select-none transition-opacity duration-200"
        style={{ opacity: isLight ? 1 : 0 }}
      >☀️</span>
      <span
        className="inline-block h-4 w-4 rounded-full shadow-sm transition-transform duration-300"
        style={{
          background: 'hsl(var(--primary))',
          transform: isLight ? 'translateX(26px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}
