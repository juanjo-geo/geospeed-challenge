-- ═══════════════════════════════════════════════════════════════════════════
-- GeoSpeed — F1 Identidad y persistencia (rediseño v2, oct 2026)
--
-- Toda partida (Clásico, Diario, 60s de Caos, Mundial, Imposible, retos, duelos)
-- queda guardada en servidor con su detalle por ciudad. Esto alimenta:
--   · Historial con filtros y paginación (F5)
--   · Ranking con posición propia (F5)        → my_rank(), leaderboard_top()
--   · Revisión por ciudad y comparación de retos (F2/F3)
--   · XP acumulado en servidor (resuelve el tope de 20 partidas del historial local)
--
-- Funciona con usuarios registrados y con Anonymous Sign-in (ambos son rol
-- `authenticated`). Mientras el anónimo no esté activado en el dashboard, los
-- invitados simplemente no escriben aquí y siguen con localStorage.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── profiles: avatar y XP heredado del historial local ─────────────────────
alter table public.profiles
  add column if not exists avatar text not null default '',
  add column if not exists xp_legacy integer not null default 0 check (xp_legacy >= 0);

-- ── game_results ────────────────────────────────────────────────────────────
create table if not exists public.game_results (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  game_type       text not null check (game_type in ('classic','daily','timeattack','mundial','speeddemon','training','challenge','duel')),
  mode            text not null,                        -- world | europe | asia | americas | africa | mundial
  difficulty      text not null,                        -- basic | easy | medium | hard
  score           integer not null check (score between 0 and 500000),
  rounds_played   integer not null default 0 check (rounds_played >= 0),
  rounds_total    integer not null default 0 check (rounds_total >= 0),
  avg_distance_km numeric,
  end_reason      text not null default 'complete' check (end_reason in ('complete','timeout','abandoned')),
  is_record       boolean not null default false,
  seed            integer,                              -- semilla de ciudades (para "Reta a un amigo")
  challenge_id    uuid,                                 -- F3: reto asincrónico al que pertenece
  client_id       text,                                 -- idempotencia: uuid generado en el cliente
  created_at      timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists idx_game_results_user_created on public.game_results (user_id, created_at desc);
create index if not exists idx_game_results_rank          on public.game_results (game_type, mode, difficulty, score desc);
create index if not exists idx_game_results_created       on public.game_results (created_at desc);
create index if not exists idx_game_results_challenge     on public.game_results (challenge_id) where challenge_id is not null;

alter table public.game_results enable row level security;

drop policy if exists "game_results_select_own" on public.game_results;
create policy "game_results_select_own" on public.game_results
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "game_results_insert_own" on public.game_results;
create policy "game_results_insert_own" on public.game_results
  for insert to authenticated with check (auth.uid() = user_id);
-- Sin update/delete para usuarios: una partida jugada es inmutable.

-- ── game_rounds: detalle por ciudad ─────────────────────────────────────────
create table if not exists public.game_rounds (
  result_id    uuid not null references public.game_results(id) on delete cascade,
  round_no     integer not null check (round_no between 1 and 200),
  city_name    text not null,
  city_country text,
  city_lat     double precision,
  city_lon     double precision,
  click_lat    double precision,
  click_lon    double precision,
  distance_km  numeric,
  time_s       numeric,
  base_points  integer,
  multiplier   numeric,
  points       integer not null default 0,
  extra        jsonb,                                   -- Mundial: {player, band, tapped}
  primary key (result_id, round_no)
);

alter table public.game_rounds enable row level security;

drop policy if exists "game_rounds_select_own" on public.game_rounds;
create policy "game_rounds_select_own" on public.game_rounds
  for select to authenticated
  using (exists (select 1 from public.game_results r where r.id = game_rounds.result_id and r.user_id = auth.uid()));

drop policy if exists "game_rounds_insert_own" on public.game_rounds;
create policy "game_rounds_insert_own" on public.game_rounds
  for insert to authenticated
  with check (exists (select 1 from public.game_results r where r.id = game_rounds.result_id and r.user_id = auth.uid()));

grant select, insert on public.game_results to authenticated;
grant select, insert on public.game_rounds  to authenticated;

-- ── save_game_result(jsonb) → uuid ──────────────────────────────────────────
-- Inserta resultado + rondas en una sola llamada (atómica). Idempotente por
-- client_id: repetir la misma partida devuelve el id existente sin duplicar.
-- Calcula is_record contra el mejor puntaje previo del usuario en ese game_type.
--
-- payload:
-- {
--   "client_id": "uuid", "game_type": "classic", "mode": "world", "difficulty": "basic",
--   "score": 8420, "rounds_played": 13, "rounds_total": 13, "avg_distance_km": 126.4,
--   "end_reason": "complete", "seed": 123456, "challenge_id": null,
--   "rounds": [ { "round_no": 1, "city_name": "Tokio", "city_country": "Japón",
--                 "city_lat": 35.68, "city_lon": 139.69, "click_lat": 35.1, "click_lon": 139.0,
--                 "distance_km": 42, "time_s": 4.2, "base_points": 989, "multiplier": 1.65,
--                 "points": 920, "extra": null }, … ]
-- }
create or replace function public.save_game_result(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_id       uuid;
  v_client   text := nullif(p->>'client_id', '');
  v_type     text := coalesce(p->>'game_type', 'classic');
  v_score    integer := coalesce((p->>'score')::integer, 0);
  v_prev     integer;
  v_round    jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Idempotencia
  if v_client is not null then
    select id into v_id from public.game_results where user_id = v_user and client_id = v_client;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  select max(score) into v_prev from public.game_results where user_id = v_user and game_type = v_type;

  insert into public.game_results (
    user_id, game_type, mode, difficulty, score, rounds_played, rounds_total,
    avg_distance_km, end_reason, is_record, seed, challenge_id, client_id
  ) values (
    v_user, v_type, coalesce(p->>'mode', 'world'), coalesce(p->>'difficulty', 'basic'), v_score,
    coalesce((p->>'rounds_played')::integer, 0), coalesce((p->>'rounds_total')::integer, 0),
    (p->>'avg_distance_km')::numeric, coalesce(p->>'end_reason', 'complete'),
    (v_prev is not null and v_score > v_prev),
    (p->>'seed')::integer, (p->>'challenge_id')::uuid, v_client
  ) returning id into v_id;

  for v_round in select * from jsonb_array_elements(coalesce(p->'rounds', '[]'::jsonb)) loop
    insert into public.game_rounds (
      result_id, round_no, city_name, city_country, city_lat, city_lon,
      click_lat, click_lon, distance_km, time_s, base_points, multiplier, points, extra
    ) values (
      v_id, (v_round->>'round_no')::integer, coalesce(v_round->>'city_name', '?'), v_round->>'city_country',
      (v_round->>'city_lat')::double precision, (v_round->>'city_lon')::double precision,
      (v_round->>'click_lat')::double precision, (v_round->>'click_lon')::double precision,
      (v_round->>'distance_km')::numeric, (v_round->>'time_s')::numeric,
      (v_round->>'base_points')::integer, (v_round->>'multiplier')::numeric,
      coalesce((v_round->>'points')::integer, 0), v_round->'extra'
    ) on conflict (result_id, round_no) do nothing;
  end loop;

  return v_id;
end;
$$;

grant execute on function public.save_game_result(jsonb) to authenticated;

-- ── my_progress() ───────────────────────────────────────────────────────────
-- Resumen del jugador para perfil/nivel. XP = suma de puntos de todas sus
-- partidas en servidor + xp_legacy (lo que traía del historial local al migrar).
create or replace function public.my_progress()
returns table (
  games_played    bigint,
  best_score      integer,
  total_xp        bigint,
  total_rounds    bigint,
  avg_distance_km numeric
)
language sql
security invoker
stable
set search_path = public
as $$
  select
    count(r.id)                                                 as games_played,
    coalesce(max(r.score), 0)                                   as best_score,
    coalesce(sum(r.score), 0) + coalesce(max(pr.xp_legacy), 0)  as total_xp,
    coalesce(sum(r.rounds_played), 0)                           as total_rounds,
    case when sum(r.rounds_played) filter (where r.avg_distance_km is not null) > 0
         then sum(r.avg_distance_km * r.rounds_played) / sum(r.rounds_played) filter (where r.avg_distance_km is not null)
         else null end                                          as avg_distance_km
  from public.profiles pr
  left join public.game_results r on r.user_id = pr.id
  where pr.id = auth.uid()
  group by pr.id;
$$;

grant execute on function public.my_progress() to authenticated;

-- ── Ranking (decisión D5): mejor partida por jugador en modo × dificultad ───
-- Tipos de partida que compiten en el ranking de ciudades. Mundial se filtra con mode='mundial'.
create or replace function public._rank_game_types()
returns text[] language sql immutable as $$ select array['classic','daily','challenge'] $$;

create or replace function public._period_start(p_period text)
returns timestamptz language sql immutable as $$
  select case p_period
    when 'week'  then now() - interval '7 days'
    when 'month' then now() - interval '30 days'
    else '-infinity'::timestamptz end
$$;

-- leaderboard_top: Top N con nombre y avatar. SECURITY DEFINER porque profiles
-- solo es legible por su dueño; esta función expone únicamente display_name y avatar.
create or replace function public.leaderboard_top(
  p_mode text default 'world',
  p_difficulty text default null,
  p_period text default 'all',
  p_limit integer default 10
)
returns table (
  rank         bigint,
  user_id      uuid,
  display_name text,
  avatar       text,
  best_score   integer,
  achieved_at  timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  with best as (
    select distinct on (r.user_id)
      r.user_id, r.score, r.created_at
    from public.game_results r
    where r.mode = p_mode
      and (p_difficulty is null or r.difficulty = p_difficulty)
      and r.created_at >= public._period_start(p_period)
      and (p_mode = 'mundial' or r.game_type = any (public._rank_game_types()))
    order by r.user_id, r.score desc, r.created_at asc
  )
  select
    row_number() over (order by b.score desc, b.created_at asc) as rank,
    b.user_id,
    coalesce(nullif(pr.display_name, ''), 'Explorador') as display_name,
    coalesce(pr.avatar, '') as avatar,
    b.score as best_score,
    b.created_at as achieved_at
  from best b
  left join public.profiles pr on pr.id = b.user_id
  order by b.score desc, b.created_at asc
  limit greatest(1, least(coalesce(p_limit, 10), 100));
$$;

grant execute on function public.leaderboard_top(text, text, text, integer) to anon, authenticated;

-- my_rank: posición propia aunque esté fuera del Top 10.
create or replace function public.my_rank(
  p_mode text default 'world',
  p_difficulty text default null,
  p_period text default 'all'
)
returns table (
  rank          bigint,
  best_score    integer,
  total_players bigint
)
language sql
security invoker
stable
set search_path = public
as $$
  with best as (
    select r.user_id, max(r.score) as score
    from public.game_results r
    where r.mode = p_mode
      and (p_difficulty is null or r.difficulty = p_difficulty)
      and r.created_at >= public._period_start(p_period)
      and (p_mode = 'mundial' or r.game_type = any (public._rank_game_types()))
    group by r.user_id
  ),
  mine as (select score from best where user_id = auth.uid())
  select
    case when (select score from mine) is null then null
         else 1 + (select count(*) from best b where b.score > (select score from mine)) end as rank,
    (select score from mine) as best_score,
    (select count(*) from best) as total_players;
$$;

grant execute on function public.my_rank(text, text, text) to authenticated;

-- Nota: `best` en my_rank lee game_results de TODOS los usuarios, pero la función es
-- security invoker y RLS solo deja ver las filas propias. Para que la posición sea
-- global, cualquier autenticado puede leer las partidas SUELTAS de otros (score,
-- modo, dificultad, fecha). Las partidas de retos (challenge_id no nulo) quedan
-- privadas: F3 decide cuándo se revela el puntaje del rival. game_rounds (clics)
-- sigue siendo privada siempre.
drop policy if exists "game_results_select_for_ranking" on public.game_results;
create policy "game_results_select_for_ranking" on public.game_results
  for select to authenticated using (challenge_id is null);

-- ── import_legacy_history(jsonb) → integer ──────────────────────────────────
-- Migra el historial local (≤20 entradas sin rondas) una sola vez por dispositivo.
-- payload: { "xp_legacy": 12345, "entries": [ { "date": "2026-10-13T19:20:00Z",
--   "score": 8420, "rounds": 13, "difficulty": "basic", "mode": "world", "avgDistance": 126,
--   "type": "classic" }, … ] }
-- Idempotente: client_id = 'legacy:' || date || ':' || score.
-- xp_legacy solo sube (nunca baja) para que nadie pierda nivel al migrar.
create or replace function public.import_legacy_history(p jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_e     jsonb;
  v_n     integer := 0;
  v_type  text;
  v_xp    integer := coalesce((p->>'xp_legacy')::integer, 0);
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  for v_e in select * from jsonb_array_elements(coalesce(p->'entries', '[]'::jsonb)) loop
    v_type := case
      when v_e->>'mode' = 'mundial' then 'mundial'
      when v_e->>'type' in ('classic','daily','timeattack') then v_e->>'type'
      else 'classic' end;
    insert into public.game_results (
      user_id, game_type, mode, difficulty, score, rounds_played, rounds_total,
      avg_distance_km, end_reason, client_id, created_at
    ) values (
      v_user, v_type, coalesce(v_e->>'mode', 'world'), coalesce(v_e->>'difficulty', 'basic'),
      greatest(0, least(500000, coalesce((v_e->>'score')::integer, 0))),
      coalesce((v_e->>'rounds')::integer, 0), coalesce((v_e->>'rounds')::integer, 0),
      case when v_e->>'mode' = 'mundial' then null else (v_e->>'avgDistance')::numeric end,
      'complete',
      'legacy:' || coalesce(v_e->>'date', '') || ':' || coalesce(v_e->>'score', '0'),
      coalesce((v_e->>'date')::timestamptz, now())
    ) on conflict (user_id, client_id) do nothing;
    if found then v_n := v_n + 1; end if;
  end loop;

  -- El XP local incluía esas mismas partidas; para no contarlas dos veces,
  -- xp_legacy = XP local − puntos de las entradas importadas (mínimo 0).
  update public.profiles
     set xp_legacy = greatest(xp_legacy, greatest(0, v_xp - coalesce((
       select sum(score) from public.game_results
        where user_id = v_user and client_id like 'legacy:%'), 0)))
   where id = v_user;

  return v_n;
end;
$$;

grant execute on function public.import_legacy_history(jsonb) to authenticated;

-- ── update_my_profile(display_name, avatar) ─────────────────────────────────
create or replace function public.update_my_profile(p_display_name text default null, p_avatar text default null)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.profiles
     set display_name = coalesce(nullif(left(p_display_name, 20), ''), display_name),
         avatar       = coalesce(left(p_avatar, 40), avatar)
   where id = auth.uid();
$$;

grant execute on function public.update_my_profile(text, text) to authenticated;

-- ── Limpieza de usuarios anónimos (decisión D1, salvaguarda 2) ──────────────
-- Borra anónimos con más de 30 días y sin ninguna partida guardada.
-- Programar semanalmente cuando pg_cron esté habilitado en el dashboard:
--   select cron.schedule('cleanup-anon-weekly', '0 4 * * 1', $$select public.cleanup_anonymous_users()$$);
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
    returning 1
  )
  select count(*) into v_n from gone;
  return v_n;
end;
$$;

revoke all on function public.cleanup_anonymous_users() from public, anon, authenticated;
