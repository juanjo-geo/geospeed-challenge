import { useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import { isFavorite, toggleFavorite, useFavorites, type FavType } from '@/lib/favorites';

/** Estrella de favorito (quizzes, modos, configuraciones del Clásico) */
export default function FavStar({ type, id, className = '' }: { type: FavType; id: string; className?: string }) {
  const { t } = useI18n();
  const favs = useFavorites();
  const on = isFavorite(favs, type, id);
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async (e) => {
        e.stopPropagation();
        playButtonTap();
        setBusy(true);
        const r = await toggleFavorite(type, id);
        setBusy(false);
        if ('error' in r) toast(t(r.error === 'limit' ? 'fav_limit' : 'quiz_errOffline'));
        else toast(t(r.on ? 'fav_added' : 'fav_removed'));
      }}
      aria-pressed={on}
      aria-label={t(on ? 'fav_remove' : 'fav_add')}
      className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl leading-none transition-transform active:scale-90 ${on ? 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]' : 'text-foreground/50 hover:text-foreground/80'} ${className}`}
    >
      {on ? '★' : '☆'}
    </button>
  );
}
