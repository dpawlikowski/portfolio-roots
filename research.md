# Research inspiracji

Data: 2026-11-12. Metoda: wyszukiwanie w katalogach (Awwwards, Codrops, Godly/Siteinspire przez wyszukiwarkę), odczyt kart Awwwards, pomiar Lighthouse (mobile, domyślne throttling Lighthouse 13.6, Chrome headless, jedna próba) na czterech stronach.

> Uczciwie o źródłach: opisy wzorców ruchu bazują na kartach Awwwards (tagi, nazwy elementów), opisach case studies i pomiarach. Codrops blokuje automatyczne pobieranie (HTTP 403), więc treści tych artykułów nie cytuję, opieram się na ich tytułach i streszczeniach w wynikach wyszukiwania. Nie skopiowałem żadnego zasobu: biorę wzorce, nie grafiki, kod ani fonty.

## (a) Pozioma galeria sterowana pionowym scrollem

| # | Referencja | Co działa | Wzorzec ruchu | Zapożyczam (wzorzec) | Unikam | Wpływ na wydajność |
|---|---|---|---|---|---|---|
| 1 | [GreenSock: pin + poziomy pasek](https://codepen.io/GreenSock/pen/ByKebqJ) | Kanoniczna, najprostsza implementacja | `pin` + `scrub`, `x: -(scrollWidth - innerWidth)` | Szkielet silnika: jeden tween na tor, pin na sekcji | Pinowania wielu zagnieżdżonych sekcji | Jeden transform na torze, tani |
| 2 | [Camille Mormal](https://www.camillemormal.com) | Galeria jest bohaterem, prawie zero UI | Pozioma galeria z WebGL i bezwładnością | Minimalizm UI, licznik prac, „jedna praca na ekranie” | Pełnego WebGL dla zdjęć (u nas zdjęcia zostają w DOM: SEO, alt, LCP) | **Zmierzone: Perf 96, A11y 100, BP 100, SEO 100, LCP 2,5 s, TBT 0 ms, 370 KB.** Dowód, że pozioma galeria nie musi być ciężka |
| 3 | [Awwwards: Horizontal to perspective gallery](https://www.awwwards.com/inspiration/horizontal-to-perspective-gallery-tommaso-dintino-travel-photos) | Ruch kart reaguje na prędkość | GSAP + ScrollTrigger (tagi), deformacja kart przy scrollu | Pochylenie kart od prędkości (u nas maks. 6°) | Mocnej perspektywy 3D, która zasłania zdjęcia | Transform-only, OK |
| 4 | [Codrops: Smooth Horizontal Parallax Gallery, DOM → WebGL (2026)](https://tympanus.net/codrops/2026/02/19/creating-a-smooth-horizontal-parallax-gallery-from-dom-to-webgl/) | Parallax obrazu wewnątrz karty | Obraz przesunięty względem ramki o kilka % | Parallax ±8% w DOM (`transform` na `<img>`) | Przenoszenia galerii do WebGL | DOM parallax: zero kosztu GPU poza kompozycją |

## (b) Dwa kontrastowe nastroje lub transformacja w trakcie scrolla

| # | Referencja | Co działa | Wzorzec ruchu | Zapożyczam (wzorzec) | Unikam | Wpływ na wydajność |
|---|---|---|---|---|---|---|
| 5 | [Käthe Kollwitz Memorial](https://kathememorial.com) ([element Awwwards](https://www.awwwards.com/inspiration/scroll-triggered-color-transition-kathe-kollwitz-memorial), Victor Work) | Kolor strony zmienia się sterowany scrollem, w WebGL | Scroll-triggered color transition (WebGL) | Zmianę świata jako jeden ciągły gest scrolla, nie klik | Ciężkiego JS na starcie | **Zmierzone: Perf 59, A11y 98, BP 96, SEO 100, LCP 2,7 s, TBT 1970 ms, 11,8 MB, JS 294 KB.** Lekcja: WebGL musi ładować się po LCP |
| 6 | [Codrops: „Golden at Sunset, Olive at Night”, portfolio Brandona Yasina](https://tympanus.net/codrops/?p=124097) | Dwa nastroje tej samej marki | Zmiana palety między stanami | System: wspólny szkielet, inna „pogoda” | Przełącznika motywu jako jedynej interakcji | Zmiana zmiennych CSS: tania |
| 7 | [Awwwards: Transition to Night Mode (Festive Fiends)](https://www.awwwards.com/inspiration/transition-to-night-mode-festive-fiends-1) | Przejście dzień/noc to wydarzenie, nie przełącznik | WebGL 3D transition | Przejście jako osobny „akt” z własną sceną | Sceny 3D (Three.js) | Pominięte 3D = −150 KB JS |

## (c) Tatuaż i strony o mocnym klimacie

| # | Referencja | Co działa | Wzorzec ruchu | Zapożyczam (wzorzec) | Unikam | Wpływ na wydajność |
|---|---|---|---|---|---|---|
| 8 | [Monolith Studio](https://monolithstudio.com), [SOTD 4.10.2024](https://www.awwwards.com/sites/monolith-studio), [case study](https://tympanus.net/codrops/2024/10/22/case-study-monolith-studio/) | Kilku artystów w jednym portfolio, każdy z własną sekcją; typografia + 3D | Fullscreen, minimal, typography, 3D (tagi) | Wspólna marka, osobne „światy” artystów | Ciężkiego 3D i wideo | **Zmierzone: Perf 59, A11y 93, BP 100, SEO 100, LCP 3,0 s, CLS 0,053, TBT 860 ms, 14,1 MB, JS 825 KB.** Najlepsze studio tatuażu w katalogu przegrywa na telefonie |
| 9 | [Flatbone Tattoo Studio](https://www.flatbone.ink/) ([HM 25.06.2024](https://www.awwwards.com/sites/flatbone-tattoo-studio)) | Scroll + przejścia w branży tatuażu, Next.js | Animation, scrolling, transitions (tagi) | Podpisy prac z miejscem na ciele i stylem | — | Pomiar nieudany: `CHROME_INTERSTITIAL_ERROR` (Lighthouse nie przeszedł strony przejściowej) |
| 10 | [Notorious Ink (Sztokholm)](https://www.awwwards.com/sites/notorious-ink) | Osobowość artystów jako treść | — | Krótkie manifesty artystów zamiast „O nas” | Długich bio | — |

## Wnioski z pomiarów (min. 3 strony)

| Strona | Perf | A11y | BP | SEO | LCP | CLS | TBT | Waga |
|---|---|---|---|---|---|---|---|---|
| monolithstudio.com | 59 | 93 | 100 | 100 | 3,0 s | 0,053 | 860 ms | 14,1 MB |
| kathememorial.com | 59 | 98 | 96 | 100 | 2,7 s | 0 | 1970 ms | 11,8 MB |
| camillemormal.com | 96 | 100 | 100 | 100 | 2,5 s | 0 | 0 ms | 0,37 MB |
| flatbone.ink | — | — | — | — | — | — | — | błąd pomiaru |

1. Strony z WebGL od pierwszej klatki tracą 35+ punktów Performance przez TBT i wagę. Nasz shader ładuje się w idle po LCP i tylko dla sekcji przejścia.
2. Strona, która ma w pomiarach 96, trzyma zdjęcia lekkie, a JS mały. Budżet 90 KB gzip i 500 KB transferu jest realistyczny.
3. W branży tatuażu poprzeczką jest klimat, ale nikt z mierzonych nie łączy go z szybkością. To nasza przewaga.

## Trzy kierunki

**A. „Negatyw” (wybrany).** Jedna linia dzieli świat na pół i staje się motywem całej strony: w hero to linia podziału, w galeriach krawędź karty, w przejściu brzeg rozpuszczającej się plamy. Ogromna typografia szeryfowa, dużo czerni lub kremu, jedna praca na ekranie. Galerie to taśma kontaktowa: numer, miejsce na ciele, rok.
```
[ MROK | BROKAT ]  →  [manifest][praca][praca]…  →  ░▒▓ plama ▓▒░  →  [manifest][praca]…  →  opinie ~~~  →  kontakt
```

**B. „Flash sheet”.** Strona jak arkusz wzorów z salonu: siatka szablonów, etykiety jak na kalce, galeria to arkusz przeciągany w bok. Bardzo branżowe i czytelne, ale siatka wielu prac łamie zasadę „jednej pracy na ekranie” i osłabia efekt poziomego aktu.

**C. „Rytuał”.** Teatralnie: dym, świece, ciężkie tekstury, potem eksplozja słodyczy. Najwięcej „wow” w pierwszych sekundach, ale wymaga wideo albo ciężkiego WebGL od startu i ryzykuje kicz w obu światach.

**Wybór: A**, bo jest najbliżej zasady „mniej efektów, ale idealnych”: jeden motyw (linia, plama) spina pięć efektów w jedną opowieść, zdjęcia pozostają bohaterem, a koszt wydajności jest najniższy. Z B biorę mikrocopy podpisów (miejsce, styl, rok jak na kalce).

## Licencje

| Zasób | Licencja | Źródło | Uwagi |
|---|---|---|---|
| Instrument Serif | SIL OFL 1.1 | google/fonts `ofl/instrumentserif` | Plik OFL w `assets-src/fonts/` |
| Fredoka (variable) | SIL OFL 1.1 | google/fonts `ofl/fredoka` | jw. |
| IBM Plex Mono | SIL OFL 1.1 | google/fonts `ofl/ibmplexmono` | jw. |
| Pirata One | SIL OFL 1.1 | google/fonts `ofl/pirataone` | Wyrenderowana do ścieżki SVG jednego słowa; plik fontu nie jest publikowany |
| Dźwięk | brak potrzeby licencji | Web Audio API | Syntezowany w przeglądarce, zero plików |
| Prace (placeholdery) | własne | `scripts/gen-placeholders.mjs` | Generatywne płytki, bez prawdziwych tatuaży |
| GSAP 3.15 | standardowa licencja GSAP (darmowa, także komercyjnie, od 3.13) | npm | Webflow udostępnił wszystkie wtyczki za darmo |
| Lenis | MIT | npm | |
