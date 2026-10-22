-- ════════════════════════════════════════════════════════════════════════════
-- Fase 5 — Sprint, el modo competitivo (docs/GeoSpeed_Plan_Competencia.md §1)
--
-- Carreras asíncronas de 10 ciudades contra la partida grabada de un rival con Puntos Sprint (PS) parecidos,
-- jugadas como la carrera contra el fantasma (fase 3). Decisiones de JuanJo (2026-10-22): cuenta registrada +
-- 5 partidas para entrar; el aviso al rival es dentro del juego (push después, con Firebase); el país se elige
-- en el perfil; primera temporada "Sprint Andes" del 26-10-2026 al 20-12-2026 (antes, una pretemporada que se
-- reinicia a 1.000 al empezar Andes).
--
--   · PS: todos arrancan en 1.000. Elo con K = 40 en las 10 primeras carreras y luego 20.
--   · Divisiones: Ciudad < 1.100 · Región 1.100 · País 1.300 · Continente 1.500 · Mundo 1.700.
--   · Temporadas de 8 semanas; al cerrar, PS = 1.000 + (PS − 1.000) × 0,5 e insignia con la división más
--     alta alcanzada (sprint_awards). El cambio de temporada es perezoso: se aplica a cada jugador en su
--     siguiente consulta (no hace falta pg_cron).
--   · Cupo: 5 carreras al día (día de Colombia); +3 el día que se gana el hito de 7 días de racha; Pro sin límite.
--     La carrera cuenta al buscar rival; abandonarla (30 min sin terminar) es derrota.
--   · Rival: partida de otro jugador de la temporada con PS a ±100 (se abre a ±200, ±400 y cualquiera), que no
--     hayas enfrentado, usada como máximo 3 veces. Sin rivales (arranque) se usa una partida real del Clásico
--     de otro jugador ("partida de la casa"): sus primeras 10 ciudades, recalculadas con las reglas del Sprint;
--     a su dueño no le cambian los PS. Con rival real, sus PS también cambian y lo ve en su bandeja.
--   · El servidor calcula todo: puntaje (save_game_result), resultado, PS y cupo. Una carrera sospechosa
--     (respuestas en < 0,3 s) o con ciudades ajenas no cuenta.
-- Reglas del juego: mundo, 15 s por ciudad, sin multiplicador de dificultad (×1,0), igual para los dos.
-- ════════════════════════════════════════════════════════════════════════════

-- Nuevo tipo de partida (no entra al ranking de ciudades: _rank_game_types = classic/daily/challenge)
alter table public.game_results drop constraint if exists game_results_game_type_check;
alter table public.game_results add constraint game_results_game_type_check
  check (game_type in ('classic','daily','timeattack','mundial','speeddemon','training','challenge','duel','sprint'));

-- País del jugador (ISO-3166 alfa-2) para el ranking por país
alter table public.profiles add column if not exists country text;

-- ── Tablas (solo se leen y escriben por las funciones de abajo) ─────────────
create table if not exists public.sprint_seasons (
  id         integer primary key,
  name       text not null,
  starts_on  date not null,
  ends_on    date not null,
  preseason  boolean not null default false
);
insert into public.sprint_seasons (id, name, starts_on, ends_on, preseason) values
  (0, 'Pretemporada', date '2026-10-01', date '2026-10-25', true),
  (1, 'Sprint Andes', date '2026-10-26', date '2026-12-20', false)
on conflict (id) do nothing;

create table if not exists public.sprint_players (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  points       integer not null default 1000,
  games        integer not null default 0,
  season_id    integer not null default 0,
  season_games integer not null default 0,
  peak_points  integer not null default 1000,
  wins         integer not null default 0,
  losses       integer not null default 0,
  draws        integer not null default 0,
  day          date,
  day_used     integer not null default 0,
  updated_at   timestamptz not null default now()
);

create table if not exists public.sprint_runs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users (id) on delete cascade,
  is_house         boolean not null default false,
  source_result_id uuid references public.game_results (id) on delete cascade,
  season_id        integer not null,
  cities           jsonb not null,
  rounds           jsonb not null,
  score            integer not null,
  points_at        integer not null,
  uses             integer not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists sprint_runs_pool_idx on public.sprint_runs (season_id, points_at) where not is_house;

