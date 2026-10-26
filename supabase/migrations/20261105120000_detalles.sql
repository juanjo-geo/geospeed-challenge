-- ════════════════════════════════════════════════════════════════════════════
-- Detalles pendientes de las fases (2026-10-26)
--  · Mis retos: my_challenges devuelve la categoría del reto (la tarjeta decía "13 ciudades" en un reto de banderas).
--  · Caribe: 20 lugares y 13 monumentos nuevos (al final), para que el pack Caribe ofrezca Lugares y Monumentos.
--  · Packs Pro: la partida de prueba gratis del día la controla también el servidor (antes solo el teléfono: borrar
--    los datos o reinstalar la devolvía). claim_pack_trial(modo) la reclama al empezar (true = es la de hoy o es Pro),
--    refund_pack_trial(modo) la devuelve si se cancela en la cuenta regresiva, y save_game_result deja fuera del
--    ranking la partida de un pack Pro sin Pro que no sea la prueba del día.
-- Idempotente: se aplica desde el SQL Editor (db push responde 403).
-- ════════════════════════════════════════════════════════════════════════════

-- ── Mis retos con categoría (cambia lo que devuelve: hay que borrarla primero) ─────────────────────────────
drop function if exists public.my_challenges(integer);
create or replace function public.my_challenges(p_limit integer default 50)
returns table (
  id uuid, code text, mode text, difficulty text, status text, created_at timestamptz, completed_at timestamptz,
  rounds_total integer, is_rematch boolean,
  my_role text, state text, rival_name text, rival_avatar text, rival_finished boolean,
  my_score integer, rival_score integer, category text
) language sql stable security definer set search_path = public as $$
  select c.id, c.code, c.mode, c.difficulty, c.status, c.created_at, c.completed_at,
         c.rounds_total, c.parent_challenge_id is not null,
         me.role,
         case
           when me.accepted_at is null then 'to_accept'
           when me.finished_at is null then 'to_play'
           when c.status = 'completed' then 'ready'
           else 'waiting'
         end as state,
         coalesce(nullif(pr.display_name, ''), case when rv.user_id is null then null else 'Explorador' end),
         pr.avatar,
         rv.finished_at is not null,
         case when c.status = 'completed' then mr.score end,
         case when c.status = 'completed' then rr.score end,
         coalesce(c.category, 'cities')
    from public.challenge_participants me
    join public.challenges c on c.id = me.challenge_id
    left join public.challenge_participants rv on rv.challenge_id = c.id and rv.user_id <> me.user_id
    left join public.profiles pr on pr.id = rv.user_id
    left join public.game_results mr on mr.id = me.result_id
    left join public.game_results rr on rr.id = rv.result_id
   where me.user_id = auth.uid() and c.status <> 'cancelled'
   order by coalesce(c.completed_at, c.created_at) desc
   limit greatest(1, least(p_limit, 200));
$$;

revoke all on function public.my_challenges(integer) from public, anon;
grant execute on function public.my_challenges(integer) to authenticated;

-- ── Prueba diaria de los packs Pro ─────────────────────────────────────────────────────────────────────────
create table if not exists public.pack_trials (
  user_id    uuid not null references auth.users (id) on delete cascade,
  mode       text not null,
  day        date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, mode, day)
);
alter table public.pack_trials enable row level security;
revoke all on public.pack_trials from anon, authenticated;

