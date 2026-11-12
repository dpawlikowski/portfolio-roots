// Fails the production build while any placeholder is left in content/.
// A placeholder is: a record with isPlaceholder: true, a "[...]" token in a value,
// or an unknown "{{TOKEN}}" in copy. Set ALLOW_PLACEHOLDERS=1 for preview builds.
import { readFile, readdir } from 'node:fs/promises';

const DIR = new URL('../content/', import.meta.url);
const KNOWN_TOKENS = new Set([
  'NAZWA', 'MIASTO', 'MIASTO_MSC', 'STYX', 'WKRENTA',
  'CZAS_ODPOWIEDZI', 'WIEK',
]);
const bracket = /\[[^\]\n]{1,60}\]/;
const token = /\{\{([A-Z_]+)\}\}/g;

const problems = [];
function walk(value, path, file) {
  if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${path}[${i}]`, file));
  if (value && typeof value === 'object') {
    if (value.isPlaceholder === true) problems.push(`${file} ${path || '(root)'}: isPlaceholder: true`);
    for (const [k, v] of Object.entries(value)) if (!k.startsWith('_')) walk(v, path ? `${path}.${k}` : k, file);
    return;
  }
  if (typeof value !== 'string') return;
  if (bracket.test(value)) problems.push(`${file} ${path}: "${value.slice(0, 70)}"`);
  for (const m of value.matchAll(token)) {
    if (!KNOWN_TOKENS.has(m[1])) problems.push(`${file} ${path}: unknown token {{${m[1]}}}`);
  }
}

for (const name of (await readdir(DIR)).filter((f) => f.endsWith('.json'))) {
  walk(JSON.parse(await readFile(new URL(name, DIR), 'utf8')), '', `content/${name}`);
}
// Placeholder URL in production is also a placeholder.
const studio = JSON.parse(await readFile(new URL('studio.json', DIR), 'utf8'));
if (/example\.com/.test(studio.site.url)) problems.push('content/studio.json site.url: still example.com');

if (problems.length === 0) {
  console.log('check-placeholders: OK, no placeholders left.');
} else if (process.env.ALLOW_PLACEHOLDERS === '1') {
  console.warn(`check-placeholders: ${problems.length} placeholder(s) allowed (ALLOW_PLACEHOLDERS=1).`);
} else {
  console.error(`check-placeholders: ${problems.length} placeholder(s) block the production build:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nFill them in content/*.json, or use "npm run build:preview" for a test build.');
  process.exit(1);
}
