/**
 * GeoSpeed — Payment Provider Abstraction Layer
 *
 * Provides a unified interface for payment processing across platforms:
 *  - MockPaymentProvider:      Simulated delay for development / fallback
 *  - RevenueCatProvider:       RevenueCat Purchases.js for mobile app stores (Capacitor/Cordova)
 *  - MercadoPagoProvider:      Checkout Pro redirect for web payments (CO/MX/CL)
 *
 * Auto-detects the correct provider based on environment variables and platform.
 */

import { PURCHASE_PENDING_KEY } from './premiumSystem';

// ─── Types ──────────────────────────────────────────────────────────

export interface PurchaseResult {
  success: boolean;
  /** true si la compra abrió un checkout externo (web) y NO debe acreditarse en cliente */
  redirecting?: boolean;
  /** true si el usuario canceló el flujo de compra (no es un error que mostrar) */
  cancelled?: boolean;
  transactionId?: string;
  error?: string;
  /** 'login_required' = no se pudo crear la sesión (sin red o invitados desactivados) */
  code?: 'login_required';
}

export interface SubscriptionStatus {
  isActive: boolean;
  expiresAt: string | null;
  source: 'revenuecat' | 'mercadopago' | 'mock' | null;
}

export interface PaymentProvider {
  initialize(): Promise<void>;
  /** `campaign`: hay una campaña activa para este producto (Google Play compra su oferta / producto rebajado) */
  purchase(productId: string, opts?: { campaign?: boolean }): Promise<PurchaseResult>;
  restorePurchases(): Promise<PurchaseResult>;
  getSubscriptionStatus(): Promise<SubscriptionStatus>;
  /** Precios en la moneda del jugador según la tienda (solo nativo). id del producto → "COP 11.900". */
  getLocalPrices?(): Promise<Record<string, string>>;
}

// ─── Mock Provider (development / fallback) ─────────────────────────

class MockPaymentProvider implements PaymentProvider {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    console.info('[PaymentProvider] Mock provider initialized (dev mode)');
    this.initialized = true;
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.initialized) await this.initialize();

    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 800));

    console.info('[PaymentProvider] Mock purchase:', productId);
    return {
      success: true,
      transactionId: `mock_${Date.now()}_${productId}`,
    };
  }

  async restorePurchases(): Promise<PurchaseResult> {
    await new Promise(r => setTimeout(r, 500));
    console.info('[PaymentProvider] Mock restore purchases — nothing to restore');
    return { success: true };
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    return { isActive: false, expiresAt: null, source: 'mock' };
  }
}

// ─── RevenueCat Provider (mobile app stores) ────────────────────────

// Entitlement configurado en el panel de RevenueCat que representa "GeoSpeed Pro".
const RC_ENTITLEMENT_ID = 'pro';
// Ids de los productos en Google Play (docs/GeoSpeed_RevenueCat_Setup.md)
const RC_SUBSCRIPTION_IDS = ['pro_monthly', 'pro_yearly'];
const RC_ONE_TIME_IDS = ['lives_5', 'lives_15', 'lives_50', 'pro_lifetime', 'pro_lifetime_promo'];
/** Ofertas de Google Play (docs/GeoSpeed_Ofertas.md): id de la oferta dentro del plan base y producto de campaña */
const PLAY_WELCOME_OFFER = 'bienvenida';
const PLAY_CAMPAIGN_OFFER = 'campana';
const PLAY_LIFETIME_PROMO = 'pro_lifetime_promo';
type RcOption = { id?: string; isBasePlan?: boolean; introPhase?: { price?: { formatted?: string } } | null; fullPricePhase?: { price?: { formatted?: string } } | null; pricingPhases?: Array<{ price?: { formatted?: string } }> };
const offerIdOf = (o: RcOption) => String(o?.id ?? '').split(':')[1] ?? '';

