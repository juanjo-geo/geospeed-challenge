-- ════════════════════════════════════════════════════════════════════════════
-- Conquista el mapa — fase C2: servidor (docs/GeoSpeed_Conquista_Plan.md, especificación v1.1 en
-- docs/GeoSpeed_Conquista_Especificacion_v1.1.md). Grupos privados de 2 a 5 cuentas registradas, temporadas de 7 días,
-- 10 países fijos con un paquete de 5 ciudades por país y temporada, misiones de 5 rondas de 15 s con puntaje propio
-- (sin combos), captura desde 2.000, ataque que supera la marca, 5 misiones al día (2 por país, 1 h entre inicios en
-- un país), reserva exclusiva de 3 minutos, cierre con clasificación por territorios y suma de marcas, insignia de
-- campeón. Sin Realtime: el cliente consulta; el mantenimiento es perezoso (_conq_touch_*) y pg_cron llama a
-- conq_close_due() para cerrar temporadas aunque nadie abra el juego.
-- Todo por funciones SECURITY DEFINER; las tablas no tienen permisos para el cliente. El cliente nunca envía puntos,
-- dueños ni marcas: solo la coordenada tocada. Las preguntas se entregan de una en una y la ubicación correcta solo
-- después de cerrar la ronda.
-- Reloj: _conq_now() = now(), salvo en las pruebas (setting conq.now). Para QA en producción, conq_groups.qa_time_scale
-- (solo por SQL) acelera la temporada, los días y la espera de 1 h; las rondas y la reserva siguen en tiempo real.
-- Idempotente: se aplica desde el SQL Editor.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Tablas ─────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.conq_groups (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 3 and 30),
  admin_id          uuid references auth.users (id) on delete set null,
  created_by        uuid references auth.users (id) on delete set null,
  status            text not null default 'active' check (status in ('active', 'archived')),
  invite_code       text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  qa_time_scale     integer not null default 1 check (qa_time_scale between 1 and 10080),
  client_request_id text,
  created_at        timestamptz not null default now(),
  unique (created_by, client_request_id)
);

