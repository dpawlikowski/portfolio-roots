// Generates .pages.yml (Pages CMS, https://pagescms.org) from the shape of content/*.json.
// Every key in the JSON files gets a field, so saving from the panel never drops data.
// `node scripts/gen-cms.mjs --check` fails when .pages.yml is out of date (part of `npm run check`).
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const OUT = '.pages.yml';
const MEDIA_OUTPUT = '/works';

const FILES = [
  { name: 'copy', label: 'Teksty strony', path: 'content/copy.json' },
  { name: 'works', label: 'Galerie prac', path: 'content/works.json' },
  { name: 'reviews', label: 'Opinie', path: 'content/reviews.json' },
  { name: 'studio', label: 'Dane studia', path: 'content/studio.json' },
];

// Labels by full path (dots, `[]` for list items) first, then by key.
const BY_PATH = {
  'copy.seo': 'SEO (tytuł i opis w Google)',
  'copy.nav': 'Menu',
  'copy.chapters': 'Nazwy rozdziałów',
  'copy.hero': 'Hero (pierwszy ekran)',
  'copy.hero.h1': 'Nagłówek (dwie linie)',
  'copy.styx': 'Rozdział: Styx',
  'copy.passage': 'Przejście (dwie linie)',
  'copy.wkrenta': 'Rozdział: Wkrenta',
  'copy.reviews': 'Sekcja opinii',
  'copy.contact': 'Kontakt',
  'copy.form': 'Formularz',
  'copy.form.sizes': 'Rozmiary do wyboru',
  'copy.sticky': 'Przycisk przyklejony na dole ekranu',
  'copy.footer': 'Stopka',
  'copy.lightbox': 'Powiększenie zdjęcia',
  'copy.notFound': 'Strona 404',
  'copy.faq': 'Najczęstsze pytania',
  'copy.faq.items': 'Pytania i odpowiedzi',
  'copy.nav.skip': 'Link „przejdź do treści” (dla klawiatury)',
  'copy.nav.styx': 'Link: Styx',
  'copy.nav.wkrenta': 'Link: Wkrenta',
  'copy.nav.reviews': 'Link: opinie',
  'copy.nav.contact': 'Link: kontakt',
  'copy.nav.sound': 'Przełącznik dźwięku',
  'copy.nav.motionReduce': 'Przełącznik „ogranicz ruch”',
  'copy.hero.pickStyx': 'Przycisk do prac Styxa',
  'copy.hero.pickWkrenta': 'Przycisk do prac Wkrenty',
  'copy.hero.scrollHint': 'Podpowiedź „przewiń”',
  'copy.hero.proofLabel': 'Dopisek przy ocenie',
  'copy.styx.social': 'Link do profilu',
  'copy.wkrenta.social': 'Link do profilu',
  'copy.reviews.ratingLabel': 'Opis oceny',
  'copy.reviews.countLabel': 'Opis liczby opinii',
  'copy.reviews.profileLink': 'Link do wizytówki',
  'copy.reviews.sampleBadge': 'Znaczek przykładowej opinii',
  'copy.reviews.empty': 'Tekst, gdy brak opinii',
  'copy.contact.address': 'Etykieta: adres',
  'copy.contact.hours': 'Etykieta: godziny',
  'copy.contact.phone': 'Etykieta: telefon',
  'copy.contact.email': 'Etykieta: e-mail',
  'copy.contact.mapButton': 'Przycisk mapy',
  'copy.contact.mapNote': 'Dopisek pod mapą',
  'copy.contact.mapLink': 'Link „wyznacz trasę”',
  'copy.contact.socialHeading': 'Nagłówek profili',
  'copy.form.heading': 'Nagłówek formularza',
  'copy.form.name': 'Pole: imię',
  'copy.form.contact': 'Pole: kontakt',
  'copy.form.contactHint': 'Podpowiedź pod kontaktem',
  'copy.form.artist': 'Pole: artysta',
  'copy.form.artistStyx': 'Opcja: Styx',
  'copy.form.artistWkrenta': 'Opcja: Wkrenta',
  'copy.form.artistUnsure': 'Opcja: nie wiem',
  'copy.form.idea': 'Pole: pomysł',
  'copy.form.ideaHint': 'Podpowiedź pod pomysłem',
  'copy.form.files': 'Pole: zdjęcia',
  'copy.form.filesHint': 'Podpowiedź pod zdjęciami',
  'copy.form.filesButton': 'Przycisk dodawania plików',
  'copy.form.filesRemove': 'Przycisk usuwania pliku',
  'copy.form.filesTooMany': 'Błąd: za dużo plików',
  'copy.form.filesTooBig': 'Błąd: za duży plik',
  'copy.form.filesWrongType': 'Błąd: zły typ pliku',
  'copy.form.placement': 'Pole: miejsce na ciele',
  'copy.form.placementHint': 'Podpowiedź pod miejscem',
  'copy.form.size': 'Pole: rozmiar',
  'copy.form.age': 'Zgoda: wiek',
  'copy.form.privacy': 'Informacja o danych',
  'copy.form.submit': 'Przycisk wysyłania',
  'copy.form.sending': 'W trakcie wysyłania',
  'copy.form.success': 'Po wysłaniu',
  'copy.form.error': 'Błąd wysyłania',
  'copy.form.invalid': 'Błąd: popraw pola',
  'copy.form.demo': 'Informacja w trybie podglądu',
  'copy.form.required': 'Błąd: pole wymagane',
  'copy.form.emailInvalid': 'Błąd: zły e-mail lub telefon',
  'copy.form.ageRequired': 'Błąd: brak zgody na wiek',
  'copy.form.requiredNote': 'Informacja o polach wymaganych',
  'copy.form.optional': 'Dopisek „opcjonalnie”',
  'copy.form.requiredMark': 'Opis gwiazdki dla czytników',
  'copy.form.counter': 'Licznik znaków ({n}, {max})',
  'copy.footer.line': 'Linia w stopce',
  'copy.footer.egg': 'Ukryty przycisk',
  'copy.footer.eggText': 'Ukryty tekst',
  'copy.lightbox.close': 'Zamknij',
  'copy.lightbox.prev': 'Poprzednie',
  'copy.lightbox.next': 'Następne',
  'copy.lightbox.hint': 'Podpowiedź',
  'copy.notFound.back': 'Link powrotu',
  'copy.faq.items[].q': 'Pytanie',
  'copy.faq.items[].a': 'Odpowiedź',
  'works.styx': 'Prace Styxa',
  'works.wkrenta': 'Prace Wkrenty',
  'reviews.rating': 'Ocena w Google',
  'reviews.rating.value': 'Średnia ocena',
  'reviews.rating.count': 'Liczba opinii',
  'reviews.rating.checked': 'Data sprawdzenia (RRRR-MM-DD)',
  'reviews.rating.source': 'Link do wizytówki Google',
  'reviews.items': 'Opinie klientów',
  'reviews.items[].world': 'Artysta',
  'reviews.items[].rating': 'Ocena (1–5)',
  'reviews.items[].source': 'Link do opinii (wymagany, żeby opinia się pokazała)',
  'reviews.otherSources': 'Inne źródła ocen',
  'studio.legalName': 'Nazwa firmy',
  'studio.city': 'Miasto',
  'studio.cityLocative': 'Miasto w miejscowniku (w Łodzi → „Łodzi”)',
  'studio.address': 'Adres',
  'studio.geo': 'Współrzędne mapy',
  'studio.hours': 'Godziny otwarcia',
  'studio.hours[].label': 'Dni (tekst na stronie)',
  'studio.hours[].time': 'Godziny (tekst na stronie)',
  'studio.hours[].schemaDays': 'Dni po angielsku dla Google (Monday…)',
  'studio.hours[].opens': 'Otwarcie (GG:MM, puste = zamknięte)',
  'studio.hours[].closes': 'Zamknięcie (GG:MM)',
  'studio.social': 'Profile (same nazwy kont, bez linku)',
  'studio.googleProfileUrl': 'Link do wizytówki Google',
  'studio.site': 'Domena i ustawienia',
  'studio.site.url': 'Adres strony (docelowa domena)',
  'studio.booking': 'Rezerwacje',
  'studio.booking.formspreeId': 'ID formularza Formspree',
  'studio.booking.responseTime': 'Czas odpowiedzi (np. 24 h)',
  'studio.booking.agePolicy': 'Zasada wieku',
  'studio.artists': 'Artyści',
};
const BY_KEY = {
  _note: 'Instrukcja',
  _source: 'Źródło danych',
  _tokens: 'Dostępne znaczniki',
  isPlaceholder: 'Treść zastępcza (przykład)',
  id: 'Identyfikator (unikalny, bez spacji)',
  src: 'Zdjęcie (pion 4:5, min. 1600 × 2000 px)',
  caption: 'Tytuł pracy',
  placement: 'Miejsce na ciele',
  style: 'Styl',
  year: 'Rok',
  alt: 'Opis zdjęcia dla osób niewidomych',
  label: 'Etykieta',
  h2: 'Nagłówek',
  text: 'Tekst',
  lead: 'Wstęp',
  outro: 'Zakończenie',
  cta: 'Przycisk',
  title: 'Tytuł',
  description: 'Opis',
  author: 'Autor',
  name: 'Nazwa',
  genitive: 'Odmiana: kogo? (np. Styxa)',
  styles: 'Style',
  phone: 'Telefon',
  email: 'E-mail',
  nip: 'NIP',
  instagram: 'Instagram',
  facebook: 'Facebook',
  street: 'Ulica i numer',
  postalCode: 'Kod pocztowy',
  locality: 'Miejscowość',
  country: 'Kraj (kod, np. PL)',
  lat: 'Szerokość geograficzna',
  lon: 'Długość geograficzna',
  value: 'Wartość',
  count: 'Liczba opinii',
  checked: 'Data sprawdzenia (RRRR-MM-DD)',
  url: 'Link',
};
const SUMMARY = {
  'works.styx': '{caption}',
  'works.wkrenta': '{caption}',
  'reviews.items': '{author}',
  'reviews.otherSources': '{label}',
  'copy.faq.items': '{q}',
  'studio.hours': '{label}',
};
const DESCRIPTION = {
  isPlaceholder: 'Zaznaczone = przykład. Wersja produkcyjna nie zbuduje się, dopóki zostaną przykłady. Odznacz po wpisaniu prawdziwej treści.',
  'reviews.items': 'Tylko prawdziwe opinie, za zgodą autora i z linkiem do źródła.',
  'works.styx': 'Kolejność na liście = kolejność w galerii. Najlepiej 8–10 prac.',
  'works.wkrenta': 'Kolejność na liście = kolejność w galerii. Najlepiej 8–10 prac.',
  'copy.hero.h1': 'Druga linia jest pisana kursywą.',
  'copy.passage': 'Druga linia jest pisana kursywą.',
};

