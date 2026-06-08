/**
 * GeoSpeed — Payment Provider Abstraction Layer
 *
 * Provides a unified interface for payment processing across platforms:
 *  - MockPaymentProvider:      Simulated delay for development / fallback
 *  - RevenueCatProvider:       RevenueCat Purchases.js for mobile app stores (Capacitor/Cordova)
 *  - StripeProvider:           Stripe Checkout redirect for web payments
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
  source: 'revenuecat' | 'stripe' | 'mock' | null;
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

// ─── Stripe Provider (web payments) ─────────────────────────────────

class StripeProvider implements PaymentProvider {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Stripe.js could be loaded here if needed for Elements:
    // const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    console.info('[PaymentProvider] Stripe provider initialized');
    this.initialized = true;
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.initialized) await this.initialize();

    try {
      // Pide a la Edge Function de Supabase que cree la sesión de Stripe Checkout.
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { productId, userId: user?.id ?? null },
      });
      if (error) return { success: false, error: error.message };
      if (data?.error) return { success: false, error: data.error };
      if (!data?.url) return { success: false, error: 'No se pudo iniciar el pago' };

      // Redirige a la página de pago segura de Stripe
      window.location.href = data.url as string;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error iniciando el pago' };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    // Stripe purchases are managed via the customer portal.
    // Direct the user to the billing portal instead.
    const portalUrl = import.meta.env.VITE_STRIPE_PORTAL_URL;
    if (portalUrl) {
      window.location.href = portalUrl;
      return { success: true };
    }
    return {
      success: false,
      error: 'Stripe customer portal not configured — set VITE_STRIPE_PORTAL_URL',
    };
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    // In production, this would query your backend:
    // const res = await fetch('/api/subscription-status');
    // const data = await res.json();
    // return { isActive: data.active, expiresAt: data.expiresAt, source: 'stripe' };

    return { isActive: false, expiresAt: null, source: null };
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

  // Stripe for web when configured (modo 'auto' + publishable key presente)
  if (env.VITE_PAYMENT_MODE === 'auto' && env.VITE_STRIPE_PUBLISHABLE_KEY && !String(env.VITE_STRIPE_PUBLISHABLE_KEY).includes('placeholder')) {
    console.info('[PaymentProvider] Detected Stripe config → using StripeProvider');
    return new StripeProvider();
  }

  // Default: mock provider for development
  console.info('[PaymentProvider] No payment config detected → using MockPaymentProvider');
  return new MockPaymentProvider();
}

// ─── Singleton export ───────────────────────────────────────────────

export const paymentProvider = detectProvider();
