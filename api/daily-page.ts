/**
 * Vista previa del link del diario (Fase 2b) para los robots de WhatsApp, Telegram, iMessage, Facebook,
 * X, Discord, Slack y LinkedIn. vercel.json reescribe /d/<n> hacia aquí SOLO cuando el user-agent es uno
 * de esos robots; las personas siguen recibiendo la app normal (index.html).
 * Devuelve un HTML mínimo con las etiquetas og:/twitter: del resultado y la imagen de api/og-daily.ts.
 * Si una persona llegara aquí, ve un enlace a la app (?app=1 salta esta reescritura).
 */
import { BRAND } from '../src/lib/theme';
import { readDailyQuery, inviteParams, dailyTexts } from './_dailyMeta';

export const config = { runtime: 'edge' };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function handler(req: Request): Response {
  const url = new URL(req.url);
  const q = readDailyQuery(url);
  if (!q) return Response.redirect(new URL('/?app=1', url.origin).toString(), 302);

  const qs = inviteParams(q).toString();
  const pageUrl = `${url.origin}/d/${q.no}${qs ? `?${qs}` : ''}`;
  const appUrl = `/d/${q.no}?${qs ? `${qs}&` : ''}app=1`;
  const imageUrl = `${url.origin}/api/og-daily?n=${q.no}${qs ? `&${qs}` : ''}`;
  const tx = dailyTexts(q);

  const meta = (attr: 'property' | 'name', key: string, value: string) => `<meta ${attr}="${key}" content="${esc(value)}" />`;
  const html = `<!doctype html>
<html lang="${q.lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(tx.title)}</title>
${meta('name', 'description', tx.description)}
<meta name="robots" content="noindex" />
${meta('property', 'og:type', 'website')}
${meta('property', 'og:site_name', 'GeoSpeed Challenge')}
${meta('property', 'og:title', tx.title)}
${meta('property', 'og:description', tx.description)}
${meta('property', 'og:url', pageUrl)}
${meta('property', 'og:image', imageUrl)}
${meta('property', 'og:image:type', 'image/png')}
${meta('property', 'og:image:width', '1200')}
${meta('property', 'og:image:height', '630')}
${meta('property', 'og:image:alt', tx.alt)}
${meta('property', 'og:locale', q.lang === 'en' ? 'en_US' : 'es_CO')}
${meta('name', 'twitter:card', 'summary_large_image')}
${meta('name', 'twitter:title', tx.title)}
${meta('name', 'twitter:description', tx.description)}
${meta('name', 'twitter:image', imageUrl)}
${meta('name', 'twitter:image:alt', tx.alt)}
</head>
<body style="font-family:system-ui,sans-serif;background:${BRAND.navy};color:${BRAND.white};text-align:center;padding:48px 16px">
<h1 style="font-size:22px">${esc(tx.title)}</h1>
<p><a href="${esc(appUrl)}" style="color:${BRAND.yellow};font-weight:800">GeoSpeed Challenge →</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=86400' },
  });
}
