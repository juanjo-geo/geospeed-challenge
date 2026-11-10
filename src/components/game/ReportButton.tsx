import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/i18n';
import { BACK_LAYER, useBackHandler } from '@/lib/backNav';
import { REPORT_REASONS, reportContent, type ReportReason, type ReportTarget } from '@/lib/moderation';
import { playButtonTap } from '@/lib/sounds';
import { trackEvent } from '@/lib/analytics';
import { publicOrigin } from '@/lib/assetUrl';

const FLAG = (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 21V4" /><path d="M5 4h12l-2.5 4.5L17 13H5" />
  </svg>
);

/** Aviso antes de crear contenido que otros jugadores ven (política de Google Play) */
export function TermsNote({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  return (
    <p className={`text-[11px] leading-snug text-muted-foreground ${className}`}>
      {t('ugc_noteLead')}{' '}
      <a href={`${publicOrigin()}/terms`} target="_blank" rel="noopener noreferrer" className="underline">{t('ugc_noteLink')}</a>
      {t('ugc_noteTail')}
    </p>
  );
}

/** Reportar un nombre o contenido: ícono de bandera en las listas, o enlace de texto */
export default function ReportButton({ target, variant = 'icon', label, className = '' }: { target: ReportTarget; variant?: 'icon' | 'link'; label?: string; className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const aria = target.kind === 'quiz' ? t('rep_titleQuiz', { name: target.name }) : t('rep_title', { name: target.name });
  const click = (e: React.MouseEvent) => { e.stopPropagation(); playButtonTap(); setOpen(true); };
  return (
    <>
      {variant === 'icon' ? (
        <button type="button" onClick={click} aria-label={aria} title={aria} className={`shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-full text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 ${className}`}>{FLAG}</button>
      ) : (
        <button type="button" onClick={click} className={`inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive ${className}`}>{FLAG}{label ?? aria}</button>
      )}
      {open && <ReportDialog target={target} title={aria} onClose={() => setOpen(false)} />}
    </>
  );
}

function ReportDialog({ target, title, onClose }: { target: ReportTarget; title: string; onClose: () => void }) {
  const { t } = useI18n();
  useBackHandler(onClose, { layer: BACK_LAYER.modal });
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [state, setState] = useState<'form' | 'sending' | 'done' | 'limit' | 'error'>('form');

  const send = async () => {
    if (!reason) return;
    playButtonTap();
    setState('sending');
    const res = await reportContent(target, reason);
    if (res === 'ok') { setState('done'); trackEvent('content_report', { kind: target.kind, reason }); }
    else setState(res);
  };

  const close = () => { playButtonTap(); onClose(); };
  return createPortal(
    <div className="modal-layer z-[130] bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={(e) => e.stopPropagation()}>
      <div className="modal-panel w-full max-w-sm rounded-3xl border-2 border-accent/50 bg-card p-5 short:p-3 shadow-2xl">
        {state === 'done' || state === 'limit' ? (
          <div className="text-center">
            <h2 id="report-title" className="font-black text-xl">{state === 'done' ? t('rep_doneTitle') : t('rep_limitTitle')}</h2>
            <p className="mt-2 text-sm text-foreground/75">{state === 'done' ? t('rep_doneDesc') : t('rep_limitDesc')}</p>
            <button onClick={close} className="btn3d mt-4 w-full rounded-xl py-2.5 text-sm font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('rep_close')}</button>
          </div>
        ) : (
          <>
            <h2 id="report-title" className="font-black text-xl leading-tight break-words">{title}</h2>
            <p className="mt-1 text-xs text-foreground/70">{t('rep_prompt')}</p>
            <div className="mt-3 flex flex-col gap-1.5 short:grid short:grid-cols-2" role="radiogroup" aria-label={t('rep_prompt')}>
              {REPORT_REASONS.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={reason === r} onClick={() => { playButtonTap(); setReason(r); }}
                  className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-bold ${reason === r ? 'border-primary bg-primary/15' : 'border-accent/30 hover:border-accent/60'}`}>
                  {t(`rep_reason_${r}`)}
                </button>
              ))}
            </div>
            {state === 'error' && <p className="mt-2 text-xs font-semibold text-destructive" role="alert">{t('rep_error')}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={close} className="flex-1 rounded-xl py-2.5 text-sm font-bold border-2 border-accent/50 hover:bg-accent/10">{t('cancel')}</button>
              <button onClick={() => void send()} disabled={!reason || state === 'sending'} className="btn3d flex-1 rounded-xl py-2.5 text-sm font-black text-primary-foreground disabled:opacity-50" style={{ background: 'var(--grad-cta)' }}>{state === 'sending' ? '…' : t('rep_send')}</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
