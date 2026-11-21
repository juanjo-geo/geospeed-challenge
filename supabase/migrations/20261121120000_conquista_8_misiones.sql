-- Conquista: 8 misiones por día (antes 5). Decisión de JuanJo, 2026-11-21 (testers: 5 era muy poco).
-- Idempotente: se puede volver a pegar en el SQL Editor.
--
-- Las reglas se congelan en cada temporada al iniciarla (conq_seasons.rules). Esto cambia:
--  1) las reglas de las temporadas que se inicien desde ahora (_conq_rules), y
--  2) las temporadas en sala de espera o en curso que todavía tienen menos de 8 (solo suma cupo; nadie pierde nada).
-- El máximo de 2 misiones por país al día y la espera de 1 hora entre inicios sobre un mismo país no cambian.

create or replace function public._conq_rules() returns jsonb language sql immutable as $$
  select jsonb_build_object('version', 1, 'season_days', 7, 'rounds', 5, 'seconds', 15, 'threshold', 2000,
    'daily_missions', 8, 'per_country_daily', 2, 'cooldown_s', 3600, 'reservation_s', 180, 'last_minutes_s', 180,
    'first_open_s', 30, 'scale_km', 500, 'min_players', 2, 'max_players', 5, 'time_scale', 1)
$$;

update public.conq_seasons
   set rules = jsonb_set(rules, '{daily_missions}', '8'::jsonb)
 where status in ('lobby', 'active')
   and rules ? 'daily_missions'
   and (rules->>'daily_missions')::integer < 8;
