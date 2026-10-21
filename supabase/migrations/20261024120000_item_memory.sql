-- ════════════════════════════════════════════════════════════════════════════
-- Fase 4 — Entrenamiento ampliado + repaso inteligente (docs/GeoSpeed_Plan_Competencia.md §3, §10)
--
-- user_item_memory: por jugador y lugar del catálogo (places.id), lo que el juego recuerda de él.
--   · Acierto = cercanía ≥ 400 (como los cuadritos del diario); acierto bueno = cercanía ≥ 800.
--   · Fallar manda el lugar a la caja 1 y lo pide al día siguiente. En repaso, un acierto bueno lo sube
--     una caja (intervalos 1 · 2 · 4 · 7 · 15 días) y uno regular lo reprograma sin subirlo; acertarlo
--     bien en la caja 5 lo deja dominado.
--   · streak = aciertos seguidos. Dominado = superó sus 5 repasos, o 3 aciertos seguidos sin haberlo
--     fallado nunca (porcentaje "dominado" por región del entrenamiento).
-- La alimenta save_game_result con cada partida v2 no sospechosa de cualquier modo con ciudades
-- (clásico, diario, retos, 60s de Caos, entrenamiento, repaso). El día es el de Colombia (game_day).
-- Lectura: my_memory() (el cliente arma el "Repaso del día" con lo que toca hoy, máximo 10).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.user_item_memory (
  user_id        uuid not null references auth.users (id) on delete cascade,
  item_id        text not null,
  box            smallint not null default 1 check (box between 1 and 5),
  next_review_on date,
  fails          integer not null default 0,
  successes      integer not null default 0,
  streak         integer not null default 0,
  mastered       boolean not null default false,
  last_seen_at   timestamptz not null default now(),
  primary key (user_id, item_id)
);
create index if not exists user_item_memory_due_idx on public.user_item_memory (user_id, next_review_on) where fails > 0 and not mastered;

alter table public.user_item_memory enable row level security;
drop policy if exists "user_item_memory_select_own" on public.user_item_memory;
create policy "user_item_memory_select_own" on public.user_item_memory
  for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.user_item_memory from anon, authenticated;

-- Días hasta el siguiente repaso según la caja
create or replace function public._memory_interval(p_box integer)
returns integer language sql immutable as $$
  select case greatest(1, least(5, p_box)) when 1 then 1 when 2 then 2 when 3 then 4 when 4 then 7 else 15 end
$$;

-- Registra las rondas de una partida en la memoria del jugador
create or replace function public._memory_record(p_user uuid, p_result uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_today date := public.game_day(now());
  v_g     record;
  v_m     public.user_item_memory;
  v_hit   boolean;
  v_good  boolean;
begin
  for v_g in
    select g.place_id, g.base_points from public.game_rounds g
     where g.result_id = p_result and g.place_id is not null
     order by g.round_no
  loop
    v_hit  := coalesce(v_g.base_points, 0) >= 400;
    v_good := coalesce(v_g.base_points, 0) >= 800;
    select * into v_m from public.user_item_memory where user_id = p_user and item_id = v_g.place_id for update;

    if not found then
      insert into public.user_item_memory (user_id, item_id, box, next_review_on, fails, successes, streak, mastered, last_seen_at)
      values (p_user, v_g.place_id, 1, case when v_hit then null else v_today + 1 end,
              case when v_hit then 0 else 1 end, case when v_hit then 1 else 0 end, case when v_hit then 1 else 0 end, false, now());
    elsif not v_hit then
      -- Fallo: vuelve a la caja 1 y se pide mañana
      update public.user_item_memory
         set box = 1, next_review_on = v_today + 1, fails = fails + 1, streak = 0, mastered = false, last_seen_at = now()
       where user_id = p_user and item_id = v_g.place_id;
    elsif v_m.fails > 0 and not v_m.mastered then
      -- En repaso
      if v_good and v_m.box >= 5 then
        update public.user_item_memory
           set mastered = true, next_review_on = null, successes = successes + 1, streak = streak + 1, last_seen_at = now()
         where user_id = p_user and item_id = v_g.place_id;
      elsif v_good then
        update public.user_item_memory
           set box = v_m.box + 1, next_review_on = v_today + public._memory_interval(v_m.box + 1),
               successes = successes + 1, streak = streak + 1, last_seen_at = now()
         where user_id = p_user and item_id = v_g.place_id;
      else
        update public.user_item_memory
           set next_review_on = v_today + public._memory_interval(v_m.box),
               successes = successes + 1, streak = streak + 1, last_seen_at = now()
         where user_id = p_user and item_id = v_g.place_id;
      end if;
    else
      update public.user_item_memory
         set successes = successes + 1, streak = streak + 1, last_seen_at = now()
       where user_id = p_user and item_id = v_g.place_id;
    end if;
  end loop;
end $$;
revoke all on function public._memory_interval(integer) from public, anon, authenticated;
revoke all on function public._memory_record(uuid, uuid) from public, anon, authenticated;

-- Lo que el juego recuerda de mí: cajas, rachas, qué toca hoy y qué domino
create or replace function public.my_memory()
returns table (
  item_id text, box smallint, next_review_on date, fails integer, successes integer, streak integer,
  mastered boolean, dominated boolean, due boolean
) language sql stable security definer set search_path = public as $$
  select m.item_id, m.box, m.next_review_on, m.fails, m.successes, m.streak, m.mastered,
         (m.mastered or (m.fails = 0 and m.streak >= 3)),
         (m.fails > 0 and not m.mastered and m.next_review_on <= public.game_day(now()))
    from public.user_item_memory m
   where m.user_id = auth.uid();
$$;
revoke all on function public.my_memory() from public, anon;
grant execute on function public.my_memory() to authenticated;

-- ── save_game_result: + memoria de lugares ──────────────────────────────────
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
   where user_id = v_user and game_type = v_type and scoring_version = v_version;

  insert into public.game_results (
    user_id, game_type, mode, difficulty, score, rounds_played, rounds_total,
    avg_distance_km, end_reason, is_record, seed, challenge_id, client_id, scoring_version, suspicious
  ) values (
    v_user, v_type, v_mode, v_diff, v_score,
    coalesce((p->>'rounds_played')::integer, 0), coalesce((p->>'rounds_total')::integer, 0),
    (p->>'avg_distance_km')::numeric, coalesce(p->>'end_reason', 'complete'),
    (v_prev is not null and v_score > v_prev),
    (p->>'seed')::integer, (p->>'challenge_id')::uuid, v_client, v_version, v_susp
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

-- ── redeem_transfer_ticket: + memoria de lugares ────────────────────────────
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

  -- XP heredado del historial local
  select coalesce(xp_legacy, 0) into v_xp from public.profiles where id = v_anon;
  update public.profiles set xp_legacy = coalesce(xp_legacy, 0) + v_xp where id = v_user;

  -- El anónimo queda vacío: cleanup_anonymous_users() lo borrará a los 30 días
  return jsonb_build_object('moved_games', v_games);
end $$;

revoke all on function public.redeem_transfer_ticket(text) from public, anon;
grant execute on function public.redeem_transfer_ticket(text) to authenticated;
