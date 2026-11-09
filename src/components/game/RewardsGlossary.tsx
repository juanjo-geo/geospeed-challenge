import { useId, useState } from 'react';
import { useI18n } from '@/i18n';
import { playAccordion } from '@/lib/sounds';
import { FRAME_STYLE } from '@/lib/dailyChallenge';

const ENTRIES = [
  { term: 'gloss_streakT', desc: 'gloss_streakD' },
  { term: 'gloss_freezeT', desc: 'gloss_freezeD' },
  { term: 'gloss_slotT', desc: 'gloss_slotD' },
  { term: 'gloss_frameT', desc: 'gloss_frameD', frames: true },
  { term: 'gloss_titleT', desc: 'gloss_titleD' },
  { term: 'gloss_sprintT', desc: 'gloss_sprintD' },
  { term: 'gloss_proT', desc: 'gloss_proD' },
] as const;

const FRAME_SAMPLES = [['bronze', 7], ['silver', 100], ['gold', 365]] as const;

/**
 * Glosario de los premios: un enlace que despliega qué es cada cosa (protector, marco de bronce, título…).
 * Se usa en Tu racha y en Logros, donde aparecen esas palabras.
 */
export default function RewardsGlossary({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => { playAccordion(!open); setOpen((v) => !v); }}
        className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline underline-offset-2"
      >
        {t('gloss_link')}
        <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <div id={panelId} aria-hidden={!open} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <dl className="overflow-hidden min-h-0">
          <div className="mt-2 rounded-2xl border border-accent/25 bg-brand-navy-deep/40 divide-y divide-accent/15">
            {ENTRIES.map((e) => (
              <div key={e.term} className="px-3 py-2.5">
                <dt className="font-bold text-sm">{t(e.term)}</dt>
                <dd className="text-xs text-foreground/70 leading-snug mt-0.5">{t(e.desc)}</dd>
                {'frames' in e && (
                  <dd className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs font-semibold">
                    {FRAME_SAMPLES.map(([id, days]) => (
                      <span key={id} className="inline-flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full border-2" style={{ borderColor: FRAME_STYLE[id].ring, boxShadow: `0 0 6px ${FRAME_STYLE[id].glow}` }} aria-hidden />
                        {t(`frame_${id}`)} · {t('streak_daysShort', { n: days })}
                      </span>
                    ))}
                  </dd>
                )}
              </div>
            ))}
          </div>
        </dl>
      </div>
    </div>
  );
}
