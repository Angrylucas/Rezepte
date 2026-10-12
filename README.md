# Rezepte

Private Rezept-Website mit gesunden, proteinreichen Rezepten. Statische Seite ohne Abhängigkeiten, gehostet auf Vercel.

## Funktionen

- Startseite mit Suche (Titel, Zutaten, Kategorien) und Filtern (Hauptmahlzeit, Frühstück, Dessert, Saisonal, Schnell …)
- Rezeptseite mit grossem Bild, Nährwerten und Portionen-Eingabe: alle Mengen werden automatisch umgerechnet
- Standard sind immer **2 Portionen**, egal für wie viele Portionen das Rezept geschrieben ist
- Umschalter **Normal** (alle Schritte) / **Kochmodus** (ein Schritt pro Bildschirm, mit Wischen oder Pfeiltasten, Bildschirm bleibt an)

## Neues Rezept hinzufügen

1. `rezepte/_vorlage.md` kopieren und umbenennen, z. B. `rezepte/linsen-curry.md`. Der Dateiname wird zur Adresse (`#/rezept/linsen-curry`).
2. Oben die Angaben ausfüllen. `portionen` ist die Anzahl, für die das Rezept **geschrieben** ist (z. B. 4). Die Website rechnet automatisch auf 2 um.
3. Zutaten als Liste (`- 200 g Reis`), Schritte nummeriert (`1. …`). Zwischentitel bei den Zutaten mit `### Sauce`.
4. Committen und pushen. Vercel baut die Seite automatisch neu.

### Felder

| Feld | Bedeutung |
| --- | --- |
| `titel` | Name des Rezepts |
| `kategorie` | Frühstück, Suppen, Poulet & Truten, Fisch, Fleisch, Backen (oder neu) |
| `portionen` | Für wie viele Portionen die Mengen gelten |
| `standardportionen` | Optional. Nur setzen, wenn nicht 2 angezeigt werden soll (z. B. Brot: 1) |
| `einheit` | Optional, z. B. `Brot` statt „Portionen“ |
| `portionen_hinweis` | Optional, z. B. `je 6 Rollen` |
| `kcal`, `protein`, `ballaststoffe` | Pro Portion (geschätzt) |
| `zeit`, `zeit_hinweis` | Minuten, plus optionaler Hinweis wie `plus 4 Std. marinieren` |
| `tags` | Für die Filter: Hauptmahlzeit, Frühstück, Suppe, Dessert, Backen, Geflügel, Fisch, Fleisch, Vegetarisch |
| `saison` | Frühling, Sommer, Herbst, Winter oder ganzjährig. Steuert den Filter „Saisonal“ |
| `emoji` | Wird als Platzhalter gezeigt, solange kein Bild vorhanden ist |
| `bild` | Optional: Pfad oder URL zu einem Bild |

### Mengen

- Erkannt werden Zahlen wie `200`, `1,5`, `½`, `1½` und Einheiten wie g, kg, ml, dl, l, EL, TL, Bund.
- `Prise` wird nie umgerechnet. Soll eine andere Zutat fix bleiben, `(fix)` ans Zeilenende schreiben.

## Bilder

Ein Foto unter `bilder/<dateiname-des-rezepts>.jpg` (oder .png/.webp) ablegen, z. B. `bilder/lachs-minz-erbsen.jpg`. Es wird automatisch verwendet. Querformat, ca. 1600 px breit, funktioniert am besten.

## Lokal ansehen

```bash
npm run build   # erzeugt dist/
npx serve dist  # oder ein anderer statischer Server
```
