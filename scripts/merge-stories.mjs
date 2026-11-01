/**
 * Une y valida los textos de la reseña (bloque R3). Lee las fuentes (<trabajo>/sources/*.json, de
 * scripts/build-story-sources.mjs) y los textos redactados (<trabajo>/out/<tanda>.json: { id: { es: [p1, p2],
 * en: [p1, p2] } }), revisa cada lugar y escribe src/data/stories/<grupo>.json ({ id: [[es1, es2], [en1, en2], wp] })
 * con los que pasan, más el documento de revisión (docs/R3_Resenas_textos.md para el mundo + Colombia,
 * docs/R3_Resenas_packs_pro.md para los packs Pro) y <trabajo>/report.json (lo que hay que rehacer y por qué).
 *
 * Se rechaza un lugar si falta, si un párrafo está vacío o fuera de 30–120 palabras, si está en el idioma equivocado,
 * si toca temas que el juego evita (guerra, política, tragedias…), si copia 9 palabras seguidas del artículo o del dato
 * curioso, o si trae un número (año, cantidad) que no está en las fuentes ni en las cifras de la ficha.
 *
 * Solo se escriben los grupos que tienen fuentes en la carpeta de trabajo (los demás archivos no se tocan). Los lugares
 * de <trabajo>/aliases.json ({ idPack: idMundo }) copian el texto ya publicado del lugar del mundo.
 *
 * Uso: node scripts/merge-stories.mjs --work <trabajo> [--groups pro]
 *      node scripts/merge-stories.mjs --work <trabajo> --check pro-03   (revisa una sola tanda, no escribe nada)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const WORK = arg('--work');
if (!WORK) { console.error('Uso: node scripts/merge-stories.mjs --work <trabajo> [--groups pro] [--check <tanda>]'); process.exit(1); }
const CHECK = arg('--check');
const read = (f) => JSON.parse(readFileSync(f, 'utf8'));

const PACKS = ['andes', 'conosur', 'mexcam', 'caribe'];
const WORLD_GROUPS = ['cities', 'flags', 'features', 'monuments', 'colombia'];
const GROUPS = (arg('--groups') ?? [...WORLD_GROUPS, ...PACKS].join(',')).split(',').flatMap((g) => (g === 'pro' ? PACKS : [g]));
/** País (ISO) → pack Pro, como src/data/proPackMeta.ts */
const PACK_OF_ISO = {
  ve: 'andes', ec: 'andes', pe: 'andes', bo: 'andes',
  cl: 'conosur', ar: 'conosur', uy: 'conosur', py: 'conosur',
  mx: 'mexcam', gt: 'mexcam', bz: 'mexcam', sv: 'mexcam', hn: 'mexcam', ni: 'mexcam', cr: 'mexcam', pa: 'mexcam',
  cu: 'caribe', do: 'caribe', ht: 'caribe', jm: 'caribe', pr: 'caribe',
};
const groupOf = (id) => {
  if (id.startsWith('flag:')) return 'flags';
  if (id.startsWith('feat:')) return 'features';
  if (id.startsWith('mon:')) return 'monuments';
  if (id.startsWith('co:') || id.startsWith('div:co-')) return 'colombia';
  const m = id.match(/^(?:ci|div):([a-z]{2})-/);
  if (m) return PACK_OF_ISO[m[1]] ?? 'pro';
  return 'cities';
};

const sources = new Map();
const batchFiles = readdirSync(join(WORK, 'sources')).filter((f) => f.endsWith('.json') && (!CHECK || f === `${CHECK}.json`));
for (const f of batchFiles) for (const it of read(join(WORK, 'sources', f))) if (GROUPS.includes(groupOf(it.id))) sources.set(it.id, it);
const texts = {};
// Las tandas de corrección (fix-*.json: lugares reescritos con una fuente corregida) se aplican al final
const outFiles = existsSync(join(WORK, 'out')) ? readdirSync(join(WORK, 'out')).filter((f) => f.endsWith('.json') && (!CHECK || f === `${CHECK}.json`)) : [];
for (const f of outFiles.sort((a, b) => Number(a.startsWith('fix-')) - Number(b.startsWith('fix-')) || a.localeCompare(b))) Object.assign(texts, read(join(WORK, 'out', f)));

