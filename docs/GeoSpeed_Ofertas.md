# Ofertas reales de la tienda

Decisión de JuanJo (2026-11-16): reemplazar la "Oferta de hoy" falsa por dos ofertas reales, con el **mismo descuento en Google Play y en la web**.

| Oferta | Producto | Descuento | Quién | Hasta cuándo |
|---|---|---|---|---|
| **Bienvenida** | Pro mensual | 50 % el primer mes | Quien nunca compró Pro | Siempre disponible |
| **Campaña** (ej. "Lanzamiento") | Pro anual y Pro de por vida | 30 % (lo eliges en cada campaña) | Todos | La fecha de fin de la campaña |

La Tienda muestra el precio normal tachado, el precio rebajado y la etiqueta ("Primer mes −50 %" o "Lanzamiento −30 % · hasta el 30 nov, 11:59 p. m."). Si una oferta no está configurada en Google Play, la app de Android no la muestra.

## Cómo funciona por dentro

- **Servidor** (migración `supabase/migrations/20261117150000_ofertas.sql`): tabla `store_campaigns` (campañas con fecha), `store_offers()` (lo que ve la tienda) y `_store_discount()` (el descuento de un jugador, solo para el servidor).
- **Web (Mercado Pago):** `mercadopago-checkout` pide el descuento al servidor y cobra el precio rebajado; `mercadopago-webhook` acepta ese monto (nunca menos del 30 % del precio normal).
- **Android (Google Play vía RevenueCat):** la bienvenida es una oferta del plan mensual que Google aplica sola a quien puede usarla. La campaña del plan anual es una oferta que la app elige. La campaña de Pro de por vida es otro producto (`pro_lifetime_promo`), porque RevenueCat todavía no maneja descuentos en productos únicos.

## Pasos de JuanJo

### 1. Supabase (una vez)
1. SQL Editor → pegar y ejecutar `supabase/migrations/20261117150000_ofertas.sql`.
2. Edge Functions → `mercadopago-checkout` → Code → pegar el archivo `supabase/functions/mercadopago-checkout/index.ts` → Deploy updates. Igual con `mercadopago-webhook`. Deja "Verify JWT" como está (apagado).

### 2. Google Play Console (una vez)
**Bienvenida (Pro mensual):**
1. Monetizar → Productos → Suscripciones → `pro_monthly` → plan base `mensual` → **Agregar oferta**.
2. ID de la oferta: `bienvenida` (exactamente así).
3. Elegibilidad: **Adquisición de clientes nuevos** → "Nunca tuvo esta suscripción".
4. Fase: **Pago único** (o "Precio de descuento por un período"), 1 mes, a **la mitad del precio** en cada país (Play calcula el resto de países si cambias el de Colombia y aceptas la conversión).
5. Activar.

**Campaña de Pro anual:**
1. `pro_yearly` → plan base `anual` → **Agregar oferta**. ID: `campana`.
2. Elegibilidad: **Determinada por el desarrollador** (la app decide cuándo usarla).
3. Fase: precio con descuento por **1 período (1 año)**, al **70 % del precio** (30 % menos).
4. Etiqueta de la oferta (Tags): `rc-ignore-offer`. Así RevenueCat no la aplica sola fuera de las campañas.
5. Activar.

**Campaña de Pro de por vida:**
1. Productos únicos → **Crear producto**: ID `pro_lifetime_promo`, nombre "GeoSpeed Pro — Para siempre (oferta)", precio = **70 % de `pro_lifetime`**, opción de compra compatible con versiones anteriores.
2. Activar.

### 3. RevenueCat (una vez)
1. Products → Import → importar `pro_lifetime_promo`.
2. Entitlements → `pro` → **Attach** `pro_lifetime_promo`.

### 4. Lanzar una campaña (cada vez)
En el SQL Editor (cambia fechas, nombres y porcentaje; el porcentaje debe ser el mismo que configuraste en Play):

```sql
insert into public.store_campaigns (id, name_es, name_en, percent, products, starts_at, ends_at)
values ('lanzamiento', 'Lanzamiento', 'Launch', 30, array['pro_yearly', 'pro_lifetime'],
        '2026-12-01 00:00-05', '2026-12-07 23:59-05');
```

Para terminarla antes: `update public.store_campaigns set ends_at = now() where id = 'lanzamiento';`

Ver las campañas: `select * from public.store_campaigns order by starts_at desc;`

**Ojo:** una campaña en Google Play depende de que existan la oferta `campana` y el producto `pro_lifetime_promo`. Si cambias el porcentaje de una campaña, cambia también esos precios en Play; si no, la web y la app cobrarían distinto.

## Pruebas
- `npm run test:revenuecat-sql`: bienvenida (solo quien nunca compró Pro), campañas activas y vencidas, gana el mayor descuento, `pro_lifetime_promo` da Pro de por vida, permisos.
- `src/test/storeOffers.test.ts`: qué oferta ve cada producto y el precio rebajado en dólares.
- En Android, con una cuenta de verificador: la bienvenida aparece si esa cuenta nunca compró Pro mensual en Google Play.
