import studio from '../../content/studio.json';
import copy from '../../content/copy.json';
import works from '../../content/works.json';
import reviews from '../../content/reviews.json';

export { studio, copy, works, reviews };

export type World = 'styx' | 'wkrenta';
export type Work = (typeof works.styx)[number];
export type Review = (typeof reviews.items)[number];
export const WORLDS: World[] = ['styx', 'wkrenta'];

/** Placeholders are visible (and labelled) only in dev and preview builds. */
export const showPlaceholders: boolean =
  import.meta.env.DEV || (typeof process !== 'undefined' && process.env.ALLOW_PLACEHOLDERS === '1');

const tokens: Record<string, string> = {
  NAZWA: studio.name,
  MIASTO: studio.city,
  MIASTO_MSC: studio.cityLocative,
  STYX: studio.artists.styx.name,
  WKRENTA: studio.artists.wkrenta.name,
  CZAS_ODPOWIEDZI: studio.booking.responseTime,
  WIEK: studio.booking.agePolicy,
};

/** Fills {{TOKEN}} placeholders in copy with values from content/studio.json. */
export function fill(text: string): string {
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (match, key: string) => tokens[key] ?? match);
}

const clean = (handle: string) => encodeURIComponent(handle.replace(/^@/, ''));
export const instagramUrl = (handle: string) => `https://www.instagram.com/${clean(handle)}/`;
export const facebookUrl = (handle: string) => `https://www.facebook.com/${clean(handle)}`;

type Social = { instagram: string | null; facebook: string | null };
/** Primary profile link for a person or the studio: Instagram first, then Facebook. */
export function profile(key: keyof typeof studio.social): { url: string; label: string; network: string } | null {
  const s = studio.social[key] as Social;
  if (s.instagram) return { url: instagramUrl(s.instagram), label: `@${s.instagram}`, network: 'Instagram' };
  if (s.facebook) return { url: facebookUrl(s.facebook), label: `fb.com/${s.facebook}`, network: 'Facebook' };
  return null;
}
export const allProfiles = (key: keyof typeof studio.social): string[] => {
  const s = studio.social[key] as Social;
  return [s.instagram && instagramUrl(s.instagram), s.facebook && facebookUrl(s.facebook)].filter(Boolean) as string[];
};

/** Reviews allowed on the page: real ones always, samples only in dev/preview. */
export const visibleReviews: Review[] = reviews.items.filter((r) => (!r.isPlaceholder && Boolean(r.source)) || showPlaceholders);

export const isUrl = (value: string) => /^https?:\/\//.test(value);
export const isBracket = (value: string) => /^\[.*\]$/.test(value.trim());
