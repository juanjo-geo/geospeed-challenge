-- ════════════════════════════════════════════════════════════════════════════
-- Fase 11 — Juego sin conexión (docs/GeoSpeed_Plan_Competencia.md §6)
--
-- Las partidas jugadas sin señal llegan después (cola del teléfono, idempotente por client_id) con offline = true:
-- cuentan para el progreso (memoria de lugares, medallas, logros, historial) pero no para los rankings (Temporada 1,
-- mini ranking de los quizzes) ni para el récord personal del servidor. Copias de las versiones vigentes de
-- leaderboard_top / my_rank (20261027120000_flags.sql), save_game_result y _quiz_record (20261103120000_quizzes.sql)
-- con ese filtro. Idempotente: se aplica desde el SQL Editor (db push responde 403).
-- ════════════════════════════════════════════════════════════════════════════

alter table public.game_results add column if not exists offline boolean not null default false;

-- ── Ranking (copia de 20261027120000_flags.sql + "not r.offline") ──────────────────────────────────────
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
               else r.scoring_version = 2 and not r.suspicious and not r.offline end
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
               else r.scoring_version = 2 and not r.suspicious and not r.offline end
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

-- ── save_game_result: guarda offline (copia de 20261103120000_quizzes.sql) ────────────────────────────────
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
   where user_id = v_user and game_type = v_type and scoring_version = v_version and category = v_cat and not offline;

  insert into public.game_results (
    user_id, game_type, mode, difficulty, score, rounds_played, rounds_total,
    avg_distance_km, end_reason, is_record, seed, challenge_id, client_id, scoring_version, suspicious, category, offline
  ) values (
    v_user, v_type, v_mode, v_diff, v_score,
    coalesce((p->>'rounds_played')::integer, 0), coalesce((p->>'rounds_total')::integer, 0),
    (p->>'avg_distance_km')::numeric, coalesce(p->>'end_reason', 'complete'),
    (v_prev is not null and v_score > v_prev),
    (p->>'seed')::integer, (p->>'challenge_id')::uuid, v_client, v_version, v_susp, v_cat,
    coalesce((p->>'offline')::boolean, false)
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

-- ── Mini ranking de los quizzes: sin partidas sin conexión ──────────────────────────────────────────────
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
  if not found or r.suspicious or r.offline or r.scoring_version <> 2 then
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
