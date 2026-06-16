/**
 * GeoSpeed — Mercado Pago Webhook (confirmar pago y acreditar)
 *
 * Mercado Pago notifica con el ID del pago (no el detalle). Aquí consultamos
 * el pago a la API de MP, verificamos que esté 'approved', y recién entonces
 * activamos Pro / sumamos vidas en player_data (server-side, no falsificable).
 *
 * Secrets requeridos:
 *  - MP_ACCESS_TOKEN
 *  - SUPABASE_URL                (inyectado por Supabase)
 *  - SUPABASE_SERVICE_ROLE_KEY   (inyectado por Supabase)
 *
 * Configurar en Mercado Pago → Webhooks, o vía notification_url de la preferencia:
 *   https://<project>.supabase.co/functions/v1/mercadopago-webhook
 *   Evento: payment
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const LIVES_BY_PRODUCT: Record<string, number> = {
  lives_5: 5,
  lives_15: 15,
  lives_50: 50,
};

Deno.serve(async (req) => {
  try {
    const accessToken = Deno.env.get("MP_ACCESS_TOKEN")!;

    // MP envía el id del pago por query (?id=...&topic=payment) o en el body (data.id)
    const url = new URL(req.url);
    let paymentId = url.searchParams.get("id") || url.searchParams.get("data.id");
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");

    if (!paymentId) {
      try {
        const body = await req.json();
        paymentId = body?.data?.id?.toString() || body?.id?.toString() || null;
      } catch { /* sin body */ }
    }

    // Solo nos interesan notificaciones de pago
    if (topic && topic !== "payment") {
      return new Response("ignored", { status: 200 });
    }
    if (!paymentId) return new Response("no payment id", { status: 200 });

    // Consultar el detalle del pago a la API de MP
    const payResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    if (!payResp.ok) return new Response("payment not found", { status: 200 });
    const payment = await payResp.json();

    // Solo acreditar si el pago está aprobado
    if (payment.status !== "approved") {
      return new Response("not approved yet", { status: 200 });
    }

    // Recuperar productId + userId desde external_reference
    let productId = "";
    let userId = "";
    try {
      const ref = JSON.parse(payment.external_reference || "{}");
      productId = ref.productId || "";
      userId = ref.userId || "";
    } catch { /* ignore */ }

    if (userId && userId !== "guest" && productId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      if (productId.startsWith("pro_")) {
        const isLifetime = productId === "pro_lifetime";
        let expiresAt: string | null = null;
        if (!isLifetime) {
          const d = new Date();
          d.setDate(d.getDate() + (productId === "pro_yearly" ? 365 : 30));
          expiresAt = d.toISOString();
        }
        await supabase.from("player_data").upsert({
          user_id: userId,
          premium: {
            isPro: true,
            proExpiresAt: expiresAt,
            proSource: isLifetime ? "lifetime" : "subscription",
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      } else if (LIVES_BY_PRODUCT[productId]) {
        const add = LIVES_BY_PRODUCT[productId];
        const { data } = await supabase
          .from("player_data")
          .select("energy")
          .eq("user_id", userId)
          .single();
        const energy = (data?.energy as { lives?: number; lastRegenTimestamp?: number }) || {};
        const current = energy.lives ?? 0;
        await supabase.from("player_data").upsert({
          user_id: userId,
          energy: { ...energy, lives: current + add },
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // Devolver 200 igual para que MP no reintente en bucle por errores nuestros
    return new Response(`handled: ${(err as Error).message}`, { status: 200 });
  }
});
