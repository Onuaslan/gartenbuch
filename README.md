# Gartenbuch

Garten-App für Android: Gießplan nach Wetter, Frostwarnungen, Gartenkalender, Einkaufsliste, Erntetagebuch und Fotos zu jeder Pflanze.
Designed & coded by Onur Kabasakal.

## Installieren

1. [Gartenbuch.apk herunterladen](https://github.com/Onuaslan/gartenbuch/raw/main/Gartenbuch.apk)
2. Datei auf dem Handy öffnen und die Installation erlauben („Unbekannte Apps installieren“).
3. App öffnen, Adresse eingeben, Pflanzen anlegen.

Voraussetzung: Android 6 oder neuer. Für das Wetter ist Internet nötig (Open-Meteo). Alle Daten bleiben auf dem Handy.

## Nicht enthalten

Foto-Diagnose, automatischer Pflegeplan und Beetplan-Vorschläge. Sie brauchen Claude und gibt es nur in der Claude-Version der App.

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
