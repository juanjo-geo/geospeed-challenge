import { lazy, Suspense, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import Wordmark from '@/components/ui/Wordmark';
import Mascot, { type MascotState } from '@/components/game/Mascot';
import { HudIconButton } from '@/components/game/GameHud';
import { ArrowRightIcon } from '@/components/ui/icons';
import { playButtonTap } from '@/lib/sounds';
// Globo y mapa dibujan los polígonos de países: carga diferida (la página de cuenta ya es lazy)
const SplashGlobe = lazy(() => import('@/components/game/SplashGlobe'));
const WorldBackdrop = lazy(() => import('@/components/game/WorldBackdrop'));

/** Ilustración: Explorador sobre el globo (acceso/registro) o con el objeto del paso de recuperación */
export type AccountArt = 'globe' | 'envelope' | 'key' | 'keyCheck' | 'hourglass';

interface Title { lead: string; tail: string; /** la parte amarilla en su propia línea */ stack?: boolean }

interface AccountScreenProps {
  art: AccountArt;
  onBack?: () => void;
  backLabel?: string;
  /** Título grande; `tail` va en amarillo */
  title: Title;
  subtitle?: ReactNode;
  /** Computador: frase grande bajo la ilustración (Inicio de sesión / Crear cuenta) */
  hero?: Title & { sub?: string };
  /** Computador: el formulario va en un panel con borde */
  card?: boolean;
  /** Computador: título del panel; reemplaza al título grande y al subtítulo (que ya están en `hero`) */
  cardTitle?: string;
  children: ReactNode;
}

/**
 * Marco común de las pantallas de Cuenta (maquetas Login, Login_Error, Crear_Cuenta, Recuperar_Contrasena,
 * Revisa_Correo, Nueva_Contrasena y Contrasena_Actualizada): fondo de mapa nocturno con rutas, el Explorador
 * y el título con la última parte en amarillo. En el celular todo va en una columna; en computador (lg) y
 * con el teléfono acostado (short) la ilustración queda a la izquierda y el formulario a la derecha.
 * La mascota de las maquetas lleva sombrero y brújula; usamos el Explorador maestro (pin con gema) con el
 * objeto de cada paso dibujado al lado.
 */
export default function AccountScreen({ art, onBack, backLabel = '', title, subtitle, hero, card, cardTitle, children }: AccountScreenProps) {
  const globe = art === 'globe';
  const mobileOnly = cardTitle ? 'lg:hidden' : '';
  // El título cabe en una línea: tamaño según su largo y el ancho de la columna (unidades de contenedor)
  const longest = title.stack ? Math.max(title.lead.length, title.tail.length) : title.lead.length + 1 + title.tail.length;
  const fit = { '--fit': `${(100 / (longest * 0.62)).toFixed(2)}cqi` } as React.CSSProperties;
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden text-foreground bg-brand-navy-deep">
      <AccountBackdrop compass={!globe} />
      {onBack && (
        <div className="absolute z-20 left-3 sm:left-5" style={{ top: 'max(env(safe-area-inset-top, 0px), 12px)' }}>
          <HudIconButton icon="back" label={backLabel} onClick={() => { playButtonTap(); onBack(); }} />
        </div>
      )}

      <main
        className={`relative z-10 mx-auto w-full max-w-md lg:max-w-6xl short:max-w-4xl min-h-[100dvh] grid lg:grid-cols-2 short:grid-cols-[0.8fr_1fr] ${globe ? 'content-center' : 'content-start'} lg:content-center short:content-center items-center gap-y-0 lg:gap-x-14 short:gap-x-6 px-5 sm:px-6 short:px-4 lg:py-8 short:py-3 ${globe ? 'pt-12' : 'pt-3'}`}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}
      >
        {/* Ilustración: arriba en el celular, a la izquierda en computador */}
        <section className="flex flex-col items-center short:self-start short:sticky short:top-0 short:h-[calc(100dvh-1.5rem)] short:justify-center">
          <div className={`w-full flex justify-center relative z-10 ${globe ? 'order-2 -mt-7 lg:order-1 lg:mt-0 short:order-1 short:mt-0' : 'order-1 h-11 items-center lg:h-auto short:h-auto'}`}>
            <Wordmark size="custom" className={`leading-none ${globe ? 'text-[2.6rem]' : 'text-[2.2rem]'} lg:text-[3.9rem] short:text-[1.9rem]`} />
          </div>
          <div className={`w-full ${globe ? 'order-1 lg:order-2 short:order-2' : 'order-2 mt-3 lg:mt-6 short:mt-2'}`}>
            {globe ? <GlobeArt /> : <PropArt art={art} />}
          </div>
          {hero && (
            <div className="order-3 hidden lg:block text-center mt-4">
              <h2 className={`font-black leading-[1.05] [text-shadow:0_4px_18px_rgba(0,0,0,0.55)] whitespace-nowrap ${hero.stack ? 'text-[min(3.5vw,2.8rem)]' : 'text-[min(3.6vw,2.9rem)]'}`}>
                {hero.lead}{hero.stack ? <br /> : ' '}<span className="text-primary">{hero.tail}</span>
              </h2>
              <svg viewBox="0 0 300 14" className="mx-auto mt-1 w-3/5 h-3 text-primary" fill="none" aria-hidden>
                <path d="M4 11 Q150 -2 296 11" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              {hero.sub && <p className="mt-1 text-lg text-foreground/90">{hero.sub}</p>}
            </div>
          )}
        </section>

        {/* Formulario */}
        <section className="w-full mt-3 lg:mt-0 short:mt-0 short:py-2">
          <div className={`[container-type:inline-size] ${card ? 'lg:rounded-[2rem] lg:border-2 lg:border-accent/60 lg:bg-brand-navy/70 lg:backdrop-blur-md lg:px-10 lg:py-7 lg:shadow-[0_0_44px_hsl(var(--accent)/0.20)]' : ''}`}>
            {cardTitle && <h1 className="hidden lg:block text-[2.5rem] font-extrabold text-center leading-tight mb-5">{cardTitle}</h1>}
            <h1 style={fit} className={`${mobileOnly} whitespace-nowrap text-[length:min(var(--fit),2.6rem)] lg:text-[length:min(var(--fit),3.2rem)] short:text-[length:min(var(--fit),1.8rem)] font-black leading-[1.1] text-center`}>
              {title.lead}{title.stack ? <br /> : ' '}<span className="text-primary">{title.tail}</span>
            </h1>
            {subtitle && <div className={`${mobileOnly} mt-2 short:mt-1 text-center text-base sm:text-lg short:text-sm text-brand-sky leading-snug`}>{subtitle}</div>}
            <div className="mt-5 short:mt-3">{children}</div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ───────────────────────── Piezas del formulario ───────────────────────── */

type FieldIconName = 'mail' | 'lock' | 'user';

export function AccountField({ icon, label, hideLabelOnMobile, reveal, ...input }: {
  icon: FieldIconName;
  label: string;
  /** Crear cuenta en el celular: sin etiqueta, el texto va como placeholder (maqueta) */
  hideLabelOnMobile?: boolean;
  /** Ojo para mostrar/ocultar la contraseña */
  reveal?: { shown: boolean; onToggle: () => void; showLabel: string; hideLabel: string };
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={hideLabelOnMobile ? 'sr-only lg:not-sr-only lg:block lg:text-sm lg:font-semibold lg:mb-1' : 'block text-sm short:text-xs font-semibold mb-1.5 short:mb-1'}>{label}</label>
      <div className="relative">
        <FieldIcon name={icon} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/85 pointer-events-none" />
        <input
          id={id}
          {...input}
          className={`w-full h-12 lg:h-11 short:h-10 rounded-2xl border-2 border-accent/70 bg-brand-navy-deep/75 pl-12 ${reveal ? 'pr-12' : 'pr-4'} ${hideLabelOnMobile ? 'lg:placeholder:text-transparent' : ''} text-base text-foreground placeholder:text-foreground/55 shadow-[0_0_14px_hsl(var(--accent)/0.12)] focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 transition-shadow`}
        />
        {reveal && (
          <button
            type="button"
            onClick={reveal.onToggle}
            aria-label={reveal.shown ? reveal.hideLabel : reveal.showLabel}
            title={reveal.shown ? reveal.hideLabel : reveal.showLabel}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-foreground/85 hover:text-foreground hover:bg-accent/10 transition-colors"
          >
            <EyeIcon off={reveal.shown} className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Botón amarillo principal con flecha (INICIAR SESIÓN →) */
export function PrimaryButton({ children, type = 'button', disabled, onClick }: { children: ReactNode; type?: 'button' | 'submit'; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick ? () => { playButtonTap(); onClick(); } : undefined}
      className="btn3d w-full h-14 lg:h-12 short:h-11 rounded-2xl font-black text-lg short:text-base uppercase tracking-wide text-primary-foreground flex items-center justify-center gap-3 shadow-[0_0_24px_hsl(var(--primary)/0.35)] disabled:cursor-wait"
      style={{ background: 'var(--grad-cta)' }}
    >
      {children} <ArrowRightIcon className="w-6 h-6" />
    </button>
  );
}

/** Botón con borde turquesa (Crear cuenta, Volver a iniciar sesión, Seguir como invitado) */
export function SecondaryButton({ children, onClick, icon }: { children: ReactNode; onClick: () => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => { playButtonTap(); onClick(); }}
      className="w-full h-12 lg:h-11 short:h-10 rounded-2xl border-2 border-accent/75 bg-brand-navy-deep/70 font-bold text-base text-foreground flex items-center justify-center gap-3 shadow-[0_0_14px_hsl(var(--accent)/0.12)] hover:bg-accent/10 transition-colors active:scale-[0.98]"
    >
      {icon}{children}
    </button>
  );
}

/** Enlace turquesa subrayado (Olvidé mi contraseña · Iniciar sesión) */
export function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={() => { playButtonTap(); onClick(); }} className="font-semibold text-accent underline underline-offset-4 decoration-2 hover:text-foreground transition-colors">
      {children}
    </button>
  );
}

/** Separador "──── o ────" */
export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 text-foreground/70" aria-hidden>
      <span className="flex-1 h-px bg-accent/40" />
      <span className="text-sm font-semibold">{label}</span>
      <span className="flex-1 h-px bg-accent/40" />
    </div>
  );
}

