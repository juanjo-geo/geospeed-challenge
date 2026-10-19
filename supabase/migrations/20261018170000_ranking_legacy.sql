-- ════════════════════════════════════════════════════════════════════════════
-- Ranking: incluir los puntajes históricos de la tabla vieja `leaderboard`
--
-- Desde F5 el ranking lee solo `game_results` (sistema nuevo, activo en producción desde el
-- 2026-10-18). Los puntajes anteriores (mayo–julio 2026, guardados por submit-score con
-- iniciales y, si había sesión, user_id) dejaron de verse: JuanJo vio el ranking "vacío".
--
-- Ahora leaderboard_top / my_rank suman esos puntajes:
--   · solo los ANTERIORES al 2026-10-18 (submit-score sigue escribiendo en la tabla vieja;
--     lo nuevo ya está en game_results y contarlo dos veces duplicaría jugadores);
--   · solo en el ranking de ciudades (p_game_type null y modo distinto de 'mundial');
--   · con user_id → se unen al jugador (cuenta su mejor puntaje entre las dos tablas y se
--     muestra su nombre de perfil); sin user_id → aparecen con sus iniciales.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.leaderboard_top(
  p_mode text default 'world',
  p_difficulty text default null,
  p_period text default 'all',
  p_limit integer default 10,
  p_game_type text default null
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
  with scores as (
    select r.user_id::text as k, r.user_id, null::text as initials, r.score, r.created_at
    from public.game_results r
    where r.mode = p_mode
      and (p_difficulty is null or r.difficulty = p_difficulty)
      and r.created_at >= public._period_start(p_period)
      and case
            when p_game_type is not null then r.game_type = p_game_type
            when p_mode = 'mundial' then r.game_type = 'mundial'
            else r.game_type = any (public._rank_game_types())
          end
      and r.challenge_id is null
    union all
    select coalesce(l.user_id::text, 'legacy:' || upper(l.initials)), l.user_id, upper(l.initials), l.score, l.created_at
    from public.leaderboard l
    where p_game_type is null
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
    b.created_at as achieved_at
  from best b
  left join public.profiles pr on pr.id = b.user_id
  order by b.score desc, b.created_at asc
  limit greatest(1, least(coalesce(p_limit, 10), 100));
$$;

grant execute on function public.leaderboard_top(text, text, text, integer, text) to anon, authenticated;

create or replace function public.my_rank(
  p_mode text default 'world',
  p_difficulty text default null,
  p_period text default 'all',
  p_game_type text default null
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
      and (p_difficulty is null or r.difficulty = p_difficulty)
      and r.created_at >= public._period_start(p_period)
      and case
            when p_game_type is not null then r.game_type = p_game_type
            when p_mode = 'mundial' then r.game_type = 'mundial'
            else r.game_type = any (public._rank_game_types())
          end
      and r.challenge_id is null
    union all
    select coalesce(l.user_id::text, 'legacy:' || upper(l.initials)), l.score
    from public.leaderboard l
    where p_game_type is null
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

grant execute on function public.my_rank(text, text, text, text) to authenticated;
