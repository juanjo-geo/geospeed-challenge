/**
 * Une y valida los textos de la reseña (bloque R3). Lee las fuentes (<trabajo>/sources/*.json, de
 * scripts/build-story-sources.mjs) y los textos redactados (<trabajo>/out/<tanda>.json: { id: { es: [p1, p2],
 * en: [p1, p2] } }), revisa cada lugar y escribe src/data/stories/<grupo>.json ({ id: [[es1, es2], [en1, en2], wp] })
 * con los que pasan, más docs/R3_Resenas_textos.md (todo para revisar) y <trabajo>/report.json (lo que hay que
 * rehacer y por qué).
 *
 * Se rechaza un lugar si falta, si un párrafo está vacío o fuera de 30–120 palabras, si está en el idioma equivocado,
 * si toca temas que el juego evita (guerra, política, tragedias…), si copia 9 palabras seguidas del artículo o del dato
 * curioso, o si trae un número (año, cantidad) que no está en las fuentes ni en las cifras de la ficha.
 *
 * Uso: node scripts/merge-stories.mjs --work <trabajo>
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const WORK = arg('--work');
if (!WORK) { console.error('Uso: node scripts/merge-stories.mjs --work <trabajo>'); process.exit(1); }
const read = (f) => JSON.parse(readFileSync(f, 'utf8'));

const sources = new Map();
for (const f of readdirSync(join(WORK, 'sources')).filter((f) => f.endsWith('.json'))) for (const it of read(join(WORK, 'sources', f))) sources.set(it.id, it);
const texts = {};
// Las tandas de corrección (fix-*.json: lugares reescritos con una fuente corregida) se aplican al final
const outFiles = existsSync(join(WORK, 'out')) ? readdirSync(join(WORK, 'out')).filter((f) => f.endsWith('.json')) : [];
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

const groupOf = (id) => (id.startsWith('flag:') ? 'flags' : id.startsWith('feat:') ? 'features' : id.startsWith('mon:') ? 'monuments' : id.startsWith('co:') || id.startsWith('div:co-') ? 'colombia' : 'cities');
const groups = ['cities', 'flags', 'features', 'monuments', 'colombia'];
mkdirSync('src/data/stories', { recursive: true });
for (const g of groups) {
  const data = {};
  for (const [id, t] of Object.entries(ok).filter(([id]) => groupOf(id) === g).sort(([a], [b]) => a.localeCompare(b))) {
    data[id] = [[t.es[0].trim(), t.es[1].trim()], [t.en[0].trim(), t.en[1].trim()], sources.get(id).wp ?? null];
  }
  writeFileSync(`src/data/stories/${g}.json`, JSON.stringify(data));
}
writeFileSync(join(WORK, 'report.json'), JSON.stringify(problems, null, 1));

const GROUP_ES = { cities: 'Ciudades del mundo', flags: 'Países', features: 'Lugares geográficos', monuments: 'Monumentos', colombia: 'Pack Colombia' };
let doc = `# Reseña del lugar · R3 · textos (para revisar)

Generado por \`node scripts/merge-stories.mjs\` el ${new Date().toISOString().slice(0, 10)}. Dos párrafos por lugar ("Lo curioso" y
"Para conocer"), escritos con base en el artículo de Wikipedia de cada lugar (resumen y frases de qué ver), revisados
automáticamente (largo, idioma, temas a evitar, frases copiadas, números sin fuente). Aquí va el español; el inglés
está en \`src/data/stories/\`.

| Grupo | Lugares | Con texto |
|---|---|---|
${groups.map((g) => { const all = [...sources.keys()].filter((id) => groupOf(id) === g); return `| ${GROUP_ES[g]} | ${all.length} | ${all.filter((id) => ok[id]).length} |`; }).join('\n')}
`;
for (const g of groups) {
  doc += `\n## ${GROUP_ES[g]}\n`;
  for (const [id, src] of [...sources].filter(([id]) => groupOf(id) === g).sort((a, b) => a[1].name.localeCompare(b[1].name, 'es'))) {
    const t = ok[id];
    doc += t ? `\n**${src.name}**\n\n${t.es[0]}\n\n${t.es[1]}\n` : `\n**${src.name}**: _sin texto todavía_\n`;
  }
}
writeFileSync('docs/R3_Resenas_textos.md', doc);
console.log(`con texto: ${Object.keys(ok).length}/${sources.size} · por rehacer: ${Object.keys(problems).length}`);
const kinds = {};
for (const ws of Object.values(problems)) for (const w of ws) { const k = w.replace(/^(es|en)\d?: /, '').replace(/\(.*$|«.*$|: .*$/, '').trim(); kinds[k] = (kinds[k] ?? 0) + 1; }
console.log(kinds);
