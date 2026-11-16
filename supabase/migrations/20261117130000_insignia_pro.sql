-- Auditoría 2026-11-16 (docs/GeoSpeed_Auditoria_Promesas.md, P2): la tienda promete un "Badge exclusivo" con Pro y
-- no existía. Decisión de JuanJo: marco dorado + título "Pro". Quien compra Pro (web o Google Play) gana para siempre
-- la insignia `pro_member`, que habilita el marco y el título (como las insignias de racha y logros). Los días de Pro
-- regalados por la racha (provider 'reward') no la dan. Idempotente.

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
      when 'conquistador' then 'conq_champion'
      when 'pro' then 'pro_member'
      end
    when 'frame' then case p_id
      when 'bronze' then 'streak_7' when 'silver' then 'streak_100' when 'gold' then 'streak_365'
      when 'medal' then 'ach_golds_2' when 'flame' then 'ach_combo_3' when 'globe' then 'ach_regions_3'
      when 'sniper' then 'ach_perfects_3' when 'sprint' then 'ach_sprint_2'
      when 'pro' then 'pro_member'
      end
  end
$$;
revoke all on function public._cosmetic_badge(text, text) from public, anon, authenticated;

create or replace function public._purchases_pro_badge()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.pro_kind is not null and new.revoked_at is null and new.provider <> 'reward' then
    insert into public.user_badges (user_id, badge_id) values (new.user_id, 'pro_member')
    on conflict (user_id, badge_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function public._purchases_pro_badge() from public, anon, authenticated;

drop trigger if exists purchases_pro_badge on public.purchases;
create trigger purchases_pro_badge after insert or update of user_id, revoked_at on public.purchases
  for each row execute function public._purchases_pro_badge();

-- Quienes ya compraron Pro
insert into public.user_badges (user_id, badge_id)
select distinct user_id, 'pro_member' from public.purchases
 where pro_kind is not null and revoked_at is null and provider <> 'reward' and user_id is not null
on conflict (user_id, badge_id) do nothing;
