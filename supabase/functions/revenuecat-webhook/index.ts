/**
 * GeoSpeed — RevenueCat Webhook (compras de la app nativa / Google Play)
 *
 * RevenueCat avisa cada compra, renovación, reembolso, vencimiento o transferencia. Aquí solo se
 * comprueba la clave del encabezado Authorization y se pasa el aviso a la función SQL
 * public.revenuecat_apply_event() (migración 20261109120000_revenuecat.sql), que lo anota en
 * public.purchases de forma idempotente. Así el servidor sabe quién es Pro aunque haya pagado en
 * Google Play (Sprint, packs Pro, protectores de la racha).
 *
 * Secrets requeridos:
 *  - REVENUECAT_WEBHOOK_AUTH     el mismo valor que se pone en RevenueCat → Integrations → Webhooks
 *                                → "Authorization header value" (una clave larga inventada)
 *  - SUPABASE_URL                (inyectado por Supabase)
 *  - SUPABASE_SERVICE_ROLE_KEY   (inyectado por Supabase)
 *
 * RevenueCat llama sin JWT de Supabase: la función debe tener "Verify JWT" apagado (supabase/config.toml).
 *   URL: https://<project>.supabase.co/functions/v1/revenuecat-webhook
 * Respuestas: 200 = procesado o ignorado con motivo · 401 = clave incorrecta · 500 = error de base de
 * datos (RevenueCat reintenta; el registro es idempotente).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return text("method not allowed", 405);
    const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
    if (!expected) return text("not configured", 500);

    const got = (req.headers.get("Authorization") || "").trim();
    if (!sameSecret(got, expected) && !sameSecret(got, `Bearer ${expected}`)) {
      return text("unauthorized", 401);
    }

    let body: { event?: Record<string, unknown> } = {};
    try { body = await req.json(); } catch { return text("bad json", 400); }
    const event = body.event;
    if (!event || typeof event !== "object") return text("no event", 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase.rpc("revenuecat_apply_event", { p_event: event });
    if (error) {
      console.error("[rc-webhook] error guardando el aviso", event.type, event.transaction_id, error.message);
      return text("db error", 500);
    }
    const result = (data ?? {}) as { action?: string };
    if (result.action === "no_user" || result.action === "unknown_product") {
      // No se reintenta: queda en el registro de la función para revisarlo
      console.warn("[rc-webhook]", result.action, event.type, event.product_id, event.app_user_id);
    }
    return new Response(JSON.stringify({ received: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[rc-webhook] error", (err as Error).message);
    return text("error", 500);
  }
});

/** Comparación en tiempo constante (no revela cuántos caracteres coinciden). */
function sameSecret(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

function text(body: string, status = 200) {
  return new Response(body, { status });
}