/** Aviso de error genérico (maqueta Login_Error): caja roja en el celular, texto rojo en computador */
export function ErrorNotice({ title, desc }: { title: string; desc?: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border-2 border-destructive/80 bg-destructive/50 px-4 py-2.5 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 text-left animate-fade-in">
      <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0 text-foreground lg:text-destructive" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="10" /><path d="M12 7v6.5" /><circle cx="12" cy="17" r="0.6" fill="currentColor" />
      </svg>
      <p className="text-sm leading-snug lg:text-destructive">
        <span className="block lg:inline font-bold">{title}</span>
        {desc && <span className="block lg:inline lg:ml-1 text-foreground/85 lg:text-destructive">{desc}</span>}
      </p>
    </div>
  );
}

/** Nota con ícono de información (Revisa también tu carpeta de spam) */
export function InfoNote({ children, lines }: { children: ReactNode; lines?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-sm text-foreground/85">
      {lines && <span className="flex-1 h-px bg-accent/35" />}
      <span className={`flex items-center gap-2.5 ${lines ? '' : 'mx-auto'}`}>
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="10" /><path d="M12 11v6" /><circle cx="12" cy="7.5" r="0.6" fill="currentColor" />
        </svg>
        {children}
      </span>
      {lines && <span className="flex-1 h-px bg-accent/35" />}
    </div>
  );
}

