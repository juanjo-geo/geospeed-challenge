-- Auditoría 2026-11-16 (docs/GeoSpeed_Auditoria_Promesas.md, T7): "Eliminar cuenta" promete borrar tu nombre y
-- avatar, pero quedaban copias en datos de otros jugadores: las carreras de Sprint que otros corrieron contra tu
-- partida (sprint_matches.opp_*) y la tabla final de las temporadas cerradas de Conquista (conq_closes.standings).
-- Ahora se borran también. Los reportes de moderación (content_reports.reported_name) se conservan: son del que
-- reporta y sirven para revisar abusos; la política lo dice. Idempotente.

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  -- Puntajes del ranking viejo (tenían on delete set null: quedarían con las iniciales)
  delete from public.leaderboard where user_id = v_user;
  -- Copias de mi nombre, avatar y país en las carreras de Sprint de mis rivales
  update public.sprint_matches set opp_name = null, opp_avatar = null, opp_country = null where opponent_id = v_user;
  -- Tabla final de las temporadas de Conquista ya cerradas: mi fila queda sin nombre ni avatar (cuenta retirada)
  update public.conq_closes c
     set standings = (select jsonb_agg(case when e->>'user_id' = v_user::text
                                            then e || jsonb_build_object('name', null, 'avatar', null, 'retired', true)
                                            else e end)
                        from jsonb_array_elements(c.standings) e)
   where c.standings @> jsonb_build_array(jsonb_build_object('user_id', v_user::text));
  -- El resto de los datos cuelga del usuario con on delete cascade
  delete from auth.users where id = v_user;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
