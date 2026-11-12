# Założenia i rzeczy do potwierdzenia

Stan na 12.11.2026. Wszystko da się zmienić w `content/` albo w jednym pliku stylu. Pozycje w nawiasach kwadratowych blokują build produkcyjny (`npm run build`).

## Dane zweryfikowane (publiczne źródła, 12.11.2026)

- Roots Tattoo, ul. Organizacji „Wolność i Niezawisłość” 45, 91-825 Łódź; pon.–pt. 10–17, sob. 10–15, niedz. zamknięte; telefon +48 539 526 083 (wizytówka Google).
- Ocena 5,0 z 15 opinii w Google; Wkrenta: 100% poleceń, 12 opinii na Facebooku.
- Instagram studia @rootstattoolodz, Wkrenty @wkrenta; Styx: Facebook „Maciej Zygała STYX” (konto Instagram nie zostało znalezione).
- Style: Styx to realizm black & grey (rękawy, portrety, dark art), Wkrenta to kolorowy realizm i pop, z gotowymi projektami.

## Do uzupełnienia przez studio

1. Nazwa firmy i NIP (stopka).
2. E-mail studia.
3. ID formularza Formspree. **Załączniki wymagają płatnego planu Formspree** (albo innego backendu z obsługą plików). Bez tego pole plików zostaje, ale pliki trzeba wysłać w wiadomości na Instagramie.
4. Czas odpowiedzi („w ciągu 24 h”) i polityka wieku („tylko osoby pełnoletnie”).
5. Zdjęcia prac (8 na artystę, 4:5) w miejsce płytek zastępczych, z prawdziwymi podpisami.
6. Prawdziwe opinie z Google, ze źródłem i za zgodą autorów.
7. Docelowa domena (`site.url`).

## Decyzje do akceptacji

8. „Styx, czyli Maciek”: imię z publicznej strony artysty. Jeśli woli sam pseudonim, wystarczy usunąć to zdanie w `content/copy.json`.
9. „Część klientów wraca do niego po kolejne” i „robi też pierwsze tatuaże”: parafraza publicznych opinii w Google.
10. Higiena (jednorazowe igły, osłony) celowo nie jest opisana, dopóki studio tego nie potwierdzi.
11. Ocena z Google jest pokazana na stronie z linkiem do źródła, ale nie jest oznaczona w danych strukturalnych (`aggregateRating`): Google nie dopuszcza takiej oceny własnej firmy.

## Interpretacje briefu

12. Kierunek „mrok i brokat” z pierwotnego briefu zastąpiłem tym, co artyści faktycznie robią: czerń i szarość (Styx) oraz kolor (Wkrenta). Nazwy rozdziałów to imiona artystów.
13. Wkrenta mówi w pierwszej osobie, swoimi zwrotami z profili. O Styxie mówi studio.
14. Scroll w dół przesuwa widok w prawo po galerii (tor jedzie w lewo).
15. Pinowanie działa też na telefonie (z przyciąganiem do kart); bez JS, przy ograniczonym ruchu i na niskich ekranach (< 500 px) galeria jest natywnym poziomym przewijaniem.
16. Silnik scrolla ładuje się po pierwszej interakcji (scroll, dotyk, klawisz, ruch myszy nad hero), shader dopiero w pobliżu przejścia. Strona jest w pełni czytelna wcześniej.
17. Dźwięk jest domyślnie wyłączony; zapamiętany wybór „wł.” włącza dźwięk dopiero po kliknięciu albo klawiszu, nigdy po samym scrollu.
18. Mapa ładuje się z OpenStreetMap dopiero po kliknięciu; „Wyznacz trasę” prowadzi do wizytówki Google.
19. Wersja na GitHub Pages to podgląd: placeholdery z etykietą „przykład”, `noindex` i `Disallow` w robots.txt.

## Ograniczenia i ryzyka

- TBT w Lighthouse mobile to 230 ms (cel z briefu < 100 ms); wynik wydajności 96.
- Brak testów Playwright, axe w CI i nagrań przewijania: nie zostały jeszcze napisane.
- Strona była sprawdzana w Chrome (desktop i emulacja telefonu 375 px). Safari i fizyczne urządzenia nie zostały przetestowane.
