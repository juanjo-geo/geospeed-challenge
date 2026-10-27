-- Correcciones de lugares (bloque R3, auditoría de Wikidata contra el catálogo). Idempotente: se puede volver a pegar.
--
-- 1) Cataratas del Iguazú: el punto de Natural Earth caía 20 km al oeste, del lado de Paraguay. Ahora es la Garganta del
--    Diablo, en la frontera entre Argentina y Brasil.
update public.places set lat = -25.695, lon = -54.437 where id = 'feat:iguazu';

-- 2) Río Colorado: su contorno traía también el río Colorado de Argentina (Natural Earth junta ríos homónimos en una sola
-- entrada y el recuadro de scripts/build-features.mjs solo filtraba entradas completas). Tocar el de Argentina contaba como
-- tocar el de EE. UU. Ahora solo quedan los tramos de EE. UU. y México, y el punto de referencia pasa a Colorado.

update public.places set lat = 39.099, lon = -108.434 where id = 'feat:colorado-rio';

delete from public.place_shapes where place_id = 'feat:colorado-rio';
insert into public.place_shapes (place_id, ring_no, lons, lats, is_line) values
  ('feat:colorado-rio', 0, array[-114.377,-114.125,-114.164]::double precision[], array[34.54,34.317,34.253]::double precision[], true),
  ('feat:colorado-rio', 1, array[-114.591,-114.645]::double precision[], array[35.353,35.631]::double precision[], true),
  ('feat:colorado-rio', 2, array[-114.741,-114.669,-114.505,-114.183,-114.005,-113.636]::double precision[], array[36.014,36.122,36.156,36.03,36.195,35.831]::double precision[], true),
  ('feat:colorado-rio', 3, array[-110.368,-110.916,-111.431,-111.473]::double precision[], array[37.898,37.157,37.003,36.932]::double precision[], true),
  ('feat:colorado-rio', 4, array[-114.721,-115.199,-115.126,-114.934]::double precision[], array[32.724,32.124,31.988,31.901]::double precision[], true),
  ('feat:colorado-rio', 5, array[-114.164,-114.418,-114.509,-114.522,-114.702,-114.704,-114.469,-114.516,-114.721]::double precision[], array[34.253,34.051,33.904,33.608,33.418,33.17,32.912,32.773,32.724]::double precision[], true),
  ('feat:colorado-rio', 6, array[-114.591,-114.611,-114.379]::double precision[], array[35.353,34.907,34.541]::double precision[], true),
  ('feat:colorado-rio', 7, array[-114.741,-114.645]::double precision[], array[36.014,35.631]::double precision[], true),
  ('feat:colorado-rio', 8, array[-112.876,-113.296,-113.356,-113.636]::double precision[], array[36.28,36.048,35.764,35.831]::double precision[], true),
  ('feat:colorado-rio', 9, array[-111.473,-111.852,-111.826,-111.891,-112.459,-112.533,-112.881]::double precision[], array[36.932,36.488,36.206,36.081,36.229,36.401,36.28]::double precision[], true),
  ('feat:colorado-rio', 10, array[-105.861,-106.401,-106.638,-106.877,-107.235,-107.847,-108.242,-108.434,-108.952,-109.196,-109.363,-109.635,-109.897,-110.248,-110.368]::double precision[], array[40.165,40.062,39.894,39.902,39.602,39.557,39.315,39.099,39.198,39.033,38.734,38.546,38.165,37.895,37.898]::double precision[], true),
  ('feat:colorado-rio', 11, array[-105.846,-105.821]::double precision[], array[40.404,40.185]::double precision[], true);
