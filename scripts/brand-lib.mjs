// Roots Tattoo brand primitives: palette, outlined type (HarfBuzz: real shaping, variable axes,
// kerning, Polish), the ROOTS wordmark with its two eyes, the shop seal, and the art kit
// (grain, vignette, light, smoke, wet neon ink, halftone). Used by gen-brand.mjs and gen-placeholders.mjs.
import { readFileSync } from 'node:fs';
import * as hb from 'harfbuzzjs';

export const C = {
  // Roots (shared)
  ink: '#0E0C0B',
  bone: '#EFEAE3',
  ash: '#8F8A84',
  // Styx: black & grey, one accent
  smoke: '#1C1A19',
  silver: '#B8B2AB',
  blood: '#C1121F', // fill only (3.14:1 as text on ink)
  bloodText: '#FF5A5F', // 6.39:1 on ink
  // Wkrenta: full colour
  night: '#13061F', // ultraviolet black, her neon background
  paper: '#F7F2EE',
  vink: '#1E0A33', // violet ink, 16.48:1 on paper
  vmuted: '#5B4870',
  lilac: '#E6DAF5', // light text on night
  pink: '#FF2E93', // bubblegum, fill only on paper (3.12:1)
  pinkText: '#C2006B', // 5.39:1 on paper
  violet: '#7B2CF5',
  acid: '#C6F432',
  cyan: '#1FD1F2',
};

// ---------- type ----------
const SRC = new URL('../assets-src/fonts/', import.meta.url);
function makeFont(file, axes = {}) {
  const face = new hb.Face(new hb.Blob(readFileSync(new URL(file, SRC))));
  const font = new hb.Font(face);
  const vars = Object.entries(axes).map(([tag, v]) => new hb.Variation(tag, v));
  if (vars.length) font.setVariations(vars);
  return { font, upem: face.upem };
}
export const fonts = {
  serif: makeFont('InstrumentSerif-Regular.ttf'),
  serifItalic: makeFont('InstrumentSerif-Italic.ttf'),
  pop: makeFont('Shrikhand-Regular.ttf'),
  sans: makeFont('BricolageGrotesque-Variable.ttf', { opsz: 32, wdth: 100, wght: 500 }),
  sansBold: makeFont('BricolageGrotesque-Variable.ttf', { opsz: 32, wdth: 100, wght: 720 }),
  sansWide: makeFont('BricolageGrotesque-Variable.ttf', { opsz: 14, wdth: 100, wght: 640 }),
  logo: makeFont('BricolageGrotesque-Variable.ttf', { opsz: 96, wdth: 75, wght: 800 }),
};

function shape(f, text) {
  const buf = new hb.Buffer();
  buf.addText(text);
  buf.guessSegmentProperties();
  hb.shape(f.font, buf);
  return buf.getGlyphInfosAndPositions();
}
const NUM_PAIR = /(-?\d*\.?\d+(?:e-?\d+)?),(-?\d*\.?\d+(?:e-?\d+)?)/g;
const glyphD = (f, gid, ox, oy, s) => f.font.glyphToPath(gid).replace(NUM_PAIR, (_, a, b) => `${(ox + a * s).toFixed(1)},${(oy - b * s).toFixed(1)}`);

export function measure(f, text, size, tracking = 0) {
  const s = size / f.upem;
  return shape(f, text).reduce((w, p) => w + (p.xAdvance ?? 0) * s + tracking, 0) - tracking;
}

/** Outlined text as one SVG path `d`, baseline at y. */
export function textPath(f, text, x, y, size, { tracking = 0, align = 'left' } = {}) {
  const s = size / f.upem;
  const width = measure(f, text, size, tracking);
  let pen = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  let d = '';
  for (const g of shape(f, text)) {
    d += glyphD(f, g.codepoint, pen + (g.xOffset ?? 0) * s, y - (g.yOffset ?? 0) * s, s);
    pen += (g.xAdvance ?? 0) * s + tracking;
  }
  return { d, width };
}

