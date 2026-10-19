/**
 * GeoSpeed — Mercado Pago Webhook (confirmar pago y registrarlo)
 *
 * Mercado Pago notifica solo el ID del pago. Aquí consultamos el pago a la API de MP con
 * nuestro access token (fuente de verdad: un aviso falso no puede inventar un pago aprobado)
 * y, si está 'approved', lo registramos en public.purchases UNA sola vez (único por id de pago;
 * MP suele avisar varias veces el mismo pago). La app recoge vidas y Pro con las funciones
 * my_entitlements() / claim_purchased_lives() (migración 20261018160000_purchases.sql).
 * Reembolsos y contracargos marcan la compra como revocada.
 *
 * Secrets requeridos:
 *  - MP_ACCESS_TOKEN
 *  - SUPABASE_URL                (inyectado por Supabase)
 *  - SUPABASE_SERVICE_ROLE_KEY   (inyectado por Supabase)
 *
 * MP llama sin JWT: la función debe tener "Verify JWT" apagado (supabase/config.toml).
 *   URL: https://<project>.supabase.co/functions/v1/mercadopago-webhook · Evento: payment
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Debe coincidir con el catálogo de mercadopago-checkout
const PRODUCTS: Record<string, { priceCOP: number; lives?: number; proKind?: "subscription" | "lifetime"; proDays?: number }> = {
  pro_monthly:  { priceCOP: 11900,  proKind: "subscription", proDays: 30 },
  pro_yearly:   { priceCOP: 71900,  proKind: "subscription", proDays: 365 },
  pro_lifetime: { priceCOP: 119900, proKind: "lifetime" },
  lives_5:      { priceCOP: 3900,  lives: 5 },
  lives_15:     { priceCOP: 7900,  lives: 15 },
  lives_50:     { priceCOP: 19900, lives: 50 },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REVOKED_STATUSES = new Set(["refunded", "charged_back", "cancelled"]);

Deno.serve(async (req) => {
  try {
    const accessToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!accessToken) return text("not configured", 500);

    // IPN: ?id=…&topic=payment · Webhooks: ?data.id=…&type=payment + body { type, data: { id } }
    const url = new URL(req.url);
    let body: { type?: string; topic?: string; id?: unknown; data?: { id?: unknown } } = {};
    try { body = await req.json(); } catch { /* sin body */ }
    const topic = url.searchParams.get("topic") || url.searchParams.get("type") || body.type || body.topic || null;
    const paymentId = url.searchParams.get("data.id") || url.searchParams.get("id")
      || (body.data?.id != null ? String(body.data.id) : null)
      || (body.id != null ? String(body.id) : null);

    // Solo nos interesan los pagos (merchant_order y demás se ignoran)
    if (topic && topic !== "payment") return text("ignored");
    if (!paymentId || !/^\d+$/.test(paymentId)) return text("no payment id");

    // Detalle del pago desde la API de MP
    const payResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    if (payResp.status === 404) return text("payment not found");
    if (!payResp.ok) return text("mp unavailable", 502); // MP reintentará
    const payment = await payResp.json();
    const id = String(payment.id ?? paymentId);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (REVOKED_STATUSES.has(payment.status)) {
      await supabase.from("purchases")
        .update({ revoked_at: new Date().toISOString() })
        .eq("provider", "mercadopago").eq("provider_payment_id", id).is("revoked_at", null);
      return text("revoked");
    }
    if (payment.status !== "approved") return text("not approved yet");

    // productId + userId desde external_reference (lo arma mercadopago-checkout)
    let productId = "";
    let userId = "";
    try {
      const ref = JSON.parse(payment.external_reference || "{}");
      productId = String(ref.productId || "");
      userId = String(ref.userId || "");
    } catch { /* ignore */ }

    const product = PRODUCTS[productId];
    if (!product || !UUID_RE.test(userId)) {
      console.error("[mp-webhook] pago sin producto/usuario válido", id, productId, userId);
      return text("unassignable");
    }
    const amount = Number(payment.transaction_amount);
    if (payment.currency_id !== "COP" || !(amount >= product.priceCOP)) {
      console.error("[mp-webhook] monto no coincide", id, productId, amount, payment.currency_id);
      return text("amount mismatch");
    }

    const { error } = await supabase.from("purchases").upsert({
      provider: "mercadopago",
      provider_payment_id: id,
      user_id: userId,
      product_id: productId,
      lives: product.lives ?? 0,
      pro_kind: product.proKind ?? null,
      pro_days: product.proDays ?? null,
      amount,
      currency: payment.currency_id,
    }, { onConflict: "provider,provider_payment_id", ignoreDuplicates: true });

    if (error) {
      // Usuario borrado: no tiene sentido que MP reintente
      if (error.code === "23503") {
        console.error("[mp-webhook] el usuario ya no existe", id, userId);
        return text("user gone");
      }
      console.error("[mp-webhook] error guardando la compra", id, error.message);
      return text("db error", 500); // MP reintentará; el registro es idempotente
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[mp-webhook] error", (err as Error).message);
    return text("error", 500);
  }
});

function text(body: string, status = 200) {
  return new Response(body, { status });
}
