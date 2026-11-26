# Gartenbuch

Garten-App für Android: Gießplan nach Wetter, Frostwarnungen, Gartenkalender, Einkaufsliste, Erntetagebuch, Gartenkarte, Foto-Diagnose, Pflegepläne und eine Morgen-Nachricht, was heute zu tun ist.
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

## Gartenkarte

Im Reiter Garten oben auf „Karte“ tippen. Grundstücksmaße eingeben, dann Haus, Terrasse, Beete, Bäume und Einzelpflanzen mit Breite, Länge und Abstand hinzufügen. Die Karte zeichnet Rasen, Pflaster, Dach, Pool, Hochbeete und Bäume mit Schatten (Richtung nach Himmelsrichtung). Elemente lassen sich ziehen und per Punkt unten rechts vergrößern. Für Beete wählst du aus 40 Gemüse-, Kräuter-, Obst- und Blumenarten; sie werden im richtigen Pflanzabstand eingezeichnet. Die App zeigt Pflanzenzahl, gute und schlechte Nachbarn, Sonne/Schatten (grobe Schätzung) und Fruchtfolge. Fällige Aussaat-, Pflanz- und Erntearbeiten aus der Karte erscheinen als Aufgaben. Mit API-Schlüssel kann man die Karte auch per Text beschreiben lassen. Unter „Grundstück und Daten“ lässt sich die Karte als Text sichern und wieder laden.

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


## Aufgaben (ab v2.1)

„Heute zu tun“ ist eine echte Abhak-Liste mit Fortschrittsbalken: Gießen (Haken setzt die Pflanze als gegossen, Rückgängig stellt sie wieder her), Frostschutz, Pflanzen mit Auffälligkeit prüfen, Monatsaufgaben aus der Gartenkarte (bleiben bis zum Abhaken stehen, auch im Kalender) und eigene Aufgaben mit Datum und Wiederholung (wöchentlich, 2-wöchentlich, monatlich).

Die Morgen-Benachrichtigung (ab v2.2) nennt die offenen Aufgaben von heute, z. B. „4 Aufgaben heute: Beete abdecken, Monstera gießen …“, dazu Wetter und Warnungen. Erledigte Aufgaben fehlen darin.
