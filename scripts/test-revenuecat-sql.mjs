// RevenueCat → purchases (migración 20261109120000_revenuecat.sql): cada aviso del webhook, la vigencia
// explícita de las suscripciones de Google Play, reembolsos, transferencias, vidas ya entregadas en la app
// y que _is_pro / my_entitlements lo vean, sobre toda la cadena de migraciones en Postgres embebido (PGlite).
//
// Uso: npm run test:revenuecat-sql   (o node scripts/test-revenuecat-sql.mjs [carpeta de migraciones])
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
const [A, B, C, D, E, F] = [1, 2, 3, 4, 5, 6].map(id);
await db.exec(`insert into auth.users (id) values ('${A}'), ('${B}'), ('${C}'), ('${D}'), ('${E}'), ('${F}');`);

const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const as = async (uid, sql, params = []) => {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  try { return (await db.query(sql, params)).rows; } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
};
const ent = async (uid) => (await as(uid, `select public.my_entitlements() e`))[0].e;
const isPro = async (uid) => (await q(`select public._is_pro($1::uuid) p`, [uid]))[0].p;
const apply = async (ev) => (await q(`select public.revenuecat_apply_event($1::jsonb) r`, [JSON.stringify(ev)]))[0].r;
const rows = async (uid) => q(`select provider, provider_payment_id, product_id, lives, pro_kind, pro_until, lives_claimed_at, revoked_at from public.purchases where user_id = $1 order by created_at`, [uid]);
let fails = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'OK ' : 'MAL'} ${name}${extra ? ' — ' + extra : ''}`); if (!ok) fails++; };

const DAY = 86_400_000;
const now = Date.now();
const ev = (type, o = {}) => ({ type, environment: 'PRODUCTION', app_user_id: A, purchased_at_ms: now, currency: 'COP', price: 2.99, ...o });

// ── Aviso de prueba ──
check('TEST responde ok sin tocar nada', (await apply({ type: 'TEST' })).action === 'test');

// ── Suscripción de Google Play ──
let r = await apply(ev('INITIAL_PURCHASE', { product_id: 'pro_monthly:monthly', transaction_id: 'GPA.1', expiration_at_ms: now + 30 * DAY }));
check('compra inicial de pro_monthly:base-plan → registrada', r.action === 'recorded', JSON.stringify(r));
let e = await ent(A);
check('my_entitlements: Pro por suscripción con el fin que dio Google', e.is_pro === true && e.source === 'subscription' && Math.abs(new Date(e.expires_at).getTime() - (now + 30 * DAY)) < 2000, JSON.stringify(e));
check('_is_pro lo ve (Sprint, packs, racha)', await isPro(A));
await apply(ev('INITIAL_PURCHASE', { product_id: 'pro_monthly:monthly', transaction_id: 'GPA.1', expiration_at_ms: now + 30 * DAY }));
check('el mismo aviso repetido no duplica', (await rows(A)).length === 1);
check('producto guardado sin el plan base', (await rows(A))[0].product_id === 'pro_monthly');

r = await apply(ev('RENEWAL', { product_id: 'pro_monthly:monthly', transaction_id: 'GPA.1..0', purchased_at_ms: now + 30 * DAY, expiration_at_ms: now + 60 * DAY }));
e = await ent(A);
check('renovación → nuevo periodo, vence 30 días después', r.action === 'recorded' && Math.abs(new Date(e.expires_at).getTime() - (now + 60 * DAY)) < 2000);

r = await apply(ev('CANCELLATION', { product_id: 'pro_monthly:monthly', transaction_id: 'GPA.1..0', cancel_reason: 'UNSUBSCRIBE' }));
check('cancelar la renovación no quita el Pro pagado', r.action === 'renewal_off' && (await isPro(A)));

r = await apply(ev('EXPIRATION', { product_id: 'pro_monthly:monthly', transaction_id: 'GPA.1..0', expiration_at_ms: now - 1000 }));
check('EXPIRATION recorta la vigencia', r.action === 'expired' && (await rows(A))[1].pro_until < new Date());
check('…pero el primer periodo (30 días) sigue vigente', await isPro(A));
await apply(ev('EXPIRATION', { product_id: 'pro_monthly:monthly', transaction_id: 'GPA.1', expiration_at_ms: now - 1000 }));
e = await ent(A);
check('vencidos los dos periodos → ya no es Pro', e.is_pro === false && e.source === null && !(await isPro(A)), JSON.stringify(e));

// ── Reembolso ──
await apply(ev('INITIAL_PURCHASE', { app_user_id: B, product_id: 'pro_yearly:yearly', transaction_id: 'GPA.2', expiration_at_ms: now + 365 * DAY }));
check('pro_yearly da Pro', await isPro(B));
r = await apply(ev('CANCELLATION', { app_user_id: B, product_id: 'pro_yearly:yearly', transaction_id: 'GPA.2', cancel_reason: 'CUSTOMER_SUPPORT' }));
check('reembolso (CUSTOMER_SUPPORT) revoca la compra', r.action === 'revoked' && !(await isPro(B)));
r = await apply(ev('REFUND_REVERSED', { app_user_id: B, product_id: 'pro_yearly:yearly', transaction_id: 'GPA.2' }));
check('reembolso revertido → vuelve el Pro', r.action === 'restored' && (await isPro(B)));

// ── Compras únicas ──
r = await apply(ev('NON_RENEWING_PURCHASE', { app_user_id: C, product_id: 'lives_15', transaction_id: 'GPA.3' }));
let rc = await rows(C);
check('vidas compradas en la app: registradas como ya entregadas', r.action === 'recorded' && rc[0].lives === 15 && rc[0].lives_claimed_at !== null);
e = await ent(C);
check('…la web no las vuelve a dar', e.lives_pending === 0 && (await as(C, `select public.claim_purchased_lives() n`))[0].n === 0);
r = await apply(ev('NON_RENEWING_PURCHASE', { app_user_id: C, product_id: 'pro_lifetime', transaction_id: 'GPA.4' }));
e = await ent(C);
check('pro_lifetime → Pro para siempre', r.action === 'recorded' && e.is_pro && e.source === 'lifetime' && e.expires_at === null, JSON.stringify(e));
check('producto desconocido se ignora', (await apply(ev('NON_RENEWING_PURCHASE', { app_user_id: C, product_id: 'coins_99', transaction_id: 'GPA.5' }))).action === 'unknown_product' && (await rows(C)).length === 2);

// ── El comprador ──
r = await apply(ev('NON_RENEWING_PURCHASE', { app_user_id: '$RCAnonymousID:abc', original_app_user_id: '$RCAnonymousID:abc', aliases: ['$RCAnonymousID:abc', D], product_id: 'lives_5', transaction_id: 'GPA.6' }));
check('id anónimo de RevenueCat con alias de Supabase → compra del alias', r.action === 'recorded' && (await rows(D)).length === 1);
r = await apply(ev('NON_RENEWING_PURCHASE', { app_user_id: '$RCAnonymousID:zzz', aliases: [], product_id: 'lives_5', transaction_id: 'GPA.7' }));
check('sin usuario de Supabase → se ignora (no reintentar para siempre)', r.action === 'no_user' && (await q(`select count(*)::int n from public.purchases where provider_payment_id = 'GPA.7'`))[0].n === 0);
r = await apply(ev('NON_RENEWING_PURCHASE', { app_user_id: '00000000-0000-0000-0000-000000000999', product_id: 'lives_5', transaction_id: 'GPA.8' }));
check('uuid que no es un usuario → se ignora', r.action === 'no_user');

// ── Pruebas internas (sandbox) ──
await apply(ev('INITIAL_PURCHASE', { environment: 'SANDBOX', app_user_id: E, product_id: 'pro_monthly:monthly', transaction_id: 'GPA.9', expiration_at_ms: now + 5 * 60_000 }));
check('compras de prueba se guardan aparte (revenuecat_sandbox) y dan Pro', (await rows(E))[0].provider === 'revenuecat_sandbox' && (await isPro(E)));
r = await apply(ev('CANCELLATION', { environment: 'SANDBOX', app_user_id: E, product_id: 'pro_monthly:monthly', transaction_id: 'GPA.9', cancel_reason: 'CUSTOMER_SUPPORT' }));
check('el reembolso de prueba busca en sandbox', r.rows === 1 && !(await isPro(E)));

// ── Transferencia (restaurar en otra cuenta) ──
await q(`insert into public.purchases (provider, provider_payment_id, user_id, product_id, pro_kind, pro_days) values ('mercadopago', 'mp-1', $1, 'pro_monthly', 'subscription', 30)`, [C]);
r = await apply({ type: 'TRANSFER', environment: 'PRODUCTION', transferred_from: [C, '$RCAnonymousID:abc'], transferred_to: [F] });
check('TRANSFER mueve las compras de RevenueCat a la nueva cuenta', r.action === 'transferred' && r.rows === 2 && (await rows(F)).length === 2);
check('…y deja las de Mercado Pago donde estaban', (await rows(C)).length === 1 && (await rows(C))[0].provider === 'mercadopago');
check('TRANSFER a alguien que no existe no mueve nada', (await apply({ type: 'TRANSFER', transferred_from: [F], transferred_to: ['$RCAnonymousID:q'] })).action === 'transfer_no_user' && (await rows(F)).length === 2);

// ── Web encadenada + Google Play juntas ──
await q(`insert into public.purchases (provider, provider_payment_id, user_id, product_id, pro_kind, pro_days, created_at) values ('mercadopago', 'mp-2', $1, 'pro_monthly', 'subscription', 30, now() - interval '40 days')`, [D]);
check('mes web vencido sin otra compra → no es Pro', !(await isPro(D)));
await apply(ev('INITIAL_PURCHASE', { app_user_id: D, product_id: 'pro_monthly:monthly', transaction_id: 'GPA.10', expiration_at_ms: now + 10 * DAY }));
e = await ent(D);
check('la suscripción de Play se suma a la cuenta con compras web', e.is_pro && Math.abs(new Date(e.expires_at).getTime() - (now + 10 * DAY)) < 2000);
await q(`insert into public.purchases (provider, provider_payment_id, user_id, product_id, pro_kind, pro_days) values ('reward', 'streak-30', $1, 'pro_days', 'subscription', 7)`, [A]);
check('los premios de la racha (encadenados) siguen funcionando con filas de Play vencidas', await isPro(A));

// ── Datos raros ──
check('sin transaction_id → se ignora', (await apply(ev('NON_RENEWING_PURCHASE', { app_user_id: B, product_id: 'lives_5' }))).action === 'no_transaction');
check('suscripción sin vencimiento → se ignora', (await apply(ev('INITIAL_PURCHASE', { app_user_id: B, product_id: 'pro_monthly', transaction_id: 'GPA.11' }))).action === 'no_expiration');
r = await apply(ev('NON_RENEWING_PURCHASE', { app_user_id: B, product_id: 'lives_5', transaction_id: 'GPA.12', purchased_at_ms: 'ayer', price: 'gratis' }));
check('fecha y precio basura no rompen el aviso', r.action === 'recorded');
check('tipos informativos se ignoran', (await apply(ev('BILLING_ISSUE', { transaction_id: 'GPA.1' }))).action === 'ignored');

// ── Efecto en el juego: Pro de Google Play en los packs Pro ──
await apply(ev('INITIAL_PURCHASE', { app_user_id: F, product_id: 'pro_yearly:yearly', transaction_id: 'GPA.13', expiration_at_ms: now + 300 * DAY }));
const t1 = (await as(F, `select public.claim_pack_trial('andes') ok`))[0].ok;
const t2 = (await as(F, `select public.claim_pack_trial('andes') ok`))[0].ok;
check('con Pro de Google Play, los packs Pro no tienen límite diario', t1 === true && t2 === true);

// ── Permisos ──
const denied = async (role) => {
  await db.exec(`set role ${role}`);
  try { await db.query(`select public.revenuecat_apply_event('{"type":"TEST"}'::jsonb)`); return false; }
  catch (e) { return /permission denied/.test(e.message); }
  finally { await db.exec('reset role'); }
};
check('un jugador no puede llamar a revenuecat_apply_event', await denied('authenticated'));
check('sin sesión tampoco', await denied('anon'));
await db.exec('set role service_role');
let ok = false;
try { ok = (await db.query(`select public.revenuecat_apply_event('{"type":"TEST"}'::jsonb) r`)).rows[0].r.ok === true; } catch { ok = false; }
await db.exec('reset role');
check('el webhook (service role) sí puede', ok);
check('los jugadores siguen sin leer purchases', await (async () => {
  try { await as(A, `select * from public.purchases`); return false; } catch (e) { return /permission denied/.test(e.message); }
})());

console.log(fails ? `\n${fails} FALLAS` : '\nTodo bien');
process.exit(fails ? 1 : 0);