create table if not exists public.conq_members (
  group_id  uuid not null references public.conq_groups (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  role      text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  muted     boolean not null default false,
  primary key (group_id, user_id)
);
create index if not exists conq_members_user on public.conq_members (user_id);

create table if not exists public.conq_seasons (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.conq_groups (id) on delete cascade,
  number     integer not null,
  status     text not null check (status in ('lobby', 'active', 'closed', 'cancelled')),
  roster     jsonb,          -- [{user_id, name, avatar, slot}] congelado al iniciar
  catalog    text[],         -- los 10 países (ISO) de la temporada
  rules      jsonb not null,
  started_at timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now(),
  unique (group_id, number)
);
create index if not exists conq_seasons_active on public.conq_seasons (ends_at) where status = 'active';

create table if not exists public.conq_confirms (
  season_id    uuid not null references public.conq_seasons (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  primary key (season_id, user_id)
);

-- Banco de ciudades por país (fase C1: supabase/seed/conquest_bank.sql, al final de esta migración)
create table if not exists public.conq_bank (
  country_iso text not null,
  place_id    text not null references public.places (id) on delete cascade,
  ord         integer not null,
  primary key (country_iso, place_id)
);

create table if not exists public.conq_packages (
  season_id       uuid not null references public.conq_seasons (id) on delete cascade,
  country_iso     text not null,
  place_ids       text[] not null check (cardinality(place_ids) = 5),
  dataset_version integer not null default 1,
  primary key (season_id, country_iso)
);

create table if not exists public.conq_territories (
  season_id      uuid not null references public.conq_seasons (id) on delete cascade,
  country_iso    text not null,
  owner_id       uuid references auth.users (id) on delete set null,
  retired        boolean not null default false,   -- el dueño borró su cuenta: la marca sigue, no suma para nadie
  defense        integer not null default 0,
  version        integer not null default 0,
  reserved_by    uuid,
  reserved_until timestamptz,
  captured_at    timestamptz,
  primary key (season_id, country_iso)
);

create table if not exists public.conq_attempts (
  id                  uuid primary key default gen_random_uuid(),
  season_id           uuid not null references public.conq_seasons (id) on delete cascade,
  country_iso         text not null,
  user_id             uuid references auth.users (id) on delete set null,
  kind                text not null check (kind in ('capture', 'attack', 'recover')),
  owner_at_start      uuid,
  defense_at_start    integer not null default 0,
  version_at_start    integer not null,
  status              text not null default 'active' check (status in ('active', 'completed', 'abandoned', 'expired', 'void')),
  outcome             text check (outcome in ('captured', 'failed', 'conquered', 'defended', 'tie', 'abandoned', 'expired', 'void')),
  started_at          timestamptz not null,
  first_open_deadline timestamptz not null,
  expires_at          timestamptz not null,
  finished_at         timestamptz,
  day_index           integer not null,
  total               integer not null default 0,
  client_request_id   text,
  unique (season_id, user_id, client_request_id)
);
create index if not exists conq_attempts_user on public.conq_attempts (season_id, user_id, day_index);
create index if not exists conq_attempts_active on public.conq_attempts (season_id) where status = 'active';

create table if not exists public.conq_rounds (
  attempt_id  uuid not null references public.conq_attempts (id) on delete cascade,
  idx         integer not null check (idx between 1 and 5),
  place_id    text not null,
  opened_at   timestamptz,
  deadline_at timestamptz,
  click_lat   double precision,
  click_lon   double precision,
  received_at timestamptz,
  time_s      numeric,
  distance_km numeric,
  points      integer not null default 0,
  closed      boolean not null default false,
  primary key (attempt_id, idx)
);

create table if not exists public.conq_events (
  id          bigserial primary key,
  season_id   uuid not null references public.conq_seasons (id) on delete cascade,
  attempt_id  uuid references public.conq_attempts (id) on delete cascade,
  type        text not null,   -- season_start · join · captured · failed · conquered · defended · tie · expired · season_close
  actor_id    uuid references auth.users (id) on delete set null,
  country_iso text,
  prev_owner  uuid references auth.users (id) on delete set null,
  new_owner   uuid references auth.users (id) on delete set null,
  score       integer,
  defense     integer,
  created_at  timestamptz not null default now()
);
create unique index if not exists conq_events_attempt on public.conq_events (attempt_id, type) where attempt_id is not null;
create unique index if not exists conq_events_season_once on public.conq_events (season_id, type) where attempt_id is null and type in ('season_start', 'season_close');
create index if not exists conq_events_season on public.conq_events (season_id, id desc);

create table if not exists public.conq_seen (
  season_id     uuid not null references public.conq_seasons (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  last_event_id bigint not null default 0,
  primary key (season_id, user_id)
);

create table if not exists public.conq_closes (
  season_id uuid primary key references public.conq_seasons (id) on delete cascade,
  standings jsonb not null,
  territories jsonb not null,
  closed_at timestamptz not null
);

create table if not exists public.conq_awards (
  season_id uuid not null references public.conq_seasons (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  rank      integer not null,
  award     text not null,
  primary key (season_id, user_id)
);

create table if not exists public.conq_rate (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  kind    text not null,
  n       integer not null default 0,
  primary key (user_id, day, kind)
);

do $$ declare t text; begin
  foreach t in array array['conq_groups','conq_members','conq_seasons','conq_confirms','conq_bank','conq_packages',
    'conq_territories','conq_attempts','conq_rounds','conq_events','conq_seen','conq_closes','conq_awards','conq_rate'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ── Reglas, reloj y utilidades ─────────────────────────────────────────────────────────────────────────────
create or replace function public._conq_now() returns timestamptz language sql stable as $$
  select coalesce(nullif(current_setting('conq.now', true), '')::timestamptz, now())
$$;

/** Reglas aprobadas (versión 1). time_scale se fija por grupo solo para QA */
create or replace function public._conq_rules() returns jsonb language sql immutable as $$
  select jsonb_build_object('version', 1, 'season_days', 7, 'rounds', 5, 'seconds', 15, 'threshold', 2000,
    'daily_missions', 5, 'per_country_daily', 2, 'cooldown_s', 3600, 'reservation_s', 180, 'last_minutes_s', 180,
    'first_open_s', 30, 'scale_km', 500, 'min_players', 2, 'max_players', 5, 'time_scale', 1)
$$;

create or replace function public._conq_catalog() returns text[] language sql immutable as $$
  select array['CO','PE','EC','CL','AR','BR','MX','ES','FR','IT']
$$;

/** Puntos de una ronda: redondear(1.000 × e^(−d/500) × (0,5 + 0,5 × (1 − t/15))); 0 si t ≥ 15 o sin respuesta */
create or replace function public._conq_points(p_km numeric, p_t numeric) returns integer language sql immutable as $$
  select case when p_km is null or p_t is null or p_t >= 15 then 0
    else floor(1000 * exp(-p_km / 500.0) * (0.5 + 0.5 * (1 - greatest(p_t, 0) / 15.0)) + 0.5)::integer end
$$;

create or replace function public._conq_day_s(p_rules jsonb) returns numeric language sql immutable as $$
  select 86400.0 / greatest(1, coalesce((p_rules->>'time_scale')::integer, 1))
$$;

create or replace function public._conq_day_index(p_season public.conq_seasons, p_at timestamptz) returns integer language sql stable as $$
  select floor(extract(epoch from (p_at - p_season.started_at)) / public._conq_day_s(p_season.rules))::integer
$$;

create or replace function public._conq_code() returns text language plpgsql volatile set search_path = public as $$
declare
  v_alpha text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code  text;
begin
  loop
    v_code := '';
    for i in 1..6 loop v_code := v_code || substr(v_alpha, 1 + floor(random() * length(v_alpha))::integer, 1); end loop;
    exit when not exists (select 1 from public.conq_groups where invite_code = v_code);
  end loop;
  return v_code;
end $$;

/** Cuenta registrada (las de invitado se borran a los 30 días sin uso: decisión CQ-D1) */
create or replace function public._conq_account() returns uuid language plpgsql stable security definer set search_path = public, auth as $$
declare v_user uuid := auth.uid(); v_anon boolean;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select coalesce(u.is_anonymous, false) into v_anon from auth.users u where u.id = v_user;
  if v_anon is null or v_anon then raise exception 'conq_account_required' using errcode = '42501'; end if;
  return v_user;
end $$;

/** Límite de solicitudes por usuario y día (invitaciones y grupos nuevos) */
create or replace function public._conq_rate(p_user uuid, p_kind text, p_max integer) returns void language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  insert into public.conq_rate as r (user_id, day, kind, n) values (p_user, current_date, p_kind, 1)
  on conflict (user_id, day, kind) do update set n = r.n + 1 returning n into v_n;
  if v_n > p_max then raise exception 'conq_rate_limited' using errcode = 'P0001'; end if;
end $$;

create or replace function public._conq_in_roster(p_season public.conq_seasons, p_user uuid) returns boolean language sql stable as $$
  select coalesce(p_season.roster @> jsonb_build_array(jsonb_build_object('user_id', p_user::text)), false)
$$;

create or replace function public._conq_is_member(p_group uuid, p_user uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conq_members where group_id = p_group and user_id = p_user)
$$;

-- ── Intentos: liberar, finalizar, mantenimiento perezoso ───────────────────────────────────────────────────
create or replace function public._conq_release(p_attempt public.conq_attempts) returns void language sql security definer set search_path = public as $$
  update public.conq_territories set reserved_by = null, reserved_until = null
   where season_id = p_attempt.season_id and country_iso = p_attempt.country_iso and reserved_by = p_attempt.id
$$;

/** Resuelve un intento con sus cinco rondas cerradas. p_done_at = cuándo se cerró la última ronda (reloj del servidor) */
create or replace function public._conq_finalize(p_attempt uuid, p_done_at timestamptz) returns void language plpgsql security definer set search_path = public as $$
declare
  a public.conq_attempts; s public.conq_seasons; t public.conq_territories;
  v_total integer; v_outcome text; v_threshold integer;
begin
  select * into a from public.conq_attempts where id = p_attempt for update;
  if a.id is null or a.status <> 'active' then return; end if;
  select * into s from public.conq_seasons where id = a.season_id;
  select * into t from public.conq_territories where season_id = a.season_id and country_iso = a.country_iso for update;
  select coalesce(sum(points), 0) into v_total from public.conq_rounds where attempt_id = a.id;
  v_threshold := coalesce((s.rules->>'threshold')::integer, 2000);
  -- Solo un resultado confirmado antes del cierre y dentro de la reserva cambia el mapa
  if p_done_at >= s.ends_at or p_done_at > a.expires_at or t.reserved_by is distinct from a.id or t.version <> a.version_at_start then
    update public.conq_attempts set status = 'expired', outcome = 'expired', total = v_total, finished_at = least(p_done_at, a.expires_at) where id = a.id;
    perform public._conq_release(a);
    insert into public.conq_events (season_id, attempt_id, type, actor_id, country_iso, score, created_at)
      values (a.season_id, a.id, 'expired', a.user_id, a.country_iso, v_total, least(p_done_at, a.expires_at)) on conflict do nothing;
    return;
  end if;
  if t.owner_id is null and not t.retired then
    v_outcome := case when v_total >= v_threshold then 'captured' else 'failed' end;
  else
    v_outcome := case when v_total > t.defense then 'conquered' when v_total = t.defense then 'tie' else 'defended' end;
  end if;
  if v_outcome in ('captured', 'conquered') then
    update public.conq_territories set owner_id = a.user_id, retired = false, defense = v_total, captured_at = p_done_at,
      version = version + 1, reserved_by = null, reserved_until = null
     where season_id = a.season_id and country_iso = a.country_iso;
  else
    update public.conq_territories set version = version + 1, reserved_by = null, reserved_until = null
     where season_id = a.season_id and country_iso = a.country_iso;
  end if;
  update public.conq_attempts set status = 'completed', outcome = v_outcome, total = v_total, finished_at = p_done_at where id = a.id;
  insert into public.conq_events (season_id, attempt_id, type, actor_id, country_iso, prev_owner, new_owner, score, defense, created_at)
    values (a.season_id, a.id, v_outcome, a.user_id, a.country_iso, t.owner_id,
      case when v_outcome in ('captured', 'conquered') then a.user_id else t.owner_id end, v_total, t.defense, p_done_at)
  on conflict do nothing;
end $$;

/** Cierra las rondas vencidas (0 puntos), finaliza el intento si ya tiene las cinco, o lo expira / anula */
create or replace function public._conq_touch_attempt(p_attempt uuid) returns void language plpgsql security definer set search_path = public as $$
declare
  a public.conq_attempts; v_now timestamptz := public._conq_now();
  v_done integer; v_opened integer; v_last timestamptz; v_total integer;
begin
  select * into a from public.conq_attempts where id = p_attempt for update;
  if a.id is null or a.status <> 'active' then return; end if;
  update public.conq_rounds set closed = true, points = 0
   where attempt_id = a.id and opened_at is not null and not closed and deadline_at <= v_now;
  select count(*) filter (where closed), count(*) filter (where opened_at is not null),
         max(least(coalesce(received_at, deadline_at), deadline_at)) filter (where closed), coalesce(sum(points), 0)
    into v_done, v_opened, v_last, v_total
    from public.conq_rounds where attempt_id = a.id;
  if v_done = 5 then perform public._conq_finalize(a.id, v_last); return; end if;
  if v_opened = 0 and v_now >= a.first_open_deadline then
    -- Nunca se entregó la primera pregunta (falla de red): no consume misión ni activa la espera
    update public.conq_attempts set status = 'void', outcome = 'void', finished_at = v_now where id = a.id;
    perform public._conq_release(a);
    return;
  end if;
  if v_now >= a.expires_at then
    update public.conq_attempts set status = 'expired', outcome = 'expired', total = v_total, finished_at = a.expires_at where id = a.id;
    perform public._conq_release(a);
    insert into public.conq_events (season_id, attempt_id, type, actor_id, country_iso, score, created_at)
      values (a.season_id, a.id, 'expired', a.user_id, a.country_iso, v_total, a.expires_at) on conflict do nothing;
  end if;
end $$;

-- ── Clasificación y cierre ─────────────────────────────────────────────────────────────────────────────────
/** Territorios y suma de marcas por jugador de la plantilla; empates comparten puesto (1, 1, 3) */
create or replace function public._conq_standings(p_season uuid) returns jsonb language sql stable security definer set search_path = public as $$
  with s as (select roster from public.conq_seasons where id = p_season),
  r as (
    select (e->>'user_id')::uuid as user_id, e->>'name' as name, (e->>'slot')::integer as slot, e->>'avatar' as avatar
      from s, jsonb_array_elements(coalesce(s.roster, '[]'::jsonb)) e
  ),
  c as (
    select r.*, count(t.country_iso)::integer as territories, coalesce(sum(t.defense), 0)::integer as defense_sum
      from r left join public.conq_territories t on t.season_id = p_season and t.owner_id = r.user_id
     group by r.user_id, r.name, r.slot, r.avatar
  )
  select coalesce(jsonb_agg(jsonb_build_object('user_id', user_id, 'name', name, 'slot', slot, 'avatar', avatar,
      'territories', territories, 'defense_sum', defense_sum,
      'rank', 1 + (select count(*) from c c2 where c2.territories > c.territories or (c2.territories = c.territories and c2.defense_sum > c.defense_sum)))
      order by territories desc, defense_sum desc, name), '[]'::jsonb)
    from c
$$;

create or replace function public._conq_territories_json(p_season uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('iso', t.country_iso, 'owner_id', t.owner_id, 'retired', t.retired,
      'defense', t.defense, 'version', t.version, 'captured_at', t.captured_at,
      'reserved_until', case when t.reserved_by is not null and t.reserved_until > public._conq_now() then t.reserved_until end)
      order by array_position(public._conq_catalog(), t.country_iso)), '[]'::jsonb)
    from public.conq_territories t where t.season_id = p_season
$$;

/** Cierre único de la temporada: intentos pendientes, instantánea, insignia de campeón y sala de la siguiente */
create or replace function public._conq_close(p_season uuid) returns void language plpgsql security definer set search_path = public as $$
declare
  s public.conq_seasons; x record; v_st jsonb; v_admin uuid;
begin
  select * into s from public.conq_seasons where id = p_season for update;
  if s.id is null or s.status <> 'active' or public._conq_now() < s.ends_at then return; end if;
  for x in select id from public.conq_attempts where season_id = s.id and status = 'active' loop
    perform public._conq_touch_attempt(x.id);
  end loop;
  v_st := public._conq_standings(s.id);
  insert into public.conq_closes (season_id, standings, territories, closed_at)
    values (s.id, v_st, public._conq_territories_json(s.id), s.ends_at)
  on conflict (season_id) do nothing;
  insert into public.conq_awards (season_id, user_id, rank, award)
    select s.id, (e->>'user_id')::uuid, (e->>'rank')::integer, 'champion'
      from jsonb_array_elements(v_st) e
     where (e->>'rank')::integer = 1 and (e->>'territories')::integer > 0
       and exists (select 1 from auth.users u where u.id = (e->>'user_id')::uuid)
  on conflict do nothing;
  insert into public.user_badges (user_id, badge_id)
    select user_id, 'conq_champion' from public.conq_awards where season_id = s.id
  on conflict do nothing;
  update public.conq_seasons set status = 'closed' where id = s.id;
  insert into public.conq_events (season_id, type, created_at) values (s.id, 'season_close', s.ends_at) on conflict do nothing;
  -- La siguiente temporada vuelve a sala de espera y requiere confirmar participación
  insert into public.conq_seasons (group_id, number, status, rules)
    values (s.group_id, s.number + 1, 'lobby', public._conq_rules()) on conflict (group_id, number) do nothing;
  select admin_id into v_admin from public.conq_groups where id = s.group_id;
  if v_admin is not null then
    insert into public.conq_confirms (season_id, user_id)
      select id, v_admin from public.conq_seasons where group_id = s.group_id and number = s.number + 1
    on conflict do nothing;
  end if;
end $$;

create or replace function public._conq_touch_season(p_season uuid) returns public.conq_seasons language plpgsql security definer set search_path = public as $$
declare s public.conq_seasons; x record;
begin
  select * into s from public.conq_seasons where id = p_season;
  if s.id is null then return s; end if;
  if s.status = 'active' then
    if public._conq_now() >= s.ends_at then
      perform public._conq_close(s.id);
    else
      for x in select id from public.conq_attempts where season_id = s.id and status = 'active' loop
        perform public._conq_touch_attempt(x.id);
      end loop;
    end if;
    select * into s from public.conq_seasons where id = p_season;
  end if;
  return s;
end $$;

/** Para pg_cron (cada 5 minutos): cierra las temporadas vencidas aunque nadie abra el juego */
create or replace function public.conq_close_due() returns integer language plpgsql security definer set search_path = public as $$
declare x record; v_n integer := 0;
begin
  for x in select id from public.conq_seasons where status = 'active' and ends_at <= public._conq_now() loop
    perform public._conq_close(x.id); v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- ── JSON de respuesta ──────────────────────────────────────────────────────────────────────────────────────
create or replace function public._conq_group_json(p_group uuid, p_user uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare g public.conq_groups; v_season public.conq_seasons; v_last public.conq_seasons; v_admin boolean;
begin
  select * into g from public.conq_groups where id = p_group;
  v_admin := g.admin_id = p_user;
  select * into v_season from public.conq_seasons where group_id = g.id and status in ('lobby', 'active') order by number desc limit 1;
  select * into v_last from public.conq_seasons where group_id = g.id and status = 'closed' order by number desc limit 1;
  return jsonb_build_object(
    'id', g.id, 'name', g.name, 'status', g.status, 'is_admin', v_admin,
    'invite_code', case when v_admin then g.invite_code end,
    'max_players', 5, 'server_now', public._conq_now(),
    'muted', (select muted from public.conq_members where group_id = g.id and user_id = p_user),
    'members', (select coalesce(jsonb_agg(jsonb_build_object('user_id', m.user_id, 'name', p.display_name, 'avatar', p.avatar,
        'role', m.role, 'me', m.user_id = p_user,
        'confirmed', exists (select 1 from public.conq_confirms c where c.season_id = v_season.id and c.user_id = m.user_id))
        order by m.joined_at), '[]'::jsonb)
      from public.conq_members m left join public.profiles p on p.id = m.user_id where m.group_id = g.id),
    'season', case when v_season.id is null then null else jsonb_build_object('id', v_season.id, 'number', v_season.number,
      'status', v_season.status, 'started_at', v_season.started_at, 'ends_at', v_season.ends_at, 'rules', v_season.rules,
      'in_roster', public._conq_in_roster(v_season, p_user)) end,
    'last_closed', case when v_last.id is null then null else jsonb_build_object('id', v_last.id, 'number', v_last.number,
      'closed_at', v_last.ends_at,
      'champions', (select coalesce(jsonb_agg(e->>'name'), '[]'::jsonb) from public.conq_closes k, jsonb_array_elements(k.standings) e
                     where k.season_id = v_last.id and (e->>'rank')::integer = 1 and (e->>'territories')::integer > 0)) end
  );
end $$;

create or replace function public._conq_attempt_json(p_attempt uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare a public.conq_attempts; s public.conq_seasons; t public.conq_territories;
begin
  select * into a from public.conq_attempts where id = p_attempt;
  select * into s from public.conq_seasons where id = a.season_id;
  select * into t from public.conq_territories where season_id = a.season_id and country_iso = a.country_iso;
  return jsonb_build_object(
    'id', a.id, 'season_id', a.season_id, 'country', a.country_iso, 'kind', a.kind, 'status', a.status, 'outcome', a.outcome,
    'started_at', a.started_at, 'first_open_deadline', a.first_open_deadline, 'expires_at', a.expires_at, 'finished_at', a.finished_at,
    'total', case when a.status = 'active' then (select coalesce(sum(points), 0) from public.conq_rounds where attempt_id = a.id) else a.total end,
    'owner_at_start', a.owner_at_start, 'defense_at_start', a.defense_at_start,
    'threshold', coalesce((s.rules->>'threshold')::integer, 2000), 'seconds', coalesce((s.rules->>'seconds')::integer, 15),
    'server_now', public._conq_now(),
    'territory', jsonb_build_object('owner_id', t.owner_id, 'retired', t.retired, 'defense', t.defense, 'version', t.version),
    'rounds', (select jsonb_agg(jsonb_build_object(
        'idx', r.idx,
        -- El lugar solo se conoce al abrir la ronda; la ubicación correcta, al cerrarla
        'place_id', case when r.opened_at is not null then r.place_id end,
        'name', case when r.opened_at is not null then p.name end,
        'opened_at', r.opened_at, 'deadline_at', r.deadline_at, 'closed', r.closed,
        'answer', case when r.closed then jsonb_build_object('lat', r.click_lat, 'lon', r.click_lon, 'time_s', r.time_s,
                    'distance_km', r.distance_km, 'points', r.points) end,
        'correct', case when r.closed then jsonb_build_object('lat', p.lat, 'lon', p.lon) end) order by r.idx)
      from public.conq_rounds r join public.places p on p.id = r.place_id where r.attempt_id = a.id)
  );
end $$;

-- ── Grupos e invitaciones ──────────────────────────────────────────────────────────────────────────────────
create or replace function public.conq_group_create(p_name text, p_request_id text default null) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); v_name text := btrim(coalesce(p_name, '')); v_id uuid; v_season uuid;
begin
  if p_request_id is not null then
    select id into v_id from public.conq_groups where created_by = v_user and client_request_id = p_request_id;
    if v_id is not null then return public._conq_group_json(v_id, v_user); end if;
  end if;
  if char_length(v_name) not between 3 and 30 or not public._quiz_name_ok(v_name) then raise exception 'conq_name_invalid' using errcode = '22023'; end if;
  if (select count(*) from public.conq_members m join public.conq_groups g on g.id = m.group_id and g.status = 'active' where m.user_id = v_user) >= 3 then
    raise exception 'conq_group_limit' using errcode = 'P0001';
  end if;
  perform public._conq_rate(v_user, 'group_create', 10);
  insert into public.conq_groups (name, admin_id, created_by, invite_code, client_request_id)
    values (v_name, v_user, v_user, public._conq_code(), p_request_id) returning id into v_id;
  insert into public.conq_members (group_id, user_id, role) values (v_id, v_user, 'admin');
  insert into public.conq_seasons (group_id, number, status, rules) values (v_id, 1, 'lobby', public._conq_rules()) returning id into v_season;
  insert into public.conq_confirms (season_id, user_id) values (v_season, v_user);
  return public._conq_group_json(v_id, v_user);
end $$;

/** Vista previa de una invitación (también sin sesión): sin la actividad ni los integrantes del grupo */
create or replace function public.conq_invite_preview(p_code text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare g public.conq_groups; v_count integer; v_active boolean; v_admin text; v_member boolean := false;
begin
  select * into g from public.conq_groups where invite_code = upper(btrim(coalesce(p_code, ''))) and status = 'active';
  if g.id is null then raise exception 'conq_invite_invalid' using errcode = 'P0002'; end if;
  select count(*) into v_count from public.conq_members where group_id = g.id;
  v_active := exists (select 1 from public.conq_seasons where group_id = g.id and status = 'active');
  select display_name into v_admin from public.profiles where id = g.admin_id;
  if auth.uid() is not null then v_member := public._conq_is_member(g.id, auth.uid()); end if;
  return jsonb_build_object('group_id', case when v_member then g.id end, 'name', g.name, 'admin_name', v_admin,
    'members_count', v_count, 'max_players', 5, 'already_member', v_member,
    'state', case when v_member then 'member' when v_active then 'season_active' when v_count >= 5 then 'full' else 'open' end);
end $$;

create or replace function public.conq_invite_accept(p_code text) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); g public.conq_groups; v_lobby uuid;
begin
  perform public._conq_rate(v_user, 'invite_accept', 30);
  select * into g from public.conq_groups where invite_code = upper(btrim(coalesce(p_code, ''))) and status = 'active' for update;
  if g.id is null then raise exception 'conq_invite_invalid' using errcode = 'P0002'; end if;
  if public._conq_is_member(g.id, v_user) then return public._conq_group_json(g.id, v_user); end if;
  if exists (select 1 from public.conq_seasons where group_id = g.id and status = 'active') then
    raise exception 'conq_season_active' using errcode = 'P0001';
  end if;
  if (select count(*) from public.conq_members where group_id = g.id) >= 5 then raise exception 'conq_group_full' using errcode = 'P0001'; end if;
  if (select count(*) from public.conq_members m join public.conq_groups gg on gg.id = m.group_id and gg.status = 'active' where m.user_id = v_user) >= 3 then
    raise exception 'conq_group_limit' using errcode = 'P0001';
  end if;
  insert into public.conq_members (group_id, user_id) values (g.id, v_user);
  select id into v_lobby from public.conq_seasons where group_id = g.id and status = 'lobby' order by number desc limit 1;
  if v_lobby is not null then
    insert into public.conq_confirms (season_id, user_id) values (v_lobby, v_user) on conflict do nothing;
    insert into public.conq_events (season_id, type, actor_id) values (v_lobby, 'join', v_user);
  end if;
  return public._conq_group_json(g.id, v_user);
end $$;

create or replace function public.conq_group_state(p_group uuid) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); x record;
begin
  if not public._conq_is_member(p_group, v_user) then raise exception 'conq_not_member' using errcode = '42501'; end if;
  for x in select id from public.conq_seasons where group_id = p_group and status = 'active' loop perform public._conq_touch_season(x.id); end loop;
  return public._conq_group_json(p_group, v_user);
end $$;

create or replace function public.my_conq_groups() returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); x record; v_out jsonb := '[]'::jsonb; s public.conq_seasons; v_st jsonb; v_me jsonb; v_unread integer;
begin
  for x in select g.id, g.name, g.status from public.conq_members m join public.conq_groups g on g.id = m.group_id
            where m.user_id = v_user and g.status = 'active' order by m.joined_at loop
    select * into s from public.conq_seasons where group_id = x.id and status in ('lobby', 'active') order by number desc limit 1;
    if s.status = 'active' then s := public._conq_touch_season(s.id); end if;
    v_me := null; v_unread := 0;
    if s.status = 'active' then
      v_st := public._conq_standings(s.id);
      select e into v_me from jsonb_array_elements(v_st) e where e->>'user_id' = v_user::text;
      select count(*) into v_unread from public.conq_events e
       where e.season_id = s.id and e.actor_id is distinct from v_user and e.type in ('conquered', 'captured', 'join', 'season_start')
         and e.id > coalesce((select last_event_id from public.conq_seen where season_id = s.id and user_id = v_user), 0);
    end if;
    v_out := v_out || jsonb_build_object('id', x.id, 'name', x.name,
      'members_count', (select count(*) from public.conq_members where group_id = x.id),
      'season', case when s.id is null then null else jsonb_build_object('id', s.id, 'number', s.number, 'status', s.status,
        'ends_at', s.ends_at, 'in_roster', public._conq_in_roster(s, v_user)) end,
      'me', v_me, 'unread', v_unread);
  end loop;
  return jsonb_build_object('groups', v_out, 'server_now', public._conq_now());
end $$;

create or replace function public.conq_invite_regenerate(p_group uuid) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account();
begin
  update public.conq_groups set invite_code = public._conq_code() where id = p_group and admin_id = v_user and status = 'active';
  if not found then raise exception 'conq_not_admin' using errcode = '42501'; end if;
  return public._conq_group_json(p_group, v_user);
end $$;

create or replace function public.conq_member_remove(p_group uuid, p_member uuid) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); v_lobby uuid;
begin
  if not exists (select 1 from public.conq_groups where id = p_group and admin_id = v_user and status = 'active') then
    raise exception 'conq_not_admin' using errcode = '42501';
  end if;
  if exists (select 1 from public.conq_seasons where group_id = p_group and status = 'active') then
    raise exception 'conq_season_active' using errcode = 'P0001';
  end if;
  if p_member = v_user then raise exception 'conq_not_allowed' using errcode = 'P0001'; end if;
  delete from public.conq_members where group_id = p_group and user_id = p_member;
  select id into v_lobby from public.conq_seasons where group_id = p_group and status = 'lobby' order by number desc limit 1;
  delete from public.conq_confirms where season_id = v_lobby and user_id = p_member;
  return public._conq_group_json(p_group, v_user);
end $$;

/** Pasa la administración al integrante más antiguo; si no queda nadie, archiva el grupo */
create or replace function public._conq_transfer_admin(p_group uuid, p_leaving uuid) returns void language plpgsql security definer set search_path = public as $$
declare v_next uuid;
begin
  select user_id into v_next from public.conq_members where group_id = p_group and user_id <> p_leaving order by joined_at, user_id limit 1;
  if v_next is null then
    update public.conq_groups set status = 'archived', admin_id = null where id = p_group;
    update public.conq_seasons set status = 'cancelled' where group_id = p_group and status = 'lobby';
  else
    update public.conq_members set role = 'admin' where group_id = p_group and user_id = v_next;
    update public.conq_groups set admin_id = v_next where id = p_group;
    insert into public.conq_confirms (season_id, user_id)
      select id, v_next from public.conq_seasons where group_id = p_group and status = 'lobby' on conflict do nothing;
  end if;
end $$;

/** Salir del grupo (entre temporadas). Durante una temporada no se puede: se silencia y sus marcas siguen */
create or replace function public.conq_group_leave(p_group uuid) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); v_admin boolean;
begin
  if not public._conq_is_member(p_group, v_user) then return jsonb_build_object('left', true); end if;
  if exists (select 1 from public.conq_seasons where group_id = p_group and status = 'active') then
    raise exception 'conq_season_active' using errcode = 'P0001';
  end if;
  select admin_id = v_user into v_admin from public.conq_groups where id = p_group;
  if v_admin then perform public._conq_transfer_admin(p_group, v_user); end if;
  delete from public.conq_members where group_id = p_group and user_id = v_user;
  delete from public.conq_confirms c using public.conq_seasons s where c.season_id = s.id and s.group_id = p_group and s.status = 'lobby' and c.user_id = v_user;
  return jsonb_build_object('left', true);
end $$;

/** Cancelar la sala antes de iniciar: archiva el grupo */
create or replace function public.conq_group_cancel(p_group uuid) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account();
begin
  if not exists (select 1 from public.conq_groups where id = p_group and admin_id = v_user and status = 'active') then
    raise exception 'conq_not_admin' using errcode = '42501';
  end if;
  if exists (select 1 from public.conq_seasons where group_id = p_group and status = 'active') then
    raise exception 'conq_season_active' using errcode = 'P0001';
  end if;
  update public.conq_groups set status = 'archived' where id = p_group;
  update public.conq_seasons set status = 'cancelled' where group_id = p_group and status = 'lobby';
  return jsonb_build_object('cancelled', true);
end $$;

create or replace function public.conq_confirm(p_group uuid, p_on boolean) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); v_lobby uuid;
begin
  if not public._conq_is_member(p_group, v_user) then raise exception 'conq_not_member' using errcode = '42501'; end if;
  select id into v_lobby from public.conq_seasons where group_id = p_group and status = 'lobby' order by number desc limit 1;
  if v_lobby is null then raise exception 'conq_season_active' using errcode = 'P0001'; end if;
  if p_on then insert into public.conq_confirms (season_id, user_id) values (v_lobby, v_user) on conflict do nothing;
  else delete from public.conq_confirms where season_id = v_lobby and user_id = v_user; end if;
  return public._conq_group_json(p_group, v_user);
