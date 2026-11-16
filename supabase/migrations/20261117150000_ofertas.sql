-- Ofertas reales (decisión de JuanJo 2026-11-16, P6 de docs/GeoSpeed_Auditoria_Promesas.md; diseño en
-- docs/GeoSpeed_Ofertas.md). Dos ofertas, con el mismo descuento en Google Play y en la web (Mercado Pago):
--   1) Bienvenida: el primer mes de Pro mensual a mitad de precio para quien nunca compró Pro. En Google Play es la
--      oferta "bienvenida" del plan base "mensual" (elegibilidad la decide Google: cliente nuevo).
--   2) Campañas con fecha: N % menos en los productos elegidos entre starts_at y ends_at (filas de store_campaigns).
--      En Google Play: oferta "campana" del plan "anual" (determinada por el desarrollador) y el producto único
--      "pro_lifetime_promo" al precio rebajado. El porcentaje de la fila debe coincidir con el configurado en Play.
-- El servidor decide el descuento de la web (mercadopago-checkout); la app lo muestra con store_offers().
-- Idempotente.

create table if not exists public.store_campaigns (
  id        text primary key,
  name_es   text not null,
  name_en   text not null,
  percent   integer not null check (percent between 5 and 70),
  products  text[] not null check (products <@ array['pro_monthly', 'pro_yearly', 'pro_lifetime']::text[]),
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  check (ends_at > starts_at)
);
alter table public.store_campaigns enable row level security;
revoke all on public.store_campaigns from anon, authenticated;

create or replace function public._welcome_percent() returns integer language sql immutable as $$ select 50 $$;

-- Nunca compró Pro (los días de Pro regalados por la racha no cuentan)
create or replace function public._welcome_eligible(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_user is null or not exists (
    select 1 from public.purchases
     where user_id = p_user and pro_kind is not null and provider <> 'reward'
  )
$$;

-- Descuento que corresponde a un producto para un jugador: el mayor entre la bienvenida y las campañas activas.
-- {percent, reason: 'welcome' | 'campaign' | null, campaign, ends_at}
create or replace function public._store_discount(p_product text, p_user uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_best integer := 0;
  v_out  jsonb := jsonb_build_object('percent', 0, 'reason', null);
  c      public.store_campaigns;
begin
  if p_product = 'pro_monthly' and public._welcome_eligible(p_user) then
    v_best := public._welcome_percent();
    v_out := jsonb_build_object('percent', v_best, 'reason', 'welcome');
  end if;
  for c in select * from public.store_campaigns
            where p_product = any (products) and now() >= starts_at and now() < ends_at
            order by percent desc limit 1 loop
    if c.percent > v_best then
      v_out := jsonb_build_object('percent', c.percent, 'reason', 'campaign', 'campaign', c.id, 'ends_at', c.ends_at);
    end if;
  end loop;
  return v_out;
end $$;

-- Lo que la tienda muestra: la bienvenida (si este jugador puede usarla) y las campañas activas, con su fin real
create or replace function public.store_offers()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'server_now', now(),
    'welcome', jsonb_build_object('eligible', public._welcome_eligible(auth.uid()), 'percent', public._welcome_percent(),
                                  'product', 'pro_monthly'),
    'campaigns', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name_es', name_es, 'name_en', name_en,
                                  'percent', percent, 'products', to_jsonb(products), 'ends_at', ends_at) order by ends_at)
                             from public.store_campaigns where now() >= starts_at and now() < ends_at), '[]'::jsonb)
  )
$$;

revoke all on function public._welcome_percent() from public, anon, authenticated;
revoke all on function public._welcome_eligible(uuid) from public, anon, authenticated;
revoke all on function public._store_discount(text, uuid) from public, anon, authenticated;
grant execute on function public._store_discount(text, uuid) to service_role;
revoke all on function public.store_offers() from public;
grant execute on function public.store_offers() to anon, authenticated;

-- Google Play: el producto de campaña de Pro de por vida da el mismo Pro de por vida
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
              when v_base in ('pro_lifetime', 'pro_lifetime_promo') then 'lifetime'  -- promo = precio de campaña
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
