// WCAG 2.x contrast check for every text/background pair the design actually uses.
// Exits 1 if any text pair is below 4.5:1 (or 3:1 for large display text / UI parts).
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// [label, foreground, background, minimum]
const pairs = [
  ['bone text on ink', '#EFEAE3', '#0E0C0B', 4.5],
  ['silver text on ink', '#B8B2AB', '#0E0C0B', 4.5],
  ['ash text on ink', '#8F8A84', '#0E0C0B', 4.5],
  ['blood as text on ink (fill only, rejected)', '#C1121F', '#0E0C0B', 0],
  ['blood-text on ink (errors, asterisks)', '#FF5A5F', '#0E0C0B', 4.5],
  ['blood-text on ink-2 (form panel)', '#FF5A5F', '#171514', 4.5],
  ['silver on ink-2 (form hints)', '#B8B2AB', '#171514', 4.5],
  ['pink on ink (large display, links)', '#FF2E93', '#0E0C0B', 4.5],
  ['ink on bone button', '#0E0C0B', '#EFEAE3', 4.5],
  ['night on pink button', '#13061F', '#FF2E93', 4.5],
  ['lilac text on night', '#E6DAF5', '#13061F', 4.5],
  ['lilac-muted text on night', '#B9A8D1', '#13061F', 4.5],
  ['quiet violet on night (labels)', '#9A88B3', '#13061F', 4.5],
  ['pink on night (Wkrenta accents)', '#FF2E93', '#13061F', 4.5],
  ['lilac on night-2 (review cards)', '#E6DAF5', '#1E0C30', 4.5],
  ['focus ring bone vs ink (UI, 3:1)', '#EFEAE3', '#0E0C0B', 3],
];

let failed = 0;
for (const [label, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = min === 0 || r >= min;
  if (!ok) failed++;
  console.log(`${ok ? (min === 0 ? 'info' : 'pass') : 'FAIL'}  ${r.toFixed(2)}:1  ${label}`);
}
if (failed) {
  console.error(`${failed} contrast pair(s) below threshold`);
  process.exit(1);
}