end $$;

create or replace function public.conq_mute(p_group uuid, p_on boolean) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account();
begin
  update public.conq_members set muted = p_on where group_id = p_group and user_id = v_user;
  if not found then raise exception 'conq_not_member' using errcode = '42501'; end if;
  return public._conq_group_json(p_group, v_user);
end $$;

-- ── Temporada ──────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.conq_season_start(p_group uuid) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user uuid := public._conq_account(); g public.conq_groups; s public.conq_seasons; v_prev uuid;
  v_n integer; v_roster jsonb; v_rules jsonb; v_iso text; v_now timestamptz := public._conq_now();
begin
  select * into g from public.conq_groups where id = p_group for update;
  if g.id is null or g.admin_id is distinct from v_user or g.status <> 'active' then raise exception 'conq_not_admin' using errcode = '42501'; end if;
  if exists (select 1 from public.conq_seasons where group_id = g.id and status = 'active') then raise exception 'conq_season_active' using errcode = 'P0001'; end if;
  select * into s from public.conq_seasons where group_id = g.id and status = 'lobby' order by number desc limit 1 for update;
  if s.id is null then raise exception 'conq_season_active' using errcode = 'P0001'; end if;
  -- Plantilla: integrantes que confirmaron participar, en orden de llegada
  select count(*), jsonb_agg(jsonb_build_object('user_id', m.user_id::text, 'name', p.display_name, 'avatar', p.avatar, 'slot', m.rn - 1) order by m.rn)
    into v_n, v_roster
    from (select m.*, row_number() over (order by m.joined_at, m.user_id) rn
            from public.conq_members m join public.conq_confirms c on c.season_id = s.id and c.user_id = m.user_id
           where m.group_id = g.id) m
    left join public.profiles p on p.id = m.user_id;
  if v_n < 2 then raise exception 'conq_not_enough_players' using errcode = 'P0001'; end if;
  if v_n > 5 then raise exception 'conq_group_full' using errcode = 'P0001'; end if;
  -- Un país sin al menos cinco ciudades verificadas impide iniciar
  foreach v_iso in array public._conq_catalog() loop
    if (select count(*) from public.conq_bank b join public.places p on p.id = b.place_id where b.country_iso = v_iso) < 5 then
      raise exception 'conq_catalog_incomplete' using errcode = 'P0001', detail = v_iso;
    end if;
  end loop;
  v_rules := public._conq_rules() || jsonb_build_object('time_scale', g.qa_time_scale);
  update public.conq_seasons set status = 'active', roster = v_roster, rules = v_rules, catalog = public._conq_catalog(),
    started_at = v_now, ends_at = v_now + make_interval(secs => 7 * public._conq_day_s(v_rules))
   where id = s.id;
  -- Paquete por país: cinco ciudades del banco, primero las que no salieron en la temporada anterior
  select id into v_prev from public.conq_seasons where group_id = g.id and number = s.number - 1;
  foreach v_iso in array public._conq_catalog() loop
    insert into public.conq_packages (season_id, country_iso, place_ids)
      select s.id, v_iso, array_agg(place_id order by o)
        from (select b.place_id, row_number() over (order by
                (select count(*) from public.conq_packages pk where pk.season_id = v_prev and pk.country_iso = v_iso and b.place_id = any (pk.place_ids)),
                md5(s.id::text || b.place_id)) o
                from public.conq_bank b join public.places p on p.id = b.place_id where b.country_iso = v_iso) z
       where o <= 5
    on conflict do nothing;
    insert into public.conq_territories (season_id, country_iso) values (s.id, v_iso) on conflict do nothing;
  end loop;
  insert into public.conq_events (season_id, type, actor_id, created_at) values (s.id, 'season_start', v_user, v_now) on conflict do nothing;
  return public._conq_group_json(g.id, v_user);
