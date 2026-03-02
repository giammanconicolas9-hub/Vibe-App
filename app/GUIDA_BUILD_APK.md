# Guida Build APK - LocalRequest

Questa guida ti spiega come generare il file APK per Android dall'app LocalRequest.

## Prerequisiti

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Android Studio** - [Download](https://developer.android.com/studio)
3. **Java JDK 17** - Incluso in Android Studio
4. **Git** (opzionale)

## Metodo 1: Script Automatico (Consigliato)

```bash
# Esegui lo script di build
./build-android.sh
```

Lo script:
1. Installa le dipendenze npm
2. Builda il progetto web
3. Configura Capacitor per Android
4. Apre Android Studio

## Metodo 2: Manuale

### Step 1: Installa Dipendenze

```bash
cd /mnt/okcomputer/output/app
npm install
```

### Step 2: Build Web

```bash
npm run build
```

### Step 3: Installa Capacitor CLI

```bash
npm install -g @capacitor/cli
```

### Step 4: Aggiungi Piattaforma Android

```bash
npx cap add android
```

### Step 5: Sincronizza Progetto

```bash
npx cap sync android
```

### Step 6: Apri Android Studio

```bash
npx cap open android
```

### Step 7: Genera APK

In Android Studio:

1. **Build** > **Generate Signed Bundle / APK...**
2. Seleziona **APK**
3. Crea un nuovo keystore o seleziona uno esistente:
   - Key store path: scegli una cartella sicura
   - Password: crea una password sicura
   - Key alias: `localrequest`
   - Key password: stessa password o diversa
   - Validity: 25 anni
   - Certificate: inserisci i tuoi dati
4. Clicca **Next**
5. Seleziona **release**
6. Clicca **Finish**

L'APK sarà generato in:
```
android/app/release/app-release.apk
```

## Configurazione Keystore (Importante!)

**Conserva il file keystore in un luogo sicuro!** Senza di esso non potrai aggiornare l'app in futuro.

```bash
# Esempio creazione keystore via command line
keytool -genkey -v -keystore localrequest.keystore -alias localrequest -keyalg RSA -keysize 2048 -validity 9125
```

## Permessi App

L'app richiede questi permessi (già configurati in `AndroidManifest.xml`):

- `INTERNET` - Connessione di rete
- `ACCESS_FINE_LOCATION` - Geolocalizzazione precisa
- `ACCESS_COARSE_LOCATION` - Geolocalizzazione approssimativa
- `CAMERA` - Scattare foto
- `READ_EXTERNAL_STORAGE` - Selezionare foto dalla galleria
- `POST_NOTIFICATIONS` - Notifiche push (Android 13+)

## Test su Dispositivo

### Opzione A: USB Debugging

1. Attiva **Developer Options** sul telefono
2. Attiva **USB Debugging**
3. Collega il telefono al PC
4. In Android Studio, seleziona il dispositivo e clicca **Run**

### Opzione B: APK Manuale

1. Copia l'APK sul telefono
2. Installa (potrebbe richiedere "Installa da fonti sconosciute")
3. Testa l'app

## Risoluzione Problemi

### Errore: "Capacitor not found"
```bash
npm install @capacitor/core @capacitor/cli
```

### Errore: "SDK not found"
- Apri Android Studio
- Vai in **SDK Manager**
- Installa Android SDK 33+

### Errore: "Keystore error"
- Verifica che il keystore esista
- Verifica le password
- Ricrea il keystore se necessario

### Errore: "Build failed"
```bash
# Pulisci e ricostruisci
cd android
./gradlew clean
cd ..
npx cap sync android
```

## Ottimizzazione APK

Per ridurre la dimensione dell'APK:

```bash
# Abilita ProGuard (già configurato)
# In android/app/build.gradle:
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Pubblicazione Play Store

Per pubblicare sul Play Store:

1. Crea un account sviluppatore Google ($25 una tantum)
2. Genera **Android App Bundle (AAB)** invece di APK
3. Firma con lo stesso keystore
4. Carica su Google Play Console

## Comandi Utili

```bash
# Sviluppo live con hot reload
npm run dev

# Build produzione
npm run build

# Sincronizza Capacitor
npx cap sync

# Copia web assets
npx cap copy

# Apri in Android Studio
npx cap open android

# Aggiorna dipendenze Capacitor
npx cap update
```

## Struttura Progetto Android

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml    # Permessi e configurazione
│   │       ├── java/                   # Codice Java/Kotlin
│   │       └── res/                    # Risorse (icone, layout)
│   ├── build.gradle                    # Configurazione build
│   └── release/                        # APK generati
└── build.gradle
```

## Supporto

Per problemi o domande:
- Documentazione Capacitor: https://capacitorjs.com/docs
- Documentazione Android: https://developer.android.com/docs

---

**Nota**: Questa è una configurazione base. Per produzione, considera:
- Backend server per dati persistenti
- Firebase per notifiche push
- Analytics e crash reporting
- Test su molteplici dispositivi
