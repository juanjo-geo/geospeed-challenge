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

// ─── Types ──────────────────────────────────────────────────────────

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  expiresAt: string | null;
  source: 'revenuecat' | 'mercadopago' | 'mock' | null;
}

export interface PaymentProvider {
  initialize(): Promise<void>;
  purchase(productId: string): Promise<PurchaseResult>;
  restorePurchases(): Promise<PurchaseResult>;
  getSubscriptionStatus(): Promise<SubscriptionStatus>;
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

class RevenueCatProvider implements PaymentProvider {
  private apiKey: string;
  private initialized = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_REVENUECAT_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (this.initialized || !this.apiKey) return;

    // RevenueCat Purchases.js would be loaded here:
    // import Purchases from '@revenuecat/purchases-js';
    // Purchases.configure(this.apiKey, '<app-user-id>');
    console.info(
      '[PaymentProvider] RevenueCat ready with key:',
      this.apiKey.substring(0, 8) + '...',
    );
    this.initialized = true;
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.initialized) await this.initialize();

    try {
      if (!this.apiKey) {
        throw new Error('RevenueCat API key not configured');
      }

      // In production, this would call:
      // const offerings = await Purchases.getOfferings();
      // const pkg = offerings.current?.availablePackages.find(p => p.identifier === productId);
      // if (!pkg) throw new Error(`Package ${productId} not found in offerings`);
      // const { customerInfo } = await Purchases.purchasePackage(pkg);
      // return {
      //   success: true,
      //   transactionId: customerInfo.originalAppUserId,
      // };

      return {
        success: false,
        error:
          'RevenueCat SDK not loaded — configure VITE_REVENUECAT_API_KEY and install @revenuecat/purchases-js',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    if (!this.initialized) await this.initialize();

    try {
      if (!this.apiKey) {
        return { success: false, error: 'RevenueCat API key not configured' };
      }

      // In production:
      // const customerInfo = await Purchases.restorePurchases();
      // return { success: true };

      return {
        success: false,
        error:
          'RevenueCat SDK not loaded — configure VITE_REVENUECAT_API_KEY and install @revenuecat/purchases-js',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    if (!this.initialized) await this.initialize();

    // In production:
    // const customerInfo = await Purchases.getCustomerInfo();
    // const isActive = customerInfo.entitlements.active['pro'] !== undefined;
    // const expiration = customerInfo.entitlements.active['pro']?.expirationDate ?? null;
    // return { isActive, expiresAt: expiration, source: 'revenuecat' };

    return { isActive: false, expiresAt: null, source: null };
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
      // Pide a la Edge Function de Supabase que cree la preferencia de pago.
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: { productId, userId: user?.id ?? null },
      });
      if (error) return { success: false, error: error.message };
      if (data?.error) return { success: false, error: data.error };
      if (!data?.url) return { success: false, error: 'No se pudo iniciar el pago' };

      // Redirige al checkout de Mercado Pago
      window.location.href = data.url as string;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error iniciando el pago' };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    // En web, el estado Pro se valida server-side desde player_data al iniciar sesión.
    // No hay "restaurar" como en las tiendas; el servidor ya es la fuente de verdad.
    return { success: true };
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isActive: false, expiresAt: null, source: null };
      const { data } = await supabase
        .from('player_data')
        .select('premium')
        .eq('user_id', user.id)
        .single();
      const premium = (data?.premium as { isPro?: boolean; proExpiresAt?: string | null }) || null;
      return {
        isActive: premium?.isPro === true,
        expiresAt: premium?.proExpiresAt ?? null,
        source: premium?.isPro ? 'mercadopago' : null,
      };
    } catch {
      return { isActive: false, expiresAt: null, source: null };
    }
  }
}

// ─── Auto-detection ─────────────────────────────────────────────────

function detectProvider(): PaymentProvider {
  const env = import.meta.env;

  // RevenueCat for mobile apps running inside Capacitor or Cordova
  if (env.VITE_REVENUECAT_API_KEY && (window as any).Capacitor) {
    console.info('[PaymentProvider] Detected Capacitor + RevenueCat config → using RevenueCatProvider');
    return new RevenueCatProvider();
  }

  // Mercado Pago for web (modo 'auto'). El access token vive solo en el servidor
  // (Edge Function), así que no requiere variable pública en el frontend.
  if (env.VITE_PAYMENT_MODE === 'auto') {
    console.info('[PaymentProvider] PAYMENT_MODE=auto → using MercadoPagoProvider');
    return new MercadoPagoProvider();
  }

  // Default: mock provider for development
  console.info('[PaymentProvider] No payment config detected → using MockPaymentProvider');
  return new MockPaymentProvider();
}

// ─── Singleton export ───────────────────────────────────────────────

export const paymentProvider = detectProvider();
