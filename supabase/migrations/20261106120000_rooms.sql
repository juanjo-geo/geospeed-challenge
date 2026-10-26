-- ════════════════════════════════════════════════════════════════════════════
-- Sala en vivo (2026-10-26, bloque S1; diseño en docs/GeoSpeed_Sala_En_Vivo_Diseno.md)
-- Partida simultánea de 2 a 20 jugadores con PIN de 6 números. El servidor fija la hora de inicio y la lista de
-- lugares; cada teléfono calcula por su cuenta cuándo abre y cierra cada ronda (sin Realtime: consultas periódicas a
-- room_state). Los puntos los calcula _score_rounds_v2 (la misma fórmula del juego) con el tipo de partida 'room'.
-- Al terminar, la primera consulta cierra la sala y guarda una partida por jugador (historial, memoria, logros; no
-- entra al ranking mundial: _rank_game_types no incluye 'room').
-- Decisiones de JuanJo: crea salas cualquiera con cuenta registrada, hasta 20, gratis (packs Pro como región solo si
-- el anfitrión es Pro); carrera de puntos; pantalla para proyectar (room_state por PIN sin sesión).
-- Idempotente: se aplica desde el SQL Editor (db push responde 403).
-- ════════════════════════════════════════════════════════════════════════════

-- ── Tipo de partida 'room' + enlace a la sala ──────────────────────────────────────────────────────────────
alter table public.game_results drop constraint if exists game_results_game_type_check;
alter table public.game_results add constraint game_results_game_type_check
  check (game_type in ('classic','daily','timeattack','mundial','speeddemon','training','challenge','duel','sprint','quiz','quiz_free','room'));

create table if not exists public.rooms (
  id                uuid primary key default gen_random_uuid(),
  pin               text not null check (pin ~ '^[1-9][0-9]{5}$'),
  host_id           uuid not null references auth.users (id) on delete cascade,
  host_plays        boolean not null default true,
  status            text not null default 'lobby' check (status in ('lobby', 'playing', 'finished', 'cancelled')),
  mode              text not null,
  difficulty        text not null check (difficulty in ('basic', 'easy', 'medium', 'hard')),
  category          text not null default 'cities' check (category in ('cities', 'flags', 'features', 'monuments', 'divisions')),
  rounds_total      integer not null check (rounds_total in (5, 10, 13)),
  seconds_per_round integer not null check (seconds_per_round in (10, 15, 20)),
  max_players       integer not null default 20 check (max_players between 2 and 20),
  items             jsonb not null,
  client_request_id text,
  created_at        timestamptz not null default now(),
  last_activity     timestamptz not null default now(),
  started_at        timestamptz,
  finished_at       timestamptz,
  next_room_id      uuid references public.rooms (id) on delete set null,
  unique (host_id, client_request_id)
);
-- El PIN es único entre las salas vivas; una sala terminada puede compartirlo con una nueva
create unique index if not exists rooms_pin_live on public.rooms (pin) where status in ('lobby', 'playing');
create index if not exists rooms_pin_recent on public.rooms (pin, created_at desc);
create index if not exists rooms_host on public.rooms (host_id, created_at desc);