// Multi-line editor for these keys; decided by key (not length) so content edits never change the config.
const LONG_KEYS = new Set(['text', 'lead', 'a', 'alt', 'description', 'success', 'demo', 'privacy', 'error', 'filesHint']);
const q = (s) => JSON.stringify(s);
const labelFor = (path, key) => BY_PATH[path] ?? BY_KEY[key] ?? key;

function field(key, value, path, samples) {
  const f = { name: key, label: labelFor(path, key) };
  const desc = DESCRIPTION[path] ?? DESCRIPTION[key];
  if (desc) f.description = desc;
  if (key.startsWith('_')) return { ...f, type: 'text', readonly: true };
  if (path.endsWith('[].src') && path.startsWith('works.')) {
    return { ...f, type: 'image', required: true, options: { extensions: ['jpg', 'jpeg', 'png', 'webp'], rename: 'safe' } };
  }
  if (path === 'reviews.items[].world') {
    return { ...f, type: 'select', required: true, options: { values: [{ name: 'styx', label: 'Styx' }, { name: 'wkrenta', label: 'Wkrenta' }] } };
  }
  if (Array.isArray(value)) {
    const items = samples.flatMap((s) => (Array.isArray(s) ? s : []));
    const objects = items.filter((v) => v && typeof v === 'object' && !Array.isArray(v));
    if (objects.length) {
      const summary = SUMMARY[path];
      return { ...f, type: 'object', list: summary ? { collapsible: { collapsed: true, summary } } : true, fields: objectFields(objects, `${path}[]`) };
    }
    return { ...f, type: 'string', list: true };
  }
  if (value && typeof value === 'object') return { ...f, type: 'object', fields: objectFields(samples, path) };
  if (typeof value === 'boolean') return { ...f, type: 'boolean' };
  if (typeof value === 'number') return { ...f, type: 'number' };
  return { ...f, type: LONG_KEYS.has(key) ? 'text' : 'string' };
}

