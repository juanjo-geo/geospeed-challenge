-- ════════════════════════════════════════════════════════════════════════════
-- F4 · Mis retos y revancha (SOC-05, SOC-06)
--
-- Revancha: challenge_create con parent_challenge_id invita automáticamente al rival del reto
-- original (fila opponent con accepted_at NULL → aparece "Por aceptar" en su bandeja, sin código).
-- challenge_preview / challenge_detail informan si el invitado ya aceptó y si es revancha, para
-- mostrar "Te piden revancha" / "Revancha enviada". my_challenges añade is_rematch y nuevas ciudades.
-- ════════════════════════════════════════════════════════════════════════════

-- ── challenge_create: invitación automática al rival en la revancha ─────────
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
                                     cities, catalog_version, parent_challenge_id, client_request_id)
      values (public._challenge_code(), v_user, coalesce(p->>'mode', 'world'), coalesce(p->>'difficulty', 'basic'),
              v_rounds, coalesce((p->>'seconds_per_round')::integer, 15), v_cities,
              p->>'catalog_version', v_parent, v_req)
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
    'id', v_row.id, 'code', v_row.code, 'mode', v_row.mode, 'difficulty', v_row.difficulty,
    'rounds_total', v_row.rounds_total, 'seconds_per_round', v_row.seconds_per_round,
    'status', v_row.status, 'created_at', v_row.created_at,
    'creator_name', coalesce(nullif(v_name, ''), 'Explorador'), 'creator_avatar', v_avatar,
    'my_role', v_role, 'accepted', coalesce(v_accepted, false),
    'is_rematch', v_row.parent_challenge_id is not null
  );
end $$;

-- ── challenge_detail: + accepted del rival, is_rematch ──────────────────────
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
    'is_rematch', v_row.parent_challenge_id is not null,
    'rival', case when v_rv.user_id is null then null else jsonb_build_object(
      'name', coalesce(nullif(v_rv_name, ''), 'Explorador'), 'avatar', v_rv_avatar,
      'accepted', v_rv.accepted_at is not null, 'finished', v_rv.finished_at is not null) end,
    'my_result', (select jsonb_build_object('score', r.score, 'end_reason', r.end_reason,
        'rounds', coalesce((select jsonb_agg(to_jsonb(g) - 'result_id' order by g.round_no) from public.game_rounds g where g.result_id = r.id), '[]'::jsonb))
      from public.game_results r where r.id = v_me.result_id),
    'rival_result', case when v_done then (select jsonb_build_object('score', r.score, 'end_reason', r.end_reason,
        'rounds', coalesce((select jsonb_agg(to_jsonb(g) - 'result_id' order by g.round_no) from public.game_rounds g where g.result_id = r.id), '[]'::jsonb))
      from public.game_results r where r.id = v_rv.result_id) end
  );
  return result_json;
end $$;

-- ── my_challenges: + is_rematch, rounds_total ───────────────────────────────
drop function if exists public.my_challenges(integer);
create or replace function public.my_challenges(p_limit integer default 50)
returns table (
  id uuid, code text, mode text, difficulty text, status text, created_at timestamptz, completed_at timestamptz,
  rounds_total integer, is_rematch boolean,
  my_role text, state text, rival_name text, rival_avatar text, rival_finished boolean,
  my_score integer, rival_score integer
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

revoke all on function public.my_challenges(integer) from public, anon;
grant execute on function public.my_challenges(integer) to authenticated;
