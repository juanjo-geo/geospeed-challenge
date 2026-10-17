-- ════════════════════════════════════════════════════════════════════════════
-- F5 · Ranking: incluir 60s de Caos como tabla propia (B2) y posición propia por tipo
--
-- leaderboard_top / my_rank reciben p_game_type:
--   null         → ranking de ciudades (classic, daily, challenge) o Mundial si p_mode = 'mundial'
--   'timeattack' → 60s de Caos (otra escala de puntos: nunca se mezcla con el de ciudades)
-- ════════════════════════════════════════════════════════════════════════════

drop function if exists public.leaderboard_top(text, text, text, integer);
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
  with best as (
    select distinct on (r.user_id)
      r.user_id, r.score, r.created_at
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

grant execute on function public.leaderboard_top(text, text, text, integer, text) to anon, authenticated;

drop function if exists public.my_rank(text, text, text);
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
  with best as (
    select r.user_id, max(r.score) as score
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
    group by r.user_id
  ),
  mine as (select score from best where user_id = auth.uid())
  select
    case when (select score from mine) is null then null
         else 1 + (select count(*) from best b where b.score > (select score from mine)) end as rank,
    (select score from mine) as best_score,
    (select count(*) from best) as total_players;
$$;

grant execute on function public.my_rank(text, text, text, text) to authenticated;
