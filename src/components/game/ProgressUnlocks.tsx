import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { categoryLabelKey } from '@/lib/catalog';
import { TITLE_KEY } from '@/lib/dailyChallenge';
import { MEDAL_EMOJI, diffUnlocks, getCachedProgression, markAchievementsSeen, refreshProgression, type Unlock } from '@/lib/progression';
import { playLevelUp } from '@/lib/sounds';

const DIFF_SHORT: Record<string, string> = { basic: 'home_diffBasic', easy: 'home_diffEasy', medium: 'home_diffMedium', hard: 'home_diffHard' };

/**
 * Lo que la partida acaba de desbloquear (Fase 9): medallas que mejoraron y niveles de logro nuevos. Se pide la
 * progresión al servidor a los 2,5 s del resultado (cuando la partida ya se guardó) y otra vez si aún no llegó.
 * Va dentro de la pantalla de resultado: no es una ventana que interrumpa.
 */
export default function ProgressUnlocks() {
  const { t } = useI18n();
  const [unlocks, setUnlocks] = useState<Unlock[]>([]);
  useEffect(() => {
    let alive = true;
    const prev = getCachedProgression();
    let retry: ReturnType<typeof setTimeout> | undefined;
    const run = async (): Promise<boolean> => {
      const next = await refreshProgression(true);
      if (!alive || !next) return false;
      const u = diffUnlocks(prev, next);
      if (!u.length) return false;
      setUnlocks(u);
      playLevelUp();
      markAchievementsSeen(next);
      return true;
    };
    const first = setTimeout(async () => { if (!(await run()) && alive) retry = setTimeout(run, 5000); }, 2500);
    return () => { alive = false; clearTimeout(first); if (retry) clearTimeout(retry); };
  }, []);
  if (!unlocks.length) return null;
  const shown = unlocks.slice(0, 3);
  return (
    <div className="mb-4 rounded-2xl border-2 border-primary/60 bg-primary/10 p-3 animate-fade-in-up" role="status">
      <p className="font-black text-primary">🎉 {t('unlock_title')}</p>
      <ul className="mt-1.5 flex flex-col gap-1 text-sm">
        {shown.map((u, i) => (
          <li key={i} className="leading-snug">
            {u.kind === 'medal' ? (
              <><span aria-hidden>{MEDAL_EMOJI[u.medal]}</span> <b>{t(`medal_${['', 'bronze', 'silver', 'gold'][u.medal]}` as never)}</b> · {t(`mode_${u.mode}` as never)} · {t(DIFF_SHORT[u.difficulty] as never)} · {t(categoryLabelKey(u.category, u.mode) as never)} <span className="text-muted-foreground">({u.hits}/13)</span></>
            ) : (
              <>
                <span aria-hidden>{u.def.emoji}</span> <b>{t(`ach_${u.def.id}` as never)}</b> · {t('unlock_tier', { tier: ['', '🥉', '🥈', '🥇'][u.tier] })}
                {u.def.rewards?.[u.tier] && (
                  <span className="block text-xs text-accent font-semibold">
                    {[u.def.rewards[u.tier]!.title && t('ach_rewardTitle', { v: t(TITLE_KEY[u.def.rewards[u.tier]!.title!] as never) }), u.def.rewards[u.tier]!.frame && t('ach_rewardFrame', { v: t(`frame_${u.def.rewards[u.tier]!.frame}` as never) })].filter(Boolean).join(' · ')}
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {unlocks.length > shown.length && <p className="mt-1 text-xs text-muted-foreground">{t('unlock_more', { n: unlocks.length - shown.length })}</p>}
    </div>
  );
}