create table if not exists public.room_players (
  room_id     uuid not null references public.rooms (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  slot        smallint not null,
  name        text not null check (char_length(name) between 1 and 24),
  avatar      text,
  joined_at   timestamptz not null default now(),
  kicked      boolean not null default false,
  total       integer not null default 0,
  hits        integer not null default 0,      -- aciertos buenos (cercanía ≥ 800)
  time_tenths integer not null default 0,      -- tiempo total respondiendo (desempate)
  answered    integer not null default 0,
  primary key (room_id, user_id),
  unique (room_id, slot)
);

create table if not exists public.room_answers (
  room_id     uuid not null references public.rooms (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  round_no    integer not null,
  click_lat   double precision,
  click_lon   double precision,
  time_s      numeric,
  distance_km numeric,
  base_points integer not null default 0,
  multiplier  numeric,
  combo       integer not null default 0,
  combo_mult  numeric,
  points      integer not null default 0,
  suspicious  boolean not null default false,
  answered_at timestamptz not null default now(),
  primary key (room_id, round_no, user_id)
);

alter table public.game_results add column if not exists room_id uuid references public.rooms (id) on delete set null;

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_answers enable row level security;
revoke all on public.rooms from anon, authenticated;
revoke all on public.room_players from anon, authenticated;
revoke all on public.room_answers from anon, authenticated;

-- ── Constantes de la línea de tiempo (el cliente las recibe en room_state) ────────────────────────────────
create or replace function public._room_countdown_s() returns integer language sql immutable as $$ select 5 $$;
create or replace function public._room_reveal_s() returns integer language sql immutable as $$ select 8 $$;
create or replace function public._room_grace_ms() returns integer language sql immutable as $$ select 1000 $$;

-- Fase de la sala en un instante: lobby · countdown · question · reveal · finished · cancelled.
-- Ronda i (1..N) abre en inicio + cuenta regresiva + (i − 1) × (segundos + revelación) y cierra a los `segundos`.
create or replace function public._room_timeline(
  p_room public.rooms, p_now timestamptz,
  out phase text, out round integer, out opens_at timestamptz, out closes_at timestamptz, out ends_at timestamptz
) language plpgsql stable set search_path = public as $$
declare
  v_slot  double precision := p_room.seconds_per_round + public._room_reveal_s();
  v_t     double precision;
  v_k     integer;
begin
  round := 0;
  if p_room.status = 'cancelled' then phase := 'cancelled'; return; end if;
  if p_room.status = 'lobby' or p_room.started_at is null then phase := 'lobby'; return; end if;
  ends_at := p_room.started_at + make_interval(secs => public._room_countdown_s() + p_room.rounds_total * v_slot);
  v_t := extract(epoch from (p_now - p_room.started_at)) - public._room_countdown_s();
  if p_room.status = 'finished' or p_now >= ends_at then
    phase := 'finished'; round := p_room.rounds_total;
  elsif v_t < 0 then
    phase := 'countdown'; round := 1;
  else
    v_k := least(p_room.rounds_total - 1, floor(v_t / v_slot)::integer);
    round := v_k + 1;
    phase := case when v_t - v_k * v_slot < p_room.seconds_per_round then 'question' else 'reveal' end;
  end if;
  opens_at := p_room.started_at + make_interval(secs => public._room_countdown_s() + (round - 1) * v_slot);
  closes_at := opens_at + make_interval(secs => p_room.seconds_per_round);
end $$;

-- ── PIN de 6 números (no empieza en 0), único entre las salas vivas ───────────────────────────────────────
create or replace function public._room_pin()
returns text language plpgsql volatile set search_path = public as $$
declare v_pin text;
begin
  loop
    v_pin := (100000 + floor(random() * 900000)::integer)::text;
    exit when not exists (select 1 from public.rooms where pin = v_pin and status in ('lobby', 'playing'));
  end loop;
  return v_pin;
end $$;

-- Apodo: 2 a 20 letras, sin groserías; si ya hay uno igual en la sala se agrega un número ("Ana 2")
create or replace function public._room_name(p_room uuid, p_name text, p_user uuid)
returns text language plpgsql stable set search_path = public as $$
declare
  v_base text := left(regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g'), 20);
  v_name text;
  v_n    integer := 1;
begin
  if char_length(v_base) < 2 then raise exception 'room_name_invalid' using errcode = '22023'; end if;
  if not public._quiz_name_ok(v_base) then raise exception 'room_name_invalid' using errcode = '22023'; end if;
  v_name := v_base;
  while exists (select 1 from public.room_players where room_id = p_room and user_id <> p_user and lower(name) = lower(v_name)) loop
    v_n := v_n + 1;
    v_name := v_base || ' ' || v_n;
  end loop;
  return v_name;
end $$;

-- Lugares de la sala validados contra `places` (coordenadas oficiales del servidor)
create or replace function public._room_items(p_items jsonb, p_category text, p_rounds integer)
returns jsonb language plpgsql stable set search_path = public as $$
declare
  v_kind text := case p_category when 'flags' then 'flag' when 'features' then 'feature' when 'monuments' then 'monument'
                                 when 'divisions' then 'division' else 'city' end;
  v_out  jsonb := '[]'::jsonb;
  v_e    jsonb;
  v_pl   record;
  v_n    integer := 0;
  v_seen text[] := '{}';
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) <> p_rounds then
    raise exception 'room_items_invalid' using errcode = '22023';
  end if;
  for v_e in select value from jsonb_array_elements(p_items) loop
    select id, kind, name, country, lat, lon into v_pl from public.places where id = v_e->>'id';
    if v_pl.id is null or v_pl.kind <> v_kind or v_pl.id = any (v_seen) then
      raise exception 'room_items_invalid' using errcode = '22023';
    end if;
    v_seen := v_seen || v_pl.id;
    v_n := v_n + 1;
    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'n', v_n, 'id', v_pl.id, 'kind', v_pl.kind, 'name', v_pl.name, 'country', v_pl.country, 'lat', v_pl.lat, 'lon', v_pl.lon));
  end loop;
  return v_out;
end $$;

