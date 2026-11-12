// Writes brand-work/roots-tattoo/sets.json: three identity sets for Roots Tattoo.
// Geometry is computed (sin/cos, shared radii) on the 100-unit grid the brand-identity pipeline expects.
import { writeFileSync, readFileSync } from 'node:fs';

const f = (n) => Number(n.toFixed(2));
const OUT = new URL('./roots-tattoo/sets.json', import.meta.url);

// ---------- shared geometry ----------
/**
 * Ink drip like a paint run: a concave fillet out of the letter, an almost even run, and an end only
 * slightly fuller than the run (≈1.35×). Even width is what makes it read as liquid, not as "!".
 */
function drip(x, top, len, w) {
  const run = w * 0.8;
  const r = w * 1.08;
  const dropY = top + len - r;
  const p = [
    `M${f(x - w * 1.6)} ${f(top)}`,
    `C ${f(x - run * 1.05)} ${f(top)}, ${f(x - run)} ${f(top + len * 0.08)}, ${f(x - run)} ${f(top + len * 0.24)}`,
    `L ${f(x - run)} ${f(dropY - r * 0.7)}`,
    `C ${f(x - run)} ${f(dropY - r * 0.3)}, ${f(x - r)} ${f(dropY - r * 0.35)}, ${f(x - r)} ${f(dropY)}`,
    `A ${f(r)} ${f(r)} 0 0 0 ${f(x + r)} ${f(dropY)}`,
    `C ${f(x + r)} ${f(dropY - r * 0.35)}, ${f(x + run)} ${f(dropY - r * 0.3)}, ${f(x + run)} ${f(dropY - r * 0.7)}`,
    `L ${f(x + run)} ${f(top + len * 0.24)}`,
    `C ${f(x + run)} ${f(top + len * 0.08)}, ${f(x + run * 1.05)} ${f(top)}, ${f(x + w * 1.6)} ${f(top)}`,
    'Z',
  ];
  return p.join(' ');
}
/**
 * Drip that grows out of an O: the top edge follows the O's bottom contour (ellipse cxO, cyO, rx, ry),
 * so there is no seam and no flat cap where ink meets the letter.
 */
function dripFromO(cxO, cyO, rx, ry, len, w) {
  const a = w * 1.6;
  const edge = (dx) => cyO + ry * Math.sqrt(1 - (dx / rx) ** 2);
  const yL = edge(-a);
  const top = edge(0);
  const run = w * 0.8;
  const r = w * 1.08;
  const dropY = top + len - r;
  return [
    `M${f(cxO - a)} ${f(yL)}`,
    `C ${f(cxO - run * 1.05)} ${f(top)}, ${f(cxO - run)} ${f(top + len * 0.08)}, ${f(cxO - run)} ${f(top + len * 0.24)}`,
    `L ${f(cxO - run)} ${f(dropY - r * 0.7)}`,
    `C ${f(cxO - run)} ${f(dropY - r * 0.3)}, ${f(cxO - r)} ${f(dropY - r * 0.35)}, ${f(cxO - r)} ${f(dropY)}`,
    `A ${f(r)} ${f(r)} 0 0 0 ${f(cxO + r)} ${f(dropY)}`,
    `C ${f(cxO + r)} ${f(dropY - r * 0.35)}, ${f(cxO + run)} ${f(dropY - r * 0.3)}, ${f(cxO + run)} ${f(dropY - r * 0.7)}`,
    `L ${f(cxO + run)} ${f(top + len * 0.24)}`,
    `C ${f(cxO + run)} ${f(top + len * 0.08)}, ${f(cxO + run * 1.05)} ${f(top)}, ${f(cxO + a)} ${f(yL)}`,
    `A ${f(rx)} ${f(ry)} 0 0 1 ${f(cxO - a)} ${f(yL)}`,
    'Z',
  ].join(' ');
}
const roleNote = (claim, evidence = 'judgement', source = 'design') => ({ claim, evidence, source });
const font = (family, location, weights, extra = {}) => ({
  family,
  source: 'google',
  license: 'OFL-1.1',
  weights,
  location,
  features: [],
  case: 'as-is',
  tracking: 0,
  fallback: 'system-ui, sans-serif',
  file: null,
  ...extra,
});
const brand = (id, name, hex, usage) => ({ id, name, hex, source: 'chosen', locked: true, usage, print: { lab_d50: null, cmyk: null, pantone_ref: null } });

