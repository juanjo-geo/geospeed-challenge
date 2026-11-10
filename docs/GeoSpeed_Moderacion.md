# GeoSpeed Challenge — Moderación de contenido

Google exige revisar los reportes y actuar. Revisarlos al menos una vez por semana, desde el
[editor SQL de Supabase](https://supabase.com/dashboard/project/motyvjfhupmvmfpgftku/sql/new).

## Ver los reportes abiertos

```sql
select r.id, r.created_at, r.kind, r.ref, r.reported_name, r.reason, r.target_user, p.display_name as nombre_actual
from public.content_reports r
left join public.profiles p on p.id = r.target_user
where r.status = 'open'
order by r.created_at desc;
```

## Actuar

Quitar el nombre y el avatar de un jugador (cambia `UUID` por su `target_user`):

```sql
select public.moderate_player('UUID');
```

Además bloquear la cuenta, si reincide:

```sql
select public.moderate_player('UUID', true);
```

Borrar un quiz ofensivo:

```sql
delete from public.custom_quizzes where share_code = 'CODIGO';
```

Descartar un reporte sin actuar:

```sql
update public.content_reports set status = 'dismissed', resolved_at = now() where id = 123;
```

Si `target_user` está vacío (filas históricas del ranking o una carrera de Sprint), busca al jugador por nombre:

```sql
select id, display_name from public.profiles where display_name ilike '%nombre%';
```

Después de actuar sobre un quiz o un jugador sin `target_user`, marca el reporte como resuelto cambiando `dismissed` por
`resolved` en la consulta anterior.

## Nombres anteriores al filtro

```sql
select id, display_name from public.profiles where display_name <> '' and not public._quiz_name_ok(display_name);
```
