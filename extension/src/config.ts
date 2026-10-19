/**
 * Prices, payment provider, and the Pro Plus proxy.
 * Change the values here, then rebuild. Do not put an AI provider API key in this file.
 */
export const CONFIG = {
  brand: 'GWB Tools',
  legalName: 'OZOR INC LLC',
  productName: 'GWB: Greater World Business',
  siteOrigin: 'https://greaterworldmedia.tech',
  contactEmail: 'gwm.tech@greaterworldmedia.tech',

  prices: {
    /** One-time Pro unlock, in US dollars. */
    proLifetimeUsd: 4.99,
    /** Pro Plus subscription, in US dollars per month. */
    plusMonthlyUsd: 6.99,
  },

  /**
   * 'dev' lets the Plans screen switch Free, Pro, and Pro Plus on this device.
   * No charge is made. Set this to 'live' only after ExtensionPay is filled in below.
   */
  paywallMode: 'dev' as 'dev' | 'live',

  /**
   * ExtensionPay extension id from https://extensionpay.com (Chrome, Edge, and Firefox).
   * Leave the placeholder until the owner creates the extension there.
   */
  extensionPayId: 'REPLACE_WITH_EXTENSIONPAY_ID',

  /** ExtensionPay plan nicknames. Create these two plans in the ExtensionPay dashboard. */
  plans: {
    pro: 'pro',
    plus: 'plus',
  },

  /**
   * Edge can use ExtensionPay (same Chromium build) or, later, a Microsoft Store add-on.
   * Safari always uses the App Store adapter, which is wired in the Xcode project.
   */
  edgeBilling: 'extensionpay' as 'extensionpay' | 'microsoft-store',

  /**
   * Owner-run proxy for Pro Plus only. The extension never contains a model API key.
   * Replace this with the real origin before turning on live Pro Plus, then rebuild
   * so that origin is the only extra host permission.
   */
  backendUrl: 'https://REPLACE-WITH-YOUR-PROXY.example/v1/ai',

  /** How many successful Pro Plus requests one install may make per calendar month. */
  plusMonthlyRequestLimit: 200,
} as const;

export type PaywallMode = typeof CONFIG.paywallMode;

export function isPlaceholderBackend(url: string): boolean {
  if (!url) return true;
  return /REPLACE|example\.com|example\/v1/i.test(url);
}

export function isPlaceholderExtensionPay(id: string): boolean {
  return !id || id.startsWith('REPLACE');
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