end $$;

-- ── Tablero, ficha y actividad ─────────────────────────────────────────────────────────────────────────────
create or replace function public._conq_me(s public.conq_seasons, p_user uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_now timestamptz := public._conq_now(); v_day integer; v_used integer; v_active uuid; v_day_s numeric;
begin
  if s.status <> 'active' then return null; end if;
  v_day := public._conq_day_index(s, v_now); v_day_s := public._conq_day_s(s.rules);
  select count(*) into v_used from public.conq_attempts where season_id = s.id and user_id = p_user and day_index = v_day and status <> 'void';
  select id into v_active from public.conq_attempts where season_id = s.id and user_id = p_user and status = 'active' limit 1;
  return jsonb_build_object('missions_left', greatest(0, (s.rules->>'daily_missions')::integer - v_used),
    'missions_per_day', (s.rules->>'daily_missions')::integer,
    'next_reset_at', s.started_at + make_interval(secs => (v_day + 1) * v_day_s),
    'active_attempt', v_active, 'in_roster', public._conq_in_roster(s, p_user));
end $$;

create or replace function public.conq_map(p_season uuid) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); s public.conq_seasons; v_closed boolean;
begin
  select * into s from public.conq_seasons where id = p_season;
  if s.id is null or not public._conq_is_member(s.group_id, v_user) then raise exception 'conq_not_member' using errcode = '42501'; end if;
  s := public._conq_touch_season(s.id);
  v_closed := s.status = 'closed';
  return jsonb_build_object(
    'season', jsonb_build_object('id', s.id, 'group_id', s.group_id, 'number', s.number, 'status', s.status, 'started_at', s.started_at,
      'ends_at', s.ends_at, 'rules', s.rules, 'catalog', s.catalog),
    'server_now', public._conq_now(),
    'data_version', (select coalesce(max(id), 0) from public.conq_events where season_id = s.id),
    'players', s.roster,
    'territories', case when v_closed then (select territories from public.conq_closes where season_id = s.id) else public._conq_territories_json(s.id) end,
    'standings', case when v_closed then (select standings from public.conq_closes where season_id = s.id) else public._conq_standings(s.id) end,
    'final', v_closed,
    'me', public._conq_me(s, v_user),
    'unread', (select count(*) from public.conq_events e where e.season_id = s.id and e.actor_id is distinct from v_user
                and e.type in ('conquered', 'captured', 'join', 'season_start')
                and e.id > coalesce((select last_event_id from public.conq_seen where season_id = s.id and user_id = v_user), 0)));
