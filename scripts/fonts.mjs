// Subsets the OFL source fonts in assets-src/fonts into exactly three woff2 files
// (Latin + Polish) and prints fallback metrics for size-adjust.
//   Instrument Serif      → Styx (display)
//   Instrument Serif Italic → the second voice of every headline (Shrikhand is outlined to SVG, not loaded)
//   Bricolage Grotesque   → Roots brand: wordmark, UI, body (variable wght + wdth)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import subsetFont from 'subset-font';
import opentype from 'opentype.js';

const SRC = 'assets-src/fonts';
const OUT = 'src/assets/fonts';
const BRAND_OUT = 'brand/fonts';
await mkdir(OUT, { recursive: true });
await mkdir(BRAND_OUT, { recursive: true });

const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const latin1 = 'ÀÁÂÄÇÈÉÊËÍÎÓÔÖÚÜàáâäçèéêëíîóôöúü×·°«»';
const polish = 'ĄĆĘŁŃÓŚŹŻąćęłńóśźż';
const punct = '„”“’‘–—…→←↑↓↗★✦№§©®™ ';
export const TEXT = ascii + latin1 + polish + punct;

const jobs = [
  { src: 'InstrumentSerif-Regular.ttf', out: 'instrument-serif.woff2' },
  { src: 'InstrumentSerif-Italic.ttf', out: 'instrument-serif-italic.woff2' },
  // Pin optical size: display and text both read well at 32; keeps wght 200–800 and wdth 75–100.
  { src: 'BricolageGrotesque-Variable.ttf', out: 'bricolage.woff2', variationAxes: { opsz: 32, wdth: 100, wght: { min: 400, max: 800 } } },
];

for (const job of jobs) {
  const buf = await readFile(`${SRC}/${job.src}`);
  const options = { targetFormat: 'woff2' };
  if (job.variationAxes) options.variationAxes = job.variationAxes;
  const sub = await subsetFont(buf, TEXT, options);
  await writeFile(`${OUT}/${job.out}`, sub);
  await writeFile(`${BRAND_OUT}/${job.out}`, sub);
  console.log(`font ${job.out}: ${(sub.length / 1024).toFixed(1)} KB`);
}

// Fallback metrics: average advance of a Polish sample vs local system fonts.
const sample = 'Jedne korzenie. Dwa światy. Zażółć gęślą jaźń, studio tatuażu w Łodzi.';
const avg = (font) => [...sample].reduce((w, ch) => w + font.charToGlyph(ch).advanceWidth / font.unitsPerEm, 0) / sample.length;
const sys = { 'Times New Roman': 'C:/Windows/Fonts/times.ttf', Arial: 'C:/Windows/Fonts/arial.ttf', 'Arial Black': 'C:/Windows/Fonts/ariblk.ttf' };
const pairs = [
  ['InstrumentSerif-Regular.ttf', 'Times New Roman'],
  ['InstrumentSerif-Italic.ttf', 'Times New Roman'],
  ['BricolageGrotesque-Variable.ttf', 'Arial'],
];
for (const [src, fb] of pairs) {
  if (!existsSync(sys[fb])) continue;
  const f = opentype.parse((await readFile(`${SRC}/${src}`)).buffer);
  const g = opentype.parse((await readFile(sys[fb])).buffer);
  const k = avg(f) / avg(g);
  const upm = f.unitsPerEm;
  console.log(
    `${src} vs ${fb}: size-adjust ${(k * 100).toFixed(1)}%; ascent-override ${((f.tables.hhea.ascender / upm / k) * 100).toFixed(1)}%; descent-override ${((Math.abs(f.tables.hhea.descender) / upm / k) * 100).toFixed(1)}%`,
  );
}
