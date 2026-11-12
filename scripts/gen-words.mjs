// Outlines display words that would otherwise cost a font request: Wkrenta's name in Shrikhand.
import { writeFile, mkdir } from 'node:fs/promises';
import { fonts, textPath } from './brand-lib.mjs';

await mkdir('src/generated', { recursive: true });
const size = 100;
const { d, width } = textPath(fonts.pop, 'Wkrenta', 0, size * 0.78, size);
await writeFile('src/generated/words.json', JSON.stringify({ wkrenta: { d, viewBox: `-2 -6 ${Math.ceil(width) + 6} ${Math.ceil(size * 1.06)}` } }));
console.log(`words: Wkrenta outlined (${d.length} chars)`);
