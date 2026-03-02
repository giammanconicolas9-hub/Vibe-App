#!/bin/bash

echo "🚀 Creazione APK Semplice per LocalRequest"
echo "==========================================="
echo ""

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato!"
    echo "Installalo da: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js trovato"

# Verifica Java
if ! command -v java &> /dev/null; then
    echo "❌ Java non trovato!"
    echo "Installa Java JDK 8 o superiore"
    echo "Ubuntu/Debian: sudo apt install default-jdk"
    echo "Mac: brew install openjdk"
    exit 1
fi

echo "✓ Java trovato"
echo ""

# Installa Bubblewrap
echo "📦 Installazione Bubblewrap..."
npm install -g @bubblewrap/cli

# Verifica build esiste
if [ ! -d "dist" ]; then
    echo "🔨 Build del progetto..."
    npm run build
fi

# Copia file necessari
cp -r public/* dist/ 2>/dev/null || true

echo ""
echo "📝 Configurazione APK..."
echo ""

# Crea directory per build APK
mkdir -p apk-build
cd apk-build

# Inizializza progetto Bubblewrap
echo "Creazione progetto Android..."
bubblewrap init \
    --manifest="https://ff4pgsqs3wk3i.ok.kimi.link/manifest.json" \
    --directory="./" \
    --package="com.localrequest.app" \
    --host="ff4pgsqs3wk3i.ok.kimi.link" \
    --name="LocalRequest" \
    --launcherName="LocalRequest" \
    --themeColor="#3B82F6" \
    --backgroundColor="#3B82F6" \
    --display="standalone" \
    --orientation="portrait" \
    --enableNotifications

echo ""
echo "🔨 Build APK..."
bubblewrap build

echo ""
echo "✅ APK creato!"
echo ""
echo "📁 Percorso: $(pwd)/app-release-signed.apk"
echo ""
echo "Per installare sul telefono:"
echo "1. Copia il file sul telefono"
echo "2. Abilita 'Installa da fonti sconosciute'"
echo "3. Installa l'APK"
echo ""
