-- ════════════════════════════════════════════════════════════════════════════
-- RevenueCat (app nativa / Google Play): el servidor también conoce lo comprado en la app
--
-- Hasta ahora `purchases` solo recibía los pagos web (Mercado Pago) y los premios de la racha. El Pro
-- comprado en Google Play vivía solo en el teléfono, así que el servidor (_is_pro) no lo veía: Sprint
-- cortaba a esos jugadores en 5 carreras, la prueba diaria de los packs Pro los marcaba sospechosos y
-- la racha les daba 1 protector en vez de 3.
--
-- Ahora el webhook de RevenueCat (Edge Function revenuecat-webhook) llama a revenuecat_apply_event()
-- con cada aviso:
--   · INITIAL_PURCHASE / RENEWAL / UNCANCELLATION / SUBSCRIPTION_EXTENDED de pro_monthly / pro_yearly
--     → una fila por transacción con su vigencia explícita (pro_until = fin del periodo que dio Google).
--   · NON_RENEWING_PURCHASE de pro_lifetime → Pro vitalicio; de lives_* → vidas ya entregadas en la
--     app (la app las suma al instante; se anotan recogidas para que la web no las vuelva a dar).
--   · CANCELLATION con motivo CUSTOMER_SUPPORT (reembolso) → compra revocada; REFUND_REVERSED la
--     restablece. Las demás cancelaciones solo apagan la renovación: el Pro sigue hasta pro_until.
--   · EXPIRATION → recorta pro_until al momento en que venció.
--   · TRANSFER → las compras de RevenueCat pasan a la nueva cuenta (al restaurar en otra cuenta).
-- El comprador es el app_user_id de RevenueCat = id de Supabase (la app hace logIn antes de cobrar).
-- Los avisos de pruebas (environment SANDBOX: probadores de la prueba interna) se guardan como
-- provider 'revenuecat_sandbox' para poder separarlos.
--
-- Idempotente: se puede pegar de nuevo en el SQL Editor.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.purchases add column if not exists pro_until timestamptz;

-- ── Lo que el jugador tiene comprado (copia de 20261018160000 + vigencias explícitas) ─────────
create or replace function public.my_entitlements()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_user     uuid := auth.uid();
  v_lifetime boolean := false;
  v_exp      timestamptz := null;
  v_until    timestamptz := null;
  v_lives    integer := 0;
  r          record;
begin
  if v_user is null then
    return jsonb_build_object('is_pro', false, 'source', null, 'expires_at', null, 'lives_pending', 0);
  end if;

  select exists (
    select 1 from public.purchases
     where user_id = v_user and pro_kind = 'lifetime' and revoked_at is null
  ) into v_lifetime;

  -- Web y premios: los periodos se encadenan (comprar otro mes antes de que venza lo extiende)
  for r in
    select created_at, pro_days from public.purchases
     where user_id = v_user and pro_kind = 'subscription' and revoked_at is null and pro_until is null
     order by created_at
  loop
    v_exp := greatest(v_exp, r.created_at) + make_interval(days => r.pro_days);
  end loop;
  -- Google Play (RevenueCat): cada periodo trae su fin
  select max(pro_until) into v_until from public.purchases
   where user_id = v_user and pro_kind = 'subscription' and revoked_at is null and pro_until is not null;
  v_exp := greatest(v_exp, v_until);

  select coalesce(sum(lives), 0) into v_lives from public.purchases
   where user_id = v_user and lives > 0 and lives_claimed_at is null and revoked_at is null;

  return jsonb_build_object(
    'is_pro', v_lifetime or (v_exp is not null and v_exp > now()),
    'source', case
                when v_lifetime then 'lifetime'
                when v_exp is not null and v_exp > now() then 'subscription'
                else null
              end,
    'expires_at', case when v_lifetime then null else v_exp end,
    'lives_pending', v_lives
  );
end $$;

