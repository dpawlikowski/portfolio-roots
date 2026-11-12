import type { ImageMetadata } from 'astro';
import lqip from '../generated/lqip.json';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/works/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', {
  eager: true,
});

/** `src` in content/works.json is "/works/<file>" (Pages CMS media path) or a bare file name. */
export const workFile = (src: string) => src.replace(/^.*\//, '');

export function workImage(src: string): ImageMetadata {
  const file = workFile(src);
  const hit = files[`/src/assets/works/${file}`];
  if (!hit) throw new Error(`Missing work image src/assets/works/${file} (see content/works.json)`);
  return hit.default;
}

export function workPreview(src: string): { color: string; src: string } {
  const entry = (lqip as Record<string, { color: string; src: string }>)[workFile(src)];
  return entry ?? { color: 'transparent', src: '' };
}
