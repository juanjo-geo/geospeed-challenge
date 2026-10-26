-- ════════════════════════════════════════════════════════════════════════════
-- Fase 9 — Progresión ampliada (docs/GeoSpeed_Plan_Competencia.md, paridad P7)
--
-- Decisiones de JuanJo (2026-10-24):
--  · Medalla por mapa = región × dificultad × categoría, con la mejor partida de 13 en Clásico, Diario o Retos
--    (puntaje v2, no sospechosa): bronce = terminar las 13 sin que se acabe el tiempo, plata = 9 o más aciertos buenos,
--    oro = 12 o más (bueno = cercanía ≥ 800, el mismo acierto que sube el combo). No depende de la velocidad.
--  · Logros de largo plazo con tres niveles; los altos desbloquean títulos y marcos (solo cosméticos, sin vidas ni Pro).
--
-- Todo se calcula con lo que el servidor ya guarda (game_results + game_rounds, que lleva la cercanía en base_points,
-- user_item_memory, challenges, sprint_players, daily_streaks): no cambia save_game_result. my_progression() devuelve
-- medallas, cifras e insignias y, de paso, entrega en user_badges los niveles de logro alcanzados (ach_<id>_<1|2|3>).
-- set_active_cosmetics acepta los títulos y marcos nuevos solo si se ganó la insignia que los da.
-- Idempotente: se aplica desde el SQL Editor (db push responde 403).
-- ════════════════════════════════════════════════════════════════════════════

create index if not exists game_results_user_type_idx on public.game_results (user_id, game_type);

-- ── Logros: umbrales de cada nivel (los mismos de src/lib/progression.ts) ─────────────────────────────────
create or replace function public._achievement_defs()
returns table (id text, t1 numeric, t2 numeric, t3 numeric)
language sql immutable as $$
  values
    ('games', 10, 100, 1000),        -- partidas jugadas (cualquier modo)
    ('perfects', 10, 100, 1000),     -- rondas con cercanía máxima
    ('fast', 25, 250, 1000),         -- aciertos buenos en menos de 2 s
    ('combo', 6, 8, 13),             -- combo más alto (¡Turbo! · ¡EN LLAMAS! · partida perfecta)
    ('golds', 5, 25, 100),           -- medallas de oro
    ('regions', 3, 5, 10),           -- regiones con al menos un bronce
    ('categories', 2, 3, 5),         -- categorías con al menos una plata
    ('dominated', 25, 100, 500),     -- lugares dominados (Tu memoria)
    ('flags', 25, 100, 166),         -- banderas dominadas
    ('challenges', 5, 25, 100),      -- retos ganados
    ('sprint', 1300, 1500, 1700),    -- mejores Puntos Sprint (País · Continente · Mundo)
    ('mundial', 25, 100, 500)        -- países exactos en el Desafío Mundial
$$;
revoke all on function public._achievement_defs() from public, anon, authenticated;

-- ── Insignia que da cada título y marco ──────────────────────────────────────────────────────────────────
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
      end
    when 'frame' then case p_id
      when 'bronze' then 'streak_7' when 'silver' then 'streak_100' when 'gold' then 'streak_365'
      when 'medal' then 'ach_golds_2' when 'flame' then 'ach_combo_3' when 'globe' then 'ach_regions_3'
      when 'sniper' then 'ach_perfects_3' when 'sprint' then 'ach_sprint_2'
      end
  end
$$;
revoke all on function public._cosmetic_badge(text, text) from public, anon, authenticated;

