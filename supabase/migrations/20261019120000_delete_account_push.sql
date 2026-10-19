-- ════════════════════════════════════════════════════════════════════════════
-- Borrar la cuenta desde la app (requisito de Google Play) y cerrar push_subscriptions
--
-- 1. delete_my_account(): el propio jugador (con cuenta o invitado anónimo) borra su usuario.
--    Todo lo suyo cae en cascada: perfil, player_data, partidas y rondas, retos que creó y su
--    participación, compras, tickets de traslado y suscripciones push. Los puntajes viejos de la
--    tabla leaderboard (que solo ponían user_id en NULL) se borran explícitamente.
--    Mercado Pago / Google Play conservan su propio registro de pagos (lo exige la ley).
-- 2. push_subscriptions: antes cualquiera podía insertar o MODIFICAR cualquier fila (políticas
--    `with check (true)` / `using (true)`). Ahora los clientes no escriben la tabla directamente:
--    registran su suscripción con register_push_subscription() (por endpoint, y el user_id sale de
--    la sesión, nunca del cliente). La Edge Function send-push sigue leyendo con service role.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  -- Puntajes del ranking viejo (tenían on delete set null: quedarían con las iniciales)
  delete from public.leaderboard where user_id = v_user;
  -- El resto de los datos cuelga del usuario con on delete cascade
  delete from auth.users where id = v_user;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ── Suscripciones push: solo por función ─────────────────────────────────────
drop policy if exists "push_insert" on public.push_subscriptions;
drop policy if exists "push_update" on public.push_subscriptions;
revoke insert, update, delete on public.push_subscriptions from anon, authenticated;

create or replace function public.register_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint) > 1024
     or length(coalesce(p_p256dh, '')) > 256 or length(coalesce(p_auth, '')) > 256 then
    raise exception 'invalid subscription' using errcode = '22023';
  end if;
  insert into public.push_subscriptions (endpoint, p256dh, auth, user_id, updated_at)
  values (p_endpoint, p_p256dh, p_auth, auth.uid(), now())
  on conflict (endpoint) do update
    set p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_id = coalesce(excluded.user_id, public.push_subscriptions.user_id),
        updated_at = now();
end $$;

revoke all on function public.register_push_subscription(text, text, text) from public;
grant execute on function public.register_push_subscription(text, text, text) to anon, authenticated;
