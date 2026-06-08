/**
 * GeoSpeed — Stripe Checkout (crear sesión de pago)
 *
 * Recibe { productId, userId } y devuelve { url } de Stripe Checkout.
 * El frontend redirige a esa URL. Al pagar, Stripe llama al webhook
 * (stripe-webhook) que activa el Pro o suma las vidas en player_data.
 *
 * Secrets requeridos (Supabase → Edge Functions → Secrets):
 *  - STRIPE_SECRET_KEY        (sk_live_... o sk_test_...)
 *  - STRIPE_PRICE_PRO_MONTHLY (price_...)  precio recurrente mensual
 *  - STRIPE_PRICE_PRO_YEARLY  (price_...)  precio recurrente anual
 *  - STRIPE_PRICE_PRO_LIFETIME(price_...)  pago único
 *  - STRIPE_PRICE_LIVES_5 / _15 / _50      pagos únicos de vidas
 *  - APP_URL                  (https://geospeed-challenge.vercel.app)
 */

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Mapea el productId del juego → variable de entorno con el Price ID de Stripe
const PRICE_ENV: Record<string, string> = {
  pro_monthly: "STRIPE_PRICE_PRO_MONTHLY",
  pro_yearly: "STRIPE_PRICE_PRO_YEARLY",
  pro_lifetime: "STRIPE_PRICE_PRO_LIFETIME",
  lives_5: "STRIPE_PRICE_LIVES_5",
  lives_15: "STRIPE_PRICE_LIVES_15",
  lives_50: "STRIPE_PRICE_LIVES_50",
};

// Productos de suscripción (modo subscription); el resto son pago único
const SUBSCRIPTION_PRODUCTS = new Set(["pro_monthly", "pro_yearly"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const appUrl = Deno.env.get("APP_URL") || "https://geospeed-challenge.vercel.app";
    if (!stripeKey) {
      return json({ error: "Stripe not configured" }, 500);
    }

    const { productId, userId } = await req.json();

    const envName = PRICE_ENV[productId];
    if (!envName) {
      return json({ error: `Unknown product: ${productId}` }, 400);
    }
    const priceId = Deno.env.get(envName);
    if (!priceId) {
      return json({ error: `Price not configured for ${productId}` }, 500);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const isSubscription = SUBSCRIPTION_PRODUCTS.has(productId);

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?purchase=success`,
      cancel_url: `${appUrl}/?purchase=cancelled`,
      // Guardamos quién compra y qué, para que el webhook sepa a quién acreditar
      client_reference_id: userId || "guest",
      metadata: { productId, userId: userId || "guest" },
    });

    return json({ url: session.url });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