end $$;

/** Ficha de un territorio para mí: dueño, marca, reserva y si puedo iniciar (y por qué no) */
create or replace function public.conq_territory(p_season uuid, p_iso text) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user uuid := public._conq_account(); s public.conq_seasons; t public.conq_territories; v_now timestamptz := public._conq_now();
  v_day integer; v_today integer; v_country_today integer; v_last timestamptz; v_cool timestamptz; v_reason text; v_kind text;
begin
  select * into s from public.conq_seasons where id = p_season;
  if s.id is null or not public._conq_is_member(s.group_id, v_user) then raise exception 'conq_not_member' using errcode = '42501'; end if;
  s := public._conq_touch_season(s.id);
  select * into t from public.conq_territories where season_id = s.id and country_iso = upper(p_iso);
  if t.country_iso is null then raise exception 'conq_country_invalid' using errcode = '22023'; end if;
  if s.status = 'active' then
    v_day := public._conq_day_index(s, v_now);
    select count(*), count(*) filter (where country_iso = t.country_iso) into v_today, v_country_today
      from public.conq_attempts where season_id = s.id and user_id = v_user and day_index = v_day and status <> 'void';
    select max(started_at) into v_last from public.conq_attempts where season_id = s.id and user_id = v_user and country_iso = t.country_iso and status <> 'void';
    v_cool := v_last + make_interval(secs => (s.rules->>'cooldown_s')::numeric / greatest(1, (s.rules->>'time_scale')::integer));
  end if;
  v_kind := case when t.owner_id is null and not t.retired then 'capture'
    when exists (select 1 from public.conq_events e where e.season_id = s.id and e.country_iso = t.country_iso and e.prev_owner = v_user and e.type = 'conquered') then 'recover'
    else 'attack' end;
  v_reason := case
    when s.status <> 'active' then 'season_closed'
    when not public._conq_in_roster(s, v_user) then 'not_in_roster'
    when v_now >= s.ends_at - make_interval(secs => (s.rules->>'last_minutes_s')::integer) then 'season_ending'
    when t.owner_id = v_user then 'own_territory'
    when t.reserved_by is not null and t.reserved_until > v_now then 'reserved'
    when exists (select 1 from public.conq_attempts where season_id = s.id and user_id = v_user and status = 'active') then 'attempt_active'
    when v_today >= (s.rules->>'daily_missions')::integer then 'daily_limit'
    when v_country_today >= (s.rules->>'per_country_daily')::integer then 'country_limit'
    when v_cool is not null and v_cool > v_now then 'cooldown'
    end;
  return jsonb_build_object('iso', t.country_iso, 'owner_id', t.owner_id, 'retired', t.retired, 'defense', t.defense,
    'version', t.version, 'reserved_until', case when t.reserved_by is not null and t.reserved_until > v_now then t.reserved_until end,
    'kind', v_kind, 'threshold', coalesce((s.rules->>'threshold')::integer, 2000), 'rounds', 5, 'seconds', 15,
    'can_start', v_reason is null, 'reason', v_reason,
    'cooldown_until', case when v_cool > v_now then v_cool end,
    'my_country_today', coalesce(v_country_today, 0), 'per_country_daily', (s.rules->>'per_country_daily')::integer,
    'me', public._conq_me(s, v_user), 'server_now', v_now);
end $$;

create or replace function public.conq_activity(p_season uuid, p_mine boolean default false, p_before bigint default null, p_limit integer default 30)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); s public.conq_seasons;
begin
  select * into s from public.conq_seasons where id = p_season;
  if s.id is null or not public._conq_is_member(s.group_id, v_user) then raise exception 'conq_not_member' using errcode = '42501'; end if;
  s := public._conq_touch_season(s.id);
  return jsonb_build_object('server_now', public._conq_now(), 'events', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', e.id, 'type', e.type, 'country', e.country_iso, 'actor_id', e.actor_id, 'prev_owner', e.prev_owner, 'new_owner', e.new_owner,
      'score', e.score, 'defense', e.defense, 'at', e.created_at,
      'can_recover', e.type = 'conquered' and e.prev_owner = v_user and s.status = 'active'
        and (select owner_id from public.conq_territories t where t.season_id = s.id and t.country_iso = e.country_iso) is distinct from v_user)
      order by e.id desc), '[]'::jsonb)
    from (select * from public.conq_events e
           where e.season_id = s.id
             -- Lo privado (capturas fallidas, intentos vencidos) solo lo ve quien jugó
             and (e.type not in ('failed', 'expired') or e.actor_id = v_user)
             and (not p_mine or e.actor_id = v_user or e.prev_owner = v_user or e.new_owner = v_user)
             and (p_before is null or e.id < p_before)
           order by e.id desc limit least(greatest(coalesce(p_limit, 30), 1), 100)) e));
end $$;

create or replace function public.conq_mark_seen(p_season uuid, p_event_id bigint) returns void language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); s public.conq_seasons;
begin
  select * into s from public.conq_seasons where id = p_season;
  if s.id is null or not public._conq_is_member(s.group_id, v_user) then raise exception 'conq_not_member' using errcode = '42501'; end if;
  insert into public.conq_seen as k (season_id, user_id, last_event_id) values (s.id, v_user, coalesce(p_event_id, 0))
  on conflict (season_id, user_id) do update set last_event_id = greatest(k.last_event_id, excluded.last_event_id);
end $$;

create or replace function public.conq_standings(p_season uuid) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); s public.conq_seasons; v_closed boolean;
begin
  select * into s from public.conq_seasons where id = p_season;
  if s.id is null or not public._conq_is_member(s.group_id, v_user) then raise exception 'conq_not_member' using errcode = '42501'; end if;
  s := public._conq_touch_season(s.id);
  v_closed := s.status = 'closed';
  return jsonb_build_object('final', v_closed, 'server_now', public._conq_now(), 'ends_at', s.ends_at,
    'data_version', (select coalesce(max(id), 0) from public.conq_events where season_id = s.id),
    'standings', case when v_closed then (select standings from public.conq_closes where season_id = s.id) else public._conq_standings(s.id) end,
    'awards', (select coalesce(jsonb_agg(jsonb_build_object('user_id', user_id, 'rank', rank, 'award', award)), '[]'::jsonb) from public.conq_awards where season_id = s.id),
    'history', (select coalesce(jsonb_agg(jsonb_build_object('season_id', k.season_id, 'number', ss.number, 'closed_at', k.closed_at,
        'champions', (select coalesce(jsonb_agg(e->>'name'), '[]'::jsonb) from jsonb_array_elements(k.standings) e
                       where (e->>'rank')::integer = 1 and (e->>'territories')::integer > 0)) order by ss.number desc), '[]'::jsonb)
      from public.conq_closes k join public.conq_seasons ss on ss.id = k.season_id where ss.group_id = s.group_id));
end $$;

/** Cinco ciudades del país para practicar, fuera del paquete oficial (no consume misiones ni toca el tablero) */
create or replace function public.conq_practice_set(p_season uuid, p_iso text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); s public.conq_seasons;
begin
  select * into s from public.conq_seasons where id = p_season;
  if s.id is null or not public._conq_is_member(s.group_id, v_user) then raise exception 'conq_not_member' using errcode = '42501'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'lat', p.lat, 'lon', p.lon)), '[]'::jsonb)
    from (select b.place_id from public.conq_bank b
           where b.country_iso = upper(p_iso)
             and not exists (select 1 from public.conq_packages pk where pk.season_id = s.id and pk.country_iso = b.country_iso and b.place_id = any (pk.place_ids))
           order by random() limit 5) z
    join public.places p on p.id = z.place_id);
end $$;

-- ── Misión: iniciar, abrir ronda, responder, abandonar, recuperar ──────────────────────────────────────────
create or replace function public.conq_attempt_start(p_season uuid, p_iso text, p_request_id text default null) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user uuid := public._conq_account(); s public.conq_seasons; t public.conq_territories; a public.conq_attempts;
  v_now timestamptz := public._conq_now(); v_day integer; v_ts integer; v_last timestamptz; v_kind text; v_id uuid; x record;
