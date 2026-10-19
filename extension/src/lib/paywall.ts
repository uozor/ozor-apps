import { CONFIG, formatUsd } from '../config';

export type Tier = 'free' | 'pro' | 'plus';

export const FEATURE_TIER = {
  tools: 'free',
  favorites: 'free',
  search: 'free',
  'page-pdf': 'pro',
  'page-markdown': 'pro',
  'page-text': 'pro',
  'page-notes': 'pro',
  'page-qr': 'pro',
  'table-csv': 'pro',
  'table-xlsx': 'pro',
  contacts: 'pro',
  screenshot: 'pro',
  'send-images': 'pro',
  'send-pdfs': 'pro',
  'prefill-invoice': 'pro',
  'context-menu': 'pro',
  tips: 'pro',
  'ai-summarize': 'pro',
  'ai-rewrite': 'pro',
  'ai-translate': 'pro',
  'ai-invoice-line': 'pro',
  'ai-title': 'pro',
  'ai-explain': 'pro',
  'ai-chat': 'plus',
  'ai-extract-structured': 'plus',
  'ai-draft-email': 'plus',
  'ai-draft-quote': 'plus',
  'ai-multi-summary': 'plus',
  'ai-form-fill': 'plus',
} as const;

export type FeatureId = keyof typeof FEATURE_TIER;

const RANK: Record<Tier, number> = { free: 0, pro: 1, plus: 2 };

export function tierRank(tier: Tier): number {
  return RANK[tier];
}

export function tierAllows(tier: Tier, feature: FeatureId): boolean {
  return RANK[tier] >= RANK[FEATURE_TIER[feature]];
}

export function requiredTier(feature: FeatureId): Tier {
  return FEATURE_TIER[feature];
}

export function lockMessage(feature: FeatureId): string {
  if (FEATURE_TIER[feature] === 'plus') {
    return `This is a Pro Plus feature (${formatUsd(CONFIG.prices.plusMonthlyUsd)}/month). It sends only the text you choose to your own server. Subscribe to use it.`;
  }
  return `This is a Pro feature (${formatUsd(CONFIG.prices.proLifetimeUsd)} once). Unlock Pro to use it. The page stays on your device.`;
}

export interface Entitlements {
  proLifetime: boolean;
  plusActive: boolean;
}

export function entitlementsFromTier(tier: Tier): Entitlements {
  if (tier === 'plus') return { proLifetime: true, plusActive: true };
  if (tier === 'pro') return { proLifetime: true, plusActive: false };
  return { proLifetime: false, plusActive: false };
}

export function tierFromEntitlements(e: Entitlements | null | undefined): Tier {
  if (e?.plusActive) return 'plus';
  if (e?.proLifetime) return 'pro';
  return 'free';
}

export interface ExtPayUser {
  paid?: boolean;
  paidAt?: string | null;
  subscriptionStatus?: string | null;
  plan?: { nickname?: string | null; interval?: string | null; unitAmountCents?: number | null } | null;
}

/**
 * Map an ExtensionPay user to the two products.
 * Pro is a one-time plan with no billing interval.
 * Pro Plus is a subscription; only active or trialing counts.
 */
export function entitlementsFromExtPayUser(
  user: ExtPayUser | null | undefined,
  plans: { pro: string; plus: string } = CONFIG.plans,
): Entitlements {
  if (!user?.paid) return { proLifetime: false, plusActive: false };
  const nick = user.plan?.nickname || '';
  const interval = user.plan?.interval || null;
  const status = user.subscriptionStatus || null;
  const subLive = status === 'active' || status === 'trialing';
  const recurring = interval === 'month' || interval === 'year' || interval === 'week' || interval === 'day';
  const isPlusPlan = nick === plans.plus || (recurring && nick !== plans.pro);
  if (isPlusPlan) return { proLifetime: false, plusActive: subLive };
  return { proLifetime: true, plusActive: false };
}

export const CONTEXT_MENU = [
  { id: 'md', title: 'Copy selection as Markdown', feature: 'page-markdown', action: 'markdown' },
  { id: 'text', title: 'Copy selection as clean text', feature: 'page-text', action: 'text' },
  { id: 'pdf', title: 'Save selection as PDF', feature: 'page-pdf', action: 'pdf' },
  { id: 'notes', title: 'Save selection as a note', feature: 'page-notes', action: 'notes' },
  { id: 'qr', title: 'QR code for this page', feature: 'page-qr', action: 'qr' },
  { id: 'table', title: 'Extract tables to CSV', feature: 'table-csv', action: 'tables' },
  { id: 'contacts', title: 'Extract emails, phones, and links', feature: 'contacts', action: 'contacts' },
  { id: 'shot', title: 'Screenshot this page', feature: 'screenshot', action: 'screenshot' },
  { id: 'images', title: 'Send images to the compressor', feature: 'send-images', action: 'images' },
  { id: 'pdfs', title: 'Send PDFs to the merge tool', feature: 'send-pdfs', action: 'pdfs' },
  { id: 'invoice', title: 'Start an invoice from the selection', feature: 'prefill-invoice', action: 'invoice' },
] as const;

export type MenuAction = (typeof CONTEXT_MENU)[number]['action'];
