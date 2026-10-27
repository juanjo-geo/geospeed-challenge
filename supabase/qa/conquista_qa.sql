-- ════════════════════════════════════════════════════════════════════════════
-- Conquista el mapa — fase C7: consultas para la prueba con el grupo real (docs/Conquista_C7_QA.md).
-- NO es una migración: se pega bloque por bloque en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/motyvjfhupmvmfpgftku/sql/new).
-- En todos los bloques, cambia ABC123 por el código de invitación del grupo de prueba (si lo regeneras durante la
-- prueba, usa el nuevo). Las horas se muestran en hora de Colombia.
-- ════════════════════════════════════════════════════════════════════════════


-- ── 0. Una sola vez: cierre automático cada 5 minutos ─────────────────────────────────────────────────────
-- Sin esto, una temporada solo se cierra cuando alguien abre el juego (el cierre perezoso también funciona).
select cron.schedule('conquest-close', '*/5 * * * *', $$select public.conq_close_due()$$);
select jobname, schedule, active from cron.job where jobname = 'conquest-close';


-- ── 1. El grupo y sus integrantes ─────────────────────────────────────────────────────────────────────────
select g.id, g.name, g.invite_code, g.qa_time_scale as escala, g.status, g.created_at at time zone 'America/Bogota' as creado
  from public.conq_groups g where g.invite_code = 'ABC123';

select m.role as rol, p.display_name as nombre, u.email, u.is_anonymous as invitado, m.muted as silenciado,
       m.joined_at at time zone 'America/Bogota' as entro
  from public.conq_groups g
  join public.conq_members m on m.group_id = g.id
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
 where g.invite_code = 'ABC123'
 order by m.joined_at;


-- ── 2. Acelerar la temporada (ANTES de pulsar INICIAR TEMPORADA) ─────────────────────────────────────────
-- Las reglas se congelan al iniciar: cambiar la escala después no afecta la temporada en curso.
-- 144 → un día = 10 min, la temporada = 70 min, la espera de 1 h = 25 s.
--  72 → un día = 20 min, la temporada = 2 h 20 min, la espera de 1 h = 50 s.
-- En tiempo real siempre: rondas de 15 s, reserva de 3 min, 30 s para abrir la primera pregunta y los últimos 3 min sin
-- iniciar misiones.
update public.conq_groups set qa_time_scale = 144 where invite_code = 'ABC123';


-- ── 3. Estado de las temporadas ───────────────────────────────────────────────────────────────────────────
select s.number as temporada, s.status as estado, (s.rules->>'time_scale')::int as escala,
       s.started_at at time zone 'America/Bogota' as inicio, s.ends_at at time zone 'America/Bogota' as cierre,
       date_trunc('second', s.ends_at - now()) as falta, jsonb_array_length(coalesce(s.roster, '[]')) as jugadores,
       case when s.started_at is not null then
         floor(extract(epoch from (now() - s.started_at)) / (86400.0 / greatest(1, (s.rules->>'time_scale')::int)))::int + 1
       end as dia_actual
  from public.conq_seasons s join public.conq_groups g on g.id = s.group_id
 where g.invite_code = 'ABC123'
 order by s.number desc;


-- ── 4. Mapa: dueño, marca y reserva de cada país (temporada en curso) ─────────────────────────────────────
select t.country_iso as pais,
       case when t.retired then 'Jugador retirado' else p.display_name end as dueno,
       t.defense as marca, t.version, t.captured_at at time zone 'America/Bogota' as capturado,
       case when t.reserved_until > now() then 'reservado ' || date_trunc('second', t.reserved_until - now()) end as reserva
  from public.conq_territories t
  join public.conq_seasons s on s.id = t.season_id and s.status = 'active'
  join public.conq_groups g on g.id = s.group_id
  left join public.profiles p on p.id = t.owner_id
 where g.invite_code = 'ABC123'
 order by t.country_iso;


-- ── 5. Clasificación en vivo (debe coincidir con la pestaña Temporada, CA17) ─────────────────────────────
select coalesce(r->>'name', 'Jugador') as jugador,
       count(t.country_iso) as territorios, coalesce(sum(t.defense), 0) as suma_marcas
  from public.conq_seasons s
  join public.conq_groups g on g.id = s.group_id
  cross join lateral jsonb_array_elements(s.roster) r
  left join public.conq_territories t on t.season_id = s.id and t.owner_id = (r->>'user_id')::uuid and not t.retired
 where g.invite_code = 'ABC123' and s.status = 'active'
 group by r->>'user_id', r->>'name'
 order by territorios desc, suma_marcas desc;


-- ── 6. Misiones (últimas 50) y cupo usado por día ─────────────────────────────────────────────────────────
select a.started_at at time zone 'America/Bogota' as inicio, p.display_name as jugador, a.country_iso as pais,
       a.kind as tipo, a.status as estado, a.outcome as resultado, a.total, a.defense_at_start as marca_rival,
       a.day_index + 1 as dia
  from public.conq_attempts a
  join public.conq_seasons s on s.id = a.season_id
  join public.conq_groups g on g.id = s.group_id
  left join public.profiles p on p.id = a.user_id
 where g.invite_code = 'ABC123'
 order by a.started_at desc
 limit 50;

-- CA09 / CA23: misiones por jugador y día (las anuladas no cuentan); nadie debe pasar de 5, ni de 2 en un país
select p.display_name as jugador, a.day_index + 1 as dia,
       count(*) filter (where a.status <> 'void') as misiones,
       max(c.n) as max_en_un_pais
  from public.conq_attempts a
  join public.conq_seasons s on s.id = a.season_id and s.status = 'active'
  join public.conq_groups g on g.id = s.group_id
  left join public.profiles p on p.id = a.user_id
  cross join lateral (select count(*) n from public.conq_attempts b
                       where b.season_id = a.season_id and b.user_id = a.user_id and b.day_index = a.day_index
                         and b.country_iso = a.country_iso and b.status <> 'void') c
 where g.invite_code = 'ABC123'
 group by p.display_name, a.day_index
 order by dia, jugador;