-- ── ¿Es Pro? (copia de 20261022120000 + vigencias explícitas) ────────────────────────────────
create or replace function public._is_pro(p_user uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_exp   timestamptz := null;
  v_until timestamptz := null;
  r       record;
begin
  if exists (select 1 from public.purchases where user_id = p_user and pro_kind = 'lifetime' and revoked_at is null) then
    return true;
  end if;
  for r in
    select created_at, pro_days from public.purchases
     where user_id = p_user and pro_kind = 'subscription' and revoked_at is null and pro_until is null
     order by created_at
  loop
    v_exp := greatest(v_exp, r.created_at) + make_interval(days => r.pro_days);
  end loop;
  select max(pro_until) into v_until from public.purchases
   where user_id = p_user and pro_kind = 'subscription' and revoked_at is null and pro_until is not null;
  v_exp := greatest(v_exp, v_until);
  return v_exp is not null and v_exp > now();
end $$;

-- ── Un aviso de RevenueCat → purchases ───────────────────────────────────────────────────────
-- Devuelve {ok, action}. Nunca lanza por datos raros (el webhook respondería 500 y RevenueCat
-- reintentaría para siempre): lo que no sirve se ignora con su motivo.
create or replace function public.revenuecat_apply_event(p_event jsonb)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_type   text := upper(coalesce(p_event->>'type', ''));
  v_base   text := split_part(coalesce(p_event->>'product_id', ''), ':', 1);  -- Play: "pro_monthly:base-plan"
  v_tx     text := nullif(coalesce(p_event->>'transaction_id', ''), '');
  v_prov   text := case when upper(coalesce(p_event->>'environment', '')) = 'SANDBOX'
                        then 'revenuecat_sandbox' else 'revenuecat' end;
  v_uuid   text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  v_user   uuid;
  v_to     uuid;
  v_cand   text;
  v_at     timestamptz;
  v_until  timestamptz;
  v_lives  integer;
  v_kind   text;
  v_price  numeric;
  v_n      integer := 0;
begin
  if v_type = 'TEST' then
    return jsonb_build_object('ok', true, 'action', 'test');
  end if;

  -- ── Restaurar en otra cuenta: RevenueCat pasa las compras de unos usuarios a otro ──
  if v_type = 'TRANSFER' then
    for v_cand in select jsonb_array_elements_text(coalesce(p_event->'transferred_to', '[]'::jsonb)) loop
      if v_cand ~ v_uuid and exists (select 1 from auth.users where id = v_cand::uuid) then
        v_to := v_cand::uuid;
        exit;
      end if;
    end loop;
    if v_to is null then
      return jsonb_build_object('ok', true, 'action', 'transfer_no_user');
    end if;
    update public.purchases set user_id = v_to
     where provider in ('revenuecat', 'revenuecat_sandbox')
       and user_id::text in (
         select x from jsonb_array_elements_text(coalesce(p_event->'transferred_from', '[]'::jsonb)) x
          where x ~ v_uuid
       );
    get diagnostics v_n = row_count;
    return jsonb_build_object('ok', true, 'action', 'transferred', 'rows', v_n);
  end if;

  -- ── El comprador: app_user_id, original_app_user_id o un alias que sea un usuario de Supabase ──
  for v_cand in
    select x from (
      select p_event->>'app_user_id' as x, 1 as o
      union all select p_event->>'original_app_user_id', 2
      union all select jsonb_array_elements_text(coalesce(p_event->'aliases', '[]'::jsonb)), 3
    ) s
    where x ~ v_uuid
    order by o
  loop
    if exists (select 1 from auth.users where id = v_cand::uuid) then
      v_user := v_cand::uuid;
      exit;
    end if;
  end loop;

  v_lives := case v_base when 'lives_5' then 5 when 'lives_15' then 15 when 'lives_50' then 50 else 0 end;
  v_kind := case
              when v_base = 'pro_lifetime' then 'lifetime'
              when v_base in ('pro_monthly', 'pro_yearly') then 'subscription'
            end;
  if (p_event->>'purchased_at_ms') ~ '^\d{10,16}$' then
    v_at := to_timestamp((p_event->>'purchased_at_ms')::bigint / 1000.0);
  end if;
  if (p_event->>'expiration_at_ms') ~ '^\d{10,16}$' then
    v_until := to_timestamp((p_event->>'expiration_at_ms')::bigint / 1000.0);
  end if;
  if (p_event->>'price') ~ '^-?\d+(\.\d+)?$' then
    v_price := (p_event->>'price')::numeric;
  end if;

  -- ── Compras y renovaciones ──
  if v_type in ('INITIAL_PURCHASE', 'RENEWAL', 'NON_RENEWING_PURCHASE', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED') then
    if v_user is null then
      return jsonb_build_object('ok', true, 'action', 'no_user');
    end if;
    if v_lives = 0 and v_kind is null then
      return jsonb_build_object('ok', true, 'action', 'unknown_product', 'product', v_base);
    end if;
    if v_tx is null then
      return jsonb_build_object('ok', true, 'action', 'no_transaction');
    end if;
    if v_kind = 'subscription' and v_until is null then
      return jsonb_build_object('ok', true, 'action', 'no_expiration');
    end if;

    insert into public.purchases
      (provider, provider_payment_id, user_id, product_id, lives, pro_kind, pro_until,
       amount, currency, created_at, lives_claimed_at)
    values
      (v_prov, v_tx, v_user, v_base, v_lives, v_kind,
       case when v_kind = 'subscription' then v_until end,
       v_price, nullif(p_event->>'currency', ''), coalesce(v_at, now()),
       case when v_lives > 0 then coalesce(v_at, now()) end)
    on conflict (provider, provider_payment_id) do update
      set pro_until = case
                        when excluded.pro_until is null then purchases.pro_until
                        when purchases.pro_until is null then excluded.pro_until
                        else greatest(purchases.pro_until, excluded.pro_until)
                      end;
    return jsonb_build_object('ok', true, 'action', 'recorded');
  end if;

  -- ── Reembolso (las demás cancelaciones solo apagan la renovación) ──
  if v_type = 'CANCELLATION' then
    if upper(coalesce(p_event->>'cancel_reason', '')) <> 'CUSTOMER_SUPPORT' or v_tx is null then
      return jsonb_build_object('ok', true, 'action', 'renewal_off');
    end if;
    update public.purchases set revoked_at = now()
     where provider = v_prov and provider_payment_id = v_tx and revoked_at is null;
    get diagnostics v_n = row_count;
    return jsonb_build_object('ok', true, 'action', 'revoked', 'rows', v_n);
  end if;

  if v_type = 'REFUND_REVERSED' then
    if v_tx is null then
      return jsonb_build_object('ok', true, 'action', 'no_transaction');
    end if;
    update public.purchases set revoked_at = null
     where provider = v_prov and provider_payment_id = v_tx;
    get diagnostics v_n = row_count;
    return jsonb_build_object('ok', true, 'action', 'restored', 'rows', v_n);
  end if;

  -- ── Venció antes de lo previsto (p. ej. pago fallido tras el periodo de gracia) ──
  if v_type = 'EXPIRATION' then
    if v_tx is null or v_until is null then
      return jsonb_build_object('ok', true, 'action', 'no_transaction');
    end if;
    update public.purchases set pro_until = least(coalesce(pro_until, v_until), v_until)
     where provider = v_prov and provider_payment_id = v_tx and pro_kind = 'subscription';
    get diagnostics v_n = row_count;
    return jsonb_build_object('ok', true, 'action', 'expired', 'rows', v_n);
  end if;

  -- BILLING_ISSUE, SUBSCRIPTION_PAUSED, PRODUCT_CHANGE, TEMPORARY_ENTITLEMENT_GRANT, …: solo informan
  return jsonb_build_object('ok', true, 'action', 'ignored', 'type', v_type);
end $$;

-- ── Permisos: solo el webhook (service role) ────────────────────────────────────────────────
revoke all on function public.revenuecat_apply_event(jsonb) from public, anon, authenticated;
grant execute on function public.revenuecat_apply_event(jsonb) to service_role;
revoke all on function public.my_entitlements() from public, anon;
grant execute on function public.my_entitlements() to authenticated;
revoke all on function public._is_pro(uuid) from public, anon, authenticated;
