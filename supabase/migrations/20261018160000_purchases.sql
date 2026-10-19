-- ════════════════════════════════════════════════════════════════════════════
-- Compras web (Mercado Pago): las acredita SOLO el servidor y una sola vez por pago
--
-- Antes el webhook escribía vidas/Pro en player_data, pero:
--   · el cliente nunca leía esas vidas y su pushToCloud() las sobrescribía tras cada partida;
--   · el Pro también se podía sobrescribir (y cualquiera podía marcarse Pro, porque el cliente
--     tiene permiso de UPDATE sobre su fila de player_data);
--   · Mercado Pago avisa varias veces el mismo pago → las vidas se sumaban repetidas.
-- Ahora:
--   · purchases: una fila por pago aprobado (único por proveedor + id de pago). Solo la escribe
--     el webhook con service role; los clientes no tienen acceso directo.
--   · my_entitlements(): Pro vigente (vitalicio o suscripciones encadenadas) + vidas sin recoger.
--   · claim_purchased_lives(): el cliente recoge sus vidas compradas una sola vez (atómico).
--   · player_data.premium deja de ser escribible por los clientes (trigger).
--   · El traslado invitado → cuenta existente también mueve las compras, y la limpieza semanal
--     no borra invitados que compraron.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.purchases (
  id                  uuid primary key default gen_random_uuid(),
  provider            text not null,
  provider_payment_id text not null,
  user_id             uuid not null references auth.users (id) on delete cascade,
  product_id          text not null,
  lives               integer not null default 0 check (lives >= 0),
  pro_kind            text check (pro_kind in ('subscription', 'lifetime')),
  pro_days            integer check (pro_days is null or pro_days > 0),
  amount              numeric(12, 2),
  currency            text,
  created_at          timestamptz not null default now(),
  lives_claimed_at    timestamptz,
  revoked_at          timestamptz,           -- reembolso / contracargo / cancelación
  unique (provider, provider_payment_id)
);
create index if not exists purchases_user_idx on public.purchases (user_id, created_at);
alter table public.purchases enable row level security;
-- Sin políticas: nadie la lee ni la escribe desde el cliente; solo el webhook y las funciones de abajo.
revoke all on public.purchases from anon, authenticated;

-- ── Lo que el jugador tiene comprado ─────────────────────────────────────────
create or replace function public.my_entitlements()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_user     uuid := auth.uid();
  v_lifetime boolean := false;
  v_exp      timestamptz := null;
  v_lives    integer := 0;
  r          record;
begin
  if v_user is null then
    return jsonb_build_object('is_pro', false, 'source', null, 'expires_at', null, 'lives_pending', 0);
  end if;

  select exists (
    select 1 from public.purchases
     where user_id = v_user and pro_kind = 'lifetime' and revoked_at is null
  ) into v_lifetime;

  -- Suscripciones: los periodos se encadenan (comprar otro mes antes de que venza lo extiende)
  for r in
    select created_at, pro_days from public.purchases
     where user_id = v_user and pro_kind = 'subscription' and revoked_at is null
     order by created_at
  loop
    v_exp := greatest(v_exp, r.created_at) + make_interval(days => r.pro_days);
  end loop;

  select coalesce(sum(lives), 0) into v_lives from public.purchases
   where user_id = v_user and lives > 0 and lives_claimed_at is null and revoked_at is null;

  return jsonb_build_object(
    'is_pro', v_lifetime or (v_exp is not null and v_exp > now()),
    'source', case
                when v_lifetime then 'lifetime'
                when v_exp is not null and v_exp > now() then 'subscription'
                else null
              end,
    'expires_at', case when v_lifetime then null else v_exp end,
    'lives_pending', v_lives
  );
end $$;

-- ── Recoger las vidas compradas (una sola vez) ───────────────────────────────
create or replace function public.claim_purchased_lives()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_n    integer := 0;
begin
  if v_user is null then return 0; end if;
  with claimed as (
    update public.purchases
       set lives_claimed_at = now()
     where user_id = v_user and lives > 0 and lives_claimed_at is null and revoked_at is null
    returning lives
  )
  select coalesce(sum(lives), 0) into v_n from claimed;
  return v_n;
end $$;

-- ── player_data.premium: solo lo cambia el servidor ──────────────────────────
create or replace function public._player_data_protect_premium()
returns trigger language plpgsql as $$
begin
  -- PostgREST ejecuta las peticiones de los clientes con el rol anon / authenticated
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.premium := '{"isPro":false,"proExpiresAt":null,"proSource":null}'::jsonb;
    else
      new.premium := old.premium;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_player_data_protect_premium on public.player_data;
create trigger trg_player_data_protect_premium
  before insert or update on public.player_data
  for each row execute function public._player_data_protect_premium();

-- ── Limpieza semanal: no borrar invitados que compraron ──────────────────────
create or replace function public.cleanup_anonymous_users()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_n integer;
begin
  with gone as (
    delete from auth.users u
     where u.is_anonymous is true
       and u.created_at < now() - interval '30 days'
       and not exists (select 1 from public.game_results r where r.user_id = u.id)
       and not exists (select 1 from public.purchases p where p.user_id = u.id)
    returning 1
  )
  select count(*) into v_n from gone;
  return v_n;
end;
$$;

-- ── Invitado → cuenta existente: también se mudan las compras ────────────────
create or replace function public.redeem_transfer_ticket(p_ticket text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user  uuid := auth.uid();
  v_anon  uuid;
  v_games integer := 0;
  v_xp    integer := 0;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  delete from public.account_transfers
   where ticket = p_ticket and expires_at >= now()
   returning anon_user_id into v_anon;
  if v_anon is null or v_anon = v_user then
    return jsonb_build_object('moved_games', 0);
  end if;

  -- Partidas (y sus rondas, que cuelgan del result_id)
  update public.game_results set user_id = v_user where user_id = v_anon;
  get diagnostics v_games = row_count;

  -- Retos: participación (si la cuenta ya estaba en el mismo reto, se conserva la suya) y autoría
  delete from public.challenge_participants a
   where a.user_id = v_anon
     and exists (select 1 from public.challenge_participants b where b.challenge_id = a.challenge_id and b.user_id = v_user);
  update public.challenge_participants set user_id = v_user where user_id = v_anon;
  update public.challenges set creator_id = v_user where creator_id = v_anon;

  -- Compras (Pro y vidas sin recoger)
  update public.purchases set user_id = v_user where user_id = v_anon;

  -- XP heredado del historial local
  select coalesce(xp_legacy, 0) into v_xp from public.profiles where id = v_anon;
  update public.profiles set xp_legacy = coalesce(xp_legacy, 0) + v_xp where id = v_user;

  -- El anónimo queda vacío: cleanup_anonymous_users() lo borrará a los 30 días
  return jsonb_build_object('moved_games', v_games);
end $$;

-- ── Permisos ─────────────────────────────────────────────────────────────────
revoke all on function public.my_entitlements() from public, anon;
revoke all on function public.claim_purchased_lives() from public, anon;
grant execute on function public.my_entitlements() to authenticated;
grant execute on function public.claim_purchased_lives() to authenticated;
revoke all on function public.cleanup_anonymous_users() from public, anon, authenticated;
revoke all on function public.redeem_transfer_ticket(text) from public, anon;
grant execute on function public.redeem_transfer_ticket(text) to authenticated;