-- ── 7. Rondas: tiempo que contó el servidor y respuestas que llegaron tarde ───────────────────────────────
-- La latencia completa (lo que la red le suma a cada ronda) la mide el teléfono: panel "Red en esta misión" al final
-- de cada misión en los teléfonos de prueba y el evento conq_latency de GA4. Aquí solo se ve lo del servidor.
select p.display_name as jugador, a.country_iso as pais, r.idx as ronda, r.place_id as ciudad,
       r.time_s as segundos, round(r.distance_km) as km, r.points as puntos,
       case when r.received_at is null and r.closed then 'sin respuesta'
            when r.received_at > r.deadline_at then 'llegó tarde' end as nota
  from public.conq_rounds r
  join public.conq_attempts a on a.id = r.attempt_id
  join public.conq_seasons s on s.id = a.season_id
  join public.conq_groups g on g.id = s.group_id
  left join public.profiles p on p.id = a.user_id
 where g.invite_code = 'ABC123' and r.opened_at is not null
 order by a.started_at desc, r.idx
 limit 100;

-- Resumen por jugador: tiempo medio y respuestas tardías
select p.display_name as jugador, count(*) as rondas, round(avg(r.time_s), 2) as seg_promedio,
       count(*) filter (where r.received_at > r.deadline_at) as tardias,
       count(*) filter (where r.received_at is null and r.closed) as sin_respuesta
  from public.conq_rounds r
  join public.conq_attempts a on a.id = r.attempt_id
  join public.conq_seasons s on s.id = a.season_id
  join public.conq_groups g on g.id = s.group_id
  left join public.profiles p on p.id = a.user_id
 where g.invite_code = 'ABC123' and r.opened_at is not null
 group by p.display_name
 order by jugador;


-- ── 8. CA05: el paquete de cada país (las mismas 5 ciudades y orden para todos) ──────────────────────────
select k.country_iso as pais, k.place_ids as ciudades
  from public.conq_packages k
  join public.conq_seasons s on s.id = k.season_id and s.status = 'active'
  join public.conq_groups g on g.id = s.group_id
 where g.invite_code = 'ABC123'
 order by k.country_iso;


-- ── 9. Actividad (lo que ven en la pestaña Actividad) ─────────────────────────────────────────────────────
select e.id, e.created_at at time zone 'America/Bogota' as cuando, e.type as tipo, e.country_iso as pais,
       pa.display_name as actor, pp.display_name as dueno_antes, pn.display_name as dueno_despues, e.score, e.defense
  from public.conq_events e
  join public.conq_seasons s on s.id = e.season_id
  join public.conq_groups g on g.id = s.group_id
  left join public.profiles pa on pa.id = e.actor_id
  left join public.profiles pp on pp.id = e.prev_owner
  left join public.profiles pn on pn.id = e.new_owner
 where g.invite_code = 'ABC123'
 order by e.id desc
 limit 50;


-- ── 10. Forzar el cierre ahora (CA14–CA16, CA22 sin esperar) ──────────────────────────────────────────────
-- Adelanta el cierre de la temporada en curso y la cierra. La segunda llamada debe devolver 0 (CA16).
update public.conq_seasons s set ends_at = now()
  from public.conq_groups g
 where g.id = s.group_id and g.invite_code = 'ABC123' and s.status = 'active';
select public.conq_close_due() as cerradas;
select public.conq_close_due() as cerradas_otra_vez;

-- Instantánea y premios: una fila de cierre por temporada y una insignia por campeón
select s.number as temporada, c.closed_at at time zone 'America/Bogota' as cerro, c.standings
  from public.conq_closes c join public.conq_seasons s on s.id = c.season_id join public.conq_groups g on g.id = s.group_id
 where g.invite_code = 'ABC123' order by s.number;
select s.number as temporada, p.display_name as campeon, w.rank, w.award
  from public.conq_awards w join public.conq_seasons s on s.id = w.season_id join public.conq_groups g on g.id = s.group_id
  left join public.profiles p on p.id = w.user_id
 where g.invite_code = 'ABC123' order by s.number, w.rank;


-- ── 11. Abrir Conquista a todos (después de la prueba, con tu visto bueno) ────────────────────────────────
update public.feature_flags set flags = flags || '{"conquest_enabled": true}'::jsonb where id = 1;
-- Volver a ocultarla (los teléfonos de prueba y los que ya pertenecen a un grupo la siguen viendo):
-- update public.feature_flags set flags = flags || '{"conquest_enabled": false}'::jsonb where id = 1;


-- ── 12. Al terminar la prueba ─────────────────────────────────────────────────────────────────────────────
-- Las temporadas siguientes del grupo vuelven a la velocidad normal:
update public.conq_groups set qa_time_scale = 1 where invite_code = 'ABC123';
-- O borrar el grupo de prueba con todo lo suyo (temporadas, misiones, actividad, cierres). Las insignias de campeón ya
-- ganadas quedan en user_badges; para quitarlas, antes de borrar el grupo:
-- delete from public.user_badges b using public.conq_awards w, public.conq_seasons s, public.conq_groups g
--  where b.badge_id = 'conq_champion' and b.user_id = w.user_id and w.season_id = s.id and s.group_id = g.id
--    and g.invite_code = 'ABC123';
-- delete from public.conq_groups where invite_code = 'ABC123';
