// Builds a tiny blurred preview (LQIP) and the dominant color for every work image.
// Runs before dev/build, so swapping a photo needs no manual step.
import { readdir, writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const DIR = 'src/assets/works';
const OUT = 'src/generated/lqip.json';
await mkdir('src/generated', { recursive: true });

const files = existsSync(DIR) ? (await readdir(DIR)).filter((f) => /\.(png|jpe?g|webp|avif)$/i.test(f)) : [];
let previous = {};
if (existsSync(OUT)) previous = JSON.parse(await readFile(OUT, 'utf8'));

const result = {};
for (const file of files) {
  const img = sharp(`${DIR}/${file}`);
  const { dominant } = await img.stats();
  const buf = await img.clone().resize(16).blur(1.2).webp({ quality: 40 }).toBuffer();
  result[file] = {
    color: `rgb(${dominant.r} ${dominant.g} ${dominant.b})`,
    src: `data:image/webp;base64,${buf.toString('base64')}`,
  };
}
const json = JSON.stringify(result);
if (json !== JSON.stringify(previous)) await writeFile(OUT, json);
console.log(`lqip: ${files.length} image(s)`);
