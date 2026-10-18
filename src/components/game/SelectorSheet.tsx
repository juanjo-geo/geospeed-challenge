import { useEffect, useState } from 'react';
import { playButtonTap } from '@/lib/sounds';

export interface SelectorOption<K extends string> {
  key: K;
  emoji: string;
  label: string;
  desc: string;
  /**
   * Ilustración compuesta (maquetas Región / Dificultad): emoji principal grande y, opcional,
   * uno secundario pequeño delante. Sustituye a las ilustraciones 3D de la maqueta sin añadir imágenes.
   */
  art?: [string, string?];
  /** Bloqueada por nivel (decisión D12: se muestra con candado, no se oculta) */
  locked?: boolean;
  lockLabel?: string;
}

interface SelectorSheetProps<K extends string> {
  title: string;
  subtitle: string;
  options: SelectorOption<K>[];
  selected: K;
  confirmLabel: string;
  /** Texto pequeño bajo el botón ("Mantendremos tu dificultad actual.") */
  footnote?: string;
  /** Tarjeta de contexto encima del botón (región actual + ciudades/segundos) */
  context?: { emoji: string; title: string; desc: string };
  onConfirm: (key: K) => void;
  onClose: () => void;
  /** aria-label del botón cerrar (traducido por quien abre la hoja) */
  closeLabel?: string;
}

/**
 * Hoja inferior de selección (maquetas Región / Dificultad APROBADA_v1).
 * Móvil: sube desde abajo con asa. Escritorio (md+): modal centrado.
 */
export default function SelectorSheet<K extends string>({ title, subtitle, options, selected, confirmLabel, footnote, context, onConfirm, onClose, closeLabel = 'Cerrar' }: SelectorSheetProps<K>) {
  const [value, setValue] = useState<K>(selected);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose]);

  const titleParts = title.split(' ');
  const titleHead = titleParts.slice(0, -1).join(' ');
  const titleTail = titleParts.slice(-1)[0];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />
      <div
        className="relative w-full md:max-w-lg short:max-w-2xl bg-card border-t md:border border-border rounded-t-3xl md:rounded-3xl short:rounded-t-3xl shadow-2xl px-4 pt-3 pb-5 md:p-6 short:px-4 short:pt-3 transition-transform duration-300 ease-out max-h-[92dvh] short:max-h-[100dvh] overflow-y-auto"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(24px)', paddingBottom: 'calc(1.25rem + var(--sab))' }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/40 md:hidden short:hidden" aria-hidden />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 short:top-2 w-9 h-9 short:w-8 short:h-8 rounded-full border border-border/60 bg-muted/40 flex items-center justify-center text-lg hover:bg-muted transition-colors active:scale-95"
          aria-label={closeLabel}
        >
          ×
        </button>

        <h2 className="text-2xl sm:text-3xl short:text-xl font-black pr-10 leading-tight">
          {titleHead} <span className="text-primary">{titleTail}</span>
        </h2>
        <p className="text-sm short:text-xs text-muted-foreground mt-1 mb-4 short:mt-0 short:mb-2">{subtitle}</p>

        <div className="flex flex-col gap-2 short:grid short:grid-cols-2" role="radiogroup" aria-label={title}>
          {options.map(opt => {
            const isSel = value === opt.key;
            return (
              <button
                key={opt.key}
                role="radio"
                aria-checked={isSel}
                disabled={opt.locked}
                onClick={() => { if (!opt.locked) { playButtonTap(); setValue(opt.key); } }}
                className={`w-full flex items-center gap-3 px-3 py-2 short:px-2 short:py-1 short:gap-2 rounded-2xl border-2 text-left transition-all active:scale-[0.99] ${
                  opt.locked
                    ? 'border-border/40 bg-muted/20 opacity-55 cursor-not-allowed'
                    : isSel
                    ? 'border-accent bg-accent/10 shadow-[0_0_18px_hsl(var(--accent)/0.25)]'
                    : 'border-border bg-muted/30 hover:border-accent/50'
                }`}
              >
                <OptionArt art={opt.art ?? [opt.emoji]} locked={!!opt.locked} />
                <span className="flex-1 min-w-0">
                  <span className="block font-extrabold text-lg sm:text-xl short:text-sm leading-tight">{opt.label}</span>
                  <span className="block text-xs sm:text-sm short:text-[11px] text-muted-foreground leading-tight">{opt.locked && opt.lockLabel ? opt.lockLabel : opt.desc}</span>
                </span>
                <span
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSel ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'}`}
                  aria-hidden
                >
                  {isSel && <span className="text-sm font-black">✓</span>}
                </span>
              </button>
            );
          })}
        </div>

        {context && (
          <div className="mt-3 short:mt-2 flex items-center gap-3 p-3 short:py-1.5 rounded-2xl border border-border bg-muted/20">
            <span className="text-3xl short:text-2xl" aria-hidden>{context.emoji}</span>
            <span>
              <span className="block font-bold text-sm">{context.title}</span>
              <span className="block text-xs text-muted-foreground">{context.desc}</span>
            </span>
          </div>
        )}

        <button
          onClick={() => { playButtonTap(); onConfirm(value); }}
          className="btn3d mt-4 short:mt-2 w-full py-4 short:py-2.5 rounded-2xl font-black text-lg short:text-base tracking-wide text-primary-foreground"
          style={{ background: 'var(--grad-cta)' }}
        >
          {confirmLabel}
        </button>
        {footnote && <p className="text-center text-xs text-muted-foreground mt-2 short:mt-1">{footnote}</p>}
      </div>
    </div>
  );
}

/** Mosaico de la opción: emoji grande con un halo y, si hay, otro pequeño delante (estilo ilustración). */
function OptionArt({ art, locked }: { art: [string, string?]; locked: boolean }) {
  const [main, extra] = art;
  return (
    <span className={`relative w-16 h-14 short:w-10 short:h-9 shrink-0 flex items-center justify-center ${locked ? 'grayscale' : ''}`} aria-hidden>
      <span className="absolute inset-x-1 bottom-0.5 h-3 rounded-[50%] bg-accent/25 blur-[3px]" />
      <span className="relative text-[2.6rem] short:text-2xl leading-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]">{main}</span>
      {extra && <span className="absolute right-0 bottom-0 text-2xl short:text-base leading-none drop-shadow-[0_3px_4px_rgba(0,0,0,0.5)]">{extra}</span>}
      {locked && <span className="absolute -top-1 -right-1 text-lg short:text-sm">🔒</span>}
    </span>
  );
}
