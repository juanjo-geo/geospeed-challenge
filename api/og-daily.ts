/**
 * Imagen de la vista previa del link del diario (Fase 2b), 1200×630:
 *   /api/og-daily?n=162&r=Juanjo&h=8&t=42&g=GGYRX…[&l=en]
 * La piden WhatsApp, Telegram, iMessage… desde las etiquetas og: de api/daily-page.ts. Con resultado muestra
 * "Juanjo hizo 8/13 en 42 s" y los cuadritos (sin ciudades); sin él, la invitación al diario de ese día.
 * Fuente y mascota van incrustadas (api/_ogAssets.ts). ImageResponse ya la marca como inmutable (1 año): la
 * imagen depende solo de los parámetros.
 */
import { ImageResponse } from '@vercel/og';
import { BRAND } from '../src/lib/theme';
import { readDailyQuery, dailyTexts, dailyDateLabel, DAILY_TOTAL } from './_dailyMeta';
import { POPPINS_600, POPPINS_800, EXPLORER_PNG } from './_ogAssets';

export const config = { runtime: 'edge' };

type El = { type: string; props: Record<string, unknown> };
/** Elemento para satori sin JSX; los div son flex (satori lo exige con varios hijos) */
const el = (type: string, props: Record<string, unknown>, ...children: unknown[]): El => {
  const style = (props.style as Record<string, unknown>) ?? {};
  return {
    type,
    props: { ...props, style: type === 'div' ? { display: 'flex', ...style } : style, children: children.length <= 1 ? children[0] : children },
  };
};

const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;

/** Cuadrito del resultado: G rápido, Y lento, R fallo, X sin jugar (como los emoji del texto) */
const SQUARE: Record<string, string> = { G: BRAND.turquoise, Y: BRAND.yellow, R: BRAND.coral, X: BRAND.navyCard };

export default function handler(req: Request): Response {
  const q = readDailyQuery(new URL(req.url));
  if (!q) return new Response('Not found', { status: 404 });
  const tx = dailyTexts(q);
  const inv = q.invite;
  const grid = inv?.grid ? inv.grid.padEnd(DAILY_TOTAL, 'X') : '';
  const nameSize = !inv ? 0 : inv.name.length > 11 ? 60 : 76;

  const header = el('div', { style: { alignItems: 'center', gap: 22 } },
    el('div', { style: { fontSize: 54, fontWeight: 800, letterSpacing: 1 } },
      el('span', { style: { color: BRAND.white } }, 'GEO'),
      el('span', { style: { color: BRAND.turquoise } }, 'SPEED'),
    ),
    el('div', { style: { fontSize: 26, fontWeight: 800, color: BRAND.yellow, border: `3px solid ${BRAND.yellow}`, borderRadius: 999, padding: '6px 20px' } }, tx.badge),
  );

  const middle = inv
    ? el('div', { style: { flexDirection: 'column', gap: 6 } },
        el('div', { style: { fontSize: nameSize, fontWeight: 800, color: BRAND.yellow, lineHeight: 1.05 } }, inv.name),
        el('div', { style: { fontSize: 54, fontWeight: 800, color: BRAND.white, lineHeight: 1.1 } }, tx.did),
        grid
          ? el('div', { style: { gap: 9, marginTop: 22 } },
              ...grid.split('').map((c) => el('div', { style: { width: 42, height: 42, borderRadius: 9, background: SQUARE[c] ?? SQUARE.X, border: c === 'X' ? `2px solid ${BRAND.muted}55` : 'none' } })),
            )
          : el('div', {}),
      )
    : el('div', { style: { flexDirection: 'column', gap: 4 } },
        el('div', { style: { fontSize: 70, fontWeight: 800, color: BRAND.white, lineHeight: 1.08 } }, tx.ask[0]),
        el('div', { style: { fontSize: 70, fontWeight: 800, color: BRAND.yellow, lineHeight: 1.08 } }, tx.ask[1]),
        el('div', { style: { fontSize: 32, fontWeight: 600, color: BRAND.sky, marginTop: 14 } }, tx.same),
      );

  const cta = el('div', { style: { alignSelf: 'flex-start', fontSize: 32, fontWeight: 800, color: BRAND.navyDeep, background: BRAND.yellow, borderRadius: 999, padding: '14px 36px' } }, tx.cta);

  const root = el('div', {
    style: { width: 1200, height: 630, position: 'relative', fontFamily: 'Poppins', color: BRAND.white, background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyDeep} 100%)` },
  },
    // Halo turquesa detrás del Explorador
    el('div', { style: { position: 'absolute', right: -80, bottom: -170, width: 680, height: 680, borderRadius: 340, background: `radial-gradient(circle, ${BRAND.turquoise}55 0%, ${BRAND.turquoise}00 68%)` } }),
    el('img', { src: `data:image/png;base64,${EXPLORER_PNG}`, width: 387, height: 380, style: { position: 'absolute', right: 64, bottom: 70 } }),
    el('div', { style: { flexDirection: 'column', justifyContent: 'space-between', width: 800, height: 630, padding: '54px 0 58px 72px' } },
      el('div', { style: { flexDirection: 'column', gap: 10 } },
        header,
        el('div', { style: { fontSize: 26, fontWeight: 600, color: BRAND.muted } }, dailyDateLabel(q.no, q.lang)),
      ),
      middle,
      cta,
    ),
  );

  return new ImageResponse(root as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Poppins', data: fromB64(POPPINS_600), weight: 600, style: 'normal' },
      { name: 'Poppins', data: fromB64(POPPINS_800), weight: 800, style: 'normal' },
    ],
  });
}
