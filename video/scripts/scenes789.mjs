// Material real de las escenas 7 y 8 del video. Uso (desde la raíz): node video/scripts/scenes789.mjs reto|sala|resena
//  reto   → video/rec/reto/ (carrera contra el rival, rondas 1 y 2 en video) + video/public/screens/reto-resultado.png
//  sala   → video/public/screens/sala-tv.png (pantalla para proyectar de una sala con 20 jugadores)
//  resena → video/public/screens/resena.png ("Conoce Katmandú")
// reto y sala usan el build con simuladores (ver lib.mjs): el rival y los jugadores de la sala son simulados.
import { join } from 'node:path';
import { session, sleep, READ_PROMPT, ROOT } from './lib.mjs';

const DEV = 'video/rec/dist-dev';
const SCREENS = join(ROOT, 'video/public/screens');
const NEXT = '/^(SIGUIENTE|NEXT)/i';
const what = process.argv[2];
const EN = process.env.LOCALE === 'en';
const SUF = EN ? '-en' : '';   // LOCALE=en graba la versión en inglés (archivos con sufijo -en)

async function playRound(s, round, { think = 850, hold = 500, last = null } = {}) {
  const prompt = await s.waitFor(`(() => { const v = ${READ_PROMPT}; return v && v.title !== ${JSON.stringify(last)} ? v : null; })()`);
  s.mark('prompt', { round, title: prompt.title });
  if (typeof think === 'function') await think(); else await sleep(think);
  await s.answer(prompt);
  s.mark('tap', { round });
  await s.waitText(NEXT, 15000);
  s.mark('card', { round });
  await sleep(hold);
  return prompt.title;
}

if (what === 'reto') {
  const s = await session({ dist: DEV, forceScale: true, storage: { geospeed_mock_challenges: '1', geospeed_pending_display_name: 'JuanJo' } });
  await s.goto('/');
  await s.waitFor(`typeof window.__mockIncomingRematch === 'function'`, 40000);
  await s.waitText('/^(JUGAR AHORA|PLAY NOW)$/i', 40000);
  const code = await s.evaluate(`window.__mockIncomingRematch('world', 'basic')`);
  // Valentina ya jugó: su partida, con tiempos y distancias creíbles (el simulador las pone al azar)
  const info = await s.evaluate(`(() => {
    const KEY = 'geospeed_mock_challenges_db';
    let db = JSON.parse(localStorage.getItem(KEY));
    const id = Object.keys(db).find(k => db[k].ch.code === ${JSON.stringify(code)});
    window.__mockRivalFinish(id, 20000);
    db = JSON.parse(localStorage.getItem(KEY));
    const times = [3.1, 2.4, 4.2, 3.0, 5.1, 2.8, 3.6, 4.4, 2.9, 3.3, 6.0, 3.8, 2.7];
    const offs = [1.6, 0.9, 3.5, 1.2, 6.0, 0.7, 2.2, 4.1, 1.0, 1.8, 9.0, 2.6, 0.8];
    let total = 0;
    db[id].rival.result.rounds = db[id].rival.result.rounds.map((r, i) => {
      const lat = r.city_lat + offs[i] * 0.6, lon = r.city_lon - offs[i] * 0.8;
      const km = Math.round(111 * Math.hypot(lat - r.city_lat, (lon - r.city_lon) * Math.cos(r.city_lat * Math.PI / 180)));
      const pts = Math.round(1000 * Math.exp(-km / 1500) * (2.2 - 0.13 * times[i]));
      total += pts;
      return { ...r, click_lat: lat, click_lon: lon, distance_km: km, time_s: times[i], points: pts };
    });
    db[id].rival.result.score = total;
    localStorage.setItem(KEY, JSON.stringify(db));
    return { id, total, cities: db[id].ch.cities.map(c => c.name) };
  })()`);
  console.log('reto', code, 'rival', info.total, info.cities.join(', '));
  await s.goto('/reto/' + code);
  await s.waitText('/ACEPTAR|ACCEPT/i', 30000);
  await sleep(1200);
  await s.shot(join(SCREENS, 'reto-invitacion' + SUF + '.png'));
  await s.startRecording(join(ROOT, 'video/rec/reto' + SUF));
  s.mark('start');
  await s.clickText('/ACEPTAR|ACCEPT/i');
  let last = null;
  for (let round = 1; round <= 13; round++) {
    // Ronda 1: espero a que salga el aviso de que Valentina ya respondió, y respondo un poco después
    const think = round === 1
      ? async () => { await s.waitFor(`/ya respondió|answered ·/.test(document.body.innerText)`, 12000).catch(() => {}); s.mark('pulse'); await sleep(900); }
      : 850;
    last = await playRound(s, round, { think, hold: round <= 2 ? 2800 : 450, last });
    if (round <= 2) console.log('  marcador ronda', round, await s.evaluate(`document.querySelector('[data-game-container]').innerText.split(String.fromCharCode(10)).join(' | ').slice(0, 260)`));
    if (round === 2) { s.pauseRecording(); console.log('  (rondas 1 y 2 grabadas; juego el resto sin grabar)'); }
    await s.clickText(NEXT);
  }
  // Pasa a la pantalla del resultado del reto ("Guardando tu partida…" y luego la comparación)
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    const t = await s.evaluate(`document.body.innerText`);
    if (/COMPARACI|REVANCHA|CREAR OTRO RETO|COMPARISON|REMATCH|ANOTHER CHALLENGE/i.test(t)) break;
    if (await s.hasText(NEXT)) await s.clickText(NEXT);
  }
  await sleep(3500);
  await s.shot(join(SCREENS, 'reto-resultado' + SUF + '.png'));
  console.log(await s.evaluate(`[...document.querySelectorAll('button')].filter(b => b.offsetParent !== null).map(b => (b.innerText || '').trim().split(String.fromCharCode(10)).join(' ')).join(' | ').slice(0, 400)`));
  await s.stopRecording();
  for (const e of s.events) console.log(e.t.toFixed(2), e.type, e.round || '', e.title || '');
  await s.close();
} else if (what === 'sala') {
  const s = await session({ dist: DEV, width: 1920, height: 1080, scale: 1, mobile: false, storage: { geospeed_mock_rooms: '1' } });
  await s.goto('/sala/000000/tv');
  await s.waitFor(`typeof window.__mockRoomHosted === 'function'`, 40000);
  const pin = await s.evaluate(`window.__mockRoomHosted(20)`);
  console.log('sala', pin);
  await s.goto('/sala/' + pin + '/tv');
  await sleep(5000);
  await s.shot(join(SCREENS, 'sala-tv' + SUF + '.png'));
  await s.close();
} else if (what === 'resena') {
  const s = await session({ dist: 'dist', forceScale: true });
  await s.goto('/?ch=1012&d=easy&m=world');
  await playRound(s, 1, { think: 1500, hold: 1200 });
  await s.clickText(EN ? '/(^| )More( |›|$)|More about/i' : '/Ver más/i');
  await sleep(6000);
  await s.shot(join(SCREENS, 'resena' + SUF + '.png'));
  await s.close();
} else {
  console.log('uso: node video/scripts/scenes789.mjs reto|sala|resena');
}
process.exit(0);