// Union of keys across samples, in first-seen order; null samples fall back to the first non-null value.
function objectFields(samples, path) {
  const keys = [];
  for (const s of samples) for (const k of Object.keys(s ?? {})) if (!keys.includes(k)) keys.push(k);
  return keys.map((k) => {
    const values = samples.map((s) => s?.[k]).filter((v) => v !== undefined);
    const typed = values.find((v) => v !== null) ?? null;
    return field(k, typed, `${path}.${k}`, values);
  });
}

function yaml(value, indent) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v !== 'object')) return ` [${value.map(q).join(', ')}]`;
    return '\n' + value.map((v) => `${pad}- ${yaml(v, indent + 2).trimStart()}`).join('\n');
  }
  if (value && typeof value === 'object') {
    return '\n' + Object.entries(value).map(([k, v]) => `${pad}${k}:${yaml(v, indent + 2)}`).join('\n');
  }
  return ` ${typeof value === 'string' ? q(value) : value}`;
}

const content = [];
for (const file of FILES) {
  const data = JSON.parse(await readFile(file.path, 'utf8'));
  content.push({ name: file.name, label: file.label, type: 'file', path: file.path, format: 'json', fields: objectFields([data], file.name) });
}

const config = {
  media: { input: 'src/assets/works', output: MEDIA_OUTPUT, extensions: ['jpg', 'jpeg', 'png', 'webp'], rename: 'safe' },
  content,
};
const text = `# Generated by scripts/gen-cms.mjs from content/*.json. Do not edit by hand: run \`npm run cms\`.\n${yaml(config, 0).trimStart()}\n`;

if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? await readFile(OUT, 'utf8') : '';
  if (current !== text) {
    console.error(`${OUT} is out of date with content/*.json. Run: npm run cms`);
    process.exit(1);
  }
  console.log(`${OUT}: up to date`);
} else {
  await writeFile(OUT, text);
  console.log(`${OUT}: ${content.length} files`);
}
