# TabGuard - Deduplicator Kart

Rozszerzenie do Chrome'a, które automatycznie zapobiega duplikatom kart przeglądarki.

[🇬🇧 Read in English](README.md)

## Funkcjonalność

Plugin obserwuje otwierane karty i automatycznie:
- Detektuje, gdy otwierasz kartę z tym samym URL co istniejąca karta
- Zamyka nowo otwartą kartę (duplikat)
- Przełącza się na starszą, istniejącą kartę z tym samym adresem
- **Włącza/wyłącza plugin** jednym przyciskiem
- **Wyklucza określone domeny** z detekcji duplikatów
- **Obsługa wielu języków** - angielski i polski (automatycznie wykrywanego na podstawie języka przeglądarki)

## Jak to działa

1. Plugin nasłuchuje na zdarzenia `onUpdated` dla każdej karty
2. Gdy strona się w pełni załaduje (`status === "complete"`)
3. Sprawdzane są wszystkie karty w tym samym oknie
4. Jeśli znaleziona zostanie inna karta z identycznym URL (ignorując fragmenty #)
5. Nowa karta zostaje zamknięta, a użytkownik przełącza się na starszą kartę

## Ustawienia

Otwórz opcje pluginu aby skonfigurować:
- **Włącz/Wyłącz**: Przełącz plugin włączony/wyłączony
- **Wykluczone Domeny**: Dodaj domeny, na których nie będą zamykane duplikaty

### Przykładowe wykluczone domeny
- `gmail.com` - dokładne dopasowanie domeny
- `*.example.com` - dopasowanie wieloznaczników dla dowolnych subdomen
- `mail.google.com` - konkretna poddomena

## Ignorowanie fragmentów URL

Plugin porównuje tylko główne części URL'a, ignorując fragmenty identyfikatora (`#`). Pozwala to na automatyczne usuwanie duplikatów nawet jeśli różnią się pozycją na stronie.

## Obsługa wielu języków

Plugin jest dostępny w:
- **Angielski** (domyślnie)
- **Polski**

Interfejs automatycznie przełącza się na podstawie ustawienia języka przeglądarki. Wszystkie komentarze w kodzie są w języku angielskim.

## Wyłączenia

Plugin nie działa dla:
- Kart w trybie incognito
- Kart bez URL
- Kart na wyklączonych domenach (skonfigurowane w ustawieniach)

## Instalacja

1. Otwórz `chrome://extensions/` w Chrome'ie
2. Włącz "Tryb programisty" (górny prawy róg)
3. Kliknij "Załaduj rozpakowany pakiet"
4. Wybierz folder `TabGuard`

## Dostęp do ustawień

1. Kliknij prawym przyciskiem na ikonę TabGuard w menu rozszerzeń
2. Kliknij "Opcje"
3. Lub przejdź do `chrome://extensions/` → TabGuard → "Szczegóły" → "Opcje rozszerzenia"

## Struktura projektu

```
TabGuard/
├── manifest.json              Plik konfiguracji (Manifest V3)
├── background.js              Service Worker z główną logiką
├── options.html               Strona ustawień (UI)
├── options.js                 Strona ustawień (logika)
├── _locales/
│   ├── en/messages.json       Tłumaczenia angielskie
│   └── pl/messages.json       Tłumaczenia polskie
├── icon16.png, icon48.png, icon128.png  Ikony rozszerzenia
├── README.md                  Dokumentacja angielska
├── README.pl.md               Dokumentacja polska
└── .gitignore                 Reguły Git ignore
```

## Ikony

Projekt zawiera ikony w trzech rozmiarach:
- `icon16.png` - 16x16 px
- `icon48.png` - 48x48 px
- `icon128.png` - 128x128 px

## Notatki dla deweloperów

Wszystkie komentarze w kodzie są napisane w języku angielskim dla spójności i łatwości utrzymania. Cały tekst widoczny dla użytkownika jest w pełni zlokalizowany za pośrednictwem Chrome i18n API.