create or replace function public.set_active_cosmetics(p_title text, p_frame text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_title is not null and not exists (
    select 1 from public.user_badges where user_id = v_user and badge_id = public._cosmetic_badge('title', p_title)) then
    raise exception 'title not earned' using errcode = '22023';
  end if;
  if p_frame is not null and not exists (
    select 1 from public.user_badges where user_id = v_user and badge_id = public._cosmetic_badge('frame', p_frame)) then
    raise exception 'frame not earned' using errcode = '22023';
  end if;
  perform set_config('geospeed.cosmetics_ok', 'on', true);
  update public.profiles set active_title = p_title, active_frame = p_frame where id = v_user;
  perform set_config('geospeed.cosmetics_ok', 'off', true);
end $$;
revoke all on function public.set_active_cosmetics(text, text) from public, anon;
grant execute on function public.set_active_cosmetics(text, text) to authenticated;

-- ── my_progression(): medallas por mapa, cifras de los logros e insignias ganadas ──────────────────────────
create or replace function public.my_progression()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_medals jsonb;
  v_stats  jsonb;
  v_badges jsonb;
  v_golds  integer; v_regions integer; v_cats integer;
  v_perf   integer; v_fast integer; v_combo integer;
  v_dom    integer; v_flags integer;
  v_won    integer; v_sprint integer; v_mundial integer; v_games integer; v_daily integer;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Medallas: la mejor partida de 13 de cada región × dificultad × categoría
  with res as (
    select r.mode, r.difficulty, r.category, r.end_reason, r.rounds_played,
           count(g.round_no) filter (where g.base_points >= 800) as hits
      from public.game_results r
      join public.game_rounds g on g.result_id = r.id
     where r.user_id = v_user and r.scoring_version = 2 and not r.suspicious
       and r.game_type in ('classic', 'daily', 'challenge') and r.rounds_total = 13
     group by r.id
  ), per as (
    select mode, difficulty, category,
           max(case when end_reason = 'complete' and rounds_played >= 13
                    then case when hits >= 12 then 3 when hits >= 9 then 2 else 1 end
                    else 0 end) as medal,
           max(hits) as best_hits
      from res
     group by mode, difficulty, category
  )
  select coalesce(jsonb_agg(jsonb_build_object('mode', mode, 'difficulty', difficulty, 'category', category,
                                               'medal', medal, 'hits', best_hits)), '[]'::jsonb),
         count(*) filter (where medal = 3),
         count(distinct mode) filter (where medal >= 1),
         count(distinct category) filter (where medal >= 2)
    into v_medals, v_golds, v_regions, v_cats
    from per;

  -- Rondas: perfectas, aciertos relámpago y combo más alto (sin entrenamiento ni Mundial, que puntúa por zonas)
  select count(*) filter (where g.base_points >= 1000),
         count(*) filter (where g.base_points >= 800 and g.time_s < 2),
         coalesce(max(g.combo), 0)
    into v_perf, v_fast, v_combo
    from public.game_results r
    join public.game_rounds g on g.result_id = r.id
   where r.user_id = v_user and r.scoring_version = 2 and not r.suspicious
     and r.game_type not in ('mundial', 'training');

  select count(*) filter (where g.extra->>'band' = 'exact')
    into v_mundial
    from public.game_results r
    join public.game_rounds g on g.result_id = r.id
   where r.user_id = v_user and r.game_type = 'mundial';

  select count(*) into v_games from public.game_results where user_id = v_user;

  select count(*) filter (where mastered or (fails = 0 and streak >= 3)),
         count(*) filter (where item_id like 'flag:%' and (mastered or (fails = 0 and streak >= 3)))
    into v_dom, v_flags
    from public.user_item_memory where user_id = v_user;

  -- Retos ganados: terminados y con más puntos que el rival
  select count(*) into v_won
    from public.challenge_participants me
    join public.challenges c on c.id = me.challenge_id and c.status = 'completed'
    join public.game_results mr on mr.id = me.result_id
   where me.user_id = v_user
     and mr.score > coalesce((select max(orr.score)
                                from public.challenge_participants o
                                join public.game_results orr on orr.id = o.result_id
                               where o.challenge_id = c.id and o.user_id <> v_user), 2147483647);

  select coalesce(max(peak_points), 0) into v_sprint from public.sprint_players where user_id = v_user;
  select coalesce(max(best_streak), 0) into v_daily from public.daily_streaks where user_id = v_user;

  v_stats := jsonb_build_object(
    'games', v_games, 'perfects', v_perf, 'fast', v_fast, 'combo', v_combo,
    'golds', v_golds, 'regions', v_regions, 'categories', v_cats,
    'dominated', v_dom, 'flags', v_flags, 'challenges', v_won,
    -- Sin carreras jugadas los 1.000 PS de partida no cuentan
    'sprint', case when exists (select 1 from public.sprint_players where user_id = v_user and games > 0) then v_sprint else 0 end,
    'mundial', v_mundial, 'daily', v_daily
  );

  -- Niveles de logro alcanzados → insignias (una sola vez; earned_at = cuando se vio por primera vez)
  insert into public.user_badges (user_id, badge_id)
  select v_user, 'ach_' || d.id || '_' || t.n
    from public._achievement_defs() d
   cross join lateral (values (1, d.t1), (2, d.t2), (3, d.t3)) as t(n, thr)
   where coalesce((v_stats->>d.id)::numeric, 0) >= t.thr
  on conflict (user_id, badge_id) do nothing;

  select coalesce(jsonb_agg(jsonb_build_object('id', badge_id, 'at', earned_at, 'seen', seen) order by earned_at), '[]'::jsonb)
    into v_badges
    from public.user_badges where user_id = v_user;

  return jsonb_build_object('medals', v_medals, 'stats', v_stats, 'badges', v_badges);
end $$;
revoke all on function public.my_progression() from public, anon;
grant execute on function public.my_progression() to authenticated;
