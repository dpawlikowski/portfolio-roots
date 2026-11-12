// Renders a logo review sheet: wordmark on dark/light, seal, small sizes.
import sharp from 'sharp';
import { C, wordmark, seal } from './brand-lib.mjs';

const d = wordmark({ id: 'a' });
const l = wordmark({ id: 'b', color: C.vink, tone: 'light' });
const s1 = seal({ id: 's1' });
const s2 = seal({ id: 's2', color: C.vink, tone: 'light' });
const small = wordmark({ id: 'c', sub: null });
const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000'><defs>${d.defs}${l.defs}${s1.defs}${s2.defs}${small.defs}</defs>
<rect width='1600' height='500' fill='${C.ink}'/><rect y='500' width='1600' height='500' fill='${C.paper}'/>
<g transform='translate(70 110) scale(1.3)'>${d.svg}</g>
<g transform='translate(660 40) scale(.82)'>${s1.svg}</g>
<g transform='translate(1150 90) scale(.6)'>${small.svg}</g>
<g transform='translate(1150 260) scale(.3)'>${small.svg}</g>
<g transform='translate(1150 340)'><rect width='120' height='120' rx='60' fill='#000'/><g transform='translate(4 4) scale(.215)'>${s1.svg}</g></g>
<g transform='translate(70 610) scale(1.3)'>${l.svg}</g>
<g transform='translate(660 540) scale(.82)'>${s2.svg}</g>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(process.argv[2] ?? 'brand/_logo-sheet.png');
