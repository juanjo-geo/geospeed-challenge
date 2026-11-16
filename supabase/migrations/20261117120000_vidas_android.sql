-- Auditoría 2026-11-16 (docs/GeoSpeed_Auditoria_Promesas.md, C1): las vidas compradas en la app de Android
-- se anotaban como "ya entregadas" (lives_claimed_at) porque la app las sumaba al volver la compra. Si el pago
-- se aprobaba tarde (pendiente en Google Play) o la app se cerraba justo después de pagar, la app nunca las
-- sumaba y el servidor tampoco las daba: se perdían. Ahora quedan pendientes y la app (1.0.6+) las recoge con
-- claim_purchased_lives, igual que las compras de la web. Idempotente: solo redefine la función.
--
-- ORDEN: aplicar ANTES de publicar la app 1.0.6. Con la app 1.0.5 (que suma en el teléfono) las vidas se darían
-- dos veces; solo afecta a los verificadores de la prueba cerrada, cuyas compras son de prueba.

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
       null)  -- vidas: pendientes; la app las recoge con claim_purchased_lives (no se pierden si el pago se aprueba tarde)
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
