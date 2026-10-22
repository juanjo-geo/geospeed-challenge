-- ════════════════════════════════════════════════════════════════════════════
-- Fase 6 — Categorías nuevas: Banderas (docs/GeoSpeed_Plan_Competencia.md §4)
--
-- Decisiones de JuanJo (2026-10-22): Banderas primero; en Clásico, Entrenamiento y Retos (el Diario y el
-- Sprint siguen con ciudades); se puntúa por distancia al país como las ciudades (dentro = cercanía perfecta,
-- fuera = distancia a la frontera más cercana); entran los países del mapa 1:110m por dificultad.
--
--   · game_results.category / challenges.category: 'cities' (hoy todo) · 'flags' · luego 'features', 'monuments'.
--   · places ya admitía kind 'flag'; place_shapes guarda los contornos (countries.ts) de cada bandera.
--   · shape_distance_km(place, lat, lon): el mismo algoritmo que src/lib/flagScoring.ts (rayo horizontal para
--     "dentro", punto más cercano de cada lado en un plano local + haversine, redondeo a 0,1 km). Paridad:
--     scripts/test-flags-sql.mjs.
--   · _score_rounds_v2 usa esa distancia cuando el lugar es una bandera; save_game_result guarda la categoría y
--     el récord personal es por categoría; leaderboard_top / my_rank filtran por p_category (tablas separadas,
--     'cities' por defecto: los clientes viejos siguen viendo lo de siempre); los retos llevan categoría; las
--     partidas "de la casa" del Sprint solo salen de ciudades.
-- Generada por scratchpad/gen_flags_migration.py a partir de las funciones vigentes; el seed al final viene de
-- scripts/build-flags.mjs.
-- ════════════════════════════════════════════════════════════════════════════

-- ── A) Esquema ──────────────────────────────────────────────────────────────
alter table public.game_results add column if not exists category text not null default 'cities';
alter table public.game_results drop constraint if exists game_results_category_check;
alter table public.game_results add constraint game_results_category_check check (category in ('cities','flags','features','monuments'));
create index if not exists idx_game_results_category on public.game_results (category, mode, difficulty, score desc) where category <> 'cities';
alter table public.challenges add column if not exists category text not null default 'cities';
alter table public.challenges drop constraint if exists challenges_category_check;
alter table public.challenges add constraint challenges_category_check check (category in ('cities','flags','features','monuments'));

create table if not exists public.place_shapes (
  place_id text not null references public.places (id) on delete cascade,
  ring_no  integer not null,
  lons     double precision[] not null,
  lats     double precision[] not null,
  primary key (place_id, ring_no)
);
alter table public.place_shapes enable row level security;
revoke all on public.place_shapes from anon, authenticated;

-- ── B) shape_distance_km ────────────────────────────────────────────────────
create or replace function public.shape_distance_km(p_place text, p_lat double precision, p_lon double precision)
returns double precision language plpgsql stable set search_path = public as $$
declare
  r      record;
  n      integer;
  i      integer;
  j      integer;
  inside boolean;
  k      double precision := greatest(cos(radians(p_lat)), 1e-6);
  best   double precision := null;
  x1 double precision; y1 double precision; x2 double precision; y2 double precision;
  dx double precision; dy double precision; l2 double precision; t double precision;
  nlat double precision; nlon double precision; d double precision; w double precision;
begin
  -- Dentro de cualquier anillo (rayo horizontal, par/impar): distancia 0
  for r in select lons, lats from public.place_shapes where place_id = p_place order by ring_no loop
    n := array_length(r.lons, 1);
    if n is null or n < 3 then continue; end if;
    inside := false;
    j := n;
    for i in 1..n loop
      if ((r.lats[i] > p_lat) <> (r.lats[j] > p_lat))
         and (p_lon < (r.lons[j] - r.lons[i]) * (p_lat - r.lats[i]) / (r.lats[j] - r.lats[i]) + r.lons[i]) then
        inside := not inside;
      end if;
      j := i;
    end loop;
    if inside then return 0; end if;
  end loop;
  -- Fuera: punto más cercano de cada lado, en un plano local alrededor del clic, medido con haversine
  for r in select lons, lats from public.place_shapes where place_id = p_place order by ring_no loop
    n := array_length(r.lons, 1);
    if n is null or n < 2 then continue; end if;
    for i in 1..n-1 loop
      w := r.lons[i] - p_lon;
      w := case when w > 180 then w - 360 when w < -180 then w + 360 else w end;
      x1 := w * k; y1 := r.lats[i] - p_lat;
      -- el segundo extremo se mide desde el primero (un lado nunca se parte por el meridiano opuesto al clic)
      x2 := (w + (r.lons[i+1] - r.lons[i])) * k; y2 := r.lats[i+1] - p_lat;
      dx := x2 - x1; dy := y2 - y1;
      l2 := dx * dx + dy * dy;
      t := case when l2 > 0 then -(x1 * dx + y1 * dy) / l2 else 0 end;
      t := case when t < 0 then 0 when t > 1 then 1 else t end;
      nlat := p_lat + y1 + t * dy;
      nlon := p_lon + (x1 + t * dx) / k;
      d := public.geo_distance_km(p_lat, p_lon, nlat, nlon);
      if best is null or d < best then best := d; end if;
    end loop;
  end loop;
  if best is null then return null; end if;
  return floor(best * 10 + 0.5) / 10;
end $$;
revoke all on function public.shape_distance_km(text, double precision, double precision) from public, anon, authenticated;

-- ── C) _score_rounds_v2: + banderas ─────────────────────────────────────────
create or replace function public._score_rounds_v2(
  p_rounds jsonb,
  p_mode text,
  p_difficulty text,
  p_game_type text,
  out total integer,
  out suspicious boolean,
  out rounds jsonb
)
language plpgsql
stable
set search_path = public
as $$
declare
  v_mundial boolean := (p_mode = 'mundial' or p_game_type = 'mundial');
  v_scale   double precision := case when p_mode in ('world', 'mundial') then 1500 else 600 end;
  v_diff    integer := case
                         when p_mode = 'mundial' or p_game_type = 'mundial' then 100
                         when p_difficulty = 'easy' then 110
                         when p_difficulty = 'medium' then 125
                         when p_difficulty = 'hard' then 150
                         else 100
                       end;
  v_combo   integer := 0;
  v_r       jsonb;
  v_place   text;
  v_kind    text;
  v_lat     double precision;
  v_lon     double precision;
  v_clat    double precision;
  v_clon    double precision;
  v_km      double precision;
  v_close   integer;
  v_tenths  integer;
  v_speed   integer;
  v_ctenths integer;
  v_points  integer;
begin
  total := 0;
  suspicious := false;
  rounds := '[]'::jsonb;

  for v_r in
    select e.value from jsonb_array_elements(coalesce(p_rounds, '[]'::jsonb)) e
    order by (e.value->>'round_no')::integer
  loop
    v_place := null; v_lat := null; v_lon := null; v_km := null; v_kind := null;
    v_clat := (v_r->>'click_lat')::double precision;
    v_clon := (v_r->>'click_lon')::double precision;

    if v_mundial then
      v_close := case v_r->'extra'->>'band'
                   when 'exact' then 1000 when 'neighbor' then 600 when 'continent' then 300 when 'far' then 50
                   else 0 end;
      v_km := (v_r->>'distance_km')::double precision;
    else
      select pl.id, pl.lat, pl.lon, pl.kind into v_place, v_lat, v_lon, v_kind
        from public.places pl where pl.id = v_r->>'place_id';
      if v_place is null then
        select pl.id, pl.lat, pl.lon, pl.kind into v_place, v_lat, v_lon, v_kind
          from public.places pl
         where pl.name = v_r->>'city_name'
           and (v_r->>'city_country' is null or pl.country = v_r->>'city_country')
         limit 1;
      end if;
      if v_place is null then
        -- Lugar que el servidor no conoce: se mide con las coordenadas del teléfono, fuera del ranking
        v_lat := (v_r->>'city_lat')::double precision;
        v_lon := (v_r->>'city_lon')::double precision;
        suspicious := true;
      end if;
      if v_clat is not null and v_clon is not null and v_lat is not null and v_lon is not null then
        if v_kind = 'flag' then
          -- Bandera (Fase 6): 0 dentro del país; si no, la distancia a la frontera más cercana (shape_distance_km)
          v_km := coalesce(public.shape_distance_km(v_place, v_clat, v_clon), public.geo_distance_km(v_clat, v_clon, v_lat, v_lon));
        else
          v_km := public.geo_distance_km(v_clat, v_clon, v_lat, v_lon);
        end if;
        v_close := public.score_closeness_v2(v_km, v_scale);
      else
        v_close := 0;
      end if;
    end if;

    v_tenths := greatest(0, floor(coalesce((v_r->>'time_s')::numeric, 15) * 10 + 0.5)::integer);
    if v_tenths < 3 and v_clat is not null then
      suspicious := true; -- respuesta en menos de 0,3 s
    end if;
    v_speed := greatest(400, least(2200, 2200 - 13 * v_tenths));
    v_combo := case when v_close >= 800 then v_combo + 1 when v_close >= 400 then v_combo else 0 end;
    v_ctenths := case when v_combo >= 8 then 25 when v_combo >= 6 then 20 when v_combo >= 4 then 15
                      when v_combo >= 2 then 12 else 10 end;
    v_points := ((v_close::bigint * v_speed * v_ctenths * v_diff + 500000) / 1000000)::integer;
    total := total + v_points;

    rounds := rounds || jsonb_build_array(v_r || jsonb_build_object(
      'place_id', v_place,
      'distance_km', case when v_km is null then v_r->'distance_km' else to_jsonb(round(v_km::numeric, 1)) end,
      'time_s', to_jsonb(v_tenths / 10.0),
      'base_points', v_close,
      'multiplier', to_jsonb(v_speed / 1000.0),
      'points', v_points,
      'combo', v_combo,
      'combo_mult', to_jsonb(v_ctenths / 10.0)
    ));
  end loop;
end;
$$;

revoke all on function public._score_rounds_v2(jsonb, text, text, text) from public, anon, authenticated;

-- ── D) save_game_result: + categoría ────────────────────────────────────────
create or replace function public.save_game_result(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_id      uuid;
  v_client  text := nullif(p->>'client_id', '');
  v_type    text := coalesce(p->>'game_type', 'classic');
  v_mode    text := coalesce(p->>'mode', 'world');
  v_diff    text := coalesce(p->>'difficulty', 'basic');
  v_score   integer := coalesce((p->>'score')::integer, 0);
  v_rounds  jsonb := coalesce(p->'rounds', '[]'::jsonb);
  v_version smallint := 1;
  v_susp    boolean := false;
  v_cat     text := case when coalesce(p->>'category','') in ('flags','features','monuments') then p->>'category' else 'cities' end;
  v_prev    integer;
  v_round   jsonb;
  v_scored  record;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if jsonb_typeof(v_rounds) <> 'array' or jsonb_array_length(v_rounds) > 200 then
    raise exception 'invalid rounds' using errcode = '22023';
  end if;

  if v_client is not null then
    select id into v_id from public.game_results where user_id = v_user and client_id = v_client;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  if jsonb_array_length(v_rounds) > 0 then
    select * into v_scored from public._score_rounds_v2(v_rounds, v_mode, v_diff, v_type);
    v_score := v_scored.total;
    v_susp := v_scored.suspicious;
    v_rounds := v_scored.rounds;
    v_version := 2;
  end if;
  v_score := greatest(0, least(5000000, v_score));

  select max(score) into v_prev from public.game_results
   where user_id = v_user and game_type = v_type and scoring_version = v_version and category = v_cat;

  insert into public.game_results (
    user_id, game_type, mode, difficulty, score, rounds_played, rounds_total,
    avg_distance_km, end_reason, is_record, seed, challenge_id, client_id, scoring_version, suspicious, category
  ) values (
    v_user, v_type, v_mode, v_diff, v_score,
    coalesce((p->>'rounds_played')::integer, 0), coalesce((p->>'rounds_total')::integer, 0),
    (p->>'avg_distance_km')::numeric, coalesce(p->>'end_reason', 'complete'),
    (v_prev is not null and v_score > v_prev),
    (p->>'seed')::integer, (p->>'challenge_id')::uuid, v_client, v_version, v_susp, v_cat
  ) returning id into v_id;

  for v_round in select * from jsonb_array_elements(v_rounds) loop
    insert into public.game_rounds (
      result_id, round_no, place_id, city_name, city_country, city_lat, city_lon,
      click_lat, click_lon, distance_km, time_s, base_points, multiplier, points, combo, combo_mult, extra
    ) values (
      v_id, (v_round->>'round_no')::integer, v_round->>'place_id', coalesce(v_round->>'city_name', '?'), v_round->>'city_country',
      (v_round->>'city_lat')::double precision, (v_round->>'city_lon')::double precision,
      (v_round->>'click_lat')::double precision, (v_round->>'click_lon')::double precision,
      (v_round->>'distance_km')::numeric, (v_round->>'time_s')::numeric,
      (v_round->>'base_points')::integer, (v_round->>'multiplier')::numeric,
      coalesce((v_round->>'points')::integer, 0), (v_round->>'combo')::integer, (v_round->>'combo_mult')::numeric,
      v_round->'extra'
    ) on conflict (result_id, round_no) do nothing;
  end loop;

  -- Desafío diario: resultado del día y racha (un error aquí nunca impide guardar la partida)
  if v_type = 'daily' and v_version = 2 and not v_susp then
    begin
      perform public._record_daily(v_user, v_id, (p->>'daily_no')::integer);
    exception when others then
      raise warning 'daily record failed: %', sqlerrm;
    end;
  end if;

  -- Memoria de lugares (Fase 4): cada ciudad del catálogo respondida alimenta el repaso inteligente
  -- (todos los modos con ciudades; un error aquí nunca impide guardar la partida)
  if v_version = 2 and not v_susp then
    begin
      perform public._memory_record(v_user, v_id);
    exception when others then
      raise warning 'memory record failed: %', sqlerrm;
    end;
  end if;

  return v_id;
end;
$$;

grant execute on function public.save_game_result(jsonb) to authenticated;

-- ── E) Rankings por categoría ───────────────────────────────────────────────
drop function if exists public.leaderboard_top(text, text, text, integer, text, text);

create or replace function public.leaderboard_top(
  p_mode text default 'world',
  p_difficulty text default null,
  p_period text default 'all',
  p_limit integer default 10,
  p_game_type text default null,
  p_season text default 't1',
  p_category text default 'cities'
)
returns table (
  rank         bigint,
  user_id      uuid,
  display_name text,
  avatar       text,
  best_score   integer,
  achieved_at  timestamptz,
  active_title text,
  active_frame text
)
language sql
security definer
stable
set search_path = public
as $$
  with scores as (
    select r.user_id::text as k, r.user_id, null::text as initials, r.score, r.created_at
    from public.game_results r
    where r.mode = p_mode
      and r.category = p_category
      and (p_difficulty is null or r.difficulty = p_difficulty)
      and r.created_at >= public._period_start(p_period)
      and case
            when p_game_type is not null then r.game_type = p_game_type
            when p_mode = 'mundial' then r.game_type = 'mundial'
            else r.game_type = any (public._rank_game_types())
          end
      and r.challenge_id is null
      and case when p_season = 'historic' then r.scoring_version = 1
               else r.scoring_version = 2 and not r.suspicious end
    union all
    select coalesce(l.user_id::text, 'legacy:' || upper(l.initials)), l.user_id, upper(l.initials), l.score, l.created_at
    from public.leaderboard l
    where p_season = 'historic'
      and p_category = 'cities'
      and p_game_type is null
      and p_mode <> 'mundial'
      and l.mode = p_mode
      and (p_difficulty is null or l.difficulty = p_difficulty)
      and l.created_at >= public._period_start(p_period)
      and l.created_at < timestamptz '2026-10-18 00:00:00+00'
  ),
  best as (
    select distinct on (s.k) s.k, s.user_id, s.initials, s.score, s.created_at
    from scores s
    order by s.k, s.score desc, s.created_at asc
  )
  select
    row_number() over (order by b.score desc, b.created_at asc) as rank,
    b.user_id,
    coalesce(nullif(pr.display_name, ''), b.initials, 'Explorador') as display_name,
    coalesce(pr.avatar, '') as avatar,
    b.score as best_score,
    b.created_at as achieved_at,
    pr.active_title,
    pr.active_frame
  from best b
  left join public.profiles pr on pr.id = b.user_id
  order by b.score desc, b.created_at asc
  limit greatest(1, least(coalesce(p_limit, 10), 100));
$$;

grant execute on function public.leaderboard_top(text, text, text, integer, text, text, text) to anon, authenticated;

drop function if exists public.my_rank(text, text, text, text, text);
create or replace function public.my_rank(
  p_mode text default 'world',
  p_difficulty text default null,
  p_period text default 'all',
  p_game_type text default null,
  p_season text default 't1',
  p_category text default 'cities'
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
  with scores as (
    select r.user_id::text as k, r.score
    from public.game_results r
    where r.mode = p_mode
      and r.category = p_category
      and (p_difficulty is null or r.difficulty = p_difficulty)
      and r.created_at >= public._period_start(p_period)
      and case
            when p_game_type is not null then r.game_type = p_game_type
            when p_mode = 'mundial' then r.game_type = 'mundial'
            else r.game_type = any (public._rank_game_types())
          end
      and r.challenge_id is null
      and case when p_season = 'historic' then r.scoring_version = 1
               else r.scoring_version = 2 and not r.suspicious end
    union all
    select coalesce(l.user_id::text, 'legacy:' || upper(l.initials)), l.score
    from public.leaderboard l
    where p_season = 'historic'
      and p_category = 'cities'
      and p_game_type is null
      and p_mode <> 'mundial'
      and l.mode = p_mode
      and (p_difficulty is null or l.difficulty = p_difficulty)
      and l.created_at >= public._period_start(p_period)
      and l.created_at < timestamptz '2026-10-18 00:00:00+00'
  ),
  best as (
    select s.k, max(s.score) as score from scores s group by s.k
  ),
  mine as (select score from best where k = auth.uid()::text)
  select
    case when (select score from mine) is null then null
         else 1 + (select count(*) from best b where b.score > (select score from mine)) end as rank,
    (select score from mine) as best_score,
    (select count(*) from best) as total_players;
$$;

grant execute on function public.my_rank(text, text, text, text, text, text) to authenticated;

-- ── F) Retos con categoría ──────────────────────────────────────────────────
create or replace function public._challenge_json(c public.challenges)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', c.id, 'code', c.code, 'mode', c.mode, 'difficulty', c.difficulty, 'category', c.category,
    'rounds_total', c.rounds_total, 'seconds_per_round', c.seconds_per_round,
    'cities', c.cities, 'status', c.status, 'parent_challenge_id', c.parent_challenge_id,
    'created_at', c.created_at, 'completed_at', c.completed_at,
    'is_creator', c.creator_id = auth.uid()
  );
$$;

