// Arma las imágenes de la ficha de Google Play a partir de las capturas reales (raw/<idioma>/*.png):
// 8 capturas de 1920×1080 (título + captura dentro de un teléfono) y la imagen destacada de 1024×500.
// Uso: node scripts/store-shots/compose.mjs es|en   (después de capture.mjs; luego export.py)
import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch, openPage, sleep } from './cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LOCALE = process.argv[2] === 'en' ? 'en' : 'es';
const REPO = resolve(here, '../..');
const RAW = join(here, 'raw', LOCALE);
const OUT = join(here, 'final', LOCALE);
mkdirSync(OUT, { recursive: true });
const url = (p) => pathToFileURL(p).href;
const FONT = (w) => url(`${REPO}/node_modules/@fontsource/poppins/files/poppins-latin-${w}-normal.woff2`);
const FREDOKA = url(`${REPO}/node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff2`);

// [archivo de salida, captura, orientación, título (lo que va entre * se pinta amarillo), subtítulo]
const SHOTS = {
  es: [
    ['01', '01-pregunta', 'land', 'Toca el mapa. *Rápido y preciso.*', 'Más de 250 ciudades del mundo'],
    ['02', '02-respuesta', 'land', 'Cada respuesta *suma puntos*', 'Cercanía × velocidad × combo'],
    ['03', '03-categorias', 'port', 'Ciudades, banderas, *lugares y monumentos*', 'Elige qué quieres ubicar en el mapa'],
    ['04', '04b-bandera-respuesta', 'land', '¿De qué país es *esta bandera?*', '166 banderas para dominar'],
    ['05', '05-colombia', 'land', 'Pack Colombia *gratis*', 'Departamentos, municipios y lugares de tu país'],
    ['06', '06-diario', 'port', 'Un desafío *nuevo cada día*', 'Las mismas ciudades para todos. ¿Quién hace más puntos?'],
    ['07', '07-amigos', 'port', 'Reta a tus *amigos*', 'Uno contra uno o en sala en vivo con hasta 20 jugadores'],
    ['08', '08-resena', 'land', 'Aprende algo de *cada lugar*', 'Fotos, datos y curiosidades de cada sitio'],
  ],
  en: [
    ['01', '01-pregunta', 'land', 'Tap the map. *Fast and accurate.*', '250+ cities around the world'],
    ['02', '02-respuesta', 'land', 'Every answer *scores points*', 'Closeness × speed × combo'],
    ['03', '03-categorias', 'port', 'Cities, flags, *places and landmarks*', 'Choose what you want to find on the map'],
    ['04', '04b-bandera-respuesta', 'land', 'Whose flag *is this?*', '166 flags to master'],
    ['05', '05-colombia', 'land', 'Free *Colombia pack*', 'Departments, towns and places of Colombia'],
    ['06', '06-diario', 'port', 'A new challenge *every day*', 'Same cities for everyone. Who scores more?'],
    ['07', '07-amigos', 'port', 'Challenge your *friends*', 'One-on-one or live rooms with up to 20 players'],
    ['08', '08-resena', 'land', 'Learn something about *every place*', 'Photos, facts and fun stories'],
  ],
}[LOCALE];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const title = (s) => esc(s).replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>');

const BASE_CSS = `
@font-face { font-family: P; font-weight: 500; src: url('${FONT(500)}'); }
@font-face { font-family: P; font-weight: 700; src: url('${FONT(700)}'); }
@font-face { font-family: P; font-weight: 800; src: url('${FONT(800)}'); }
@font-face { font-family: F; font-weight: 700; src: url('${FREDOKA}'); }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; overflow: hidden; }
body { font-family: P, sans-serif; color: #F4F7FB; background: #071426; }
.bg { position: absolute; inset: 0;
  background: radial-gradient(1200px 700px at 50% -10%, #17406f 0%, rgba(23,64,111,0) 70%),
              radial-gradient(900px 600px at 100% 110%, rgba(25,230,210,.18) 0%, rgba(25,230,210,0) 60%),
              radial-gradient(800px 600px at -10% 100%, rgba(255,217,59,.10) 0%, rgba(255,217,59,0) 60%),
              linear-gradient(180deg, #0B1F3A 0%, #071426 100%); }
.hl { color: #FFD93B; }
.phone { position: absolute; background: #04090f; border: 3px solid #2a4a72; box-shadow: 0 30px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04) inset, 0 0 60px rgba(25,230,210,.18); }
.phone img { display: block; width: 100%; height: 100%; object-fit: cover; }
.brand { position: absolute; display: flex; align-items: center; gap: 14px; }
.brand img { width: 54px; height: auto; }
.wm { font-family: F, P, sans-serif; font-weight: 700; font-size: 40px; letter-spacing: .005em; line-height: 1; }
.wm .g { background: linear-gradient(180deg, #F4F7FB 0%, #F4F7FB 48%, #c3cfe0 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.wm .s { background: linear-gradient(180deg, #8ffcff 0%, #19E6D2 52%, #0ea69a 100%); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 0 7px rgba(25,230,210,.45)); }
`;

const brand = (x, y) => `<div class="brand" style="left:${x}px; top:${y}px"><img src="${url(REPO + '/public/mascot/explorer-logo.webp')}"><span class="wm"><span class="g">GEO</span><span class="s">SPEED</span></span></div>`;

