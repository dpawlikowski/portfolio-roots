// Site assets built from the brand: 16 placeholder work tiles (4:5, clearly marked, never imitating a tattoo),
// the Open Graph image and the favicon set. Logo artwork comes from the brand-identity kit (set A).
import { writeFile, mkdir, readFile, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { C, fonts, textPath, grainDefs, grain, vignetteDefs, vignette, lightDefs, light, smokeDefs, smoke } from './brand-lib.mjs';

const KIT = 'brand-work/roots-tattoo/kit/A/logo';
const WORKS = 'src/assets/works';
await mkdir(WORKS, { recursive: true });
await mkdir('public', { recursive: true });

const T = (font, text, x, y, size, fill, opts = {}) => `<path d="${textPath(font, text, x, y, size, opts).d}" fill="${fill}"/>`;
const doc = (w, h, body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

// ---------- placeholder tiles ----------
const works = JSON.parse(await readFile('content/works.json', 'utf8'));
const force = process.argv.includes('--force');
// remove tiles of the old naming (mrok-*, brokat-*)
for (const f of await readdir(WORKS)) if (/^(mrok|brokat)-/.test(f)) await rm(`${WORKS}/${f}`);

const W = 1600;
const H = 2000;
for (const world of ['styx', 'wkrenta']) {
  for (const [i, work] of works[world].entries()) {
    const out = `${WORKS}/${work.src.replace(/^.*\//, '')}`;
    if (existsSync(out) && !force) continue;
    const id = `${world}${i}`;
    const isStyx = world === 'styx';
    const ground = isStyx ? '#141211' : '#170828';
    const ink = isStyx ? C.ash : '#A996C2';
    const n = String(i + 1).padStart(2, '0');
    const defs = grainDefs(`${id}g`, 3 + i) + vignetteDefs(`${id}v`) + lightDefs(`${id}l`, isStyx ? C.bone : C.pink, isStyx ? 0.14 : 0.22) + (isStyx ? smokeDefs(`${id}s`, 5 + i * 3, H) : '');
    const body = `<rect width="${W}" height="${H}" fill="${ground}"/>
      ${light(`${id}l`, W * (0.3 + (i % 3) * 0.2), H * 0.35, W * 0.9)}
      ${isStyx ? smoke(`${id}s`, W, H, 0.42) : ''}
      ${T(fonts.serifItalic, n, W / 2, H * 0.56, 560, isStyx ? C.bone : C.pink, { align: 'center' })}
      ${isStyx ? `<circle cx="${W / 2 + 330}" cy="${H * 0.56 - 30}" r="34" fill="${C.blood}"/>` : ''}
      ${T(fonts.sansBold, 'MIEJSCE NA ZDJĘCIE PRACY', W / 2, H * 0.72, 54, ink, { align: 'center', tracking: 10 })}
      ${T(fonts.sans, isStyx ? 'Styx · black & grey' : 'Wkrenta · kolor', W / 2, H * 0.72 + 90, 50, ink, { align: 'center' })}
      ${vignette(`${id}v`, W, H)}${grain(`${id}g`, W, H, 0.07)}`;
    await sharp(Buffer.from(doc(W, H, body, defs))).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
  }
}
console.log('tiles: placeholder works ready');

// ---------- placeholder portraits (square, shown in a circle; a neutral silhouette, never a likeness) ----------
const ARTISTS = 'src/assets/artists';
await mkdir(ARTISTS, { recursive: true });
const studioData = JSON.parse(await readFile('content/studio.json', 'utf8'));
for (const world of ['styx', 'wkrenta']) {
  const photo = studioData.artists[world].photo;
  const out = `${ARTISTS}/${photo.src.replace(/^.*\//, '')}`;
  if (existsSync(out) && !force) continue;
  const S = 800;
  const isStyx = world === 'styx';
  const id = `p${world}`;
  const ground = isStyx ? '#141211' : '#170828';
  const ink = isStyx ? '#3A3633' : '#3B2152';
  const defs = grainDefs(`${id}g`, 11) + vignetteDefs(`${id}v`) + lightDefs(`${id}l`, isStyx ? C.bone : C.pink, isStyx ? 0.16 : 0.24);
  const body = `<rect width="${S}" height="${S}" fill="${ground}"/>
    ${light(`${id}l`, S * 0.62, S * 0.3, S * 0.9)}
    <circle cx="400" cy="318" r="122" fill="${ink}"/>
    <path d="M140 820 L150 760 C150 560 250 480 400 480 C550 480 650 560 650 760 L660 820 Z" fill="${ink}"/>
    ${vignette(`${id}v`, S, S)}${grain(`${id}g`, S, S, 0.07)}`;
  await sharp(Buffer.from(doc(S, S, body, defs))).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
}
console.log('portraits: placeholder artist photos ready');

// ---------- logo pieces ----------
async function logo(file, recolor = {}) {
  let svg = await readFile(`${KIT}/${file}`, 'utf8');
  for (const [a, b] of Object.entries(recolor)) svg = svg.replaceAll(`fill="${a}"`, `fill="${b}"`);
  const [x0, y0, x1, y1] = svg.match(/data-ink="([^"]+)"/)[1].split(/\s+/).map(Number);
  return { inner: svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''), x0, y0, w: x1 - x0, h: y1 - y0 };
}
const place = (l, cx, cy, width) => {
  const s = width / l.w;
  return `<g transform="translate(${(cx - width / 2 - l.x0 * s).toFixed(2)} ${(cy - (l.h * s) / 2 - l.y0 * s).toFixed(2)}) scale(${s.toFixed(4)})">${l.inner}</g>`;
};
const wordmark = await logo('full-color-dark.svg', { '#f3f3f3': C.bone });
const mark = (await readFile(`${KIT}/master-symbol-small.svg`, 'utf8'))
  .replaceAll('data-color="brand-3"', `fill="${C.ash}"`)
  .replaceAll('data-color="brand-4"', `fill="${C.pink}"`)
  .replaceAll('data-color="brand-5"', `fill="${C.blood}"`)
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

