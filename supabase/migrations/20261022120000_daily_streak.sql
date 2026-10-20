-- ════════════════════════════════════════════════════════════════════════════
-- Fase 2 — Desafío diario con racha, protectores y premios por hito
-- (docs/GeoSpeed_Plan_Competencia.md §2; decisiones de JuanJo 2026-10-20)
--
--   · Día de juego = medianoche de Colombia para todos (game_day). El diario se numera desde el
--     12-05-2026 (#1), así que el 21-10-2026 es el #163.
--   · daily_results: un resultado por jugador y día (el primero que termina). La racha suma 1 por día
--     con el diario terminado (no hace falta ganar). Lo registra save_game_result con el puntaje v2 ya
--     calculado por el servidor; solo cuenta el diario de hoy (o el de ayer si terminó en los primeros
--     30 minutos del día nuevo).
--   · Protectores: 1 gratis por semana (máximo 1 guardado; con Pro, hasta 3; +1 espacio permanente a los
--     100 días). Se gastan solos al faltar un día; sin protector la racha vuelve a 0 (el récord queda).
--   · Hitos (permanentes aunque se pierda la racha): 3 días Encendido (+1 protector) · 7 Semana Perfecta
--     (marco bronce, +3 Sprints ese día cuando exista Sprint) · 30 Mes de Fuego (7 días de Pro) · 100
--     Centurión (marco plata, título Viajero, +1 espacio de protector) · 365 Vuelta al Mundo (marco oro,
--     título Leyenda, 1 mes de Pro). Nunca Pro permanente.
--   · Título y marco activos en profiles, solo si se ganaron (set_active_cosmetics); salen en el ranking.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Día de juego y número del diario ────────────────────────────────────────
create or replace function public.game_day(p_at timestamptz default now())
returns date language sql stable as $$
  select (p_at at time zone 'America/Bogota')::date;
$$;

create or replace function public.daily_number(p_day date)
returns integer language sql immutable as $$
  select (p_day - date '2026-05-12') + 1;
$$;

create or replace function public.daily_day(p_no integer)
returns date language sql immutable as $$
  select date '2026-05-12' + (p_no - 1);
$$;

-- ── Tablas ──────────────────────────────────────────────────────────────────
create table if not exists public.daily_results (
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        date not null,
  daily_no   integer not null,
  result_id  uuid references public.game_results (id) on delete set null,
  score      integer not null default 0,
  hits       integer not null default 0,
  total      integer not null default 0,
  time_ms    integer not null default 0,
  grid       text not null default '',   -- por ronda: G acierto rápido (< 3 s) · Y acierto lento · R fallo · X sin jugar
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.daily_streaks (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  current_streak     integer not null default 0,
  best_streak        integer not null default 0,
  last_day           date,
  freezes            integer not null default 1,
  freeze_slots_bonus integer not null default 0,
  freeze_refill_on   date,
  lost_streak        integer not null default 0,   -- racha que se acaba de perder (pantalla de racha perdida)
  lost_on            date,
  updated_at         timestamptz not null default now()
);

create table if not exists public.daily_freeze_uses (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  primary key (user_id, day)
);

create table if not exists public.user_badges (
  user_id   uuid not null references auth.users (id) on delete cascade,
  badge_id  text not null,
  earned_at timestamptz not null default now(),
  seen      boolean not null default false,
  primary key (user_id, badge_id)
);

alter table public.daily_results enable row level security;
alter table public.daily_streaks enable row level security;
alter table public.daily_freeze_uses enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "daily_results_select_own" on public.daily_results;
create policy "daily_results_select_own" on public.daily_results for select to authenticated using (user_id = auth.uid());
drop policy if exists "daily_streaks_select_own" on public.daily_streaks;
create policy "daily_streaks_select_own" on public.daily_streaks for select to authenticated using (user_id = auth.uid());
drop policy if exists "daily_freeze_uses_select_own" on public.daily_freeze_uses;
create policy "daily_freeze_uses_select_own" on public.daily_freeze_uses for select to authenticated using (user_id = auth.uid());
drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own" on public.user_badges for select to authenticated using (user_id = auth.uid());

-- Solo las funciones del servidor escriben
revoke insert, update, delete on public.daily_results, public.daily_streaks, public.daily_freeze_uses, public.user_badges from anon, authenticated;
grant select on public.daily_results, public.daily_streaks, public.daily_freeze_uses, public.user_badges to authenticated;

-- ── Título y marco activos (solo los ganados) ───────────────────────────────
alter table public.profiles add column if not exists active_title text;
alter table public.profiles add column if not exists active_frame text;

create or replace function public._profiles_protect_cosmetics()
returns trigger language plpgsql as $$
begin
  if (new.active_title is distinct from old.active_title or new.active_frame is distinct from old.active_frame)
     and coalesce(current_setting('geospeed.cosmetics_ok', true), '') <> 'on' then
    new.active_title := old.active_title;
    new.active_frame := old.active_frame;
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_protect_cosmetics on public.profiles;
create trigger trg_profiles_protect_cosmetics before update on public.profiles
  for each row execute function public._profiles_protect_cosmetics();

-- ── ¿Pro? (misma regla que my_entitlements, para un usuario dado) ────────────
create or replace function public._is_pro(p_user uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_exp timestamptz := null;
  r     record;
begin
  if exists (select 1 from public.purchases where user_id = p_user and pro_kind = 'lifetime' and revoked_at is null) then
    return true;
  end if;
  for r in
    select created_at, pro_days from public.purchases
     where user_id = p_user and pro_kind = 'subscription' and revoked_at is null
     order by created_at
  loop
    v_exp := greatest(v_exp, r.created_at) + make_interval(days => r.pro_days);
  end loop;
  return v_exp is not null and v_exp > now();
end $$;

-- ── Racha ───────────────────────────────────────────────────────────────────
-- Recarga semanal de protectores y días perdidos (cada día sin diario gasta un protector; si no alcanzan,
-- la racha se pierde). p_today se puede fijar para las pruebas.
create or replace function public._streak_touch(p_user uuid, p_today date default null)
returns public.daily_streaks language plpgsql security definer set search_path = public as $$
declare
  v_today date := coalesce(p_today, public.game_day(now()));
  v       public.daily_streaks;
  v_cap   integer;
  v_gap   integer;
begin
  insert into public.daily_streaks (user_id, freeze_refill_on) values (p_user, v_today + 7)
  on conflict (user_id) do nothing;
  select * into v from public.daily_streaks where user_id = p_user for update;
  v_cap := (case when public._is_pro(p_user) then 3 else 1 end) + v.freeze_slots_bonus;

  if v.freeze_refill_on is null then
    v.freeze_refill_on := v_today + 7;
  elsif v_today >= v.freeze_refill_on then
    if v.freezes < v_cap then v.freezes := v.freezes + 1; end if;
    v.freeze_refill_on := v_today + 7;
  end if;

  if v.last_day is not null and v.current_streak > 0 then
    v_gap := (v_today - 1) - v.last_day;   -- días que faltaron hasta ayer (hoy todavía se puede jugar)
    if v_gap > 0 then
      if v.freezes >= v_gap then
        for i in 1..v_gap loop
          insert into public.daily_freeze_uses (user_id, day) values (p_user, v.last_day + i) on conflict do nothing;
        end loop;
        v.freezes := v.freezes - v_gap;
        v.last_day := v_today - 1;   -- los protectores cubren hasta ayer
      else
        v.lost_streak := v.current_streak;
        v.lost_on := v_today;
        v.current_streak := 0;
      end if;
    end if;
  end if;

  update public.daily_streaks
     set freezes = v.freezes, freeze_refill_on = v.freeze_refill_on, last_day = v.last_day,
         current_streak = v.current_streak, lost_streak = v.lost_streak, lost_on = v.lost_on, updated_at = now()
   where user_id = p_user;
  return v;
end $$;

-- Hitos: insignia (una vez) y su utilidad
create or replace function public._streak_milestones(p_user uuid, p_streak integer)
returns void language plpgsql security definer set search_path = public as $$
declare
  m integer;
begin
  foreach m in array array[3, 7, 30, 100, 365] loop
    continue when p_streak < m;
    insert into public.user_badges (user_id, badge_id) values (p_user, 'streak_' || m) on conflict do nothing;
    continue when not found;
    if m = 3 then
      update public.daily_streaks set freezes = freezes + 1 where user_id = p_user;
    elsif m = 30 then
      insert into public.purchases (provider, provider_payment_id, user_id, product_id, pro_kind, pro_days)
      values ('reward', 'streak30:' || p_user, p_user, 'reward_streak_30', 'subscription', 7)
      on conflict (provider, provider_payment_id) do nothing;
    elsif m = 100 then
      update public.daily_streaks set freeze_slots_bonus = freeze_slots_bonus + 1 where user_id = p_user;
    elsif m = 365 then
      insert into public.purchases (provider, provider_payment_id, user_id, product_id, pro_kind, pro_days)
      values ('reward', 'streak365:' || p_user, p_user, 'reward_streak_365', 'subscription', 30)
      on conflict (provider, provider_payment_id) do nothing;
    end if;
    -- 7 días: +3 Sprints gratis ese día (Fase 5 lo lee de user_badges.earned_at)
  end loop;
end $$;

create or replace function public._streak_advance(p_user uuid, p_day date, p_today date default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v public.daily_streaks;
begin
  v := public._streak_touch(p_user, coalesce(p_today, p_day));
  if v.last_day is not null and v.last_day >= p_day then
    return;
  end if;
  if v.last_day = p_day - 1 and v.current_streak > 0 then
    v.current_streak := v.current_streak + 1;
  else
    v.current_streak := 1;
  end if;
  update public.daily_streaks
     set current_streak = v.current_streak,
         best_streak = greatest(best_streak, v.current_streak),
         last_day = p_day,
         lost_streak = 0,
         lost_on = null,
         updated_at = now()
   where user_id = p_user;
  perform public._streak_milestones(p_user, v.current_streak);
end $$;

-- Registra el diario terminado (lo llama save_game_result con las rondas ya puntuadas por el servidor)
create or replace function public._record_daily(p_user uuid, p_result uuid, p_daily_no integer, p_now timestamptz default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_now   timestamptz := coalesce(p_now, now());
  v_today date := public.game_day(v_now);
  v_day   date;
  v_score integer;
  v_rt    integer;
  v_hits  integer;
  v_time  numeric;
  v_grid  text;
  v_total integer;
begin
  if p_daily_no is null then
    return;
  end if;
  v_day := public.daily_day(p_daily_no);
  if not (v_day = v_today or (v_day = v_today - 1 and (v_now at time zone 'America/Bogota')::time < time '00:30')) then
    return;
  end if;
  select score, rounds_total into v_score, v_rt from public.game_results where id = p_result;
  select count(*) filter (where base_points >= 400),
         coalesce(sum(time_s), 0),
         string_agg(case when base_points >= 400 and time_s < 3 then 'G' when base_points >= 400 then 'Y' else 'R' end, '' order by round_no)
    into v_hits, v_time, v_grid
    from public.game_rounds where result_id = p_result;
  v_grid := coalesce(v_grid, '');
  v_total := greatest(coalesce(v_rt, 13), length(v_grid));
  v_grid := rpad(v_grid, v_total, 'X');
  insert into public.daily_results (user_id, day, daily_no, result_id, score, hits, total, time_ms, grid)
  values (p_user, v_day, p_daily_no, p_result, coalesce(v_score, 0), coalesce(v_hits, 0), v_total, round(v_time * 1000)::integer, v_grid)
  on conflict (user_id, day) do nothing;
  if not found then
    return;   -- ese día ya contaba
  end if;
  -- La racha se evalúa en el día del diario (si terminó el de ayer pasada la medianoche, ayer no "faltó")
  perform public._streak_advance(p_user, v_day, v_day);
end $$;

revoke all on function public._is_pro(uuid) from public, anon, authenticated;
revoke all on function public._streak_touch(uuid, date) from public, anon, authenticated;
revoke all on function public._streak_milestones(uuid, integer) from public, anon, authenticated;
revoke all on function public._streak_advance(uuid, date, date) from public, anon, authenticated;
revoke all on function public._record_daily(uuid, uuid, integer, timestamptz) from public, anon, authenticated;

-- ── save_game_result: igual que en scoring_v2 + registro del diario ─────────
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

  return v_id;
end;
$$;

grant execute on function public.save_game_result(jsonb) to authenticated;

-- ── Estado del diario y la racha para la app ────────────────────────────────
create or replace function public.daily_status()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user  uuid := auth.uid();
  v_today date := public.game_day(now());
  v       public.daily_streaks;
  v_cap   integer;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  -- En los primeros 30 minutos del día todavía se puede terminar el diario de ayer: no se da por perdido
  v := public._streak_touch(v_user, case when (now() at time zone 'America/Bogota')::time < time '00:30' then v_today - 1 else v_today end);
  v_cap := (case when public._is_pro(v_user) then 3 else 1 end) + v.freeze_slots_bonus;
  return jsonb_build_object(
    'today', v_today,
    'daily_no', public.daily_number(v_today),
    'current_streak', v.current_streak,
    'best_streak', v.best_streak,
    'last_day', v.last_day,
    'freezes', v.freezes,
    'freeze_cap', v_cap,
    'freeze_refill_on', v.freeze_refill_on,
    'lost_streak', v.lost_streak,
    'lost_on', v.lost_on,
    'today_result', (
      select jsonb_build_object('score', d.score, 'hits', d.hits, 'total', d.total, 'time_ms', d.time_ms, 'grid', d.grid, 'daily_no', d.daily_no)
        from public.daily_results d where d.user_id = v_user and d.day = v_today),
    'played', coalesce((
      select jsonb_agg(d.day order by d.day) from public.daily_results d
       where d.user_id = v_user and d.day > v_today - 120), '[]'::jsonb),
    'frozen', coalesce((
      select jsonb_agg(f.day order by f.day) from public.daily_freeze_uses f
       where f.user_id = v_user and f.day > v_today - 120), '[]'::jsonb),
    'badges', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.badge_id, 'earned_at', b.earned_at, 'seen', b.seen) order by b.earned_at)
        from public.user_badges b where b.user_id = v_user), '[]'::jsonb),
    'active_title', (select active_title from public.profiles where id = v_user),
    'active_frame', (select active_frame from public.profiles where id = v_user)
  );
end $$;

create or replace function public.mark_badges_seen(p_ids text[])
returns void language sql security definer set search_path = public as $$
  update public.user_badges set seen = true where user_id = auth.uid() and badge_id = any (p_ids);
$$;

-- Título / marco activos: solo los ganados (null = ninguno)
create or replace function public.set_active_cosmetics(p_title text, p_frame text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_title is not null and not exists (
    select 1 from public.user_badges where user_id = v_user
       and badge_id = case p_title when 'viajero' then 'streak_100' when 'leyenda' then 'streak_365' else '-' end) then
    raise exception 'title not earned' using errcode = '22023';
  end if;
  if p_frame is not null and not exists (
    select 1 from public.user_badges where user_id = v_user
       and badge_id = case p_frame when 'bronze' then 'streak_7' when 'silver' then 'streak_100' when 'gold' then 'streak_365' else '-' end) then
    raise exception 'frame not earned' using errcode = '22023';
  end if;
  perform set_config('geospeed.cosmetics_ok', 'on', true);
  update public.profiles set active_title = p_title, active_frame = p_frame where id = v_user;
  perform set_config('geospeed.cosmetics_ok', 'off', true);
end $$;

revoke all on function public.daily_status() from public, anon;
revoke all on function public.mark_badges_seen(text[]) from public, anon;
revoke all on function public.set_active_cosmetics(text, text) from public, anon;
grant execute on function public.daily_status() to authenticated;
grant execute on function public.mark_badges_seen(text[]) to authenticated;
grant execute on function public.set_active_cosmetics(text, text) to authenticated;

-- ── Invitado → cuenta existente: también la racha, el diario y las insignias ──
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

  -- XP heredado del historial local
  select coalesce(xp_legacy, 0) into v_xp from public.profiles where id = v_anon;
  update public.profiles set xp_legacy = coalesce(xp_legacy, 0) + v_xp where id = v_user;

  -- El anónimo queda vacío: cleanup_anonymous_users() lo borrará a los 30 días
  return jsonb_build_object('moved_games', v_games);
end $$;

revoke all on function public.redeem_transfer_ticket(text) from public, anon;
grant execute on function public.redeem_transfer_ticket(text) to authenticated;

-- ── Ranking con título y marco activos ──────────────────────────────────────
drop function if exists public.leaderboard_top(text, text, text, integer, text, text);

create or replace function public.leaderboard_top(
  p_mode text default 'world',
  p_difficulty text default null,
  p_period text default 'all',
  p_limit integer default 10,
  p_game_type text default null,
  p_season text default 't1'
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

grant execute on function public.leaderboard_top(text, text, text, integer, text, text) to anon, authenticated;

-- ── Cuántos jugaron el diario de hoy (prueba social en el Inicio; antes contaba la tabla vieja) ──
create or replace function public.daily_players_today()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.daily_results where day = public.game_day(now());
$$;
grant execute on function public.daily_players_today() to anon, authenticated;