// Por idioma: "mayor" es "más grande" en español y "alcalde" en inglés
const AVOID = {
  es: /\bguerras?\b|conflicto armado|batalla|bombarde|elecci[oó]n|partido pol[ií]tico|presidente|alcalde|gobernador|dictad|militar|ataque|atentado|violencia|narcotr|homicid|asesinat|terremoto|tragedia|masacre|desastre|genocid/i,
  en: /\bwars?\b|armed conflict|battle|bombing|election|president|\bmayor\b|governor|dictator|military|attack|violence|drug traffick|homicide|murder|earthquake|tragedy|massacre|disaster|genocide/i,
};
const words = (s) => s.trim().split(/\s+/).filter(Boolean);
const ES_HINT = /\b(el|la|los|las|de|del|que|en|con|por|una|un|es|su|sus|para|como)\b/gi;
const EN_HINT = /\b(the|and|of|in|with|for|its|is|are|to|a|an|as|from)\b/gi;
const ratio = (s, re) => (s.match(re) ?? []).length / Math.max(1, words(s).length);
const norm = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const ngrams = (s, n) => { const w = norm(s).split(' '); const out = new Set(); for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' ')); return out; };
/** Números con sentido (años, cantidades): 1.200, 3,5, 1900, 50 */
const numbers = (s) => (s.match(/\d[\d.,]*\d|\d/g) ?? []).map((x) => x.replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.')).filter((x) => Number(x) >= 10);

const problems = {};
const ok = {};
for (const [id, src] of sources) {
  const t = texts[id];
  const why = [];
  if (!t) why.push('falta');
  else if (!src.summary && !src.summaryEn) why.push('sin fuente');
  else {
    for (const lang of ['es', 'en']) {
      const ps = t[lang];
      if (!Array.isArray(ps) || ps.length !== 2 || ps.some((p) => typeof p !== 'string' || !p.trim())) { why.push(`${lang}: no son dos párrafos`); continue; }
      ps.forEach((p, k) => {
        const n = words(p).length;
        if (n < 30 || n > 120) why.push(`${lang}${k + 1}: ${n} palabras`);
        if (AVOID[lang].test(p)) why.push(`${lang}${k + 1}: tema a evitar (${p.match(AVOID[lang])[0]})`);
        if (lang === 'es' && ratio(p, ES_HINT) < 0.12) why.push(`${lang}${k + 1}: no parece español`);
        if (lang === 'en' && ratio(p, EN_HINT) < 0.12) why.push(`${lang}${k + 1}: no parece inglés`);
      });
    }
    if (!why.length) {
      const sourceText = [src.summary, src.sights, src.summaryEn, src.sightsEn, src.trivia, ...(src.figures ?? [])].filter(Boolean).join(' ');
      const src9 = ngrams(sourceText, 9);
      const trivia7 = ngrams(src.trivia ?? '', 7);
      for (const lang of ['es', 'en']) {
        t[lang].forEach((p, k) => {
          const copied = [...ngrams(p, 9)].find((g) => src9.has(g));
          if (copied) why.push(`${lang}${k + 1}: copia del artículo («${copied}»)`);
          if ([...ngrams(p, 7)].some((g) => trivia7.has(g))) why.push(`${lang}${k + 1}: repite el dato curioso`);
        });
      }
      const known = new Set(numbers(sourceText));
      const unknown = [...new Set([...t.es, ...t.en].flatMap(numbers))].filter((x) => !known.has(x));
      if (unknown.length) why.push(`números sin fuente: ${unknown.join(', ')}`);
    }
  }
  if (why.length) problems[id] = why;
  else ok[id] = t;
}

if (CHECK) {
  const ids = [...sources.keys()];
  console.log(`${CHECK}: ${ids.length} lugares · bien: ${ids.filter((id) => ok[id]).length} · por corregir: ${Object.keys(problems).length}`);
  for (const [id, why] of Object.entries(problems)) console.log(`  ${id}: ${why.join(' · ')}`);
  process.exit(Object.keys(problems).length ? 1 : 0);
}

// Lugares de los packs que reutilizan el texto ya publicado de una ciudad del mundo
const aliases = existsSync(join(WORK, 'aliases.json')) ? read(join(WORK, 'aliases.json')) : {};
const published = new Map();
const publishedGroup = (g) => {
  if (!published.has(g)) published.set(g, existsSync(`src/data/stories/${g}.json`) ? read(`src/data/stories/${g}.json`) : {});
  return published.get(g);
};
const reused = {};
for (const [id, a] of Object.entries(aliases)) {
  const { to, name = id, toName = to } = typeof a === 'string' ? { to: a } : a;
  if (!GROUPS.includes(groupOf(id))) continue;
  const s = publishedGroup(groupOf(to))[to];
  if (s) reused[id] = { es: s[0], en: s[1], wp: s[2], from: to, name, toName };
  else problems[id] = [`alias sin texto publicado (${to})`];
}

mkdirSync('src/data/stories', { recursive: true });
const written = [];
for (const g of GROUPS) {
  const ids = [...sources.keys(), ...Object.keys(reused)].filter((id) => groupOf(id) === g);
  if (!ids.length) continue; // sin fuentes de este grupo en la carpeta de trabajo: no se toca su archivo
  const data = {};
  for (const id of [...new Set(ids)].sort((a, b) => a.localeCompare(b))) {
    const t = ok[id];
    if (t) data[id] = [[t.es[0].trim(), t.es[1].trim()], [t.en[0].trim(), t.en[1].trim()], sources.get(id).wp ?? null];
    else if (reused[id]) data[id] = [reused[id].es, reused[id].en, reused[id].wp];
  }
  writeFileSync(`src/data/stories/${g}.json`, JSON.stringify(data));
  written.push(g);
}
writeFileSync(join(WORK, 'report.json'), JSON.stringify(problems, null, 1));

const GROUP_ES = { cities: 'Ciudades del mundo', flags: 'Países', features: 'Lugares geográficos', monuments: 'Monumentos', colombia: 'Pack Colombia', andes: 'Pack Andes', conosur: 'Pack Cono Sur', mexcam: 'Pack México y Centroamérica', caribe: 'Pack Caribe' };
const onlyPacks = written.every((g) => PACKS.includes(g));
const DOC = onlyPacks ? 'docs/R3_Resenas_packs_pro.md' : 'docs/R3_Resenas_textos.md';
const nameOf = (id) => sources.get(id)?.name ?? reused[id]?.name ?? id;
let doc = `# Reseña del lugar · R3 · textos${onlyPacks ? ' de los packs Pro' : ''} (para revisar)

Generado por \`node scripts/merge-stories.mjs\` el ${new Date().toISOString().slice(0, 10)}. Dos párrafos por lugar ("Lo curioso" y
"Para conocer"), escritos con base en el artículo de Wikipedia de cada lugar (resumen y frases de qué ver), revisados
automáticamente (largo, idioma, temas a evitar, frases copiadas, números sin fuente). Aquí va el español; el inglés
está en \`src/data/stories/\`.${onlyPacks ? ' Las ciudades que ya existen en el catálogo del mundo (Lima, Buenos Aires, Asunción…) reutilizan la reseña del mundo y aquí aparecen como «misma reseña que…».' : ''}

| Grupo | Lugares | Con texto |
|---|---|---|
${written.map((g) => { const all = [...new Set([...sources.keys(), ...Object.keys(reused)])].filter((id) => groupOf(id) === g); return `| ${GROUP_ES[g]} | ${all.length} | ${all.filter((id) => ok[id] || reused[id]).length} |`; }).join('\n')}
`;
for (const g of written) {
  doc += `\n## ${GROUP_ES[g]}\n`;
  const ids = [...new Set([...sources.keys(), ...Object.keys(reused)])].filter((id) => groupOf(id) === g).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'es'));
  for (const id of ids) {
    const t = ok[id];
    const src = sources.get(id);
    const label = src?.kind && !src.kind.startsWith('ciudad') && PACKS.includes(g) ? `${src.name} (${src.kind})` : nameOf(id);
    if (t) doc += `\n**${label}**\n\n${t.es[0]}\n\n${t.es[1]}\n`;
    else if (reused[id]) doc += `\n**${nameOf(id)}**: _misma reseña que ${reused[id].toName} (ciudad del mundo)_\n`;
    else doc += `\n**${label}**: _sin texto todavía_\n`;
  }
}
writeFileSync(DOC, doc);
console.log(`grupos escritos: ${written.join(', ') || 'ninguno'} · con texto: ${Object.keys(ok).length}/${sources.size} · reutilizados: ${Object.keys(reused).length} · por rehacer: ${Object.keys(problems).length} · doc: ${DOC}`);
const kinds = {};
for (const ws of Object.values(problems)) for (const w of ws) { const k = w.replace(/^(es|en)\d?: /, '').replace(/\(.*$|«.*$|: .*$/, '').trim(); kinds[k] = (kinds[k] ?? 0) + 1; }
console.log(kinds);
