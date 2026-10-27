// Conquista el mapa (fase C2): grupos, invitaciones, temporada, territorios, misiones, puntaje, límites, reservas,
// cierre, insignia, siguiente temporada, baja de cuenta y permisos, sobre toda la cadena de migraciones en Postgres
// embebido (PGlite) con una autenticación simulada. Reloj simulado con el setting conq.now.
// Cada prueba cita el criterio de aceptación de la especificación (CAxx).
//
// Uso: npm run test:conquest-sql   (o node scripts/test-conquest-sql.mjs [carpeta de migraciones])
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const dir = process.argv[2] ?? 'supabase/migrations';
const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth;
  create table auth.users (id uuid primary key, email text, is_anonymous boolean default false, created_at timestamptz default now(), last_sign_in_at timestamptz, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select coalesce(current_setting('request.jwt.claim.role', true), 'anon') $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
  create schema extensions;
  grant usage on schema auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);
for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  try { await db.exec(readFileSync(join(dir, f), 'utf8')); }
  catch (e) { if (f >= '20261017') { console.log('FALLA', f, e.message); process.exit(1); } }
}
console.log('migraciones aplicadas');

const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const [A, B, C, D, E, F, X, ANON, G1, G2] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id);
await db.exec(`insert into auth.users (id, is_anonymous) values ('${A}', false), ('${B}', false), ('${C}', false), ('${D}', false), ('${E}', false),
  ('${F}', false), ('${X}', false), ('${ANON}', true), ('${G1}', false), ('${G2}', false);
  insert into public.profiles (id, display_name) values ('${A}', 'Juanjo'), ('${B}', 'Paola'), ('${C}', 'Gerónimo'), ('${D}', 'Dani'), ('${E}', 'Eli'), ('${F}', 'Fer'), ('${G1}', 'Gaby'), ('${G2}', 'Gus')
  on conflict (id) do update set display_name = excluded.display_name;`);

