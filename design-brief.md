# Design brief (stan obecny)

Każda decyzja ma jedno zdanie uzasadnienia. Pierwotny kierunek „mrok i brokat” zastąpiła identyfikacja zbudowana na pracach artystów (zestaw A „Dwa spojrzenia”, `brand-work/roots-tattoo/kit/A`).

## Cel i znak rozpoznawczy

| Decyzja | Uzasadnienie |
|---|---|
| Cel: wiadomość z pomysłem na tatuaż (formularz lub Instagram) | Efekty mają prowadzić do kontaktu, nie zastępować go. |
| Znak rozpoznawczy: oczy w literach O logotypu i przejście „czerń → kolor” sterowane scrollem | Ten sam motyw (dwie temperatury) spina logo, strukturę strony i social media. |
| Dowód społeczny już w hero (5,0 w Google) | Studio jest małe, a ocena to jego najmocniejszy, prawdziwy argument. |

## Identyfikacja

| Element | Wybór | Uzasadnienie |
|---|---|---|
| Logo | „ROOTS” w Bricolage 800; w O szare oko (Styx) i różowe kocie oko (Wkrenta), z kroplami | Czytelne słowo plus motyw z prac obojga (oczy, portrety). |
| Kolory | czerń #0E0C0B, kość #EFEAE3, popiół #8F8A84, krew #C1121F (tylko wypełnienie), róż #FF2E93, noc #13061F | Ciemna scena, dwie temperatury; każda para tekst/tło przechodzi AA (`npm run check:contrast`). |
| Typografia | Instrument Serif (nagłówki, kursywa jako drugi głos), Bricolage Grotesque (UI, tekst) | Redakcyjny kontrast z wąskimi groteskami konkurencji w Łodzi. |
| Imię Wkrenty | Shrikhand jako ścieżka SVG | Jej popowy podpis bez dodatkowego pliku fontu. |

## Struktura strony

| Sekcja | Rola |
|---|---|
| Hero | Kto, gdzie, dla kogo; szew dzieli zdanie na dwie temperatury; dwa przyciski do galerii; ocena. |
| Styx | Pin + przesuw w prawo, licznik, latarnia odsłania ukryte oczy, krótki glitch tytułu. |
| Przejście | „Tyle czerni. / Teraz kolor.”, shader WebGL2 (fallback CSS). |
| Wkrenta | Ten sam mechanizm galerii, różowy połysk kart i ślad kursora. |
| Opinie | Ocena Google, polecenia Wkrenty na Facebooku, wstęga opinii (tylko prawdziwe w produkcji). |
| Pytania | Cena, pierwszy tatuaż, ból, przygotowanie, wiek: odpowiedzi na typowe obawy. |
| Kontakt | Dane, profile, mapa po kliknięciu, formularz z załącznikami i walidacją na żywo. |

## Ruch i wydajność

| Decyzja | Uzasadnienie |
|---|---|
| Silnik scrolla po pierwszej interakcji, shader w pobliżu przejścia | Pierwsze wyświetlenie bez ciężkiego JS (Lighthouse mobile 96, LCP 1,0 s). |
| Tylko `transform`, `opacity`, `clip-path` i zmienne CSS; zapis do stylów tylko przy zmianie wartości | Brak pracy w bezczynności, płynność na słabszych telefonach. |
| Strażnik płynności (< 45 fps przez 2 s → bez shadera) | Efekt nigdy nie kosztuje czytelności. |
| `prefers-reduced-motion` + przełącznik „Ogranicz ruch” | Wszystko działa bez ruchu, galerie przewija się natywnie. |

## Copy

Głos: spokojnie, konkretnie, jak studio przy ladzie. Wkrenta mówi własnymi słowami, o Styxie mówi studio. Szczegóły i uzasadnienia: `brand/STORY.md`, `brand/MARKETING.md`.
