/**
 * GeoSpeed — Mercado Pago Checkout (crear preferencia de pago)
 *
 * Recibe { productId } y devuelve { url } (init_point) de Mercado Pago. El comprador sale del
 * JWT de la sesión (la app crea una sesión de invitado antes de pagar), nunca del body: así
 * cada pago queda ligado a un usuario real. El frontend redirige a esa URL; al pagar, MP llama
 * a mercadopago-webhook, que registra la compra una sola vez en public.purchases.
 *
 * "Verify JWT" debe estar apagado en esta función (supabase/config.toml): el proyecto firma las
 * sesiones con ES256 y la verificación legada las rechaza. La sesión se valida aquí con getUser().
 *
 * Cubre Colombia, México y Chile (los precios se definen por moneda local más abajo).
 *
 * Secrets requeridos (Supabase → Edge Functions → Secrets):
 *  - MP_ACCESS_TOKEN   (APP_USR-...  o TEST-...  del panel de Mercado Pago)
 *  - APP_URL           (https://geospeed-challenge.vercel.app)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Catálogo de productos. Precio en la moneda del país del comprador.
// Mercado Pago usa una cuenta por país; aquí van precios sugeridos en COP
// (ajústalos en MX/CL cuando crees esas cuentas).
interface ProductDef {
  title: string;
  // precio en pesos colombianos (moneda de la cuenta MP Colombia)
  priceCOP: number;
  kind: "pro_monthly" | "pro_yearly" | "pro_lifetime" | "lives";
}

const PRODUCTS: Record<string, ProductDef> = {
  pro_monthly:  { title: "GeoSpeed Pro — Mensual",   priceCOP: 11900,  kind: "pro_monthly" },
  pro_yearly:   { title: "GeoSpeed Pro — Anual",     priceCOP: 71900,  kind: "pro_yearly" },
  pro_lifetime: { title: "GeoSpeed Pro — Para siempre", priceCOP: 119900, kind: "pro_lifetime" },
  lives_5:      { title: "5 Vidas",  priceCOP: 3900,  kind: "lives" },
  lives_15:     { title: "15 Vidas", priceCOP: 7900,  kind: "lives" },
  lives_50:     { title: "50 Vidas", priceCOP: 19900, kind: "lives" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const appUrl = Deno.env.get("APP_URL") || "https://geospeed-challenge.vercel.app";
    if (!accessToken) return json({ error: "Mercado Pago not configured" }, 500);

    const { productId } = await req.json();
    const product = PRODUCTS[productId];
    if (!product) return json({ error: `Unknown product: ${productId}` }, 400);

    // Comprador = usuario de la sesión (anónimo o con cuenta). Sin sesión válida no hay cobro.
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: auth } = jwt.startsWith("ey") ? await admin.auth.getUser(jwt) : { data: { user: null } };
    const userId = auth?.user?.id;
    if (!userId) return json({ error: "login_required" }, 401);

    // Crear la preferencia de pago
    const preference = {
      items: [
        {
          title: product.title,
          quantity: 1,
          unit_price: product.priceCOP,
          currency_id: "COP",
        },
      ],
      // Guardamos a quién acreditar y qué compró (vuelve en el webhook)
      external_reference: JSON.stringify({ productId, userId }),
      metadata: { product_id: productId, user_id: userId },
      back_urls: {
        success: `${appUrl}/?purchase=success`,
        failure: `${appUrl}/?purchase=failure`,
        pending: `${appUrl}/?purchase=pending`,
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
    };

    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return json({ error: data?.message || "Error creando preferencia" }, 500);
    }

    // init_point = checkout real; sandbox_init_point = checkout de prueba
    const url = data.init_point || data.sandbox_init_point;
    if (!url) return json({ error: "No se obtuvo URL de pago" }, 500);

    return json({ url });
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
