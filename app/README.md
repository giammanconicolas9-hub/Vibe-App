# LocalRequest - App Annunci Invertiti

LocalRequest è un'applicazione mobile che inverte il modello classico degli annunci. Invece di pubblicare offerte, gli utenti pubblicano richieste che vengono notificate istantaneamente agli utenti nella stessa zona con preferenze corrispondenti.

## Funzionalità

- **Registrazione semplice**: Nome, foto, numero WhatsApp
- **Preferenze personalizzate**: Seleziona le categorie di interesse
- **Pubblicazione richieste**: Crea annunci di ricerca con dettagli e budget
- **Matching intelligente**: Ricevi solo annunci della tua zona e categorie preferite
- **Contatto diretto**: Contatta via WhatsApp senza intermediari
- **Zero spam**: Vedi solo ciò che ti interessa

## Stack Tecnologico

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Mobile**: Capacitor (per build Android/iOS)
- **Storage**: LocalStorage (persistenza dati)

## Requisiti

- Node.js 18+
- npm o yarn
- Android Studio (per build Android)
- Xcode (per build iOS, solo Mac)

## Installazione

```bash
# Clona il repository
git clone <repository-url>
cd localrequest

# Installa dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev
```

## Build per Produzione

### Web App (PWA)

```bash
npm run build
```

L'output sarà nella cartella `dist/`.

### App Android (APK)

```bash
# Installa Capacitor CLI globalmente
npm install -g @capacitor/cli

# Build del progetto web
npm run build

# Aggiungi piattaforma Android
npx cap add android

# Sincronizza il progetto
npx cap sync android

# Apri in Android Studio
npx cap open android
```

In Android Studio:
1. Seleziona "Build" > "Generate Signed Bundle / APK"
2. Scegli "APK"
3. Crea o seleziona un keystore
4. Compila l'APK

### App iOS

```bash
# Aggiungi piattaforma iOS
npx cap add ios

# Sincronizza il progetto
npx cap sync ios

# Apri in Xcode
npx cap open ios
```

In Xcode:
1. Seleziona il tuo team di sviluppo
2. Configura il signing
3. Build e deploy

## Struttura del Progetto

```
src/
├── backend/
│   └── api.ts          # API e database locale
├── components/
│   └── ui/             # Componenti shadcn/ui
├── context/
│   ├── AuthContext.tsx # Gestione autenticazione
│   └── NotificationContext.tsx # Gestione notifiche
├── pages/
│   ├── Login.tsx       # Pagina login
│   ├── Register.tsx    # Pagina registrazione
│   ├── Home.tsx        # Feed principale
│   ├── CreateRequest.tsx # Crea richiesta
│   ├── Notifications.tsx # Notifiche
│   └── Profile.tsx     # Profilo utente
├── types/
│   └── index.ts        # Tipi TypeScript
└── App.tsx             # Router principale
```

## Configurazione Capacitor

Il file `capacitor.config.json` contiene la configurazione:

```json
{
  "appId": "com.localrequest.app",
  "appName": "LocalRequest",
  "webDir": "dist"
}
```

## Permessi Android

L'app richiede i seguenti permessi:
- `INTERNET` - Connessione di rete
- `ACCESS_FINE_LOCATION` - Geolocalizzazione precisa
- `ACCESS_COARSE_LOCATION` - Geolocalizzazione approssimativa
- `CAMERA` - Per scattare foto
- `READ_EXTERNAL_STORAGE` - Per selezionare foto dalla galleria

## Note di Sviluppo

- I dati sono memorizzati in LocalStorage (persistenza locale)
- Per produzione, considerare l'integrazione con un backend reale
- Le notifiche push richiedono configurazione Firebase (Android) o APNs (iOS)
- La geolocalizzazione usa l'API del browser/Capacitor

## Licenza

MIT License