create or replace function public.claim_pack_trial(p_mode text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_mode not in ('andes', 'conosur', 'mexcam', 'caribe') or public._is_pro(v_user) then
    return true;
  end if;
  insert into public.pack_trials (user_id, mode, day) values (v_user, p_mode, public.game_day(now()))
  on conflict do nothing;
  return found;
end $$;
revoke all on function public.claim_pack_trial(text) from public, anon;
grant execute on function public.claim_pack_trial(text) to authenticated;

-- Cancelar en la cuenta regresiva: se devuelve, salvo que ya haya una partida guardada hoy en ese pack
create or replace function public.refund_pack_trial(p_mode text)
returns void language sql volatile security definer set search_path = public as $$
  delete from public.pack_trials t
   where t.user_id = auth.uid() and t.mode = p_mode and t.day = public.game_day(now())
     and not exists (select 1 from public.game_results g where g.user_id = auth.uid() and g.mode = p_mode
                      and public.game_day(g.created_at) = public.game_day(now()));
$$;
revoke all on function public.refund_pack_trial(text) from public, anon;
grant execute on function public.refund_pack_trial(text) to authenticated;

-- ── save_game_result: + la regla de la prueba (copia de 20261104120000_offline.sql) ─────────────────────────
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

  -- Packs Pro (Fase 7b): sin Pro solo cuenta (para el ranking y la memoria) la partida de prueba del día, la que el
  -- teléfono reclamó con claim_pack_trial; una segunda partida el mismo día, o sin reclamar, queda fuera
  if v_mode in ('andes', 'conosur', 'mexcam', 'caribe') and v_type = 'classic' and not public._is_pro(v_user) and (
       not exists (select 1 from public.pack_trials t where t.user_id = v_user and t.mode = v_mode and t.day = public.game_day(now()))
       or exists (select 1 from public.game_results g where g.user_id = v_user and g.mode = v_mode and g.game_type = 'classic'
                   and public.game_day(g.created_at) = public.game_day(now()))) then
    v_susp := true;
  end if;

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

-- ── Caribe: lugares y monumentos nuevos (el pack Caribe no llegaba a 13 de cada uno) ──────────────────────────
-- Copia de las filas nuevas de supabase/seed/feature_places.sql y landmark_places.sql (scripts/build-features.mjs y
-- build-landmarks.mjs): 20 lugares (4 con contorno) y 13 monumentos. También entran en Mundo y América.
insert into public.places (id, kind, name, country, lat, lon) values
  ('feat:estrecho-florida', 'feature', 'Estrecho de Florida', null, 24.611, -80.246),
  ('feat:canal-yucatan', 'feature', 'Canal de Yucatán', null, 21.529, -86.979),
  ('feat:paso-vientos', 'feature', 'Paso de los Vientos', null, 20, -73.85),
  ('feat:canal-mona', 'feature', 'Canal de la Mona', null, 18.2, -67.9),
  ('feat:bahia-cochinos', 'feature', 'Bahía de Cochinos', null, 22.1, -81.15),
  ('feat:bahia-guantanamo', 'feature', 'Bahía de Guantánamo', null, 19.93, -75.15),
  ('feat:lago-enriquillo', 'feature', 'Lago Enriquillo', null, 18.488, -71.647),
  ('feat:yaque-norte', 'feature', 'Río Yaque del Norte', null, 19.748, -71.461),
  ('feat:pico-duarte', 'feature', 'Pico Duarte', null, 19.023, -70.998),
  ('feat:pico-turquino', 'feature', 'Pico Turquino', null, 19.99, -76.836),
  ('feat:sierra-maestra', 'feature', 'Sierra Maestra', null, 20.05, -76.75),
  ('feat:montanas-azules', 'feature', 'Montañas Azules', null, 18.05, -76.58),
  ('feat:isla-juventud', 'feature', 'Isla de la Juventud', null, 21.72, -82.85),
  ('feat:isla-gonave', 'feature', 'Isla de la Gonâve', null, 18.85, -73.05),
  ('feat:isla-saona', 'feature', 'Isla Saona', null, 18.16, -68.72),
  ('feat:vieques', 'feature', 'Isla de Vieques', null, 18.12, -65.43),
  ('feat:peninsula-samana', 'feature', 'Península de Samaná', null, 19.25, -69.45),
  ('feat:el-yunque', 'feature', 'El Yunque', null, 18.3, -65.8),
  ('feat:valle-vinales', 'feature', 'Valle de Viñales', null, 22.62, -83.72),
  ('feat:dunns-river', 'feature', 'Cataratas del río Dunn', null, 18.414, -77.135),
  ('mon:malecon-habana', 'monument', 'Malecón de La Habana', 'Cuba', 23.1417, -82.3681),
  ('mon:morro-habana', 'monument', 'Castillo del Morro (La Habana)', 'Cuba', 23.1504, -82.3567),
  ('mon:plaza-revolucion-habana', 'monument', 'Plaza de la Revolución', 'Cuba', 23.1244, -82.3861),
  ('mon:catedral-habana', 'monument', 'Catedral de La Habana', 'Cuba', 23.1414, -82.3519),
  ('mon:plaza-mayor-trinidad', 'monument', 'Plaza Mayor de Trinidad', 'Cuba', 21.8052, -79.9846),
  ('mon:san-pedro-roca', 'monument', 'Castillo de San Pedro de la Roca', 'Cuba', 19.9687, -75.8703),
  ('mon:catedral-santo-domingo', 'monument', 'Catedral Primada de América', 'República Dominicana', 18.473, -69.8839),
  ('mon:faro-colon', 'monument', 'Faro a Colón', 'República Dominicana', 18.4786, -69.8682),
  ('mon:basilica-higuey', 'monument', 'Basílica de Higüey', 'República Dominicana', 18.6161, -68.7169),
  ('mon:sans-souci', 'monument', 'Palacio Sans-Souci', 'Haití', 19.6047, -72.2186),
  ('mon:museo-bob-marley', 'monument', 'Museo Bob Marley', 'Jamaica', 18.0196, -76.7798),
  ('mon:rose-hall', 'monument', 'Rose Hall', 'Jamaica', 18.5167, -77.8193),
  ('mon:observatorio-arecibo', 'monument', 'Observatorio de Arecibo', 'Puerto Rico', 18.3467, -66.7533)
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;

delete from public.place_shapes where place_id in ('feat:canal-yucatan', 'feat:estrecho-florida', 'feat:lago-enriquillo', 'feat:yaque-norte');
insert into public.place_shapes (place_id, ring_no, lons, lats, is_line) values
  ('feat:estrecho-florida', 0, array[-78.435,-80.641,-82.101,-83.033,-83,-81.801,-80.425,-79.896,-80.33,-80.126,-80.043,-78.961,-78.799,-78.163,-78.243,-78.435]::double precision[], array[24.627,23.098,23.19,23,24.218,24.077,24.465,24.959,25.422,25.833,26.618,26.668,26.528,25.202,24.654,24.627]::double precision[], false),
  ('feat:canal-yucatan', 0, array[-87.017,-86.912,-86.824,-86.912,-86.99,-87.035,-87.017]::double precision[], array[21.573,21.463,21.422,21.463,21.531,21.592,21.573]::double precision[], false),
  ('feat:lago-enriquillo', 0, array[-71.569,-71.494,-71.528,-71.596,-71.804,-71.82,-71.782,-71.703,-71.569]::double precision[], array[18.512,18.464,18.429,18.413,18.501,18.541,18.515,18.568,18.512]::double precision[], false),
  ('feat:yaque-norte', 0, array[-70.773,-70.667,-70.717,-71.461,-71.515,-71.683]::double precision[], array[19.09,19.183,19.495,19.748,19.705,19.847]::double precision[], true);
