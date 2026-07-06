import { type ButtonHTMLAttributes, type CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success';

interface Button3DProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const PALETTE: Record<Variant, { bg: string; lip: string; fg: string }> = {
  primary:   { bg: 'hsl(var(--primary))',     lip: 'hsl(var(--primary) / 0.5)',   fg: 'hsl(var(--primary-foreground))' },
  secondary: { bg: 'hsl(var(--card))',        lip: 'hsl(var(--border))',          fg: 'hsl(var(--foreground))' },
  danger:    { bg: '#dc2626',                 lip: '#991b1b',                     fg: '#ffffff' },
  success:   { bg: '#16a34a',                 lip: '#15803d',                     fg: '#ffffff' },
};

/**
 * Botón 3D estilo Duolingo: tiene un "labio" inferior (sombra sólida) que se
 * comprime al presionar (el botón baja y la sombra se reduce). Ver .btn3d en index.css.
 */
export default function Button3D({ variant = 'primary', className = '', style, children, ...rest }: Button3DProps) {
  const p = PALETTE[variant];
  const css = {
    background: p.bg,
    color: p.fg,
    ['--btn3d-lip' as string]: p.lip,
    ...style,
  } as CSSProperties;
  return (
    <button
      className={`btn3d inline-flex items-center justify-center font-black rounded-xl select-none px-4 py-3 ${className}`}
      style={css}
      {...rest}
    >
      {children}
    </button>
  );
}
