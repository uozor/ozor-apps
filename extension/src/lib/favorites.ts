import { tools } from './catalog';

/** Shown until the user stars or unstars something. */
export const DEFAULT_FAVORITES = ['invoice', 'pdf-tools', 'image-compress', 'qr-bio', 'sales-tax'] as const;

const known = new Set(tools.map((t) => t.id));

export function defaultFavorites(): string[] {
  return DEFAULT_FAVORITES.filter((id) => known.has(id));
}

/**
 * `undefined` means the user has never saved a list, so use the defaults.
 * An empty array is a real choice and is kept.
 */
export function resolveFavorites(stored: unknown): string[] {
  if (!Array.isArray(stored)) return defaultFavorites();
  const ids = stored.filter((id): id is string => typeof id === 'string' && known.has(id));
  return [...new Set(ids)];
}

export function toggleFavorite(list: string[], id: string): string[] {
  if (!known.has(id)) return list;
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function isFavorite(list: string[], id: string): boolean {
  return list.includes(id);
}