create table if not exists public.sprint_matches (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references auth.users (id) on delete cascade,
  run_id        uuid references public.sprint_runs (id) on delete set null,
  opponent_id   uuid references auth.users (id) on delete set null,
  opp_name      text,
  opp_avatar    text,
  opp_country   text,
  season_id     integer not null,
  cities        jsonb not null,
  opp_rounds    jsonb not null,
  opp_score     integer not null,
  opp_points    integer not null,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  result_id     uuid references public.game_results (id) on delete set null,
  my_score      integer,
  outcome       text check (outcome in ('win','loss','draw','void')),
  points_before integer,
  points_after  integer,
  delta         integer,
  opp_delta     integer,
  opp_seen      boolean not null default true
);
create index if not exists sprint_matches_player_idx on public.sprint_matches (player_id, started_at desc);
create index if not exists sprint_matches_inbox_idx on public.sprint_matches (opponent_id) where not opp_seen;

create table if not exists public.sprint_awards (
  user_id     uuid not null references auth.users (id) on delete cascade,
  season_id   integer not null,
  division    text not null,
  peak_points integer not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, season_id)
);

alter table public.sprint_seasons enable row level security;
alter table public.sprint_players enable row level security;
alter table public.sprint_runs    enable row level security;
alter table public.sprint_matches enable row level security;
alter table public.sprint_awards  enable row level security;
revoke all on public.sprint_seasons, public.sprint_players, public.sprint_runs, public.sprint_matches, public.sprint_awards from anon, authenticated;

-- ── Ayudantes ───────────────────────────────────────────────────────────────
create or replace function public._sprint_division(p_points integer)
returns text language sql immutable as $$
  select case when p_points >= 1700 then 'mundo' when p_points >= 1500 then 'continente'
              when p_points >= 1300 then 'pais' when p_points >= 1100 then 'region' else 'ciudad' end
$$;

-- Temporada que cubre el día; si ya pasó la última, crea las siguientes (8 semanas, nombres latinoamericanos)
create or replace function public._sprint_season(p_day date)
returns public.sprint_seasons language plpgsql security definer set search_path = public as $$
declare
  v_s     public.sprint_seasons;
  v_last  public.sprint_seasons;
  v_names text[] := array['Sprint Andes','Sprint Caribe','Sprint Amazonía','Sprint Pacífico','Sprint Patagonia',
                          'Sprint Altiplano','Sprint Orinoquía','Sprint Sierra Madre'];
begin
  loop
    select * into v_s from public.sprint_seasons where starts_on <= p_day and ends_on >= p_day order by id desc limit 1;
    if found then return v_s; end if;
    select * into v_last from public.sprint_seasons order by id desc limit 1;
    if p_day < (select min(starts_on) from public.sprint_seasons) then
      select * into v_s from public.sprint_seasons order by id asc limit 1;
      return v_s;
    end if;
    insert into public.sprint_seasons (id, name, starts_on, ends_on)
    values (v_last.id + 1, v_names[((v_last.id) % array_length(v_names, 1)) + 1], v_last.ends_on + 1, v_last.ends_on + 56)
    on conflict (id) do nothing;
  end loop;
end $$;

-- Fila del jugador al día: crea la fila, aplica el cambio de temporada (compresión e insignia, o reinicio al
-- salir de la pretemporada) y reinicia el cupo diario
create or replace function public._sprint_player(p_user uuid, p_today date)
returns public.sprint_players language plpgsql security definer set search_path = public as $$
declare
  v_season public.sprint_seasons := public._sprint_season(p_today);
  v_old    public.sprint_seasons;
  v        public.sprint_players;
  v_n      integer;
begin
  insert into public.sprint_players (user_id, season_id, day) values (p_user, v_season.id, p_today)
  on conflict (user_id) do nothing;
  select * into v from public.sprint_players where user_id = p_user for update;
  if v.season_id <> v_season.id then
    select * into v_old from public.sprint_seasons where id = v.season_id;
    if coalesce(v_old.preseason, true) then
      v.points := 1000;
    else
      if v.season_games > 0 then
        insert into public.sprint_awards (user_id, season_id, division, peak_points)
        values (p_user, v_old.id, public._sprint_division(v.peak_points), v.peak_points)
        on conflict do nothing;
      end if;
      v_n := greatest(1, v_season.id - v.season_id);
      v.points := 1000 + round((v.points - 1000) * power(0.5, v_n))::integer;
    end if;
    v.season_id := v_season.id;
    v.season_games := 0;
    v.peak_points := v.points;
  end if;
  if v.day is distinct from p_today then
    v.day := p_today;
    v.day_used := 0;
  end if;
  update public.sprint_players
     set points = v.points, season_id = v.season_id, season_games = v.season_games, peak_points = v.peak_points,
         day = v.day, day_used = v.day_used, updated_at = now()
   where user_id = p_user;
  return v;
