-- Contenido de usuarios (política de Google Play): filtro de nombres de jugador y reportes dentro de la app.
-- Se puede aplicar más de una vez. Revisión de reportes: docs/GeoSpeed_Moderacion.md.

-- ── Nombres ────────────────────────────────────────────────────────────────────────────────────────────────
-- La RPC avisa al jugador; el disparador cubre cualquier otra vía (por ejemplo el nombre con el que se registra)
create or replace function public.update_my_profile(p_display_name text default null, p_avatar text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if nullif(btrim(p_display_name), '') is not null and not public._quiz_name_ok(p_display_name) then
    raise exception 'name_invalid' using errcode = '22023';
  end if;
  update public.profiles
     set display_name = coalesce(nullif(left(p_display_name, 20), ''), display_name),
         avatar       = coalesce(left(p_avatar, 40), avatar)
   where id = auth.uid();
end $$;

create or replace function public._profile_name_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.display_name, '') <> '' and not public._quiz_name_ok(new.display_name) then
    if tg_op = 'UPDATE' then new.display_name := old.display_name; else new.display_name := ''; end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_name_guard on public.profiles;
create trigger profiles_name_guard before insert or update of display_name on public.profiles
  for each row execute function public._profile_name_guard();

-- ── Reportes ───────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.content_reports (
  id            bigint generated always as identity primary key,
  reporter_id   uuid not null references auth.users (id) on delete cascade,
  target_user   uuid references auth.users (id) on delete set null,
  kind          text not null check (kind in ('player', 'quiz', 'room', 'challenge')),
  ref           text not null default '',
  reported_name text not null check (char_length(reported_name) between 1 and 80),
  reason        text not null check (reason in ('offensive_name', 'impersonation', 'spam', 'other')),
  status        text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  unique (reporter_id, kind, ref, reported_name)
);
create index if not exists content_reports_open on public.content_reports (created_at desc) where status = 'open';
alter table public.content_reports enable row level security;
revoke all on public.content_reports from public, anon, authenticated;

/** Guarda un reporte (uno por jugador, contenido y nombre; máximo 20 al día). El jugador reportado se deduce en el servidor */
create or replace function public.report_content(p_kind text, p_ref text, p_name text, p_reason text, p_target uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_target uuid := p_target; v_name text := left(btrim(coalesce(p_name, '')), 80); v_ref text := left(coalesce(p_ref, ''), 120);
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if p_kind not in ('player', 'quiz', 'room', 'challenge') or p_reason not in ('offensive_name', 'impersonation', 'spam', 'other') or v_name = '' then
    raise exception 'report_invalid' using errcode = '22023';
  end if;
  if (select count(*) from public.content_reports where reporter_id = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'report_limit' using errcode = 'P0001';
  end if;
  if p_kind = 'quiz' then
    select owner_id into v_target from public.custom_quizzes where share_code = v_ref;
  elsif p_kind = 'room' and v_ref ~ '^[0-9a-f-]{36}:[0-9]+$' then
    select user_id into v_target from public.room_players where room_id = split_part(v_ref, ':', 1)::uuid and slot = split_part(v_ref, ':', 2)::smallint;
  elsif p_kind = 'challenge' and v_ref ~ '^[0-9a-f-]{36}$' then
    select user_id into v_target from public.challenge_participants where challenge_id = v_ref::uuid and user_id <> v_uid limit 1;
  end if;
  if v_target is not null and not exists (select 1 from auth.users where id = v_target) then v_target := null; end if;
  if v_target = v_uid then return; end if;
  insert into public.content_reports (reporter_id, target_user, kind, ref, reported_name, reason)
    values (v_uid, v_target, p_kind, v_ref, v_name, p_reason)
    on conflict (reporter_id, kind, ref, reported_name) do nothing;
end $$;
revoke all on function public.report_content(text, text, text, text, uuid) from public, anon;
grant execute on function public.report_content(text, text, text, text, uuid) to authenticated;

/** Solo desde el editor SQL: borra el nombre y el avatar del jugador, opcionalmente lo bloquea, y cierra sus reportes */
create or replace function public.moderate_player(p_user uuid, p_block boolean default false)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  update public.profiles set display_name = '', avatar = 'mascot' where id = p_user;
  if p_block then update auth.users set banned_until = now() + interval '100 years' where id = p_user; end if;
  update public.content_reports set status = 'resolved', resolved_at = now() where target_user = p_user and status = 'open';
end $$;
revoke all on function public.moderate_player(uuid, boolean) from public, anon, authenticated;
