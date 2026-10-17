-- ════════════════════════════════════════════════════════════════════════════
-- F1 (cierre) · Traslado del progreso de un invitado anónimo a una cuenta existente
--
-- Caso: un invitado (sesión anónima) jugó y ahora entra con un correo que YA tenía cuenta.
-- updateUser({email}) no sirve (el correo está tomado), así que:
--   1. Con la sesión anónima todavía activa: create_transfer_ticket() → ticket secreto de un uso
--      (válido 30 min, solo lo puede crear el propio anónimo para sí mismo).
--   2. Tras iniciar sesión con la cuenta real: redeem_transfer_ticket(ticket) mueve partidas,
--      retos y XP heredado del anónimo a la cuenta y borra el ticket.
-- El caso "crear cuenta nueva" no necesita esto: el anónimo se convierte en permanente
-- (updateUser email + contraseña) y conserva su mismo user_id.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.account_transfers (
  ticket       text primary key,
  anon_user_id uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '30 minutes'
);
alter table public.account_transfers enable row level security;
-- Sin políticas: nadie la lee directamente; solo las funciones de abajo.

create or replace function public.create_transfer_ticket()
returns text language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
  v_anon boolean;
  v_ticket text;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select is_anonymous into v_anon from auth.users where id = v_user;
  if not coalesce(v_anon, false) then raise exception 'not anonymous' using errcode = '42501'; end if;
  delete from public.account_transfers where anon_user_id = v_user or expires_at < now();
  -- gen_random_uuid() es nativo (pgcrypto vive en el esquema extensions); dos UUID ≈ 244 bits aleatorios
  v_ticket := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.account_transfers (ticket, anon_user_id) values (v_ticket, v_user);
  return v_ticket;
end $$;

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

  -- XP heredado del historial local
  select coalesce(xp_legacy, 0) into v_xp from public.profiles where id = v_anon;
  update public.profiles set xp_legacy = coalesce(xp_legacy, 0) + v_xp where id = v_user;

  -- El anónimo queda vacío: cleanup_anonymous_users() lo borrará a los 30 días
  return jsonb_build_object('moved_games', v_games);
end $$;

revoke all on function public.create_transfer_ticket() from public, anon;
revoke all on function public.redeem_transfer_ticket(text) from public, anon;
grant execute on function public.create_transfer_ticket() to authenticated;
grant execute on function public.redeem_transfer_ticket(text) to authenticated;