// ---------- OG image (1200 × 630) ----------
{
  const w = 1200;
  const h = 630;
  const defs = grainDefs('og', 2) + vignetteDefs('ogv') + lightDefs('ogw', C.bone, 0.08) + lightDefs('ogp', C.pink, 0.12);
  const a = textPath(fonts.serif, 'Jedne korzenie.', 0, 0, 64).width;
  const b = textPath(fonts.serifItalic, 'Dwa światy.', 0, 0, 64).width;
  const x0 = w / 2 - (a + 18 + b) / 2;
  const body = `<rect width="${w}" height="${h}" fill="${C.ink}"/>${light('ogw', w * 0.25, h * 0.3, 700)}${light('ogp', w * 0.82, h * 0.75, 600)}
    ${place(wordmark, w / 2, 250, 640)}
    ${T(fonts.serif, 'Jedne korzenie.', x0, 470, 64, C.bone)}${T(fonts.serifItalic, 'Dwa światy.', x0 + a + 18, 470, 64, C.pink)}
    ${T(fonts.sansBold, 'STUDIO TATUAŻU · ŁÓDŹ', w / 2, 548, 24, C.silver, { align: 'center', tracking: 6 })}
    ${vignette('ogv', w, h)}${grain('og', w, h, 0.06)}`;
  await sharp(Buffer.from(doc(w, h, body, defs))).png({ compressionLevel: 9 }).toFile('public/og.png');
}

// ---------- favicons: the eyes mark on an ink tile ----------
const tile = (size, pad = 0.12, rx = 0.22) => {
  const inner = size * (1 - pad * 2);
  return doc(size, size, `<rect width="${size}" height="${size}" rx="${size * rx}" fill="${C.ink}"/><g transform="translate(${size * pad} ${size * pad - size * 0.04}) scale(${inner / 100})">${mark}</g>`);
};
await writeFile('public/favicon.svg', tile(64));
await sharp(Buffer.from(tile(48))).png().toFile('public/favicon-48.png');
await sharp(Buffer.from(tile(180, 0.14, 0))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(tile(192, 0.14, 0))).png().toFile('public/icon-192.png');
await sharp(Buffer.from(tile(512, 0.14, 0))).png().toFile('public/icon-512.png');
await sharp(Buffer.from(tile(512, 0.24, 0))).png().toFile('public/icon-maskable-512.png');
console.log('og + favicons ready');

// ---------- inline logo data for the site (letters follow currentColor) ----------
{
  const raw = await readFile(`${KIT}/full-color-dark.svg`, 'utf8');
  const [x0, y0, x1, y1] = raw.match(/data-ink="([^"]+)"/)[1].split(/\s+/).map(Number);
  const pad = 2;
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replaceAll('fill="#f3f3f3"', 'fill="currentColor"')
    .replace(/\s(data-[a-z-]+)="[^"]*"/g, '');
  await mkdir('src/generated', { recursive: true });
  await writeFile(
    'src/generated/logo.json',
    JSON.stringify({
      wordmark: { viewBox: `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`, inner },
      mark: { viewBox: '0 0 100 100', inner: mark.replace(/\s(data-[a-z-]+)="[^"]*"/g, '') },
    }),
  );
  console.log('logo data: src/generated/logo.json');
}
