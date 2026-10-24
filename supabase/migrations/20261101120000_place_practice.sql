-- ════════════════════════════════════════════════════════════════════════════
-- Fase 8 — Ficha del lugar: "Practicar este lugar" (docs/GeoSpeed_Plan_Competencia.md §11)
--
-- La ficha ampliada del final de la partida manda un lugar al repaso de hoy: queda en la caja 1, con repaso hoy
-- (día de juego de Colombia) y contado como fallado para que my_memory() lo marque "para repasar". Las cifras y los
-- datos curiosos de la ficha viajan con la app (src/data/placeFacts.json y placeTrivia.json); el servidor no los
-- necesita. Idempotente: se aplica desde el SQL Editor (db push responde 403).
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.memory_practice(p_item text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := public.game_day(now());
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_item is null or not exists (select 1 from public.places where id = p_item) then
    return false;
  end if;
  insert into public.user_item_memory (user_id, item_id, box, next_review_on, fails, streak, mastered, last_seen_at)
  values (v_user, p_item, 1, v_today, 1, 0, false, now())
  on conflict (user_id, item_id) do update
    set box = 1,
        next_review_on = v_today,
        fails = greatest(public.user_item_memory.fails, 1),
        streak = 0,
        mastered = false,
        last_seen_at = now();
  return true;
end;
$$;
revoke all on function public.memory_practice(text) from public, anon;
grant execute on function public.memory_practice(text) to authenticated;