class RevenueCatProvider implements PaymentProvider {
  private apiKey: string;
  private initialized = false;
  private rc: any = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_REVENUECAT_API_KEY || '';
  }

  /** ¿Hay clave real de RevenueCat configurada? (no el placeholder del .env) */
  private hasKey(): boolean {
    return Boolean(this.apiKey) && !this.apiKey.startsWith('rc_placeholder');
  }

  /**
   * Carga el plugin nativo bajo demanda (chunk aparte; en web nunca se llama). Sin `@vite-ignore`:
   * con él Vite dejaba el nombre del paquete tal cual en el build y la app nativa no podía cargarlo.
   */
  private async load(): Promise<any> {
    if (this.rc) return this.rc;
    this.rc = await import('@revenuecat/purchases-capacitor');
    return this.rc;
  }

  /** id del usuario de Supabase con sesión (invitado o cuenta), o null. */
  private async sessionUserId(): Promise<string | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id ?? null;
    } catch {
      return null;
    }
  }

  /**
   * RevenueCat identifica al comprador con el id de Supabase: así el webhook (revenuecat-webhook)
   * sabe a quién registrar la compra en `purchases`. Si la sesión cambió (invitado → cuenta), se
   * cambia también en RevenueCat.
   */
  private async identify(userId: string | null): Promise<void> {
    if (!userId) return;
    try {
      const { Purchases } = await this.load();
      const { appUserID } = await Purchases.getAppUserID();
      if (appUserID !== userId) await Purchases.logIn({ appUserID: userId });
    } catch (e) {
      console.warn('[PaymentProvider] RevenueCat logIn falló:', e);
    }
  }

  /** Las suscripciones (Pro mensual/anual) usan tipo 'subs'; el resto 'inapp'. */
  private isSubscription(productId: string): boolean {
    return RC_SUBSCRIPTION_IDS.includes(productId);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.hasKey()) {
      console.warn('[PaymentProvider] RevenueCat sin API key — compras nativas deshabilitadas');
      return;
    }
    try {
      const { Purchases, LOG_LEVEL } = await this.load();
      await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });

      // Liga las compras a la cuenta del usuario (Supabase) si hay sesión; si no, RevenueCat usa un
      // id anónimo y purchase() la crea e identifica antes de cobrar.
      const appUserID = (await this.sessionUserId()) ?? undefined;
      await Purchases.configure({ apiKey: this.apiKey, appUserID });
      this.initialized = true;
      console.info('[PaymentProvider] RevenueCat configurado');
    } catch (e) {
      console.warn('[PaymentProvider] Error configurando RevenueCat:', e);
    }
  }

  async purchase(productId: string, opts?: { campaign?: boolean }): Promise<PurchaseResult> {
    if (!this.hasKey()) {
      return { success: false, error: 'Las compras dentro de la app aún no están disponibles.' };
    }
    if (!this.initialized) await this.initialize();
    if (!this.initialized) {
      return { success: false, error: 'No se pudo iniciar el sistema de pagos.' };
    }

    try {
      // Como en la web: toda compra necesita un usuario en el servidor al que registrarla (el
      // webhook de RevenueCat la anota en `purchases`). Sin sesión se crea la de invitado.
      const { ensureGuestSession } = await import('@/lib/identity');
      if ((await ensureGuestSession({ force: true })) === 'unavailable') {
        return { success: false, code: 'login_required' };
      }
      const userId = await this.sessionUserId();
      if (!userId) return { success: false, code: 'login_required' };
      await this.identify(userId);

      const { Purchases } = await this.load();
      // Campaña de Pro de por vida: en Google Play es otro producto único al precio rebajado
      const storeId = opts?.campaign && productId === 'pro_lifetime' ? PLAY_LIFETIME_PROMO : productId;
      const { products } = await Purchases.getProducts({
        productIdentifiers: [storeId],
        type: this.isSubscription(productId) ? 'subs' : 'inapp',
      });
      const product = products?.[0] ?? (storeId !== productId
        ? (await Purchases.getProducts({ productIdentifiers: [productId], type: 'inapp' })).products?.[0]
        : undefined);
      if (!product) {
        return { success: false, error: `Producto no disponible (${productId}).` };
      }

      // Campaña de Pro anual: la oferta "campana" la elige la app (Google no la aplica sola). La bienvenida del plan
      // mensual sí la aplica Google Play a quien puede usarla (opción por defecto de RevenueCat).
      const campaignOption = opts?.campaign && productId === 'pro_yearly'
        ? (product.subscriptionOptions as RcOption[] | null)?.find((o) => offerIdOf(o) === PLAY_CAMPAIGN_OFFER)
        : undefined;
      const { transaction } = campaignOption
        ? await Purchases.purchaseSubscriptionOption({ subscriptionOption: campaignOption as never })
        : await Purchases.purchaseStoreProduct({ product });
      return { success: true, transactionId: transaction?.transactionIdentifier };
    } catch (e: any) {
      // Cancelación del usuario: no es un error que debamos mostrar.
      if (e?.userCancelled === true || e?.code === '1' || e?.code === 'PURCHASE_CANCELLED') {
        return { success: false, cancelled: true };
      }
      // Un pago que Google aprueba más tarde vuelve como error: se deja marcado para recoger lo que llegue
      try { localStorage.setItem(PURCHASE_PENDING_KEY, JSON.stringify({ productId, at: Date.now() })); } catch { /* ignore */ }
      return { success: false, error: e?.message || 'No se pudo completar la compra.' };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    if (!this.hasKey()) {
      return { success: false, error: 'Restaurar compras no está disponible.' };
    }
    if (!this.initialized) await this.initialize();
    if (!this.initialized) return { success: false, error: 'No se pudo iniciar el sistema de pagos.' };
    try {
      // Como al comprar: la restauración debe quedar a nombre de un usuario del servidor. Sin sesión, RevenueCat
      // la pasaba a su id anónimo y el servidor no veía el Pro (Sprint, quizzes y packs se comportaban como gratis).
      const { ensureGuestSession } = await import('@/lib/identity');
      if ((await ensureGuestSession({ force: true })) === 'unavailable') return { success: false, code: 'login_required' };
      const userId = await this.sessionUserId();
      if (!userId) return { success: false, code: 'login_required' };
      await this.identify(userId);
      const { Purchases } = await this.load();
      await Purchases.restorePurchases();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'No se pudieron restaurar las compras.' };
    }
  }

  /**
   * Precios de Google Play en la moneda del jugador. Las suscripciones llegan como
   * "pro_monthly:mensual" (producto:plan base): se guardan con el id del producto.
   */
  async getLocalPrices(): Promise<Record<string, string>> {
    if (!this.hasKey()) return {};
    if (!this.initialized) await this.initialize();
    if (!this.initialized) return {};
    const out: Record<string, string> = {};
    try {
      const { Purchases } = await this.load();
      const groups: Array<{ ids: string[]; type: 'subs' | 'inapp' }> = [
        { ids: RC_SUBSCRIPTION_IDS, type: 'subs' },
        { ids: RC_ONE_TIME_IDS, type: 'inapp' },
      ];
      for (const g of groups) {
        try {
          const { products } = await Purchases.getProducts({ productIdentifiers: g.ids, type: g.type });
          for (const p of products ?? []) {
            const id = String(p?.identifier ?? '').split(':')[0];
            if (!g.ids.includes(id)) continue;
            const opts = (p?.subscriptionOptions ?? []) as RcOption[];
            // Precio normal = el del plan base (priceString es el de la opción por defecto, que puede ser una oferta)
            const base = opts.find((o) => o.isBasePlan)?.fullPricePhase?.price?.formatted ?? p?.priceString;
            if (typeof base === 'string' && base && !out[id]) out[id] = base;
            // Ofertas que Google Play le ofrece a este jugador (solo vienen las que puede usar)
            for (const o of opts) {
              const offer = offerIdOf(o);
              const first = o.introPhase?.price?.formatted ?? o.pricingPhases?.[0]?.price?.formatted;
              if (offer === PLAY_WELCOME_OFFER && first) out[`${id}@welcome`] = first;
              if (offer === PLAY_CAMPAIGN_OFFER && first) out[`${id}@campaign`] = first;
            }
          }
        } catch (e) {
          console.warn('[PaymentProvider] No se pudieron leer los precios de la tienda:', e);
        }
      }
    } catch (e) {
      console.warn('[PaymentProvider] RevenueCat no disponible para precios:', e);
    }
    return out;
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    if (!this.hasKey()) return { isActive: false, expiresAt: null, source: null };
    if (!this.initialized) await this.initialize();
    if (!this.initialized) return { isActive: false, expiresAt: null, source: null };
    try {
      // Se llama tras iniciar sesión y al abrir la app: mantiene a RevenueCat con el usuario actual
      await this.identify(await this.sessionUserId());
      const { Purchases } = await this.load();
      const { customerInfo } = await Purchases.getCustomerInfo();
      const pro = customerInfo?.entitlements?.active?.[RC_ENTITLEMENT_ID];
      if (pro) {
        return {
          isActive: true,
          expiresAt: pro.expirationDate ?? null, // null = lifetime / compra única
          source: 'revenuecat',
        };
      }
      return { isActive: false, expiresAt: null, source: null };
    } catch {
      return { isActive: false, expiresAt: null, source: null };
    }
  }
}

