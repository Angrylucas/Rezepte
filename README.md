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
| `bild` | Optional: Pfad oder Link zu einem Bild |
| `bildsuche` | Optional: Suchbegriff für Unsplash (Englisch funktioniert am besten) |

### Mengen

- Erkannt werden Zahlen wie `200`, `1,5`, `½`, `1½` und Einheiten wie g, kg, ml, dl, l, EL, TL, Bund.
- `Prise` wird nie umgerechnet. Soll eine andere Zutat fix bleiben, `(fix)` ans Zeilenende schreiben.

## Bilder

Bilder kommen automatisch, in dieser Reihenfolge:

1. **`bild:` im Rezept**: ein Link zu einem beliebigen Foto (z. B. `bild: https://…/foto.jpg`) oder ein Pfad im Repo.
2. **Datei in `bilder/`**: `bilder/<dateiname-des-rezepts>.jpg` (oder .png/.webp) wird automatisch verwendet.
3. **Unsplash-Suche**: Beim Bauen sucht die Website mit dem Begriff aus `bildsuche:` (am besten auf Englisch, z. B. `pumpkin soup`) ein passendes Foto auf Unsplash. Dafür muss in Vercel die Umgebungsvariable `UNSPLASH_ACCESS_KEY` gesetzt sein (kostenloser Schlüssel unter https://unsplash.com/developers). Der Fotograf wird im Bild genannt.
4. Sonst: farbiger Platzhalter mit einem Piktogramm der Kategorie.

Mehrere Begriffe mit `|` trennen (z. B. `thai basil chicken | thai stir fry`): der erste mit Treffer wird genommen. Gefällt ein Unsplash-Foto nicht, den Begriff ändern oder mit `bild:` ein eigenes Foto verlinken.

## Lokal ansehen

```bash
npm run build   # erzeugt dist/
npx serve dist  # oder ein anderer statischer Server
```


## Coop-Aktionsplaner

Über den Footer-Link **Coop-Aktionsplaner** lassen sich die täglich synchronisierten Coop-Aktionen mit **Aktuelle Coop-Aktionen laden** in den Wochenplaner übernehmen. Das Projekt [swissgroceries-mcp](https://github.com/nicktcode/swissgroceries-mcp) ruft die Angebote ab; ein GitHub-Actions-Workflow aktualisiert `src/coop-promotions.json` täglich um 04:17 UTC und kann manuell gestartet werden. Bei Fehlern bleiben die zuletzt gespeicherten Daten erhalten.

Die Seite ordnet vorhandene Rezepte nach erkannten Aktionszutaten und erlaubt persönliche Filter für ausgeschlossene Zutaten, Ernährungsstil und Kochzeit. Einstellungen und importierte Angebote werden lokal im Browser gespeichert. Ein manueller CSV-/JSON-Import bleibt als Fallback verfügbar.

**Wichtige Einschränkungen:** Die Coop-Datenquelle basiert auf inoffiziellen Endpunkten und kann sich ändern oder zeitweise blockiert sein. Prüfe Preis und Verfügbarkeit vor dem Einkauf direkt bei Coop. Die Vorschläge sind Zutaten-Matches, keine garantierte Ersparnis oder automatisch generierten Rezepte. Der Sync verwendet `@nicktcode/swissgroceries-mcp` als externes CLI, ohne dessen Quellcode in diese Website zu kopieren; das Paket ist AGPL-3.0-only lizenziert.