create or replace function public.challenge_create(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_req    text := nullif(p->>'client_request_id', '');
  v_rounds integer := coalesce((p->>'rounds_total')::integer, 13);
  v_cities jsonb := p->'cities';
  v_parent uuid := nullif(p->>'parent_challenge_id', '')::uuid;
  v_rival  uuid;
  v_row    public.challenges;
  v_city   jsonb;
  v_try    integer := 0;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;

  if v_req is not null then
    select * into v_row from public.challenges where creator_id = v_user and client_request_id = v_req;
    if found then return public._challenge_json(v_row); end if;
  end if;

  if jsonb_typeof(v_cities) <> 'array' or jsonb_array_length(v_cities) <> v_rounds then
    raise exception 'invalid cities' using errcode = '22023';
  end if;
  for v_city in select * from jsonb_array_elements(v_cities) loop
    if coalesce(v_city->>'name', '') = ''
       or (v_city->>'lat') is null or (v_city->>'lon') is null
       or abs((v_city->>'lat')::double precision) > 90
       or abs((v_city->>'lon')::double precision) > 180 then
      raise exception 'invalid cities' using errcode = '22023';
    end if;
  end loop;

  -- Revancha: solo sobre un reto propio; el rival del original queda invitado
  if v_parent is not null then
    if not exists (select 1 from public.challenge_participants where challenge_id = v_parent and user_id = v_user) then
      v_parent := null;
    else
      select user_id into v_rival from public.challenge_participants where challenge_id = v_parent and user_id <> v_user limit 1;
    end if;
  end if;

  loop
    v_try := v_try + 1;
    begin
      insert into public.challenges (code, creator_id, mode, difficulty, rounds_total, seconds_per_round,
                                     cities, catalog_version, parent_challenge_id, client_request_id, category)
      values (public._challenge_code(), v_user, coalesce(p->>'mode', 'world'), coalesce(p->>'difficulty', 'basic'),
              v_rounds, coalesce((p->>'seconds_per_round')::integer, 15), v_cities,
              p->>'catalog_version', v_parent, v_req,
              case when coalesce(p->>'category','') in ('flags','features','monuments') then p->>'category' else 'cities' end)
      returning * into v_row;
      exit;
    exception when unique_violation then
      if v_req is not null then
        select * into v_row from public.challenges where creator_id = v_user and client_request_id = v_req;
        if found then return public._challenge_json(v_row); end if;
      end if;
      if v_try >= 10 then raise; end if;
    end;
  end loop;

  insert into public.challenge_participants (challenge_id, user_id, role, accepted_at)
  values (v_row.id, v_user, 'creator', now());

  if v_rival is not null then
    insert into public.challenge_participants (challenge_id, user_id, role, accepted_at)
    values (v_row.id, v_rival, 'opponent', null);
  end if;

  return public._challenge_json(v_row);
end $$;

-- ── challenge_preview: + accepted, is_rematch ────────────────────────────────

create or replace function public.challenge_preview(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_row  public.challenges;
  v_name text;
  v_avatar text;
  v_role text;
  v_accepted boolean;
  v_has_opponent boolean;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_row from public.challenges where code = upper(trim(p_code));
  if not found or v_row.status = 'cancelled' then
    raise exception 'challenge_unavailable' using errcode = 'P0002';
  end if;
  select role, accepted_at is not null into v_role, v_accepted
    from public.challenge_participants where challenge_id = v_row.id and user_id = auth.uid();
  select exists (select 1 from public.challenge_participants where challenge_id = v_row.id and role = 'opponent') into v_has_opponent;
  if v_role is null and v_has_opponent then
    raise exception 'challenge_unavailable' using errcode = 'P0002';
  end if;
  select display_name, avatar into v_name, v_avatar from public.profiles where id = v_row.creator_id;
  return jsonb_build_object(
    'id', v_row.id, 'code', v_row.code, 'mode', v_row.mode, 'difficulty', v_row.difficulty, 'category', v_row.category,
    'rounds_total', v_row.rounds_total, 'seconds_per_round', v_row.seconds_per_round,
    'status', v_row.status, 'created_at', v_row.created_at,
    'creator_name', coalesce(nullif(v_name, ''), 'Explorador'), 'creator_avatar', v_avatar,
    'my_role', v_role, 'accepted', coalesce(v_accepted, false),
    'is_rematch', v_row.parent_challenge_id is not null
  );
end $$;

-- ── challenge_detail: + accepted del rival, is_rematch ──────────────────────

-- ── G) Sprint: partidas de la casa solo de ciudades ─────────────────────────
create or replace function public._sprint_house_run(p_user uuid, p_points integer, p_season integer)
returns public.sprint_runs language plpgsql security definer set search_path = public, auth as $$
declare
  v_src    record;
  v_input  jsonb;
  v_cities jsonb;
  v_scored record;
  v_run    public.sprint_runs;
  v_named  boolean;
begin
  foreach v_named in array array[true, false] loop
    -- Una partida de la casa ya armada que este jugador no haya enfrentado
    select r.* into v_run from public.sprint_runs r
      left join public.profiles p on p.id = r.user_id
     where r.is_house and r.season_id = p_season and r.user_id is distinct from p_user
       and (not v_named or coalesce(p.display_name, '') <> '')
       and not exists (select 1 from public.sprint_matches m where m.player_id = p_user and m.run_id = r.id)
     order by (p.country is not null) desc, random() limit 1;
    if found then return v_run; end if;

    -- Una partida real nueva del Clásico de otro jugador (las primeras 10 ciudades)
    select g.id, g.user_id into v_src from public.game_results g
      left join public.profiles p on p.id = g.user_id
      left join auth.users u on u.id = g.user_id
     where g.user_id <> p_user and g.game_type in ('classic','daily','challenge') and not g.suspicious and g.mode = 'world' and g.category = 'cities'
       and (not v_named or coalesce(p.display_name, '') <> '')
       and (select count(*) from public.game_rounds x
             where x.result_id = g.id and x.place_id is not null and x.click_lat is not null and x.round_no <= 10) = 10
       and not exists (select 1 from public.sprint_runs s where s.source_result_id = g.id and s.season_id = p_season)
     order by (p.country is not null) desc, coalesce(u.is_anonymous, true) asc, random() limit 1;
    exit when v_src.id is not null;
  end loop;
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

revoke all on function public._sprint_house_run(uuid, integer, integer) from public, anon, authenticated;

-- ── H) Seed: banderas y contornos (scripts/build-flags.mjs) ──────────────────
-- Generado por scripts/build-flags.mjs (banderas, Fase 6). No editar a mano.
insert into public.places (id, kind, name, country, lat, lon) values
  ('flag:AF', 'flag', 'Afghanistan', 'Afghanistan', 33.93, 66.09),
  ('flag:AL', 'flag', 'Albania', 'Albania', 41.14, 20.03),
  ('flag:DZ', 'flag', 'Algeria', 'Algeria', 28.15, 2.68),
  ('flag:AO', 'flag', 'Angola', 'Angola', -12.26, 17.47),
  ('flag:AR', 'flag', 'Argentina', 'Argentina', -35.16, -65.18),
  ('flag:AM', 'flag', 'Armenia', 'Armenia', 40.22, 45),
  ('flag:AU', 'flag', 'Australia', 'Australia', -25.56, 134.35),
  ('flag:AT', 'flag', 'Austria', 'Austria', 47.61, 14.07),
  ('flag:AZ', 'flag', 'Azerbaijan', 'Azerbaijan', 40.28, 47.68),
  ('flag:BS', 'flag', 'Bahamas', 'Bahamas', 24.51, -77.92),
  ('flag:BD', 'flag', 'Bangladesh', 'Bangladesh', 23.84, 90.27),
  ('flag:BY', 'flag', 'Belarus', 'Belarus', 53.51, 27.98),
  ('flag:BE', 'flag', 'Belgium', 'Belgium', 50.65, 4.58),
  ('flag:BZ', 'flag', 'Belize', 'Belize', 17.2, -88.7),
  ('flag:BJ', 'flag', 'Benin', 'Benin', 9.65, 2.34),
  ('flag:BT', 'flag', 'Bhutan', 'Bhutan', 27.43, 90.47),
  ('flag:BO', 'flag', 'Bolivia', 'Bolivia', -16.77, -64.64),
  ('flag:BA', 'flag', 'Bosnia and Herz.', 'Bosnia and Herz.', 44.18, 17.82),
  ('flag:BW', 'flag', 'Botswana', 'Botswana', -22.1, 23.77),
  ('flag:BR', 'flag', 'Brazil', 'Brazil', -10.83, -53.05),
  ('flag:BN', 'flag', 'Brunei', 'Brunei', 4.69, 114.92),
  ('flag:BG', 'flag', 'Bulgaria', 'Bulgaria', 42.75, 25.2),
  ('flag:BF', 'flag', 'Burkina Faso', 'Burkina Faso', 12.31, -1.78),
  ('flag:BI', 'flag', 'Burundi', 'Burundi', -3.38, 29.92),
  ('flag:KH', 'flag', 'Cambodia', 'Cambodia', 12.68, 104.87),
  ('flag:CM', 'flag', 'Cameroon', 'Cameroon', 5.75, 12.67),
  ('flag:CA', 'flag', 'Canada', 'Canada', 57.75, -101.64),
  ('flag:CF', 'flag', 'Central African Rep.', 'Central African Rep.', 6.51, 20.4),
  ('flag:TD', 'flag', 'Chad', 'Chad', 15.18, 18.53),
  ('flag:CL', 'flag', 'Chile', 'Chile', -37.39, -71.65),
  ('flag:CN', 'flag', 'China', 'China', 36.59, 103.92),
  ('flag:CO', 'flag', 'Colombia', 'Colombia', 3.95, -73.05),
  ('flag:CG', 'flag', 'Congo', 'Congo', -0.84, 15.13),
  ('flag:CR', 'flag', 'Costa Rica', 'Costa Rica', 9.97, -84.18),
  ('flag:CI', 'flag', 'Côte d''Ivoire', 'Côte d''Ivoire', 7.55, -5.61),
  ('flag:HR', 'flag', 'Croatia', 'Croatia', 45.02, 15.38),
  ('flag:CU', 'flag', 'Cuba', 'Cuba', 21.63, -78.96),
  ('flag:CY', 'flag', 'Cyprus', 'Cyprus', 34.91, 33.04),
  ('flag:CZ', 'flag', 'Czechia', 'Czechia', 49.78, 15.34),
  ('flag:CD', 'flag', 'Dem. Rep. Congo', 'Dem. Rep. Congo', -2.85, 23.59),
  ('flag:DK', 'flag', 'Denmark', 'Denmark', 56.22, 9.31),
  ('flag:DJ', 'flag', 'Djibouti', 'Djibouti', 11.77, 42.5),
  ('flag:DO', 'flag', 'Dominican Rep.', 'Dominican Rep.', 18.88, -70.46),
  ('flag:EC', 'flag', 'Ecuador', 'Ecuador', -1.45, -78.38),
  ('flag:EG', 'flag', 'Egypt', 'Egypt', 26.51, 29.84),
  ('flag:SV', 'flag', 'El Salvador', 'El Salvador', 13.72, -88.87),
  ('flag:GQ', 'flag', 'Eq. Guinea', 'Eq. Guinea', 1.65, 10.36),
  ('flag:ER', 'flag', 'Eritrea', 'Eritrea', 15.43, 38.67),
  ('flag:EE', 'flag', 'Estonia', 'Estonia', 58.64, 25.83),
  ('flag:SZ', 'flag', 'eSwatini', 'eSwatini', -26.49, 31.39),
  ('flag:ET', 'flag', 'Ethiopia', 'Ethiopia', 8.76, 39.45),
  ('flag:FJ', 'flag', 'Fiji', 'Fiji', -17.83, 178),
  ('flag:FI', 'flag', 'Finland', 'Finland', 64.5, 26.21),
  ('flag:FR', 'flag', 'France', 'France', 46.61, 2.34),
  ('flag:GA', 'flag', 'Gabon', 'Gabon', -0.65, 11.69),
  ('flag:GM', 'flag', 'Gambia', 'Gambia', 13.48, -15.43),
  ('flag:GE', 'flag', 'Georgia', 'Georgia', 42.16, 43.48),
  ('flag:DE', 'flag', 'Germany', 'Germany', 51.2, 10.25),
  ('flag:GH', 'flag', 'Ghana', 'Ghana', 7.93, -1.24),
  ('flag:GR', 'flag', 'Greece', 'Greece', 39.34, 22.56),
  ('flag:GT', 'flag', 'Guatemala', 'Guatemala', 15.7, -90.37),
  ('flag:GN', 'flag', 'Guinea', 'Guinea', 10.44, -11.08),
  ('flag:GW', 'flag', 'Guinea-Bissau', 'Guinea-Bissau', 12.02, -15.11),
  ('flag:GY', 'flag', 'Guyana', 'Guyana', 4.79, -58.97),
  ('flag:HT', 'flag', 'Haiti', 'Haiti', 18.9, -72.12),
  ('flag:HN', 'flag', 'Honduras', 'Honduras', 14.81, -86.61),
  ('flag:HU', 'flag', 'Hungary', 'Hungary', 47.2, 19.36),
  ('flag:IS', 'flag', 'Iceland', 'Iceland', 65.07, -18.76),
  ('flag:IN', 'flag', 'India', 'India', 22.9, 79.61),
  ('flag:ID', 'flag', 'Indonesia', 'Indonesia', -0.25, 114.02),
  ('flag:IR', 'flag', 'Iran', 'Iran', 32.54, 54.26),
  ('flag:IQ', 'flag', 'Iraq', 'Iraq', 33.04, 43.76),
  ('flag:IE', 'flag', 'Ireland', 'Ireland', 53.18, -8.01),
  ('flag:IL', 'flag', 'Israel', 'Israel', 31.49, 34.72),
  ('flag:IT', 'flag', 'Italy', 'Italy', 43.46, 12.17),
  ('flag:JM', 'flag', 'Jamaica', 'Jamaica', 18.14, -77.33),
  ('flag:JP', 'flag', 'Japan', 'Japan', 36.02, 136.89),
  ('flag:JO', 'flag', 'Jordan', 'Jordan', 31.25, 36.78),
  ('flag:KZ', 'flag', 'Kazakhstan', 'Kazakhstan', 48.07, 67.21),
  ('flag:KE', 'flag', 'Kenya', 'Kenya', 0.6, 37.79),
  ('flag:KW', 'flag', 'Kuwait', 'Kuwait', 29.31, 47.6),
  ('flag:KG', 'flag', 'Kyrgyzstan', 'Kyrgyzstan', 41.51, 74.62),
  ('flag:LA', 'flag', 'Laos', 'Laos', 18.45, 103.75),
  ('flag:LV', 'flag', 'Latvia', 'Latvia', 56.81, 24.84),
  ('flag:LB', 'flag', 'Lebanon', 'Lebanon', 33.91, 35.87),
  ('flag:LS', 'flag', 'Lesotho', 'Lesotho', -29.63, 28.17),
  ('flag:LR', 'flag', 'Liberia', 'Liberia', 6.43, -9.41),
  ('flag:LY', 'flag', 'Libya', 'Libya', 26.99, 17.92),
  ('flag:LT', 'flag', 'Lithuania', 'Lithuania', 55.28, 23.88),
  ('flag:LU', 'flag', 'Luxembourg', 'Luxembourg', 49.76, 5.97),
  ('flag:MK', 'flag', 'Macedonia', 'Macedonia', 41.61, 21.7),
  ('flag:MG', 'flag', 'Madagascar', 'Madagascar', -19.36, 46.69),
  ('flag:MW', 'flag', 'Malawi', 'Malawi', -13.17, 34.19),
  ('flag:MY', 'flag', 'Malaysia', 'Malaysia', 3.55, 114.67),
  ('flag:ML', 'flag', 'Mali', 'Mali', 17.07, -3.58),
  ('flag:MR', 'flag', 'Mauritania', 'Mauritania', 20.21, -10.33),
  ('flag:MX', 'flag', 'Mexico', 'Mexico', 23.92, -102.57),
  ('flag:MD', 'flag', 'Moldova', 'Moldova', 47.2, 28.41),
  ('flag:MN', 'flag', 'Mongolia', 'Mongolia', 46.82, 102.99),
  ('flag:ME', 'flag', 'Montenegro', 'Montenegro', 42.79, 19.29),
  ('flag:MA', 'flag', 'Morocco', 'Morocco', 30.06, -8.33),
  ('flag:MZ', 'flag', 'Mozambique', 'Mozambique', -17.24, 35.53),
  ('flag:MM', 'flag', 'Myanmar', 'Myanmar', 21.06, 96.52),
  ('flag:NA', 'flag', 'Namibia', 'Namibia', -22.1, 17.16),
  ('flag:NP', 'flag', 'Nepal', 'Nepal', 28.24, 84.01),
  ('flag:NL', 'flag', 'Netherlands', 'Netherlands', 52.3, 5.51),
  ('flag:NZ', 'flag', 'New Zealand', 'New Zealand', -43.99, 170.51),
  ('flag:NI', 'flag', 'Nicaragua', 'Nicaragua', 12.87, -84.99),
  ('flag:NE', 'flag', 'Niger', 'Niger', 17.28, 9.36),
  ('flag:NG', 'flag', 'Nigeria', 'Nigeria', 9.56, 7.98),
  ('flag:KP', 'flag', 'North Korea', 'North Korea', 40.14, 127.16),
  ('flag:NO', 'flag', 'Norway', 'Norway', 64.54, 12.21),
  ('flag:OM', 'flag', 'Oman', 'Oman', 20.58, 56.1),
  ('flag:PK', 'flag', 'Pakistan', 'Pakistan', 29.85, 69.27),
  ('flag:PS', 'flag', 'Palestine', 'Palestine', 31.94, 35.27),
  ('flag:PA', 'flag', 'Panama', 'Panama', 8.56, -80.17),
  ('flag:PG', 'flag', 'Papua New Guinea', 'Papua New Guinea', -6.65, 144.33),
  ('flag:PY', 'flag', 'Paraguay', 'Paraguay', -23.25, -58.39),
  ('flag:PE', 'flag', 'Peru', 'Peru', -9.15, -74.38),
  ('flag:PH', 'flag', 'Philippines', 'Philippines', 15.75, 121.54),
  ('flag:PL', 'flag', 'Poland', 'Poland', 52.15, 19.31),
  ('flag:PT', 'flag', 'Portugal', 'Portugal', 39.63, -8.06),
  ('flag:QA', 'flag', 'Qatar', 'Qatar', 25.32, 51.18),
  ('flag:RO', 'flag', 'Romania', 'Romania', 45.86, 24.94),
  ('flag:RU', 'flag', 'Russia', 'Russia', 61.62, 98.87),
  ('flag:RW', 'flag', 'Rwanda', 'Rwanda', -2.01, 29.92),
  ('flag:SS', 'flag', 'S. Sudan', 'S. Sudan', 7.32, 30.17),
  ('flag:SA', 'flag', 'Saudi Arabia', 'Saudi Arabia', 24.1, 44.48),
  ('flag:SN', 'flag', 'Senegal', 'Senegal', 14.36, -14.51),
  ('flag:RS', 'flag', 'Serbia', 'Serbia', 44.23, 20.82),
  ('flag:SL', 'flag', 'Sierra Leone', 'Sierra Leone', 8.53, -11.8),
  ('flag:SK', 'flag', 'Slovakia', 'Slovakia', 48.73, 19.51),
  ('flag:SI', 'flag', 'Slovenia', 'Slovenia', 46.13, 14.94),
  ('flag:SB', 'flag', 'Solomon Is.', 'Solomon Is.', -7.9, 159.11),
  ('flag:SO', 'flag', 'Somalia', 'Somalia', 4.75, 45.72),
  ('flag:ZA', 'flag', 'South Africa', 'South Africa', -28.93, 25.01),
  ('flag:KR', 'flag', 'South Korea', 'South Korea', 36.43, 127.82),
  ('flag:ES', 'flag', 'Spain', 'Spain', 40.26, -3.67),
  ('flag:LK', 'flag', 'Sri Lanka', 'Sri Lanka', 7.7, 80.67),
  ('flag:SD', 'flag', 'Sudan', 'Sudan', 15.96, 29.77),
  ('flag:SR', 'flag', 'Suriname', 'Suriname', 4.12, -55.91),
  ('flag:SE', 'flag', 'Sweden', 'Sweden', 62.81, 16.6),
  ('flag:CH', 'flag', 'Switzerland', 'Switzerland', 46.79, 8.12),
  ('flag:SY', 'flag', 'Syria', 'Syria', 35.01, 38.54),
  ('flag:TJ', 'flag', 'Tajikistan', 'Tajikistan', 38.58, 71.03),
  ('flag:TZ', 'flag', 'Tanzania', 'Tanzania', -6.26, 34.75),
  ('flag:TH', 'flag', 'Thailand', 'Thailand', 14.84, 100.99),
  ('flag:TL', 'flag', 'Timor-Leste', 'Timor-Leste', -8.77, 125.97),
  ('flag:TG', 'flag', 'Togo', 'Togo', 8.44, 1),
  ('flag:TT', 'flag', 'Trinidad and Tobago', 'Trinidad and Tobago', 10.43, -61.33),
  ('flag:TN', 'flag', 'Tunisia', 'Tunisia', 34.17, 9.54),
  ('flag:TR', 'flag', 'Turkey', 'Turkey', 38.94, 35.5),
  ('flag:TM', 'flag', 'Turkmenistan', 'Turkmenistan', 39.05, 59.33),
  ('flag:UG', 'flag', 'Uganda', 'Uganda', 1.3, 32.36),
  ('flag:UA', 'flag', 'Ukraine', 'Ukraine', 49.13, 31.23),
  ('flag:AE', 'flag', 'United Arab Emirates', 'United Arab Emirates', 23.87, 54.21),
  ('flag:GB', 'flag', 'United Kingdom', 'United Kingdom', 53.89, -2.66),
  ('flag:US', 'flag', 'United States of America', 'United States of America', 39.49, -99.07),
  ('flag:UY', 'flag', 'Uruguay', 'Uruguay', -32.78, -56),
  ('flag:UZ', 'flag', 'Uzbekistan', 'Uzbekistan', 41.5, 63.64),
  ('flag:VU', 'flag', 'Vanuatu', 'Vanuatu', -15.22, 166.91),
  ('flag:VE', 'flag', 'Venezuela', 'Venezuela', 7.19, -66.14),
  ('flag:VN', 'flag', 'Vietnam', 'Vietnam', 16.65, 106.97),
  ('flag:YE', 'flag', 'Yemen', 'Yemen', 15.91, 47.53),
  ('flag:ZM', 'flag', 'Zambia', 'Zambia', -13.41, 28.08),
  ('flag:ZW', 'flag', 'Zimbabwe', 'Zimbabwe', -18.91, 29.79)
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;