// ---------- A: Dwa spojrzenia ----------
// Two O's on a 100 grid: centres 29 / 71, cap 50, baseline 68. Counter of a wght-800 O ≈ 0.4 of its width.
// Wordmark units: cap 100, baseline 100. O counters (from wordmark-glyphs.json): 122.6–162.7 and 224.3–264.4.
const A_detail = (() => {
  const eyes = [
    { n: 2, cx: 142.6, color: 'brand-3', cat: false, o: [142.5, 49.9, 45.98, 52.0], len: 46 },
    { n: 3, cx: 244.3, color: 'brand-4', cat: true, o: [244.17, 49.9, 45.98, 52.0], len: 32 },
  ];
  const cy = 50;
  const r = 15.5;
  let out = '';
  for (const e of eyes) {
    out += `<rect id="o${e.n}-tone" x="${e.cx - 60}" y="-20" width="120" height="140" data-op="intersect" data-glyph="${e.n}" data-color="${e.color}"/>`;
    out += `<g id="eye${e.n}" data-color="${e.color}"><circle id="iris${e.n}" cx="${e.cx}" cy="${cy}" r="${r}"/>${e.cat ? `<ellipse id="pupil${e.n}" cx="${e.cx}" cy="${cy}" rx="${f(r * 0.22)}" ry="${f(r * 0.8)}" data-op="subtract"/>` : `<circle id="pupil${e.n}" cx="${e.cx}" cy="${cy}" r="${f(r * 0.46)}" data-op="subtract"/>`}</g>`;
    out += `<g id="drip${e.n}" data-color="${e.n === 2 ? 'brand-5' : 'brand-4'}"><path id="run${e.n}" d="${dripFromO(...e.o, e.len, 5.6)}"/></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
})();
const A_sym = (() => {
  const base = 68;
  const cap = 50;
  const cy = base - cap / 2 - 0.5;
  const r = 6.6; // iris
  const L = 29;
  const R = 71;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g id="o-styx" data-color="brand-3"><path id="o-left" data-glyphs="O" data-x="${L}" data-baseline="${base}" data-cap="${cap}" data-anchor="middle"/></g>
  <g id="o-wkrenta" data-color="brand-4"><path id="o-right" data-glyphs="O" data-x="${R}" data-baseline="${base}" data-cap="${cap}" data-anchor="middle"/></g>
  <g id="iris-styx" data-color="brand-3"><circle id="iris-l" cx="${L}" cy="${f(cy)}" r="${r}"/><circle id="pupil-l" cx="${L}" cy="${f(cy)}" r="${f(r * 0.46)}" data-op="subtract"/></g>
  <g id="iris-wkrenta" data-color="brand-4"><circle id="iris-r" cx="${R}" cy="${f(cy)}" r="${r}"/><ellipse id="pupil-r" cx="${R}" cy="${f(cy)}" rx="${f(r * 0.2)}" ry="${f(r * 0.78)}" data-op="subtract"/></g>
  <g id="drip-styx" data-color="brand-5"><path id="blood" d="${drip(L - 2, base - 1.2, 26, 2)}"/></g>
  <g id="drip-wkrenta" data-color="brand-4"><path id="gum" d="${drip(R + 3, base - 1.2, 18, 2)}"/></g>
</svg>`;
})();

const setA = {
  identity: {
    set: {
      id: 'A',
      name: 'Dwa spojrzenia',
      recommended: true,
      mechanism: 'Podwójne O w nazwie patrzy na ciebie: lewe oko szare i realistyczne (Styx), prawe neonowe z kocią źrenicą (Wkrenta); z obu cieknie tusz, krew i guma balonowa.',
      expression_move: 'Oczy w literach O są jedynym głośnym elementem; krój i paleta poza nimi milczą.',
      differs_by: 'Łódzka konkurencja (Sigil, He3tatuażyk) gra wąskim, grubym groteskiem i pomarańczem lub złotem; tu szeroka groteska, szarość i jeden neonowy róż.',
    },
    axes: { quiet_loud: 1, playful_serious: 0, premium_accessible: 0, classic_contemporary: 1 },
    type: {
      pairing_mode: 'single-family',
      display: font('Bricolage Grotesque', { opsz: 96, wdth: 100, wght: 800 }, [800], { case: 'upper', tracking: 10 }),
      text: font('Bricolage Grotesque', { opsz: 14, wdth: 100, wght: 400 }, [400, 600]),
      mono: null,
    },
    logo: {
      type: 'wordmark',
      concept: 'ROOTS patrzy: szare oko realizmu i neonowe kocie oko popu; oboje tatuują oczy i portrety.',
      symbol: null,
      wordmark: { text: 'ROOTS', role: 'display', location: null, tracking: 10, case: 'upper' },
      monogram: null,
      lockups: [],
      colors: { 'o-styx': 'brand-3', 'o-wkrenta': 'brand-4', 'drip-styx': 'brand-5', 'drip-wkrenta': 'brand-4', wordmark: 'text' },
      tags: ['letterform'],
      clear_space: { unit: 'cap-height', multiple: 1, inferred: true },
      min_size: { px: 28, mm: 9 },
      misuse: [
        { do: 'stretch' },
        { do: 'recolour' },
        { do: 'effects' },
        { do: 'crowd' },
        { svg: 'logo/misuse-1.svg', label: 'Nie zamieniaj oczu: szare zawsze po lewej, neonowe po prawej' },
        { svg: 'logo/misuse-2.svg', label: 'Nie zapełniaj źrenic: bez nich oczy znikają' },
      ],
      defect: 'Krople czytały się jak wykrzykniki (cienki trzonek i oddzielna kulka); przerysowane na ciągłą łzę bez przewężenia.',
    },
    card: { ground: 'dark' },
    palette_build: { strategy: null, accent: '#FF2E93', light_bg: '#F7F2EE', dark_bg: '#0E0C0B', neutral_tint: null, neutral_chroma: null, extra: [] },
    defaults_used: [
      { id: 'logo-formula', why: 'Oczy nie są przedmiotem z nazwy ani ukrytą literą: to temat obojga artystów (portrety, oczy, kocie oczy na ich profilach), a litery O dosłownie są w nazwie.' },
    ],
    rationale: [
      roleNote('Konkurenci odczytani skryptem: Sigil #ff3c10 + Francois One / Crimson Text, He3tatuażyk #d49a40 + Oswald / Lato.', 'measured', 'site competitors'),
      roleNote('Styx: realizm black & grey, dym, czaszki, czerwień jako jedyny kolor (okładka FB). Wkrenta: kolorowy realizm pop, neonowe róże, kot w różowych okularach, guma balonowa.', 'measured', 'Facebook / Instagram 2026-11-12'),
      roleNote('Szeroka Bricolage zamiast wąskiej: okrągłe O mieszczą tęczówkę w świetle litery i odróżniają od Oswald/Francois.', 'judgement'),
    ],
  },
  palette: {
    schema: 'brand-identity/palette@1',
    name: 'Dwa spojrzenia',
    direction: 'Ciepła czerń jako scena, kość jako tekst, szary dym dla Styxa, neonowy róż dla Wkrenty, krew tylko w kropli.',
    brand: [
      brand('brand-1', 'Czerń korzeni', '#0E0C0B', 'tło, scena'),
      brand('brand-2', 'Kość', '#EFEAE3', 'tekst, logotyp'),
      brand('brand-3', 'Dym', '#8F8A84', 'świat Styxa, lewe oko'),
      brand('brand-4', 'Guma balonowa', '#FF2E93', 'świat Wkrenty, prawe oko, CTA'),
      brand('brand-5', 'Krew', '#C1121F', 'tylko kropla Styxa i akcent'),
    ],
    feels: ['mroczny', 'soczysty', 'rzemieślniczy'],
  },
  symbol_svg: null,
  symbol_small_svg: A_sym,
  wordmark_detail_svg: A_detail,
  misuse_svgs: JSON.parse(readFileSync(new URL('./misuse-A.json', import.meta.url), 'utf8')),
};

// ---------- B: Linia igły ----------
const B_small = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g id="initial" data-color="brand-2"><path id="r" data-glyphs="R" data-x="50" data-baseline="80" data-cap="66" data-anchor="middle"/><rect id="needle-cut" x="0" y="55" width="100" height="3" data-op="subtract"/></g>
  <g id="point" data-color="brand-4"><circle id="needle-point" cx="80" cy="56.5" r="4"/></g>
</svg>`;
const setB = {
  identity: {
    set: {
      id: 'B',
      name: 'Linia igły',
      recommended: false,
      mechanism: 'Jedna linia igły: włosowe cięcie przez szeryfowy logotyp, ta sama linia jako jedyny element graficzny i jeden czerwony punkt tam, gdzie igła wchodzi w skórę.',
      expression_move: 'Włosowe cięcie przez litery; nic poza nim się nie wyróżnia.',
      differs_by: 'Jedyny kierunek szeryfowy i cichy na tle wąskich grotesków konkurencji; bez pomarańczu i złota, tylko kość na czerni.',
    },
    axes: { quiet_loud: -2, playful_serious: 2, premium_accessible: -2, classic_contemporary: -1 },
    type: {
      pairing_mode: 'contrast',
      display: font('Instrument Serif', {}, [400], { tracking: -10, fallback: 'Georgia, serif' }),
      text: font('Bricolage Grotesque', { opsz: 14, wdth: 100, wght: 400 }, [400, 600]),
      mono: null,
    },
    logo: {
      type: 'wordmark',
      concept: 'Nazwa przecięta jedną linią igły; czerwony punkt w miejscu wkłucia.',
      symbol: null,
      wordmark: { text: 'Roots', role: 'display', location: null, tracking: -10, case: 'as-is' },
      monogram: null,
      lockups: ['horizontal'],
      colors: { wordmark: 'brand-2', initial: 'brand-2', point: 'brand-4' },
      tags: [],
      clear_space: { unit: 'cap-height', multiple: 1, inferred: true },
      min_size: { px: 32, mm: 10 },
      defect: 'Cięcie igły było niewidoczne (3,4 jednostki); pogrubione do 5 i dodany czerwony punkt wkłucia.',
    },
    card: { ground: 'dark' },
    palette_build: { strategy: null, accent: '#C1121F', light_bg: '#EFEAE3', dark_bg: '#0E0C0B', neutral_tint: null, neutral_chroma: null, extra: [] },
    defaults_used: [{ id: 'cream-ground', why: 'Jasne tło to kość z czaszek w realizmie Styxa (#EFEAE3), ten sam kolor co tekst na czerni; bez terakoty i złota z kliszy.' }],
    rationale: [roleNote('Instrument Serif nie występuje na liście domyślnych wyborów AI; to kontrast wobec wąskich grotesków konkurencji.', 'judgement')],
  },
  palette: {
    schema: 'brand-identity/palette@1',
    name: 'Linia igły',
    direction: 'Kość na czerni, popiół do drugiego planu i jeden czerwony punkt.',
    brand: [
      brand('brand-1', 'Czerń', '#0E0C0B', 'tło'),
      brand('brand-2', 'Kość', '#EFEAE3', 'logotyp, tekst'),
      brand('brand-3', 'Popiół', '#8F8A84', 'drugi plan'),
      brand('brand-4', 'Punkt krwi', '#C1121F', 'jeden punkt, nigdy powierzchnia'),
    ],
    feels: ['cichy', 'precyzyjny', 'mroczny'],
  },
  symbol_svg: null,
  symbol_small_svg: B_small,
  // detail: hairline slit across the wordmark at 55% of cap height, and the needle point after the last letter.
  wordmark_detail_svg: `<svg xmlns="http://www.w3.org/2000/svg"><rect id="needle-cut" x="-20" y="54" width="4000" height="5" data-op="subtract"/><circle id="needle-point" cx="268" cy="56.5" r="7.5" data-color="brand-4"/></svg>`,
};

// ---------- C: Balon gumy ----------
const C_sym = (() => {
  const cx = 48;
  const cy = 50;
  const r = 38;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g id="sticker-shadow" data-color="brand-3"><circle id="shadow" cx="${cx + 6}" cy="${cy + 6}" r="${r}"/><path id="r-cut-shadow" data-glyphs="R" data-x="${cx}" data-baseline="${cy + 17}" data-cap="36" data-anchor="middle" data-op="subtract"/></g>
  <g id="bubble" data-color="brand-2"><circle id="gum" cx="${cx}" cy="${cy}" r="${r}"/><path id="r-cut" data-glyphs="R" data-x="${cx}" data-baseline="${cy + 17}" data-cap="36" data-anchor="middle" data-op="subtract"/><ellipse id="gloss" cx="${f(cx - r * 0.5)}" cy="${f(cy - r * 0.52)}" rx="${f(r * 0.2)}" ry="${f(r * 0.1)}" transform="rotate(-35 ${f(cx - r * 0.5)} ${f(cy - r * 0.52)})" data-op="subtract"/></g>
</svg>`;
})();
const setC = {
  identity: {
    set: {
      id: 'C',
      name: 'Balon gumy',
      recommended: false,
      mechanism: 'Guma balonowa z portretów Wkrenty: okrągły balon z wyciętym R, przesunięty cień jak naklejka, gruba popowa kursywa i cukierkowy róż z kwasem na ultrafiolecie.',
      expression_move: 'Przesunięty cień naklejki pod znakiem i logotypem.',
      differs_by: 'Najgłośniejszy i najbardziej popowy kierunek: ultrafioletowa noc zamiast czerni i grotesku konkurencji, kursywa zamiast wąskiego kroju.',
    },
    axes: { quiet_loud: 2, playful_serious: -2, premium_accessible: 1, classic_contemporary: 1 },
    type: {
      pairing_mode: 'contrast',
      display: font('Shrikhand', {}, [400], { tracking: 0, fallback: 'Arial Black, sans-serif' }),
      text: font('Bricolage Grotesque', { opsz: 14, wdth: 100, wght: 400 }, [400, 600]),
      mono: null,
    },
    logo: {
      type: 'symbol+wordmark',
      concept: 'Balon gumy z wyciętym R, naklejony z przesunięciem.',
      symbol: 'logo/symbol.svg',
      wordmark: { text: 'Roots', role: 'display', location: null, tracking: 0, case: 'as-is' },
      monogram: null,
      lockups: ['horizontal', 'stacked'],
      colors: { 'sticker-shadow': 'brand-3', bubble: 'brand-2', wordmark: 'brand-2' },
      tags: ['circle-container'],
      clear_space: { unit: 'cap-height', multiple: 1, inferred: true },
      min_size: { px: 24, mm: 8 },
      defect: 'Połysk był fałszywą dziurą, a w jednym kolorze cień zalewał R; połysk i R są teraz prawdziwymi wycięciami w balonie i w cieniu.',
    },
    card: { ground: 'brand-1' },
    palette_build: { strategy: null, accent: '#C6F432', light_bg: '#F7F2EE', dark_bg: '#13061F', neutral_tint: null, neutral_chroma: null, extra: [] },
    defaults_used: [{ id: 'circle-container', why: 'Koło jest tu balonem gumy z prac Wkrenty, a nie kontenerem; bez niego znak traci sens.' }],
    rationale: [roleNote('Kierunek celowo przechylony w stronę Wkrenty; Styx jest w nim gościem.', 'judgement')],
  },
  palette: {
    schema: 'brand-identity/palette@1',
    name: 'Balon gumy',
    direction: 'Ultrafioletowa noc, guma balonowa, kwasowa limonka jako cień naklejki.',
    brand: [
      brand('brand-1', 'Ultrafioletowa noc', '#13061F', 'tło'),
      brand('brand-2', 'Guma balonowa', '#FF2E93', 'znak, logotyp, CTA'),
      brand('brand-3', 'Kwas', '#C6F432', 'cień naklejki, wyróżnienia'),
      brand('brand-4', 'Liliowy', '#E6DAF5', 'tekst, połysk'),
    ],
    feels: ['głośny', 'słodki', 'zadziorny'],
  },
  symbol_svg: C_sym,
  symbol_small_svg: null,
  wordmark_detail_svg: null,
};

writeFileSync(OUT, JSON.stringify({ schema: 'brand-identity/sets@1', sets: [setA, setB, setC] }, null, 2));
console.log('sets.json written');
