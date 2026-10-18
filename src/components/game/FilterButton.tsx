import { ChevronIcon } from '@/components/ui/icons';

/** Botón de filtro "Región: Todas ⌄" / "Dificultad: Turista ⌄" de las maquetas Historial y Ranking */
export default function FilterButton({ icon, label, value, onClick }: { icon: 'globe' | 'compass'; label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="min-w-0 md:w-72 h-12 sm:h-14 flex items-center gap-1.5 sm:gap-3 rounded-2xl border-2 border-accent/60 bg-brand-navy-deep/60 px-1.5 sm:px-4 text-[13px] sm:text-base hover:border-accent shadow-[0_0_14px_hsl(var(--accent)/0.12)]">
      {icon === 'globe'
        ? <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-7 sm:h-7 text-accent shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c2.8 3 2.8 16 0 19M12 2.5c-2.8 3-2.8 16 0 19" /></svg>
        : <span className="text-base sm:text-2xl shrink-0" aria-hidden>🧭</span>}
      <span className="flex-1 min-w-0 truncate text-center tracking-tight sm:tracking-normal"><span className="font-semibold sm:font-bold">{label}:</span> <span className="font-extrabold text-primary">{value}</span></span>
      <ChevronIcon dir="down" className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-accent shrink-0" />
    </button>
  );
}
