-- Packs Pro: correcciones de datos de Natural Earth verificadas contra Wikidata (punto 11, 2026-10-30).
-- El cliente ya las trae en src/data/proPack*.{ts,json} (scripts/pro-pack-fixes.mjs). Idempotente: se puede correr
-- más de una vez.

-- 1) Napo y Tungurahua (Ecuador) tenían cada uno el contorno del otro: tocar la Tungurahua real contaba como fallo.
--    Se intercambian solo si Ambato (capital de Tungurahua) todavía no queda dentro del contorno de Tungurahua.
do $$
begin
  if exists (select 1 from public.place_shapes where place_id = 'div:ec-tungurahua')
     and exists (select 1 from public.place_shapes where place_id = 'div:ec-napo')
     and public.shape_distance_km('div:ec-tungurahua', -1.2696, -78.62) > 0 then
    update public.place_shapes set ring_no = ring_no + 1000 where place_id = 'div:ec-napo';
    update public.place_shapes set place_id = 'div:ec-napo' where place_id = 'div:ec-tungurahua';
    update public.place_shapes set place_id = 'div:ec-tungurahua', ring_no = ring_no - 1000
      where place_id = 'div:ec-napo' and ring_no >= 1000;
  end if;
end $$;
update public.places set lat = -0.665, lon = -77.821 where id = 'div:ec-napo';
update public.places set lat = -1.284, lon = -78.508 where id = 'div:ec-tungurahua';

-- 2) Nombres equivocados (el juego muestra los del cliente; la sala en vivo y la pantalla para proyectar leen estos)
update public.places set name = 'Bocas del Toro' where id = 'div:pa-comarca-ngabe-bugle'; -- no era la comarca
update public.places set name = 'Elías Piña' where id = 'div:do-la-estrelleta';           -- nombre viejo de la provincia
update public.places set name = 'Ciudad de México' where id = 'ci:mx-mexico-city';
update public.places set name = 'Ciudad de Panamá' where id = 'ci:pa-panama-city';
update public.places set name = 'Ciudad de Guatemala' where id = 'ci:gt-guatemala-city';
update public.places set name = 'Port-de-Paix' where id = 'ci:ht-port-de-paix';

-- 3) "El Progreso" (Guatemala) era Guastatoya, la capital del departamento, con el punto corrido 9 km
update public.places set name = 'Guastatoya', lat = 14.8539, lon = -90.0686 where id = 'ci:gt-el-progreso';

-- 4) Puntos equivocados: Mazatlán estaba en Sonora (a 744 km de la real) y General Eugenio A. Garay en un fortín del
--    Chaco; el lugar con ese nombre (el que describen la ficha y la reseña) es el municipio de Guairá
update public.places set lat = 23.2167, lon = -106.4083 where id = 'ci:mx-mazatlan';
update public.places set lat = -25.75, lon = -56.433 where id = 'ci:py-general-eugenio-alejandrino-garay';
