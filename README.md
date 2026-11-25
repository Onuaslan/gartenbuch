# Gartenbuch

Garten-App für Android: Gießplan nach Wetter, Frostwarnungen, Gartenkalender, Einkaufsliste, Erntetagebuch, Foto-Diagnose, Pflegepläne und eine Morgen-Nachricht, was heute zu tun ist.
Designed & coded by Onur Kabasakal.

## Installieren

1. [Gartenbuch.apk herunterladen](https://github.com/Onuaslan/gartenbuch/raw/main/Gartenbuch.apk)
2. Datei auf dem Handy öffnen und die Installation erlauben („Unbekannte Apps installieren“).
3. App öffnen, Adresse eingeben, Pflanzen anlegen.

Voraussetzung: Android 6 oder neuer. Für das Wetter ist Internet nötig (Open-Meteo). Alle Daten bleiben auf dem Handy.

## Morgen-Nachricht

Oben rechts auf das Einstellungen-Symbol tippen, „Nachricht aktivieren“ einschalten, Uhrzeit wählen. Mit „Test jetzt senden“ prüfst du sofort, ob alles klappt.
Die Nachricht nennt: Gießen mit Menge, Frostwarnung, Krankheitsgefahr, Aufgaben des Monats.
Android kann sie um einige Minuten verschieben. Ab Android 13 fragt die App einmal nach der Erlaubnis für Benachrichtigungen.

## Foto-Diagnose, Pflegeplan, Beetplan

Diese Funktionen brauchen einen eigenen Anthropic-API-Schlüssel (console.anthropic.com, „API keys“, Guthaben nötig).
Schlüssel in den Einstellungen eintragen. Er bleibt nur auf dem Handy, die Abrechnung läuft über das Guthaben dort. Ohne Schlüssel läuft alles andere normal.

## Selbst bauen

Benötigt Linux mit `openjdk`, `aapt`, `apksigner`, `zipalign`, `dalvik-exchange` und `android-sdk-platform-23` (alles per `apt`).

```
./build.sh
```

Ergebnis: `build/Gartenbuch.apk`. Beim ersten Lauf erzeugt das Skript einen Signaturschlüssel `gartenbuch.keystore`.
Wer eine bestehende Installation aktualisieren will, muss mit **demselben** Schlüssel signieren. Der Schlüssel gehört nicht ins Repository.

- `src/index.orig.html`: Original aus dem Claude-Artifact
- `patch_html.py`: macht daraus die eigenständige Version (Wetter über Open-Meteo, ohne Claude)
- `app/`: Android-Hülle (WebView), Manifest, Icons
