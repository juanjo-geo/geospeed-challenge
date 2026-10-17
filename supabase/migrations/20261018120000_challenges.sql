-- ════════════════════════════════════════════════════════════════════════════
-- F3 · Reto asincrónico entre amigos (SOC-01, consolidado §3.2 y §4)
--
-- Decisiones aplicadas (docs/GeoSpeed_Plan_Rediseno_v2.md §4 y §5):
--   D2  lista explícita de ciudades guardada en el reto (no seed)
--   D3  código de 5 caracteres (alfabeto sin 0/O/1/I) generado en SERVIDOR con reintento;
--       error genérico "reto no disponible" para código inválido, lleno o cancelado
--   D9  si alguien cierra a mitad, no hay resultado: sigue "te falta jugar" y reinicia
--   §5.2 el puntaje del rival solo se lee cuando ambos terminaron (RPC challenge_detail);
--       game_results con challenge_id ya quedan fuera de la política de ranking (F1)
--
-- Todo se hace con funciones SECURITY DEFINER (no Edge Functions): atómico, sin despliegue
-- aparte y sin exponer el código del reto en un SELECT público.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Tablas ──────────────────────────────────────────────────────────────────
create table if not exists public.challenges (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  creator_id          uuid not null references auth.users (id) on delete cascade,
  mode                text not null check (mode in ('world','europe','asia','americas','africa')),
  difficulty          text not null check (difficulty in ('basic','easy','medium','hard')),
  rounds_total        integer not null default 13 check (rounds_total between 3 and 30),
  seconds_per_round   integer not null default 15 check (seconds_per_round between 3 and 60),
  cities              jsonb not null,
  catalog_version     text,
  parent_challenge_id uuid references public.challenges (id) on delete set null,
  status              text not null default 'open' check (status in ('open','active','completed','cancelled')),
  client_request_id   text,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz,
  unique (creator_id, client_request_id)
);
create index if not exists idx_challenges_creator on public.challenges (creator_id, created_at desc);

create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null check (role in ('creator','opponent')),
  accepted_at  timestamptz,
  finished_at  timestamptz,
  result_id    uuid references public.game_results (id) on delete set null,
  primary key (challenge_id, user_id)
);
create unique index if not exists uq_challenge_one_opponent on public.challenge_participants (challenge_id) where role = 'opponent';
create index if not exists idx_challenge_participants_user on public.challenge_participants (user_id);

-- game_results.challenge_id (creada en F1 sin FK) ahora apunta a challenges
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'game_results_challenge_id_fkey') then
    alter table public.game_results
      add constraint game_results_challenge_id_fkey foreign key (challenge_id) references public.challenges (id) on delete set null;
  end if;
end $$;

-- ── Acceso ──────────────────────────────────────────────────────────────────
-- Lectura solo para participantes. Escritura únicamente vía las funciones de abajo.
create or replace function public.is_challenge_participant(p_challenge uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.challenge_participants where challenge_id = p_challenge and user_id = auth.uid());
$$;

alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

drop policy if exists "challenges_select_participants" on public.challenges;
create policy "challenges_select_participants" on public.challenges
  for select to authenticated using (public.is_challenge_participant(id));

drop policy if exists "challenge_participants_select_participants" on public.challenge_participants;
create policy "challenge_participants_select_participants" on public.challenge_participants
  for select to authenticated using (public.is_challenge_participant(challenge_id));

-- ── Utilidades internas ─────────────────────────────────────────────────────
create or replace function public._challenge_code()
returns text language plpgsql volatile as $$
declare
  v_alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code  text := '';
begin
  for i in 1..5 loop
    v_code := v_code || substr(v_alpha, 1 + floor(random() * 32)::int, 1);
  end loop;
  return v_code;
end $$;

-- Vista JSON de un reto para su participante (sin puntajes)
create or replace function public._challenge_json(c public.challenges)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', c.id, 'code', c.code, 'mode', c.mode, 'difficulty', c.difficulty,
    'rounds_total', c.rounds_total, 'seconds_per_round', c.seconds_per_round,
    'cities', c.cities, 'status', c.status, 'parent_challenge_id', c.parent_challenge_id,
    'created_at', c.created_at, 'completed_at', c.completed_at,
    'is_creator', c.creator_id = auth.uid()
  );
$$;

