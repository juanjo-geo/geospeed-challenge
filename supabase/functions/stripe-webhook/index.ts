/**
 * GeoSpeed — Stripe Webhook (confirmar pago y acreditar)
 *
 * Stripe llama a esta función cuando un pago se completa. Aquí (server-side,
 * fuente de verdad) activamos el Pro o sumamos vidas en player_data.
 * Verifica la firma del webhook para que nadie pueda falsificar pagos.
 *
 * Secrets requeridos:
 *  - STRIPE_SECRET_KEY
 *  - STRIPE_WEBHOOK_SECRET   (whsec_...  lo da Stripe al crear el webhook)
 *  - SUPABASE_URL            (lo inyecta Supabase automáticamente)
 *  - SUPABASE_SERVICE_ROLE_KEY (idem)
 *
 * Configurar en Stripe → Developers → Webhooks → endpoint:
 *   https://<project>.supabase.co/functions/v1/stripe-webhook
 *   Evento: checkout.session.completed
 */

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Cuántas vidas da cada pack
const LIVES_BY_PRODUCT: Record<string, number> = {
  lives_5: 5,
  lives_15: 15,
  lives_50: 50,
};

Deno.serve(async (req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const signature = req.headers.get("stripe-signature");
    const bodyText = await req.text();
    if (!signature) return new Response("No signature", { status: 400 });

    // Verifica que el evento viene realmente de Stripe
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(bodyText, signature, webhookSecret);
    } catch (err) {
      return new Response(`Webhook signature failed: ${(err as Error).message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const productId = session.metadata?.productId || "";
      const userId = session.metadata?.userId || session.client_reference_id || "";

      if (userId && userId !== "guest") {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        if (productId.startsWith("pro_")) {
          // Activar Pro
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
          // Sumar vidas dentro del JSONB energy (estructura: {lives, lastRegenTimestamp})
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
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json"