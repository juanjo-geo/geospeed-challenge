-- Salto Ángel: el punto venía de Natural Earth (5,687, −62,062), unos 60 km al sureste de la cascada real.
-- Ahora es el de Wikidata (Q80299). Idempotente: se puede volver a pegar en el SQL Editor.
update public.places set lat = 5.97, lon = -62.536 where id = 'feat:salto-angel';
