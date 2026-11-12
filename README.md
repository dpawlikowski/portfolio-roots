# Roots Tattoo · strona studia

Jednostronicowa strona studia tatuażu Roots Tattoo w Łodzi. Dwoje artystów, dwie temperatury: **Styx** (realizm w czerni i szarości) i **Wkrenta** (kolor). Scroll prowadzi od hero przez galerię Styxa, przejście „czerń → kolor” (shader WebGL2), galerię Wkrenty, opinie i pytania do formularza.

**Podgląd:** https://dpawlikowski.github.io/portfolio-roots/ (wersja podglądowa z oznaczonymi placeholderami, `noindex`).

## Stack

| Warstwa | Wybór |
|---|---|
| Framework | Astro 7 (SSG), TypeScript |
| Ruch | GSAP 3.15 + ScrollTrigger, Lenis (tylko kółko i trackpad) |
| Efekty | surowy WebGL2 (przejście), Canvas 2D (ślad kursora), Web Audio (syntezowany dźwięk) |
| Style | czysty CSS, tokeny z księgi znaku |
| Obrazy | `astro:assets` + sharp: AVIF/WebP, srcset, LQIP |
| Fonty | 3 pliki woff2 (Instrument Serif regular i italic, Bricolage Grotesque), podzbiór z polskimi znakami |
| Formularz | Formspree (z załącznikami), działa też bez JS |
| Hosting | GitHub Pages (workflow w repo) albo Cloudflare Pages (`public/_headers`) |

## Uruchomienie

```bash
npm ci
npm run dev            # http://localhost:4321
npm run build:preview  # build z placeholderami (oznaczone „przykład”, noindex)
npm run build          # build produkcyjny: przerywa się, dopóki są placeholdery
npm run preview        # podgląd zbudowanej strony
npm run check:contrast # kontrast par kolorów (WCAG AA)
npm run cms            # odtwarza konfigurację panelu .pages.yml z content/*.json
```

Wymagany Node 22+. Na Windowsie w Git Bash ustaw `MSYS_NO_PATHCONV=1`, jeśli podajesz `BASE_PATH`.

## Panel do edycji treści (Pages CMS)

Treść edytuje się w przeglądarce na **https://app.pagescms.org**, bez instalowania czegokolwiek. Pages CMS to darmowy panel open source: zapisuje zmiany jako commity w tym repozytorium, a GitHub Actions publikuje stronę po 1–2 minutach.

**Pierwsze uruchomienie (raz):**
1. Wejdź na https://app.pagescms.org i zaloguj się kontem GitHub.
2. Zainstaluj aplikację Pages CMS na koncie z repozytorium i daj jej dostęp tylko do `portfolio-roots`.
3. Otwórz repozytorium `portfolio-roots`, gałąź `main`.
4. Żeby dać dostęp komuś ze studia: dodaj tę osobę jako współpracownika repozytorium na GitHubie albo zaproś ją w panelu jako współpracownika (*collaborator*) przez e-mail. Taka osoba edytuje treści i zdjęcia bez konta GitHub, ale nie zmienia konfiguracji panelu.

**Co jest w panelu:**

| Sekcja | Co zmienisz |
|---|---|
| Teksty strony | Nagłówki, opisy artystów, kontakt, formularz, pytania i odpowiedzi |
| Galerie prac | Zdjęcia prac Styxa i Wkrenty, tytuły, miejsce na ciele, styl, opis zdjęcia; kolejność na liście = kolejność w galerii |
| Opinie | Ocena z Google, opinie klientów, inne źródła ocen |
| Dane studia | Zdjęcia profilowe Styxa i Wkrenty (*Artyści → Styx/Wkrenta → Zdjęcie profilowe*), adres, godziny, telefon, e-mail, profile, Formspree, czas odpowiedzi, domena |

**Dodanie pracy:** *Galerie prac → Prace Styxa (albo Wkrenty) → Add an entry*. Wgraj zdjęcie (JPG, PNG albo WebP, pion 4:5, min. 1600 × 2000 px) i wpisz unikalny identyfikator, np. `styx-09`. Uzupełnij podpisy i odznacz „Treść zastępcza”. Zdjęcie trafia do `src/assets/works/`, a stronę w AVIF/WebP i rozmyty podgląd buduje się sam.

**Zdjęcie profilowe:** kwadrat, min. 600 × 600 px, twarz na środku (strona przycina je do koła). U Styxa wyświetla się w czerni i bieli, u Wkrenty w kolorze.