export const GuestIcon = () => (
  <>
    <svg viewBox="0 0 24 24" className="w-6 h-6 lg:hidden" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
    <svg viewBox="0 0 24 24" className="w-6 h-6 hidden lg:block" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg>
  </>
);

function FieldIcon({ name, className }: { name: FieldIconName; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {name === 'mail' && <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>}
      {name === 'lock' && <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><path d="M12 14.5v2.5" /></>}
      {name === 'user' && <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>}
    </svg>
  );
}

function EyeIcon({ off, className }: { off: boolean; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

/* ───────────────────────── Ilustraciones ───────────────────────── */

/** Explorador de pie sobre el globo (celular: solo el casquete; computador: globo completo detrás) */
function GlobeArt() {
  return (
    <div
      className="relative mx-auto w-[min(60vw,264px)] aspect-[1/0.74] overflow-hidden [mask-image:linear-gradient(to_bottom,black_72%,transparent)] lg:w-[min(32vw,400px,50dvh)] lg:aspect-square lg:overflow-visible lg:[mask-image:none] short:w-[min(30vw,220px)] short:aspect-[1/0.8]"
      aria-hidden
    >
      <div className="absolute inset-x-0 top-[46%] lg:top-0 short:top-[40%] rounded-full shadow-[0_0_48px_hsl(var(--accent)/0.4)]">
        <Suspense fallback={<div className="w-full aspect-square rounded-full bg-accent/15" />}><SplashGlobe /></Suspense>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[52%] lg:top-auto lg:-bottom-[4%] lg:w-[60%] short:w-[50%]">
        <Mascot state="wink" className="w-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.5)]" />
      </div>
    </div>
  );
}

const PROP_MASCOT: Record<Exclude<AccountArt, 'globe'>, MascotState> = {
  envelope: 'wink', key: 'wink', keyCheck: 'celebrate', hourglass: 'sad',
};

/** Explorador con el objeto del paso (sobre con llave · llave · llave con check · reloj de arena) sobre la plataforma */
function PropArt({ art }: { art: Exclude<AccountArt, 'globe'> }) {
  return (
    <div className="relative mx-auto w-[min(72vw,300px,36dvh)] aspect-square lg:w-[min(30vw,380px)] short:w-[min(24vw,160px)]" aria-hidden>
      <Platform className="absolute -inset-x-[14%] bottom-0 h-[26%] text-accent" />
      <div className="absolute left-[4%] bottom-[10%] w-[70%]">
        <Mascot state={PROP_MASCOT[art]} className="w-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.5)]" />
      </div>
      <div className={`absolute ${art === 'envelope' ? 'right-[-6%] bottom-[18%] w-[44%]' : 'right-[2%] bottom-[16%] w-[30%]'}`}>
        <Sparks className="absolute -top-[46%] left-[22%] w-[62%] text-primary" />
        {art === 'envelope' && <EnvelopeKey />}
        {(art === 'key' || art === 'keyCheck') && <KeyArt />}
        {art === 'hourglass' && <Hourglass />}
        {art === 'keyCheck' && <CheckBadge className="absolute -top-[34%] -right-[40%] w-[64%]" />}
      </div>
    </div>
  );
}

function Platform({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 200 52" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <radialGradient id="acc-platform" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="26" rx="99" ry="25" fill="url(#acc-platform)" />
      <ellipse cx="100" cy="26" rx="84" ry="16" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.4" />
      <ellipse cx="100" cy="26" rx="58" ry="10.5" fill="none" stroke="currentColor" strokeOpacity="0.85" strokeWidth="2" />
      <path d="M100 19l4.5 7-4.5 7-4.5-7z" fill="currentColor" />
    </svg>
  );
}

function Sparks({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 40 22" className={className} fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" aria-hidden>
      <path d="M7 19 3 8M20 17V3M33 19l4-11" />
    </svg>
  );
}

function EnvelopeKey() {
  return (
    <svg viewBox="0 0 100 74" className="w-full rotate-[-8deg] drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]" aria-hidden>
      <rect x="3" y="4" width="94" height="66" rx="9" style={{ fill: 'hsl(var(--foreground))' }} />
      <path d="M6 9l44 32 44-32" fill="none" strokeWidth="3" strokeLinejoin="round" style={{ stroke: 'hsl(var(--muted-foreground) / 0.7)' }} />
      <path d="M6 66l32-26M94 66 62 40" fill="none" strokeWidth="2.4" style={{ stroke: 'hsl(var(--muted-foreground) / 0.45)' }} />
      <g transform="rotate(-32 50 44)" style={{ fill: 'hsl(var(--primary))', stroke: 'hsl(var(--brand-yellow-deep))' }} strokeWidth="1.6">
        <circle cx="38" cy="44" r="9.5" />
        <rect x="45" y="40.5" width="26" height="7" rx="2" />
        <rect x="60" y="46" width="5" height="7" rx="1.2" />
        <rect x="66.5" y="46" width="4.5" height="5" rx="1.2" />
      </g>
      <circle cx="38" cy="44" r="4" transform="rotate(-32 50 44)" style={{ fill: 'hsl(var(--foreground))' }} />
    </svg>
  );
}

function KeyArt() {
  return (
    <svg viewBox="0 0 60 104" className="w-full rotate-[24deg] drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]" aria-hidden>
      <g style={{ fill: 'hsl(var(--primary))', stroke: 'hsl(var(--brand-yellow-deep))' }} strokeWidth="2">
        <path d="M30 4a19 19 0 1 1 0 38 19 19 0 0 1 0-38Zm0 10a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" fillRule="evenodd" />
        <rect x="25" y="40" width="10" height="58" rx="3" />
        <rect x="33" y="72" width="15" height="8" rx="2" />
        <rect x="33" y="86" width="11" height="8" rx="2" />
      </g>
    </svg>
  );
}

function CheckBadge({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`${className} drop-shadow-[0_0_10px_hsl(var(--accent)/0.8)]`} aria-hidden>
      <circle cx="24" cy="24" r="20" strokeWidth="4" style={{ fill: 'hsl(var(--brand-navy-deep))', stroke: 'hsl(var(--accent))' }} />
      <path d="m15 24.5 6 6 12-13" fill="none" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'hsl(var(--foreground))' }} />
    </svg>
  );
}