function landHtml(raw, t, sub) {
  // Pantalla 1688×780 (2,164:1) dentro de un teléfono horizontal bajo el título
  const sw = 1580, sh = Math.round(sw / (1688 / 780)), bez = 18;
  const ow = sw + bez * 2, oh = sh + bez * 2, left = (1920 - ow) / 2, top = 1080 - oh - 40;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
    .cap { position: absolute; left: 0; right: 0; top: 56px; text-align: center; }
    .cap h1 { font-weight: 800; font-size: 66px; line-height: 1.08; letter-spacing: -.01em; text-wrap: balance; }
    .cap p { margin-top: 16px; font-weight: 500; font-size: 32px; color: #8DCDF5; }
  </style></head><body><div class="bg"></div>
    ${brand(56, 44)}
    <div class="cap"><h1>${title(t)}</h1><p>${esc(sub)}</p></div>
    <div class="phone" style="left:${left}px; top:${top}px; width:${ow}px; height:${oh}px; border-radius:58px; padding:${bez}px">
      <img src="${url(raw)}" style="border-radius:40px">
    </div>
  </body></html>`;
}

function portHtml(raw, t, sub) {
  // Pantalla 1170×2532 dentro de un teléfono vertical a la derecha; título a la izquierda
  const sh = 960, sw = Math.round(sh * (1170 / 2532)), bez = 14;
  const ow = sw + bez * 2, oh = sh + bez * 2, left = 1920 - ow - 190, top = (1080 - oh) / 2;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
    .cap { position: absolute; left: 150px; width: 980px; top: 50%; transform: translateY(-50%); }
    .cap h1 { font-weight: 800; font-size: 84px; line-height: 1.05; letter-spacing: -.015em; text-wrap: balance; }
    .cap p { margin-top: 28px; font-weight: 500; font-size: 36px; line-height: 1.35; color: #8DCDF5; max-width: 860px; text-wrap: balance; }
  </style></head><body><div class="bg"></div>
    ${brand(56, 44)}
    <div class="cap"><h1>${title(t)}</h1><p>${esc(sub)}</p></div>
    <div class="phone" style="left:${left}px; top:${top}px; width:${ow}px; height:${oh}px; border-radius:62px; padding:${bez}px">
      <img src="${url(raw)}" style="border-radius:48px">
    </div>
  </body></html>`;
}

function featureHtml() {
  const tag = LOCALE === 'es' ? '¿Cuánto conoces <span class="hl">el mundo?</span>' : 'How well do you know <span class="hl">the world?</span>';
  const chips = LOCALE === 'es' ? ['250+ ciudades', 'Banderas', 'Desafío diario', 'Retos con amigos'] : ['250+ cities', 'Flags', 'Daily challenge', 'Friend challenges'];
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
    .map { position: absolute; inset: 0; background: url('${url(join(RAW, '01-pregunta.png'))}') no-repeat; background-size: 1592px auto; background-position: -284px -141px; opacity: .42; filter: saturate(1.1); }
    .shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(7,20,38,.97) 0%, rgba(7,20,38,.86) 46%, rgba(7,20,38,.25) 78%, rgba(7,20,38,.55) 100%), linear-gradient(0deg, rgba(7,20,38,.6), rgba(7,20,38,0) 40%); }
    .left { position: absolute; left: 56px; top: 64px; width: 600px; }
    .logo { display: flex; align-items: center; gap: 16px; }
    .logo img { width: 92px; }
    .logo .wm { font-size: 76px; }
    .pill { display: inline-block; margin: 14px 0 0 108px; padding: 5px 16px; border: 2px solid #19E6D2; border-radius: 999px; font-weight: 800; font-size: 19px; letter-spacing: .22em; color: #19E6D2; background: rgba(7,20,38,.7); }
    h1 { margin-top: 34px; font-weight: 800; font-size: 44px; line-height: 1.12; letter-spacing: -.01em; }
    .chips { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
    .chips span { padding: 6px 14px; border-radius: 999px; background: rgba(18,43,77,.9); border: 1px solid rgba(141,205,245,.35); font-weight: 700; font-size: 17px; color: #F4F7FB; }
    .halo { position: absolute; right: 44px; top: 50px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(25,230,210,.45) 0%, rgba(25,230,210,.12) 45%, rgba(25,230,210,0) 70%); }
    .mascot { position: absolute; right: 96px; top: 40px; height: 420px; filter: drop-shadow(0 18px 30px rgba(0,0,0,.45)); }
  </style></head><body><div class="bg"></div><div class="map"></div><div class="shade"></div>
    <div class="halo"></div>
    <img class="mascot" src="${url(REPO + '/public/mascot/poses/cheer.webp')}">
    <div class="left">
      <div class="logo"><img src="${url(REPO + '/store-listing/explorador-frontal-pin.png')}"><span class="wm"><span class="g">GEO</span><span class="s">SPEED</span></span></div>
      <span class="pill">CHALLENGE</span>
      <h1>${tag}</h1>
      <div class="chips">${chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
    </div>
  </body></html>`;
}

const b = await launch({ profileRoot: here });
try {
  const render = async (html, name, width, height) => {
    const file = join(here, `tmp-${name}.html`);
    writeFileSync(file, html);
    const p = await openPage(b, { width, height, scale: 1, fresh: false });
    await p.navigate(url(file));
    await sleep(1200);
    await p.evaluate(`document.fonts.ready.then(() => true)`);
    await sleep(300);
    // PNG de 24 bits sin transparencia (Play no acepta canal alfa en la imagen destacada)
    writeFileSync(join(OUT, name + '.png'), await p.screenshot());
    await p.close();
    console.log('  ✓', name);
  };
  for (const [n, raw, kind, t, sub] of SHOTS) {
    const file = join(RAW, raw + '.png');
    if (!existsSync(file)) { console.log('  ✗ falta', raw); continue; }
    await render(kind === 'land' ? landHtml(file, t, sub) : portHtml(file, t, sub), `captura-${n}`, 1920, 1080);
  }
  await render(featureHtml(), 'imagen-destacada-1024x500', 1024, 500);
} finally {
  await b.close();
}
