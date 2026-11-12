// Roots Tattoo social kit, set A "Dwa spojrzenia". Editorial, premium: restraint over effects.
// Palette is the guideline palette only (ink, bone, ash, pink, blood; ultraviolet night as Wkrenta's ground).
// Readability floor on a 1080 canvas: labels ≥ 26 px, body ≥ 40 px (≈ 9.5 / 14.5 px on a 390 px phone feed).
// Logos come from the brand-identity kit (brand-work/roots-tattoo/kit/A/logo).
import { mkdir, writeFile, readFile, copyFile, readdir } from 'node:fs/promises';
import sharp from 'sharp';
import { C, fonts, textPath, wrap, grainDefs, grain, vignetteDefs, vignette, lightDefs, light, smokeDefs, smoke } from './brand-lib.mjs';

const OUT = 'brand';
const KIT = 'brand-work/roots-tattoo/kit/A';
for (const d of ['logo', 'avatars', 'covers', 'posts', 'highlights']) await mkdir(`${OUT}/${d}`, { recursive: true });

// ---------- logo from the kit ----------
async function loadLogo(file, recolor = {}) {
  let svg = await readFile(`${KIT}/logo/${file}`, 'utf8');
  for (const [from, to] of Object.entries(recolor)) svg = svg.replaceAll(`fill="${from}"`, `fill="${to}"`);
  const [x0, y0, x1, y1] = svg.match(/data-ink="([^"]+)"/)[1].split(/\s+/).map(Number);
  return { inner: svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''), x0, y0, w: x1 - x0, h: y1 - y0 };
}
const place = (logo, x, y, width, { center = false } = {}) => {
  const s = width / logo.w;
  const tx = (center ? x - width / 2 : x) - logo.x0 * s;
  const ty = (center ? y - (logo.h * s) / 2 : y) - logo.y0 * s;
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">${logo.inner}</g>`;
};
const onDark = await loadLogo('full-color-dark.svg', { '#f3f3f3': C.bone });
const markInner = (await readFile(`${KIT}/logo/master-symbol-small.svg`, 'utf8'))
  .replaceAll('data-color="brand-3"', `fill="${C.ash}"`)
  .replaceAll('data-color="brand-4"', `fill="${C.pink}"`)
  .replaceAll('data-color="brand-5"', `fill="${C.blood}"`)
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

