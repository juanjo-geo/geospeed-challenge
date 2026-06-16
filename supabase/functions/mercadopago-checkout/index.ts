/**
 * GeoSpeed — Mercado Pago Checkout (crear preferencia de pago)
 *
 * Recibe { productId, userId } y devuelve { url } (init_point) de Mercado Pago.
 * El frontend redirige a esa URL. Al pagar, MP llama al webhook
 * (mercadopago-webhook) que activa el Pro o suma las vidas en player_data.
 *
 * Cubre Colombia, México y Chile (los precios se definen por moneda local más abajo).
 *
 * Secrets requeridos (Supabase → Edge Functions → Secrets):
 *  - MP_ACCESS_TOKEN   (APP_USR-...  o TEST-...  del panel de Mercado Pago)
 *  - APP_URL           (https://geospeed-challenge.vercel.app)
 */

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

    const { productId, userId } = await req.json();
    const product = PRODUCTS[productId];
    if (!product) return json({ error: `Unknown product: ${productId}` }, 400);

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
      external_reference: JSON.stringify({ productId, userId: userId || "guest" }),
      metadata: { product_id: productId, user_id: userId || "guest" },
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
