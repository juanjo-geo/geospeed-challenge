-- ════════════════════════════════════════════════════════════════════════════
-- Fase 10 — Quizzes personalizados y favoritos (docs/GeoSpeed_Plan_Competencia.md §5)
--
-- Un quiz = nombre + región + categorías + 5 a 50 lugares del catálogo + reloj sí/no, número de rondas y orden.
-- Gratis hasta 3 guardados, ilimitados con Pro; jugar un quiz compartido (link /q/<código>) siempre es gratis y suma
-- al mini ranking del quiz (sesión de invitado si hace falta). Sin reloj la rapidez no cuenta (game_type 'quiz_free',
-- rapidez ×1,0 en _score_rounds_v2); con reloj, 'quiz' con la rapidez de siempre. El servidor puntúa la partida como
-- todas (save_game_result) y, si trae quiz_code, guarda el mejor puntaje del jugador en ese quiz (_quiz_record),
-- solo si las rondas son lugares del quiz y el tipo coincide con su reloj.
-- Favoritos: hasta 20 por jugador (configuraciones del Clásico, modos y quizzes), ordenados por uso reciente.
-- Nombres: filtro de groserías en el servidor (_quiz_name_ok), el mismo de src/lib/quizzes.ts.
-- Idempotente: se aplica desde el SQL Editor (db push responde 403).
-- ════════════════════════════════════════════════════════════════════════════

alter table public.game_results drop constraint if exists game_results_game_type_check;
alter table public.game_results add constraint game_results_game_type_check
  check (game_type in ('classic','daily','timeattack','mundial','speeddemon','training','challenge','duel','sprint','quiz','quiz_free'));