// ─── Mercado Pago Provider (web payments — Colombia, México, Chile) ──

class MercadoPagoProvider implements PaymentProvider {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    console.info('[PaymentProvider] Mercado Pago provider initialized');
    this.initialized = true;
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.initialized) await this.initialize();

    try {
      // Toda compra necesita un usuario en el servidor al que acreditarla: sin sesión se crea
      // la de invitado (aunque un intento anterior fallido la haya pausado 6 h).
      const { ensureGuestSession } = await import('@/lib/identity');
      if ((await ensureGuestSession({ force: true })) === 'unavailable') {
        return { success: false, code: 'login_required' };
      }

      // La Edge Function crea la preferencia; el comprador sale del JWT de la sesión.
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: { productId },
      });
      if (error) {
        const status = (error as { context?: { status?: number } }).context?.status;
        if (status === 401) return { success: false, code: 'login_required' };
        return { success: false, error: error.message };
      }
      if (data?.error) return { success: false, error: data.error };
      if (!data?.url) return { success: false, error: 'No se pudo iniciar el pago' };

      // Redirige al checkout de Mercado Pago. La acreditación la hace el webhook
      // del servidor tras el pago real — el cliente NO debe acreditar nada aquí.
      // La marca permite recoger la compra al volver, aunque MP no regrese a la app
      // (pagos en efectivo o PSE que se aprueban más tarde).
      try { localStorage.setItem(PURCHASE_PENDING_KEY, JSON.stringify({ productId, at: Date.now() })); } catch { /* ignore */ }
      window.location.href = data.url as string;
      return { success: true, redirecting: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error iniciando el pago' };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    // En web no hay "restaurar" como en las tiendas: el servidor (tabla purchases) ya es la
    // fuente de verdad y refreshEntitlements() trae el Pro y las vidas pendientes.
    return { success: true };
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { isActive: false, expiresAt: null, source: null };
      const { data, error } = await supabase.rpc('my_entitlements');
      if (error || !data) return { isActive: false, expiresAt: null, source: null };
      const ent = data as unknown as { is_pro?: boolean; expires_at?: string | null };
      return {
        isActive: ent.is_pro === true,
        expiresAt: ent.is_pro ? (ent.expires_at ?? null) : null,
        source: ent.is_pro ? 'mercadopago' : null,
      };
    } catch {
      return { isActive: false, expiresAt: null, source: null };
    }
  }
}