const q = async (sql, p = []) => (await db.query(sql, p)).rows;
let NOW = new Date('2026-11-02T12:00:00Z').getTime();
const clock = async (ms) => { NOW = typeof ms === 'number' ? ms : NOW; await db.exec(`select set_config('conq.now', '${new Date(NOW).toISOString()}', false)`); };
const tick = async (sec) => { NOW += Math.round(sec * 1000); await clock(); };
await clock();
const as = async (uid, sql, params = []) => {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  try { return (await db.query(sql, params)).rows; } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
};
const one = async (uid, fn, args = []) => (await as(uid, `select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(', ')}) s`, args))[0].s;
const err = async (fn) => { try { await fn(); return 'ok'; } catch (e) { return e.message; } };
let fails = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'OK ' : 'MAL'} ${name}${extra ? ' — ' + extra : ''}`); if (!ok) fails++; };

// ── Puntaje (CA08) ─────────────────────────────────────────────────────────────────────────────────────────
const pts = async (d, t) => (await q(`select public._conq_points($1::numeric, $2::numeric) p`, [d, t]))[0].p;
check('CA08 d=0 t=0 → 1.000', (await pts(0, 0)) === 1000);
check('CA08 d=0 t=7,5 → 750', (await pts(0, 7.5)) === 750);
check('CA08 d=500 t=7,5 → 276', (await pts(500, 7.5)) === 276);
check('CA08 t ≥ 15 → 0', (await pts(0, 15)) === 0 && (await pts(10, 20)) === 0);
check('CA08 sin respuesta → 0', (await pts(null, null)) === 0);

// ── Grupos (CA01–CA03) ─────────────────────────────────────────────────────────────────────────────────────
check('una sesión de invitado no puede crear grupos (CQ-D1)', (await err(() => one(ANON, 'conq_group_create', ['Grupo', null]))).includes('conq_account_required'));
check('nombre de 2 letras se rechaza', (await err(() => one(A, 'conq_group_create', ['Ab', null]))).includes('conq_name_invalid'));
check('nombre ofensivo se rechaza', (await err(() => one(A, 'conq_group_create', ['los hijueputas', null]))).includes('conq_name_invalid'));
let g = await one(A, 'conq_group_create', ['Mi grupo', 'req-1']);
const GID = g.id;
check('crea el grupo: admin adentro, sala de espera, código de 6', g.is_admin && g.members.length === 1 && g.season.status === 'lobby' && /^[A-Z0-9]{6}$/.test(g.invite_code));
check('misma clave de idempotencia devuelve el mismo grupo', (await one(A, 'conq_group_create', ['Mi grupo', 'req-1'])).id === GID);
let code = g.invite_code;
await db.exec(`set role anon`);
const preview = (await db.query(`select public.conq_invite_preview($1) s`, [code]).catch((e) => ({ rows: [{ s: { error: e.message } }] })));
await db.exec(`reset role`);
check('vista previa sin sesión: nombre y cupos, sin integrantes ni actividad', preview.rows?.[0]?.s?.state === 'open' && preview.rows[0].s.members_count === 1 && !('members' in preview.rows[0].s), JSON.stringify(preview.rows?.[0]?.s));
for (const u of [B, C, D, E]) g = await one(u, 'conq_invite_accept', [code]);
check('CA02 cinco integrantes con el creador', g.members.length === 5);
check('CA03 reabrir la invitación no duplica la membresía', (await one(B, 'conq_invite_accept', [code])).members.length === 5);
check('CA02 el sexto recibe grupo completo (nunca 6)', (await err(() => one(F, 'conq_invite_accept', [code]))).includes('conq_group_full') && (await q(`select count(*)::int n from public.conq_members where group_id = $1`, [GID]))[0].n === 5);
check('solo el admin ve el código', (await one(B, 'conq_group_state', [GID])).invite_code === null && (await one(A, 'conq_group_state', [GID])).invite_code === code);
const g2 = await one(A, 'conq_invite_regenerate', [GID]);
check('CA03 código regenerado: el viejo deja de aceptar', g2.invite_code !== code && (await err(() => one(F, 'conq_invite_accept', [code]))).includes('conq_invite_invalid'));
code = g2.invite_code;

// Límite de 3 grupos activos por cuenta
for (let i = 0; i < 3; i++) await one(F, 'conq_group_create', [`Grupo de Fer ${i}`, null]);
check('máximo 3 grupos activos por cuenta', (await err(() => one(F, 'conq_group_create', ['Otro de Fer', null]))).includes('conq_group_limit'));

// CA01: con 1 no se inicia; con 2 sí
const solo = await one(G1, 'conq_group_create', ['Solo Gaby', null]);
check('CA01 con 1 integrante no se habilita el inicio', (await err(() => one(G1, 'conq_season_start', [solo.id]))).includes('conq_not_enough_players'));
await one(G2, 'conq_invite_accept', [solo.invite_code]);
// Catálogo incompleto impide iniciar
await db.exec(`create temp table bank_bk as select * from public.conq_bank where country_iso = 'IT'; delete from public.conq_bank where country_iso = 'IT' and ord > 2;`);
check('un país sin 5 ciudades verificadas impide iniciar', (await err(() => one(G1, 'conq_season_start', [solo.id]))).includes('conq_catalog_incomplete'));
await q(`insert into public.conq_bank select * from bank_bk on conflict do nothing`);
const pair = await one(G1, 'conq_season_start', [solo.id]);
check('CA01 con 2 integrantes inicia', pair.season.status === 'active');

// ── Temporada (CA04, CA05) ─────────────────────────────────────────────────────────────────────────────────
const START = NOW;
g = await one(A, 'conq_season_start', [GID]);
const S = g.season.id;
check('temporada de 7 días exactos', new Date(g.season.ends_at).getTime() - new Date(g.season.started_at).getTime() === 7 * 86400e3);
check('CA04 temporada activa rechaza nuevos miembros', (await err(() => one(F, 'conq_invite_accept', [code]))).includes('conq_season_active'));
check('CA04 temporada activa rechaza expulsiones', (await err(() => one(A, 'conq_member_remove', [GID, B]))).includes('conq_season_active'));
check('CA04 temporada activa: nadie sale ni la reinicia', (await err(() => one(B, 'conq_group_leave', [GID]))).includes('conq_season_active') && (await err(() => one(A, 'conq_season_start', [GID]))).includes('conq_season_active'));
let map = await one(B, 'conq_map', [S]);
check('tablero: 10 países libres, 5 jugadores con su lugar, 5 misiones', map.territories.length === 10 && map.territories.every((t) => !t.owner_id) && map.players.length === 5 && map.me.missions_left === 5);
check('el paquete de cada país tiene 5 ciudades del banco', (await q(`select bool_and(cardinality(place_ids) = 5 and place_ids <@ (select array_agg(place_id) from public.conq_bank b where b.country_iso = k.country_iso)) ok from public.conq_packages k where season_id = $1`, [S]))[0].ok);

// Utilidades de misión
const place = async (pid) => (await q(`select lat, lon from public.places where id = $1`, [pid]))[0];
let CUR = S;
const start = (u, iso, req = null) => one(u, 'conq_attempt_start', [CUR, iso, req]);
const open = (u, aid, idx) => one(u, 'conq_round_open', [aid, idx]);
const answer = (u, aid, idx, lat, lon) => one(u, 'conq_round_answer', [aid, idx, lat, lon]);
/** Juega una misión: times[i] = segundos hasta responder la ronda i (null = no responder: vence a los 15 s); exact = toca el lugar */
async function play(u, iso, times, req = null) {
  let a = await start(u, iso, req);
  for (let i = 1; i <= 5; i++) {
    a = await open(u, a.id, i);
    const r = a.rounds[i - 1];
    if (times[i - 1] == null) { await tick(15.5); a = await one(u, 'conq_attempt_state', [a.id]); continue; }
    await tick(times[i - 1]);
    const p = await place(r.place_id);
    a = await answer(u, a.id, i, p.lat, p.lon);
    await tick(1);
  }
  return a;
}

// CA05: mismas ciudades y orden para todos
let a1 = await start(B, 'PE'); a1 = await open(B, a1.id, 1);
check('el lugar se conoce al abrir la ronda y la ubicación correcta solo al cerrarla', a1.rounds[0].place_id && !a1.rounds[0].correct && !a1.rounds[1].place_id);
const pkg = (await q(`select place_ids from public.conq_packages where season_id = $1 and country_iso = 'PE'`, [S]))[0].place_ids;
check('CA05 la ronda 1 es la primera ciudad del paquete del país', a1.rounds[0].place_id === pkg[0]);
// CA10: otro atacante sobre el mismo país mientras está reservado
const before = (await one(C, 'conq_map', [S])).me.missions_left;
check('CA10 el segundo atacante ve disputa en curso', (await err(() => start(C, 'PE'))).includes('conq_reserved'));
check('CA10 y no pierde misión', (await one(C, 'conq_map', [S])).me.missions_left === before);
const terr = await one(C, 'conq_territory', [S, 'PE']);
check('CA26 la ficha muestra la reserva de 3 minutos', terr.reason === 'reserved' && new Date(terr.reserved_until).getTime() - NOW <= 180e3 && new Date(terr.reserved_until).getTime() > NOW);
// CA12: reabrir no reinicia el reloj; estado recupera el mismo intento
await tick(4);
const again = await open(B, a1.id, 1);
check('CA12 reabrir la ronda no reinicia el reloj', again.rounds[0].opened_at === a1.rounds[0].opened_at);
check('CA12 una segunda pestaña recupera el mismo intento', (await one(B, 'conq_attempt_state', [a1.id])).id === a1.id);
check('un intento activo por jugador', (await err(() => start(B, 'CO'))).includes('conq_attempt_active'));
// Ronda vencida: 0 y se continúa
await tick(12);
let st = await one(B, 'conq_attempt_state', [a1.id]);
check('CA08 vencer una ronda da 0 y deja seguir', st.rounds[0].closed && st.rounds[0].answer.points === 0 && st.status === 'active');
st = await open(B, a1.id, 2);
const p2 = await place(st.rounds[1].place_id);
await tick(0.5);
const ans = await answer(B, a1.id, 2, p2.lat, p2.lon);
const ans2 = await answer(B, a1.id, 2, p2.lat + 5, p2.lon + 5);
check('CA11 reenviar la respuesta no cambia los puntos', ans.rounds[1].answer.points === 983 && ans2.rounds[1].answer.points === 983 && ans2.total === ans.total, `${ans.rounds[1].answer.points}`);
check('coordenada inválida se rechaza', (await err(() => answer(B, a1.id, 3, 95, 0))).includes('conq_coord_invalid'));
// CA13: abandono
const ab = await one(B, 'conq_attempt_abandon', [a1.id]);
map = await one(B, 'conq_map', [S]);
check('CA13 abandono: no conquista, consume la misión y libera el país', ab.status === 'abandoned' && !map.territories.find((t) => t.iso === 'PE').owner_id && !map.territories.find((t) => t.iso === 'PE').reserved_until && map.me.missions_left === 4);

// ── Captura (CA06) ─────────────────────────────────────────────────────────────────────────────────────────
// d = 0: puntos = redondear(1.000 × (1 − t/30)) → 1.000 (t=0) y 999 (t=0,03)
let r1 = await play(C, 'CO', [0, 0.03, null, null, null]);
check('CA06 misión completa con 1.999 deja el país libre', r1.status === 'completed' && r1.outcome === 'failed' && r1.total === 1999 && !r1.territory.owner_id, `${r1.total} ${r1.outcome}`);
await tick(3601);
r1 = await play(C, 'CO', [0, 0, null, null, null]);
check('CA06 con 2.000 captura y la marca guardada coincide', r1.outcome === 'captured' && r1.total === 2000 && r1.territory.owner_id === C && r1.territory.defense === 2000);
check('no se ataca un país propio', (await err(() => start(C, 'CO'))).includes('conq_own_territory'));

// ── Ataque (CA07) ──────────────────────────────────────────────────────────────────────────────────────────
await q(`update public.conq_territories set defense = 3420 where season_id = $1 and country_iso = 'CO'`, [S]);
// 1.000 ×2 + 840 (t=4,8) + 579 (t=12,63) + 0 (vence) = 3.419 · con 580 (t=12,6) = 3.420 · 1.000 ×3 + 780 (t=6,6) + 0 (tarde) = 3.780
let r2 = await play(D, 'CO', [0, 0, 4.8, 12.63, null]);
check('CA07 defensa 3.420: el atacante con 3.419 pierde', r2.outcome === 'defended' && r2.total === 3419 && r2.territory.owner_id === C && r2.territory.defense === 3420, `${r2.total}`);
await tick(3601);
r2 = await play(D, 'CO', [0, 0, 4.8, 12.6, null]);
check('CA07 con 3.420 empata y conserva el dueño', r2.outcome === 'tie' && r2.total === 3420 && r2.territory.owner_id === C);
r2 = await play(E, 'CO', [0, 0, 0, 6.6, 15.2]);
check('CA07 con 3.780 conquista y la nueva defensa es 3.780', r2.outcome === 'conquered' && r2.total === 3780 && r2.territory.owner_id === E && r2.territory.defense === 3780, `${r2.total} ${r2.outcome}`);
check('CA11 finalizar otra vez no duplica dueño ni evento', (await answer(E, r2.id, 5, 0, 0)).territory.owner_id === E && (await q(`select count(*)::int n from public.conq_events where attempt_id = $1`, [r2.id]))[0].n === 1);
const act = await one(C, 'conq_activity', [S, false, null, 30]);
check('actividad: Gerónimo ve que perdió Colombia y puede recuperarla', act.events.some((e) => e.type === 'conquered' && e.prev_owner === C && e.can_recover));
check('lo privado (captura fallida) solo lo ve quien jugó', act.events.some((e) => e.type === 'failed') && !(await one(D, 'conq_activity', [S, false, null, 30])).events.some((e) => e.type === 'failed'));
check('recuperar: la ficha de Gerónimo dice recuperar', (await one(C, 'conq_territory', [S, 'CO'])).kind === 'recover');

// ── Límites (CA09, CA23) ───────────────────────────────────────────────────────────────────────────────────
const quick = async (u, iso) => { const a = await start(u, iso); await open(u, a.id, 1); return one(u, 'conq_attempt_abandon', [a.id]); };
// Día nuevo para Paola (B), que ya usó 1: día 1 empieza a las 12:00 del 3-nov
await clock(START + 86400e3 + 60e3);
await quick(B, 'MX'); await quick(B, 'BR'); await tick(10);
check('CA09 segunda sobre el mismo país antes de 1 h: espera', (await err(() => start(B, 'MX'))).includes('conq_cooldown'));
await tick(3600);
await quick(B, 'MX');
await tick(3601);
check('CA09 tercera sobre el mismo país en el día: rechazada', (await err(() => start(B, 'MX'))).includes('conq_country_limit'));
await quick(B, 'ES'); await quick(B, 'FR');
check('CA09 sexta misión del día: rechazada', (await err(() => start(B, 'IT'))).includes('conq_daily_limit'));
const tb = await one(B, 'conq_territory', [S, 'IT']);
check('la ficha explica por qué está bloqueado y cuándo renueva', tb.reason === 'daily_limit' && tb.me.missions_left === 0 && tb.me.next_reset_at);
// CA23: frontera común de 24 h, sin acumular, y la espera de 1 h cruza el día
await clock(START + 2 * 86400e3 - 20 * 60e3); // 11:40 del día 1
await quick(G1, 'AR').catch(() => {}); // Gaby no está en este grupo (otra temporada): se ignora
const dAtt = await start(D, 'CL'); await open(D, dAtt.id, 1); await one(D, 'conq_attempt_abandon', [dAtt.id]);
await clock(START + 2 * 86400e3 + 10 * 60e3); // 12:10 del día 2 (30 min después)
check('CA23 la espera de 1 h sigue aunque cambie el día', (await err(() => start(D, 'CL'))).includes('conq_cooldown'));
check('CA23 el cupo se renueva para todos en la misma frontera, sin acumular', (await one(B, 'conq_map', [S])).me.missions_left === 5 && (await one(D, 'conq_map', [S])).me.missions_left === 5);
// Misión que cruza la frontera: cuenta para el día en que empezó
await clock(START + 3 * 86400e3 - 30e3);
const cross = await start(C, 'AR'); await open(C, cross.id, 1);
await clock(START + 3 * 86400e3 + 10e3);
await one(C, 'conq_attempt_abandon', [cross.id]);
check('CA23 una misión que cruza la frontera cuenta para el día de inicio', (await one(C, 'conq_map', [S])).me.missions_left === 5);

// CA13: reserva vencida y CA26: se libera sin transferir · intento nulo
const ex = await start(D, 'EC'); await open(D, ex.id, 1); await tick(200);
const exs = await one(D, 'conq_attempt_state', [ex.id]);
map = await one(D, 'conq_map', [S]);
check('CA13/CA26 reserva vencida: expirado, no conquista, consume y libera', exs.status === 'expired' && !map.territories.find((t) => t.iso === 'EC').owner_id && !map.territories.find((t) => t.iso === 'EC').reserved_until && map.me.missions_left === 4);
await tick(3601);
const vd = await start(D, 'EC'); await tick(31);
const vds = await one(D, 'conq_attempt_state', [vd.id]);
check('falla antes de la primera pregunta: no consume misión ni activa la espera', vds.status === 'void' && (await one(D, 'conq_map', [S])).me.missions_left === 4 && (await one(D, 'conq_territory', [S, 'EC'])).can_start);

// Práctica fuera del paquete oficial
const pr = await one(B, 'conq_practice_set', [S, 'PE']);
check('práctica: 5 ciudades del país fuera del paquete oficial', pr.length === 5 && pr.every((c) => !pkg.includes(c.id) && c.lat != null));

// ── Permisos (CA18) ────────────────────────────────────────────────────────────────────────────────────────
check('CA18 un usuario ajeno no consulta el tablero ni la actividad', (await err(() => one(X, 'conq_map', [S]))).includes('conq_not_member') && (await err(() => one(X, 'conq_activity', [S, false, null, 30]))).includes('conq_not_member'));
check('CA18 ni el intento de otro', (await err(() => one(X, 'conq_attempt_state', [r2.id]))).includes('conq_attempt_unavailable') && (await err(() => one(B, 'conq_attempt_state', [r2.id]))).includes('conq_attempt_unavailable'));
check('CA18 ni los paquetes ni las tablas', (await err(() => as(B, `select * from public.conq_packages`))).includes('permission denied') && (await err(() => as(B, `select * from public.conq_attempts`))).includes('permission denied'));
check('CA18 ni la práctica ni la ficha de otro grupo', (await err(() => one(X, 'conq_practice_set', [S, 'PE']))).includes('conq_not_member'));
check('el cliente no puede llamar las funciones internas', (await err(() => as(B, `select public._conq_close($1)`, [S]))).includes('permission denied'));
check('silenciar el grupo', (await one(C, 'conq_mute', [GID, true])).muted === true);

// ── Cierre (CA14–CA17) ─────────────────────────────────────────────────────────────────────────────────────
const ENDS = START + 7 * 86400e3;
// Paola captura Perú (2.000) y Dani Chile (2.000): Eli tiene Colombia (3.780)
await clock(ENDS - 2 * 3600e3);
await play(B, 'PE', [0, 0, null, null, null]);
await play(D, 'CL', [0, 0, null, null, null]);
await clock(ENDS - 120e3);
check('CA14 no se inicia en los últimos 3 minutos', (await err(() => start(C, 'IT'))).includes('conq_season_ending'));
// Intento abierto justo antes del bloqueo: su reserva termina, a más tardar, en el cierre
await clock(ENDS - 180.5e3);
const late = await start(C, 'IT');
check('el intento cerca del cierre vence a más tardar en ends_at', new Date(late.expires_at).getTime() <= ENDS);
await open(C, late.id, 1);
await clock(ENDS + 5e3);
const pl = await place((await one(C, 'conq_attempt_state', [late.id])).rounds[0].place_id ?? pkg[0]).catch(() => null);
const lateAns = await answer(C, late.id, 2, 0, 0).catch((e) => ({ error: e.message }));
map = await one(A, 'conq_map', [S]);
check('CA14 resultado tardío no modifica la instantánea final', map.final && !map.territories.find((t) => t.iso === 'IT').owner_id);
const st1 = await one(A, 'conq_standings', [S]);
check('CA15 empate por países usa la suma de defensas', st1.standings[0].user_id === E && st1.standings[0].rank === 1 && st1.standings[1].rank === 2 && st1.standings[2].rank === 2, JSON.stringify(st1.standings.map((x) => [x.name, x.territories, x.defense_sum, x.rank])));
check('CA15 empate total comparte puesto', st1.standings[1].territories === st1.standings[2].territories && st1.standings[1].defense_sum === st1.standings[2].defense_sum);
check('CA15 a cero territorios no hay insignia', st1.awards.length === 1 && st1.awards[0].user_id === E);
await q(`select public._conq_close($1)`, [S]);
await q(`select public.conq_close_due()`);
check('CA16 cierre dos veces: una instantánea y una recompensa', (await q(`select count(*)::int n from public.conq_closes where season_id = $1`, [S]))[0].n === 1 && (await q(`select count(*)::int n from public.conq_awards where season_id = $1`, [S]))[0].n === 1 && (await q(`select count(*)::int n from public.user_badges where badge_id = 'conq_champion'`))[0].n === 1);
check('CA17 tablero y clasificación muestran el mismo dueño y puesto con la misma versión', JSON.stringify(map.standings) === JSON.stringify(st1.standings) && map.data_version === st1.data_version);
check('el campeón puede activar el título Conquistador', (await err(() => as(E, `select public.set_active_cosmetics('conquistador', null)`))) === 'ok');

// ── Siguiente temporada (CA22) ─────────────────────────────────────────────────────────────────────────────
g = await one(A, 'conq_group_state', [GID]);
check('CA22 la siguiente vuelve a sala y pide confirmación', g.season.number === 2 && g.season.status === 'lobby' && g.members.filter((m) => m.confirmed).length === 1 && g.last_closed.champions[0] === 'Eli');
check('CA22 con solo el admin confirmado no inicia', (await err(() => one(A, 'conq_season_start', [GID]))).includes('conq_not_enough_players'));
await one(B, 'conq_confirm', [GID, true]); await one(C, 'conq_confirm', [GID, true]);
// Entre temporadas: el admin puede ajustar integrantes
g = await one(A, 'conq_member_remove', [GID, D]);
check('entre temporadas el admin quita un integrante', g.members.length === 4);
await clock(ENDS + 3600e3);
g = await one(A, 'conq_season_start', [GID]);
const S2 = g.season.id;
CUR = S2;
const m2 = await one(B, 'conq_map', [S2]);
const pk2 = (await q(`select place_ids from public.conq_packages where season_id = $1 and country_iso = 'PE'`, [S2]))[0].place_ids;
check('CA22 nueva temporada: países libres, cupos nuevos, otra plantilla', m2.territories.every((t) => !t.owner_id) && m2.me.missions_left === 5 && m2.players.length === 3);
check('CA22 preguntas nuevas: el paquete cambia', pk2.join() !== pkg.join() && pk2.filter((x) => pkg.includes(x)).length <= 2, `${pk2.filter((x) => pkg.includes(x)).length} repetidas`);
check('CA22 el historial anterior se conserva', (await one(A, 'conq_standings', [S2])).history.length === 1 && (await one(A, 'conq_map', [S])).final);

// ── Baja de cuenta (CA25) ──────────────────────────────────────────────────────────────────────────────────
await play(B, 'BR', [0, 0, 0, null, null]);
await q(`delete from auth.users where id = $1`, [A]);
g = await one(B, 'conq_group_state', [GID]);
check('CA25 la baja del admin transfiere el rol al más antiguo', g.is_admin && g.members.length === 3 && g.members.find((m) => m.role === 'admin').user_id === B, JSON.stringify(g.members.map((m) => [m.name, m.role])));
const m3 = await one(C, 'conq_map', [S2]);
check('CA25 la temporada sigue; la baja anonimiza el nombre en la plantilla', m3.season.status === 'active' && m3.players.find((p) => p.user_id === A).name === null);
await q(`delete from auth.users where id = $1`, [B]);
const m4 = await one(C, 'conq_map', [S2]);
const br = m4.territories.find((t) => t.iso === 'BR');
check('CA25 el país de una cuenta borrada conserva su marca y no suma para nadie', !br.owner_id && br.retired && br.defense === 3000 && m4.standings.every((x) => x.territories === 0));
const rr = await play(C, 'BR', [0, 0, 0.03, null, null]);
check('para quitarlo hay que superar su marca', rr.outcome === 'defended' && rr.total === 2999, `${rr.total} ${rr.outcome}`);

// ── Reloj de QA ────────────────────────────────────────────────────────────────────────────────────────────
const qa = await one(G1, 'conq_group_create', ['Grupo QA', null]);
await one(G2, 'conq_invite_accept', [qa.invite_code]);
await q(`update public.conq_groups set qa_time_scale = 144 where id = $1`, [qa.id]);
const qs = await one(G1, 'conq_season_start', [qa.id]);
check('QA: con time_scale 144 la temporada dura 70 minutos', new Date(qs.season.ends_at).getTime() - new Date(qs.season.started_at).getTime() === 70 * 60e3);
check('el cliente no puede fijar time_scale', (await err(() => as(G1, `update public.conq_groups set qa_time_scale = 1000`))).includes('permission denied'));

console.log(fails ? `\n${fails} FALLAS` : '\nTodo OK');
process.exit(fails ? 1 : 0);