// ---------- system ----------
const W = 1080;
const H = 1350;
const M = 72; // margin
const doc = (w, h, body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
async function save(path, svg) {
  await writeFile(`${OUT}/${path}.svg`, svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(`${OUT}/${path}.png`);
}
const T = (font, text, x, y, size, fill, opts = {}) => `<path d="${textPath(font, text, x, y, size, opts).d}" fill="${fill}"/>`;
const label = (text, x, y, fill, align = 'left', size = 28) => T(fonts.sansBold, text, x, y, size, fill, { tracking: 4, align });
const rule = (x, y, w, fill, o = 0.35) => `<rect x="${x}" y="${y}" width="${w}" height="1.5" fill="${fill}" opacity="${o}"/>`;
/** Catalogue row: same on every post, top (header) or bottom (footer). */
const row = (y, fg, topic, index, { line = 'below' } = {}) =>
  `${label('ROOTS TATTOO · ŁÓDŹ', M, y, fg)}${label(`${topic}  №${index}`, W - M, y, fg, 'right')}${rule(M, line === 'below' ? y + 26 : y - 50, W - 2 * M, fg)}`;
/** Ink stage: one warm light, a second soft pink light for the two temperatures, grain, vignette. */
const stage = (id, w, h, { warm = [0.25, 0.2], pinkLight = null, ground = C.ink } = {}) => ({
  defs: grainDefs(`${id}g`, 7) + vignetteDefs(`${id}v`) + lightDefs(`${id}w`, C.bone, 0.075) + lightDefs(`${id}p`, C.pink, 0.11),
  base: `<rect width="${w}" height="${h}" fill="${ground}"/>${light(`${id}w`, w * warm[0], h * warm[1], Math.max(w, h) * 0.7)}${pinkLight ? light(`${id}p`, w * pinkLight[0], h * pinkLight[1], Math.max(w, h) * 0.6) : ''}`,
  top: `${vignette(`${id}v`, w, h)}${grain(`${id}g`, w, h, 0.06)}`,
});
/** Photo slot: plain, labelled, never mistaken for a tattoo. */
function slot(x, y, w, h, { tone = 'ink', rx = 0, text = 'ZDJĘCIE PRACY' } = {}) {
  const bg = tone === 'ink' ? '#1A1817' : '#20102E';
  const fg = tone === 'ink' ? C.ash : '#A996C2';
  const id = `s${x}_${y}_${w}`;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath>
    <g clip-path="url(#${id})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>
    <path d="M${x} ${y} L${x + w} ${y + h} M${x + w} ${y} L${x} ${y + h}" stroke="${fg}" stroke-opacity=".18" stroke-width="1.5"/></g>
    ${label(text, x + w / 2, y + h / 2 - 6, fg, 'center', 28)}
    ${T(fonts.sans, `${w} × ${h} px · tylko własne zdjęcia`, x + w / 2, y + h / 2 + 34, 22, fg, { align: 'center' })}`;
}
/** "Styx" followed by a blood-red full stop. align: left | center. */
const styxName = (x, y, size, align = 'left') => {
  const w = textPath(fonts.serif, 'Styx', 0, 0, size).width;
  const dot = size * 0.075;
  const total = w + size * 0.06 + dot * 2;
  const x0 = align === 'center' ? x - total / 2 : x;
  return `${T(fonts.serif, 'Styx', x0, y, size, C.bone)}<circle cx="${(x0 + w + size * 0.06 + dot).toFixed(1)}" cy="${(y - dot).toFixed(1)}" r="${dot.toFixed(1)}" fill="${C.blood}"/>`;
};
/** Two-tone line: bone serif + pink italic, measured so it can be centred. */
const twoTone = (a, b, x, y, size, align = 'left') => {
  const wa = textPath(fonts.serif, a, 0, 0, size).width;
  const gap = size * 0.28;
  const wb = textPath(fonts.serifItalic, b, 0, 0, size).width;
  const x0 = align === 'center' ? x - (wa + gap + wb) / 2 : x;
  return `${T(fonts.serif, a, x0, y, size, C.bone)}${T(fonts.serifItalic, b, x0 + wa + gap, y, size, C.pink)}`;
};
const star = (cx, cy, r, fill) => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    p.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `<polygon points="${p.join(' ')}" fill="${fill}"/>`;
};

// ---------- logo files ----------
for (const f of ['full-color-dark', 'full-color', 'one-color-dark', 'one-color-light', 'app-icon-512']) {
  for (const ext of ['svg', 'png']) await copyFile(`${KIT}/logo/${f}.${ext}`, `${OUT}/logo/roots-${f}.${ext}`);
}
await copyFile(`${KIT}/roots-tattoo-guidelines.pdf`, `${OUT}/roots-tattoo-ksiega-znaku.pdf`);

// ---------- avatars (1080, read as a circle: keep everything inside r = 440) ----------
{
  const s = stage('av', 1080, 1080, { warm: [0.4, 0.3], pinkLight: [0.75, 0.7] });
  await save('avatars/avatar-studio', doc(1080, 1080, `${s.base}<g transform="translate(270 238) scale(5.4)">${markInner}</g>${s.top}`, s.defs));

  const x = stage('ax', 1080, 1080, { warm: [0.5, 0.35] });
  await save('avatars/avatar-styx', doc(1080, 1080, `${x.base}${smoke('axs', 1080, 1080, 0.3)}
    ${styxName(540, 610, 290, 'center')}${x.top}`, x.defs + smokeDefs('axs', 4, 1080)));

  const w = stage('aw', 1080, 1080, { warm: [0.5, 0.3], pinkLight: [0.5, 0.55], ground: C.night });
  await save('avatars/avatar-wkrenta', doc(1080, 1080, `${w.base}${T(fonts.pop, 'Wkrenta', 540, 600, 170, C.pink, { align: 'center' })}${w.top}`, w.defs));
}

// ---------- Facebook covers (1640 × 624; content inside the centre 1200 px) ----------
{
  const cw = 1640;
  const ch = 624;
  const s = stage('fc', cw, ch, { warm: [0.22, 0.4], pinkLight: [0.85, 0.6] });
  await save('covers/fb-studio', doc(cw, ch, `${s.base}
    ${place(onDark, cw / 2, 205, 600, { center: true })}
    ${twoTone('Jedne korzenie.', 'Dwa światy.', cw / 2, 432, 68, 'center')}
    ${label('STYX — CZERŃ I SZAROŚĆ', cw / 2 - 36, 500, C.silver, 'right')}<circle cx="${cw / 2}" cy="491" r="4" fill="${C.ash}"/>${label('WKRENTA — KOLOR', cw / 2 + 36, 500, C.silver)}${s.top}`, s.defs));

  const x = stage('fs', cw, ch, { warm: [0.3, 0.25] });
  await save('covers/fb-styx', doc(cw, ch, `${x.base}${smoke('fss', cw, ch, 0.32)}
    ${styxName(cw / 2, 360, 300, 'center')}
    ${label('REALIZM · CZERŃ I SZAROŚĆ · ROOTS TATTOO ŁÓDŹ', cw / 2, 470, C.silver, 'center', 28)}${x.top}`, x.defs + smokeDefs('fss', 11, ch)));

  const w = stage('fw', cw, ch, { warm: [0.3, 0.3], pinkLight: [0.7, 0.5], ground: C.night });
  await save('covers/fb-wkrenta', doc(cw, ch, `${w.base}
    ${T(fonts.pop, 'Wkrenta', cw / 2, 360, 200, C.pink, { align: 'center' })}
    ${label('KOLOROWY REALIZM · POP · ROOTS TATTOO ŁÓDŹ', cw / 2, 470, C.lilac, 'center', 28)}${w.top}`, w.defs));
}

// ---------- Instagram posts (1080 × 1350) ----------
// 00 · launch
{
  const s = stage('p0', W, H, { warm: [0.2, 0.25], pinkLight: [0.85, 0.75] });
  await save('posts/00-nowa-odslona', doc(W, H, `${s.base}${row(110, C.ash, 'NOWA ODSŁONA', '00')}
    ${place(onDark, W / 2, 480, 820, { center: true })}
    ${T(fonts.serif, 'Jedne korzenie.', M, 920, 116, C.bone)}
    ${T(fonts.serifItalic, 'Dwa światy.', M, 1040, 116, C.pink)}
    ${rule(M, 1150, W - 2 * M, C.ash)}
    ${label('STYX — CZERŃ I SZAROŚĆ', M, 1210, C.bone, 'left', 28)}${label('WKRENTA — KOLOR', W - M, 1210, C.bone, 'right', 28)}
    ${label('@ROOTSTATTOOLODZ', M, 1278, C.ash)}${s.top}`, s.defs));
}
// 01 · Styx work · 02 · Wkrenta work (one template, two temperatures)
async function workPost(file, who) {
  const isStyx = who === 'styx';
  const ground = isStyx ? C.ink : C.night;
  const fg = isStyx ? C.bone : C.lilac;
  const muted = isStyx ? C.silver : '#B9A8D1';
  const s = stage(file, W, H, { warm: [0.3, 0.9], pinkLight: isStyx ? null : [0.8, 0.95], ground });
  const name = isStyx
    ? styxName(M, 1214, 150)
    : T(fonts.pop, 'Wkrenta', M, 1206, 104, C.pink);
  await save(`posts/${file}`, doc(W, H, `${s.base}${slot(0, 0, W, 1080, { tone: isStyx ? 'ink' : 'night' })}
    ${name}
    ${T(fonts.sansBold, '[Tytuł pracy]', W - M, 1160, 36, fg, { align: 'right' })}
    ${T(fonts.sans, isStyx ? '[miejsce] · black & grey' : '[miejsce] · pełny kolor', W - M, 1208, 30, muted, { align: 'right' })}
    ${row(1300, isStyx ? C.ash : '#8E7BA8', isStyx ? 'STYX' : 'WKRENTA', isStyx ? '01' : '02', { line: 'above' })}${s.top}`, s.defs));
}
await workPost('01-styx-praca', 'styx');
await workPost('02-wkrenta-praca', 'wkrenta');
// 03 · free dates
{
  const s = stage('p3', W, H, { warm: [0.2, 0.2], pinkLight: [0.9, 0.35] });
  const rows = [['17.11', 'pon.', 'Styx'], ['19.11', 'śr.', 'Wkrenta'], ['21.11', 'pt.', 'Styx'], ['22.11', 'sob.', 'Wkrenta']];
  await save('posts/03-studio-wolne-terminy', doc(W, H, `${s.base}${row(110, C.ash, 'TERMINY', '03')}
    ${T(fonts.serif, 'Wolne', M, 390, 210, C.bone)}
    ${T(fonts.serifItalic, 'terminy', M, 570, 210, C.pink)}
    ${rows.map(([d, day, who], i) => {
      const y = 760 + i * 118;
      return `${T(fonts.serif, `[${d}]`, M, y, 76, C.bone)}${T(fonts.sans, `[${day}]`, 380, y - 6, 32, C.silver)}
        <circle cx="${(W - M - textPath(fonts.sansBold, who, 0, 0, 44).width - 26).toFixed(1)}" cy="${y - 17}" r="9" fill="${who === 'Styx' ? C.ash : C.pink}"/>${T(fonts.sansBold, who, W - M, y - 2, 44, C.bone, { align: 'right' })}
        ${rule(M, y + 34, W - 2 * M, C.ash, 0.3)}`;
    }).join('')}
    ${T(fonts.sansBold, 'Napisz DM albo kliknij link w bio  →', M, 1286, 36, C.bone)}${s.top}`, s.defs));
}
// 04 · Wkrenta's designs to take
{
  const s = stage('p4', W, H, { warm: [0.3, 0.1], pinkLight: [0.8, 0.2], ground: C.night });
  const cells = [[M, 420], [W / 2 + 12, 420], [M, 840], [W / 2 + 12, 840]];
  const cw = W / 2 - M - 12;
  await save('posts/04-wkrenta-projekciki', doc(W, H, `${s.base}${row(110, '#8E7BA8', 'WKRENTA', '04')}
    ${T(fonts.pop, 'Projekciki', M, 300, 124, C.pink)}
    ${T(fonts.sans, 'do wzięcia · jeden wzór, jedna skóra', M, 362, 34, C.lilac)}
    ${cells.map(([x, y], i) => `${slot(x, y, cw, 330, { tone: 'night', rx: 16, text: 'ZDJĘCIE WZORU' })}${label(`WZÓR 0${i + 1}`, x, y + 374, C.lilac)}${label('[CENA]', x + cw, y + 374, C.pink, 'right')}`).join('')}
    ${s.top}`, s.defs));
}
// 05 · fresh / healed
{
  const s = stage('p5', W, H, { warm: [0.5, 0.15] });
  const cw = W / 2 - M - 12;
  await save('posts/05-swieze-zagojone', doc(W, H, `${s.base}${row(110, C.ash, 'ZAGOJONE', '05')}
    ${T(fonts.serif, 'Świeże', M, 270, 120, C.bone)}${T(fonts.serifItalic, 'zagojone', W - M, 270, 120, C.pink, { align: 'right' })}
    ${slot(M, 330, cw, 840)}${slot(W / 2 + 12, 330, cw, 840)}
    ${T(fonts.sans, 'Po [x] tygodniach · [miejsce] · [Styx / Wkrenta]', M, 1240, 32, C.silver)}
    ${label('@ROOTSTATTOOLODZ', M, 1300, C.ash)}${s.top}`, s.defs));
}
// 06 · how to book
{
  const s = stage('p6', W, H, { warm: [0.2, 0.15], pinkLight: [0.9, 0.85] });
  const steps = ['Napisz: pomysł, miejsce, rozmiar.', 'Dobierzemy artystę i termin.', 'Konsultacja i projekt pod ciebie.'];
  await save('posts/06-jak-sie-umowic', doc(W, H, `${s.base}${row(110, C.ash, 'REZERWACJA', '06')}
    ${T(fonts.serif, 'Jak się', M, 360, 190, C.bone)}${T(fonts.serifItalic, 'umówić?', M, 530, 190, C.pink)}
    ${steps.map((t, i) => {
      const y = 760 + i * 160;
      return `${T(fonts.serifItalic, String(i + 1), M, y + 20, 130, C.ash)}${T(fonts.sansBold, t, 200, y - 14, 42, C.bone)}${rule(200, y + 30, W - M - 200, C.ash, 0.3)}`;
    }).join('')}
    ${T(fonts.sansBold, 'Przesuń  →', W - M, 1290, 34, C.bone, { align: 'right' })}${s.top}`, s.defs));
}
// 07 · review (real Google reviews only, with the author's consent)
{
  const s = stage('p7', W, H, { warm: [0.7, 0.25] });
  const lines = wrap(fonts.serif, '[Wklej prawdziwą opinię z Google. Jedno, dwa zdania o pracy i atmosferze.]', 70, W - 2 * M);
  await save('posts/07-opinia', doc(W, H, `${s.base}${row(110, C.ash, 'OPINIE', '07')}
    ${T(fonts.serif, '“', M - 8, 470, 360, C.pink)}
    ${lines.map((l, i) => T(fonts.serif, l, M, 600 + i * 88, 70, C.bone)).join('')}
    ${[0, 1, 2, 3, 4].map((i) => star(M + 18 + i * 52, 1040, 18, C.bone)).join('')}
    ${T(fonts.sans, '[Imię] · Google · u [Styxa / Wkrenty]', M, 1110, 32, C.silver)}
    ${label('5,0 W GOOGLE · 15 OPINII (12.11.2026)', M, 1290, C.ash)}${s.top}`, s.defs));
}

// ---------- story highlight covers (1080 × 1920; icon in the circle crop; one line weight) ----------
{
  const cx = 540;
  const cy = 960;
  const sw = 26;
  const icons = {
    styx: `<circle cx="${cx}" cy="${cy}" r="190" fill="${C.ash}"/><circle cx="${cx}" cy="${cy}" r="84" fill="${C.ink}"/><circle cx="${cx - 66}" cy="${cy - 72}" r="30" fill="${C.bone}"/>`,
    wkrenta: `<circle cx="${cx}" cy="${cy}" r="190" fill="${C.pink}"/><ellipse cx="${cx}" cy="${cy}" rx="36" ry="150" fill="${C.ink}"/><circle cx="${cx - 72}" cy="${cy - 76}" r="30" fill="${C.bone}"/>`,
    projekciki: `<rect x="${cx - 170}" y="${cy - 170}" width="340" height="340" rx="40" fill="none" stroke="${C.bone}" stroke-width="${sw}"/><path d="M${cx - 80} ${cy + 20} q 80 -150 160 0" fill="none" stroke="${C.pink}" stroke-width="${sw}" stroke-linecap="round"/><circle cx="${cx}" cy="${cy + 70}" r="18" fill="${C.pink}"/>`,
    zagojone: `<path d="M${cx} ${cy + 170} C ${cx - 240} ${cy + 20}, ${cx - 190} ${cy - 190}, ${cx} ${cy - 96} C ${cx + 190} ${cy - 190}, ${cx + 240} ${cy + 20}, ${cx} ${cy + 170} Z" fill="none" stroke="${C.bone}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M${cx - 72} ${cy} l 54 54 l 100 -110" fill="none" stroke="${C.pink}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`,
    terminy: `<rect x="${cx - 180}" y="${cy - 160}" width="360" height="350" rx="36" fill="none" stroke="${C.bone}" stroke-width="${sw}"/><path d="M${cx - 180} ${cy - 66} H${cx + 180} M${cx - 86} ${cy - 210} V${cy - 126} M${cx + 86} ${cy - 210} V${cy - 126}" stroke="${C.bone}" stroke-width="${sw}" stroke-linecap="round"/><circle cx="${cx}" cy="${cy + 64}" r="36" fill="${C.pink}"/>`,
    rezerwacja: `<path d="M${cx - 180} ${cy - 150} h360 a36 36 0 0 1 36 36 v220 a36 36 0 0 1 -36 36 h-190 l-124 104 v-104 h-46 a36 36 0 0 1 -36 -36 v-220 a36 36 0 0 1 36 -36 z" fill="none" stroke="${C.bone}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M${cx - 86} ${cy - 4} h172 M${cx + 40} ${cy - 50} l46 46 l-46 46" fill="none" stroke="${C.pink}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`,
    studio: `<g transform="translate(${cx - 215} ${cy - 235}) scale(4.3)">${markInner}</g>`,
    opinie: `${star(cx, cy, 210, 'none')}<g fill="none" stroke="${C.bone}" stroke-width="${sw}" stroke-linejoin="round">${star(cx, cy, 210, 'none').replace('fill="none"', '')}</g>`,
  };
  for (const [name, icon] of Object.entries(icons)) {
    const s = stage(`h${name}`, 1080, 1920, { warm: [0.5, 0.45] });
    await save(`highlights/${name}`, doc(1080, 1920, `${s.base}${icon}${s.top}`, s.defs));
  }
}

// ---------- overview: full size and phone size (390 px wide, as seen in the feed) ----------
{
  const files = ['posts/00-nowa-odslona', 'posts/01-styx-praca', 'posts/02-wkrenta-praca', 'posts/03-studio-wolne-terminy', 'posts/04-wkrenta-projekciki', 'posts/05-swieze-zagojone', 'posts/06-jak-sie-umowic', 'posts/07-opinia', 'avatars/avatar-studio', 'avatars/avatar-styx', 'avatars/avatar-wkrenta'];
  const tw = 360;
  const th = 450;
  const tiles = await Promise.all(files.map((f) => sharp(`${OUT}/${f}.png`).resize(tw, th, { fit: 'contain', background: '#3a3a3a' }).toBuffer()));
  const hpng = (await readdir(`${OUT}/highlights`)).filter((f) => f.endsWith('.png')).sort();
  const htiles = await Promise.all(hpng.map((f) => sharp(`${OUT}/highlights/${f}`).resize(160, 284).toBuffer()));
  await sharp({ create: { width: tw * 4, height: th * 3 + 300, channels: 3, background: '#3a3a3a' } })
    .composite([...tiles.map((input, i) => ({ input, left: (i % 4) * tw, top: Math.floor(i / 4) * th })), ...htiles.map((input, i) => ({ input, left: 10 + i * 178, top: th * 3 + 8 }))])
    .jpeg({ quality: 84 })
    .toFile(`${OUT}/_overview.jpg`);
}
console.log('social kit → brand/');
