import type { ImageMetadata } from 'astro';
import lqip from '../generated/lqip.json';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/works/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

export function workImage(file: string): ImageMetadata {
  const hit = files[`/src/assets/works/${file}`];
  if (!hit) throw new Error(`Missing work image src/assets/works/${file} (see content/works.json)`);
  return hit.default;
}

export function workPreview(file: string): { color: string; src: string } {
  const entry = (lqip as Record<string, { color: string; src: string }>)[file];
  return entry ?? { color: 'transparent', src: '' };
}
