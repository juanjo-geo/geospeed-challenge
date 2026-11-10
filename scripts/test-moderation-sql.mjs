// Filtro de nombres y reportes de contenido sobre toda la cadena de migraciones en Postgres embebido (PGlite).
// Uso: npm run test:moderation-sql
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const dir = 'supabase/migrations';
const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth;
  create table auth.users (id uuid primary key, email text, is_anonymous boolean default false, created_at timestamptz default now(), last_sign_in_at timestamptz, banned_until timestamptz, raw_user_meta_data jsonb default '{}'::jsonb);
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
await db.exec(readFileSync(join(dir, '20261112120000_moderacion.sql'), 'utf8')); // se puede aplicar dos veces

const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const [A, B, C] = [1, 2, 3].map(id);
await db.exec(`insert into auth.users (id) values ('${A}'), ('${B}'), ('${C}');
  insert into public.profiles (id, display_name) values ('${A}', 'Ana'), ('${B}', 'Beto'), ('${C}', 'Caro') on conflict (id) do update set display_name = excluded.display_name;`);

const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const as = async (uid, sql, params = []) => {
  await db.exec(`set role ${uid ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
  try { return (await db.query(sql, params)).rows; } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
};
const err = async (fn) => { try { await fn(); return 'ok'; } catch (e) { return e.message; } };
let fails = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'OK ' : 'MAL'} ${name}${extra ? ' — ' + extra : ''}`); if (!ok) fails++; };
const nameOf = async (u) => (await q(`select display_name n from public.profiles where id = $1`, [u]))[0].n;
const setName = (u, n) => as(u, `select public.update_my_profile($1, null)`, [n]);
const report = (u, kind, ref, name, reason = 'offensive_name', target = null) => as(u, `select public.report_content($1, $2, $3, $4, $5::uuid)`, [kind, ref, name, reason, target]);
const count = async () => (await q(`select count(*)::int n from public.content_reports`))[0].n;

await setName(A, 'Exploradora');
check('un nombre normal se guarda', (await nameOf(A)) === 'Exploradora');
check('un nombre ofensivo se rechaza', (await err(() => setName(A, 'el MALPARIDO'))).includes('name_invalid') && (await nameOf(A)) === 'Exploradora');
check('también con tildes y mayúsculas', (await err(() => setName(A, 'Cabrón 99'))).includes('name_invalid'));
await as(A, `select public.update_my_profile(null, '🌍')`);
check('cambiar solo el avatar sigue funcionando', (await q(`select avatar from public.profiles where id = '${A}'`))[0].avatar === '🌍' && (await nameOf(A)) === 'Exploradora');
check('sin sesión no se puede', (await err(() => as(null, `select public.update_my_profile('Hola', null)`))) !== 'ok');
await q(`update public.profiles set display_name = 'puta' where id = '${B}'`);
check('el disparador conserva el nombre anterior por cualquier otra vía', (await nameOf(B)) === 'Beto');
await db.exec(`insert into auth.users (id, raw_user_meta_data) values ('${id(9)}', '{"display_name":"hijueputa"}'); insert into public.profiles (id, display_name) values ('${id(9)}', 'hijueputa') on conflict (id) do update set display_name = 'hijueputa';`);
check('un registro con nombre ofensivo queda sin nombre', (await nameOf(id(9))) === '');

await report(A, 'player', 'ranking', 'Beto', 'offensive_name', B);
let row = (await q(`select * from public.content_reports`))[0];
check('el reporte queda guardado y abierto', row.target_user === B && row.reporter_id === A && row.status === 'open' && row.reported_name === 'Beto');
await report(A, 'player', 'ranking', 'Beto', 'spam', B);
check('el mismo reporte no se duplica', (await count()) === 1);
check('reportarse a uno mismo no guarda nada', (await report(B, 'player', 'ranking', 'Beto', 'other', B), await count()) === 1);
check('motivo inválido', (await err(() => report(A, 'player', 'x', 'Caro', 'porque sí'))).includes('report_invalid'));
check('tipo inválido', (await err(() => report(A, 'otra', 'x', 'Caro'))).includes('report_invalid'));
check('nombre vacío', (await err(() => report(A, 'player', 'x', '   '))).includes('report_invalid'));
check('sin sesión no se reporta', (await err(() => report(null, 'player', 'x', 'Caro'))).includes('permission denied'));
check('un jugador no puede leer los reportes', (await err(() => as(C, `select * from public.content_reports`))).includes('permission denied'));
check('un jugador no puede escribir reportes directo', (await err(() => as(C, `insert into public.content_reports (reporter_id, kind, reported_name, reason) values ('${C}', 'player', 'x', 'spam')`))).includes('permission denied'));
check('un jugador no puede moderar', (await err(() => as(C, `select public.moderate_player('${B}', true)`))).includes('permission denied'));

// El servidor deduce a quién se reporta
await db.exec(`insert into public.custom_quizzes (id, owner_id, name, item_ids, share_code) values ('${id(50)}', '${C}', 'Mi quiz', array['a','b','c','d','e'], 'QUIZ23');`);
await report(A, 'quiz', 'QUIZ23', 'Mi quiz');
check('quiz: apunta a su dueño', (await q(`select target_user t from public.content_reports where kind = 'quiz'`))[0].t === C);

for (let i = 0; i < 18; i++) await report(A, 'player', `r${i}`, 'Caro');
check('máximo 20 reportes al día', (await err(() => report(A, 'player', 'r99', 'Caro'))).includes('report_limit'));

await q(`select public.moderate_player('${B}', true)`);
const b = (await q(`select display_name, avatar from public.profiles where id = '${B}'`))[0];
const ban = (await q(`select banned_until from auth.users where id = '${B}'`))[0].banned_until;
check('moderar: borra nombre y avatar, bloquea y cierra los reportes', b.display_name === '' && b.avatar === 'mascot' && !!ban && (await q(`select status s from public.content_reports where target_user = '${B}'`))[0].s === 'resolved');

await q(`delete from auth.users where id = '${A}'`);
check('borrar una cuenta borra los reportes que hizo', (await q(`select count(*)::int n from public.content_reports where reporter_id = '${A}'`))[0].n === 0);
await db.close();
console.log(fails ? `\n${fails} FALLAS` : '\nTodo OK');
process.exit(fails ? 1 : 0);