-- ── challenge_create ────────────────────────────────────────────────────────
-- p = { mode, difficulty, rounds_total, seconds_per_round, cities:[{n,name,country,iso,lat,lon}],
--       catalog_version, client_request_id, parent_challenge_id? }
create or replace function public.challenge_create(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_req    text := nullif(p->>'client_request_id', '');
  v_rounds integer := coalesce((p->>'rounds_total')::integer, 13);
  v_cities jsonb := p->'cities';
  v_parent uuid := nullif(p->>'parent_challenge_id', '')::uuid;
  v_row    public.challenges;
  v_city   jsonb;
  v_try    integer := 0;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;

  -- Idempotencia: el mismo client_request_id devuelve el mismo reto (criterio 4)
  if v_req is not null then
    select * into v_row from public.challenges where creator_id = v_user and client_request_id = v_req;
    if found then return public._challenge_json(v_row); end if;
  end if;

  -- Validación de la lista de ciudades
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

  if v_parent is not null and not exists (
    select 1 from public.challenge_participants where challenge_id = v_parent and user_id = v_user
  ) then
    v_parent := null;
  end if;

  loop
    v_try := v_try + 1;
    begin
      insert into public.challenges (code, creator_id, mode, difficulty, rounds_total, seconds_per_round,
                                     cities, catalog_version, parent_challenge_id, client_request_id)
      values (public._challenge_code(), v_user, coalesce(p->>'mode', 'world'), coalesce(p->>'difficulty', 'basic'),
              v_rounds, coalesce((p->>'seconds_per_round')::integer, 15), v_cities,
              p->>'catalog_version', v_parent, v_req)
      returning * into v_row;
      exit;
    exception when unique_violation then
      -- choque de código (o carrera con el mismo client_request_id)
      if v_req is not null then
        select * into v_row from public.challenges where creator_id = v_user and client_request_id = v_req;
        if found then return public._challenge_json(v_row); end if;
      end if;
      if v_try >= 10 then raise; end if;
    end;
  end loop;

  insert into public.challenge_participants (challenge_id, user_id, role, accepted_at)
  values (v_row.id, v_user, 'creator', now());

  return public._challenge_json(v_row);
end $$;

-- ── challenge_preview: lo que ve el invitado antes de aceptar ───────────────
-- Sin ciudades ni puntajes. Error genérico si el código no sirve (D3).
create or replace function public.challenge_preview(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_row  public.challenges;
  v_name text;
  v_avatar text;
  v_role text;
  v_has_opponent boolean;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_row from public.challenges where code = upper(trim(p_code));
  if not found or v_row.status = 'cancelled' then
    raise exception 'challenge_unavailable' using errcode = 'P0002';
  end if;
  select role into v_role from public.challenge_participants where challenge_id = v_row.id and user_id = auth.uid();
  select exists (select 1 from public.challenge_participants where challenge_id = v_row.id and role = 'opponent') into v_has_opponent;
  if v_role is null and v_has_opponent then
    raise exception 'challenge_unavailable' using errcode = 'P0002';
  end if;
  select display_name, avatar into v_name, v_avatar from public.profiles where id = v_row.creator_id;
  return jsonb_build_object(
    'id', v_row.id, 'code', v_row.code, 'mode', v_row.mode, 'difficulty', v_row.difficulty,
    'rounds_total', v_row.rounds_total, 'seconds_per_round', v_row.seconds_per_round,
    'status', v_row.status, 'created_at', v_row.created_at,
    'creator_name', coalesce(nullif(v_name, ''), 'Explorador'), 'creator_avatar', v_avatar,
    'my_role', v_role
  );
end $$;

-- ── challenge_join: aceptar con el código ───────────────────────────────────
-- Idempotente: repetirlo devuelve el mismo reto. El creador obtiene su propio reto.
create or replace function public.challenge_join(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_row  public.challenges;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_row from public.challenges where code = upper(trim(p_code)) for update;
  if not found or v_row.status = 'cancelled' then
    raise exception 'challenge_unavailable' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.challenge_participants where challenge_id = v_row.id and user_id = v_user) then
    update public.challenge_participants set accepted_at = coalesce(accepted_at, now())
      where challenge_id = v_row.id and user_id = v_user;
    return public._challenge_json(v_row);
  end if;

  begin
    insert into public.challenge_participants (challenge_id, user_id, role, accepted_at)
    values (v_row.id, v_user, 'opponent', now());
  exception when unique_violation then
    raise exception 'challenge_unavailable' using errcode = 'P0002';  -- ya tiene rival
  end;

  if v_row.status = 'open' then
    update public.challenges set status = 'active' where id = v_row.id returning * into v_row;
  end if;
  return public._challenge_json(v_row);
end $$;

-- ── Cierre automático: al guardar la partida del reto ───────────────────────
-- save_game_result (F1) inserta game_results con challenge_id. Este trigger marca al
-- participante como terminado (solo la PRIMERA partida cuenta) y completa el reto
-- cuando ambos terminaron. Funciona también con la cola offline (idempotente por client_id).
create or replace function public._challenge_on_result()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pending integer;
  v_count   integer;
begin
  if new.challenge_id is null then return new; end if;

  update public.challenge_participants
     set finished_at = now(), result_id = new.id, accepted_at = coalesce(accepted_at, now())
   where challenge_id = new.challenge_id and user_id = new.user_id and finished_at is null;

  select count(*), count(*) filter (where finished_at is null)
    into v_count, v_pending
    from public.challenge_participants where challenge_id = new.challenge_id;

  if v_count >= 2 and v_pending = 0 then
    update public.challenges set status = 'completed', completed_at = now()
     where id = new.challenge_id and status <> 'completed';
  end if;
  return new;
end $$;

drop trigger if exists trg_challenge_on_result on public.game_results;
create trigger trg_challenge_on_result after insert on public.game_results
  for each row execute function public._challenge_on_result();

-- ── my_challenges: bandeja (F4 "Mis retos") y estado por reto ───────────────
-- state: to_accept | to_play | waiting | ready   (los contadores salen de esta misma lista)
-- Los puntajes solo aparecen cuando el reto está completado.
create or replace function public.my_challenges(p_limit integer default 50)
returns table (
  id uuid, code text, mode text, difficulty text, status text, created_at timestamptz, completed_at timestamptz,
  my_role text, state text, rival_name text, rival_avatar text, rival_finished boolean,
  my_score integer, rival_score integer
) language sql stable security definer set search_path = public as $$
  select c.id, c.code, c.mode, c.difficulty, c.status, c.created_at, c.completed_at,
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
         case when c.status = 'completed' then rr.score end
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

-- ── challenge_detail: reto + mi resultado + (si ambos terminaron) el del rival ──
create or replace function public.challenge_detail(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_row  public.challenges;
  v_me   public.challenge_participants;
  v_rv   public.challenge_participants;
  v_rv_name text;
  v_rv_avatar text;
  v_done boolean;
  result_json jsonb;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_me from public.challenge_participants where challenge_id = p_id and user_id = v_user;
  if not found then raise exception 'challenge_unavailable' using errcode = 'P0002'; end if;
  select * into v_row from public.challenges where id = p_id;
  select * into v_rv from public.challenge_participants where challenge_id = p_id and user_id <> v_user;
  select display_name, avatar into v_rv_name, v_rv_avatar from public.profiles where id = v_rv.user_id;
  v_done := v_row.status = 'completed';

  result_json := public._challenge_json(v_row) || jsonb_build_object(
    'my_role', v_me.role,
    'my_finished', v_me.finished_at is not null,
    'rival', case when v_rv.user_id is null then null else jsonb_build_object(
      'name', coalesce(nullif(v_rv_name, ''), 'Explorador'), 'avatar', v_rv_avatar,
      'finished', v_rv.finished_at is not null) end,
    'my_result', (select jsonb_build_object('score', r.score, 'end_reason', r.end_reason,
        'rounds', coalesce((select jsonb_agg(to_jsonb(g) - 'result_id' order by g.round_no) from public.game_rounds g where g.result_id = r.id), '[]'::jsonb))
      from public.game_results r where r.id = v_me.result_id),
    'rival_result', case when v_done then (select jsonb_build_object('score', r.score, 'end_reason', r.end_reason,
        'rounds', coalesce((select jsonb_agg(to_jsonb(g) - 'result_id' order by g.round_no) from public.game_rounds g where g.result_id = r.id), '[]'::jsonb))
      from public.game_results r where r.id = v_rv.result_id) end
  );
  return result_json;
end $$;

-- ── Limpieza técnica (D4): retos sin ninguna partida a los 30 días ───────────
create or replace function public.cleanup_stale_challenges()
returns integer language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  delete from public.challenges c
   where c.created_at < now() - interval '30 days'
     and not exists (select 1 from public.challenge_participants p where p.challenge_id = c.id and p.finished_at is not null);
  get diagnostics v_n = row_count;
  return v_n;
end $$;
-- Programar con pg_cron junto a cleanup_anonymous_users():
--   select cron.schedule('cleanup-stale-challenges', '30 4 * * 0', $$select public.cleanup_stale_challenges()$$);

-- ── Permisos ────────────────────────────────────────────────────────────────
revoke all on function public.challenge_create(jsonb) from public, anon;
revoke all on function public.challenge_preview(text) from public, anon;
revoke all on function public.challenge_join(text) from public, anon;
revoke all on function public.my_challenges(integer) from public, anon;
revoke all on function public.challenge_detail(uuid) from public, anon;
revoke all on function public.cleanup_stale_challenges() from public, anon, authenticated;
revoke all on function public._challenge_code() from public, anon, authenticated;
revoke all on function public._challenge_json(public.challenges) from public, anon, authenticated;
revoke all on function public._challenge_on_result() from public, anon, authenticated;
grant execute on function public.challenge_create(jsonb) to authenticated;
grant execute on function public.challenge_preview(text) to authenticated;
grant execute on function public.challenge_join(text) to authenticated;
grant execute on function public.my_challenges(integer) to authenticated;
grant execute on function public.challenge_detail(uuid) to authenticated;
grant execute on function public.is_challenge_participant(uuid) to authenticated;