// ─── Auto-detection ─────────────────────────────────────────────────

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (!cap) return false;
  // isNativePlatform() existe en Capacitor 3+; si no, basta con que exista Capacitor.
  return typeof cap.isNativePlatform === 'function' ? cap.isNativePlatform() : true;
}

function detectProvider(): PaymentProvider {
  const env = import.meta.env;

  // ⚠️ REGLA DE ORO: dentro de la app nativa (Google Play / App Store) los bienes
  // digitales DEBEN venderse con la facturación de la tienda (RevenueCat → Play
  // Billing). NUNCA Mercado Pago: Google rechaza la app. Por eso, si estamos en
  // nativo, siempre RevenueCat — aunque falte la clave (en ese caso las compras
  // muestran "no disponible", pero jamás se abre Mercado Pago).
  if (isNativeApp()) {
    console.info('[PaymentProvider] Plataforma nativa → RevenueCatProvider (Play Billing)');
    return new RevenueCatProvider();
  }

  // Web: Mercado Pago (modo 'auto'). El access token vive solo en el servidor
  // (Edge Function), así que no requiere variable pública en el frontend.
  if (env.VITE_PAYMENT_MODE === 'auto') {
    console.info('[PaymentProvider] Web PAYMENT_MODE=auto → MercadoPagoProvider');
    return new MercadoPagoProvider();
  }

  // Default: proveedor mock para desarrollo.
  console.info('[PaymentProvider] Sin config de pagos → MockPaymentProvider');
  return new MockPaymentProvider();
}

// ─── Singleton export ───────────────────────────────────────────────

export const paymentProvider = detectProvider();

/** Proveedor activo (los nombres de clase no sirven: se minifican en producción). */
export const paymentProviderKind: 'revenuecat' | 'mercadopago' | 'mock' =
  paymentProvider instanceof RevenueCatProvider ? 'revenuecat'
  : paymentProvider instanceof MercadoPagoProvider ? 'mercadopago'
  : 'mock';
