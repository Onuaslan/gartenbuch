#!/bin/bash
# Baut Gartenbuch.apk ohne Gradle (aapt + javac + dx + apksigner)
set -euo pipefail
cd "$(dirname "$0")"

ANDROID_JAR=/usr/lib/android-sdk/platforms/android-23/android.jar
OUT=build
rm -rf "$OUT"; mkdir -p "$OUT/classes"

# 1) Assets frisch aus dem Artifact erzeugen
mkdir -p app/assets
python3 patch_html.py src/index.orig.html app/assets/index.html

# 2) Java -> Class -> DEX (Java-8-Bytecode, keine Lambdas)
javac -nowarn --release 8 -classpath "$ANDROID_JAR" -d "$OUT/classes" app/src/at/onur/gartenbuch/*.java 2>&1 | grep -v "^Picked up\|^Note:\|warning: \[options\]\|^1 warning\|^[0-9]* warnings" || true
dalvik-exchange --dex --min-sdk-version=23 --output="$OUT/classes.dex" "$OUT/classes" 2>&1 | grep -v "^Picked up" || true
test -s "$OUT/classes.dex"

# 3) Ressourcen, Manifest und Assets packen
aapt package -f -M app/AndroidManifest.xml -S app/res -A app/assets -I "$ANDROID_JAR" -F "$OUT/unaligned.apk"
(cd "$OUT" && aapt add unaligned.apk classes.dex >/dev/null)

# 4) Ausrichten und signieren
zipalign -f -p 4 "$OUT/unaligned.apk" "$OUT/aligned.apk"
if [ ! -f gartenbuch.keystore ]; then
  keytool -genkeypair -keystore gartenbuch.keystore -storepass gartenbuch -keypass gartenbuch \
    -alias gartenbuch -keyalg RSA -keysize 2048 -validity 12000 \
    -dname "CN=Onur Kabasakal, O=Gartenbuch, C=AT" 2>&1 | grep -v "^Picked up" || true
fi
apksigner sign --ks gartenbuch.keystore --ks-pass pass:gartenbuch --key-pass pass:gartenbuch \
  --ks-key-alias gartenbuch --min-sdk-version 23 --out "$OUT/Gartenbuch.apk" "$OUT/aligned.apk"
apksigner verify --verbose --min-sdk-version 23 "$OUT/Gartenbuch.apk" 2>&1 | grep -v "^Picked up"
ls -l "$OUT/Gartenbuch.apk"
