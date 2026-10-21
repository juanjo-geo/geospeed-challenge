-- ════════════════════════════════════════════════════════════════════════════
-- Fase 3 — Carrera contra el fantasma en los retos (docs/GeoSpeed_Plan_Competencia.md §8)
--
-- Quien juega un reto después de su rival ve la partida del rival "en vivo": su puntaje acumulado, el
-- aviso en el segundo exacto en que respondió cada ciudad y, después de responder, su pin y la comparación.
-- No hace falta grabar nada nuevo: game_rounds ya guarda por ronda el clic (click_lat/lon), el tiempo con
-- décimas (time_s) y los puntos que recalcula el servidor (puntaje v2).
--
-- challenge_ghost(p_id): las rondas del rival, SOLO si quien pregunta participa en el reto, todavía no lo
-- terminó y el rival sí. Las ciudades del reto ya viajan al cliente para poder jugarlo, así que las
-- coordenadas del rival no abren ninguna trampa nueva. Cuando el reto se completa, la comparación final
-- sigue saliendo de challenge_detail.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.challenge_ghost(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_me   public.challenge_participants;
  v_rv   public.challenge_participants;
  v_name text;
  v_avatar text;
  v_out  jsonb;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_me from public.challenge_participants where challenge_id = p_id and user_id = v_user;
  if not found then raise exception 'challenge_unavailable' using errcode = 'P0002'; end if;
  -- Ya jugué: no hay carrera (la comparación final es challenge_detail)
  if v_me.finished_at is not null then return null; end if;

  select * into v_rv from public.challenge_participants where challenge_id = p_id and user_id <> v_user;
  if v_rv.user_id is null or v_rv.finished_at is null or v_rv.result_id is null then return null; end if;

  select display_name, avatar into v_name, v_avatar from public.profiles where id = v_rv.user_id;

  select jsonb_build_object(
      'name', coalesce(nullif(v_name, ''), 'Explorador'),
      'avatar', v_avatar,
      'score', r.score,
      'end_reason', r.end_reason,
      'rounds', coalesce((
        select jsonb_agg(jsonb_build_object(
            'round_no', g.round_no, 'time_s', g.time_s, 'click_lat', g.click_lat, 'click_lon', g.click_lon,
            'distance_km', g.distance_km, 'points', g.points) order by g.round_no)
          from public.game_rounds g where g.result_id = r.id), '[]'::jsonb))
    into v_out
    from public.game_results r where r.id = v_rv.result_id;
  return v_out;
end $$;

revoke all on function public.challenge_ghost(uuid) from public, anon;
grant execute on function public.challenge_ghost(uuid) to authenticated;