begin
  select * into s from public.conq_seasons where id = p_season;
  if s.id is null or not public._conq_is_member(s.group_id, v_user) then raise exception 'conq_not_member' using errcode = '42501'; end if;
  if p_request_id is not null then
    select * into a from public.conq_attempts where season_id = s.id and user_id = v_user and client_request_id = p_request_id;
    if a.id is not null then perform public._conq_touch_attempt(a.id); return public._conq_attempt_json(a.id); end if;
  end if;
  s := public._conq_touch_season(s.id);
  if s.status <> 'active' then raise exception 'conq_season_closed' using errcode = 'P0001'; end if;
  if not public._conq_in_roster(s, v_user) then raise exception 'conq_not_in_roster' using errcode = '42501'; end if;
  if v_now >= s.ends_at - make_interval(secs => (s.rules->>'last_minutes_s')::integer) then raise exception 'conq_season_ending' using errcode = 'P0001'; end if;
  for x in select id from public.conq_attempts where season_id = s.id and user_id = v_user and status = 'active' loop perform public._conq_touch_attempt(x.id); end loop;
  if exists (select 1 from public.conq_attempts where season_id = s.id and user_id = v_user and status = 'active') then
    raise exception 'conq_attempt_active' using errcode = 'P0001';
  end if;
  -- Reserva exclusiva: el bloqueo de la fila serializa a dos atacantes simultáneos; el segundo no pierde la misión
  select * into t from public.conq_territories where season_id = s.id and country_iso = upper(p_iso) for update;
  if t.country_iso is null then raise exception 'conq_country_invalid' using errcode = '22023'; end if;
  if t.reserved_by is not null then
    perform public._conq_touch_attempt(t.reserved_by);
    select * into t from public.conq_territories where season_id = s.id and country_iso = upper(p_iso) for update;
  end if;
  if t.reserved_by is not null then raise exception 'conq_reserved' using errcode = 'P0001'; end if;
  if t.owner_id = v_user then raise exception 'conq_own_territory' using errcode = 'P0001'; end if;
  v_day := public._conq_day_index(s, v_now);
  v_ts := greatest(1, coalesce((s.rules->>'time_scale')::integer, 1));
  if (select count(*) from public.conq_attempts where season_id = s.id and user_id = v_user and day_index = v_day and status <> 'void') >= (s.rules->>'daily_missions')::integer then
    raise exception 'conq_daily_limit' using errcode = 'P0001';
  end if;
  if (select count(*) from public.conq_attempts where season_id = s.id and user_id = v_user and day_index = v_day and country_iso = t.country_iso and status <> 'void') >= (s.rules->>'per_country_daily')::integer then
    raise exception 'conq_country_limit' using errcode = 'P0001';
  end if;
  select max(started_at) into v_last from public.conq_attempts where season_id = s.id and user_id = v_user and country_iso = t.country_iso and status <> 'void';
  if v_last is not null and v_now < v_last + make_interval(secs => (s.rules->>'cooldown_s')::numeric / v_ts) then
    raise exception 'conq_cooldown' using errcode = 'P0001';
  end if;
  v_kind := case when t.owner_id is null and not t.retired then 'capture'
    when exists (select 1 from public.conq_events e where e.season_id = s.id and e.country_iso = t.country_iso and e.prev_owner = v_user and e.type = 'conquered') then 'recover'
    else 'attack' end;
  insert into public.conq_attempts (season_id, country_iso, user_id, kind, owner_at_start, defense_at_start, version_at_start,
      started_at, first_open_deadline, expires_at, day_index, client_request_id)
    values (s.id, t.country_iso, v_user, v_kind, t.owner_id, t.defense, t.version, v_now,
      v_now + make_interval(secs => (s.rules->>'first_open_s')::integer),
      least(v_now + make_interval(secs => (s.rules->>'reservation_s')::integer), s.ends_at), v_day, p_request_id)
    returning id into v_id;
  insert into public.conq_rounds (attempt_id, idx, place_id)
    select v_id, i, (select place_ids[i] from public.conq_packages where season_id = s.id and country_iso = t.country_iso)
      from generate_series(1, 5) i;
  update public.conq_territories set reserved_by = v_id,
      reserved_until = (select expires_at from public.conq_attempts where id = v_id)
   where season_id = s.id and country_iso = t.country_iso;
  return public._conq_attempt_json(v_id);
end $$;

create or replace function public.conq_round_open(p_attempt uuid, p_idx integer) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); a public.conq_attempts; r public.conq_rounds; s public.conq_seasons; v_now timestamptz := public._conq_now();
begin
  select * into a from public.conq_attempts where id = p_attempt;
  if a.id is null or a.user_id is distinct from v_user then raise exception 'conq_attempt_unavailable' using errcode = 'P0002'; end if;
  perform public._conq_touch_attempt(a.id);
  select * into a from public.conq_attempts where id = p_attempt for update;
  if a.status <> 'active' then return public._conq_attempt_json(a.id); end if;
  select * into r from public.conq_rounds where attempt_id = a.id and idx = p_idx for update;
  if r.attempt_id is null then raise exception 'conq_round_invalid' using errcode = '22023'; end if;
  -- Reabrir (recarga, otra pestaña) no reinicia el reloj
  if r.opened_at is not null then return public._conq_attempt_json(a.id); end if;
  if exists (select 1 from public.conq_rounds where attempt_id = a.id and idx < p_idx and not closed) then
    raise exception 'conq_round_invalid' using errcode = '22023';
  end if;
  select * into s from public.conq_seasons where id = a.season_id;
  update public.conq_rounds set opened_at = v_now,
      deadline_at = least(v_now + make_interval(secs => coalesce((s.rules->>'seconds')::integer, 15)), a.expires_at)
   where attempt_id = a.id and idx = p_idx;
  return public._conq_attempt_json(a.id);
end $$;

create or replace function public.conq_round_answer(p_attempt uuid, p_idx integer, p_lat double precision, p_lon double precision) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user uuid := public._conq_account(); a public.conq_attempts; r public.conq_rounds; v_now timestamptz := public._conq_now();
  v_t numeric; v_km numeric; v_pts integer; v_place record; v_open integer;
begin
  if p_lat is null or p_lon is null or p_lat <> p_lat or p_lon <> p_lon or p_lat not between -90 and 90 or p_lon not between -180 and 180 then
    raise exception 'conq_coord_invalid' using errcode = '22023';
  end if;
  select * into a from public.conq_attempts where id = p_attempt for update;
  if a.id is null or a.user_id is distinct from v_user then raise exception 'conq_attempt_unavailable' using errcode = 'P0002'; end if;
  select * into r from public.conq_rounds where attempt_id = a.id and idx = p_idx for update;
  if r.attempt_id is null then raise exception 'conq_round_invalid' using errcode = '22023'; end if;
  -- Repetir el envío devuelve lo ya aceptado (no cambia la respuesta ni los puntos)
  if r.closed or a.status <> 'active' then return public._conq_attempt_json(a.id); end if;
  if r.opened_at is null then raise exception 'conq_round_invalid' using errcode = '22023'; end if;
  if v_now >= a.expires_at then perform public._conq_touch_attempt(a.id); return public._conq_attempt_json(a.id); end if;
  select lat, lon into v_place from public.places where id = r.place_id;
  v_t := round(extract(epoch from (v_now - r.opened_at))::numeric, 2);
  v_km := round(public.geo_distance_km(p_lat, p_lon, v_place.lat, v_place.lon)::numeric, 1);
  -- Recibida al vencimiento o después: 0 puntos (la coordenada queda registrada)
  v_pts := case when v_now >= r.deadline_at then 0 else public._conq_points(public.geo_distance_km(p_lat, p_lon, v_place.lat, v_place.lon)::numeric, v_t) end;
  update public.conq_rounds set click_lat = p_lat, click_lon = p_lon, received_at = v_now, time_s = v_t, distance_km = v_km,
      points = v_pts, closed = true
   where attempt_id = a.id and idx = p_idx;
  select count(*) into v_open from public.conq_rounds where attempt_id = a.id and not closed;
  if v_open = 0 then perform public._conq_finalize(a.id, v_now); end if;
  return public._conq_attempt_json(a.id);
end $$;

/** Abandono expreso: consume la misión, no conquista y libera el país */
create or replace function public.conq_attempt_abandon(p_attempt uuid) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); a public.conq_attempts;
begin
  select * into a from public.conq_attempts where id = p_attempt for update;
  if a.id is null or a.user_id is distinct from v_user then raise exception 'conq_attempt_unavailable' using errcode = 'P0002'; end if;
  if a.status = 'active' then
    update public.conq_attempts set status = 'abandoned', outcome = 'abandoned', finished_at = public._conq_now(),
        total = (select coalesce(sum(points), 0) from public.conq_rounds where attempt_id = a.id)
     where id = a.id;
    perform public._conq_release(a);
  end if;
  return public._conq_attempt_json(a.id);
end $$;

/** Recuperar el intento (recarga, otra pestaña, volver a la app): mismo intento, mismo reloj */
create or replace function public.conq_attempt_state(p_attempt uuid) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := public._conq_account(); a public.conq_attempts;
begin
  select * into a from public.conq_attempts where id = p_attempt;
  if a.id is null or a.user_id is distinct from v_user then raise exception 'conq_attempt_unavailable' using errcode = 'P0002'; end if;
  perform public._conq_touch_attempt(a.id);
  return public._conq_attempt_json(a.id);
end $$;

-- ── Baja de cuenta: marcas que quedan, nombre anonimizado, administración transferida ──────────────────────
create or replace function public._conq_on_user_delete() returns trigger language plpgsql security definer set search_path = public as $$
declare x record;
begin
  update public.conq_territories set retired = true where owner_id = old.id;
  update public.conq_seasons
     set roster = (select jsonb_agg(case when e->>'user_id' = old.id::text then e || jsonb_build_object('name', null, 'retired', true) else e end)
                     from jsonb_array_elements(roster) e)
   where roster @> jsonb_build_array(jsonb_build_object('user_id', old.id::text));
  for x in select id from public.conq_groups where admin_id = old.id and status = 'active' loop
    perform public._conq_transfer_admin(x.id, old.id);
  end loop;
  return old;
end $$;

drop trigger if exists conq_on_user_delete on auth.users;
create trigger conq_on_user_delete before delete on auth.users for each row execute function public._conq_on_user_delete();

-- ── Título de campeón (cosmético; Fase 9 _cosmetic_badge + conquistador) ───────────────────────────────────
create or replace function public._cosmetic_badge(p_kind text, p_id text)
returns text language sql immutable as $$
  select case p_kind
    when 'title' then case p_id
      when 'viajero' then 'streak_100' when 'leyenda' then 'streak_365'
      when 'veterano' then 'ach_games_2' when 'incansable' then 'ach_games_3'
      when 'francotirador' then 'ach_perfects_2' when 'rayo' then 'ach_fast_2'
      when 'medallista' then 'ach_golds_1' when 'cartografo' then 'ach_golds_2' when 'sabio' then 'ach_golds_3'
      when 'trotamundos' then 'ach_regions_3' when 'memoria' then 'ach_dominated_3' when 'abanderado' then 'ach_flags_3'
      when 'retador' then 'ach_challenges_2' when 'ojeador' then 'ach_mundial_2' when 'elite' then 'ach_sprint_3'
      when 'conquistador' then 'conq_champion'
      end
    when 'frame' then case p_id
      when 'bronze' then 'streak_7' when 'silver' then 'streak_100' when 'gold' then 'streak_365'
      when 'medal' then 'ach_golds_2' when 'flame' then 'ach_combo_3' when 'globe' then 'ach_regions_3'
      when 'sniper' then 'ach_perfects_3' when 'sprint' then 'ach_sprint_2'
      end
  end
$$;
revoke all on function public._cosmetic_badge(text, text) from public, anon, authenticated;

