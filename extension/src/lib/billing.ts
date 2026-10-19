import { CONFIG, isPlaceholderExtensionPay, type PaywallMode } from '../config';
import {
  entitlementsFromExtPayUser,
  entitlementsFromTier,
  tierFromEntitlements,
  type Entitlements,
  type ExtPayUser,
  type Tier,
} from './paywall';

/**
 * Every store talks to GWB Tools through this interface.
 * Chrome, Edge, and Firefox use ExtensionPay. Safari and the Microsoft Store
 * have their own adapters so the UI does not care who charges the card.
 */
export interface BillingProvider {
  id: 'dev' | 'extensionpay' | 'safari-iap' | 'microsoft-store';
  getEntitlements(): Promise<Entitlements>;
  purchasePro(): Promise<void>;
  subscribePlus(): Promise<void>;
  manage(): Promise<void>;
}

export interface BillingEnv {
  mode: PaywallMode;
  extensionPayId: string;
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | string;
  edgeBilling: 'extensionpay' | 'microsoft-store';
}

export function providerIdFor(env: BillingEnv): BillingProvider['id'] {
  if (env.mode !== 'live' || isPlaceholderExtensionPay(env.extensionPayId)) return 'dev';
  if (env.browser === 'safari') return 'safari-iap';
  if (env.browser === 'edge' && env.edgeBilling === 'microsoft-store') return 'microsoft-store';
  return 'extensionpay';
}

export const SAFARI_PRODUCTS = {
  pro: 'tech.greaterworldmedia.gwbtools.pro',
  plus: 'tech.greaterworldmedia.gwbtools.plus.monthly',
} as const;

export const MICROSOFT_ADDONS = {
  pro: 'gwb.pro.lifetime',
  plus: 'gwb.plus.monthly',
} as const;

export function devEntitlements(tier: Tier): Entitlements {
  return entitlementsFromTier(tier);
}

export function tierFromDev(tier: unknown): Tier {
  return tier === 'pro' || tier === 'plus' || tier === 'free' ? tier : 'free';
}

export function tierFromExtPay(user: ExtPayUser | null | undefined): Tier {
  return tierFromEntitlements(entitlementsFromExtPayUser(user));
}

export function currentBillingEnv(browserName: string): BillingEnv {
  return {
    mode: CONFIG.paywallMode,
    extensionPayId: CONFIG.extensionPayId,
    browser: browserName,
    edgeBilling: CONFIG.edgeBilling,
  };
}