end $$;

-- Cupo del día: null = sin límite (Pro); 5, o 8 el día que se ganó el hito de 7 días de racha
create or replace function public._sprint_limit(p_user uuid, p_today date)
returns integer language plpgsql stable security definer set search_path = public as $$
begin
  if public._is_pro(p_user) then return null; end if;
  return 5 + case when exists (
    select 1 from public.user_badges b
     where b.user_id = p_user and b.badge_id = 'streak_7' and public.game_day(b.earned_at) = p_today
  ) then 3 else 0 end;
end $$;

-- ¿Puede jugar? Cuenta registrada (no invitado) y 5 partidas normales
create or replace function public._sprint_games_played(p_user uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.game_results
   where user_id = p_user and game_type in ('classic','daily','challenge','timeattack','mundial','speeddemon')
$$;
create or replace function public._sprint_registered(p_user uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select coalesce((select not coalesce(u.is_anonymous, false) from auth.users u where u.id = p_user), false)
$$;

-- Cierra una carrera: resultado, Elo del jugador y (si el rival es real) del dueño de la partida.
-- p_forfeit: carrera abandonada = derrota aunque el rival haya sacado 0
create or replace function public._sprint_finish(p_match uuid, p_score integer, p_void boolean, p_result uuid, p_forfeit boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_today date := public.game_day(now());
  m       public.sprint_matches;
  v       public.sprint_players;
  o       public.sprint_players;
  v_s     numeric;
  v_e     numeric;
  v_k     integer;
  v_d     integer;
  v_od    integer := null;
  v_out   text;
begin
  select * into m from public.sprint_matches where id = p_match for update;
  if not found or m.finished_at is not null then return; end if;
  v := public._sprint_player(m.player_id, v_today);

  if p_void then
    update public.sprint_matches
       set finished_at = now(), outcome = 'void', my_score = p_score, result_id = p_result,
           points_before = v.points, points_after = v.points, delta = 0
     where id = p_match;
    return;
  end if;

  v_s := case when p_forfeit then 0 when p_score > m.opp_score then 1 when p_score < m.opp_score then 0 else 0.5 end;
  v_out := case v_s when 1 then 'win' when 0 then 'loss' else 'draw' end;
  v_e := 1 / (1 + power(10::numeric, (m.opp_points - v.points) / 400.0));
  v_k := case when v.games < 10 then 40 else 20 end;
  v_d := round(v_k * (v_s - v_e))::integer;

  update public.sprint_players
     set points = greatest(0, points + v_d), games = games + 1, season_games = season_games + 1,
         peak_points = greatest(peak_points, points + v_d),
         wins = wins + (v_out = 'win')::integer, losses = losses + (v_out = 'loss')::integer, draws = draws + (v_out = 'draw')::integer,
         updated_at = now()
   where user_id = m.player_id;

  -- Rival real de esta temporada: sus PS también cambian (con su propio K) y lo verá en su bandeja
  if m.opponent_id is not null then
    o := public._sprint_player(m.opponent_id, v_today);
    if o.season_id = m.season_id then
      v_od := round((case when o.games < 10 then 40 else 20 end)
                    * ((1 - v_s) - 1 / (1 + power(10::numeric, (v.points - o.points) / 400.0))))::integer;
      update public.sprint_players
         set points = greatest(0, points + v_od), peak_points = greatest(peak_points, points + v_od), updated_at = now()
       where user_id = m.opponent_id;
    end if;
  end if;

  update public.sprint_matches
     set finished_at = now(), outcome = v_out, my_score = p_score, result_id = p_result,
         points_before = v.points, points_after = greatest(0, v.points + v_d), delta = v_d,
         opp_delta = v_od, opp_seen = (v_od is null)
   where id = p_match;
end $$;

-- Carreras abandonadas (más de 30 min sin terminar): derrota
create or replace function public._sprint_expire(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  for v_id in
    select id from public.sprint_matches
     where player_id = p_user and finished_at is null and started_at < now() - interval '30 minutes'
  loop
    perform public._sprint_finish(v_id, 0, false, null, true);
  end loop;
end $$;

-- Partida de la casa: las primeras 10 ciudades de una partida real del Clásico de otro jugador, recalculadas
-- con las reglas del Sprint (mundo, ×1,0)
create or replace function public._sprint_house_run(p_user uuid, p_points integer, p_season integer)
returns public.sprint_runs language plpgsql security definer set search_path = public as $$
declare
  v_src    record;
  v_input  jsonb;
  v_cities jsonb;
  v_scored record;
  v_run    public.sprint_runs;
begin
  -- Primero, una partida de la casa ya armada que este jugador no haya enfrentado
  select r.* into v_run from public.sprint_runs r
   where r.is_house and r.season_id = p_season and r.user_id is distinct from p_user
     and not exists (select 1 from public.sprint_matches m where m.player_id = p_user and m.run_id = r.id)
   order by random() limit 1;
  if found then return v_run; end if;

  select g.id, g.user_id into v_src from public.game_results g
   where g.user_id <> p_user and g.game_type in ('classic','daily','challenge') and not g.suspicious and g.mode = 'world'
     and (select count(*) from public.game_rounds x
           where x.result_id = g.id and x.place_id is not null and x.click_lat is not null and x.round_no <= 10) = 10
     and not exists (select 1 from public.sprint_runs s where s.source_result_id = g.id and s.season_id = p_season)
   order by random() limit 1;
  if v_src.id is null then return null; end if;

  select jsonb_agg(jsonb_build_object(
           'round_no', x.round_no, 'place_id', x.place_id, 'city_name', x.city_name, 'city_country', x.city_country,
           'city_lat', x.city_lat, 'city_lon', x.city_lon, 'click_lat', x.click_lat, 'click_lon', x.click_lon,
           'time_s', x.time_s) order by x.round_no),
         jsonb_agg(jsonb_build_object(
           'n', x.round_no, 'id', x.place_id, 'name', x.city_name, 'country', x.city_country, 'iso', null,
           'lat', x.city_lat, 'lon', x.city_lon) order by x.round_no)
    into v_input, v_cities
    from public.game_rounds x where x.result_id = v_src.id and x.round_no <= 10;

  select * into v_scored from public._score_rounds_v2(v_input, 'world', 'basic', 'sprint');
  insert into public.sprint_runs (user_id, is_house, source_result_id, season_id, cities, rounds, score, points_at)
  values (v_src.user_id, true, v_src.id, p_season, v_cities,
          (select jsonb_agg(jsonb_build_object('round_no', e->'round_no', 'time_s', e->'time_s', 'click_lat', e->'click_lat',
                    'click_lon', e->'click_lon', 'distance_km', e->'distance_km', 'points', e->'points'))
             from jsonb_array_elements(v_scored.rounds) e),
          v_scored.total, p_points)
  returning * into v_run;
  return v_run;
end $$;

create or replace function public._sprint_match_json(m public.sprint_matches)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'match_id', m.id, 'cities', m.cities, 'started_at', m.started_at,
    'opponent', jsonb_build_object('name', coalesce(nullif(m.opp_name, ''), 'Explorador'), 'avatar', m.opp_avatar,
                 'country', m.opp_country, 'points', m.opp_points, 'division', public._sprint_division(m.opp_points),
                 'house', m.opponent_id is null),
    'opp_rounds', m.opp_rounds, 'opp_score', m.opp_score)
$$;

-- ── RPC: estado del jugador ─────────────────────────────────────────────────
create or replace function public.sprint_status()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_today  date := public.game_day(now());
  v_reg    boolean;
  v_games  integer;
  v_season public.sprint_seasons;
  v_next   public.sprint_seasons;
  v        public.sprint_players;
  v_limit  integer;
  v_pend   public.sprint_matches;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  v_reg := public._sprint_registered(v_user);
  v_games := public._sprint_games_played(v_user);
  v_season := public._sprint_season(v_today);
  if v_season.preseason then
    select * into v_next from public.sprint_seasons where id = v_season.id + 1;
  end if;
  if not (v_reg and v_games >= 5) then
    return jsonb_build_object('unlocked', false, 'registered', v_reg, 'games_played', v_games, 'games_needed', 5,
      'season', jsonb_build_object('id', v_season.id, 'name', v_season.name, 'ends_on', v_season.ends_on, 'preseason', v_season.preseason,
                                   'next_name', v_next.name, 'next_starts_on', v_next.starts_on),
      'points', 1000, 'division', 'ciudad');
  end if;

  perform public._sprint_expire(v_user);
  v := public._sprint_player(v_user, v_today);
  v_limit := public._sprint_limit(v_user, v_today);
  select * into v_pend from public.sprint_matches where player_id = v_user and finished_at is null limit 1;

  return jsonb_build_object(
    'unlocked', true, 'registered', true, 'games_played', v_games, 'games_needed', 5,
    'season', jsonb_build_object('id', v_season.id, 'name', v_season.name, 'ends_on', v_season.ends_on, 'preseason', v_season.preseason,
                                 'next_name', v_next.name, 'next_starts_on', v_next.starts_on),
    'points', v.points, 'division', public._sprint_division(v.points), 'peak_points', v.peak_points,
    'games', v.games, 'season_games', v.season_games, 'wins', v.wins, 'losses', v.losses, 'draws', v.draws,
    'day_used', v.day_used, 'day_limit', v_limit, 'pro', v_limit is null,
    'country', (select country from public.profiles where id = v_user),
    'pending_match', case when v_pend.id is null then null else v_pend.id end,
    'inbox', coalesce((select jsonb_agg(jsonb_build_object(
                 'match_id', m.id, 'name', coalesce(nullif(p.display_name, ''), 'Explorador'), 'avatar', p.avatar,
                 'outcome', case m.outcome when 'win' then 'loss' when 'loss' then 'win' else m.outcome end,
                 'delta', m.opp_delta, 'my_score', m.opp_score, 'their_score', m.my_score, 'at', m.finished_at)
               order by m.finished_at desc)
               from (select * from public.sprint_matches where opponent_id = v_user and not opp_seen
                      order by finished_at desc limit 10) m
               left join public.profiles p on p.id = m.player_id), '[]'::jsonb),
    'awards', coalesce((select jsonb_agg(jsonb_build_object('season', s.name, 'division', a.division, 'peak', a.peak_points) order by a.season_id desc)
               from public.sprint_awards a join public.sprint_seasons s on s.id = a.season_id where a.user_id = v_user), '[]'::jsonb)
  );
end $$;

-- ── RPC: buscar rival (cuenta como carrera del día) ─────────────────────────
-- p_rematch_of: revancha desde la bandeja (una carrera en la que me ganaron): se enfrenta la partida de ese jugador
create or replace function public.sprint_find_match(p_rematch_of uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user  uuid := auth.uid();
  v_today date := public.game_day(now());
  v       public.sprint_players;
  v_limit integer;
  v_m     public.sprint_matches;
  v_run   public.sprint_runs;
  v_range integer;
  v_owner public.sprint_players;
  v_prof  record;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if not (public._sprint_registered(v_user) and public._sprint_games_played(v_user) >= 5) then
    raise exception 'sprint_locked' using errcode = 'P0001';
  end if;
  perform public._sprint_expire(v_user);
  v := public._sprint_player(v_user, v_today);

  -- Una carrera empezada y sin terminar (se recargó la app): la misma, sin contar otra vez
  select * into v_m from public.sprint_matches where player_id = v_user and finished_at is null limit 1;
  if found then return public._sprint_match_json(v_m); end if;

  v_limit := public._sprint_limit(v_user, v_today);
  if v_limit is not null and v.day_used >= v_limit then
    raise exception 'sprint_limit' using errcode = 'P0001';
  end if;

  if p_rematch_of is not null then
    select r.* into v_run from public.sprint_runs r
      join public.sprint_matches m on m.result_id = r.source_result_id
     where m.id = p_rematch_of and m.opponent_id = v_user and r.season_id = v.season_id
       and not exists (select 1 from public.sprint_matches x where x.player_id = v_user and x.run_id = r.id);
    if v_run.id is null then raise exception 'sprint_rematch_unavailable' using errcode = 'P0001'; end if;
  end if;

  foreach v_range in array array[100, 200, 400, 100000] loop
    exit when v_run.id is not null;
    select r.* into v_run from public.sprint_runs r
     where not r.is_house and r.season_id = v.season_id and r.user_id <> v_user and r.uses < 3
       and r.created_at > now() - interval '30 days'
       and abs(r.points_at - v.points) <= v_range
       and not exists (select 1 from public.sprint_matches m where m.player_id = v_user and m.run_id = r.id)
     order by abs(r.points_at - v.points), random() limit 1;
    exit when found;
  end loop;
  if v_run.id is null then
    v_run := public._sprint_house_run(v_user, v.points, v.season_id);
  end if;
  if v_run.id is null then raise exception 'sprint_no_opponent' using errcode = 'P0001'; end if;

  update public.sprint_runs set uses = uses + 1 where id = v_run.id;
  select display_name, avatar, country into v_prof from public.profiles where id = v_run.user_id;
  if not v_run.is_house then
    v_owner := public._sprint_player(v_run.user_id, v_today);
  end if;

  insert into public.sprint_matches (player_id, run_id, opponent_id, opp_name, opp_avatar, opp_country, season_id,
                                     cities, opp_rounds, opp_score, opp_points)
  values (v_user, v_run.id, case when v_run.is_house then null else v_run.user_id end,
          v_prof.display_name, v_prof.avatar, v_prof.country, v.season_id, v_run.cities, v_run.rounds, v_run.score,
          case when v_run.is_house then v.points else v_owner.points end)
  returning * into v_m;
  update public.sprint_players set day_used = day_used + 1 where user_id = v_user;
  return public._sprint_match_json(v_m);
end $$;

-- ── RPC: entregar la carrera ────────────────────────────────────────────────
create or replace function public.sprint_submit(p_match uuid, p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user  uuid := auth.uid();
  m       public.sprint_matches;
  v_res   uuid;
  v_score integer;
  v_susp  boolean;
  v_bad   boolean;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into m from public.sprint_matches where id = p_match and player_id = v_user;
  if not found then raise exception 'sprint_unavailable' using errcode = 'P0002'; end if;

  if m.finished_at is null then
    if m.started_at < now() - interval '30 minutes' then
      perform public._sprint_finish(p_match, 0, false, null, true);
    else
      -- El puntaje lo calcula save_game_result (y alimenta la memoria de lugares); reglas fijas del Sprint
      v_res := public.save_game_result(coalesce(p, '{}'::jsonb) || jsonb_build_object(
        'game_type', 'sprint', 'mode', 'world', 'difficulty', 'basic', 'rounds_total', jsonb_array_length(m.cities),
        'seed', null, 'challenge_id', null));
      select score, suspicious into v_score, v_susp from public.game_results where id = v_res;
      -- Solo cuentan las ciudades de esta carrera
      select exists (
        select 1 from public.game_rounds g where g.result_id = v_res
           and (g.place_id is null or not exists (select 1 from jsonb_array_elements(m.cities) c where c->>'id' = g.place_id))
      ) into v_bad;
      perform public._sprint_finish(p_match, coalesce(v_score, 0), coalesce(v_susp, false) or v_bad, v_res);
      -- Mi partida entra al grupo de rivales de esta temporada (mismas ciudades)
      if not (coalesce(v_susp, false) or v_bad) then
        insert into public.sprint_runs (user_id, source_result_id, season_id, cities, rounds, score, points_at)
        select v_user, v_res, m.season_id, m.cities,
               coalesce((select jsonb_agg(jsonb_build_object('round_no', g.round_no, 'time_s', g.time_s, 'click_lat', g.click_lat,
                         'click_lon', g.click_lon, 'distance_km', g.distance_km, 'points', g.points) order by g.round_no)
                  from public.game_rounds g where g.result_id = v_res), '[]'::jsonb),
               coalesce(v_score, 0), (select points_before from public.sprint_matches where id = p_match)
         where not exists (select 1 from public.sprint_runs s where s.source_result_id = v_res);
      end if;
    end if;
    select * into m from public.sprint_matches where id = p_match;
  end if;

  return jsonb_build_object(
    'match_id', m.id, 'outcome', m.outcome, 'my_score', m.my_score, 'opp_score', m.opp_score,
    'points_before', m.points_before, 'points_after', m.points_after, 'delta', m.delta,
    'division_before', public._sprint_division(m.points_before), 'division_after', public._sprint_division(m.points_after),
    'opponent', jsonb_build_object('name', coalesce(nullif(m.opp_name, ''), 'Explorador'), 'avatar', m.opp_avatar, 'country', m.opp_country),
    'result_id', m.result_id);
end $$;

-- ── RPC: bandeja (carreras que otros jugaron contra mí) ─────────────────────
create or replace function public.sprint_inbox_seen(p_ids uuid[])
returns void language sql security definer set search_path = public as $$
  update public.sprint_matches set opp_seen = true where opponent_id = auth.uid() and id = any (p_ids)
$$;

-- ── RPC: ranking de la temporada (global, mi país, amigos de retos) ─────────
create or replace function public.sprint_leaderboard(p_scope text default 'global', p_limit integer default 50)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user    uuid := auth.uid();
  v_season  public.sprint_seasons := public._sprint_season(public.game_day(now()));
  v_country text;
  v_rows    jsonb;
  v_me      jsonb;
begin
  select country into v_country from public.profiles where id = v_user;
  with pool as (
    select sp.user_id, sp.points from public.sprint_players sp
     where sp.season_id = v_season.id and sp.season_games > 0
       and (p_scope <> 'country' or (v_country is not null and exists (select 1 from public.profiles p where p.id = sp.user_id and p.country = v_country)))
       and (p_scope <> 'friends' or sp.user_id = v_user or exists (
             select 1 from public.challenge_participants a join public.challenge_participants b on b.challenge_id = a.challenge_id
              where a.user_id = v_user and b.user_id = sp.user_id))
  ), ranked as (
    select pool.*, rank() over (order by pool.points desc) as rnk from pool
  )
  select coalesce(jsonb_agg(jsonb_build_object('rank', r.rnk, 'user_id', r.user_id, 'points', r.points,
           'division', public._sprint_division(r.points), 'name', coalesce(nullif(p.display_name, ''), 'Explorador'),
           'avatar', p.avatar, 'country', p.country, 'is_me', r.user_id = v_user) order by r.rnk, r.user_id)
           filter (where r.rnk <= greatest(1, least(p_limit, 100))), '[]'::jsonb),
         (select jsonb_build_object('rank', x.rnk, 'points', x.points, 'total', (select count(*) from ranked))
            from ranked x where x.user_id = v_user)
    into v_rows, v_me
    from ranked r left join public.profiles p on p.id = r.user_id;
  return jsonb_build_object('season', v_season.name, 'scope', p_scope, 'country', v_country, 'top', v_rows, 'me', v_me);
end $$;

-- ── RPC: país del jugador ───────────────────────────────────────────────────
create or replace function public.set_my_country(p_iso text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if p_iso is not null and p_iso !~ '^[A-Z]{2}$' then raise exception 'invalid country' using errcode = '22023'; end if;
  update public.profiles set country = p_iso where id = auth.uid();
end $$;

-- ── Permisos ────────────────────────────────────────────────────────────────
revoke all on function public._sprint_division(integer) from public, anon, authenticated;
revoke all on function public._sprint_season(date) from public, anon, authenticated;
revoke all on function public._sprint_player(uuid, date) from public, anon, authenticated;
revoke all on function public._sprint_limit(uuid, date) from public, anon, authenticated;
revoke all on function public._sprint_games_played(uuid) from public, anon, authenticated;
revoke all on function public._sprint_registered(uuid) from public, anon, authenticated;
revoke all on function public._sprint_finish(uuid, integer, boolean, uuid, boolean) from public, anon, authenticated;
revoke all on function public._sprint_expire(uuid) from public, anon, authenticated;
revoke all on function public._sprint_house_run(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public._sprint_match_json(public.sprint_matches) from public, anon, authenticated;
revoke all on function public.sprint_status() from public, anon;
revoke all on function public.sprint_find_match(uuid) from public, anon;
revoke all on function public.sprint_submit(uuid, jsonb) from public, anon;
revoke all on function public.sprint_inbox_seen(uuid[]) from public, anon;
revoke all on function public.sprint_leaderboard(text, integer) from public, anon;
revoke all on function public.set_my_country(text) from public, anon;
grant execute on function public.sprint_status() to authenticated;
grant execute on function public.sprint_find_match(uuid) to authenticated;
grant execute on function public.sprint_submit(uuid, jsonb) to authenticated;
grant execute on function public.sprint_inbox_seen(uuid[]) to authenticated;
grant execute on function public.sprint_leaderboard(text, integer) to authenticated;
grant execute on function public.set_my_country(text) to authenticated;
