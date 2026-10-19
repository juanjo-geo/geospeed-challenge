import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import { deleteMyAccount } from '@/lib/accountDeletion';

/**
 * Confirmación para borrar la cuenta (o los datos de invitado). Para evitar borrados por error hay que
 * escribir la palabra de confirmación. Al terminar recarga la app en el inicio, ya sin sesión ni datos.
 * Se pinta en document.body (portal): dentro de la tarjeta de /eliminar-cuenta o de Ajustes quedaba
 * debajo de otros elementos con su propio orden de capas.
 */
const portal = (node: ReactNode) => (typeof document === 'undefined' ? node : createPortal(node, document.body));

export default function DeleteAccountDialog({ guest: guestProp = false, onClose }: { guest?: boolean; onClose: () => void }) {
  const { t } = useI18n();
  // Se fija al abrir: al borrar se cierra la sesión y quien abrió el aviso deja de saber si era invitado
  const [guest] = useState(guestProp);
  const [typed, setTyped] = useState('');
  const [stage, setStage] = useState<'confirm' | 'working' | 'done' | 'error'>('confirm');
  const word = t('del_confirmWord');
  const ready = typed.trim().toUpperCase() === word.toUpperCase();

  const run = async () => {
    if (!ready || stage === 'working') return;
    playButtonTap();
    setStage('working');
    setStage((await deleteMyAccount()) ? 'done' : 'error');
  };

  if (stage === 'done') {
    return portal(
      <div className="modal-layer z-[120] bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="del-done-title">
        <div className="modal-panel w-full max-w-md rounded-3xl border-2 border-accent/50 bg-card p-6 short:p-4 text-center shadow-2xl">
          <p className="text-4xl mb-2" aria-hidden>👋</p>
          <h2 id="del-done-title" className="text-2xl font-extrabold">{guest ? t('del_doneTitleGuest') : t('del_doneTitle')}</h2>
          <p className="mt-2 text-sm text-foreground/80">{t('del_doneDesc')}</p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="btn3d mt-5 w-full rounded-2xl py-3 font-black text-primary-foreground"
            style={{ background: 'var(--grad-cta)' }}
          >
            {t('del_doneButton')}
          </button>
        </div>
      </div>
    );
  }

  return portal(
    <div className="modal-layer z-[120] bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="del-title">
      <div className="modal-panel w-full max-w-md rounded-3xl border-2 border-destructive/60 bg-card p-5 sm:p-6 short:p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 short:w-10 short:h-10 shrink-0 rounded-full bg-destructive/15 border-2 border-destructive/60 flex items-center justify-center text-destructive">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />
            </svg>
          </span>
          <h2 id="del-title" className="text-xl sm:text-2xl short:text-lg font-extrabold leading-tight">
            {guest ? t('del_titleGuest') : t('del_titleAccount')}
          </h2>
        </div>

        <p className="mt-3 short:mt-2 text-sm text-foreground/85 leading-snug">{guest ? t('del_descGuest') : t('del_desc')}</p>
        <p className="mt-2 text-xs text-foreground/65 leading-snug">{t('del_paymentsNote')}</p>

        <label className="mt-4 short:mt-3 block text-sm font-semibold" htmlFor="del-confirm">
          {t('del_typeToConfirm', { word })}
        </label>
        <input
          id="del-confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="mt-1.5 w-full h-11 rounded-2xl border-2 border-destructive/50 bg-brand-navy-deep/70 px-4 font-bold tracking-widest uppercase text-foreground focus:outline-none focus:border-destructive"
        />

        {stage === 'error' && (
          <p role="alert" className="mt-3 text-sm font-semibold text-destructive">{t('del_error')}</p>
        )}

        <div className="mt-5 short:mt-3 flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => { playButtonTap(); onClose(); }}
            disabled={stage === 'working'}
            className="flex-1 rounded-2xl border-2 border-accent/40 bg-background/40 py-3 short:py-2 font-bold text-sm hover:bg-muted/40 transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={run}
            disabled={!ready || stage === 'working'}
            className="flex-[1.4] rounded-2xl bg-destructive py-3 short:py-2 font-black text-sm text-white tracking-wide transition-opacity disabled:opacity-40"
          >
            {stage === 'working' ? t('del_working') : t('del_confirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