-- Valida modo, categoría y configuración; los packs Pro solo para anfitriones Pro
create or replace function public._room_check_settings(p jsonb, p_host uuid)
returns void language plpgsql stable set search_path = public as $$
declare
  v_mode text := p->>'mode';
  v_cat  text := coalesce(p->>'category', 'cities');
begin
  if v_mode is null or v_mode not in ('world', 'europe', 'asia', 'americas', 'africa', 'colombia', 'andes', 'conosur', 'mexcam', 'caribe') then
    raise exception 'room_settings_invalid' using errcode = '22023';
  end if;
  if v_mode in ('colombia', 'andes', 'conosur', 'mexcam', 'caribe') then
    if v_cat not in ('cities', 'divisions', 'features', 'monuments') then raise exception 'room_settings_invalid' using errcode = '22023'; end if;
  elsif v_cat not in ('cities', 'flags', 'features', 'monuments') then
    raise exception 'room_settings_invalid' using errcode = '22023';
  end if;
  if v_mode in ('andes', 'conosur', 'mexcam', 'caribe') and not public._is_pro(p_host) then
    raise exception 'room_pro_required' using errcode = '42501';
  end if;
end $$;

-- ── Cierre: al pasar la última ronda se guarda una partida por jugador (una sola vez) ───────────────────────
create or replace function public._room_finalize(p_room uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_room   public.rooms;
  v_tl     record;
  v_pl     record;
  v_arr    jsonb;
  v_sc     record;
  v_id     uuid;
  v_r      jsonb;
  v_avg    numeric;
begin
  select * into v_room from public.rooms where id = p_room for update;
  if v_room.id is null or v_room.status <> 'playing' then return; end if;
  select * into v_tl from public._room_timeline(v_room, now());
  if v_tl.phase <> 'finished' then return; end if;

  update public.rooms set status = 'finished', finished_at = v_tl.ends_at, last_activity = now() where id = p_room;

  for v_pl in
    select p.user_id from public.room_players p
     where p.room_id = p_room and not p.kicked and p.answered > 0
  loop
    -- Todas las rondas, las no respondidas sin toque: el mismo cálculo que hizo room_answer ronda a ronda
    select coalesce(jsonb_agg(jsonb_build_object(
             'round_no', (it->>'n')::integer, 'place_id', it->>'id', 'city_name', it->>'name', 'city_country', it->>'country',
             'city_lat', (it->>'lat')::double precision, 'city_lon', (it->>'lon')::double precision,
             'click_lat', a.click_lat, 'click_lon', a.click_lon,
             'time_s', coalesce(a.time_s, v_room.seconds_per_round)) order by (it->>'n')::integer), '[]'::jsonb)
      into v_arr
      from jsonb_array_elements(v_room.items) it
      left join public.room_answers a on a.room_id = p_room and a.user_id = v_pl.user_id and a.round_no = (it->>'n')::integer;
    select * into v_sc from public._score_rounds_v2(v_arr, v_room.mode, v_room.difficulty, 'room');
    v_id := null;
    select avg(distance_km) into v_avg from public.room_answers
     where room_id = p_room and user_id = v_pl.user_id and click_lat is not null;

    insert into public.game_results (
      user_id, game_type, mode, difficulty, score, rounds_played, rounds_total, avg_distance_km, end_reason,
      is_record, client_id, scoring_version, suspicious, category, offline, room_id
    ) values (
      v_pl.user_id, 'room', v_room.mode, v_room.difficulty, greatest(0, least(5000000, v_sc.total)),
      (select count(*) from public.room_answers where room_id = p_room and user_id = v_pl.user_id and click_lat is not null),
      v_room.rounds_total, round(v_avg, 1), 'complete', false, 'room:' || p_room, 2,
      v_sc.suspicious or exists (select 1 from public.room_answers where room_id = p_room and user_id = v_pl.user_id and suspicious),
      v_room.category, false, p_room
    ) on conflict (user_id, client_id) do nothing
    returning id into v_id;
    continue when v_id is null;

    for v_r in select value from jsonb_array_elements(v_sc.rounds) loop
      insert into public.game_rounds (
        result_id, round_no, place_id, city_name, city_country, city_lat, city_lon,
        click_lat, click_lon, distance_km, time_s, base_points, multiplier, points, combo, combo_mult
      ) values (
        v_id, (v_r->>'round_no')::integer, v_r->>'place_id', coalesce(v_r->>'city_name', '?'), v_r->>'city_country',
        (v_r->>'city_lat')::double precision, (v_r->>'city_lon')::double precision,
        (v_r->>'click_lat')::double precision, (v_r->>'click_lon')::double precision,
        (v_r->>'distance_km')::numeric, (v_r->>'time_s')::numeric, (v_r->>'base_points')::integer,
        (v_r->>'multiplier')::numeric, coalesce((v_r->>'points')::integer, 0), (v_r->>'combo')::integer, (v_r->>'combo_mult')::numeric
      ) on conflict (result_id, round_no) do nothing;
    end loop;

    if not (select suspicious from public.game_results where id = v_id) then
      begin
        perform public._memory_record(v_pl.user_id, v_id);
      exception when others then
        raise warning 'memory record failed: %', sqlerrm;
      end;
    end if;
  end loop;
end $$;

-- Mantenimiento perezoso: una sala en espera sin actividad por 30 min se cancela
create or replace function public._room_touch(p_room public.rooms)
returns public.rooms language plpgsql security definer set search_path = public as $$
declare v_room public.rooms := p_room;
begin
  if v_room.status = 'lobby' and v_room.last_activity < now() - interval '30 minutes' then
    update public.rooms set status = 'cancelled' where id = v_room.id returning * into v_room;
  elsif v_room.status = 'playing' then
    perform public._room_finalize(v_room.id);
    select * into v_room from public.rooms where id = v_room.id;
  end if;
  return v_room;
end $$;

-- ── Estado completo de la sala (jugadores, anfitrión y pantalla para proyectar) ─────────────────────────────
-- Por id (jugadores) o por PIN (unirse, espectador, pantalla TV; también sin sesión). Las preguntas llegan solo
-- hasta la ronda en curso; las coordenadas de la respuesta, solo de las rondas ya cerradas.
create or replace function public.room_state(p_id uuid default null, p_pin text default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user    uuid := auth.uid();
  v_room    public.rooms;
  v_tl      record;
  v_me      public.room_players;
  v_closed  integer;
  v_shown   integer;
  v_players jsonb;
  v_reveal  jsonb := null;
  v_next    jsonb := null;
  v_host    text;
begin
  if p_id is not null then
    select * into v_room from public.rooms where id = p_id;
  elsif p_pin is not null then
    select * into v_room from public.rooms where pin = btrim(p_pin)
     order by (status in ('lobby', 'playing')) desc, created_at desc limit 1;
    if v_room.id is not null and v_room.status not in ('lobby', 'playing') and v_room.created_at < now() - interval '1 day' then
      v_room := null;
    end if;
  end if;
  if v_room.id is null then
    raise exception 'room_unavailable' using errcode = 'P0002';
  end if;
  v_room := public._room_touch(v_room);
  -- El anfitrión mirando su sala de espera la mantiene viva
  if v_user = v_room.host_id and v_room.status = 'lobby' and v_room.last_activity < now() - interval '1 minute' then
    update public.rooms set last_activity = now() where id = v_room.id;
  end if;
  select * into v_tl from public._room_timeline(v_room, now());
  if v_user is not null then
    select * into v_me from public.room_players where room_id = v_room.id and user_id = v_user;
  end if;

  -- Rondas cerradas: las que ya pasaron su cierre (incluida la que está en revelación)
  v_closed := case v_tl.phase when 'reveal' then v_tl.round when 'question' then v_tl.round - 1
                              when 'finished' then v_room.rounds_total else 0 end;
  -- La pregunta siguiente llega durante la cuenta regresiva o la revelación anterior, para que todos los teléfonos la
  -- muestren justo al abrir la ronda (la pantalla no la enseña antes)
  v_shown := case v_tl.phase when 'countdown' then 1 when 'question' then v_tl.round
                             when 'reveal' then least(v_tl.round + 1, v_room.rounds_total)
                             when 'finished' then v_room.rounds_total else 0 end;

  select coalesce(jsonb_agg(jsonb_build_object(
           'slot', p.slot, 'name', p.name, 'avatar', p.avatar, 'total', p.total, 'hits', p.hits, 'answered', p.answered,
           'is_host', p.user_id = v_room.host_id, 'me', coalesce(p.user_id = v_user, false),
           'answered_now', exists (select 1 from public.room_answers a where a.room_id = v_room.id and a.user_id = p.user_id and a.round_no = v_tl.round),
           'rank', p.rk) order by p.rk), '[]'::jsonb)
    into v_players
    from (select q.*, rank() over (order by q.total desc, q.time_tenths asc, q.hits desc) as rk
            from public.room_players q where q.room_id = v_room.id and not q.kicked) p;

  -- Revelación: los toques de todos en la última ronda cerrada
  if v_closed > 0 and v_tl.phase in ('reveal', 'finished') then
    select jsonb_build_object('round', v_closed, 'clicks', coalesce(jsonb_agg(jsonb_build_object(
             'slot', p.slot, 'name', p.name, 'lat', a.click_lat, 'lon', a.click_lon, 'km', a.distance_km,
             'base', a.base_points, 'points', a.points, 'time_s', a.time_s, 'me', coalesce(p.user_id = v_user, false)) order by a.points desc), '[]'::jsonb))
      into v_reveal
      from public.room_answers a join public.room_players p on p.room_id = a.room_id and p.user_id = a.user_id and not p.kicked
     where a.room_id = v_room.id and a.round_no = v_closed and a.click_lat is not null;
  end if;

  if v_room.next_room_id is not null then
    select jsonb_build_object('id', n.id, 'pin', n.pin, 'status', n.status) into v_next from public.rooms n where n.id = v_room.next_room_id;
  end if;
  select display_name into v_host from public.profiles where id = v_room.host_id;

  return jsonb_build_object(
    'id', v_room.id, 'pin', v_room.pin, 'status', v_room.status,
    'phase', v_tl.phase, 'round', v_tl.round, 'opens_at', v_tl.opens_at, 'closes_at', v_tl.closes_at, 'ends_at', v_tl.ends_at,
    'server_now', now(), 'started_at', v_room.started_at,
    'settings', jsonb_build_object('mode', v_room.mode, 'difficulty', v_room.difficulty, 'category', v_room.category,
      'rounds_total', v_room.rounds_total, 'seconds', v_room.seconds_per_round, 'max_players', v_room.max_players,
      'countdown', public._room_countdown_s(), 'reveal', public._room_reveal_s(), 'host_plays', v_room.host_plays),
    'host_name', coalesce(nullif(v_host, ''), (select name from public.room_players where room_id = v_room.id and user_id = v_room.host_id)),
    'i_am_host', v_user is not null and v_user = v_room.host_id,
    'i_am_player', v_me.user_id is not null and not v_me.kicked,
    'kicked', coalesce(v_me.kicked, false),
    'players', v_players,
    'player_count', jsonb_array_length(v_players),
    'answered_count', (select count(*) from public.room_answers a join public.room_players p on p.room_id = a.room_id and p.user_id = a.user_id
                        where a.room_id = v_room.id and a.round_no = v_tl.round and not p.kicked),
    'items', (select coalesce(jsonb_agg(case when (it->>'n')::integer <= v_closed then it else it - 'lat' - 'lon' end
                                        order by (it->>'n')::integer), '[]'::jsonb)
                from jsonb_array_elements(v_room.items) it where (it->>'n')::integer <= v_shown),
    'reveal', v_reveal,
    'me', case when v_me.user_id is null then null else jsonb_build_object(
      'slot', v_me.slot, 'name', v_me.name, 'total', v_me.total,
      'answers', (select coalesce(jsonb_agg(jsonb_build_object('round', a.round_no, 'lat', a.click_lat, 'lon', a.click_lon,
                    'time_s', a.time_s, 'km', a.distance_km, 'base', a.base_points, 'points', a.points, 'combo', a.combo,
                    'combo_mult', a.combo_mult) order by a.round_no), '[]'::jsonb)
                    from public.room_answers a where a.room_id = v_room.id and a.user_id = v_user)) end,
    'next_room', v_next
  );
end $$;

-- ── Crear sala (cuenta registrada) ────────────────────────────────────────────────────────────────────────
create or replace function public.room_create(p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_anon   boolean;
  v_room   public.rooms;
  v_rounds integer := coalesce((p->>'rounds_total')::integer, 10);
  v_name   text;
  v_req    text := nullif(p->>'client_request_id', '');
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select coalesce(u.is_anonymous, false) into v_anon from auth.users u where u.id = v_user;
  if v_anon is null or v_anon then raise exception 'room_account_required' using errcode = '42501'; end if;

  if v_req is not null then
    select * into v_room from public.rooms where host_id = v_user and client_request_id = v_req;
    if v_room.id is not null then return public.room_state(v_room.id); end if;
  end if;

  perform public._room_check_settings(p, v_user);
  if (select count(*) from public.rooms where host_id = v_user and created_at > now() - interval '1 day') >= 20 then
    raise exception 'room_limit' using errcode = 'P0001';
  end if;
  -- Una sola sala en espera por anfitrión: las anteriores se cancelan
  update public.rooms set status = 'cancelled' where host_id = v_user and status = 'lobby';

  insert into public.rooms (pin, host_id, host_plays, mode, difficulty, category, rounds_total, seconds_per_round,
                            max_players, items, client_request_id)
  values (public._room_pin(), v_user, coalesce((p->>'host_plays')::boolean, true), p->>'mode', coalesce(p->>'difficulty', 'basic'),
          coalesce(p->>'category', 'cities'), v_rounds, coalesce((p->>'seconds_per_round')::integer, 15),
          least(20, greatest(2, coalesce((p->>'max_players')::integer, 20))),
          public._room_items(p->'items', coalesce(p->>'category', 'cities'), v_rounds), v_req)
  returning * into v_room;

  if v_room.host_plays then
    select display_name into v_name from public.profiles where id = v_user;
    insert into public.room_players (room_id, user_id, slot, name, avatar)
    values (v_room.id, v_user, 1,
            public._room_name(v_room.id, coalesce(nullif(btrim(coalesce(p->>'name', '')), ''), nullif(v_name, ''), 'Anfitrión'), v_user),
            (select avatar from public.profiles where id = v_user));
  end if;
  return public.room_state(v_room.id);
end $$;

-- ── Entrar con el PIN (invitados también: sesión anónima) ─────────────────────────────────────────────────
create or replace function public.room_join(p_pin text, p_name text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_room public.rooms;
  v_me   public.room_players;
  v_slot smallint;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_room from public.rooms where pin = btrim(p_pin) and status in ('lobby', 'playing')
   order by created_at desc limit 1 for update;
  if v_room.id is null then raise exception 'room_unavailable' using errcode = 'P0002'; end if;
  v_room := public._room_touch(v_room);

  select * into v_me from public.room_players where room_id = v_room.id and user_id = v_user;
  if v_me.user_id is not null then
    if v_me.kicked then raise exception 'room_kicked' using errcode = '42501'; end if;
    return public.room_state(v_room.id); -- volver a entrar no duplica (y retoma la partida en curso)
  end if;
  if v_room.status <> 'lobby' then raise exception 'room_started' using errcode = 'P0001'; end if;
  if (select count(*) from public.room_players where room_id = v_room.id and not kicked) >= v_room.max_players then
    raise exception 'room_full' using errcode = 'P0001';
  end if;

  select coalesce(max(slot), 0) + 1 into v_slot from public.room_players where room_id = v_room.id;
  insert into public.room_players (room_id, user_id, slot, name, avatar)
  values (v_room.id, v_user, v_slot, public._room_name(v_room.id, p_name, v_user), (select avatar from public.profiles where id = v_user));
  update public.rooms set last_activity = now() where id = v_room.id;
  return public.room_state(v_room.id);
end $$;

-- ── Empezar (solo el anfitrión, 2 jugadores o más) ────────────────────────────────────────────────────────
create or replace function public.room_start(p_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_room public.rooms;
begin
  select * into v_room from public.rooms where id = p_id for update;
  if v_room.id is null or v_room.host_id is distinct from auth.uid() then raise exception 'room_unavailable' using errcode = 'P0002'; end if;
  if v_room.status = 'playing' then return public.room_state(p_id); end if;
  if v_room.status <> 'lobby' then raise exception 'room_unavailable' using errcode = 'P0002'; end if;
  if (select count(*) from public.room_players where room_id = p_id and not kicked) < 2 then
    raise exception 'room_not_enough_players' using errcode = 'P0001';
  end if;
  update public.rooms set status = 'playing', started_at = now(), last_activity = now() where id = p_id;
  return public.room_state(p_id);
end $$;

-- ── Responder la ronda en curso ───────────────────────────────────────────────────────────────────────────
-- Tiempo usado = el mayor entre el del teléfono y el que mide el servidor menos 1 s (mentir da como mucho 1 s).
-- Los puntos salen de _score_rounds_v2 sobre las rondas 1..N del jugador (las no respondidas sin toque), así el
-- combo y la rapidez son exactamente los de la fórmula del juego.
create or replace function public.room_answer(p_id uuid, p_round integer, p_lat double precision, p_lon double precision, p_time_s numeric)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user    uuid := auth.uid();
  v_room    public.rooms;
  v_tl      record;
  v_me      public.room_players;
  v_elapsed numeric;
  v_time    numeric;
  v_arr     jsonb;
  v_sc      record;
  v_last    jsonb;
  v_ans     public.room_answers;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_room from public.rooms where id = p_id;
  if v_room.id is null then raise exception 'room_unavailable' using errcode = 'P0002'; end if;
  select * into v_me from public.room_players where room_id = p_id and user_id = v_user;
  if v_me.user_id is null or v_me.kicked then raise exception 'room_not_player' using errcode = '42501'; end if;

  -- Ya respondida: se devuelve lo guardado (reintentos por la red)
  select * into v_ans from public.room_answers where room_id = p_id and user_id = v_user and round_no = p_round;
  if v_ans.round_no is not null then
    return jsonb_build_object('round', v_ans.round_no, 'km', v_ans.distance_km, 'base', v_ans.base_points, 'points', v_ans.points,
      'combo', v_ans.combo, 'combo_mult', v_ans.combo_mult, 'time_s', v_ans.time_s, 'total', v_me.total, 'repeat', true);
  end if;

  select * into v_tl from public._room_timeline(v_room, now());
  if v_room.status <> 'playing' or p_round <> v_tl.round or v_tl.phase not in ('question', 'reveal')
     or now() > v_tl.closes_at + make_interval(secs => public._room_grace_ms() / 1000.0) then
    raise exception 'room_round_closed' using errcode = 'P0001';
  end if;
  if p_lat is null or p_lon is null or p_lat not between -90 and 90 or p_lon not between -540 and 540 then
    raise exception 'room_answer_invalid' using errcode = '22023';
  end if;

  v_elapsed := extract(epoch from (now() - v_tl.opens_at));
  v_time := least(v_room.seconds_per_round, greatest(0, coalesce(p_time_s, v_elapsed), v_elapsed - 1));

  select coalesce(jsonb_agg(jsonb_build_object(
           'round_no', (it->>'n')::integer, 'place_id', it->>'id', 'city_name', it->>'name', 'city_country', it->>'country',
           'city_lat', (it->>'lat')::double precision, 'city_lon', (it->>'lon')::double precision,
           'click_lat', case when (it->>'n')::integer = p_round then p_lat else a.click_lat end,
           'click_lon', case when (it->>'n')::integer = p_round then p_lon else a.click_lon end,
           'time_s', case when (it->>'n')::integer = p_round then v_time else coalesce(a.time_s, v_room.seconds_per_round) end)
           order by (it->>'n')::integer), '[]'::jsonb)
    into v_arr
    from jsonb_array_elements(v_room.items) it
    left join public.room_answers a on a.room_id = p_id and a.user_id = v_user and a.round_no = (it->>'n')::integer
   where (it->>'n')::integer <= p_round;
  select * into v_sc from public._score_rounds_v2(v_arr, v_room.mode, v_room.difficulty, 'room');
  v_last := v_sc.rounds -> (jsonb_array_length(v_sc.rounds) - 1);

  insert into public.room_answers (room_id, user_id, round_no, click_lat, click_lon, time_s, distance_km, base_points,
                                   multiplier, combo, combo_mult, points, suspicious)
  values (p_id, v_user, p_round, p_lat, p_lon, (v_last->>'time_s')::numeric, (v_last->>'distance_km')::numeric,
          (v_last->>'base_points')::integer, (v_last->>'multiplier')::numeric, (v_last->>'combo')::integer,
          (v_last->>'combo_mult')::numeric, (v_last->>'points')::integer, (v_last->>'time_s')::numeric < 0.3)
  on conflict do nothing
  returning * into v_ans;
  if v_ans.round_no is null then
    return public.room_answer(p_id, p_round, p_lat, p_lon, p_time_s); -- otra petición igual ganó la carrera
  end if;

  update public.room_players
     set total = total + v_ans.points, answered = answered + 1,
         hits = hits + case when v_ans.base_points >= 800 then 1 else 0 end,
         time_tenths = time_tenths + round(v_ans.time_s * 10)::integer
   where room_id = p_id and user_id = v_user
  returning * into v_me;

  return jsonb_build_object('round', v_ans.round_no, 'km', v_ans.distance_km, 'base', v_ans.base_points, 'points', v_ans.points,
    'combo', v_ans.combo, 'combo_mult', v_ans.combo_mult, 'time_s', v_ans.time_s, 'total', v_me.total, 'repeat', false);
end $$;

-- ── Salir, sacar a alguien, cancelar ──────────────────────────────────────────────────────────────────────
create or replace function public.room_leave(p_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_room public.rooms;
begin
  select * into v_room from public.rooms where id = p_id for update;
  if v_room.id is null then return; end if;
  if v_room.host_id = auth.uid() and v_room.status = 'lobby' then
    update public.rooms set status = 'cancelled' where id = p_id;      -- el anfitrión que sale de la espera la cancela
  elsif v_room.status = 'lobby' then
    delete from public.room_players where room_id = p_id and user_id = auth.uid();  -- libera el cupo
    update public.rooms set last_activity = now() where id = p_id;
  end if;
  -- En partida no se borra nada: el jugador puede volver mientras dure
end $$;

create or replace function public.room_kick(p_id uuid, p_slot integer)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_room public.rooms;
begin
  select * into v_room from public.rooms where id = p_id;
  if v_room.id is null or v_room.host_id is distinct from auth.uid() or v_room.status not in ('lobby', 'playing') then
    raise exception 'room_unavailable' using errcode = 'P0002';
  end if;
  update public.room_players set kicked = true where room_id = p_id and slot = p_slot and user_id <> v_room.host_id;
  return public.room_state(p_id);
end $$;

create or replace function public.room_cancel(p_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  update public.rooms set status = 'cancelled'
   where id = p_id and host_id = auth.uid() and status in ('lobby', 'playing');
end $$;

-- ── Otra ronda: sala nueva con la misma configuración y los mismos jugadores (ya adentro) ─────────────────
create or replace function public.room_rematch(p_id uuid, p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_room public.rooms;
  v_new  public.rooms;
begin
  select * into v_room from public.rooms where id = p_id for update;
  if v_room.id is null or v_room.host_id is distinct from auth.uid() then raise exception 'room_unavailable' using errcode = 'P0002'; end if;
  v_room := public._room_touch(v_room);
  if v_room.next_room_id is not null then return public.room_state(v_room.next_room_id); end if;
  if v_room.status <> 'finished' then raise exception 'room_unavailable' using errcode = 'P0002'; end if;

  update public.rooms set status = 'cancelled' where host_id = v_room.host_id and status = 'lobby';
  insert into public.rooms (pin, host_id, host_plays, mode, difficulty, category, rounds_total, seconds_per_round,
                            max_players, items, client_request_id)
  values (public._room_pin(), v_room.host_id, v_room.host_plays, v_room.mode, v_room.difficulty, v_room.category,
          v_room.rounds_total, v_room.seconds_per_round, v_room.max_players,
          public._room_items(p->'items', v_room.category, v_room.rounds_total), 'rematch:' || p_id)
  returning * into v_new;
  insert into public.room_players (room_id, user_id, slot, name, avatar)
  select v_new.id, user_id, row_number() over (order by slot), name, avatar
    from public.room_players where room_id = p_id and not kicked;
  update public.rooms set next_room_id = v_new.id where id = p_id;
  return public.room_state(v_new.id);
end $$;

-- ── Limpieza (para pg_cron; también segura de correr a mano) ──────────────────────────────────────────────
create or replace function public.cleanup_stale_rooms()
returns integer language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  update public.rooms set status = 'cancelled' where status = 'lobby' and last_activity < now() - interval '30 minutes';
  -- Partidas que nadie consultó al terminar: se cierran (y se guardan) igual
  perform public._room_finalize(id) from public.rooms where status = 'playing' and started_at < now() - interval '30 minutes';
  delete from public.rooms where status in ('finished', 'cancelled') and created_at < now() - interval '30 days';
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- ── Permisos ──────────────────────────────────────────────────────────────────────────────────────────────
revoke all on function public._room_timeline(public.rooms, timestamptz) from public, anon, authenticated;
revoke all on function public._room_pin() from public, anon, authenticated;
revoke all on function public._room_name(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public._room_items(jsonb, text, integer) from public, anon, authenticated;
revoke all on function public._room_check_settings(jsonb, uuid) from public, anon, authenticated;
revoke all on function public._room_finalize(uuid) from public, anon, authenticated;
revoke all on function public._room_touch(public.rooms) from public, anon, authenticated;
revoke all on function public.cleanup_stale_rooms() from public, anon, authenticated;
revoke all on function public.room_state(uuid, text) from public;
grant execute on function public.room_state(uuid, text) to anon, authenticated;
revoke all on function public.room_create(jsonb) from public, anon;
revoke all on function public.room_join(text, text) from public, anon;
revoke all on function public.room_start(uuid) from public, anon;
revoke all on function public.room_answer(uuid, integer, double precision, double precision, numeric) from public, anon;
revoke all on function public.room_leave(uuid) from public, anon;
revoke all on function public.room_kick(uuid, integer) from public, anon;
revoke all on function public.room_cancel(uuid) from public, anon;
revoke all on function public.room_rematch(uuid, jsonb) from public, anon;
grant execute on function public.room_create(jsonb) to authenticated;
grant execute on function public.room_join(text, text) to authenticated;
grant execute on function public.room_start(uuid) to authenticated;
grant execute on function public.room_answer(uuid, integer, double precision, double precision, numeric) to authenticated;
grant execute on function public.room_leave(uuid) to authenticated;
grant execute on function public.room_kick(uuid, integer) to authenticated;
grant execute on function public.room_cancel(uuid) to authenticated;
grant execute on function public.room_rematch(uuid, jsonb) to authenticated;
