import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const label = theme === 'dark' ? 'OSCURO' : theme === 'light' ? 'CLARO' : 'NEON';
  const icon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '⚡';
  const nextLabel = theme === 'dark' ? 'Modo claro' : theme === 'light' ? 'Modo neon' : 'Modo oscuro';
  // Dot position: dark=left, light=center, neon=right
  const dotPos = theme === 'dark' ? 'translateX(2px)' : theme === 'light' ? 'translateX(14px)' : 'translateX(26px)';

  return (
    <button
      onClick={toggleTheme}
      title={nextLabel}
      aria-label={nextLabel}
      className={`flex items-center gap-1.5 cursor-pointer select-none group ${className}`}
    >
      {/* Label dinámico */}
      <span
        className="text-[9px] font-bold uppercase tracking-widest transition-colors duration-300"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        {icon} {label}
      </span>

      {/* Pill toggle — 3 states */}
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors duration-300 ${
          theme === 'neon' ? 'bg-orange-500/20' : theme === 'light' ? 'bg-primary/20' : 'bg-muted/80'
        }`}
      >
        <span
          className="inline-block h-4 w-4 rounded-full shadow-sm transition-transform duration-300"
          style={{
            background: theme === 'neon' ? 'hsl(30 100% 50%)' : 'hsl(var(--primary))',
            transform: dotPos,
            boxShadow: theme === 'neon' ? '0 0 8px hsl(30 100% 50% / 0.6)' : 'none',
          }}
        />
      </span>
    </button>
  );
}