/** Per-glyph outlines, shaped as a whole word so kerning stays correct. */
export function glyphs(f, text, x, y, size, tracking = 0) {
  const s = size / f.upem;
  let pen = x;
  return shape(f, text).map((g) => {
    const ox = pen + (g.xOffset ?? 0) * s;
    const w = (g.xAdvance ?? 0) * s;
    const d = glyphD(f, g.codepoint, ox, y, s);
    pen += w + tracking;
    return { d, x: ox, w, bbox: bbox(d) };
  });
}

/** Approximate bounding box of a path (control points included: fine for round glyphs). */
export function bbox(d) {
  const xs = [];
  const ys = [];
  for (const m of d.matchAll(NUM_PAIR)) {
    xs.push(+m[1]);
    ys.push(+m[2]);
  }
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

export function wrap(f, text, size, maxWidth) {
  const lines = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (measure(f, next, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Text set on a circle. top = reads clockwise over the top; bottom = reads left→right under. */
export function arcText(f, text, cx, cy, r, size, { tracking = 0, position = 'top' } = {}) {
  const s = size / f.upem;
  const total = measure(f, text, size, tracking);
  const span = total / r;
  const capShift = position === 'bottom' ? size * 0.72 : 0;
  let pen = 0;
  let out = '';
  for (const g of shape(f, text)) {
    const w = (g.xAdvance ?? 0) * s;
    const mid = (pen + w / 2) / r;
    const theta = position === 'top' ? -Math.PI / 2 - span / 2 + mid : Math.PI / 2 + span / 2 - mid;
    const px = cx + Math.cos(theta) * r;
    const py = cy + Math.sin(theta) * r;
    const rot = (theta * 180) / Math.PI + (position === 'top' ? 90 : -90);
    out += `<path transform="translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${rot.toFixed(2)})" d="${glyphD(f, g.codepoint, -w / 2, capShift, s)}"/>`;
    pen += w + tracking;
  }
  return out;
}

// ---------- gradients ----------
/** Two temperatures. tone = background the mark sits on. */
export function ooDefs(id = 'oo', tone = 'dark') {
  const smoke =
    tone === 'dark'
      ? '<stop offset="0" stop-color="#F7F3EE"/><stop offset=".5" stop-color="#ABA59E"/><stop offset="1" stop-color="#5C5753"/>'
      : '<stop offset="0" stop-color="#8E8882"/><stop offset=".5" stop-color="#4E4945"/><stop offset="1" stop-color="#15120F"/>';
  return `<linearGradient id="${id}-smoke" x1="0" y1="0" x2=".55" y2="1">${smoke}</linearGradient>
  <linearGradient id="${id}-neon" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="${C.acid}"/><stop offset=".28" stop-color="${C.pink}"/><stop offset=".68" stop-color="${C.violet}"/><stop offset="1" stop-color="${C.cyan}"/></linearGradient>
  <radialGradient id="${id}-iris-g" cx=".5" cy=".5" r=".5"><stop offset=".35" stop-color="#DAD4CD"/><stop offset=".72" stop-color="#7D7772"/><stop offset="1" stop-color="#2B2725"/></radialGradient>
  <radialGradient id="${id}-iris-n" cx=".5" cy=".5" r=".5"><stop offset=".3" stop-color="${C.acid}"/><stop offset=".6" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.violet}"/></radialGradient>`;
}

// ---------- the eyes and the drips ----------
/** Inner contour (counter) of a glyph: the smaller of its subpaths. */
function counterBox(d) {
  const subs = d.split(/(?=M)/).filter(Boolean).map(bbox);
  subs.sort((p, q) => (p.x1 - p.x0) * (p.y1 - p.y0) - (q.x1 - q.x0) * (q.y1 - q.y0));
  return subs[0];
}
const f1 = (n) => n.toFixed(1);
/** Iris + pupil + catch-light, fitted to the counter. cat = vertical slit pupil. */
function eye(cx, cy, r, iris, pupil, glint, cat = false, gapColor = null) {
  const p = cat
    ? `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r * 0.2)}" ry="${f1(r * 0.78)}" fill="${pupil}"/>`
    : `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r * 0.44)}" fill="${pupil}"/>`;
  const gap = gapColor ? `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r * 1.14)}" fill="${gapColor}"/>` : '';
  return `${gap}<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${iris}"/>${p}<circle cx="${f1(cx - r * 0.36)}" cy="${f1(cy - r * 0.4)}" r="${f1(r * 0.2)}" fill="${glint}"/>`;
}
/** Ink drip: a neck that grows out of the letter, a thin run, a round drop. */
export function drip(x, top, len, w) {
  const end = top + len;
  return `M${f1(x - w * 1.9)} ${f1(top - w)} C ${f1(x - w * 0.9)} ${f1(top + w * 0.6)}, ${f1(x - w * 0.55)} ${f1(top + len * 0.35)}, ${f1(x - w * 0.42)} ${f1(end - w * 1.3)}
    A ${f1(w * 1.3)} ${f1(w * 1.3)} 0 1 0 ${f1(x + w * 0.42)} ${f1(end - w * 1.3)}
    C ${f1(x + w * 0.55)} ${f1(top + len * 0.35)}, ${f1(x + w * 0.9)} ${f1(top + w * 0.6)}, ${f1(x + w * 1.9)} ${f1(top - w)} Z`;
}

/**
 * The pair of eyes: the counters of the two O's hold an iris. Left = Styx (grey realism,
 * round pupil, blood drip); right = Wkrenta (neon, cat-slit pupil, bubblegum drip).
 */
function eyesFromOs(o1, o2, id, { pupil = C.ink, drips = true, bg = C.ink } = {}) {
  const out = [];
  const under = [];
  [[o1, 'smoke', 'iris-g', C.blood, false], [o2, 'neon', 'iris-n', C.pink, true]].forEach(([o, grad, iris, dripCol, cat], i) => {
    const b = o.bbox;
    const k = counterBox(o.d);
    const cx = (k.x0 + k.x1) / 2;
    const cy = (k.y0 + k.y1) / 2 - (k.y1 - k.y0) * 0.04;
    const r = (b.x1 - b.x0) * 0.21;
    out.push(`<path d="${o.d}" fill="url(#${id}-${grad})"/>`);
    out.push(eye(cx, cy, r, `url(#${id}-${iris})`, i ? C.vink : pupil, C.bone, cat, bg));
    if (drips) {
      const w = (b.x1 - b.x0) * 0.068;
      const dx = (b.x0 + b.x1) / 2 + (i ? 7 : -5);
      // drawn underneath the letter, so the run appears to leak out of its curve
      under.push(`<path d="${drip(dx, b.y1 - w * 3, i ? 34 : 46, w)}" fill="${dripCol}"/>`);
    }
  });
  return under.join('') + out.join('');
}

/** ROOTS wordmark. Fully legible; the O's look back at you, ink runs from them. */
export function wordmark({ id = 'wm', color = C.bone, tone = 'dark', sub = 'TATTOO · ŁÓDŹ', subColor = color, drips = true, bg: bgOverride = null } = {}) {
  const size = 160;
  const base = 120;
  const g = glyphs(fonts.logo, 'ROOTS', 0, base, size, 5);
  const width = g.at(-1).x + g.at(-1).w;
  const bg = bgOverride ?? (tone === 'dark' ? C.ink : C.paper);
  const parts = [`<path d="${g[0].d}${g[3].d}${g[4].d}" fill="${color}"/>`, eyesFromOs(g[1], g[2], id, { pupil: tone === 'dark' ? C.ink : '#15120F', drips, bg })];
  const subY = base + 76;
  if (sub) parts.push(`<path d="${textPath(fonts.sansBold, sub, width, subY, 19, { tracking: 9.5, align: 'right' }).d}" fill="${subColor}"/>`);
  return { svg: `<g>${parts.join('')}</g>`, width, height: sub ? subY + 6 : base + 50, defs: ooDefs(id, tone) };
}

/** Shop seal: ring of type around the two eyes. Box 520 × 520. For avatars, stamps, stickers. */
export function seal({ id = 'sl', color = C.bone, tone = 'dark', bg = tone === 'dark' ? C.ink : C.paper, top = 'ROOTS TATTOO', bottom = 'STYX · ŁÓDŹ · WKRENTA' } = {}) {
  const c = 260;
  const g = glyphs(fonts.logo, 'OO', 0, 0, 230, 8);
  const gw = g[1].x + g[1].w;
  const gh = g[0].bbox.y1 - g[0].bbox.y0;
  const tx = c - gw / 2;
  const ty = c + gh / 2 - 8;
  const placed = glyphs(fonts.logo, 'OO', tx, ty, 230, 8);
  const star = (x, y, r) => `<path d="M${x} ${y - r} Q ${x + r * 0.16} ${y - r * 0.16} ${x + r} ${y} Q ${x + r * 0.16} ${y + r * 0.16} ${x} ${y + r} Q ${x - r * 0.16} ${y + r * 0.16} ${x - r} ${y} Q ${x - r * 0.16} ${y - r * 0.16} ${x} ${y - r} Z" fill="${color}"/>`;
  const svg = `<g>
    <circle cx="${c}" cy="${c}" r="246" fill="none" stroke="${color}" stroke-width="5"/>
    <circle cx="${c}" cy="${c}" r="234" fill="none" stroke="${color}" stroke-width="1.5" opacity=".7"/>
    <circle cx="${c}" cy="${c}" r="164" fill="none" stroke="${color}" stroke-width="1.5" opacity=".7"/>
    <g fill="${color}">${arcText(fonts.sansWide, top, c, c, 194, 38, { tracking: 9, position: 'top' })}${arcText(fonts.sansWide, bottom, c, c, 196, 26, { tracking: 7, position: 'bottom' })}</g>
    ${star(c - 207, c, 9)}${star(c + 207, c, 9)}
    ${eyesFromOs(placed[0], placed[1], id, { pupil: tone === 'dark' ? C.ink : '#15120F', bg })}
  </g>`;
  return { svg, width: 520, height: 520, defs: ooDefs(id, tone) };
}

// ---------- art kit ----------
export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Film grain, same density on every format. */
export const grainDefs = (id, seed = 1) =>
  `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter>`;
export const grain = (id, w, h, opacity = 0.09) => `<rect width="${w}" height="${h}" filter="url(#${id})" opacity="${opacity}"/>`;

/** Vignette: exponential-looking falloff via several stops. */
export const vignetteDefs = (id, color = '#000') =>
  `<radialGradient id="${id}" cx=".5" cy=".46" r=".75"><stop offset=".45" stop-color="${color}" stop-opacity="0"/><stop offset=".72" stop-color="${color}" stop-opacity=".28"/><stop offset=".9" stop-color="${color}" stop-opacity=".62"/><stop offset="1" stop-color="${color}" stop-opacity=".82"/></radialGradient>`;
export const vignette = (id, w, h) => `<rect width="${w}" height="${h}" fill="url(#${id})"/>`;

/** One soft light source. */
export const lightDefs = (id, color, strength = 0.22) =>
  `<radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${color}" stop-opacity="${strength}"/><stop offset=".35" stop-color="${color}" stop-opacity="${(strength * 0.45).toFixed(3)}"/><stop offset=".7" stop-color="${color}" stop-opacity="${(strength * 0.1).toFixed(3)}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
export const light = (id, cx, cy, r) => `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.9}" fill="url(#${id})"/>`;

/** Rising smoke: stretched, swirled turbulence, dense at the bottom and dissolving upward. */
export const smokeDefs = (id, seed = 3, h = 1350) => `
  <filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".0016 .0058" numOctaves="5" seed="${seed}" result="t"/>
    <feTurbulence type="turbulence" baseFrequency=".006" numOctaves="2" seed="${seed + 4}" result="sw"/>
    <feDisplacementMap in="t" in2="sw" scale="120" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feColorMatrix in="d" values="0 0 0 0 .93  0 0 0 0 .91  0 0 0 0 .89  2.6 0 0 0 -1.12"/>
    <feGaussianBlur stdDeviation="1.2"/>
  </filter>
  <linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
  <mask id="${id}-mask" maskContentUnits="userSpaceOnUse"><rect width="4000" height="${h}" fill="url(#${id}-fade)"/></mask>`;
export const smoke = (id, w, h, opacity = 0.55) => `<g mask="url(#${id}-mask)" opacity="${opacity}"><rect width="${w}" height="${h}" filter="url(#${id})"/></g>`;

/** Halftone dots (pop-art), fading by a gradient mask. */
export const halftoneDefs = (id, color, size = 18, angle = 22) => `
  <pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.28}" fill="${color}"/></pattern>
  <linearGradient id="${id}-fade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="${id}-mask"><rect width="100%" height="100%" fill="url(#${id}-fade)"/></mask>`;
export const halftone = (id, w, h, opacity = 0.35) => `<rect width="${w}" height="${h}" fill="url(#${id})" mask="url(#${id}-mask)" opacity="${opacity}"/>`;

/**
 * Wet neon ink: per colour, droplets merged by a goo filter with roughened edges,
 * a soft emissive glow underneath and a specular catch-light on the main blot.
 */
let splashN = 0;
export function splash(r, cx, cy, spread, colors, n = 34, { glow = true } = {}) {
  const id = `ink${splashN++}`;
  const blots = [];
  const layers = colors.map((col) => {
    let s = '';
    const count = Math.ceil(n / colors.length);
    const ma = r() * Math.PI * 2;
    const md = r() * spread * 0.35;
    const mx = cx + Math.cos(ma) * md;
    const my = cy + Math.sin(ma) * md;
    const mr = spread * (0.15 + r() * 0.1);
    blots.push([mx, my, mr]);
    s += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="${mr.toFixed(1)}"/>`;
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const d = spread * (0.15 + Math.pow(r(), 0.8) * 0.85);
      const x = mx + Math.cos(a) * d;
      const y = my + Math.sin(a) * d;
      const rad = Math.max(3, (1 - d / spread) * spread * 0.07 * (0.4 + r()));
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}"/>`;
      if (r() > 0.55) s += `<path d="M${mx.toFixed(1)} ${my.toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)}" stroke-width="${(rad * 0.9).toFixed(1)}" stroke="${col}" stroke-linecap="round"/>`;
    }
    return { col, s };
  });
  const gloss = blots
    .map(([x, y, rr]) => `<ellipse cx="${(x - rr * 0.32).toFixed(1)}" cy="${(y - rr * 0.38).toFixed(1)}" rx="${(rr * 0.26).toFixed(1)}" ry="${(rr * 0.15).toFixed(1)}" transform="rotate(-28 ${(x - rr * 0.32).toFixed(1)} ${(y - rr * 0.38).toFixed(1)})" fill="#fff" opacity=".55" filter="url(#${id}-soft)"/>`)
    .join('');
  return `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/>
      <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g"/>
      <feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="${splashN}"/>
      <feDisplacementMap in="g" scale="14" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${(spread * 0.12).toFixed(1)}"/></filter>
    <filter id="${id}-soft"><feGaussianBlur stdDeviation="2.2"/></filter>
    ${glow ? layers.map((l) => `<g fill="${l.col}" opacity=".55" filter="url(#${id}-glow)">${l.s}</g>`).join('') : ''}
    ${layers.map((l) => `<g fill="${l.col}" filter="url(#${id})">${l.s}</g>`).join('')}${gloss}`;
}

/** Thin catalogue marks: crop corners for photo slots. */
export function cropMarks(x, y, w, h, color, len = 22, off = 10) {
  const p = [
    [x - off, y, x - off - len, y], [x, y - off, x, y - off - len],
    [x + w + off, y, x + w + off + len, y], [x + w, y - off, x + w, y - off - len],
    [x - off, y + h, x - off - len, y + h], [x, y + h + off, x, y + h + off + len],
    [x + w + off, y + h, x + w + off + len, y + h], [x + w, y + h + off, x + w, y + h + off + len],
  ];
  return p.map(([a, b, c, d]) => `<path d="M${a} ${b} L${c} ${d}" stroke="${color}" stroke-width="1.5"/>`).join('');
}