function Hourglass() {
  return (
    <svg viewBox="0 0 60 84" className="w-full rotate-[12deg] drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]" aria-hidden>
      <path d="M13 11h34c0 17-13 21-13 31s13 14 13 31H13c0-17 13-21 13-31S13 28 13 11Z" strokeWidth="3" style={{ fill: 'hsl(var(--foreground) / 0.22)', stroke: 'hsl(var(--foreground))' }} />
      <path d="M19 19h22c-2 7-8 11-11 15-3-4-9-8-11-15Z" style={{ fill: 'hsl(var(--primary))' }} />
      <path d="M17 70c2-9 8-13 13-15 5 2 11 6 13 15Z" style={{ fill: 'hsl(var(--primary))' }} />
      <rect x="6" y="3" width="48" height="9" rx="3" style={{ fill: 'hsl(var(--brand-yellow-deep))' }} />
      <rect x="6" y="72" width="48" height="9" rx="3" style={{ fill: 'hsl(var(--brand-yellow-deep))' }} />
    </svg>
  );
}

/** Fondo: mapa nocturno, rutas punteadas con pines y rosa de los vientos (maquetas de Cuenta) */
function AccountBackdrop({ compass }: { compass: boolean }) {
  const dots: [number, number, 'pin' | 'dot'][] = [[17, 13, 'pin'], [30, 19, 'pin'], [80, 10, 'pin'], [95, 15, 'pin'], [7, 24, 'dot'], [62, 6, 'dot'], [52, 28, 'dot']];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 85% 55% at 50% 24%, hsl(var(--brand-navy)), transparent 72%)' }} />
      <div className="absolute left-1/2 -translate-x-1/2 top-[1vh] w-[240vw] h-[60vh] lg:top-0 lg:w-[112vw] lg:h-full short:top-0 short:w-[112vw] short:h-full">
        <Suspense fallback={null}><WorldBackdrop tone="night" /></Suspense>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full text-accent" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.4" strokeDasharray="5 6">
        <path d="M-2 22 Q 9 10 17 13 T 30 19" vectorEffect="non-scaling-stroke" />
        <path d="M70 18 Q 76 6 80 10 T 95 15" vectorEffect="non-scaling-stroke" />
        <path d="M7 24 Q 30 36 52 28 T 102 30" vectorEffect="non-scaling-stroke" />
      </svg>
      {dots.map(([x, y, kind]) => (
        <span key={`${x}-${y}`} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${x}%`, top: `${y}%` }}>
          {kind === 'pin'
            ? <svg viewBox="0 0 24 32" className="w-4 h-5 lg:w-5 lg:h-7 text-accent opacity-70"><path d="M12 1C6 1 2 5.5 2 11c0 7.5 10 19 10 19s10-11.5 10-19C22 5.5 18 1 12 1Z" fill="currentColor" /><circle cx="12" cy="11" r="4" className="text-brand-navy-deep" fill="currentColor" /></svg>
            : <span className="block w-2.5 h-2.5 rounded-full bg-primary/80 ring-4 ring-primary/20" />}
        </span>
      ))}
      <svg viewBox="0 0 100 100" className={`absolute right-[2%] top-[36%] w-24 lg:right-auto lg:left-[3%] lg:top-auto lg:bottom-[14%] lg:w-32 short:hidden text-accent opacity-25 lg:opacity-35 ${compass ? '' : 'hidden'}`} fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="50" cy="50" r="34" /><circle cx="50" cy="50" r="27" strokeDasharray="2 3" />
        <path d="M50 4 56 44 96 50 56 56 50 96 44 56 4 50 44 44Z" fill="currentColor" fillOpacity="0.25" />
        <path d="M50 22 53 47 78 50 53 53 50 78 47 53 22 50 47 47Z" fill="currentColor" fillOpacity="0.45" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-[55%] lg:hidden short:hidden" style={{ background: 'linear-gradient(to top, hsl(var(--brand-navy-deep)) 45%, transparent)' }} />
    </div>
  );
}
