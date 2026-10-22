-- ════════════════════════════════════════════════════════════════════════════
-- Sprint: el rival "de la casa" se elige primero entre jugadores con nombre (y con país, si lo tienen)
--
-- JuanJo (2026-10-22): su primera carrera fue contra la partida de un invitado sin nombre ni correo, y la
-- tarjeta del rival no mostró datos. Ahora, cuando no hay rivales de Sprint, se busca en este orden:
-- partidas de la casa ya armadas de jugadores con nombre → partidas nuevas del Clásico de jugadores con nombre
-- (antes los que tienen país y cuenta registrada) → las mismas dos, de cualquier jugador (último recurso).
-- Solo reemplaza _sprint_house_run; lo demás del Sprint (20261025120000_sprint.sql) no cambia.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public._sprint_house_run(p_user uuid, p_points integer, p_season integer)
returns public.sprint_runs language plpgsql security definer set search_path = public, auth as $$
declare
  v_src    record;
  v_input  jsonb;
  v_cities jsonb;
  v_scored record;
  v_run    public.sprint_runs;
  v_named  boolean;
begin
  foreach v_named in array array[true, false] loop
    -- Una partida de la casa ya armada que este jugador no haya enfrentado
    select r.* into v_run from public.sprint_runs r
      left join public.profiles p on p.id = r.user_id
     where r.is_house and r.season_id = p_season and r.user_id is distinct from p_user
       and (not v_named or coalesce(p.display_name, '') <> '')
       and not exists (select 1 from public.sprint_matches m where m.player_id = p_user and m.run_id = r.id)
     order by (p.country is not null) desc, random() limit 1;
    if found then return v_run; end if;

    -- Una partida real nueva del Clásico de otro jugador (las primeras 10 ciudades)
    select g.id, g.user_id into v_src from public.game_results g
      left join public.profiles p on p.id = g.user_id
      left join auth.users u on u.id = g.user_id
     where g.user_id <> p_user and g.game_type in ('classic','daily','challenge') and not g.suspicious and g.mode = 'world'
       and (not v_named or coalesce(p.display_name, '') <> '')
       and (select count(*) from public.game_rounds x
             where x.result_id = g.id and x.place_id is not null and x.click_lat is not null and x.round_no <= 10) = 10
       and not exists (select 1 from public.sprint_runs s where s.source_result_id = g.id and s.season_id = p_season)
     order by (p.country is not null) desc, coalesce(u.is_anonymous, true) asc, random() limit 1;
    exit when v_src.id is not null;
  end loop;
  if v_src.id is null then return null; end if;

  select jsonb_agg(jsonb_build_object(
           'round_no', x.round_no, 'place_id', x.place_id, 'city_name', x.city_name, 'city_country', x.city_country,
           'city_lat', x.city_lat, 'city_lon', x.city_lon, 'click_lat', x.click_lat, 'click_lon', x.click_lon,
           'time_s', x.time_s) order by x.round_no),
         jsonb_agg(jsonb_build_object(
           'n', x.round_no, 'id', x.place_id, 'name', x.city_name, 'country', x.city_country, 'iso', null,
           'lat', x.city_lat, 'lon', x.city_lon) order by x.round_no)
    into v_input, v_cities
    from public.game_rounds x where x.result_id = v_src.id and x.round_no <= 10;

  select * into v_scored from public._score_rounds_v2(v_input, 'world', 'basic', 'sprint');
  insert into public.sprint_runs (user_id, is_house, source_result_id, season_id, cities, rounds, score, points_at)
  values (v_src.user_id, true, v_src.id, p_season, v_cities,
          (select jsonb_agg(jsonb_build_object('round_no', e->'round_no', 'time_s', e->'time_s', 'click_lat', e->'click_lat',
                    'click_lon', e->'click_lon', 'distance_km', e->'distance_km', 'points', e->'points'))
             from jsonb_array_elements(v_scored.rounds) e),
          v_scored.total, p_points)
  returning * into v_run;
  return v_run;
end $$;

revoke all on function public._sprint_house_run(uuid, integer, integer) from public, anon, authenticated;