create table if not exists public.custom_quizzes (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  region      text not null default 'world',
  categories  text[] not null default '{cities}',
  item_ids    text[] not null check (cardinality(item_ids) between 5 and 50),
  settings    jsonb not null default '{}'::jsonb,   -- {clock: bool, rounds: int, order: 'random' | 'fixed'}
  share_code  text not null unique,
  plays_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists custom_quizzes_owner_idx on public.custom_quizzes (owner_id);

create table if not exists public.quiz_scores (
  quiz_id    uuid not null references public.custom_quizzes (id) on delete cascade,
  player_id  uuid not null references auth.users (id) on delete cascade,
  score      integer not null,
  time_ms    integer not null default 0,
  result_id  uuid references public.game_results (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (quiz_id, player_id)
);
create index if not exists quiz_scores_rank_idx on public.quiz_scores (quiz_id, score desc, time_ms);

create table if not exists public.favorites (
  user_id      uuid not null references auth.users (id) on delete cascade,
  target_type  text not null check (target_type in ('classic', 'mode', 'quiz')),
  target_id    text not null check (char_length(target_id) between 1 and 60),
  last_used_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

-- Todo pasa por las RPC de abajo (definer): el cliente no lee ni escribe estas tablas directo
alter table public.custom_quizzes enable row level security;
alter table public.quiz_scores enable row level security;
alter table public.favorites enable row level security;
revoke all on public.custom_quizzes from anon, authenticated;
revoke all on public.quiz_scores from anon, authenticated;
revoke all on public.favorites from anon, authenticated;

-- ── Puntaje: quiz sin reloj = rapidez ×1,0 (copia de 20261030120000_colombia.sql + esa regla) ──────────
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
  v_scale   double precision := public.mode_scale_km(p_mode);
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
        if v_kind in ('flag', 'feature', 'division') then
          -- Bandera o lugar (Fase 6): 0 dentro del contorno; si no, la distancia al borde o al trazo más cercano
          -- (shape_distance_km); los lugares puntuales (picos, cabos) no tienen contorno y caen en geo_distance_km
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
    -- Quiz sin reloj (Fase 10): la rapidez no cuenta (×1,0); el tiempo se guarda igual
    v_speed := case when p_game_type = 'quiz_free' then 1000 else greatest(400, least(2200, 2200 - 13 * v_tenths)) end;
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

-- ── Nombres: filtro de groserías (palabras completas, sin tildes; la misma lista de src/lib/quizzes.ts) ─────────
create or replace function public._quiz_name_ok(p_name text)
returns boolean language sql immutable as $$
  select not ((' ' || regexp_replace(lower(translate(coalesce(p_name, ''), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')), '[^a-z0-9]+', ' ', 'g') || ' ')
    ~ ' (puta|puto|putas|putos|mierda|mierdas|verga|vergas|malparido|malparida|hijueputa|hijueputas|hijoeputa|hdp|marica|maricon|maricones|pendejo|pendeja|culero|culera|chinga|chingada|chingado|cabron|cabrona|zorra|gilipollas|polla|pene|fuck|fucking|fucker|shit|bitch|cunt|dick|pussy|nigger|nigga|faggot|whore|slut|asshole|bastard|nazi|hitler) ')
$$;

-- ── Código para compartir: 6 caracteres sin los que se confunden (0/O, 1/I/L) ─────────────────────────────
create or replace function public._quiz_code()
returns text language plpgsql volatile set search_path = public as $$
declare
  v_alpha text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code  text;
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alpha, 1 + floor(random() * length(v_alpha))::integer, 1);
    end loop;
    exit when not exists (select 1 from public.custom_quizzes where share_code = v_code);
  end loop;
  return v_code;
end $$;

-- ── Un quiz como lo ve el jugador: datos, top 10 del mini ranking y su mejor puntaje ────────────────────────
create or replace function public._quiz_json(q public.custom_quizzes, p_viewer uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', q.id, 'code', q.share_code, 'name', q.name, 'region', q.region,
    'categories', to_jsonb(q.categories), 'item_ids', to_jsonb(q.item_ids), 'settings', q.settings,
    'plays', q.plays_count, 'mine', coalesce(q.owner_id = p_viewer, false),
    'owner_name', (select nullif(display_name, '') from public.profiles where id = q.owner_id),
    'created_at', q.created_at, 'updated_at', q.updated_at,
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('rank', x.rk, 'score', x.score, 'time_ms', x.time_ms, 'name', x.name, 'avatar', x.avatar, 'me', x.me) order by x.rk)
        from (select row_number() over (order by s.score desc, s.time_ms, s.updated_at) as rk, s.score, s.time_ms,
                     nullif(pr.display_name, '') as name, pr.avatar, coalesce(s.player_id = p_viewer, false) as me
                from public.quiz_scores s
                left join public.profiles pr on pr.id = s.player_id
               where s.quiz_id = q.id
               order by s.score desc, s.time_ms, s.updated_at
               limit 10) x), '[]'::jsonb),
    'my_best', (
      select jsonb_build_object(
               'score', s.score, 'time_ms', s.time_ms,
               'rank', (select count(*) + 1 from public.quiz_scores o
                         where o.quiz_id = q.id and (o.score > s.score or (o.score = s.score and o.time_ms < s.time_ms))),
               'players', (select count(*) from public.quiz_scores o where o.quiz_id = q.id))
        from public.quiz_scores s where s.quiz_id = q.id and s.player_id = p_viewer)
  )
$$;
revoke all on function public._quiz_json(public.custom_quizzes, uuid) from public, anon, authenticated;

-- ── Abrir un quiz por su código (link compartido; sin cuenta): null si ya no existe ────────────────────────
create or replace function public.quiz_get(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  q public.custom_quizzes;
begin
  select * into q from public.custom_quizzes where share_code = upper(btrim(coalesce(p_code, '')));
  if not found then
    return null;
  end if;
  return public._quiz_json(q, auth.uid());
end $$;
revoke all on function public.quiz_get(text) from public;
grant execute on function public.quiz_get(text) to anon, authenticated;

-- ── Mis quizzes (y cuántos más puedo guardar) ──────────────────────────────────────────────────────────────
create or replace function public.my_quizzes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'quizzes', coalesce((select jsonb_agg(public._quiz_json(q, v_user) order by q.updated_at desc)
                           from public.custom_quizzes q where q.owner_id = v_user), '[]'::jsonb),
    'limit', case when public._is_pro(v_user) then null else 3 end
  );
end $$;
revoke all on function public.my_quizzes() from public, anon;
grant execute on function public.my_quizzes() to authenticated;

-- ── Crear o editar: valida nombre, región, lugares (5–50, del catálogo) y el límite gratis de 3 ─────────────
create or replace function public.quiz_save(p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_id     uuid := nullif(p->>'id', '')::uuid;
  v_name   text := btrim(regexp_replace(coalesce(p->>'name', ''), '\s+', ' ', 'g'));
  v_region text := coalesce(p->>'region', 'world');
  v_cats   text[];
  v_items  text[];
  v_clock  boolean := coalesce((p->'settings'->>'clock')::boolean, true);
  v_order  text := case when p->'settings'->>'order' = 'fixed' then 'fixed' else 'random' end;
  v_rounds integer;
  v_set    jsonb;
  old      public.custom_quizzes;
  q        public.custom_quizzes;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'quiz_name' using errcode = '22023';
  end if;
  if not public._quiz_name_ok(v_name) then
    raise exception 'quiz_name_rude' using errcode = '22023';
  end if;
  if v_region not in ('world', 'europe', 'asia', 'americas', 'africa', 'colombia') then
    raise exception 'quiz_region' using errcode = '22023';
  end if;
  select coalesce(array_agg(distinct c), '{}') into v_cats
    from jsonb_array_elements_text(coalesce(p->'categories', '[]'::jsonb)) c
   where c in ('cities', 'flags', 'features', 'monuments', 'divisions');
  if cardinality(v_cats) = 0 then
    v_cats := '{cities}';
  end if;
  -- Lugares sin repetir, en el orden en que se eligieron (el orden fijo se respeta al jugar)
  select coalesce(array_agg(s.i order by s.ord), '{}') into v_items
    from (select t.i, min(t.ord) as ord
            from jsonb_array_elements_text(coalesce(p->'item_ids', '[]'::jsonb)) with ordinality as t(i, ord)
           group by t.i) s;
  if cardinality(v_items) < 5 or cardinality(v_items) > 50 then
    raise exception 'quiz_items' using errcode = '22023';
  end if;
  if (select count(*) from public.places where id = any(v_items)) <> cardinality(v_items) then
    raise exception 'quiz_unknown_item' using errcode = '22023';
  end if;
  v_rounds := greatest(5, least(cardinality(v_items), coalesce((p->'settings'->>'rounds')::integer, cardinality(v_items))));
  v_set := jsonb_build_object('clock', v_clock, 'rounds', v_rounds, 'order', v_order);

  if v_id is null then
    if not public._is_pro(v_user) and (select count(*) from public.custom_quizzes where owner_id = v_user) >= 3 then
      raise exception 'quiz_limit' using errcode = 'P0001';
    end if;
    insert into public.custom_quizzes (owner_id, name, region, categories, item_ids, settings, share_code)
    values (v_user, v_name, v_region, v_cats, v_items, v_set, public._quiz_code())
    returning * into q;
  else
    select * into old from public.custom_quizzes where id = v_id and owner_id = v_user;
    if not found then
      raise exception 'quiz_not_found' using errcode = 'P0002';
    end if;
    update public.custom_quizzes
       set name = v_name, region = v_region, categories = v_cats, item_ids = v_items, settings = v_set, updated_at = now()
     where id = v_id
     returning * into q;
    -- Otros lugares, otro reloj u otro número de rondas: el mini ranking ya no es comparable y vuelve a empezar
    if old.item_ids is distinct from v_items or old.settings->'clock' is distinct from v_set->'clock'
       or old.settings->'rounds' is distinct from v_set->'rounds' then
      delete from public.quiz_scores where quiz_id = v_id;
    end if;
  end if;
  return public._quiz_json(q, v_user);
end $$;
revoke all on function public.quiz_save(jsonb) from public, anon;
grant execute on function public.quiz_save(jsonb) to authenticated;

create or replace function public.quiz_delete(p_id uuid)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  delete from public.custom_quizzes where id = p_id and owner_id = v_user;
  return found;
end $$;
revoke all on function public.quiz_delete(uuid) from public, anon;
grant execute on function public.quiz_delete(uuid) to authenticated;

-- ── Mejor puntaje de un jugador en un quiz (lo llama save_game_result) ─────────────────────────────────────
create or replace function public._quiz_record(p_user uuid, p_result uuid, p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare
  q       public.custom_quizzes;
  r       public.game_results;
  v_clock boolean;
  v_time  integer;
begin
  select * into q from public.custom_quizzes where share_code = upper(btrim(coalesce(p_code, '')));
  if not found then
    return;
  end if;
  select * into r from public.game_results where id = p_result and user_id = p_user;
  if not found or r.suspicious or r.scoring_version <> 2 then
    return;
  end if;
  v_clock := coalesce((q.settings->>'clock')::boolean, true);
  if r.game_type <> (case when v_clock then 'quiz' else 'quiz_free' end) then
    return;
  end if;
  -- Solo lugares del quiz, no más rondas de las que tiene, y con reloj ninguna respuesta pasada de tiempo
  if not exists (select 1 from public.game_rounds g where g.result_id = r.id)
     or exists (select 1 from public.game_rounds g where g.result_id = r.id and (g.place_id is null or not (g.place_id = any(q.item_ids))))
     or (select count(*) from public.game_rounds g where g.result_id = r.id) > coalesce((q.settings->>'rounds')::integer, 50)
     or (v_clock and exists (select 1 from public.game_rounds g where g.result_id = r.id and g.time_s > 15.5)) then
    return;
  end if;
  select coalesce(round(sum(g.time_s) * 1000), 0)::integer into v_time from public.game_rounds g where g.result_id = r.id;
  update public.custom_quizzes set plays_count = plays_count + 1 where id = q.id;
  insert into public.quiz_scores (quiz_id, player_id, score, time_ms, result_id)
  values (q.id, p_user, r.score, v_time, r.id)
  on conflict (quiz_id, player_id) do update
    set score = excluded.score, time_ms = excluded.time_ms, result_id = excluded.result_id, updated_at = now()
    where excluded.score > public.quiz_scores.score
       or (excluded.score = public.quiz_scores.score and excluded.time_ms < public.quiz_scores.time_ms);
end $$;
revoke all on function public._quiz_record(uuid, uuid, text) from public, anon, authenticated;

-- ── Favoritos: hasta 20, por uso reciente ──────────────────────────────────────────────────────────────────
create or replace function public.my_favorites()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('type', f.target_type, 'id', f.target_id, 'used', f.last_used_at) order by f.last_used_at desc), '[]'::jsonb)
    from (select * from public.favorites where user_id = auth.uid() order by last_used_at desc limit 20) f
$$;
revoke all on function public.my_favorites() from public, anon;
grant execute on function public.my_favorites() to authenticated;

create or replace function public.favorite_toggle(p_type text, p_id text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  delete from public.favorites where user_id = v_user and target_type = p_type and target_id = p_id;
  if found then
    return false;
  end if;
  if (select count(*) from public.favorites where user_id = v_user) >= 20 then
    raise exception 'fav_limit' using errcode = 'P0001';
  end if;
  insert into public.favorites (user_id, target_type, target_id) values (v_user, p_type, p_id);
  return true;
end $$;
revoke all on function public.favorite_toggle(text, text) from public, anon;
grant execute on function public.favorite_toggle(text, text) to authenticated;

create or replace function public.favorite_touch(p_type text, p_id text)
returns void language sql volatile security definer set search_path = public as $$
  update public.favorites set last_used_at = now()
   where user_id = auth.uid() and target_type = p_type and target_id = p_id
$$;
revoke all on function public.favorite_touch(text, text) from public, anon;
grant execute on function public.favorite_touch(text, text) to authenticated;

-- ── save_game_result: + mini ranking del quiz (copia de 20261030120000_colombia.sql + ese bloque) ─────────
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
  v_cat     text := case when coalesce(p->>'category','') in ('flags','features','monuments','divisions') then p->>'category' else 'cities' end;
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

  -- Quiz personalizado (Fase 10): mejor puntaje del jugador en el mini ranking del quiz
  if v_type in ('quiz', 'quiz_free') and nullif(p->>'quiz_code', '') is not null then
    begin
      perform public._quiz_record(v_user, v_id, p->>'quiz_code');
    exception when others then
      raise warning 'quiz record failed: %', sqlerrm;
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

-- ── Invitado → cuenta existente: también quizzes, puntajes y favoritos (copia de 20261024120000_item_memory.sql) ──
create or replace function public.redeem_transfer_ticket(p_ticket text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user  uuid := auth.uid();
  v_anon  uuid;
  v_games integer := 0;
  v_xp    integer := 0;
  a       public.daily_streaks;
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
  delete from public.challenge_participants x
   where x.user_id = v_anon
     and exists (select 1 from public.challenge_participants y where y.challenge_id = x.challenge_id and y.user_id = v_user);
  update public.challenge_participants set user_id = v_user where user_id = v_anon;
  update public.challenges set creator_id = v_user where creator_id = v_anon;

  -- Compras (Pro y vidas sin recoger)
  update public.purchases set user_id = v_user where user_id = v_anon;

  -- Diario, protectores usados e insignias (si la cuenta ya tenía ese día o esa insignia, se conserva la suya)
  insert into public.daily_results (user_id, day, daily_no, result_id, score, hits, total, time_ms, grid, created_at)
    select v_user, day, daily_no, result_id, score, hits, total, time_ms, grid, created_at from public.daily_results where user_id = v_anon
  on conflict (user_id, day) do nothing;
  insert into public.daily_freeze_uses (user_id, day) select v_user, day from public.daily_freeze_uses where user_id = v_anon
  on conflict do nothing;
  insert into public.user_badges (user_id, badge_id, earned_at, seen)
    select v_user, badge_id, earned_at, seen from public.user_badges where user_id = v_anon
  on conflict (user_id, badge_id) do nothing;
  -- Racha: la más reciente (o la más larga si terminan el mismo día); récord y protectores, el mayor
  select * into a from public.daily_streaks where user_id = v_anon;
  if found then
    insert into public.daily_streaks (user_id, current_streak, best_streak, last_day, freezes, freeze_slots_bonus, freeze_refill_on)
    values (v_user, a.current_streak, a.best_streak, a.last_day, a.freezes, a.freeze_slots_bonus, a.freeze_refill_on)
    on conflict (user_id) do update set
      current_streak = case
        when excluded.last_day is null then public.daily_streaks.current_streak
        when public.daily_streaks.last_day is null or excluded.last_day > public.daily_streaks.last_day then excluded.current_streak
        when excluded.last_day = public.daily_streaks.last_day then greatest(public.daily_streaks.current_streak, excluded.current_streak)
        else public.daily_streaks.current_streak end,
      last_day = greatest(public.daily_streaks.last_day, excluded.last_day),
      best_streak = greatest(public.daily_streaks.best_streak, excluded.best_streak),
      freezes = greatest(public.daily_streaks.freezes, excluded.freezes),
      freeze_slots_bonus = greatest(public.daily_streaks.freeze_slots_bonus, excluded.freeze_slots_bonus);
    delete from public.daily_streaks where user_id = v_anon;
  end if;

  -- Memoria de lugares (Fase 4): se suman aciertos y fallos; la caja y la racha son las del registro más reciente
  insert into public.user_item_memory (user_id, item_id, box, next_review_on, fails, successes, streak, mastered, last_seen_at)
    select v_user, item_id, box, next_review_on, fails, successes, streak, mastered, last_seen_at
      from public.user_item_memory where user_id = v_anon
  on conflict (user_id, item_id) do update set
    fails = public.user_item_memory.fails + excluded.fails,
    successes = public.user_item_memory.successes + excluded.successes,
    box = case when excluded.last_seen_at > public.user_item_memory.last_seen_at then excluded.box else public.user_item_memory.box end,
    next_review_on = case when excluded.last_seen_at > public.user_item_memory.last_seen_at then excluded.next_review_on else public.user_item_memory.next_review_on end,
    streak = case when excluded.last_seen_at > public.user_item_memory.last_seen_at then excluded.streak else public.user_item_memory.streak end,
    mastered = case when excluded.last_seen_at > public.user_item_memory.last_seen_at then excluded.mastered else public.user_item_memory.mastered end,
    last_seen_at = greatest(public.user_item_memory.last_seen_at, excluded.last_seen_at);
  delete from public.user_item_memory where user_id = v_anon;

  -- Quizzes (Fase 10): los propios pasan a la cuenta; el mejor puntaje en cada quiz, el mayor; favoritos sin repetir
  update public.custom_quizzes set owner_id = v_user where owner_id = v_anon;
  insert into public.quiz_scores (quiz_id, player_id, score, time_ms, result_id, updated_at)
    select quiz_id, v_user, score, time_ms, result_id, updated_at from public.quiz_scores where player_id = v_anon
  on conflict (quiz_id, player_id) do update set
    score = excluded.score, time_ms = excluded.time_ms, result_id = excluded.result_id, updated_at = excluded.updated_at
    where excluded.score > public.quiz_scores.score
       or (excluded.score = public.quiz_scores.score and excluded.time_ms < public.quiz_scores.time_ms);
  delete from public.quiz_scores where player_id = v_anon;
  insert into public.favorites (user_id, target_type, target_id, last_used_at)
    select v_user, target_type, target_id, last_used_at from public.favorites where user_id = v_anon
  on conflict (user_id, target_type, target_id) do update set last_used_at = greatest(public.favorites.last_used_at, excluded.last_used_at);
  delete from public.favorites where user_id = v_anon;

  -- XP heredado del historial local
  select coalesce(xp_legacy, 0) into v_xp from public.profiles where id = v_anon;
  update public.profiles set xp_legacy = coalesce(xp_legacy, 0) + v_xp where id = v_user;

  -- El anónimo queda vacío: cleanup_anonymous_users() lo borrará a los 30 días
  return jsonb_build_object('moved_games', v_games);
end $$;

revoke all on function public.redeem_transfer_ticket(text) from public, anon;
grant execute on function public.redeem_transfer_ticket(text) to authenticated;
