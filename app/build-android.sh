#!/bin/bash

# Build script per LocalRequest Android APK

echo "🚀 LocalRequest - Build Android APK"
echo "===================================="

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato. Installa Node.js 18+"
    exit 1
fi

echo "✓ Node.js trovato: $(node --version)"

# Installa dipendenze
echo ""
echo "📦 Installazione dipendenze..."
npm install

# Build progetto web
echo ""
echo "🔨 Build progetto web..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build fallita. Cartella dist non trovata."
    exit 1
fi

echo "✓ Build completata"

# Verifica Capacitor CLI
if ! command -v cap &> /dev/null; then
    echo ""
    echo "📲 Installazione Capacitor CLI..."
    npm install -g @capacitor/cli
fi

# Aggiungi Android se non esiste
if [ ! -d "android" ]; then
    echo ""
    echo "🤖 Aggiunta piattaforma Android..."
    npx cap add android
fi

# Sincronizza progetto
echo ""
echo "🔄 Sincronizzazione progetto..."
npx cap sync android

# Verifica Android Studio
if command -v studio &> /dev/null; then
    echo ""
    echo "✅ Progetto pronto!"
    echo ""
    echo "Per completare il build:"
    echo "1. Apri Android Studio: npx cap open android"
    echo "2. In Android Studio: Build > Generate Signed Bundle / APK"
    echo "3. Seleziona APK e segui la procedura"
    echo ""
    read -p "Vuoi aprire Android Studio ora? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        npx cap open android
    fi
else
    echo ""
    echo "⚠️  Android Studio non trovato"
    echo "Installa Android Studio da: https://developer.android.com/studio"
    echo ""
    echo "Dopo l'installazione, esegui: npx cap open android"
fi

echo ""
echo "📋 Riassunto:"
echo "- Progetto web buildato in: dist/"
echo "- Progetto Android in: android/"
echo "- Per build APK: usa Android Studio"
echo ""
echo "🎉 Fatto!"
