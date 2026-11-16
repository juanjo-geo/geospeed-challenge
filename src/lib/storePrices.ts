/**
 * Precios locales de la tienda nativa (Google Play vía RevenueCat).
 *
 * En la web los precios se muestran en US$ (Mercado Pago cobra el equivalente en COP). Dentro de
 * la app de Android Google cobra con su propia tabla en la moneda del jugador ("COP 11.900",
 * "MX$59.00"…), así que la tienda y las ofertas deben mostrar ese texto y no el US$ del catálogo.
 *
 * Sin dependencias pesadas: lo usan la tienda, las ofertas y premiumSystem. La lectura a la tienda
 * vive en paymentProvider (RevenueCatProvider.getLocalPrices); aquí solo se guarda y se muestra.
 * Se recuerda en localStorage para que la tienda abra ya con la moneda correcta.
 */
import { useEffect, useState } from 'react';
import type { StoreProduct } from './premiumSystem';

export const STORE_PRICES_KEY = 'geospeed_store_prices';
export const STORE_PRICES_EVENT = 'geospeed:store-prices';

/** id del producto → precio como lo da la tienda ("COP 11.900"). */
export type LocalPrices = Record<string, string>;

let cache: LocalPrices | null = null;

function read(): LocalPrices {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORE_PRICES_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cache = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? sanitize(parsed) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function sanitize(input: Record<string, unknown>): LocalPrices {
  const out: LocalPrices = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === 'string' && v.trim() && v.length <= 32) out[k] = v.trim();
  }
  return out;
}

/** Guarda los precios recibidos de la tienda (los ids que no vengan conservan el valor anterior). */
export function setLocalPrices(prices: Record<string, unknown>): void {
  const next = { ...read(), ...sanitize(prices) };
  cache = next;
  try { localStorage.setItem(STORE_PRICES_KEY, JSON.stringify(next)); } catch { /* sin almacenamiento */ }
  try { window.dispatchEvent(new Event(STORE_PRICES_EVENT)); } catch { /* fuera del navegador */ }
}

/** Solo para pruebas. */
export function resetLocalPrices(): void {
  cache = null;
  try { localStorage.removeItem(STORE_PRICES_KEY); } catch { /* nada */ }
}

/** Precio local de la tienda para ese producto, o null si no lo hay (web, o la tienda no respondió). */
export function localPrice(productId: string): string | null {
  return read()[productId] ?? null;
}

/** Sufijos de periodo ya traducidos ("/mes", "/mo"…). */
export interface PeriodSuffix { month: string; year: string }

/**
 * Precio a mostrar: el de la tienda (con el periodo de las suscripciones) si existe; si no, el del
 * catálogo en US$ con el periodo traducido.
 */
export function displayPrice(product: Pick<StoreProduct, 'id' | 'type' | 'price'>, period: PeriodSuffix): string {
  const local = localPrice(product.id);
  const suffix = product.type === 'pro_monthly' ? period.month : product.type === 'pro_yearly' ? period.year : '';
  if (local) return `${local}${suffix}`;
  return product.price.replace('/mes', period.month).replace('/año', period.year);
}

/** Re-render cuando llegan precios nuevos de la tienda. */
export function useLocalPrices(): LocalPrices {
  const [prices, setPrices] = useState<LocalPrices>(() => read());
  useEffect(() => {
    const on = () => setPrices({ ...read() });
    window.addEventListener(STORE_PRICES_EVENT, on);
    return () => window.removeEventListener(STORE_PRICES_EVENT, on);
  }, []);
  return prices;
}