-- ── Permisos ───────────────────────────────────────────────────────────────────────────────────────────────
do $$ declare f text; begin
  foreach f in array array[
    '_conq_rules()', '_conq_catalog()', '_conq_points(numeric, numeric)', '_conq_day_s(jsonb)', '_conq_day_index(public.conq_seasons, timestamptz)',
    '_conq_code()', '_conq_account()', '_conq_rate(uuid, text, integer)', '_conq_in_roster(public.conq_seasons, uuid)', '_conq_is_member(uuid, uuid)',
    '_conq_release(public.conq_attempts)', '_conq_finalize(uuid, timestamptz)', '_conq_touch_attempt(uuid)', '_conq_standings(uuid)',
    '_conq_territories_json(uuid)', '_conq_close(uuid)', '_conq_touch_season(uuid)', '_conq_group_json(uuid, uuid)', '_conq_attempt_json(uuid)',
    '_conq_transfer_admin(uuid, uuid)', '_conq_me(public.conq_seasons, uuid)', '_conq_on_user_delete()', 'conq_close_due()'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;
  foreach f in array array[
    'conq_group_create(text, text)', 'conq_invite_accept(text)', 'conq_group_state(uuid)', 'my_conq_groups()',
    'conq_invite_regenerate(uuid)', 'conq_member_remove(uuid, uuid)', 'conq_group_leave(uuid)', 'conq_group_cancel(uuid)',
    'conq_confirm(uuid, boolean)', 'conq_mute(uuid, boolean)', 'conq_season_start(uuid)', 'conq_map(uuid)', 'conq_territory(uuid, text)',
    'conq_activity(uuid, boolean, bigint, integer)', 'conq_mark_seen(uuid, bigint)', 'conq_standings(uuid)', 'conq_practice_set(uuid, text)',
    'conq_attempt_start(uuid, text, text)', 'conq_round_open(uuid, integer)', 'conq_round_answer(uuid, integer, double precision, double precision)',
    'conq_attempt_abandon(uuid)', 'conq_attempt_state(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
-- _conq_now la usan funciones del cliente indirectamente; no expone nada
revoke all on function public._conq_now() from public, anon, authenticated;
-- La vista previa de una invitación también sin sesión
revoke all on function public.conq_invite_preview(text) from public;
grant execute on function public.conq_invite_preview(text) to anon, authenticated;

-- ── Banco de ciudades (fase C1, supabase/seed/conquest_bank.sql) ───────────────────────────────────────────

-- Ciudades nuevas (las demás ya están en public.places con su id del mundo, co: o ci:)
insert into public.places (id, kind, name, country, lat, lon) values
  ('cq:ar-san-miguel-de-tucuman', 'city', 'San Miguel de Tucumán', 'Argentina', -26.8167, -65.2167),
  ('cq:ar-san-carlos-de-bariloche', 'city', 'San Carlos de Bariloche', 'Argentina', -41.15, -71.3),
  ('cq:br-fortaleza', 'city', 'Fortaleza', 'Brasil', -3.7275, -38.5275),
  ('cq:br-belo-horizonte', 'city', 'Belo Horizonte', 'Brasil', -19.9281, -43.9419),
  ('cq:br-porto-alegre', 'city', 'Porto Alegre', 'Brasil', -30.0328, -51.23),
  ('cq:br-belem', 'city', 'Belém', 'Brasil', -1.4558, -48.5039),
  ('cq:br-florianopolis', 'city', 'Florianópolis', 'Brasil', -27.5933, -48.553),
  ('cq:es-valencia', 'city', 'Valencia', 'España', 39.47, -0.3764),
  ('cq:es-bilbao', 'city', 'Bilbao', 'España', 43.2631, -2.935),
  ('cq:es-malaga', 'city', 'Málaga', 'España', 36.7167, -4.4167),
  ('cq:es-zaragoza', 'city', 'Zaragoza', 'España', 41.65, -0.8833),
  ('cq:es-granada', 'city', 'Granada', 'España', 37.175, -3.6),
  ('cq:es-santiago-de-compostela', 'city', 'Santiago de Compostela', 'España', 42.8805, -8.5457),
  ('cq:es-palma', 'city', 'Palma', 'España', 39.5667, 2.6497),
  ('cq:es-salamanca', 'city', 'Salamanca', 'España', 40.9688, -5.6639),
  ('cq:es-toledo', 'city', 'Toledo', 'España', 39.8667, -4.0333),
  ('cq:fr-toulouse', 'city', 'Toulouse', 'Francia', 43.6044, 1.4433),
  ('cq:fr-niza', 'city', 'Niza', 'Francia', 43.7019, 7.2683),
  ('cq:fr-burdeos', 'city', 'Burdeos', 'Francia', 44.8378, -0.5794),
  ('cq:fr-estrasburgo', 'city', 'Estrasburgo', 'Francia', 48.5733, 7.7522),
  ('cq:fr-lille', 'city', 'Lille', 'Francia', 50.6319, 3.0575),
  ('cq:fr-nantes', 'city', 'Nantes', 'Francia', 47.2172, -1.5539),
  ('cq:fr-montpellier', 'city', 'Montpellier', 'Francia', 43.6109, 3.8772),
  ('cq:fr-rennes', 'city', 'Rennes', 'Francia', 48.1142, -1.6808),
  ('cq:fr-grenoble', 'city', 'Grenoble', 'Francia', 45.1869, 5.7264),
  ('cq:it-turin', 'city', 'Turín', 'Italia', 45.0667, 7.7),
  ('cq:it-venecia', 'city', 'Venecia', 'Italia', 45.4397, 12.3319),
  ('cq:it-bolonia', 'city', 'Bolonia', 'Italia', 44.4939, 11.3428),
  ('cq:it-genova', 'city', 'Génova', 'Italia', 44.4072, 8.9339),
  ('cq:it-palermo', 'city', 'Palermo', 'Italia', 38.1157, 13.3613),
  ('cq:it-bari', 'city', 'Bari', 'Italia', 41.1253, 16.8667),
  ('cq:it-verona', 'city', 'Verona', 'Italia', 45.4386, 10.9928),
  ('cq:it-cagliari', 'city', 'Cagliari', 'Italia', 39.2167, 9.1167)
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;

-- Ciudades reutilizadas: ya deberían estar (mundo, pack Colombia, packs Pro); por si falta alguna migración de packs, se
-- insertan con sus coordenadas oficiales sin tocar las que existan
insert into public.places (id, kind, name, country, lat, lon) values
  ('bogota', 'city', 'Bogotá', 'Colombia', 4.71, -74.07),
  ('medellin', 'city', 'Medellín', 'Colombia', 6.25, -75.56),
  ('cali', 'city', 'Cali', 'Colombia', 3.45, -76.53),
  ('barranquilla', 'city', 'Barranquilla', 'Colombia', 10.96, -74.78),
  ('cartagena', 'city', 'Cartagena', 'Colombia', 10.39, -75.51),
  ('co:santa-marta', 'city', 'Santa Marta', 'Colombia', 11.2361, -74.2017),
  ('co:bucaramanga', 'city', 'Bucaramanga', 'Colombia', 7.1186, -73.1161),
  ('co:cucuta', 'city', 'Cúcuta', 'Colombia', 7.8939, -72.5078),
  ('co:pereira', 'city', 'Pereira', 'Colombia', 4.8144, -75.6947),
  ('co:manizales', 'city', 'Manizales', 'Colombia', 5.0675, -75.51),
  ('co:pasto', 'city', 'Pasto', 'Colombia', 1.21, -77.2747),
  ('co:villavicencio', 'city', 'Villavicencio', 'Colombia', 4.142, -73.6266),
  ('lima', 'city', 'Lima', 'Perú', -12.05, -77.04),
  ('arequipa', 'city', 'Arequipa', 'Perú', -16.41, -71.54),
  ('cusco', 'city', 'Cusco', 'Perú', -13.53, -71.97),
  ('ci:pe-trujillo', 'city', 'Trujillo', 'Perú', -8.12, -79.02),
  ('ci:pe-chiclayo', 'city', 'Chiclayo', 'Perú', -6.7629, -79.8366),
  ('ci:pe-piura', 'city', 'Piura', 'Perú', -5.21, -80.63),
  ('iquitos', 'city', 'Iquitos', 'Perú', -3.75, -73.25),
  ('ci:pe-puno', 'city', 'Puno', 'Perú', -15.833, -70.0333),
  ('ci:pe-huancayo', 'city', 'Huancayo', 'Perú', -12.08, -75.2),
  ('ci:pe-tacna', 'city', 'Tacna', 'Perú', -18, -70.25),
  ('ci:pe-cajamarca', 'city', 'Cajamarca', 'Perú', -7.15, -78.53),
  ('ci:pe-ayacucho', 'city', 'Ayacucho', 'Perú', -13.175, -74.22),
  ('quito', 'city', 'Quito', 'Ecuador', -0.18, -78.47),
  ('guayaquil', 'city', 'Guayaquil', 'Ecuador', -2.17, -79.92),
  ('ci:ec-cuenca', 'city', 'Cuenca', 'Ecuador', -2.9, -79),
  ('ci:ec-manta', 'city', 'Manta', 'Ecuador', -0.98, -80.73),
  ('ci:ec-ambato', 'city', 'Ambato', 'Ecuador', -1.2696, -78.62),
  ('ci:ec-loja', 'city', 'Loja', 'Ecuador', -3.99, -79.21),
  ('ci:ec-esmeraldas', 'city', 'Esmeraldas', 'Ecuador', 0.9304, -79.67),
  ('ci:ec-riobamba', 'city', 'Riobamba', 'Ecuador', -1.67, -78.65),
  ('ci:ec-machala', 'city', 'Machala', 'Ecuador', -3.26, -79.96),
  ('ci:ec-ibarra', 'city', 'Ibarra', 'Ecuador', 0.3604, -78.13),
  ('ci:ec-portoviejo', 'city', 'Portoviejo', 'Ecuador', -1.06, -80.46),
  ('ci:ec-latacunga', 'city', 'Latacunga', 'Ecuador', -0.9296, -78.61),
  ('santiago', 'city', 'Santiago', 'Chile', -33.45, -70.67),
  ('valparaiso', 'city', 'Valparaíso', 'Chile', -33.05, -71.62),
  ('ci:cl-concepcion', 'city', 'Concepción', 'Chile', -36.83, -73.05),
  ('ci:cl-antofagasta', 'city', 'Antofagasta', 'Chile', -23.65, -70.4),
  ('ci:cl-la-serena', 'city', 'La Serena', 'Chile', -29.9, -71.25),
  ('ci:cl-temuco', 'city', 'Temuco', 'Chile', -38.73, -72.58),
  ('ci:cl-puerto-montt', 'city', 'Puerto Montt', 'Chile', -41.47, -72.93),
  ('punta-arenas', 'city', 'Punta Arenas', 'Chile', -53.15, -70.92),
  ('ci:cl-arica', 'city', 'Arica', 'Chile', -18.5, -70.29),
  ('ci:cl-iquique', 'city', 'Iquique', 'Chile', -20.25, -70.13),
  ('ci:cl-valdivia', 'city', 'Valdivia', 'Chile', -39.8217, -73.2331),
  ('ci:cl-calama', 'city', 'Calama', 'Chile', -22.45, -68.92),
  ('buenos-aires', 'city', 'Buenos Aires', 'Argentina', -34.6, -58.38),
  ('cordoba', 'city', 'Córdoba', 'Argentina', -31.42, -64.18),
  ('rosario', 'city', 'Rosario', 'Argentina', -32.95, -60.65),
  ('mendoza', 'city', 'Mendoza', 'Argentina', -32.89, -68.83),
  ('ci:ar-mar-del-plata', 'city', 'Mar del Plata', 'Argentina', -38, -57.58),
  ('ci:ar-salta', 'city', 'Salta', 'Argentina', -24.7834, -65.4166),
  ('ushuaia', 'city', 'Ushuaia', 'Argentina', -54.8, -68.3),
  ('ci:ar-neuquen', 'city', 'Neuquén', 'Argentina', -38.95, -68.06),
  ('ci:ar-santa-fe', 'city', 'Santa Fe', 'Argentina', -31.6239, -60.69),
  ('ci:ar-posadas', 'city', 'Posadas', 'Argentina', -27.3578, -55.8851),
  ('brasilia', 'city', 'Brasilia', 'Brasil', -15.79, -47.88),
  ('sao-paulo', 'city', 'São Paulo', 'Brasil', -23.55, -46.63),
  ('rio-de-janeiro', 'city', 'Río de Janeiro', 'Brasil', -22.91, -43.17),
  ('salvador', 'city', 'Salvador', 'Brasil', -12.97, -38.51),
  ('manaus', 'city', 'Manaus', 'Brasil', -3.12, -60.02),
  ('recife', 'city', 'Recife', 'Brasil', -8.05, -34.87),
  ('curitiba', 'city', 'Curitiba', 'Brasil', -25.43, -49.27),
  ('ciudad-de-mexico', 'city', 'Ciudad de México', 'México', 19.43, -99.13),
  ('guadalajara', 'city', 'Guadalajara', 'México', 20.67, -103.35),
  ('monterrey', 'city', 'Monterrey', 'México', 25.67, -100.31),
  ('puebla', 'city', 'Puebla', 'México', 19.04, -98.21),
  ('cancun', 'city', 'Cancún', 'México', 21.16, -86.85),
  ('ci:mx-tijuana', 'city', 'Tijuana', 'México', 32.502, -117.0819),
  ('ci:mx-merida', 'city', 'Mérida', 'México', 20.9686, -89.6186),
  ('ci:mx-oaxaca', 'city', 'Oaxaca', 'México', 17.0827, -96.67),
  ('ci:mx-acapulco', 'city', 'Acapulco', 'México', 16.85, -99.916),
  ('ci:mx-chihuahua', 'city', 'Chihuahua', 'México', 28.6469, -106.0869),
  ('ci:mx-veracruz', 'city', 'Veracruz', 'México', 19.1773, -96.16),
  ('ci:mx-hermosillo', 'city', 'Hermosillo', 'México', 29.0989, -110.9541),
  ('madrid', 'city', 'Madrid', 'España', 40.42, -3.7),
  ('barcelona', 'city', 'Barcelona', 'España', 41.39, 2.17),
  ('sevilla', 'city', 'Sevilla', 'España', 37.39, -5.98),
  ('paris', 'city', 'París', 'Francia', 48.86, 2.35),
  ('marsella', 'city', 'Marsella', 'Francia', 43.3, 5.37),
  ('lyon', 'city', 'Lyon', 'Francia', 45.76, 4.83),
  ('roma', 'city', 'Roma', 'Italia', 41.9, 12.5),
  ('milan', 'city', 'Milán', 'Italia', 45.46, 9.19),
  ('napoles', 'city', 'Nápoles', 'Italia', 40.85, 14.27),
  ('florencia', 'city', 'Florencia', 'Italia', 43.77, 11.25)
on conflict (id) do nothing;

-- Banco: 12 ciudades por país, en el orden de la lista
insert into public.conq_bank (country_iso, place_id, ord) values
  ('CO', 'bogota', 1),
  ('CO', 'medellin', 2),
  ('CO', 'cali', 3),
  ('CO', 'barranquilla', 4),
  ('CO', 'cartagena', 5),
  ('CO', 'co:santa-marta', 6),
  ('CO', 'co:bucaramanga', 7),
  ('CO', 'co:cucuta', 8),
  ('CO', 'co:pereira', 9),
  ('CO', 'co:manizales', 10),
  ('CO', 'co:pasto', 11),
  ('CO', 'co:villavicencio', 12),
  ('PE', 'lima', 1),
  ('PE', 'arequipa', 2),
  ('PE', 'cusco', 3),
  ('PE', 'ci:pe-trujillo', 4),
  ('PE', 'ci:pe-chiclayo', 5),
  ('PE', 'ci:pe-piura', 6),
  ('PE', 'iquitos', 7),
  ('PE', 'ci:pe-puno', 8),
  ('PE', 'ci:pe-huancayo', 9),
  ('PE', 'ci:pe-tacna', 10),
  ('PE', 'ci:pe-cajamarca', 11),
  ('PE', 'ci:pe-ayacucho', 12),
  ('EC', 'quito', 1),
  ('EC', 'guayaquil', 2),
  ('EC', 'ci:ec-cuenca', 3),
  ('EC', 'ci:ec-manta', 4),
  ('EC', 'ci:ec-ambato', 5),
  ('EC', 'ci:ec-loja', 6),
  ('EC', 'ci:ec-esmeraldas', 7),
  ('EC', 'ci:ec-riobamba', 8),
  ('EC', 'ci:ec-machala', 9),
  ('EC', 'ci:ec-ibarra', 10),
  ('EC', 'ci:ec-portoviejo', 11),
  ('EC', 'ci:ec-latacunga', 12),
  ('CL', 'santiago', 1),
  ('CL', 'valparaiso', 2),
  ('CL', 'ci:cl-concepcion', 3),
  ('CL', 'ci:cl-antofagasta', 4),
  ('CL', 'ci:cl-la-serena', 5),
  ('CL', 'ci:cl-temuco', 6),
  ('CL', 'ci:cl-puerto-montt', 7),
  ('CL', 'punta-arenas', 8),
  ('CL', 'ci:cl-arica', 9),
  ('CL', 'ci:cl-iquique', 10),
  ('CL', 'ci:cl-valdivia', 11),
  ('CL', 'ci:cl-calama', 12),
  ('AR', 'buenos-aires', 1),
  ('AR', 'cordoba', 2),
  ('AR', 'rosario', 3),
  ('AR', 'mendoza', 4),
  ('AR', 'ci:ar-mar-del-plata', 5),
  ('AR', 'cq:ar-san-miguel-de-tucuman', 6),
  ('AR', 'ci:ar-salta', 7),
  ('AR', 'cq:ar-san-carlos-de-bariloche', 8),
  ('AR', 'ushuaia', 9),
  ('AR', 'ci:ar-neuquen', 10),
  ('AR', 'ci:ar-santa-fe', 11),
  ('AR', 'ci:ar-posadas', 12),
  ('BR', 'brasilia', 1),
  ('BR', 'sao-paulo', 2),
  ('BR', 'rio-de-janeiro', 3),
  ('BR', 'salvador', 4),
  ('BR', 'cq:br-fortaleza', 5),
  ('BR', 'cq:br-belo-horizonte', 6),
  ('BR', 'manaus', 7),
  ('BR', 'recife', 8),
  ('BR', 'cq:br-porto-alegre', 9),
  ('BR', 'curitiba', 10),
  ('BR', 'cq:br-belem', 11),
  ('BR', 'cq:br-florianopolis', 12),
  ('MX', 'ciudad-de-mexico', 1),
  ('MX', 'guadalajara', 2),
  ('MX', 'monterrey', 3),
  ('MX', 'puebla', 4),
  ('MX', 'cancun', 5),
  ('MX', 'ci:mx-tijuana', 6),
  ('MX', 'ci:mx-merida', 7),
  ('MX', 'ci:mx-oaxaca', 8),
  ('MX', 'ci:mx-acapulco', 9),
  ('MX', 'ci:mx-chihuahua', 10),
  ('MX', 'ci:mx-veracruz', 11),
  ('MX', 'ci:mx-hermosillo', 12),
  ('ES', 'madrid', 1),
  ('ES', 'barcelona', 2),
  ('ES', 'cq:es-valencia', 3),
  ('ES', 'sevilla', 4),
  ('ES', 'cq:es-bilbao', 5),
  ('ES', 'cq:es-malaga', 6),
  ('ES', 'cq:es-zaragoza', 7),
  ('ES', 'cq:es-granada', 8),
  ('ES', 'cq:es-santiago-de-compostela', 9),
  ('ES', 'cq:es-palma', 10),
  ('ES', 'cq:es-salamanca', 11),
  ('ES', 'cq:es-toledo', 12),
  ('FR', 'paris', 1),
  ('FR', 'marsella', 2),
  ('FR', 'lyon', 3),
  ('FR', 'cq:fr-toulouse', 4),
  ('FR', 'cq:fr-niza', 5),
  ('FR', 'cq:fr-burdeos', 6),
  ('FR', 'cq:fr-estrasburgo', 7),
  ('FR', 'cq:fr-lille', 8),
  ('FR', 'cq:fr-nantes', 9),
  ('FR', 'cq:fr-montpellier', 10),
  ('FR', 'cq:fr-rennes', 11),
  ('FR', 'cq:fr-grenoble', 12),
  ('IT', 'roma', 1),
  ('IT', 'milan', 2),
  ('IT', 'napoles', 3),
  ('IT', 'cq:it-turin', 4),
  ('IT', 'florencia', 5),
  ('IT', 'cq:it-venecia', 6),
  ('IT', 'cq:it-bolonia', 7),
  ('IT', 'cq:it-genova', 8),
  ('IT', 'cq:it-palermo', 9),
  ('IT', 'cq:it-bari', 10),
  ('IT', 'cq:it-verona', 11),
  ('IT', 'cq:it-cagliari', 12)
on conflict (country_iso, place_id) do update set ord = excluded.ord;