delete from public.place_shapes where place_id like 'flag:%';
insert into public.place_shapes (place_id, ring_no, lons, lats) values
  ('flag:AF', 0, array[66.52,67.83,68.86,69.52,70.27,70.81,71.24,71.45,72.19,73.26,74.98,74.58,72.92,71.26,71.61,71.16,69.93,69.69,69.32,68.56,67.68,66.38,65.05,64.15,62.55,61.78,60.94,60.54,60.53,61.21,62.98,63.98,64.74,65.75,66.52]::double precision[], array[37.36,37.15,37.34,37.61,37.73,38.49,37.95,37.07,36.95,37.5,37.42,37.02,36.72,36.07,35.15,34.35,34.02,33.11,31.9,31.71,31.3,30.74,29.47,29.34,29.32,30.74,31.55,32.98,33.68,35.65,35.4,36.01,37.11,37.66,37.36]::double precision[]),
  ('flag:AL', 0, array[21.02,21,20.67,20.62,20.15,19.98,19.96,19.41,19.32,19.4,19.54,19.37,19.31,19.74,19.8,20.07,20.28,20.52,20.59,20.46,20.6,21.02]::double precision[], array[40.84,40.58,40.44,40.11,39.63,39.69,39.91,40.25,40.73,41.41,41.72,41.88,42.2,42.69,42.5,42.59,42.32,42.22,41.86,41.52,41.09,40.84]::double precision[]),
  ('flag:DZ', 0, array[-8.69,-8.67,-7.06,-5.24,-3.69,-3.07,-1.31,-1.39,-1.79,-1.21,0.5,3.16,5.32,7.33,8.42,8.38,7.53,8.43,9.06,9.8,9.68,9.63,9.32,9.95,10.77,12,5.68,3.16,2.68,1.82,-4.92,-8.69]::double precision[], array[27.4,27.66,29.58,30,30.9,31.72,32.26,32.86,34.53,35.72,36.3,36.78,36.72,37.12,36.95,35.48,34.1,32.75,32.1,29.42,28.14,27.14,26.09,24.94,24.56,23.47,19.6,19.06,19.86,20.61,24.97,27.4]::double precision[]),
  ('flag:AO', 0, array[12.99,12.63,12.47,12.44,12.18,11.91,12.32,12.62,12.99]::double precision[], array[-4.78,-4.99,-5.25,-5.68,-5.79,-5.04,-4.61,-4.44,-4.78]::double precision[]),
  ('flag:AO', 1, array[12.32,13.02,16.33,16.86,17.47,18.46,19.17,20.04,20.6,21.73,21.95,21.88,22.16,22.84,23.91,23.9,23.93,21.93,22.56,21.38,18.26,14.06,12.81,11.73,11.78,12.18,12.74,13.64,13.69,13.12,12.93,12.93,12.23,12.32]::double precision[], array[-6.1,-5.98,-5.88,-7.22,-8.07,-7.85,-7.74,-7.12,-6.94,-7.29,-8.31,-9.52,-11.08,-11.02,-10.93,-11.72,-12.57,-12.9,-16.9,-17.93,-17.31,-17.42,-16.94,-17.3,-15.79,-14.45,-13.14,-12.04,-10.73,-9.77,-8.96,-7.6,-6.29,-6.1]::double precision[]),
  ('flag:AR', 0, array[-68.63,-68.25,-67.75,-66.45,-65.05,-65.5,-66.45,-66.96,-67.56,-68.63,-68.63]::double precision[], array[-52.64,-53.1,-53.85,-54.45,-54.7,-55.2,-55.25,-54.9,-54.87,-54.87,-52.64]::double precision[]),
  ('flag:AR', 1, array[-57.62,-58.14,-58.35,-58.5,-57.36,-56.79,-59.23,-62.34,-62.33,-62.75,-64.73,-64.98,-63.75,-64.38,-65.33,-66.51,-67.58,-65.64,-67.17,-68.73,-68.82,-68.57,-71.92,-72.31,-73.33,-72.65,-72.45,-71.55,-71.22,-71.79,-71.92,-71.75,-71.68,-70.81,-71.12,-70.39,-69.81,-70.53,-70.02,-69,-68.59,-68.42,-66.98,-66.27,-64.38,-62.85,-60.85,-58.81,-57.63,-57.61,-55.69,-54.63,-53.63,-54.49,-56.29,-57.62]::double precision[], array[-30.22,-32.04,-33.26,-34.43,-35.98,-36.9,-38.72,-38.83,-40.17,-41.03,-40.8,-42.06,-42.04,-42.87,-44.5,-45.04,-46.3,-47.24,-48.7,-50.27,-51.77,-52.3,-52.01,-50.68,-50.38,-48.88,-47.74,-45.56,-44.78,-44.21,-43.41,-42.05,-39.81,-38.55,-36.66,-35.17,-33.27,-31.36,-29.37,-27.52,-26.51,-24.52,-22.99,-21.83,-22.8,-22.03,-23.88,-24.77,-25.6,-27.4,-27.39,-25.74,-26.12,-27.47,-28.85,-30.22]::double precision[]),
  ('flag:AM', 0, array[46.51,46.14,45.74,45.74,45.3,45,44.79,44.4,43.66,43.75,43.58,44.97,45.18,45.56,45.36,45.89,45.61,46.04,46.48,46.51]::double precision[], array[38.77,38.74,39.32,39.47,39.47,39.74,39.71,40,40.25,40.74,41.09,41.25,40.99,40.81,40.56,40.22,39.9,39.63,39.46,38.77]::double precision[]),
  ('flag:AU', 0, array[147.69,148.29,148.36,148.02,147.91,147.56,146.87,146.66,146.05,145.43,145.3,144.72,144.74,145.4,146.36,146.91,147.69]::double precision[], array[-40.81,-40.87,-42.06,-42.41,-43.21,-42.94,-43.64,-43.58,-43.55,-42.69,-42.03,-41.16,-40.7,-40.79,-41.14,-41,-40.81]::double precision[]),
  ('flag:AU', 1, array[126.15,124.22,123.66,122.18,120.58,119.3,118.5,117.29,115.56,115.05,115.71,115.8,115.16,115.04,114.62,114.05,113.34,113.44,114.23,113.72,113.39,113.71,113.74,114.22,115.46,116.71,117.44,118.84,119.25,120.86,121.65,122.29,123.01,123.86,123.82,124.38,125.17,125.69,126.14,127.07,128.36,129.62,129.89,130.18,131.22,132.58,131.82,133.02,134.39,135.3,136.26,136.95,136.31,136.08,135.43,136.3,137.58,138.59,139.26,140.87,141.27,141.7,141.63,141.65,141.69,142.12,142.52,142.87,143.16,143.6,143.92,144.9,145.27,145.64,146.16,146.39,148.18,148.72,149.68,150.48,150.9,152.07,153.14,153.09,153.51,153.07,152.89,151.71,151.01,150.33,149.95,149.42,147.38,146.32,144.88,144.49,142.75,141.61,139.99,139.58,138.12,138.21,136.83,137.51,137.81,136.37,135.21,134.61,134.27,132.29,129.53,127.1,126.15]::double precision[], array[-32.22,-32.96,-33.89,-34,-33.93,-34.51,-34.75,-35.03,-34.39,-33.62,-33.26,-32.21,-30.6,-29.46,-28.52,-27.33,-26.12,-25.62,-26.3,-25,-24.38,-23.56,-22.47,-22.52,-21.49,-20.7,-20.75,-20.26,-19.95,-19.68,-18.71,-17.8,-16.41,-17.07,-16.11,-15.57,-14.68,-14.23,-14.1,-13.82,-14.87,-14.97,-13.62,-13.11,-12.18,-12.11,-11.27,-11.38,-12.04,-12.25,-12.05,-12.35,-13.29,-13.72,-14.72,-15.55,-16.22,-16.81,-17.37,-17.37,-16.39,-15.04,-14.27,-12.94,-12.41,-11.33,-10.67,-11.78,-12.33,-13.4,-14.55,-14.59,-15.43,-16.78,-17.76,-18.96,-19.96,-20.63,-22.34,-22.56,-23.46,-24.46,-26.07,-27.26,-28.99,-30.35,-31.64,-33.04,-34.31,-35.67,-37.11,-37.77,-38.22,-39.04,-38.42,-38.09,-38.54,-38.31,-37.4,-36.14,-35.61,-34.39,-35.26,-34.13,-32.9,-34.09,-34.48,-33.22,-32.62,-31.98,-31.59,-32.28,-32.22]::double precision[]),
  ('flag:AT', 0, array[16.98,16.9,16.34,16.53,16.2,16.01,15.14,14.63,13.81,12.38,12.15,11.17,11.05,10.44,9.93,9.48,9.63,9.6,9.89,10.4,10.54,11.42,12.14,12.62,12.93,13.03,12.88,13.24,13.6,14.34,14.9,15.26,16.03,16.5,16.96,16.88,16.98]::double precision[], array[48.12,47.72,47.71,47.5,46.85,46.68,46.66,46.43,46.51,46.77,47.11,46.94,46.75,46.89,46.92,47.1,47.35,47.52,47.58,47.3,47.57,47.52,47.7,47.67,47.47,47.64,48.29,48.42,48.88,48.56,48.96,49.04,48.73,48.79,48.6,48.47,48.12]::double precision[]),
  ('flag:AZ', 0, array[46.41,46.69,47.37,47.81,47.99,48.58,49.11,49.62,50.09,50.39,49.57,49.39,49.22,48.86,48.88,48.63,48.01,48.35,48.06,47.68,46.51,46.48,46.04,45.61,45.89,45.36,45.56,45.18,44.97,45.22,45.96,46.5,46.64,46.15,46.41]::double precision[], array[41.86,41.83,41.22,41.15,41.41,41.81,41.28,40.57,40.53,40.26,40.18,39.4,39.05,38.82,38.32,38.27,38.79,39.29,39.58,39.51,38.77,39.46,39.63,39.9,40.22,40.56,40.81,40.99,41.25,41.41,41.12,41.06,41.18,41.72,41.86]::double precision[]),
  ('flag:AZ', 1, array[46.14,45.46,44.95,44.79,45,45.3,45.74,45.74,46.14]::double precision[], array[38.74,38.87,39.34,39.71,39.74,39.47,39.47,39.32,38.74]::double precision[]),
  ('flag:BS', 0, array[-78.98,-78.51,-77.85,-77.82,-78.91,-78.98]::double precision[], array[26.79,26.87,26.84,26.58,26.42,26.79]::double precision[]),
  ('flag:BS', 1, array[-77.79,-77,-77.17,-77.36,-77.34,-77.79,-77.79]::double precision[], array[27.04,26.59,25.88,26.01,26.53,26.93,27.04]::double precision[]),
  ('flag:BS', 2, array[-78.19,-77.89,-77.54,-77.54,-77.78,-78.03,-78.41,-78.19]::double precision[], array[25.21,25.17,24.34,23.76,23.71,24.29,24.57,25.21]::double precision[]),
  ('flag:BD', 0, array[92.67,92.65,92.3,92.37,92.08,92.03,91.84,91.42,90.5,90.59,90.27,89.85,89.7,89.42,89.03,88.88,88.53,88.7,88.08,88.31,88.93,88.21,88.56,89.35,89.83,89.92,90.87,91.8,92.38,91.91,91.47,91.16,91.71,91.87,92.14,92.67]::double precision[], array[22.04,21.32,21.48,20.67,21.19,21.7,22.18,22.77,22.8,22.39,21.84,22.04,21.86,21.97,22.06,22.88,23.63,24.23,24.5,24.87,25.24,25.77,26.45,26.02,25.96,25.27,25.13,25.15,24.98,24.13,24.07,23.5,22.99,23.62,23.63,22.04]::double precision[]),
  ('flag:BY', 0, array[28.18,29.23,29.37,29.9,30.88,30.97,30.76,31.38,31.79,31.73,32.41,32.69,32.3,31.5,31.3,31.54,31.79,30.93,30.62,30.56,30.16,29.26,28.99,28.62,28.24,27.46,26.34,25.33,24.55,24.01,23.53,23.51,23.2,23.8,23.81,23.53,23.48,24.45,25.54,25.77,26.59,26.49,27.1,28.18]::double precision[], array[56.17,55.92,55.67,55.79,55.55,55.08,54.81,54.16,53.97,53.79,53.62,53.35,53.13,53.17,53.07,52.74,52.1,52.04,51.82,51.32,51.42,51.37,51.6,51.43,51.57,51.59,51.83,51.91,51.89,51.62,51.58,52.02,52.49,52.69,53.09,53.47,53.91,53.91,54.28,54.85,55.17,55.61,55.78,56.17]::double precision[]),
  ('flag:BE', 0, array[6.16,6.04,5.78,5.68,4.8,4.29,3.59,3.12,2.66,2.51,3.31,4.05,4.97,5.61,6.16]::double precision[], array[50.8,50.13,50.09,49.53,49.99,49.91,50.38,50.78,50.8,51.15,51.35,51.27,51.47,51.04,50.8]::double precision[]),
  ('flag:BZ', 0, array[-89.14,-89.15,-89.03,-88.85,-88.49,-88.3,-88.3,-88.11,-88.12,-88.29,-88.2,-88.3,-88.24,-88.35,-88.55,-88.73,-88.93,-89.23,-89.15,-89.14]::double precision[], array[17.81,17.96,18,17.88,18.49,18.5,18.35,18.35,18.08,17.64,17.49,17.13,17.04,16.53,16.27,16.23,15.89,15.89,17.02,17.81]::double precision[]),
  ('flag:BJ', 0, array[2.69,1.87,1.62,1.67,1.46,1.42,1.08,0.77,0.9,1.24,1.45,1.94,2.15,2.49,2.85,3.61,3.57,3.8,3.6,3.71,3.22,2.91,2.72,2.75,2.69]::double precision[], array[6.26,6.14,6.83,9.13,9.34,9.83,10.18,10.47,11,11.11,11.55,11.64,11.94,12.23,12.24,11.66,11.33,10.73,10.33,10.06,9.44,9.14,8.51,7.87,6.26]::double precision[]),
  ('flag:BT', 0, array[91.7,92.11,92.03,91.22,90.37,89.74,88.84,88.81,89.48,90.02,90.73,91.26,91.7]::double precision[], array[27.77,27.45,26.84,26.81,26.88,26.72,27.1,27.3,28.04,28.3,28.06,28.04,27.77]::double precision[]),
  ('flag:BO', 0, array[-69.53,-68.27,-67.17,-65.34,-65.32,-64.32,-62.8,-61.71,-60.5,-60.26,-60.54,-58.24,-58.28,-57.5,-57.95,-58.17,-59.11,-61.79,-62.29,-62.85,-64.38,-66.27,-67.83,-68.76,-68.97,-69.59,-69.39,-69.34,-68.93,-68.67,-69.53]::double precision[], array[-10.95,-11.01,-10.31,-9.76,-10.9,-12.46,-13,-13.49,-13.78,-14.65,-15.09,-16.3,-17.27,-18.17,-19.4,-20.18,-19.36,-19.63,-21.05,-22.03,-22.8,-21.83,-22.87,-20.37,-18.98,-17.58,-15.66,-14.95,-13.6,-12.56,-10.95]::double precision[]),
  ('flag:BA', 0, array[18.56,17.67,17.3,16.91,16.46,16.24,15.75,15.96,16.32,16.53,17,17.86,18.55,19.01,19.37,19.12,19.6,19.45,19.22,19.03,18.71,18.56]::double precision[], array[42.65,43.03,43.45,43.67,44.04,44.35,44.82,45.23,45,45.21,45.23,45.07,45.08,44.86,44.86,44.42,44.04,43.57,43.52,43.43,43.2,42.65]::double precision[]),
  ('flag:BW', 0, array[29.43,28.02,27.12,26.79,26.49,25.94,25.77,25.67,25.03,24.21,23.73,23.31,22.83,22.58,22.11,21.61,20.89,20.67,20.76,20.17,19.9,19.9,20.88,20.91,21.66,23.2,23.58,24.22,24.52,25.08,25.26,25.65,25.85,26.16,27.3,27.73,27.73,28.02,28.79,29.43]::double precision[], array[-22.09,-22.83,-23.58,-24.24,-24.62,-24.7,-25.17,-25.49,-25.72,-25.67,-25.39,-25.27,-25.5,-25.98,-26.28,-26.73,-26.83,-26.48,-25.87,-24.92,-24.77,-21.85,-21.81,-18.25,-18.22,-17.87,-18.28,-17.89,-17.89,-17.66,-17.74,-18.54,-18.71,-19.29,-20.39,-20.5,-20.85,-21.49,-21.64,-22.09]::double precision[]),
  ('flag:BR', 0, array[-53.37,-53.21,-54.57,-55.97,-57.62,-55.16,-53.65,-54.13,-54.43,-54.29,-55.03,-55.52,-55.8,-56.88,-57.87,-57.85,-57.67,-57.74,-58.39,-60.16,-60.25,-60.46,-61.08,-62.13,-63.2,-65.4,-65.44,-66.65,-68.05,-68.79,-70.09,-70.48,-72.19,-73.23,-73.57,-73.72,-73.12,-72.96,-71.75,-70.8,-69.44,-69.58,-70.02,-69.25,-69.8,-67.87,-67.26,-66.88,-65.55,-64.61,-64.08,-63.42,-64.41,-64.82,-63.89,-62.8,-60.97,-60.73,-59.98,-59.77,-59.82,-59.72,-59.03,-58.43,-57.66,-56.78,-56,-56.07,-55.57,-54.52,-53.78,-53.42,-52.56,-51.66,-51.07,-49.97,-50.7,-48.62,-47.82,-44.91,-44.58,-41.47,-38.5,-36.45,-35.24,-34.73,-35.64,-37.68,-38.67,-38.88,-39.27,-39.76,-40.95,-41.99,-44.65,-46.47,-48.49,-48.48,-48.89,-50.7,-52.26,-53.37]::double precision[], array[-33.77,-32.73,-31.49,-30.88,-30.22,-27.88,-26.92,-25.55,-25.16,-24.02,-24,-23.57,-22.36,-22.28,-20.73,-19.97,-18.96,-17.55,-16.88,-16.26,-15.08,-14.35,-13.48,-13.2,-12.63,-11.57,-10.51,-9.93,-10.71,-11.04,-11.12,-9.49,-10.05,-9.46,-8.42,-7.34,-6.63,-5.74,-4.59,-4.25,-1.56,-0.55,0.54,0.6,1.09,1.69,1.72,1.25,0.79,1.33,1.92,2.41,3.13,4.06,4.02,4.01,4.54,5.2,5.01,4.42,3.61,2.25,1.32,1.46,1.68,1.86,1.82,2.22,2.42,2.31,2.38,2.05,2.5,4.16,3.65,1.74,0.22,-0.23,-0.58,-1.55,-2.69,-2.91,-3.7,-5.11,-5.46,-7.34,-9.65,-12.17,-13.06,-15.67,-17.87,-19.6,-21.94,-22.97,-23.35,-24.09,-25.88,-27.18,-28.67,-30.99,-32.25,-33.77]::double precision[]),
  ('flag:BN', 0, array[115.45,115.4,115.35,114.87,114.66,114.21,114.6,115.45]::double precision[], array[5.45,4.95,4.32,4.35,4.01,4.53,4.9,5.45]::double precision[]),
  ('flag:BG', 0, array[22.66,22.94,23.33,24.1,25.57,26.07,27.24,27.97,28.56,28.04,27.68,28,27.14,26.12,26.11,25.2,24.49,23.69,22.95,22.88,22.38,22.55,22.44,22.61,22.98,22.5,22.41,22.66]::double precision[], array[44.24,43.82,43.9,43.74,43.69,43.94,44.18,43.81,43.71,43.29,42.58,42.01,42.14,41.83,41.33,41.23,41.58,41.31,41.34,42,42.32,42.46,42.58,42.9,43.21,43.64,44.01,44.24]::double precision[]),
  ('flag:BF', 0, array[-5.41,-5.47,-5.2,-5.22,-4.43,-4.28,-4.01,-3.52,-3.11,-2.97,-2.19,-2,-1.07,-0.52,-0.26,0.38,0.3,0.43,0.99,1.02,2.18,2.15,1.94,1.45,1.24,0.9,0.02,-0.44,-0.76,-1.2,-2.94,-2.96,-2.83,-3.51,-3.98,-4.33,-4.78,-4.96,-5.41]::double precision[], array[10.37,10.95,11.37,11.71,12.54,13.23,13.47,13.34,13.54,13.8,14.25,14.56,14.97,15.12,14.92,14.93,14.44,13.99,13.34,12.85,12.63,11.94,11.64,11.55,11.11,11,11.02,11.1,10.94,11.01,10.96,10.39,9.64,9.9,9.86,9.61,9.82,10.15,10.37]::double precision[]),
  ('flag:BI', 0, array[30.47,30.53,30.74,30.75,30.5,30.12,29.75,29.34,29.28,29.03,29.63,29.94,30.47]::double precision[], array[-2.41,-2.81,-3.03,-3.36,-3.57,-4.09,-4.45,-4.5,-3.29,-2.84,-2.92,-2.35,-2.41]::double precision[]),
  ('flag:KH', 0, array[102.58,102.35,102.99,104.28,105.22,106.04,106.5,107.38,107.61,107.49,105.81,106.25,105.2,104.33,103.5,103.09,102.58]::double precision[], array[12.19,13.39,14.23,14.42,14.27,13.88,14.57,14.2,13.54,12.34,11.57,10.96,10.89,10.49,10.63,11.15,12.19]::double precision[]),
  ('flag:CM', 0, array[14.5,14.96,15.47,14.63,13.96,14.98,15.44,14.78,14.46,14.48,15.04,15.86,16.01,15.15,13.08,12.36,11.28,9.79,8.95,8.49,8.76,9.52,10.5,11.75,12.07,12.75,13.17,13.57,14.47,14.18,14.5]::double precision[], array[12.86,11.56,9.98,9.92,9.55,8.8,7.69,6.41,5.45,4.73,3.85,3.01,2.27,1.96,2.27,2.19,2.26,3.07,3.9,4.5,5.48,6.45,7.06,6.98,7.8,8.72,9.64,10.8,11.9,12.48,12.86]::double precision[]),
  ('flag:CA', 0, array[-122.84,-124.91,-127.44,-127.85,-129.3,-130.54,-130.01,-132.73,-134.27,-135.47,-137.45,-139.04,-141,-140.99,-137.54,-135.63,-132.93,-129.79,-128.36,-127.45,-124.43,-123.06,-121.47,-117.6,-115.25,-115.3,-110.8,-108.88,-108.81,-106.95,-105.34,-103.22,-99.9,-98.56,-96.12,-95.49,-94.23,-96.47,-95.21,-92.88,-92.41,-90.55,-88.02,-87.35,-85.58,-84.1,-81.28,-81.96,-81.39,-84.74,-86.07,-87.32,-89.91,-90.77,-93.16,-94.63,-93.21,-92.3,-89.04,-87.32,-85.01,-82.27,-82.13,-79.91,-78.6,-79.83,-77.1,-76.62,-78.52,-77.77,-77.41,-74.67,-72.91,-71.37,-69.62,-68.37,-66.2,-64.58,-62.5,-61.8,-59.57,-57.33,-56.16,-55.68,-57.13,-60.03,-63.86,-66.4,-68.51,-71.11,-68.65,-65.06,-65.12,-64.47,-61.52,-60.45,-61.04,-64.25,-66.12,-64.42,-67.14,-67.79,-68.91,-70,-70.66,-71.4,-73.35,-75.32,-76.5,-77.74,-79.17,-78.92,-80.25,-82.44,-83.03,-83.12,-82.43,-82.34,-83.59,-83.62,-84.09,-84.34,-84.55,-84.88,-86.46,-88.38,-89.6,-91.64,-93.63,-94.64,-95.15,-97.23,-104.05,-110.05,-116.05,-120,-122.84]::double precision[], array[49,49.99,50.83,52.33,53.56,54.8,55.92,57.69,58.86,59.79,58.91,60,60.31,69.71,68.99,69.32,69.51,70.19,70.01,70.38,70.16,69.56,69.8,69.01,68.91,67.9,67.81,67.38,68.31,68.7,68.56,68.1,67.81,68.4,68.24,68.09,69.07,70.09,71.92,71.32,69.7,68.47,68.62,67.2,68.78,69.81,69.16,68.13,67.11,66.26,66.06,64.77,64.03,62.96,62.02,60.11,58.78,57.09,56.85,56,55.3,55.15,53.28,51.21,52.56,54.67,55.84,57.2,58.81,60.76,62.55,62.18,62.11,61.14,60.22,58.8,58.77,60.34,58.17,56.34,55.2,54.63,53.65,52.15,51.42,50.24,50.29,50.23,49.07,46.82,48.3,49.23,48.07,46.24,45.88,46.28,45.26,44.27,43.62,45.29,45.14,47.07,47.19,46.69,45.46,45.25,45.01,44.82,44.02,43.63,43.47,42.96,42.37,41.67,41.83,42.08,42.98,44.44,45.82,46.12,46.28,46.41,46.54,46.9,47.55,48.3,48.01,48.14,48.61,48.84,49.38,49,49,49,49,49,49]::double precision[]),
  ('flag:CA', 1, array[-83.99,-83.25,-81.88,-81.9,-83.07,-83.77,-83.99]::double precision[], array[62.45,62.91,62.9,62.71,62.16,62.18,62.45]::double precision[]),
  ('flag:CA', 2, array[-79.77,-80.88,-80.83,-80.35,-78.06,-76.34,-76.25,-77.32,-78.39,-79.49,-79.77]::double precision[], array[72.8,73.33,73.69,73.76,73.65,73.1,72.83,72.86,72.88,72.74,72.8]::double precision[]),
  ('flag:CA', 3, array[-80.32,-79.93,-79.52,-79.27,-79.66,-80.1,-80.36,-80.32]::double precision[], array[62.09,62.38,62.36,62.16,61.63,61.72,62.02,62.09]::double precision[]),
  ('flag:CA', 4, array[-93.61,-94.16,-95.61,-96.82,-96.29,-94.85,-93.98,-93.61]::double precision[], array[74.98,74.59,74.67,74.93,75.38,75.65,75.3,74.98]::double precision[]),
  ('flag:CA', 5, array[-93.84,-94.29,-96.17,-96.44,-94.42,-93.72,-93.84]::double precision[], array[77.52,77.49,77.56,77.83,77.82,77.63,77.52]::double precision[]),
  ('flag:CA', 6, array[-96.75,-95.56,-95.83,-97.31,-98.12,-98.55,-98.63,-97.34,-96.75]::double precision[], array[78.77,78.42,78.06,77.85,78.08,78.46,78.87,78.83,78.77]::double precision[]),
  ('flag:CA', 7, array[-88.15,-89.77,-92.42,-92.77,-92.89,-93.89,-95.96,-97.12,-96.75,-94.68,-93.57,-91.6,-90.74,-90.97,-89.82,-89.19,-87.84,-86.38,-84.79,-82.75,-81.13,-80.06,-79.83,-80.46,-81.95,-83.23,-86.1,-88.15]::double precision[], array[74.39,74.52,74.84,75.39,75.88,76.32,76.44,76.75,77.16,77.1,76.78,76.78,76.45,76.07,75.85,75.61,75.57,75.48,75.7,75.78,75.71,75.34,74.92,74.66,74.44,74.56,74.41,74.39]::double precision[]),
  ('flag:CA', 8, array[-111.26,-109.85,-110.19,-112.05,-113.53,-112.73,-111.26]::double precision[], array[78.15,78,77.7,77.41,77.73,78.05,78.15]::double precision[]),
  ('flag:CA', 9, array[-110.96,-109.66,-110.88,-112.54,-112.52,-111.5,-110.96]::double precision[], array[78.8,78.6,78.41,78.41,78.55,78.85,78.8]::double precision[]),
  ('flag:CA', 10, array[-55.6,-56.13,-56.8,-56.14,-55.47,-55.82,-54.93,-54.47,-53.48,-53.79,-53.09,-52.96,-52.65,-53.07,-53.52,-54.18,-53.96,-54.24,-55.4,-56,-55.29,-56.25,-57.33,-59.27,-59.42,-58.8,-59.23,-58.39,-57.36,-56.74,-55.87,-55.41,-55.6]::double precision[], array[51.32,50.69,49.81,50.15,49.94,49.59,49.31,49.56,49.25,48.52,48.69,48.16,47.54,46.66,46.62,46.81,47.63,47.75,46.88,46.92,47.39,47.63,47.57,47.6,47.9,48.25,48.52,49.13,50.72,51.29,51.63,51.59,51.32]::double precision[]),
  ('flag:CA', 11, array[-83.88,-82.79,-81.64,-81.55,-80.82,-80.1,-80.99,-82.55,-83.11,-84.1,-85.52,-85.87,-87.22,-86.35,-86.23,-85.88,-85.16,-84.98,-84.46,-83.88]::double precision[], array[65.11,64.77,64.45,63.98,64.06,63.73,63.41,63.65,64.1,63.57,63.05,63.64,63.54,64.04,64.82,65.74,65.66,65.22,65.37,65.11]::double precision[]),
  ('flag:CA', 12, array[-78.77,-75.61,-74.1,-71.2,-67.92,-68.81,-64.86,-61.85,-63.92,-66.72,-68.14,-65.73,-64.67,-66.27,-67.37,-66.17,-71.02,-71.89,-74.84,-77.71,-77.9,-73.96,-73.95,-72.93,-74.84,-76.23,-78.17,-79.49,-84.94,-88.68,-88.47,-90.2,-88.41,-86.56,-84.85,-80.6,-78.77]::double precision[], array[72.35,72.24,71.33,70.92,70.12,68.72,67.85,66.86,65,66.39,65.69,64.65,63.39,62.95,62.88,61.93,62.91,63.68,64.68,64.23,65.31,65.46,66.31,67.73,68.55,69.15,69.83,69.87,69.97,70.41,71.22,72.24,73.54,73.16,73.34,72.72,72.35]::double precision[]),
  ('flag:CA', 13, array[-94.5,-92.42,-90.51,-92,-93.2,-94.27,-95.41,-96.03,-96.02,-95.5,-94.5]::double precision[], array[74.13,74.1,73.86,72.97,72.77,72.02,72.06,72.94,73.44,73.86,74.13]::double precision[]),
  ('flag:CA', 14, array[-122.86,-121.16,-119.11,-117.57,-116.2,-116.34,-117.11,-118.04,-119.9,-121.5,-122.86]::double precision[], array[76.12,76.86,77.51,77.5,77.65,76.88,76.53,76.48,76.05,75.9,76.12]::double precision[]),
  ('flag:CA', 15, array[-132.71,-131.75,-132.05,-131.18,-131.58,-132.18,-132.55,-133.06,-133.24,-133.18,-132.71]::double precision[], array[54.04,54.12,52.98,52.18,52.18,52.64,53.1,53.41,53.85,54.17,54.04]::double precision[]),
  ('flag:CA', 16, array[-105.49,-103.53,-100.82,-100.06,-99.67,-101.3,-102.95,-105.18,-104.21,-105.42,-105.49]::double precision[], array[79.3,79.16,78.8,78.33,77.91,78.02,78.34,78.38,78.68,78.92,79.3]::double precision[]),
  ('flag:CA', 17, array[-123.51,-124.01,-125.65,-125.96,-126.85,-127.03,-128.06,-128.44,-128.36,-127.31,-126.69,-125.75,-125.42,-124.92,-123.92,-123.51]::double precision[], array[48.51,48.37,48.83,49.18,49.53,49.81,50,50.54,50.77,50.55,50.4,50.29,49.95,49.48,49.06,48.51]::double precision[]),
  ('flag:CA', 18, array[-121.54,-120.11,-117.56,-116.59,-115.51,-116.77,-119.22,-120.46,-120.46,-123.09,-123.62,-125.93,-125.5,-124.81,-123.94,-124.92,-121.54]::double precision[], array[74.45,74.24,74.19,73.9,73.47,73.22,72.52,71.82,71.38,70.9,71.34,71.87,72.29,73.02,73.68,74.29,74.45]::double precision[]),
  ('flag:CA', 19, array[-107.82,-106.93,-105.88,-105.71,-106.31,-109.7,-112.22,-113.74,-113.87,-111.79,-116.31,-117.71,-116.35,-115.4,-112.59,-110.81,-109.07,-110.5,-109.58,-108.55,-108.21,-107.82]::double precision[], array[75.85,76.01,75.97,75.48,75,74.85,74.42,74.39,74.72,75.16,75.04,75.22,76.2,76.48,76.14,75.55,75.47,76.43,76.79,76.68,76.2,75.85]::double precision[]),
  ('flag:CA', 20, array[-106.52,-105.4,-104.77,-104.46,-102.79,-100.98,-101.09,-102.73,-102.09,-102.43,-104.24,-105.96,-107.12,-109,-111.53,-113.31,-113.86,-115.22,-116.11,-117.34,-116.68,-115.13,-113.72,-112.42,-114.35,-116.49,-117.91,-118.43,-116.11,-117.65,-119.4,-118.56,-117.87,-115.19,-114.17,-114.67,-112.44,-111.05,-109.92,-109.01,-108.19,-107.69,-108.4,-107.52,-106.52]::double precision[], array[73.08,72.67,71.7,70.99,70.5,70.03,69.59,69.5,69.12,68.75,68.91,69.18,69.12,68.78,68.63,68.54,69.01,69.28,69.17,69.96,70.07,70.24,70.19,70.37,70.6,70.52,70.54,70.91,71.31,71.29,71.56,72.31,72.71,73.31,73.12,72.65,72.95,72.45,72.96,72.63,71.65,72.06,73.09,73.24,73.08]::double precision[]),
  ('flag:CA', 21, array[-100.44,-101.54,-100.36,-99.16,-97.38,-97.12,-98.05,-96.54,-96.72,-98.36,-99.32,-100.01,-102.5,-102.48,-100.44]::double precision[], array[72.71,73.36,73.84,73.63,73.76,73.47,72.99,72.56,71.66,71.27,71.36,71.74,72.51,72.83,72.71]::double precision[]),
  ('flag:CA', 22, array[-106.6,-105.26,-104.5,-105.38,-106.94,-106.6]::double precision[], array[73.6,73.64,73.42,72.76,73.46,73.6]::double precision[]),
  ('flag:CA', 23, array[-98.5,-97.74,-97.7,-98.16,-99.81,-100.88,-100.86,-102.5,-102.57,-101.49,-99.98,-98.58,-98.5]::double precision[], array[76.72,76.26,75.74,75,74.9,75.06,75.64,75.56,76.34,76.31,76.65,76.59,76.72]::double precision[]),
  ('flag:CA', 24, array[-96.01,-95.32,-94.3,-94.74,-92.41,-91.13,-89.45,-87.81,-87.02,-85.82,-87.19,-89.03,-90.81,-92.88,-93.95,-93.94,-93.15,-94.97,-96.08,-96.71,-96.01]::double precision[], array[80.6,80.91,80.98,81.21,81.26,80.72,80.51,80.32,79.66,79.34,79.04,78.29,78.22,78.34,78.75,79.11,79.38,79.37,79.7,80.16,80.6]::double precision[]),
  ('flag:CA', 25, array[-91.59,-88.93,-85.5,-83.18,-81.1,-76.25,-72.83,-68.5,-63.68,-61.89,-66.75,-65.48,-69.47,-73.24,-76.91,-76.22,-76.34,-78.36,-79.62,-77.89,-83.17,-87.6,-89.62,-88.26,-84.98,-87.96,-85.38,-86.51,-84.2,-81.85,-87.6,-90.2,-91.59]::double precision[], array[81.9,82.12,82.65,82.32,83.02,83.17,83.23,83.11,82.9,82.36,81.73,81.51,80.62,79.63,79.32,79.02,78.18,77.51,76.98,76.78,76.45,76.42,76.95,77.9,77.54,78.37,79,79.74,80.21,80.46,80.52,81.26,81.9]::double precision[]),
  ('flag:CA', 26, array[-75.22,-75.87,-76.99,-77.24,-76.81,-75.89,-75.11,-75.1,-75.22]::double precision[], array[67.44,67.15,67.1,67.59,68.15,68.29,68.01,67.58,67.44]::double precision[]),
  ('flag:CA', 27, array[-96.26,-95.65,-96.27,-97.62,-98.43,-99.8,-98.92,-98.22,-97.16,-96.56,-96.26]::double precision[], array[69.49,69.11,68.76,69.06,68.95,69.4,69.71,70.14,69.86,69.68,69.49]::double precision[]),
  ('flag:CA', 28, array[-64.52,-64.17,-62.86,-61.84,-61.81,-62.29,-63.59,-64.52]::double precision[], array[49.87,49.96,49.71,49.29,49.11,49.09,49.4,49.87]::double precision[]),
  ('flag:CA', 29, array[-64.01,-63.66,-62.94,-62.01,-62.51,-62.87,-64.14,-64.39,-64.01]::double precision[], array[47.04,46.55,46.42,46.44,46.03,45.97,46.39,46.73,47.04]::double precision[]),
  ('flag:CF', 0, array[27.37,26.4,25.28,24.81,23.3,22.7,21.66,20.29,18.93,18.45,17.13,16.01,15.86,15.04,14.48,14.46,14.78,16.1,16.46,17.97,18.91,19.09,21,22.23,22.98,23.56,23.46,24.57,25.12,26.21,27.21,27.37]::double precision[], array[5.23,5.15,5.17,4.9,4.61,4.63,4.22,4.69,4.71,3.5,3.73,2.27,3.01,3.85,4.73,5.45,6.41,7.5,7.74,7.89,8.63,9.07,9.48,10.97,10.71,9.68,8.95,8.23,7.5,6.55,5.55,5.23]::double precision[]),
  ('flag:TD', 0, array[23.84,23.02,22.3,22.18,22.04,22.29,22.51,22.87,21.72,20.06,18.81,18.39,16.71,16.29,15.28,15.12,14.55,14.17,14.91,14.92,14.9,14.6,13.96,13.97,15.3,15.9,15.47,14.85,19.85,23.84]::double precision[], array[19.58,15.68,14.33,13.79,12.96,12.65,11.68,11.14,10.57,9.01,8.98,8.28,7.51,7.75,7.42,8.38,8.97,10.02,9.99,10.89,12.22,13.33,14,15.68,17.93,20.39,21.05,22.86,21.49,19.58]::double precision[]),
  ('flag:CL', 0, array[-68.63,-68.63,-67.56,-66.96,-67.29,-68.15,-68.64,-69.23,-69.96,-71.01,-72.27,-73.28,-74.66,-73.84,-72.43,-71.11,-70.59,-70.27,-69.35,-68.63]::double precision[], array[-52.64,-54.87,-54.87,-54.9,-55.3,-55.61,-55.58,-55.5,-55.2,-55.05,-54.49,-53.96,-52.84,-53.05,-53.72,-54.07,-53.62,-52.93,-52.52,-52.64]::double precision[]),
  ('flag:CL', 1, array[-69.59,-68.97,-68.76,-67.83,-66.98,-68.42,-68.59,-69,-70.02,-70.53,-69.81,-70.39,-71.12,-70.81,-71.68,-71.75,-71.92,-71.79,-71.22,-71.55,-72.45,-72.65,-73.33,-72.31,-71.92,-68.57,-69.94,-71.01,-72.56,-74.95,-74.98,-75.61,-74.13,-74.69,-73.24,-73.39,-74.33,-73.68,-73.51,-73.17,-71.86,-71.67,-71.49,-70.72,-70.09,-70.37,-69.59]::double precision[], array[-17.58,-18.98,-20.37,-22.87,-22.99,-24.52,-26.51,-27.52,-29.37,-31.36,-33.27,-35.17,-36.66,-38.55,-39.81,-42.05,-43.41,-44.21,-44.78,-45.56,-47.74,-48.88,-50.38,-50.68,-52.01,-52.3,-52.54,-53.83,-53.53,-52.26,-51.04,-48.67,-46.94,-45.76,-44.45,-42.12,-43.23,-39.94,-38.28,-37.12,-33.91,-30.92,-28.86,-25.71,-21.39,-18.35,-17.58]::double precision[]),
  ('flag:CN', 0, array[109.48,108.65,108.63,109.12,110.21,110.79,111.01,110.57,110.34,109.48]::double precision[], array[18.2,18.51,19.37,19.82,20.1,20.08,19.7,19.26,18.68,18.2]::double precision[]),
  ('flag:CN', 1, array[80.26,80.87,81.95,83.18,85.72,86.6,87.75,88.85,90.97,90.95,93.48,95.31,96.35,99.52,101.83,104.52,106.13,109.24,111.13,111.67,111.87,113.46,115.98,117.42,119.66,118.87,117.29,115.74,116.19,117.88,119.28,120.74,120.18,122.24,125.07,126.56,127.29,129.4,130.99,133.37,134.5,133.77,131.88,131.29,130.63,130,128.05,127.34,126.18,124.26,122.13,121.59,122.17,120.77,119.02,117.53,118.88,119.7,121.71,122.52,120.64,119.15,120.62,121.91,121.27,122.09,121.68,120.39,118.66,115.89,114.15,113.24,110.79,109.89,109.86,108.05,106.57,105.81,104.48,102.71,101.65,101.27,101.15,99.98,99.53,98.66,97.72,98.71,98.25,97.33,96.59,95.41,93.41,91.7,90.73,89.48,88.73,86.95,85.01,83.9,82.33,81.11,78.74,79.18,78.81,77.84,75.9,74.98,74.86,73.93,73.96,74.78,76.53,78.19,80.12,80.26]::double precision[], array[42.35,43.18,45.32,47.33,47.45,48.55,49.3,48.07,46.89,45.29,44.98,44.24,42.73,42.52,42.51,41.91,42.14,42.52,43.41,44.07,45.1,44.81,45.73,46.67,46.69,47.75,47.7,47.73,49.13,49.51,50.58,51.96,52.75,53.43,53.16,51.78,50.74,49.44,47.79,48.18,47.58,46.12,45.32,44.11,42.9,42.98,41.99,41.5,41.11,39.93,39.17,39.36,40.42,40.59,39.25,38.74,37.9,37.16,37.48,36.93,36.11,34.91,33.38,31.69,30.68,29.83,28.23,27.05,24.55,22.78,22.22,22.05,21.4,20.28,21.39,21.55,22.22,22.98,22.82,22.71,22.32,21.2,21.85,21.74,22.95,24.06,25.08,26.74,27.75,28.26,28.83,29.03,28.64,27.77,28.06,28.04,28.09,27.97,28.64,29.32,30.11,30.18,31.52,32.48,33.51,35.49,36.67,37.42,38.38,38.51,39.66,40.37,40.43,41.19,42.12,42.35]::double precision[]),
  ('flag:CO', 0, array[-66.88,-67.26,-67.87,-69.8,-69.25,-70.02,-69.58,-69.44,-70.39,-70.05,-71.41,-72.33,-73.66,-74.44,-75.37,-76.29,-77.42,-77.86,-78.99,-78.66,-77.93,-77.13,-77.31,-77.32,-77.88,-77.43,-77.47,-76.84,-75.67,-75.48,-74.28,-73.41,-72.24,-71.4,-71.33,-72.23,-72.91,-73.31,-72.66,-72.36,-72.45,-71.96,-70.09,-68.99,-67.7,-67.52,-67.82,-67.34,-67.81,-67.18,-66.88]::double precision[], array[1.25,1.72,1.69,1.09,0.6,0.54,-0.55,-1.56,-3.77,-2.72,-2.34,-2.44,-1.26,-0.53,-0.15,0.42,0.39,0.81,1.69,2.27,2.7,3.85,4.67,5.84,7.22,7.64,8.52,8.64,9.44,10.62,11.1,11.23,11.96,12.38,11.78,11.11,10.45,9.15,8.63,8,7.42,6.99,6.96,6.21,6.27,5.56,4.5,3.54,2.82,2.25,1.25]::double precision[]),
  ('flag:CG', 0, array[18.45,18.39,18.1,17.9,17.78,17.83,17.66,17.64,17.52,16.86,16.41,15.97,16.01,15.75,15.17,14.58,14.21,14.15,13.6,13.26,12.99,12.62,12.32,11.91,11.09,11.86,11.48,11.82,12.49,12.58,13.11,13.99,14.3,14.43,14.32,13.84,14.28,14.03,13.28,13,13.08,14.34,15.15,15.94,16.01,16.54,17.13,17.81,18.45]::double precision[], array[3.5,2.9,2.37,1.74,0.86,0.29,-0.06,-0.42,-0.74,-1.23,-1.74,-2.71,-3.54,-3.86,-4.34,-4.97,-4.79,-4.51,-4.5,-4.88,-4.78,-4.44,-4.61,-5.04,-3.98,-3.43,-2.77,-2.51,-2.39,-1.95,-2.43,-2.47,-2,-1.33,-0.55,0.04,1.2,1.4,1.31,1.83,2.27,2.23,1.96,1.73,2.27,3.2,3.73,3.56,3.5]::double precision[]),
  ('flag:CR', 0, array[-82.55,-82.93,-82.93,-82.72,-82.87,-82.83,-82.91,-82.96,-83.51,-83.71,-83.59,-83.63,-83.91,-84.3,-84.65,-84.71,-84.98,-84.91,-85.11,-85.34,-85.66,-85.8,-85.79,-85.66,-85.94,-85.71,-85.56,-84.9,-84.67,-84.35,-84.19,-83.89,-83.66,-83.4,-83.02,-82.55]::double precision[], array[9.57,9.48,9.07,8.93,8.81,8.63,8.42,8.22,8.45,8.66,8.83,9.05,9.29,9.49,9.62,9.91,10.09,9.8,9.56,9.83,9.93,10.14,10.44,10.76,10.9,11.09,11.22,10.95,11.08,11,10.79,10.73,10.94,10.4,9.99,9.57]::double precision[]),
  ('flag:CI', 0, array[-8.03,-7.9,-7.62,-6.85,-6.67,-6.49,-6.2,-6.05,-5.82,-5.41,-4.96,-4.78,-4.33,-3.98,-3.51,-2.83,-2.56,-2.98,-3.25,-2.81,-2.86,-3.31,-4.01,-4.65,-5.83,-6.53,-7.52,-7.71,-7.63,-7.54,-7.57,-7.99,-8.31,-8.6,-8.39,-8.49,-8.44,-8.28,-8.22,-8.3,-8.2,-7.83,-8.08,-8.31,-8.23,-8.03]::double precision[], array[10.21,10.3,10.15,10.14,10.43,10.41,10.52,10.1,10.22,10.37,10.15,9.82,9.61,9.86,9.9,9.64,8.22,7.38,6.25,5.39,5,4.98,5.18,5.17,4.99,4.71,4.34,4.36,5.19,5.31,5.71,6.13,6.19,6.47,6.91,7.4,7.69,7.69,8.12,8.32,8.45,8.58,9.38,9.79,10.13,10.21]::double precision[]),
  ('flag:HR', 0, array[16.57,16.88,17.63,18.46,18.83,19.07,19.39,19.01,18.55,17.86,17,16.53,16.32,15.96,15.75,16.24,16.46,16.91,17.3,17.67,18.56,18.45,17.51,16.93,16.01,15.18,15.38,14.92,14.9,14.26,13.95,13.66,13.68,13.71,14.41,14.6,14.93,15.33,15.32,15.67,15.77,16.57]::double precision[], array[46.5,46.38,45.95,45.76,45.91,45.52,45.24,44.86,45.08,45.07,45.23,45.21,45,45.23,44.82,44.35,44.04,43.67,43.45,43.03,42.65,42.48,42.85,43.21,43.51,44.24,44.32,44.74,45.08,45.23,44.8,45.14,45.48,45.5,45.47,45.64,45.47,45.45,45.73,45.83,46.24,46.5]::double precision[]),
  ('flag:CU', 0, array[-82.27,-81.41,-80.62,-79.68,-79.28,-78.35,-77.99,-77.15,-76.52,-76.19,-75.6,-75.67,-74.93,-74.18,-74.3,-74.96,-75.63,-76.32,-77.76,-77.09,-77.49,-78.14,-78.48,-78.72,-79.29,-80.22,-80.52,-81.82,-82.17,-81.79,-82.78,-83.49,-83.91,-84.05,-84.55,-84.97,-84.45,-84.23,-83.78,-83.27,-82.51,-82.27]::double precision[], array[23.19,23.12,23.11,22.77,22.4,22.51,22.28,21.66,21.21,21.22,21.02,20.73,20.69,20.28,20.05,19.92,19.87,19.95,19.86,20.41,20.67,20.74,21.03,21.6,21.56,21.83,22.04,22.19,22.39,22.64,22.69,22.17,22.15,21.91,21.8,21.9,22.21,22.57,22.79,22.98,23.08,23.19]::double precision[]),
  ('flag:CY', 0, array[32.73,32.92,33.19,33.38,33.46,33.47,33.53,33.68,33.87,33.98,34,32.98,32.49,32.26,32.73]::double precision[], array[35.14,35.09,35.17,35.16,35.1,35,35.04,35.02,35.09,35.06,34.98,34.57,34.7,35.1,35.14]::double precision[]),
  ('flag:CZ', 0, array[15.02,15.49,16.24,16.18,16.72,16.87,17.56,17.65,18.39,18.85,18.56,18.4,18.17,18.11,17.91,17.89,17.54,17.1,16.96,16.5,16.03,15.26,14.9,14.34,13.6,13.03,12.52,12.41,12.24,12.97,13.34,14.06,14.31,14.57,15.02]::double precision[], array[51.11,50.78,50.7,50.42,50.22,50.47,50.36,50.05,49.99,49.5,49.49,49.31,49.27,49.04,49,48.9,48.8,48.82,48.6,48.79,48.73,49.04,48.96,48.56,48.88,49.31,49.55,49.97,50.27,50.48,50.73,50.93,51.12,51,51.11]::double precision[]),
  ('flag:CD', 0, array[29.34,29.42,30.2,30.35,28.73,28.67,28.37,29.34,29.7,28.52,27.39,26.55,25.42,24.31,23.91,22.84,22.16,21.88,21.95,21.73,20.6,20.04,19.17,18.46,17.47,16.86,16.33,13.02,12.32,12.44,12.63,13.26,14.15,14.58,15.75,15.97,16.86,17.64,17.83,17.9,18.39,18.54,19.47,20.93,22.4,22.84,24.41,25.13,25.65,27.05,27.98,28.7,29.72,30.83,31.17,30.47,29.87,29.59,29.29,29.12,29.28,29.34]::double precision[], array[-4.5,-5.94,-7.08,-8.24,-8.53,-9.61,-11.79,-12.36,-13.26,-12.7,-12.13,-11.93,-11.33,-11.26,-10.93,-11.02,-11.08,-9.52,-8.31,-7.29,-6.94,-7.12,-7.74,-7.85,-8.07,-7.22,-5.88,-5.98,-6.1,-5.68,-4.99,-4.88,-4.51,-4.97,-3.86,-2.71,-1.23,-0.42,0.29,1.74,2.9,4.2,5.03,4.32,4.03,4.71,5.11,4.93,5.26,5.13,4.41,4.46,4.6,3.51,2.2,1.58,0.6,-0.59,-1.62,-2.29,-3.29,-4.5]::double precision[]),
  ('flag:DK', 0, array[9.92,9.28,8.53,8.12,8.09,8.26,8.54,9.42,9.78,10.58,10.55,10.25,10.37,10.91,10.67,10.37,9.65,9.92]::double precision[], array[54.98,54.83,54.96,55.52,56.54,56.81,57.11,57.17,57.45,57.73,57.22,56.89,56.61,56.46,56.08,56.19,55.47,54.98]::double precision[]),
  ('flag:DK', 1, array[12.37,12.69,12.09,11.04,10.9,12.37]::double precision[], array[56.11,55.61,54.8,55.36,55.78,56.11]::double precision[]),
  ('flag:DJ', 0, array[42.35,42.78,43.08,43.32,43.29,42.72,43.14,42.78,42.55,42.31,41.76,41.74,41.66,42,42.35]::double precision[], array[12.54,12.46,12.7,12.39,11.98,11.74,11.46,10.93,11.11,11.03,11.05,11.36,11.63,12.1,12.54]::double precision[]),
  ('flag:DO', 0, array[-71.71,-71.69,-71.94,-71.7,-71.62,-71.71,-71.59,-70.81,-70.21,-69.95,-69.77,-69.22,-69.26,-68.81,-68.32,-68.69,-69.17,-69.62,-69.95,-70.13,-70.52,-70.67,-71,-71.4,-71.66,-71.71]::double precision[], array[18.04,18.32,18.62,18.78,19.17,19.71,19.88,19.88,19.62,19.65,19.29,19.31,19.01,18.98,18.61,18.21,18.42,18.38,18.43,18.25,18.18,18.43,18.28,17.6,17.76,18.04]::double precision[]),
  ('flag:EC', 0, array[-75.37,-75.24,-75.54,-76.64,-77.84,-78.45,-78.64,-79.21,-79.62,-80.03,-80.44,-80.47,-80.19,-80.3,-79.77,-79.99,-80.37,-80.97,-80.77,-80.93,-80.59,-80.4,-80.02,-80.09,-79.54,-78.86,-77.86,-77.67,-77.42,-76.58,-76.29,-75.8,-75.37]::double precision[], array[-0.15,-0.91,-1.56,-2.61,-3,-3.87,-4.55,-4.96,-4.45,-4.35,-4.43,-4.06,-3.82,-3.4,-2.66,-2.22,-2.69,-2.25,-1.96,-1.06,-0.91,-0.28,0.36,0.77,0.98,1.38,0.81,0.83,0.39,0.26,0.42,0.09,-0.15]::double precision[]),
  ('flag:EG', 0, array[36.87,32.9,29.02,25,25,25,24.7,24.96,24.8,25.17,26.49,27.46,28.45,28.91,29.68,30.09,30.98,31.69,31.96,32.19,32.99,33.77,34.27,34.82,34.92,34.64,34.43,34.16,33.92,33.59,33.14,32.42,32.32,32.73,33.35,34.1,34.47,34.8,35.69,35.49,35.53,36.69,36.87]::double precision[], array[22,22,22,22,25.68,29.24,30.04,30.66,31.09,31.57,31.59,31.32,31.03,30.87,31.19,31.47,31.56,31.43,30.93,31.26,31.02,30.97,31.22,29.76,29.5,29.1,28.34,27.82,27.65,27.97,28.42,29.85,29.76,28.7,27.7,26.14,25.6,25.03,23.93,23.75,23.1,22.21,22]::double precision[]),
  ('flag:SV', 0, array[-89.35,-89.06,-88.84,-88.54,-88.51,-88.07,-87.86,-87.72,-87.79,-87.9,-88.48,-88.84,-89.26,-89.81,-90.1,-90.06,-89.72,-89.53,-89.59,-89.35]::double precision[], array[14.42,14.34,14.14,13.98,13.85,13.96,13.89,13.78,13.38,13.15,13.16,13.26,13.46,13.52,13.74,13.88,14.13,14.25,14.36,14.42]::double precision[]),
  ('flag:GQ', 0, array[9.65,11.28,11.28,9.83,9.49,9.3,9.65]::double precision[], array[2.28,2.26,1.06,1.07,1.01,1.16,2.28]::double precision[]),
  ('flag:ER', 0, array[36.43,36.32,36.75,36.85,37.17,37.9,38.41,38.99,39.27,39.81,41.18,41.73,42.28,42.59,43.08,42.78,42.35,42.01,41.6,41.15,40.9,40.03,39.34,39.1,38.51,37.91,37.59,36.43]::double precision[], array[14.42,14.82,16.29,16.96,17.26,17.43,18,16.84,15.92,15.44,14.49,13.92,13.34,13,12.7,12.46,12.54,12.87,13.45,13.77,14.12,14.52,14.53,14.74,14.51,14.96,14.21,14.42]::double precision[]),
  ('flag:EE', 0, array[27.98,28.13,27.42,27.72,27.29,26.46,25.6,25.17,24.31,24.43,24.06,23.43,23.34,24.6,25.86,26.95,27.98]::double precision[], array[59.48,59.3,58.72,57.79,57.47,57.48,57.85,57.97,57.79,58.38,58.26,58.61,59.19,59.47,59.61,59.45,59.48]::double precision[]),
  ('flag:SZ', 0, array[32.07,31.87,31.28,30.68,30.68,30.95,31.04,31.33,31.84,31.98,32.07]::double precision[], array[-26.73,-27.18,-27.29,-26.74,-26.4,-26.02,-25.73,-25.66,-25.84,-26.29,-26.73]::double precision[]),
  ('flag:ET', 0, array[47.79,43.66,42.13,41.17,39.85,38.89,38.44,36.86,35.82,35.3,34.25,33.57,33.29,33.98,34.26,34.83,35.87,36.43,37.91,39.1,40.03,41.15,42.01,42,41.74,42.31,42.78,42.93,43.68,47.79]::double precision[], array[8,4.96,4.23,3.92,3.84,3.5,3.59,4.45,4.78,5.51,6.83,7.71,8.36,8.69,10.63,11.32,12.58,14.42,14.96,14.74,14.52,13.77,12.87,12.1,11.36,11.03,10.93,10.02,9.18,8]::double precision[]),
  ('flag:FJ', 0, array[178.12,178.37,178.72,178.55,177.93,177.38,177.29,177.67,178.12]::double precision[], array[-17.51,-17.34,-17.63,-18.15,-18.29,-18.16,-17.72,-17.38,-17.51]::double precision[]),
  ('flag:FJ', 1, array[-180,-179.79,-179.92,-180,-180,-180]::double precision[], array[-16.07,-16.02,-16.5,-16.56,-16.07,-16.07]::double precision[]),
  ('flag:FJ', 2, array[179.36,178.73,178.6,179.1,179.41,180,179.36]::double precision[], array[-16.8,-17.01,-16.64,-16.43,-16.38,-16.07,-16.8]::double precision[]),
  ('flag:FI', 0, array[28.59,28.45,29.98,29.05,30.22,29.54,30.44,30.04,31.52,31.14,30.21,28.07,26.26,24.5,22.87,22.29,21.32,21.54,21.06,21.54,22.44,24.73,25.4,25.3,23.9,23.57,23.54,21.98,20.64,21.25,22.36,23.66,24.73,25.69,26.18,27.73,29.01,28.59]::double precision[], array[69.07,68.36,67.7,66.94,65.81,64.95,64.2,63.55,62.87,62.36,61.78,60.5,60.42,60.06,59.85,60.39,60.72,61.7,62.61,63.19,63.82,64.9,65.11,65.53,66.01,66.4,67.94,68.62,69.11,69.37,68.84,68.89,68.65,69.09,69.83,70.16,69.77,69.07]::double precision[]),
  ('flag:FR', 0, array[-51.66,-52.25,-52.56,-52.94,-53.42,-53.56,-53.78,-54.09,-54.52,-54.27,-54.18,-54.01,-54.4,-54.48,-53.96,-53.62,-52.88,-51.82,-51.66]::double precision[], array[4.16,3.24,2.5,2.12,2.05,2.33,2.38,2.11,2.31,2.73,3.19,3.62,4.21,4.9,5.76,5.65,5.41,4.57,4.16]::double precision[]),
  ('flag:FR', 1, array[6.19,6.66,8.1,7.59,7.47,7.19,6.74,6.77,6.04,6.02,6.5,6.84,6.8,7.1,6.75,7.01,7.55,7.44,6.53,4.56,3.1,2.99,1.83,0.7,0.34,-1.5,-1.9,-1.38,-1.19,-2.23,-2.96,-4.49,-4.59,-3.3,-1.62,-1.94,-0.99,1.34,1.64,2.51,2.66,3.12,3.59,4.29,4.8,5.68,5.9,6.19]::double precision[], array[49.46,49.2,49.02,48.33,47.62,47.45,47.54,47.29,46.73,46.27,46.43,45.99,45.71,45.33,45.03,44.25,44.13,43.69,43.13,43.4,43.07,42.47,42.34,42.8,42.58,43.03,43.42,44.02,46.01,47.06,47.57,47.95,48.68,48.9,48.64,49.78,49.35,50.13,50.95,51.15,50.8,50.78,50.38,49.91,49.99,49.53,49.44,49.46]::double precision[]),
  ('flag:FR', 2, array[8.75,9.39,9.56,9.23,8.78,8.54,8.75]::double precision[], array[42.63,43.01,42.15,41.38,41.58,42.26,42.63]::double precision[]),
  ('flag:GA', 0, array[11.28,11.75,12.36,12.95,13.08,13,13.28,14.03,14.28,13.84,14.32,14.43,14.3,13.99,13.11,12.58,12.49,11.82,11.48,11.86,11.09,10.07,9.41,8.8,8.83,9.05,9.29,9.49,9.83,11.28,11.28]::double precision[], array[2.26,2.33,2.19,2.32,2.27,1.83,1.31,1.4,1.2,0.04,-0.55,-1.33,-2,-2.47,-2.43,-1.95,-2.39,-2.51,-2.77,-3.43,-3.98,-2.97,-2.14,-1.11,-0.78,-0.46,0.27,1.01,1.07,1.06,2.26]::double precision[]),
  ('flag:GM', 0, array[-16.71,-15.63,-15.4,-15.08,-14.69,-14.38,-14.05,-13.84,-14.28,-14.71,-15.14,-15.51,-15.69,-15.93,-16.84,-16.71]::double precision[], array[13.6,13.62,13.86,13.88,13.63,13.63,13.79,13.51,13.28,13.3,13.51,13.28,13.27,13.13,13.15,13.6]::double precision[]),
  ('flag:GE', 0, array[39.95,40.08,40.92,42.4,43.76,43.93,44.54,45.47,45.78,46.41,46.15,46.64,46.5,45.96,45.22,44.97,43.58,42.62,41.55,41.7,41.45,40.88,40.32,39.95]::double precision[], array[43.44,43.55,43.38,43.22,42.74,42.55,42.71,42.5,42.09,41.86,41.72,41.18,41.06,41.12,41.41,41.25,41.09,41.58,41.54,41.96,42.64,43.01,43.13,43.44]::double precision[]),
  ('flag:DE', 0, array[14.12,14.07,14.69,15.02,14.31,13.34,12.24,12.52,13.6,12.88,12.93,12.14,10.54,9.89,8.52,7.47,8.1,6.19,6.04,5.99,6.84,6.91,7.94,8.8,8.53,9.92,10.95,11.96,13.65,14.12]::double precision[], array[53.76,52.98,52.09,51.11,51.12,50.73,50.27,49.55,48.88,48.29,47.47,47.7,47.57,47.58,47.83,47.62,49.02,49.46,50.13,51.85,52.23,53.48,53.75,54.02,54.96,54.98,54.36,54.2,54.08,53.76]::double precision[]),
  ('flag:GH', 0, array[0.02,-0.05,0.37,0.37,0.46,0.71,0.49,0.57,0.84,1.06,-0.51,-1.06,-1.96,-2.86,-2.81,-3.25,-2.98,-2.56,-2.83,-2.96,-2.94,-1.2,-0.76,-0.44,0.02]::double precision[], array[11.02,10.71,10.19,9.47,8.68,8.31,7.41,6.91,6.28,5.93,5.34,5,4.71,5,5.39,6.25,7.38,8.22,9.64,10.39,10.96,11.01,10.94,11.1,11.02]::double precision[]),
  ('flag:GR', 0, array[26.29,26.16,24.72,24.73,23.51,23.7,24.25,25.03,25.77,25.75,26.29]::double precision[], array[35.3,35,34.92,35.09,35.28,35.71,35.37,35.43,35.35,35.18,35.3]::double precision[]),
  ('flag:GR', 1, array[22.95,23.69,24.49,25.2,26.11,26.12,26.6,26.29,26.06,25.45,24.92,23.72,24.41,23.9,23.34,22.82,22.63,22.85,23.35,22.97,23.53,24.02,24.04,23.11,23.41,22.78,23.15,22.49,21.67,21.3,21.12,20.73,20.22,20.15,20.62,20.67,21,21.02,21.67,22.06,22.6,22.76,22.95]::double precision[], array[41.34,41.31,41.58,41.23,41.33,41.83,41.56,40.94,40.82,40.85,40.95,40.69,40.12,39.96,39.96,40.48,40.26,39.66,39.19,38.97,38.51,38.22,37.65,37.92,37.41,37.3,36.42,36.41,36.84,37.64,38.31,38.77,39.34,39.63,40.11,40.44,40.58,40.84,40.93,41.15,41.13,41.3,41.34]::double precision[]),
  ('flag:GT', 0, array[-92.23,-92.2,-92.09,-92.23,-91.75,-90.46,-90.44,-90.6,-90.71,-91.08,-91.45,-91,-91,-90.07,-89.14,-89.15,-89.23,-88.93,-88.61,-88.52,-88.22,-88.68,-89.15,-89.23,-89.15,-89.35,-89.59,-89.53,-89.72,-90.06,-90.1,-90.61,-91.23,-91.69,-92.23]::double precision[], array[14.54,14.83,15.06,15.25,16.07,16.07,16.41,16.47,16.69,16.92,17.25,17.25,17.82,17.82,17.81,17.02,15.89,15.89,15.71,15.85,15.73,15.35,15.07,14.87,14.68,14.42,14.36,14.25,14.13,13.88,13.74,13.91,13.93,14.13,14.54]::double precision[]),
  ('flag:GN', 0, array[-13.7,-12.5,-12.2,-11.51,-11.3,-10.87,-10.16,-9.57,-9.13,-8.79,-8.58,-8.41,-8.34,-8.23,-8.08,-8.2,-8.22,-8.44,-8.93,-9.41,-9.75,-10.23,-10.5,-10.62,-11.12,-12.15,-12.6,-13.25,-14.07,-14.58,-14.84,-14.69,-14.12,-13.74,-13.72,-13.7]::double precision[], array[12.59,12.33,12.47,12.44,12.08,12.18,11.84,12.19,12.31,11.81,11.14,10.91,10.49,10.13,9.38,8.45,8.12,7.69,7.31,7.53,8.54,8.41,8.72,9.27,10.05,9.86,9.62,8.9,9.89,10.22,10.88,11.53,11.68,11.81,12.25,12.59]::double precision[]),
  ('flag:GW', 0, array[-16.68,-16.15,-15.82,-15.55,-13.7,-13.72,-13.83,-13.74,-13.9,-14.12,-14.38,-14.69,-15.13,-15.67,-16.09,-16.31,-16.31,-16.61,-16.68]::double precision[], array[12.39,12.55,12.52,12.63,12.59,12.25,12.14,11.81,11.68,11.68,11.51,11.53,11.04,11.46,11.53,11.81,11.96,12.17,12.39]::double precision[]),
  ('flag:GY', 0, array[-56.54,-56.78,-57.34,-57.66,-58.11,-58.43,-58.54,-59.03,-59.65,-59.72,-59.97,-59.82,-59.54,-59.77,-60.11,-59.98,-60.21,-60.73,-61.41,-61.14,-61.16,-60.54,-60.3,-60.64,-60.55,-59.76,-59.1,-58.48,-58.46,-58.08,-57.54,-57.15,-57.31,-57.92,-57.86,-58.05,-57.6,-57.28,-57.15,-56.54]::double precision[], array[1.9,1.86,1.95,1.68,1.51,1.46,1.27,1.32,1.79,2.25,2.76,3.61,3.96,4.42,4.58,5.01,5.24,5.2,5.96,6.23,6.7,6.86,7.04,7.42,7.78,8.37,8,7.35,6.83,6.81,6.32,5.97,5.07,4.81,4.58,4.06,3.33,3.33,2.77,1.9]::double precision[]),
  ('flag:HT', 0, array[-71.71,-71.62,-71.7,-71.94,-71.69,-71.71,-72.37,-72.84,-73.45,-73.92,-74.46,-74.37,-73.45,-72.69,-72.33,-72.79,-72.78,-73.41,-73.19,-72.58,-71.71]::double precision[], array[19.71,19.17,18.78,18.62,18.32,18.04,18.21,18.14,18.22,18.03,18.34,18.66,18.53,18.45,18.67,19.1,19.48,19.64,19.92,19.87,19.71]::double precision[]),
  ('flag:HN', 0, array[-83.15,-83.63,-84.23,-84.65,-84.92,-85.15,-85.51,-85.8,-86.31,-86.76,-86.88,-87.32,-87.79,-87.86,-88.51,-88.84,-89.35,-89.23,-88.68,-88.12,-87.62,-87.37,-86.44,-86,-85.45,-84.98,-84.37,-83.77,-83.15]::double precision[], array[15,14.88,14.75,14.67,14.79,14.56,14.08,13.84,13.77,13.75,13.26,12.98,13.38,13.89,13.85,14.14,14.42,14.87,15.35,15.69,15.88,15.85,15.78,16.01,15.89,16,15.83,15.42,15]::double precision[]),
  ('flag:HU', 0, array[22.08,22.64,22.71,22.1,21.63,21.02,20.22,19.6,18.83,18.46,17.63,16.88,16.57,16.37,16.2,16.53,16.34,16.9,16.98,17.49,17.86,18.7,18.78,19.18,19.66,19.77,20.24,20.48,20.8,21.87,22.08]::double precision[], array[48.42,48.15,47.88,47.67,46.99,46.32,46.13,46.17,45.91,45.76,45.95,46.38,46.5,46.84,46.85,47.5,47.71,47.72,48.12,47.87,47.76,47.88,48.08,48.11,48.27,48.2,48.33,48.56,48.62,48.32,48.42]::double precision[]),
  ('flag:IS', 0, array[-14.51,-14.74,-13.61,-14.91,-17.79,-18.66,-19.97,-22.76,-21.78,-23.96,-22.19,-22.23,-24.33,-23.65,-22.13,-20.58,-19.06,-17.8,-16.17,-14.51]::double precision[], array[66.46,65.81,65.13,64.36,63.68,63.5,63.64,63.96,64.4,64.89,65.08,65.38,65.61,66.26,66.41,65.73,66.28,65.99,66.53,66.46]::double precision[]),
  ('flag:IN', 0, array[97.33,97.05,96.42,95.15,94.55,93.33,93.06,92.67,91.87,91.16,91.91,91.8,89.92,89.35,88.21,88.31,88.7,88.88,88.89,86.98,86.5,83.94,82.19,81.69,80.33,80.23,79.86,79.34,79.19,77.94,76.59,75.75,74.86,74.44,73.12,72.82,71.17,69.17,69.35,68.84,70.84,70.17,70.62,72.82,74.42,75.26,74.1,74.24,76.87,78.91,79.21,78.46,79.72,80.48,81.06,83.3,85.25,87.23,88.17,88.12,88.81,89.74,91.22,92.11,92.5,94.57,96.12,96.25,97.33]::double precision[], array[28.26,27.7,27.26,26,24.67,24.08,22.7,22.04,23.62,23.5,24.13,25.15,25.27,26.02,25.77,24.87,24.23,22.88,21.69,21.5,20.15,18.3,17.02,16.31,15.9,13.84,12.06,10.31,9.22,8.25,8.9,11.31,12.74,14.62,17.93,20.42,20.76,22.09,22.84,24.36,25.21,26.49,27.99,28.96,30.98,32.27,33.44,34.75,34.65,34.32,32.99,32.62,30.88,29.73,28.42,27.36,26.73,26.4,26.81,27.88,27.3,26.72,26.81,27.45,27.9,29.28,29.45,28.41,28.26]::double precision[]),
  ('flag:ID', 0, array[141,141.02,141.03,140.14,139.13,138.88,137.61,138.04,138.67,138.41,137.93,135.99,135.17,133.66,133.37,132.98,132.76,132.75,131.99,133.07,133.78,133.7,132.23,131.84,130.94,130.52,131.87,132.38,133.98,134.14,134.42,135.46,136.29,137.44,138.33,139.19,139.93,141]::double precision[], array[-2.6,-5.86,-9.12,-8.3,-8.1,-8.38,-8.41,-7.6,-7.32,-6.23,-5.39,-4.55,-4.46,-3.54,-4.02,-4.11,-3.75,-3.31,-2.82,-2.46,-2.48,-2.21,-2.21,-1.62,-1.43,-0.94,-0.7,-0.37,-0.78,-1.15,-2.77,-3.37,-2.31,-1.7,-1.7,-2.05,-2.41,-2.6]::double precision[]),
  ('flag:ID', 1, array[124.97,125.07,125.09,124.44,123.58,123.46,123.55,123.98,124.97]::double precision[], array[-8.89,-9.09,-9.39,-10.14,-10.36,-10.24,-9.9,-9.29,-8.89]::double precision[]),
  ('flag:ID', 2, array[134.21,134.11,134.29,134.5,134.73,134.73,134.21]::double precision[], array[-6.89,-6.14,-5.78,-5.44,-5.74,-6.21,-6.89]::double precision[]),
  ('flag:ID', 3, array[117.88,117.31,118.05,117.87,119,117.81,117.48,117.52,116.56,116.53,116.15,116,114.86,114.47,113.76,113.26,112.07,111.7,111.05,110.22,110.07,109.57,109.09,108.95,109.07,109.66,109.83,110.52,111.16,111.8,112.38,112.86,113.81,114.62,115.13,115.52,115.87,117.01,117.88]::double precision[], array[4.14,3.24,2.29,1.83,0.9,0.78,0.1,-0.8,-1.49,-2.48,-4.01,-3.66,-4.11,-3.5,-3.44,-3.12,-3.48,-3,-3.05,-2.93,-1.59,-1.31,-0.46,0.42,1.34,2.01,1.34,0.77,0.98,0.9,1.41,1.5,1.22,1.43,2.82,3.17,4.31,4.31,4.14]::double precision[]),
  ('flag:ID', 4, array[129.37,130.47,130.83,129.99,129.16,128.59,127.9,128.13,129.37]::double precision[], array[-2.8,-3.09,-3.86,-3.45,-3.36,-3.43,-3.39,-2.84,-2.8]::double precision[]),
  ('flag:ID', 5, array[126.87,126.18,125.99,127,127.25,126.87]::double precision[], array[-3.79,-3.61,-3.18,-3.13,-3.46,-3.79]::double precision[]),
  ('flag:ID', 6, array[127.93,128,128.6,128.69,128.63,128.12,127.97,128.38,128.1,127.7,127.4,127.6,127.93]::double precision[], array[2.17,1.63,1.54,1.13,0.26,0.36,-0.25,-0.78,-0.9,-0.27,1.01,1.81,2.17]::double precision[]),
  ('flag:ID', 7, array[122.93,124.08,125.07,125.24,124.44,123.68,122.72,121.06,120.18,120.04,120.93,121.47,123.34,123.26,122.82,122.39,121.51,122.45,122.27,123.17,123.16,122.63,122.24,122.72,121.74,121.49,121.62,120.9,120.97,120.3,120.39,120.43,119.8,119.37,119.65,119.5,119.08,118.77,119.18,119.32,119.83,120.03,120.89,121.67,122.93]::double precision[], array[0.88,0.92,1.64,1.42,0.43,0.24,0.43,0.38,0.24,-0.52,-1.41,-0.96,-0.62,-1.08,-0.93,-1.52,-1.91,-3.19,-3.53,-4.68,-5.34,-5.63,-5.28,-4.46,-4.85,-4.57,-4.19,-3.6,-2.63,-2.93,-4.1,-5.53,-5.67,-5.38,-4.46,-3.49,-3.49,-2.8,-2.15,-1.35,0.15,0.57,1.31,1.01,0.88]::double precision[]),
  ('flag:ID', 8, array[120.29,118.97,119.9,120.43,120.78,120.71,120.29]::double precision[], array[-10.26,-9.56,-9.36,-9.67,-9.97,-10.24,-10.26]::double precision[]),
  ('flag:ID', 9, array[121.34,122.01,122.9,122.76,121.25,119.92,119.92,120.71,121.34]::double precision[], array[-8.54,-8.46,-8.09,-8.65,-8.93,-8.81,-8.45,-8.24,-8.54]::double precision[]),
  ('flag:ID', 10, array[118.26,118.88,119.13,117.97,117.28,116.74,117.08,117.63,117.9,118.26]::double precision[], array[-8.36,-8.28,-8.71,-8.91,-9.04,-9.03,-8.46,-8.45,-8.09,-8.36]::double precision[]),
  ('flag:ID', 11, array[108.49,108.62,110.54,110.76,112.61,112.98,114.48,115.71,114.57,113.46,112.56,111.52,110.59,109.43,108.69,108.28,106.45,106.28,105.36,106.05,107.26,108.07,108.49]::double precision[], array[-6.42,-6.78,-6.88,-6.46,-6.95,-7.59,-7.78,-8.37,-8.75,-8.35,-8.38,-8.3,-8.12,-7.74,-7.64,-7.77,-7.36,-6.93,-6.85,-5.9,-5.96,-6.35,-6.42]::double precision[]),
  ('flag:ID', 12, array[104.37,104.54,104.89,105.62,106.11,105.86,105.82,104.71,103.87,102.58,102.16,101.4,100.9,100.14,99.26,98.97,98.6,97.7,97.18,96.43,95.38,95.29,95.94,97.48,98.37,99.14,99.69,100.64,101.66,102.5,103.08,103.84,103.44,104.01,104.37]::double precision[], array[-1.08,-1.78,-2.34,-2.43,-3.06,-4.31,-5.85,-5.87,-5.04,-4.22,-3.61,-2.8,-2.05,-0.65,0.18,1.04,1.82,2.45,3.31,3.87,4.97,5.48,5.44,5.25,4.27,3.59,3.17,2.1,2.08,1.4,0.56,0.1,-0.71,-1.06,-1.08]::double precision[]),
  ('flag:IR', 0, array[48.57,48,47.85,46.11,45.65,46.08,44.77,44.42,44.79,45.46,46.51,48.06,48.01,48.88,50.15,52.26,53.92,55.51,56.62,58.44,60.38,61.21,60.53,60.54,60.94,61.78,61.37,62.73,63.23,61.88,59.61,57.4,56.49,54.72,52.48,50.85,49.58,48.57]::double precision[], array[29.93,30.98,31.71,33.02,34.75,35.68,37.17,38.28,39.71,38.87,38.77,39.58,38.79,38.32,37.37,36.7,37.2,37.96,38.12,37.52,36.53,35.65,33.68,32.98,31.55,30.74,29.3,28.26,27.22,26.24,25.38,25.74,27.14,26.48,27.58,28.81,29.99,29.93]::double precision[]),
  ('flag:IQ', 0, array[39.2,38.79,41.01,41.38,41.29,41.84,42.35,42.78,43.94,44.29,44.77,45.42,46.08,46.15,45.65,45.42,46.11,47.34,47.85,47.68,48,48.02,48.57,47.98,47.3,46.57,44.71,41.89,40.4,39.2]::double precision[], array[32.16,33.38,34.42,35.63,36.36,36.61,37.23,37.39,37.26,37,37.17,35.98,35.68,35.09,34.75,33.97,33.02,32.47,31.71,30.98,30.98,30.45,29.93,29.98,30.06,29.1,29.18,31.19,31.89,32.16]::double precision[]),
  ('flag:IE', 0, array[-6.2,-6.03,-6.79,-8.56,-9.98,-9.17,-9.69,-8.33,-7.57,-7.37,-7.57,-6.95,-6.2]::double precision[], array[53.87,53.15,52.26,51.67,51.82,52.86,53.88,54.67,55.13,54.6,54.06,54.07,53.87]::double precision[]),
  ('flag:IL', 0, array[35.72,35.54,35.18,34.98,35.22,34.97,34.93,35.4,35.42,34.92,34.82,34.27,34.55,34.49,34.75,34.95,35.1,35.13,35.46,35.55,35.82,35.84,35.7,35.72]::double precision[], array[32.71,32.39,32.53,31.87,31.75,31.62,31.35,31.49,31.1,29.5,29.76,31.22,31.55,31.61,32.07,32.83,33.08,33.09,33.09,33.26,33.28,32.87,32.72,32.71]::double precision[]),
  ('flag:IT', 0, array[10.44,11.17,12.38,13.7,13.14,12.38,12.59,14.03,15.92,15.89,17.52,18.48,17.74,16.45,17.05,16.1,15.69,16.11,15.41,14.7,13.63,12.11,10.51,9.7,8.43,7.44,7.01,7.1,6.84,7.76,8.49,9.18,10.36,10.44]::double precision[], array[46.89,46.94,46.77,46.02,45.74,44.89,44.09,42.76,41.96,41.54,40.88,40.17,40.28,39.8,38.9,37.99,38.22,38.96,40.05,40.61,41.19,41.71,42.93,44.04,44.23,43.69,44.25,45.33,45.99,45.82,46,46.44,46.48,46.89]::double precision[]),
  ('flag:IT', 1, array[14.76,15.52,15.16,15.31,15.1,14.33,13.83,12.43,12.57,13.74,14.76]::double precision[], array[38.14,38.23,37.44,37.13,36.62,37,37.1,37.61,38.13,38.04,38.14]::double precision[]),
  ('flag:IT', 2, array[8.71,9.21,9.81,9.67,9.21,8.81,8.43,8.39,8.16,8.71]::double precision[], array[40.9,41.21,40.5,39.18,39.24,38.91,39.17,40.38,40.95,40.9]::double precision[]),
  ('flag:JM', 0, array[-77.57,-76.89,-76.37,-76.2,-76.9,-77.2,-77.77,-78.34,-78.22,-77.8,-77.57]::double precision[], array[18.49,18.4,18.16,17.89,17.87,17.7,17.86,18.23,18.45,18.52,18.49]::double precision[]),
  ('flag:JP', 0, array[141.88,140.96,140.98,140.6,140.77,140.25,138.97,137.22,135.79,135.12,135.08,133.34,132.16,130.99,132,131.33,130.69,130.2,130.45,129.82,129.41,130.36,130.88,131.89,132.62,134.61,135.68,136.72,137.39,138.86,139.43,140.05,139.88,140.31,141.37,141.92,141.88]::double precision[], array[39.18,38.17,37.14,36.34,35.84,35.14,34.67,34.61,33.46,33.85,34.6,34.38,33.9,33.89,33.15,31.45,31.03,31.42,32.32,32.61,33.3,33.6,34.23,34.75,35.43,35.73,35.53,37.3,36.83,37.83,38.22,39.44,40.56,41.2,41.38,39.99,39.18]::double precision[]),
  ('flag:JP', 1, array[144.61,145.32,145.54,144.06,143.18,141.61,141.07,139.96,139.82,140.31,141.38,141.67,141.97,143.14,143.91,144.61]::double precision[], array[43.96,44.38,43.26,42.99,41.99,42.68,41.59,41.57,42.56,43.33,43.39,44.77,45.55,44.51,44.17,43.96]::double precision[]),
  ('flag:JP', 2, array[132.37,132.93,133.49,133.91,134.64,134.77,134.2,133.79,133.28,133.02,132.36,132.37]::double precision[], array[33.46,34.06,33.94,34.36,34.15,33.81,33.2,33.52,33.29,32.7,32.99,33.46]::double precision[]),
  ('flag:JO', 0, array[35.54,35.72,36.83,38.79,39.2,39,37,38,37.67,37.5,36.74,36.5,36.07,34.95,34.92,35.42,35.4,35.54,35.54]::double precision[], array[32.39,32.71,32.31,33.38,32.16,32.01,31.51,30.51,30.34,30,29.87,29.51,29.2,29.36,29.5,31.1,31.49,31.78,32.39]::double precision[]),
  ('flag:KZ', 0, array[87.36,85.77,85.16,82.46,79.97,80.18,79.65,77.66,75.64,73.64,71.84,70.96,69.07,68.26,66.71,66.02,64.9,62.01,60.24,58.5,55.97,54.75,52.94,52.45,52.5,50.89,50.31,51.32,53.04,53.04,51.19,49.1,48.7,47.31,47.04,47.55,48.7,52.33,55.72,58.36,59.93,61.59,60.93,61.7,61.44,65.67,69.07,71.18,73.51,74.39,76.52,80.03,81.95,83.94,85.11,86.83,87.36]::double precision[], array[49.22,48.46,47,45.54,44.92,42.92,42.5,42.96,42.88,43.09,42.85,42.27,41.38,40.66,41.17,41.99,43.73,43.5,44.78,45.59,41.31,42.04,42.12,42.03,42.79,44.03,44.61,45.25,45.26,46.85,47.05,46.4,47.08,47.72,49.15,50.45,50.6,51.72,50.62,51.06,50.84,51.27,52.45,52.98,54.01,54.6,55.38,54.13,54.04,53.55,54.18,50.87,50.81,50.89,50.12,49.83,49.22]::double precision[]),
  ('flag:KE', 0, array[39.2,37.77,37.7,34.07,33.9,33.89,34.18,34.67,35.04,34.59,34.48,34,34.62,35.3,35.82,35.82,36.16,36.86,38.12,38.44,38.67,38.89,39.56,39.85,40.77,41.17,41.86,40.98,40.99,41.59,40.88,40.64,40.26,40.12,39.8,39.61,39.2]::double precision[], array[-4.68,-3.68,-3.1,-1.06,-0.95,0.11,0.52,1.18,1.91,3.05,3.55,4.25,4.85,5.51,5.34,4.78,4.45,4.45,3.6,3.59,3.62,3.5,3.42,3.84,4.26,3.92,3.92,2.78,-0.86,-1.68,-2.08,-2.5,-2.57,-3.28,-3.68,-4.35,-4.68]::double precision[]),
  ('flag:KW', 0, array[47.98,48.18,48.09,48.42,47.71,47.46,46.57,47.3,47.98]::double precision[], array[29.98,29.53,29.31,28.55,28.53,29,29.1,30.06,29.98]::double precision[]),
  ('flag:KG', 0, array[70.96,71.19,71.84,73.49,73.64,74.21,75.64,76,77.66,79.14,79.65,80.26,80.12,78.54,78.19,76.91,76.53,75.47,74.78,73.82,73.96,73.68,71.78,70.55,69.46,69.56,70.65,71.01,71.78,73.05,71.87,71.16,70.42,71.26,70.96]::double precision[], array[42.27,42.7,42.85,42.5,43.09,43.3,42.88,42.99,42.96,42.86,42.5,42.35,42.12,41.58,41.19,41.07,40.43,40.56,40.37,39.89,39.66,39.43,39.28,39.6,39.53,40.1,39.94,40.24,40.15,40.87,41.39,41.14,41.52,42.17,42.27]::double precision[]),
  ('flag:LA', 0, array[107.38,106.5,106.04,105.22,105.54,105.59,104.78,104.72,103.96,103.2,103,102.41,102.11,101.06,101.04,101.28,100.6,100.55,100.12,100.33,101.18,101.27,101.8,101.65,102.17,102.75,103.2,104.44,104.82,104.18,103.9,105.09,105.93,106.56,107.31,107.56,107.38]::double precision[], array[14.2,14.57,13.88,14.27,14.72,15.57,16.44,17.43,18.24,18.31,17.96,17.93,18.11,17.51,18.41,19.46,19.51,20.11,20.42,20.79,21.44,21.2,21.17,22.32,22.46,21.68,20.77,20.76,19.89,19.62,19.27,18.67,17.48,16.6,15.91,15.2,14.2]::double precision[]),
  ('flag:LV', 0, array[27.29,27.77,27.86,28.18,27.1,26.49,25.53,25,24.86,23.88,22.2,21.05,21.09,21.58,22.52,23.32,24.12,24.31,25.17,25.6,26.46,27.29]::double precision[], array[57.47,57.24,56.76,56.17,55.78,55.61,56.1,56.16,56.37,56.27,56.34,56.03,56.78,57.41,57.75,57.01,57.03,57.79,57.97,57.85,57.48,57.47]::double precision[]),
  ('flag:LB', 0, array[35.82,35.55,35.46,35.13,35.48,35.98,36,36.45,36.61,36.07,35.82]::double precision[], array[33.28,33.26,33.09,33.09,33.91,34.61,34.65,34.59,34.2,33.82,33.28]::double precision[]),
  ('flag:LS', 0, array[28.98,29.32,29.02,28.85,28.29,28.11,27.75,27,27.53,28.07,28.54,28.98]::double precision[], array[-28.96,-29.26,-29.74,-30.07,-30.23,-30.55,-30.64,-29.88,-29.24,-28.85,-28.65,-28.96]::double precision[]),
  ('flag:LR', 0, array[-8.44,-8.49,-8.39,-8.6,-8.31,-7.99,-7.57,-7.54,-7.63,-7.71,-7.98,-9.01,-9.91,-10.77,-11.44,-11.2,-11.15,-10.69,-10.23,-10.02,-9.75,-9.34,-9.41,-9.21,-8.93,-8.72,-8.44]::double precision[], array[7.69,7.4,6.91,6.47,6.19,6.13,5.71,5.31,5.19,4.36,4.36,4.83,5.59,6.14,6.79,7.11,7.4,7.94,8.41,8.43,8.54,7.93,7.53,7.31,7.31,7.71,7.69]::double precision[]),
  ('flag:LY', 0, array[25,23.85,19.85,14.85,13.58,11.56,10.31,9.91,9.71,9.76,9.86,9.48,10.06,10.64,11.43,12.66,13.92,15.71,18.02,19.58,19.82,20.85,22.89,23.61,24.92,24.8,24.7,25,25]::double precision[], array[22,20,21.49,22.86,23.04,24.1,24.38,25.37,26.51,27.69,28.96,30.31,30.96,31.76,32.37,32.79,32.71,31.38,30.76,30.53,31.75,32.71,32.64,32.19,31.9,31.09,30.04,25.68,22]::double precision[]),
  ('flag:LT', 0, array[26.49,26.59,25.77,25.54,24.45,23.48,23.24,22.73,22.65,22.76,22.31,21.27,21.05,22.2,23.88,24.86,25,25.53,26.49]::double precision[], array[55.61,55.17,54.85,54.28,53.91,53.91,54.22,54.33,54.58,54.86,55.02,55.19,56.03,56.34,56.27,56.37,56.16,56.1,55.61]::double precision[]),
  ('flag:LU', 0, array[6.04,6.24,6.19,5.9,5.68,5.78,6.04]::double precision[], array[50.13,49.9,49.46,49.44,49.53,50.09,50.13]::double precision[]),
  ('flag:MK', 0, array[22.38,22.88,22.95,22.76,22.6,22.06,21.67,21.02,20.6,20.46,20.59,20.72,20.76,21.35,21.58,21.92,22.38]::double precision[], array[42.32,42,41.34,41.3,41.13,41.15,40.93,40.84,41.09,41.52,41.86,41.85,42.05,42.21,42.25,42.3,42.32]::double precision[]),
  ('flag:MG', 0, array[49.54,49.81,50.06,50.22,50.48,50.38,50.2,49.86,49.67,49.86,49.78,49.5,49.43,49.04,48.55,47.93,47.55,47.1,46.28,45.41,44.83,44.04,43.76,43.7,43.35,43.25,43.43,43.89,43.9,44.38,44.47,44.23,44.04,43.96,44.31,44.45,44.94,45.5,45.87,46.31,46.88,47.71,48,47.87,48.29,48.84,48.87,49.2,49.54]::double precision[], array[-12.47,-12.9,-13.56,-14.76,-15.23,-15.71,-16,-15.41,-15.71,-16.45,-16.87,-17.11,-17.95,-19.12,-20.5,-22.39,-23.78,-24.94,-25.18,-25.6,-25.35,-24.99,-24.46,-23.57,-22.78,-22.06,-21.34,-21.16,-20.83,-20.07,-19.44,-18.96,-18.33,-17.41,-16.85,-16.22,-16.18,-15.97,-15.79,-15.78,-15.21,-14.59,-14.09,-13.66,-13.78,-13.09,-12.49,-12.04,-12.47]::double precision[]),
  ('flag:MW', 0, array[32.76,33.74,33.94,34.28,34.56,34.28,34.56,34.91,35.27,35.69,35.77,35.34,35.03,34.38,34.31,34.52,34.46,34.07,33.79,33.22,32.69,32.99,33.31,33.11,33.32,33.49,33.23,32.76]::double precision[], array[-9.23,-9.42,-9.69,-10.16,-11.52,-12.28,-13.58,-13.57,-13.89,-14.61,-15.9,-16.11,-16.8,-16.18,-15.48,-15.01,-14.61,-14.36,-14.45,-13.97,-13.71,-12.78,-12.44,-11.61,-10.8,-10.53,-9.68,-9.23]::double precision[]),
  ('flag:MY', 0, array[100.09,100.26,101.08,101.16,101.81,102.14,102.37,102.96,103.38,103.44,103.33,103.43,103.5,103.86,104.25,104.23,103.52,102.57,101.39,101.27,100.69,100.56,100.2,100.31,100.09]::double precision[], array[6.46,6.64,6.21,5.69,5.81,6.22,6.13,5.53,4.85,4.18,3.73,3.38,2.79,2.52,1.63,1.29,1.23,1.97,2.76,3.27,3.94,4.77,5.31,6.04,6.46]::double precision[]),
  ('flag:MY', 1, array[117.88,117.01,115.87,115.52,115.13,114.62,113.81,112.86,112.38,111.8,111.16,110.52,109.83,109.66,110.4,111.17,111.37,111.8,113,113.71,114.21,114.66,114.87,115.35,115.4,115.45,116.22,116.73,117.13,117.64,117.69,118.35,119.18,119.11,118.44,118.62,117.88]::double precision[], array[4.14,4.31,4.31,3.17,2.82,1.43,1.22,1.5,1.41,0.9,0.98,0.77,1.34,2.01,1.66,1.85,2.7,2.89,3.1,3.89,4.53,4.01,4.35,4.32,4.95,5.45,6.14,6.92,6.93,6.42,5.99,5.71,5.41,5.02,4.97,4.48,4.14]::double precision[]),
  ('flag:ML', 0, array[-11.51,-11.55,-12.12,-11.84,-11.35,-10.09,-9.55,-5.32,-5.97,-4.92,1.82,2.68,3.16,4.27,3.64,1.38,0.38,-0.52,-2,-2.97,-3.52,-4.28,-5.22,-5.47,-5.82,-6.2,-6.67,-7.62,-8.03,-8.28,-8.62,-8.38,-8.9,-9.33,-9.89,-10.59,-11.04,-11.46,-11.51]::double precision[], array[12.44,13.14,13.99,14.8,15.41,15.33,15.49,16.2,20.64,24.97,20.61,19.86,19.06,16.85,15.57,15.32,14.93,15.12,14.56,13.8,13.34,13.23,11.71,10.95,10.22,10.52,10.43,10.15,10.21,10.79,10.81,11.39,12.09,12.33,12.06,11.92,12.21,12.08,12.44]::double precision[]),
  ('flag:MR', 0, array[-17.06,-16.85,-12.93,-13.12,-12.88,-11.94,-11.97,-8.69,-8.69,-4.92,-6.45,-5.97,-5.49,-5.32,-5.54,-9.55,-9.7,-10.09,-10.65,-11.35,-11.67,-11.84,-12.17,-12.83,-13.44,-14.1,-14.58,-15.14,-15.62,-16.12,-16.46,-16.55,-16.27,-16.15,-16.26,-16.38,-16.28,-16.54,-17.06]::double precision[], array[21,21.33,21.33,22.77,23.29,23.37,25.93,25.88,27.4,24.97,24.96,20.64,16.33,16.2,15.5,15.49,15.26,15.33,15.13,15.41,15.39,14.8,14.62,15.3,16.04,16.3,16.6,16.59,16.37,16.46,16.14,16.67,17.17,18.11,19.1,19.59,20.09,20.57,21]::double precision[]),
  ('flag:MX', 0, array[-117.13,-114.72,-113.31,-109.04,-108.24,-106.14,-105.04,-104.46,-103.11,-101.66,-100.46,-99.52,-99.02,-97.53,-97.53,-97.78,-97.7,-97.19,-96.29,-94.84,-93.55,-92.04,-90.77,-90.45,-89.6,-87.66,-86.81,-87.38,-87.44,-87.84,-88.3,-88.85,-89.15,-90.07,-91,-91.08,-90.6,-90.46,-92.23,-92.2,-93.36,-94.69,-96.05,-97.26,-98.95,-100.83,-101.92,-103.5,-104.99,-105.73,-105.5,-105.27,-105.69,-106.91,-108.4,-109.44,-109.8,-110.64,-111.76,-112.27,-113.17,-113.87,-114.78,-114.77,-114.33,-113.42,-113.14,-112.76,-112.24,-111.29,-110.71,-110.17,-109.41,-109.85,-110.3,-111.67,-112.15,-112.78,-113.6,-114.46,-114.98,-114.2,-114.93,-115.89,-116.72,-117.13]::double precision[], array[32.53,32.72,32.04,31.34,31.75,31.4,30.64,29.57,28.97,29.78,28.7,27.54,26.37,25.84,24.99,22.93,21.9,20.64,19.32,18.56,18.42,18.71,19.28,20.71,21.26,21.46,21.33,20.26,19.47,18.26,18.5,17.88,17.96,17.82,17.25,16.92,16.47,16.07,15.25,14.83,15.62,16.2,15.75,15.92,16.57,17.17,17.92,18.29,19.32,20.43,20.82,21.42,22.27,23.77,25.17,25.83,26.68,27.86,28.47,29.27,30.79,31.57,31.8,30.91,29.75,28.83,28.41,27.78,27.17,25.73,24.83,24.27,23.36,22.82,23.43,24.49,25.47,26.32,26.64,27.14,27.8,28.12,29.28,30.18,31.64,32.53]::double precision[]),
  ('flag:MD', 0, array[26.62,26.86,27.52,28.26,28.67,29.12,29.05,29.41,29.56,29.91,29.84,30.03,29.76,29.17,29.07,28.86,28.94,28.66,28.49,28.23,28.05,28.16,28.13,27.55,27.23,26.92,26.62]::double precision[], array[48.22,48.37,48.47,48.16,48.12,47.85,47.51,47.35,46.93,46.67,46.53,46.42,46.35,46.38,46.52,46.44,46.26,45.94,45.6,45.49,45.95,46.37,46.81,47.41,47.83,48.12,48.22]::double precision[]),
  ('flag:MN', 0, array[87.75,90.71,93.11,94.82,97.26,97.83,99.98,102.07,103.68,105.89,107.87,109.4,111.58,114.36,115.49,116.19,115.74,117.29,118.87,119.66,117.42,115.98,113.46,111.87,111.67,111.13,109.24,106.13,104.52,101.83,99.52,96.35,95.31,93.48,90.95,90.97,88.85,87.75]::double precision[], array[49.3,50.33,50.49,50.01,49.73,51.01,51.63,51.26,50.09,50.41,49.79,49.29,49.38,50.25,49.81,49.13,47.73,47.7,47.75,46.69,46.67,45.73,44.81,45.1,44.07,43.41,42.52,42.14,41.91,42.51,42.52,42.73,44.24,44.98,45.29,46.89,48.07,49.3]::double precision[]),
  ('flag:ME', 0, array[20.07,19.8,19.74,19.31,19.37,19.16,18.88,18.45,18.56,18.71,19.03,19.22,19.49,19.63,19.96,20.34,20.26,20.07]::double precision[], array[42.59,42.5,42.69,42.2,41.88,41.96,42.28,42.48,42.65,43.2,43.43,43.52,43.35,43.21,43.11,42.9,42.81,42.59]::double precision[]),
  ('flag:MA', 0, array[-2.17,-1.73,-1.13,-2.62,-3.65,-4.86,-6.06,-8.67,-8.82,-9.41,-10.19,-11.39,-12.03,-13.89,-14.63,-17,-16.97,-16.26,-15.98,-15.09,-14.8,-13.78,-13.12,-11.69,-10.4,-9.82,-9.3,-7.66,-6.24,-5.19,-3.64,-2.17]::double precision[], array[35.17,33.92,32.65,32.09,31.64,30.5,29.73,28.84,27.66,27.09,26.86,26.88,26.03,23.69,21.86,21.42,21.89,22.68,23.72,24.52,25.64,26.62,27.65,28.15,29.1,31.18,32.57,33.7,35.15,35.76,35.4,35.17]::double precision[]),
  ('flag:MZ', 0, array[34.56,36.51,37.47,38.43,40.32,40.44,40.6,40.48,39.45,37.41,35.9,34.79,35.18,35.39,35.53,35.61,35.04,33.01,32.66,32.83,31.98,31.75,31.67,32.24,32.66,32.61,32.85,32.33,31.64,30.34,30.18,33.79,34.46,34.31,35.03,35.77,35.27,34.56,34.56]::double precision[], array[-11.52,-11.72,-11.57,-11.29,-10.32,-11.76,-14.2,-15.41,-16.72,-17.59,-18.84,-19.78,-21.25,-22.14,-23.07,-23.71,-24.48,-25.36,-26.15,-26.74,-26.29,-25.48,-23.66,-21.12,-20.31,-19.42,-17.98,-16.39,-16.07,-15.88,-14.8,-14.45,-14.61,-15.48,-16.8,-15.9,-13.89,-13.58,-11.52]::double precision[]),
  ('flag:MM', 0, array[100.12,98.96,97.8,97.86,98.9,98.19,99.1,99.2,99.04,98.46,98.43,98.1,97.6,96.5,94.81,94.54,93.54,93.08,92.3,92.67,93.06,93.33,94.55,95.15,96.42,97.05,97.33,98.25,98.71,97.72,98.66,99.53,99.98,101.15,100.33,100.12]::double precision[], array[20.42,19.75,18.63,17.57,16.18,15.12,13.83,12.8,10.96,10.68,12.03,13.64,16.1,16.43,15.8,17.28,19.37,19.86,21.48,22.04,22.7,24.08,24.67,26,27.26,27.7,28.26,27.75,26.74,25.08,24.06,22.95,21.74,21.85,20.79,20.42]::double precision[]),
  ('flag:NA', 0, array[19.9,19.9,19,18.47,17.84,17.39,17.22,16.82,16.35,15.6,15.21,14.99,14.74,14.41,14.38,14.26,13.87,13.35,12.83,12.61,11.8,11.73,12.22,12.81,13.46,14.06,14.21,18.26,18.96,21.38,23.21,24.04,24.68,25.08,25.08,24.52,24.22,23.58,23.2,21.66,20.91,20.88,19.9,19.9]::double precision[], array[-24.77,-28.46,-28.97,-29.05,-28.86,-28.78,-28.36,-28.08,-28.58,-27.82,-27.09,-26.12,-25.39,-23.85,-22.66,-22.11,-21.7,-20.87,-19.67,-19.05,-18.07,-17.3,-17.11,-16.94,-16.97,-17.42,-17.35,-17.31,-17.79,-17.93,-17.52,-17.3,-17.35,-17.58,-17.66,-17.89,-17.89,-18.28,-17.87,-18.22,-18.25,-21.81,-21.85,-24.77]::double precision[]),
  ('flag:NP', 0, array[88.12,88.04,88.17,88.06,87.23,86.02,85.25,84.67,83.3,82,81.06,80.09,80.48,81.11,81.52,82.33,83.34,83.9,84.24,85.01,85.82,86.95,88.12]::double precision[], array[27.88,27.45,26.81,26.41,26.4,26.63,26.73,27.24,27.36,27.93,28.42,28.79,29.73,30.18,30.42,30.11,29.46,29.32,28.84,28.64,28.2,27.97,27.88]::double precision[]),
  ('flag:NL', 0, array[6.91,7.09,6.84,6.59,5.99,6.16,5.61,4.97,4.05,3.31,3.83,4.71,6.08,6.91]::double precision[], array[53.48,53.14,52.23,51.85,51.85,50.8,51.04,51.47,51.27,51.35,51.62,53.09,53.51,53.48]::double precision[]),
  ('flag:NZ', 0, array[176.89,176.51,176.01,175.24,175.07,174.65,175.23,174.9,173.82,173.85,174.57,174.74,174.7,174.29,174.32,173.84,173.06,172.63,173.01,173.55,174.33,174.61,175.34,175.36,175.81,175.96,176.76,177.44,178.01,178.52,178.28,177.97,177.21,176.94,177.03,176.89]::double precision[], array[-40.07,-40.61,-41.29,-41.69,-41.43,-41.28,-40.46,-39.91,-39.51,-39.15,-38.8,-38.03,-37.38,-36.71,-36.53,-36.12,-35.24,-34.53,-34.45,-35.01,-35.27,-36.16,-37.21,-36.53,-36.8,-37.56,-37.88,-37.96,-37.58,-37.7,-38.58,-39.17,-39.15,-39.45,-39.88,-40.07]::double precision[]),
  ('flag:NZ', 1, array[169.67,170.52,171.13,171.57,171.95,172.1,172.8,173.02,173.25,173.96,174.25,174.25,173.88,173.22,172.71,173.08,172.31,171.45,171.18,170.62,169.83,169.33,168.41,167.76,166.68,166.51,167.05,168.3,168.95,169.67]::double precision[], array[-43.56,-43.03,-42.51,-41.77,-41.51,-40.96,-40.49,-40.92,-41.33,-40.93,-41.35,-41.77,-42.23,-42.97,-43.37,-43.85,-43.87,-44.24,-44.9,-45.91,-46.36,-46.64,-46.62,-46.29,-46.22,-45.85,-45.11,-44.12,-43.94,-43.56]::double precision[]),
  ('flag:NI', 0, array[-83.66,-84.19,-84.67,-85.56,-86.06,-86.74,-87.67,-87.39,-87.01,-86.73,-86.52,-86.1,-85.7,-85.16,-85.05,-84.82,-84.45,-83.98,-83.49,-83.23,-83.18,-83.52,-83.5,-83.63,-83.65,-83.81,-83.66]::double precision[], array[10.94,10.79,11.08,11.22,11.4,12.14,12.91,12.91,13.03,13.26,13.78,14.04,13.96,14.36,14.55,14.82,14.62,14.75,15.02,14.9,14.31,13.57,12.87,12.32,11.63,11.1,10.94]::double precision[]),
  ('flag:NE', 0, array[14.85,15.47,15.9,15.3,13.97,13.96,14.6,14.21,14,13.08,11.53,10.7,9.52,7.8,6.82,5.44,4.11,3.68,2.85,2.15,1.02,0.43,0.38,1.38,3.64,4.27,5.68,12,14.14,14.85]::double precision[], array[22.86,21.05,20.39,17.93,15.68,14,13.33,12.8,12.46,13.6,13.33,13.25,12.85,13.34,13.11,13.87,13.53,12.55,12.24,11.94,12.85,13.99,14.93,15.32,15.57,16.85,19.6,23.47,22.49,22.86]::double precision[]),
  ('flag:NG', 0, array[2.69,2.72,3.22,3.6,3.57,3.68,4.11,5.44,6.82,7.8,9.52,10.7,11.53,13.08,14,14.58,14.42,13.31,12.95,12.22,11.84,11.06,10.12,9.23,8.5,7.08,5.9,5.03,3.57,2.69]::double precision[], array[6.26,8.51,9.44,10.33,11.33,12.55,13.53,13.87,13.11,13.34,12.85,13.25,13.33,13.6,12.46,12.09,11.57,10.16,9.42,8.31,7.4,6.64,7.04,6.44,4.77,4.46,4.26,5.61,6.26,6.26]::double precision[]),
  ('flag:KP', 0, array[130.78,130.78,130.78,130.78]::double precision[], array[42.22,42.22,42.22,42.22]::double precision[]),
  ('flag:KP', 1, array[130.64,130.78,130.4,129.97,129.67,129.7,129.19,129.01,128.63,127.97,127.53,127.5,127.39,127.79,128.35,128.21,127.78,127.07,126.68,126.24,126.18,125.69,125.57,125.28,125.24,124.98,124.71,124.98,125.22,125.13,125.39,125.32,124.74,124.26,125.08,126.18,126.87,127.34,128.21,128.05,129.6,130,130.64]::double precision[], array[42.4,42.22,42.28,41.94,41.6,40.88,40.66,40.48,40.19,40.03,39.76,39.32,39.21,39.05,38.61,38.37,38.3,38.26,37.81,37.84,37.75,37.94,37.75,37.67,37.86,37.95,38.11,38.55,38.67,38.85,39.39,39.55,39.66,39.93,40.57,41.11,41.82,41.5,41.47,41.99,42.42,42.98,42.4]::double precision[]),
  ('flag:NO', 0, array[15.14,15.52,16.99,18.25,21.54,19.03,18.47,17.6,17.12,15.91,13.76,14.67,13.17,11.22,10.45,13.17,13.72,15.14]::double precision[], array[79.67,80.02,80.05,79.7,78.96,78.56,77.83,77.64,76.81,76.77,77.38,77.74,78.02,78.87,79.65,80.01,79.66,79.67]::double precision[]),
  ('flag:NO', 1, array[31.1,29.4,28.59,29.01,27.73,26.18,25.69,24.73,23.66,22.36,21.25,20.64,20.03,19.88,17.99,17.73,16.77,16.11,15.11,13.56,13.92,13.57,12.58,11.93,11.99,12.63,12.3,11.47,11.03,10.36,8.38,7.05,5.66,5.31,4.99,5.91,8.55,10.53,12.36,14.76,16.44,19.18,21.38,23.02,24.55,26.37,28.16,31.29,30,31.1]::double precision[], array[69.56,69.16,69.07,69.77,70.16,69.83,69.09,68.65,68.89,68.84,69.37,69.11,69.07,68.41,68.57,68.01,68.01,67.3,66.19,64.79,64.44,64.05,64.07,63.13,61.8,61.29,60.12,59.43,58.86,59.47,58.31,58.08,58.59,59.66,61.97,62.62,63.45,64.49,65.88,67.81,68.56,69.82,70.26,70.2,71.03,70.99,71.19,70.45,70.19,69.56]::double precision[]),
  ('flag:NO', 2, array[27.41,25.93,23.02,20.08,19.9,18.46,17.37,20.46,21.91,22.92,25.45,27.41]::double precision[], array[80.06,79.52,79.4,79.57,79.84,79.86,80.32,80.6,80.36,80.66,80.41,80.06]::double precision[]),
  ('flag:NO', 3, array[24.72,22.49,20.73,21.41,20.81,22.88,23.28,24.72]::double precision[], array[77.85,77.45,77.68,77.93,78.25,78.46,78.08,77.85]::double precision[]),
  ('flag:OM', 0, array[55.21,55.23,55.53,55.53,55.98,55.8,55.89,56.4,56.85,57.4,58.14,58.73,59.18,59.45,59.81,59.81,59.44,59.28,58.86,58.49,58.03,57.83,57.67,57.79,57.7,57.24,56.61,56.51,56.28,55.66,55.27,55.27,54.79,54.24,53.57,53.11,52.78,52,55,55.67,55.21]::double precision[], array[22.71,23.11,23.53,23.93,24.13,24.27,24.92,24.93,24.24,23.88,23.75,23.57,22.99,22.66,22.53,22.31,21.71,21.43,21.11,20.43,20.48,20.24,19.74,19.07,18.95,18.95,18.57,18.09,17.88,17.88,17.63,17.23,16.95,17.04,16.71,16.65,17.35,19,20,22,22.71]::double precision[]),
  ('flag:OM', 1, array[56.26,56.07,56.36,56.49,56.39,56.26]::double precision[], array[25.71,26.06,26.4,26.31,25.9,25.71]::double precision[]),
  ('flag:PK', 0, array[77.84,75.76,73.75,74.45,74.41,73.45,71.78,69.51,70.28,71.04,68.18,67.15,64.53,61.5,63.32,62.75,61.77,60.87,63.55,64.35,66.35,66.94,67.79,68.93,69.26,70.32,70.88,71.11,71.5,71.85,74.07,75.16,76.19,77.84]::double precision[], array[35.49,34.51,34.32,32.77,31.69,29.98,27.91,26.94,25.72,24.36,23.69,24.66,25.24,25.08,26.76,27.38,28.7,29.83,29.47,29.56,29.89,31.3,31.58,31.62,32.5,33.36,33.99,34.73,35.65,36.51,36.84,37.13,35.9,35.49]::double precision[]),
  ('flag:PS', 0, array[35.4,34.93,34.97,35.22,34.98,35.18,35.54,35.54,35.4]::double precision[], array[31.49,31.35,31.62,31.75,31.87,32.53,32.39,31.78,31.49]::double precision[]),
  ('flag:PA', 0, array[-77.35,-77.24,-77.75,-78.22,-78.18,-78.62,-79.56,-80.16,-80.48,-80.28,-80.89,-81.19,-81.72,-82.39,-82.85,-82.91,-82.87,-82.93,-82.55,-82.21,-81.72,-80.95,-79.92,-79.02,-78.5,-77.73,-77.35]::double precision[], array[8.67,7.94,7.71,7.51,8.32,8.72,8.93,8.33,8.09,7.42,7.22,7.65,8.11,8.29,8.07,8.42,8.81,9.07,9.57,8.99,9.03,8.86,9.31,9.55,9.42,8.95,8.67]::double precision[]),
  ('flag:PG', 0, array[141,142.74,144.58,145.27,145.83,145.98,147.65,147.89,146.97,147.19,148.09,148.73,149.31,149.27,150.04,149.74,150.8,150.69,150.03,149.78,148.92,147.91,147.14,146.57,146.05,144.74,143.9,143.29,143.41,142.63,142.07,141.03,141.02,141]::double precision[], array[-2.6,-3.29,-3.86,-4.37,-4.88,-5.47,-6.08,-6.61,-6.72,-7.39,-8.04,-9.11,-9.07,-9.51,-9.68,-9.87,-10.29,-10.58,-10.65,-10.39,-10.28,-10.13,-9.49,-8.94,-8.07,-7.63,-7.92,-8.25,-8.98,-9.33,-9.16,-9.12,-5.86,-2.6]::double precision[]),
  ('flag:PG', 1, array[152.64,153.02,153.14,152.83,152.64,152.41,151.95,151.38,150.66,150.94,151.48,151.82,152.24,152.64]::double precision[], array[-3.66,-3.98,-4.5,-4.77,-4.18,-3.79,-3.46,-3.04,-2.74,-2.5,-2.78,-3,-3.24,-3.66]::double precision[]),
  ('flag:PG', 2, array[151.3,150.75,150.24,149.71,148.89,148.32,148.4,149.3,149.85,150,150.14,150.24,150.81,151.09,151.65,151.54,152.14,152.34,152.32,151.98,151.46,151.3]::double precision[], array[-5.84,-6.08,-6.32,-6.32,-6.03,-5.75,-5.44,-5.58,-5.51,-5.03,-5,-5.53,-5.46,-5.11,-4.76,-4.17,-4.15,-4.31,-4.87,-5.48,-5.56,-5.84]::double precision[]),
  ('flag:PG', 3, array[154.76,155.06,155.55,156.02,155.88,155.6,155.17,154.73,154.52,154.65,154.76]::double precision[], array[-5.34,-5.57,-6.2,-6.54,-6.82,-6.92,-6.54,-5.9,-5.14,-5.04,-5.34]::double precision[]),
  ('flag:PY', 0, array[-58.17,-57.87,-57.94,-56.88,-56.47,-55.8,-55.61,-55.52,-55.4,-55.03,-54.65,-54.29,-54.29,-54.43,-54.63,-54.79,-55.69,-56.49,-57.61,-58.62,-57.63,-57.78,-58.81,-60.03,-60.85,-62.69,-62.29,-62.26,-61.79,-60.04,-59.11,-58.18,-58.17]::double precision[], array[-20.18,-20.73,-22.09,-22.28,-22.09,-22.36,-22.66,-23.57,-23.96,-24,-23.84,-24.02,-24.57,-25.16,-25.74,-26.62,-27.39,-27.55,-27.4,-27.12,-25.6,-25.16,-24.77,-24.03,-23.88,-22.25,-21.05,-20.51,-19.63,-19.34,-19.36,-19.87,-20.18]::double precision[]),
  ('flag:PE', 0, array[-69.89,-70.93,-72.89,-73.22,-73.72,-73.99,-73.01,-72.56,-71.3,-70.55,-69.53,-68.88,-68.95,-69.16,-68.96,-69.86,-71.38,-73.45,-76.01,-76.26,-78.09,-79.45,-80.54,-80.93,-81.1,-80.19,-80.44,-79.62,-78.64,-77.84,-75.54,-75.37,-74.44,-73.66,-72.33,-71.41,-70.05,-70.39,-69.89]::double precision[], array[-4.3,-4.4,-5.28,-6.09,-6.92,-7.52,-9.03,-9.52,-10.08,-11.01,-10.95,-12.9,-14.45,-15.32,-16.5,-18.09,-17.77,-16.36,-14.65,-13.53,-10.38,-7.93,-6.54,-5.69,-4.04,-3.82,-4.43,-4.45,-4.55,-3,-1.56,-0.15,-0.53,-1.26,-2.44,-2.34,-2.72,-3.77,-4.3]::double precision[]),
  ('flag:PH', 0, array[120.83,120.32,121.18,121.53,121.26,120.83]::double precision[], array[12.7,13.47,13.43,13.07,12.21,12.7]::double precision[]),
  ('flag:PH', 1, array[122.59,122.84,122.95,123.5,123.34,124.08,123.98,123.62,123.31,123,122.38,122.59]::double precision[], array[9.98,10.26,10.88,10.94,10.27,11.23,10.28,9.95,9.32,9.02,9.71,9.98]::double precision[]),
  ('flag:PH', 2, array[126.38,126.48,126.54,126.2,125.83,125.36,125.68,125.4,124.22,123.94,124.24,123.61,123.3,122.82,122.09,121.92,122.31,122.94,123.49,123.84,124.6,124.76,125.47,125.41,126.22,126.31,126.38]::double precision[], array[8.41,7.75,7.19,6.27,7.29,6.79,6.05,5.58,6.16,6.89,7.36,7.83,7.42,7.46,6.9,7.19,8.04,8.32,8.69,8.24,8.51,8.96,8.99,9.76,9.29,8.78,8.41]::double precision[]),
  ('flag:PH', 3, array[118.5,117.18,117.67,118.39,118.99,119.51,119.69,119.03,118.5]::double precision[], array[9.32,8.37,9.07,9.68,10.38,11.37,10.55,10,9.32]::double precision[]),
  ('flag:PH', 4, array[122.34,122.17,122.51,122.25,121.66,121.51,121.73,122.26,122.7,123.95,123.85,124.18,124.08,123.3,122.93,122.67,122.04,121.13,120.63,120.68,120.99,120.69,120.56,120.07,119.92,119.88,120.29,120.39,120.71,121.32,121.94,122.24,122.34]::double precision[], array[18.22,17.81,17.09,16.26,15.93,15.13,14.33,14.22,14.34,13.78,13.24,13,12.54,13.03,13.55,13.19,13.78,13.64,13.86,14.27,14.53,14.76,14.4,14.97,15.41,16.36,16.03,17.6,18.51,18.5,18.22,18.48,18.22]::double precision[]),
  ('flag:PH', 5, array[122.04,121.88,122.48,123.12,123.1,122.64,122,121.97,122.04]::double precision[], array[11.42,11.89,11.58,11.58,11.17,10.74,10.44,10.91,11.42]::double precision[]),
  ('flag:PH', 6, array[125.5,125.78,125.01,125.03,125.28,124.8,124.76,124.46,124.3,124.89,124.88,124.27,125.23,125.5]::double precision[], array[12.16,11.05,11.31,10.98,10.36,10.13,10.84,10.89,11.49,11.42,11.79,12.56,12.54,12.16]::double precision[]),
  ('flag:PL', 0, array[23.48,23.53,23.81,23.8,23.2,23.51,23.53,24.03,23.92,23.43,22.52,22.78,22.56,21.61,20.89,20.42,19.82,19.32,18.91,18.85,18.39,17.65,17.56,16.87,16.72,16.18,16.24,15.49,15.02,14.61,14.69,14.44,14.07,14.35,14.12,14.8,16.36,17.62,18.62,18.7,19.66,20.89,22.73,23.24,23.48]::double precision[], array[53.91,53.47,53.09,52.69,52.49,52.02,51.58,50.71,50.43,50.31,49.48,49.03,49.09,49.47,49.33,49.43,49.22,49.57,49.44,49.5,49.99,50.05,50.36,50.47,50.22,50.42,50.7,50.78,51.11,51.75,52.09,52.63,52.98,53.25,53.76,54.05,54.51,54.85,54.68,54.44,54.43,54.31,54.33,54.22,53.91]::double precision[]),
  ('flag:PT', 0, array[-9.03,-8.67,-8.26,-8.01,-7.42,-7.25,-6.67,-6.39,-6.85,-6.86,-7.03,-7.07,-7.5,-7.1,-7.37,-7.03,-7.17,-7.54,-7.45,-7.86,-8.38,-8.9,-8.75,-8.84,-9.29,-9.53,-9.45,-9.05,-8.98,-8.77,-8.79,-8.99,-9.03]::double precision[], array[41.88,42.14,42.28,41.79,41.79,41.92,41.88,41.38,41.11,40.33,40.19,39.71,39.63,39.03,38.37,38.08,37.8,37.43,37.1,36.84,36.98,36.87,37.65,38.27,38.36,38.74,39.39,39.76,40.16,40.76,41.18,41.54,41.88]::double precision[]),
  ('flag:QA', 0, array[50.81,50.74,51.01,51.29,51.59,51.61,51.39,51.11,50.81]::double precision[], array[24.75,25.48,26.01,26.12,25.8,25.22,24.63,24.56,24.75]::double precision[]),
  ('flag:RO', 0, array[28.23,28.68,29.15,29.6,29.63,29.14,28.84,28.56,27.97,27.24,26.07,25.57,24.1,23.33,22.94,22.66,22.47,22.71,22.46,22.15,21.56,21.48,20.87,20.76,20.22,21.02,21.63,22.1,22.71,23.14,23.76,24.4,24.87,25.21,25.95,26.2,26.62,26.92,27.23,27.55,28.13,28.16,28.05,28.23]::double precision[], array[45.49,45.3,45.46,45.29,45.04,44.82,44.91,43.71,43.81,44.18,43.94,43.69,43.74,43.9,43.82,44.24,44.41,44.58,44.7,44.48,44.77,45.18,45.42,45.74,46.13,46.32,46.99,47.67,47.88,48.1,47.99,47.98,47.74,47.89,47.99,48.22,48.22,48.12,47.83,47.41,46.81,46.37,45.95,45.49]::double precision[]),
  ('flag:RU', 0, array[93.78,95.94,97.88,100.19,99.94,97.76,94.97,93.31,92.54,91.18,93.78]::double precision[], array[81.03,81.25,80.75,79.78,78.88,78.76,79.04,79.43,80.14,80.34,81.03]::double precision[]),
  ('flag:RU', 1, array[102.84,105.37,105.08,99.44,101.26,102.09,102.84]::double precision[], array[79.28,78.71,78.31,77.92,79.23,79.35,79.28]::double precision[]),
  ('flag:RU', 2, array[138.83,141.47,145.09,144.3,140.62,138.96,136.98,137.51,138.83]::double precision[], array[76.14,76.09,75.56,74.82,74.85,74.61,75.26,75.95,76.14]::double precision[]),
  ('flag:RU', 3, array[148.22,150.73,149.58,147.98,146.12,146.36,148.22]::double precision[], array[75.35,75.08,74.69,74.78,75.17,75.5,75.35]::double precision[]),
  ('flag:RU', 4, array[139.86,140.81,142.06,143.48,143.6,142.09,140.04,139.86]::double precision[], array[73.37,73.77,73.86,73.47,73.21,73.21,73.32,73.37]::double precision[]),
  ('flag:RU', 5, array[44.85,46.8,48.32,48.52,49.1,50.04,51.52,51.14,49.79,48.89,48.75,47.59,46.5,47.07,44.85]::double precision[], array[80.59,80.77,80.78,80.51,80.75,80.92,80.7,80.55,80.42,80.34,80.18,80.01,80.25,80.56,80.59]::double precision[]),
  ('flag:RU', 6, array[22.73,20.89,19.66,19.89,21.27,22.31,22.76,22.65,22.73]::double precision[], array[54.33,54.31,54.43,54.87,55.19,55.02,54.86,54.58,54.33]::double precision[]),
  ('flag:RU', 7, array[53.51,55.9,55.63,57.87,61.17,64.5,66.21,68.16,68.85,68.18,64.64,61.58,58.48,56.99,55.42,55.62,57.53,56.94,53.68,53.41,51.6,51.46,52.48,52.44,54.43,53.51]::double precision[], array[73.75,74.63,75.08,75.61,76.25,76.44,76.81,76.94,76.54,76.23,75.74,75.26,74.31,73.33,72.37,71.54,70.72,70.63,70.76,71.21,71.47,72.02,72.23,72.78,73.63,73.75]::double precision[]),
  ('flag:RU', 8, array[142.92,143.26,143.24,143.65,144.65,143.18,142.56,143.54,143.51,142.75,142.09,141.91,142.02,141.9,142.13,142.18,141.59,141.68,142.61,142.21,142.65,142.92]::double precision[], array[53.7,52.74,51.76,50.75,48.98,49.31,47.86,46.84,46.14,46.74,45.97,46.81,47.78,48.86,49.61,50.95,51.94,53.3,53.76,54.23,54.37,53.7]::double precision[]),
  ('flag:RU', 9, array[-180,-174.93,-174.34,-171.86,-170.89,-172.56,-173.89,-175.98,-177.22,-178.9,-179.88,-180,-180]::double precision[], array[68.96,67.21,66.34,66.91,65.54,64.46,64.28,64.92,65.52,65.74,65.87,64.98,68.96]::double precision[]),
  ('flag:RU', 10, array[130.78,130.63,131.29,131.88,133.77,134.5,133.37,130.99,129.4,127.29,126.56,125.07,122.24,120.18,120.74,119.28,117.88,115.49,114.36,111.58,109.4,107.87,105.89,103.68,102.07,99.98,97.83,97.26,94.82,93.11,90.71,87.75,86.83,85.11,83.94,81.95,80.03,76.52,74.39,73.51,71.18,69.07,65.67,61.44,61.7,60.93,61.59,59.93,58.36,55.72,52.33,48.7,47.55,47.04,47.31,48.7,49.1,47.68,47.59,48.58,47.81,46.69,45.78,44.54,43.76,40.92,39.95,37.54,37.4,37.67,39.12,38.26,39.74,39.67,40.07,38.01,36.62,35.38,34.22,34.39,32.72,32.16,31.54,31.5,32.69,31.73,31.38,30.97,29.9,29.23,27.86,27.29,27.42,27.98,28.07,31.14,30.04,29.54,29.05,28.45,29.4,32.13,36.51,41.06,40.02,33.92,34.81,34.94,37.01,36.54,39.59,39.76,43.02,44.53,44.19,46.25,45.56,46.35,48.14,53.72,53.49,55.44,58.8,61.08,60.55,64.89,69.18,68.14,67.26,66.7,69.2,72.59,71.85,72.79,73.67,71.28,72.82,74.19,74.47,73.84,74.4,74.89,75.16,75.29,75.9,79.65,80.61,82.25,86.82,87.17,90.26,93.24,96.68,100.76,101.99,106.07,106.97,108.15,113.33,113.89,110.15,110.64,113.02,113.97,118.78,123.2,125.38,128.59,128.46,131.29,133.86,137.5,139.87,140.47,150.35,157.01,159.83,160.94,164.05,167.84,170.82,170.45,175.72,178.71,178.31,179.37,179.23,174.57,172.15,170.33,166.29,164.88,163.22,162.05,163.06,161.7,160.37,158.53,156.79,155.99,155.92,156.81,160.15,163.67,163.26,160.12,156.72,155.04,151.26,149.78,145.49,138.96,136.7,138.16,139.9,141.38,140.51,138.56,136.86,134.87,132.91,130.94,130.78,130.78]::double precision[], array[42.22,42.9,44.11,45.32,46.12,47.58,48.18,47.79,49.44,50.74,51.78,53.16,53.43,52.75,51.96,50.58,49.51,49.81,50.25,49.38,49.29,49.79,50.41,50.09,51.26,51.63,51.01,49.73,50.01,50.49,50.33,49.3,49.83,50.12,50.89,50.81,50.87,54.18,53.55,54.04,54.13,55.38,54.6,54.01,52.98,52.45,51.27,50.84,51.06,50.62,51.72,50.6,50.45,49.15,47.72,47.08,46.4,45.64,43.66,41.81,41.15,41.83,42.09,42.71,42.74,43.38,43.44,44.66,45.41,46.64,47.26,47.55,47.9,48.78,49.6,49.92,50.23,50.77,51.26,51.77,52.24,52.06,52.74,53.17,53.35,53.79,54.16,55.08,55.79,55.92,56.76,57.47,58.72,59.48,60.5,62.36,63.55,64.95,66.94,68.36,69.16,69.91,69.06,67.46,66.27,66.76,65.9,64.41,63.85,64.76,64.52,65.5,66.42,66.76,67.95,68.25,67.57,66.67,67.52,68.86,68.2,68.44,68.88,68.94,69.85,69.23,68.62,69.36,69.93,71.03,72.84,72.78,71.41,70.39,68.41,66.32,66.53,67.28,68.33,69.07,70.63,72.12,72.86,71.34,71.87,72.32,72.58,73.85,73.94,75.12,75.64,76.05,75.92,76.43,77.29,77.37,76.97,76.72,76.22,75.33,74.48,74.04,73.98,73.59,73.59,72.97,73.56,73.04,71.98,70.79,71.39,71.35,71.49,72.85,71.61,71.03,70.45,69.44,69.67,69.58,69.01,70.1,69.88,64.53,64.08,62.98,62.3,61.77,60.95,59.88,59.79,59.73,59.21,57.84,56.16,55.29,54.34,52.96,51.01,53.16,56.77,57.83,59.31,61.14,62.47,60.54,61.43,59.15,58.78,59.66,59.34,57.09,54.6,53.75,54.19,52.24,50.05,47,45.14,43.4,42.8,42.55,42.22,42.22]::double precision[]),
  ('flag:RU', 11, array[-180,-179.87,-179.02,-177.58,-177.66,-178.69,-180,-180,-180]::double precision[], array[71.52,71.56,71.56,71.27,71.13,70.89,70.83,71.52,71.52]::double precision[]),
  ('flag:RU', 12, array[33.44,33.7,34.41,34.73,34.86,35.01,35.02,35.51,36.53,36.33,35.24,33.88,33.33,33.55,32.45,32.63,33.59,33.44]::double precision[], array[45.97,46.22,46,45.97,45.77,45.74,45.65,45.41,45.47,45.11,44.94,44.36,44.57,45.03,45.33,45.52,45.85,45.97]::double precision[]),
  ('flag:RW', 0, array[30.42,30.81,30.76,30.47,29.94,29.63,29.03,29.12,29.26,29.29,29.58,29.82,30.42]::double precision[], array[-1.14,-1.7,-2.29,-2.41,-2.35,-2.92,-2.84,-2.29,-2.21,-1.62,-1.34,-1.44,-1.14]::double precision[]),
  ('flag:SS', 0, array[30.83,29.72,28.7,27.98,27.21,26.21,25.12,24.57,24.19,24.8,25.79,26.48,27.11,27.97,29,29.62,30.84,31.85,32.32,32.68,33.21,33.21,33.84,33.96,33.82,32.95,34.08,34.71,34.62,33.39,31.88,30.83]::double precision[], array[3.51,4.6,4.46,4.41,5.55,6.55,7.5,8.23,8.73,9.81,10.41,9.55,9.64,9.4,9.6,10.08,9.71,10.53,11.68,12.02,12.18,10.72,9.98,9.46,8.38,7.78,7.23,6.59,4.85,3.79,3.56,3.51]::double precision[]),
  ('flag:SA', 0, array[34.95,36.5,37.5,38,39,40.4,44.71,47.46,48.42,49.3,50.15,50.11,50.53,50.81,51.39,51.62,55.01,55.67,52,48.18,47,46.37,45.22,43.79,43.12,42.78,42.35,41.76,40.94,39.8,39.02,38.49,37.49,37.21,36.64,35.64,34.63,34.83,34.95]::double precision[], array[29.36,29.51,30,30.51,32.01,31.89,29.18,29,28.55,27.46,26.69,25.94,25.33,24.75,24.63,24.01,22.5,22,19,18.17,16.95,17.23,17.43,17.32,17.09,16.35,17.08,17.83,19.49,20.34,21.99,23.69,24.29,25.08,25.83,27.38,28.06,28.96,29.36]::double precision[]),
  ('flag:SN', 0, array[-16.71,-17.13,-17.62,-17.18,-16.7,-16.46,-16.12,-15.62,-15.14,-14.58,-14.1,-13.44,-12.83,-12.17,-12.12,-11.93,-11.55,-11.47,-11.51,-11.66,-12.2,-12.28,-12.5,-13.22,-13.7,-15.55,-15.82,-16.15,-16.68,-16.84,-15.93,-15.69,-15.51,-15.14,-14.71,-14.28,-13.84,-14.05,-14.38,-14.69,-15.08,-15.4,-15.63,-16.71]::double precision[], array[13.6,14.37,14.73,14.92,15.62,16.14,16.46,16.37,16.59,16.6,16.3,16.04,15.3,14.62,13.99,13.42,13.14,12.75,12.44,12.39,12.47,12.35,12.33,12.58,12.59,12.63,12.52,12.55,12.39,13.15,13.13,13.27,13.28,13.51,13.3,13.28,13.51,13.79,13.63,13.63,13.88,13.86,13.62,13.6]::double precision[]),
  ('flag:RS', 0, array[18.83,19.6,20.22,20.76,20.87,21.48,21.56,22.15,22.46,22.71,22.47,22.66,22.41,22.5,22.98,22.61,22.44,22.55,22.38,21.92,21.58,21.54,21.66,21.77,21.63,21.44,21.27,21.14,20.96,20.81,20.63,20.5,20.26,20.34,19.96,19.63,19.49,19.22,19.45,19.6,19.12,19.37,19.01,19.39,19.07,18.83]::double precision[], array[45.91,46.17,46.13,45.74,45.42,45.18,44.77,44.48,44.7,44.58,44.41,44.24,44.01,43.64,43.21,42.9,42.58,42.46,42.32,42.3,42.25,42.32,42.44,42.68,42.68,42.86,42.91,43.07,43.13,43.27,43.22,42.88,42.81,42.9,43.11,43.21,43.35,43.52,43.57,44.04,44.42,44.86,44.86,45.24,45.52,45.91]::double precision[]),
  ('flag:SL', 0, array[-13.25,-12.71,-12.6,-12.43,-12.15,-11.92,-11.12,-10.84,-10.62,-10.65,-10.5,-10.51,-10.23,-10.69,-11.15,-11.2,-11.44,-11.71,-12.43,-12.95,-13.12,-13.25]::double precision[], array[8.9,9.34,9.62,9.84,9.86,10.05,10.05,9.69,9.27,8.98,8.72,8.35,8.41,7.94,7.4,7.11,6.79,6.86,7.26,7.8,8.16,8.9]::double precision[]),
  ('flag:SK', 0, array[22.56,22.28,22.08,21.87,20.8,20.48,20.24,19.77,19.66,19.18,18.78,18.7,17.86,17.49,16.98,16.88,16.96,17.1,17.54,17.89,17.91,18.11,18.17,18.4,18.56,18.85,18.91,19.32,19.82,20.42,20.89,21.61,22.56]::double precision[], array[49.09,48.83,48.42,48.32,48.62,48.56,48.33,48.2,48.27,48.11,48.08,47.88,47.76,47.87,48.12,48.47,48.6,48.82,48.8,48.9,49,49.04,49.27,49.31,49.49,49.5,49.44,49.57,49.22,49.43,49.33,49.47,49.09]::double precision[]),
  ('flag:SI', 0, array[13.81,14.63,15.14,16.01,16.2,16.37,16.57,15.77,15.67,15.32,15.33,14.93,14.6,14.41,13.71,13.94,13.7,13.81]::double precision[], array[46.51,46.43,46.66,46.68,46.85,46.84,46.5,46.24,45.83,45.73,45.45,45.47,45.64,45.47,45.5,45.59,46.02,46.51]::double precision[]),
  ('flag:SB', 0, array[162.12,162.4,161.7,161.32,161.92,162.12]::double precision[], array[-10.48,-10.83,-10.82,-10.21,-10.45,-10.48]::double precision[]),
  ('flag:SB', 1, array[161.68,161.53,160.79,160.58,160.92,161.28,161.68]::double precision[], array[-9.6,-9.78,-8.92,-8.32,-8.32,-9.12,-9.6]::double precision[]),
  ('flag:SB', 2, array[160.85,160.46,159.85,159.64,159.7,160.36,160.69,160.85]::double precision[], array[-9.87,-9.9,-9.79,-9.64,-9.24,-9.4,-9.61,-9.87]::double precision[]),
  ('flag:SB', 3, array[159.64,159.88,159.92,159.13,158.59,158.21,158.36,158.82,159.64]::double precision[], array[-8.02,-8.34,-8.54,-8.11,-7.75,-7.42,-7.32,-7.56,-8.02]::double precision[]),
  ('flag:SB', 4, array[157.14,157.54,157.34,156.9,156.49,156.54,157.14]::double precision[], array[-7.02,-7.35,-7.4,-7.18,-6.77,-6.6,-7.02]::double precision[]),
  ('flag:SO', 0, array[41.59,40.99,40.98,41.86,42.13,42.77,43.66,44.96,47.79,48.49,48.94,48.94,48.94,48.94,48.95,49.27,49.73,50.26,50.73,51.11,51.13,51.04,51.05,50.83,50.55,50.07,49.45,48.6,47.74,46.56,45.56,44.07,43.14,42.04,41.81,41.59]::double precision[], array[-1.68,-0.86,2.78,3.92,4.23,4.25,4.96,5,8,8.84,9.45,9.97,10.98,11.39,11.41,11.43,11.58,11.68,12.02,12.02,11.75,11.17,10.64,10.28,9.2,8.08,6.8,5.34,4.22,2.86,2.05,1.05,0.29,-0.92,-1.45,-1.68]::double precision[]),
  ('flag:ZA', 0, array[16.35,17.22,17.84,19,19.9,20.76,20.89,22.11,22.83,23.73,25.03,25.77,26.49,27.12,29.43,30.32,31.19,31.93,31.84,31.04,30.68,31.28,32.07,32.58,32.2,31.33,30.62,28.92,27.46,25.91,25.17,23.59,22.57,20.69,19.61,18.86,18.38,18.25,18.25,17.57,17.06,16.35]::double precision[], array[-28.58,-28.36,-28.86,-28.97,-24.77,-25.87,-26.83,-26.28,-25.5,-25.39,-25.72,-25.17,-24.62,-23.58,-22.09,-22.27,-22.25,-24.37,-25.84,-25.73,-26.4,-27.29,-26.73,-27.47,-28.75,-29.4,-30.42,-32.17,-33.23,-33.67,-33.8,-33.79,-33.86,-34.42,-34.82,-34.44,-34.14,-33.28,-32.43,-30.73,-29.88,-28.58]::double precision[]),
  ('flag:ZA', 1, array[28.98,28.54,28.07,27.53,27,27.75,28.11,28.29,28.85,29.02,29.32,28.98]::double precision[], array[-28.96,-28.65,-28.85,-29.24,-29.88,-30.64,-30.55,-30.23,-30.07,-29.74,-29.26,-28.96]::double precision[]),
  ('flag:KR', 0, array[126.18,126.24,126.68,127.07,127.78,128.21,128.35,129.21,129.46,129.47,129.09,128.18,127.39,126.49,126.37,126.56,126.12,126.86,126.18]::double precision[], array[37.75,37.84,37.81,38.26,38.3,38.37,38.61,37.43,36.78,35.63,35.08,34.89,34.48,34.39,34.93,35.68,36.73,36.89,37.75]::double precision[]),
  ('flag:ES', 0, array[-7.45,-7.17,-7.37,-7.5,-7.03,-6.85,-6.67,-7.42,-8.26,-9.03,-9.39,-6.76,-4.35,-1.9,0.34,1.83,3.04,0.81,0.11,0.11,-0.68,-2.15,-4.37,-5.38,-6.24,-7.45]::double precision[], array[37.1,37.8,38.37,39.63,40.19,41.11,41.88,41.79,42.28,41.88,43.03,43.57,43.4,43.42,42.58,42.34,41.89,41.01,40.12,38.74,37.64,36.67,36.68,35.95,36.37,37.1]::double precision[]),
  ('flag:LK', 0, array[81.79,81.64,81.22,80.35,79.87,79.7,80.15,80.84,81.31,81.79]::double precision[], array[7.52,6.48,6.2,5.97,6.76,8.2,9.82,9.27,8.56,7.52]::double precision[]),
  ('flag:SD', 0, array[24.57,23.46,23.56,22.98,22.88,22.5,21.94,22.3,22.51,22.57,23.89,23.85,25,32.9,37.19,37.11,37.86,37.9,36.85,36.32,36.27,35.26,34.73,33.96,33.96,33.84,33.21,33.21,32.68,32.32,31.85,30.84,29.62,29,27.97,27.11,26.48,25.79,24.8,24.19,24.57]::double precision[], array[8.23,8.95,9.68,10.71,11.38,12.26,12.59,13.37,14.09,14.94,15.61,20,22,22,21.02,19.81,18.37,17.43,16.96,14.82,13.56,12.08,10.91,9.58,9.46,9.98,10.72,12.18,12.02,11.68,10.53,9.71,10.08,9.6,9.4,9.64,9.55,10.41,9.81,8.73,8.23]::double precision[]),
  ('flag:SR', 0, array[-54.52,-55.1,-55.57,-55.97,-56.07,-55.91,-56,-56.54,-57.15,-57.28,-57.6,-58.05,-57.86,-57.92,-57.31,-57.15,-55.95,-55.84,-55.03,-53.96,-54.48,-54.4,-54.01,-54.18,-54.27,-54.52]::double precision[], array[2.31,2.52,2.42,2.51,2.22,2.02,1.82,1.9,2.77,3.33,3.33,4.06,4.58,4.81,5.07,5.97,5.77,5.95,6.03,5.76,4.9,4.21,3.62,3.19,2.73,2.31]::double precision[]),
  ('flag:SE', 0, array[11.03,11.47,12.3,12.63,11.99,11.93,12.58,13.57,13.92,13.56,15.11,16.11,16.77,17.73,17.99,19.88,20.03,20.64,21.98,23.54,23.57,23.9,22.18,21.21,21.37,19.78,17.85,17.12,17.83,18.79,17.87,16.83,16.45,15.88,14.67,14.1,12.94,12.62,11.79,11.03]::double precision[], array[58.86,59.43,60.12,61.29,61.8,63.13,64.07,64.05,64.44,64.79,66.19,67.3,68.01,68.01,68.57,68.41,69.07,69.11,68.62,67.94,66.4,66.01,65.72,65.03,64.41,63.61,62.75,61.34,60.64,60.08,58.95,58.72,57.04,56.1,56.2,55.41,55.36,56.31,57.44,58.86]::double precision[]),
  ('flag:CH', 0, array[9.6,9.63,9.48,9.93,10.44,10.36,9.92,9.18,8.97,8.49,8.32,7.76,7.27,6.84,6.5,6.02,6.04,6.77,6.74,7.19,7.47,8.32,8.52,9.6]::double precision[], array[47.52,47.35,47.1,46.92,46.89,46.48,46.31,46.44,46.04,46,46.16,45.82,45.78,45.99,46.43,46.27,46.73,47.29,47.54,47.45,47.62,47.61,47.83,47.52]::double precision[]),
  ('flag:SY', 0, array[35.72,35.7,35.84,35.82,36.07,36.61,36.45,36,35.9,36.15,36.42,36.69,36.74,37.07,38.17,38.7,39.52,40.68,41.21,42.35,41.84,41.29,41.38,41.01,38.79,36.83,35.72]::double precision[], array[32.71,32.72,32.87,33.28,33.82,34.2,34.59,34.65,35.41,35.82,36.04,36.26,36.82,36.62,36.9,36.71,36.72,37.09,37.07,37.23,36.61,36.36,35.63,34.42,33.38,32.31,32.71]::double precision[]),
  ('flag:TJ', 0, array[67.83,68.39,68.18,67.44,67.7,68.54,69.01,69.33,70.67,70.46,70.6,71.01,70.65,69.56,69.46,70.55,71.78,73.68,73.93,74.26,74.86,74.83,74.98,73.95,73.26,72.64,72.19,71.84,71.45,71.54,71.24,71.35,70.81,70.38,70.27,70.12,69.52,69.19,68.86,68.14,67.83]::double precision[], array[37.15,38.16,38.9,39.14,39.58,39.53,40.09,40.73,40.96,40.5,40.22,40.24,39.94,40.1,39.53,39.6,39.28,39.43,38.51,38.61,38.38,37.99,37.42,37.42,37.5,37.05,36.95,36.74,37.07,37.91,37.95,38.26,38.49,38.14,37.73,37.59,37.61,37.15,37.34,37.02,37.15]::double precision[]),
  ('flag:TZ', 0, array[33.9,34.07,37.7,37.77,39.2,38.74,38.8,39.44,39.47,39.2,39.25,39.19,39.54,39.95,40.32,39.52,38.43,37.83,37.47,36.78,36.51,35.31,34.56,34.28,33.94,33.74,32.76,32.19,31.56,31.16,30.74,30.2,29.62,29.42,29.52,29.34,29.75,30.12,30.5,30.75,30.74,30.53,30.47,30.76,30.81,30.42,30.77,31.87,33.9]::double precision[], array[-0.95,-1.06,-3.1,-3.68,-4.68,-5.91,-6.48,-6.84,-7.1,-7.7,-8.01,-8.49,-9.11,-10.1,-10.32,-10.9,-11.29,-11.27,-11.57,-11.6,-11.72,-11.44,-11.52,-10.16,-9.69,-9.42,-9.23,-8.93,-8.76,-8.59,-8.34,-7.08,-6.52,-5.94,-5.42,-4.5,-4.45,-4.09,-3.57,-3.36,-3.03,-2.81,-2.41,-2.29,-1.7,-1.14,-1.01,-1.03,-0.95]::double precision[]),
  ('flag:TH', 0, array[105.22,102.99,102.58,100.83,100.1,99.48,99.22,100.28,101.02,102.14,101.16,100.26,99.69,98.99,98.34,98.26,99.04,99.2,99.1,98.19,98.9,97.86,97.8,98.96,100.12,100.6,101.04,102.11,103,103.96,104.78,105.54,105.22]::double precision[], array[14.27,14.23,12.19,12.63,13.41,10.85,9.24,8.3,6.86,6.22,5.69,6.64,6.85,7.91,7.79,8.97,10.96,12.8,13.83,15.12,16.18,17.57,18.63,19.75,20.42,19.51,18.41,18.11,17.96,18.24,16.44,14.72,14.27]::double precision[]),
  ('flag:TL', 0, array[124.97,125.09,125.95,126.64,126.96,127.34,126.97,125.93,125.09,125.07,124.97]::double precision[], array[-8.89,-8.66,-8.43,-8.4,-8.27,-8.4,-8.67,-9.11,-9.39,-9.09,-8.89]::double precision[]),
  ('flag:TG', 0, array[0.9,0.77,1.08,1.42,1.46,1.67,1.62,1.87,1.06,0.84,0.57,0.49,0.71,0.46,0.37,0.37,-0.05,0.02,0.9]::double precision[], array[11,10.47,10.18,9.83,9.34,9.13,6.83,6.14,5.93,6.28,6.91,7.41,8.31,8.68,9.47,10.19,10.71,11.02,11]::double precision[]),
  ('flag:TT', 0, array[-61.68,-61.11,-60.9,-60.94,-61.77,-61.95,-61.66,-61.68]::double precision[], array[10.76,10.89,10.85,10.11,10,10.09,10.37,10.76]::double precision[]),
  ('flag:TN', 0, array[9.48,9.06,8.44,8.43,7.61,7.53,8.14,8.38,8.22,8.42,9.51,10.21,10.18,11.03,11.1,10.6,10.59,10.94,10.81,10.15,10.34,10.86,11.11,11.49,11.43,10.95,10.64,9.95,10.06,9.97,9.48]::double precision[], array[30.31,32.1,32.51,32.75,33.34,34.1,34.66,35.48,36.43,36.95,37.35,37.23,36.72,37.09,36.9,36.41,35.95,35.7,34.83,34.33,33.79,33.77,33.29,33.14,32.37,32.08,31.76,31.38,30.96,30.54,30.31]::double precision[]),
  ('flag:TR', 0, array[44.77,43.94,42.35,40.68,38.7,37.07,36.69,36.15,36.16,34.71,32.51,30.62,29.7,27.64,26.32,26.17,28.82,31.15,33.51,36.91,39.51,41.55,43.58,43.66,44.79,44.42,44.77]::double precision[], array[37.17,37.26,37.23,37.09,36.71,36.62,36.26,35.82,36.65,36.8,36.11,36.68,36.15,36.66,38.21,39.46,40.46,41.09,42.02,41.33,41.1,41.54,41.09,40.25,39.71,38.28,37.17]::double precision[]),
  ('flag:TR', 1, array[26.12,27.14,28,28.11,28.99,28.81,27.62,27.19,26.36,26.04,26.06,26.29,26.6,26.12]::double precision[], array[41.83,42.14,42.01,41.62,41.3,41.06,41,40.69,40.15,40.62,40.82,40.94,41.56,41.83]::double precision[]),
  ('flag:TM', 0, array[52.5,54.08,55.46,57.09,57.79,59.97,60.46,61.88,63.52,65.22,66.52,65.75,64.74,63.98,62.98,61.21,60.38,58.44,56.62,55.51,53.92,53.88,53.36,52.92,54.74,53.72,52.81,52.5]::double precision[], array[41.78,42.32,41.26,41.32,42.17,42.22,41.22,41.08,39.36,38.4,37.36,37.66,37.11,36.01,35.4,35.65,36.53,37.52,38.12,37.96,37.2,38.95,39.98,40.88,40.95,42.12,41.13,41.78]::double precision[]),
  ('flag:UG', 0, array[33.9,31.87,30.77,30.42,29.82,29.58,29.59,29.82,29.87,30.09,30.47,30.85,31.17,30.77,30.83,31.25,31.88,32.69,33.39,34,34.48,34.59,35.04,34.67,34.18,33.89,33.9]::double precision[], array[-0.95,-1.03,-1.01,-1.14,-1.44,-1.34,-0.59,-0.21,0.6,1.06,1.58,1.85,2.2,2.34,3.51,3.78,3.56,3.79,3.79,4.25,3.55,3.05,1.91,1.18,0.52,0.11,-0.95]::double precision[]),
  ('flag:UA', 0, array[31.79,32.41,33.75,34.14,35.02,35.36,37.39,38.59,40.08,39.9,38.77,38.22,36.76,34.96,34.86,34.41,33.44,31.74,30.75,29.6,28.68,28.49,28.94,29.07,29.76,29.84,29.56,29.05,28.67,27.52,26.62,25.95,24.87,23.76,22.71,22.08,22.56,22.52,23.92,23.53,24.55,26.34,28.24,28.99,30.16,30.62,31.79]::double precision[], array[52.1,52.29,52.33,51.57,51.21,50.58,50.38,49.93,49.31,48.23,47.83,47.1,46.7,46.27,45.77,46,45.97,46.33,46.58,45.29,45.3,45.6,46.26,46.52,46.35,46.53,46.93,47.51,48.12,48.47,48.22,47.99,47.74,47.99,47.88,48.42,49.09,49.48,50.43,51.58,51.89,51.83,51.57,51.6,51.42,51.82,52.1]::double precision[]),
  ('flag:AE', 0, array[51.58,51.76,51.8,52.58,53.4,54.01,54.69,55.44,56.07,56.26,56.4,55.89,55.8,55.98,55.53,55.53,55.23,55.21,55.01,52,51.62,51.58]::double precision[], array[24.24,24.29,24.02,24.18,24.15,24.12,24.8,25.44,26.06,25.71,24.93,24.92,24.27,24.13,23.93,23.53,23.11,22.71,22.5,23,24.01,24.24]::double precision[]),
  ('flag:GB', 0, array[-6.2,-6.95,-7.57,-7.37,-7.57,-6.73,-5.66,-6.2]::double precision[], array[53.87,54.07,54.06,54.6,55.13,55.17,54.56,53.87]::double precision[]),
  ('flag:GB', 1, array[-3.09,-3.09,-2.95,-3.62,-3.63,-4.84,-5.08,-4.72,-5.05,-5.59,-5.65,-6.15,-5.79,-5.01,-4.21,-3,-4.07,-3.05,-1.96,-2.22,-3.12,-2.09,-2.01,-1.11,-0.43,0.19,0.47,1.68,1.56,1.05,1.45,0.55,-0.79,-2.49,-2.96,-3.62,-4.54,-5.24,-5.78,-4.31,-3.41,-3.42,-4.98,-5.27,-4.22,-4.77,-4.58,-3.09]::double precision[], array[53.4,53.4,53.98,54.6,54.61,54.79,55.06,55.51,55.78,55.31,56.27,56.78,57.82,58.63,58.55,58.63,57.55,57.69,57.68,56.87,55.97,55.91,55.8,54.62,54.46,53.32,52.93,52.74,52.1,51.81,51.29,50.77,50.78,50.5,50.7,50.23,50.34,49.96,50.16,51.21,51.43,51.43,51.59,51.99,52.3,52.84,53.5,53.4]::double precision[]),
  ('flag:US', 0, array[-122.84,-117.03,-113,-107.05,-100.65,-95.16,-94.82,-94.33,-92.61,-90.83,-89.27,-87.44,-85.65,-84.78,-84.61,-84.14,-83.89,-83.47,-82.55,-82.14,-82.9,-83.14,-82.69,-81.28,-78.94,-79.01,-78.72,-76.82,-76.38,-74.87,-71.51,-71.08,-70.3,-69.24,-68.23,-67.79,-66.97,-69.06,-70.65,-70.83,-70.08,-69.89,-70.64,-71.86,-72.88,-72.24,-73.35,-73.95,-73.96,-74.91,-75.2,-75.32,-75.06,-75.94,-75.72,-76.35,-76.33,-76.3,-75.97,-75.73,-77.4,-78.55,-79.2,-80.87,-81.49,-80.98,-80.53,-80.09,-80.38,-81.17,-81.71,-82.71,-82.65,-83.71,-85.11,-85.77,-87.53,-89.18,-89.41,-89.22,-89.78,-90.88,-92.5,-93.85,-95.6,-97.14,-97.38,-97.14,-98.24,-99.3,-100.11,-100.96,-102.48,-103.94,-104.71,-105.63,-106.51,-108.24,-111.02,-114.81,-115.99,-117.29,-118.41,-119.08,-120.37,-120.74,-122.55,-122.95,-123.86,-124.18,-124.53,-124.02,-124.08,-124.69,-123.12,-122.34,-122.84]::double precision[], array[49,49,49,49,49,49,49.39,48.67,48.45,48.27,48.02,47.94,47.22,46.64,46.44,46.51,46.12,45.99,45.35,43.57,42.43,41.98,41.67,42.21,42.86,43.27,43.62,43.63,44.1,45,45.01,45.31,45.91,47.45,47.35,45.7,44.81,43.98,43.09,42.33,41.78,41.92,41.48,41.32,41.22,41.12,40.63,40.75,40.43,38.94,39.25,38.96,38.4,37.22,37.94,39.15,38.08,37.92,36.9,35.55,34.51,33.86,33.16,32.03,30.73,29.18,28.04,26.21,25.21,25.2,25.87,27.49,28.55,29.94,29.64,30.15,30.27,30.32,29.89,29.29,29.31,29.15,29.55,29.71,28.74,27.83,26.69,25.87,26.06,26.84,28.11,29.38,29.76,29.27,30.12,31.08,31.75,31.34,31.33,32.52,32.61,33.05,33.74,34.08,34.45,35.16,37.55,38.11,39.77,41.14,42.77,44.62,46.86,48.18,48.04,47.36,49]::double precision[]),
  ('flag:US', 1, array[-155.4,-155.22,-155.06,-154.81,-154.83,-155.22,-155.54,-155.69,-155.94,-155.91,-156.07,-156.02,-155.85,-155.92,-155.86,-155.79,-155.4]::double precision[], array[20.08,19.99,19.86,19.51,19.45,19.24,19.08,18.92,19.06,19.34,19.7,19.81,19.98,20.17,20.27,20.25,20.08]::double precision[]),
  ('flag:US', 2, array[-155.99,-156.08,-156.42,-156.59,-156.7,-156.71,-156.61,-156.26,-155.99]::double precision[], array[20.76,20.64,20.57,20.78,20.86,20.93,21.01,20.92,20.76]::double precision[]),
  ('flag:US', 3, array[-156.76,-156.79,-157.33,-157.25,-156.76]::double precision[], array[21.18,21.07,21.1,21.22,21.18]::double precision[]),
  ('flag:US', 4, array[-158.03,-157.94,-157.65,-157.71,-157.78,-158.13,-158.25,-158.29,-158.03]::double precision[], array[21.72,21.65,21.32,21.26,21.28,21.31,21.54,21.58,21.72]::double precision[]),
  ('flag:US', 5, array[-159.36,-159.35,-159.47,-159.8,-159.75,-159.59,-159.36]::double precision[], array[22.22,21.98,21.88,22.06,22.14,22.24,22.22]::double precision[]),
  ('flag:US', 6, array[-166.47,-165.68,-165.58,-166.19,-166.85,-167.45,-166.47]::double precision[], array[60.38,60.29,59.91,59.75,59.94,60.21,60.38]::double precision[]),
  ('flag:US', 7, array[-153.23,-152.56,-152.14,-153.01,-154,-154.52,-154.67,-153.76,-153.23]::double precision[], array[57.97,57.9,57.59,57.12,56.74,56.99,57.46,57.82,57.97]::double precision[]),
  ('flag:US', 8, array[-140.99,-141,-139.04,-137.45,-135.47,-134.27,-132.73,-130.01,-130.54,-131.97,-133.54,-135.04,-137.8,-140.82,-143.96,-147.11,-148.02,-149.73,-151.72,-151.41,-150.62,-152.58,-153.29,-155.31,-156.56,-158.43,-160.29,-162.24,-164.79,-163.85,-161.81,-160.07,-158.46,-157.55,-158.19,-159.06,-159.98,-161.36,-162.05,-162.52,-164.66,-165.35,-165.73,-164.56,-163.07,-161.54,-160.96,-160.78,-162.45,-163.55,-166.42,-168.11,-164.47,-163.79,-162.49,-164.43,-166.76,-164.43,-162.93,-160.93,-158.12,-155.07,-153.9,-152.27,-149.72,-145.69,-143.59,-140.99]::double precision[], array[69.71,60.31,60,58.91,59.79,58.86,57.69,55.92,54.8,55.5,57.18,58.19,58.5,59.73,60,60.89,59.98,59.71,59.16,60.73,61.28,60.06,58.86,57.73,56.98,55.99,55.64,55.02,54.4,55.04,55.9,56.42,57.22,58.33,58.62,58.42,58.57,58.67,59.27,59.99,60.27,61.07,62.08,63.15,63.06,63.46,64.22,64.79,64.56,64.56,64.69,65.67,66.58,66.08,66.73,67.62,68.36,68.91,69.86,70.45,70.82,71.15,70.89,70.6,70.53,70.12,70.15,69.71]::double precision[]),
  ('flag:US', 9, array[-171.73,-171.12,-170.49,-169.68,-168.69,-168.77,-169.53,-170.29,-170.67,-171.55,-171.79,-171.73]::double precision[], array[63.78,63.59,63.69,63.43,63.3,63.19,62.98,63.19,63.38,63.32,63.41,63.78]::double precision[]),
  ('flag:UY', 0, array[-57.62,-56.98,-55.97,-55.6,-54.57,-53.79,-53.21,-53.65,-53.37,-53.81,-54.93,-55.67,-56.22,-57.14,-57.82,-58.43,-58.35,-58.13,-58.14,-57.88,-57.62]::double precision[], array[-30.22,-30.11,-30.88,-30.85,-31.49,-32.05,-32.73,-33.2,-33.77,-34.4,-34.95,-34.75,-34.86,-34.43,-34.46,-33.91,-33.26,-33.04,-32.04,-31.02,-30.22]::double precision[]),
  ('flag:UZ', 0, array[55.97,58.5,60.24,62.01,64.9,66.02,66.71,68.26,69.07,70.96,70.42,71.87,71.78,70.6,70.67,69.01,67.7,68.18,67.83,66.52,65.22,63.52,61.88,60.46,59.97,57.79,57.09,55.97]::double precision[], array[41.31,45.59,44.78,43.5,43.73,41.99,41.17,40.66,41.38,42.27,41.52,41.39,40.15,40.22,40.96,40.09,39.58,38.9,37.15,37.36,38.4,39.36,41.08,41.22,42.22,42.17,41.32,41.31]::double precision[]),
  ('flag:VU', 0, array[167.22,167.85,167.52,167.18,167.22]::double precision[], array[-15.89,-16.47,-16.6,-16.16,-15.89]::double precision[]),
  ('flag:VU', 1, array[166.79,166.65,166.63,167.11,167.27,167,166.79]::double precision[], array[-15.67,-15.39,-14.63,-14.93,-15.74,-15.61,-15.67]::double precision[]),
  ('flag:VE', 0, array[-60.73,-60.97,-62.8,-63.89,-64.82,-64.41,-63.42,-64.08,-64.61,-65.55,-66.88,-67.45,-67.3,-67.62,-67.74,-67.34,-68.27,-69.39,-70.67,-72.2,-72.48,-72.44,-72.79,-73.03,-72.61,-71.97,-71.36,-71.62,-72.07,-71.26,-71.35,-70.16,-69.94,-68.88,-68.19,-66.23,-64.89,-64.32,-61.88,-62.39,-60.83,-60.15,-60.55,-60.3,-61.16,-61.41,-60.73]::double precision[], array[5.2,4.54,4.01,4.02,4.06,3.13,2.41,1.92,1.33,0.79,1.25,2.6,3.32,3.84,5.22,6.1,6.15,6.1,7.09,7.34,7.63,8.41,9.08,9.74,10.82,11.61,11.54,10.97,9.86,9.14,10.21,11.38,12.16,11.44,10.56,10.65,10.08,10.64,10.72,9.95,9.38,8.6,7.78,7.04,6.7,5.96,5.2]::double precision[]),
  ('flag:VN', 0, array[104.33,105.2,106.25,105.81,107.49,107.61,107.38,107.56,107.31,106.56,105.93,105.09,103.9,104.18,104.82,104.44,103.2,102.75,102.17,102.71,103.5,104.48,105.33,105.81,106.72,106.57,107.04,108.05,106.71,105.88,105.66,106.43,107.36,108.27,108.88,109.33,109.2,108.37,107.22,106.4,105.16,104.8,105.08,104.33]::double precision[], array[10.49,10.89,10.96,11.57,12.34,13.54,14.2,15.2,15.91,16.6,17.48,18.67,19.27,19.62,19.89,20.76,20.77,21.68,22.46,22.71,22.7,22.82,23.35,22.98,22.79,22.22,21.81,21.55,20.7,19.75,19.06,18,16.7,16.08,15.28,13.43,11.67,11.01,10.36,9.53,8.6,9.24,9.92,10.49]::double precision[]),
  ('flag:YE', 0, array[52,52.78,53.11,52.39,52.19,52.17,51.17,49.57,48.68,48.24,47.94,47.35,46.72,45.88,45.63,45.41,45.14,44.99,44.49,44.17,43.48,43.22,43.25,43.09,42.89,42.6,42.81,42.7,42.82,42.78,43.22,43.12,43.38,43.79,44.06,45.22,45.4,46.37,46.75,47,47.47,48.18,49.12,52]::double precision[], array[19,17.35,16.65,16.38,15.94,15.6,15.18,14.71,14,13.95,14.01,13.59,13.4,13.35,13.29,13.03,12.95,12.7,12.72,12.59,12.64,13.22,13.77,14.06,14.8,15.21,15.26,15.72,15.91,16.35,16.67,17.09,17.58,17.32,17.41,17.43,17.33,17.23,17.28,16.95,17.12,18.17,18.62,19]::double precision[]),
  ('flag:ZM', 0, array[30.74,31.56,32.76,33.49,33.11,32.99,33.22,30.27,28.95,28.47,27.05,26.38,25.08,24.68,23.21,21.89,24.02,24.08,24.02,24.26,24.78,25.75,27.16,28.15,28.94,29.62,28.64,28.5,28.45,29,30.74]::double precision[], array[-8.34,-8.76,-9.23,-10.53,-11.61,-12.78,-13.97,-15.51,-16.04,-16.47,-17.94,-17.85,-17.66,-17.35,-17.52,-16.08,-12.91,-12.19,-11.24,-10.95,-11.24,-11.78,-11.61,-12.27,-13.25,-12.18,-11.97,-10.79,-9.16,-8.41,-8.34]::double precision[]),
  ('flag:ZW', 0, array[31.19,30.66,30.32,29.84,29.43,28.79,28.02,27.73,27.73,27.3,26.16,25.85,25.65,25.26,26.38,26.71,27.05,27.6,28.47,28.83,28.95,29.52,30.27,30.34,31.17,31.64,31.85,32.33,32.85,32.85,32.65,32.61,32.77,32.66,32.51,32.24,31.19]::double precision[], array[-22.25,-22.15,-22.27,-22.1,-22.09,-21.64,-21.49,-20.85,-20.5,-20.39,-19.29,-18.71,-18.54,-17.74,-17.85,-17.96,-17.94,-17.29,-16.47,-16.39,-16.04,-15.65,-15.51,-15.88,-15.86,-16.07,-16.32,-16.39,-16.71,-17.98,-18.67,-19.42,-19.72,-20.31,-20.39,-21.12,-22.25]::double precision[]);
