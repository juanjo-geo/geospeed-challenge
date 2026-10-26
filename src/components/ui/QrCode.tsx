import { useEffect, useState } from 'react';
import { BRAND } from '@/lib/theme';

/**
 * Código QR en SVG (qrcode-generator, MIT, se descarga solo cuando hace falta): módulos oscuros sobre blanco para
 * que cualquier cámara lo lea, también proyectado.
 */
export default function QrCode({ text, label, className = '' }: { text: string; label: string; className?: string }) {
  const [qr, setQr] = useState<{ d: string; n: number } | null>(null);
  useEffect(() => {
    let alive = true;
    import('qrcode-generator').then((m) => {
      const q = m.default(0, 'M');
      q.addData(text);
      q.make();
      const n = q.getModuleCount();
      let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
      if (alive) setQr({ d, n });
    }).catch(() => {});
    return () => { alive = false; };
  }, [text]);
  if (!qr) return <div className={`bg-white/90 rounded-xl aspect-square ${className}`} aria-hidden />;
  return (
    <svg viewBox={`-2 -2 ${qr.n + 4} ${qr.n + 4}`} className={`rounded-xl aspect-square ${className}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect x={-2} y={-2} width={qr.n + 4} height={qr.n + 4} fill={BRAND.white} />
      <path d={qr.d} fill={BRAND.navyDeep} />
    </svg>
  );
}