**Zasady:**
- Pole „Treść zastępcza (przykład)” zaznaczone = przykład. Odznacz je po wpisaniu prawdziwej treści, bo wersja produkcyjna nie zbuduje się, dopóki zostaną przykłady.
- Znaczniki `{{MIASTO}}`, `{{STYX}}` itd. w tekstach zostaw: strona wstawia za nie dane studia.
- Po zapisie postęp publikacji widać w zakładce **Actions** repozytorium. Jeśli build się nie uda, online zostaje poprzednia wersja strony.

**Dla dewelopera:** konfigurację panelu, plik `.pages.yml`, generuje `npm run cms` z kształtu plików `content/*.json`, więc każde pole w JSON ma swoje pole w panelu. Po dodaniu albo usunięciu klucza w `content/` uruchom `npm run cms`. `npm run check` przypomni o tym, jeśli konfiguracja jest nieaktualna.

## Podmiana treści w 10 minut

Cała treść jest w `content/`. Kod nie wymaga zmian. Najprościej zrobić to w panelu (sekcja wyżej), a poniżej jest to samo w plikach.

1. **Dane studia:** `content/studio.json` (adres, godziny, telefon, e-mail, profile, Formspree, czas odpowiedzi, polityka wieku, adres strony).
2. **Teksty:** `content/copy.json`. Tokeny `{{STYX}}`, `{{MIASTO_MSC}}` itd. wypełniają się z `studio.json`. Zasady głosu są w `brand/STORY.md`.
3. **Prace:** wrzuć zdjęcia 4:5 (min. 1600 × 2000 px) do `src/assets/works/` i wpisz je w `content/works.json` jako `"src": "/works/nazwa-pliku.jpg"`, popraw podpis, miejsce, styl i opis alternatywny (`alt`), ustaw `isPlaceholder: false`. Podgląd rozmycia (LQIP) generuje się sam przy `dev` i `build`.
4. **Opinie:** `content/reviews.json`. Tylko prawdziwe opinie, ze źródłem i za zgodą autora. Ocena i liczba opinii z Google są w `rating`.
5. **Kolory:** `src/styles/tokens.css` (role `--ink`, `--bone`, `--pink`…). Po zmianie uruchom `npm run check:contrast`.
6. **Dźwięk:** `src/scripts/audio.ts` (częstotliwości drona, nuty pozytywki, głośność). Dźwięk jest domyślnie wyłączony.
7. **Grafiki marki i social media:** `npm run brand` odtwarza `brand/` (posty, awatary, okładki, wyróżnione relacje).

`npm run build` sprawdza `content/` i przerywa build, dopóki zostało coś w nawiasach kwadratowych albo rekord z `isPlaceholder: true`.

## Deploy

**GitHub Pages:** `.github/workflows/deploy.yml` buduje wersję podglądową przy każdym pushu na `main`. Jednorazowo: *Settings → Pages → Build and deployment → Source: GitHub Actions*.

**Docelowa domena (np. Cloudflare Pages):** komenda `npm run build`, katalog `dist`, zmienna `SITE_URL=https://twoja-domena.pl`. Build przejdzie dopiero po uzupełnieniu placeholderów.

## Struktura

```
content/            treść (JSON) i jedyne miejsce do edycji
src/components/     sekcje strony (Hero, Act, Passage, Reviews, Faq, Contact…)
src/scripts/        ui.ts (zawsze), motion.ts (po pierwszej interakcji), shader/trail/audio (leniwie)
src/styles/         tokens, base, hero, act, passage, sections
scripts/            fonty, płytki zastępcze, OG i favicony, LQIP, blokada placeholderów, kontrast, grafiki marki
brand/              logo, księga znaku (PDF), social media, filozofia, copy, marketing
brand-work/         źródła identyfikacji (brand-identity: zestawy, kit)
```

## Jakość (pomiar lokalny, Lighthouse 13.6, mobile, build podglądowy)

Wydajność 96, dostępność 100, dobre praktyki 100, SEO 100. LCP 1,0 s, CLS 0,001, TBT 230 ms, transfer 154 KB. Początkowy JS ~5 KB gzip; silnik scrolla (~52 KB gzip z GSAP) ładuje się po pierwszej interakcji, shader, ślad i dźwięk osobno.

## Dokumenty

`research.md` (inspiracje), `design-brief.md` (decyzje), `ASSUMPTIONS.md` (założenia i rzeczy do potwierdzenia), `brand/PHILOSOPHY.md`, `brand/STORY.md`, `brand/SOCIAL.md`, `brand/MARKETING.md`.
