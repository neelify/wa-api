<div align="center">

# 💌 @neelegirly/wa-api 💌

### *Multi-Session WhatsApp – jetzt mit echtem Lifecycle-Management*
### *QR · Pairing · Pause/Resume · PM2-Ready · Update Notify*

[![Version](https://img.shields.io/badge/Version-1.8.5-ff69b4?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@neelegirly/wa-api)
[![Baileys](https://img.shields.io/badge/%40neelegirly%2Fbaileys-2.2.20-9b59b6?style=for-the-badge)](https://www.npmjs.com/package/@neelegirly/baileys)
[![Libsignal](https://img.shields.io/badge/%40neelegirly%2Flibsignal-1.0.29-f4a261?style=for-the-badge)](https://www.npmjs.com/package/@neelegirly/libsignal)
[![Downloader](https://img.shields.io/badge/%40neelegirly%2Fdownloader-0.1.65-c77dff?style=for-the-badge)](https://www.npmjs.com/package/@neelegirly/downloader)
[![npm](https://img.shields.io/npm/v/%40neelegirly%2Fwa-api?style=for-the-badge&color=ff69b4&logo=npm)](https://www.npmjs.com/package/@neelegirly/wa-api)

<p align="center">
  <img src="https://files.catbox.moe/c5adb6.jpeg" width="780" alt="@neelegirly/wa-api Hero" />
</p>

<p align="center"><sub>2026 Glow-Up Edition · Session Registry · <code>_neelegirly</code> · abgestimmt auf <strong>@neelegirly/baileys 2.2.20</strong></sub></p>

[**Installation**](#-installation) · [**Quickstart**](#-quickstart) · [**Lifecycle**](#-session-management) · [**Storage**](#-storage--credential-migration) · [**API**](#-api-overview) · [**Release Notes**](#-release-notes-185)

</div>

---

## ✨ Was ist `@neelegirly/wa-api`?

`@neelegirly/wa-api` ist die komfortable Multi-Session-Schicht über `@neelegirly/baileys`. Der Wrapper nimmt dir den nervigen Teil ab: Session-Lifecycle, Credential-Handling, QR-/Pairing-Callbacks, Update-Status und PM2-freundliches Wiederanlaufen nach Neustarts.

### Highlights auf einen Blick

| Feature | Beschreibung | Status |
|---------|--------------|--------|
| 🔀 Managed Multi-Session | Mehrere Sessions parallel inklusive Registry und Offline-Sicht | ✅ |
| ⏯️ Lifecycle API | `start`, `pause`, `stop`, `resume`, `delete` pro Session | ✅ |
| 💾 Credential-Migration | Standard ist jetzt `_neelegirly`, Legacy `_credentials_neelegirly` und `_credentials` bleiben kompatibel | ✅ |
| 🧠 PM2 Ready | `desiredState`, `autoStart` und `loadSessionsFromStorage()` für Warm-Restarts | ✅ |
| 🔔 Update Notify | Wrapper- und Baileys-Status im Start- und QR-Flow | ✅ |
| 📱 QR & Pairing | QR-Login, Pairing-Code, Retry-Limits und Callbacks | ✅ |

---

## 🆕 Was sich in `v1.8.5` geändert hat

- ✅ Stack auf `@neelegirly/baileys 2.2.20` und `@neelegirly/libsignal 1.0.29` aktualisiert
- ✅ Baileys übernimmt die aktuellen WA-API-/USync-Patches plus libsignal-TypeScript-Definitionen
- ✅ WhatsApp-Web-, Private-Chat- und Session-Lifecycle-Code bleibt unverändert zur stabilen `1.8.4`-Basis

## 🆕 Was sich in `v1.8.4` geändert hat

- ✅ `messages.upsert` verarbeitet jetzt alle Nachrichten im Batch statt nur `messages[0]`
- ✅ `messages.update` verarbeitet jetzt alle Update-Einträge statt nur `[0]`
- ✅ QR-, Pairing-, Connected-, Disconnected- und Message-Callbacks unterstützen jetzt mehrere Listener parallel
- ✅ `upsertType` wird an Downstream-Handler weitergereicht, damit Retry-/Placeholder-Flows sauber erkannt werden können
- ✅ QR-Terminalausgabe prüft jetzt die effektive Listener-Menge statt nur einen Singleton-Eintrag
- ✅ Behebt reale Placeholder-/Retry-Probleme in Multi-Session-Bots, die sonst auf unvollständige Nachrichten zu früh reagieren konnten

## 🆕 Was sich in `v1.8.3` / `v1.8.2` geändert hat

- ✅ Neues Session-Lifecycle-Management mit `pauseSession()`, `stopSession()`, `resumeSession()` und `deleteSession()`
- ✅ Neuer Standard-Root für Sessions: `sessions_neelegirly/.neelegirly-session-registry.json`
- ✅ Legacy-Root `wa_credentials` bleibt vollständig kompatibel und wird automatisch mit übernommen
- ✅ Neuer Credential-Standard: `${sessionId}_neelegirly`
- ✅ Alte `_credentials_neelegirly`- und `_credentials`-Ordner werden weiter erkannt und bei Bedarf sauber migriert
- ✅ `getSessionInfo()`, `getSessionStatus()` und `getAllManagedSessions()` für Runtime- und Offline-Status
- ✅ Verbesserter Update-Check für `@neelegirly/wa-api` und `@neelegirly/baileys`
- ✅ PM2-freundliches Autostart-Verhalten über `desiredState` statt blindem Dauer-Reconnect

---

## 🚀 Installation

### npm

```bash
npm install @neelegirly/wa-api@1.8.5 @neelegirly/baileys@2.2.20 @neelegirly/libsignal@1.0.29 @neelegirly/downloader@0.1.65 --save-exact
```

### yarn

```bash
yarn add @neelegirly/wa-api@1.8.5 @neelegirly/baileys@2.2.20 @neelegirly/libsignal@1.0.29 @neelegirly/downloader@0.1.65 --exact
```

### pnpm

```bash
pnpm add @neelegirly/wa-api@1.8.5 @neelegirly/baileys@2.2.20 @neelegirly/libsignal@1.0.29 @neelegirly/downloader@0.1.65 --save-exact
```

### Import

```js
const waApi = require('@neelegirly/wa-api')
```

```ts
import * as waApi from '@neelegirly/wa-api'
```

> Der empfohlene Stack für diesen Release ist: `1.8.5 / 2.2.20 / 1.0.29 / 0.1.65`.

---

## 📖 Quickstart

```js
const waApi = require('@neelegirly/wa-api')

waApi.onConnected((sessionId) => {
  console.log(`✅ ${sessionId} ist verbunden`)
})

waApi.onMessageReceived(async (msg) => {
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
  const jid = msg.key?.remoteJid

  if (!jid) return

  if (text.toLowerCase() === 'ping') {
    await waApi.sendMessage(msg.sessionId, jid, {
      text: 'pong 💖 aus dem Neelegirly Glow-up'
    })
  }
})

async function boot() {
  await waApi.checkForUpdates()

  await waApi.startSession('main-session', {
    printQR: true,
    autoStart: true,
    retryLimit: 10
  })
}

boot().catch(console.error)
```

### PM2 / Warm-Restart

```js
async function restoreSessions() {
  const restored = await waApi.loadSessionsFromStorage()
  console.log('♻️ Wiederhergestellt:', restored)
}

restoreSessions().catch(console.error)
```

`loadSessionsFromStorage()` startet nur Sessions neu, deren `desiredState` auf `running` steht. Pausierte oder gestoppte Sessions bleiben also auch nach einem Neustart absichtlich ruhig. Kleine Sache, große Wirkung.

---

## 📲 Session Management

```js
await waApi.startSession('sales', {
  printQR: true,
  autoStart: true
})

await waApi.startSessionWithPairingCode('support', {
  phoneNumber: '491234567890',
  autoStart: true
})

await waApi.pauseSession('sales')
await waApi.resumeSession('sales')
await waApi.stopSession('support')

const info = waApi.getSessionInfo('sales')
const status = waApi.getSessionStatus('support')
const managed = waApi.getAllManagedSessions()

console.log(info, status, managed)

await waApi.deleteSession('support')
```

### Lifecycle-Status

| Status | Bedeutung |
|--------|-----------|
| `new` | Session ist bekannt, aber noch nie erfolgreich gestartet worden |
| `starting` | Start wurde ausgelöst, QR/Initialisierung läuft |
| `connecting` | Socket verbindet sich oder retryt gerade |
| `running` | Session ist online |
| `paused` | Session wurde bewusst pausiert und bleibt aus |
| `stopped` | Session wurde bewusst gestoppt und bleibt aus |
| `deleted` | Session und Credentials wurden entfernt |
| `error` | Session hat einen Fehlerzustand erreicht |

---

## 💾 Storage & Credential-Migration

- Credential-Root ist jetzt standardmäßig `sessions_neelegirly`
- Neuer Standard-Ordnername: `${sessionId}_neelegirly`
- Legacy-Ordner `${sessionId}_credentials_neelegirly` und `${sessionId}_credentials` werden weiterhin erkannt
- Falls nötig, werden Legacy-Ordner automatisch in das neue Schema überführt
- Leere Credential-Ordner werden ignoriert, damit keine Phantom-Sessions entstehen
- Die Session-Registry liegt standardmäßig in `sessions_neelegirly/.neelegirly-session-registry.json`

`deleteSession()` entfernt sowohl neue als auch alte Credential-Ordner. `pauseSession()` und `stopSession()` behalten die Credentials dagegen bewusst bei.

---

## 🎧 Event Listener

```js
waApi.onQRUpdated(({ sessionId, qr }) => {
  console.log('📱 Neuer QR-Code für', sessionId)
  console.log(qr)
})

waApi.onPairingCode((sessionId, code) => {
  console.log('🔑 Pairing-Code:', sessionId, code)
})

waApi.onConnecting((sessionId) => {
  console.log('🟡 Verbinde:', sessionId)
})

waApi.onDisconnected((sessionId) => {
  console.log('🔴 Getrennt:', sessionId)
})
```

Verfügbare Listener:

- `onMessageReceived(listener)`
- `onMessageUpdate(listener)`
- `onQRUpdated(listener)`
- `onConnected(listener)`
- `onDisconnected(listener)`
- `onConnecting(listener)`
- `onPairingCode(listener)`

---

## 🔔 Update Notify

```js
const snapshot = await waApi.checkForUpdates({ force: true })

console.log(snapshot.waApi)
console.log(snapshot.baileys)
console.log(waApi.getUpdateStatus())
```

- `checkForUpdates()` prüft `@neelegirly/wa-api` und `@neelegirly/baileys`
- npm wird bevorzugt, GitHub dient als Fallback
- Das Ergebnis wird gecacht, kann aber mit `{ force: true }` neu geladen werden
- Der Wrapper setzt automatisch Branding-Kontext für QR- und Statusausgaben im Baileys-Stack

---

## 📚 API Overview

| Funktion | Beschreibung |
|----------|--------------|
| `checkForUpdates(options?)` | Prüft Wrapper- und Baileys-Versionen |
| `getUpdateStatus()` | Liefert den zuletzt gecachten Update-Snapshot |
| `startSession(id, options)` | Startet eine Session via QR oder `options.method` |
| `startWhatsapp(id, options)` | Veralteter Alias für `startSession()` |
| `startSessionWithPairingCode(id, options)` | Startet eine Session direkt per Pairing-Code |
| `pauseSession(id)` | Pausiert eine Session ohne Credentials zu löschen |
| `stopSession(id)` | Stoppt eine Session ohne Credentials zu löschen |
| `resumeSession(id, options?)` | Startet eine pausierte/gestoppte Session erneut |
| `deleteSession(id)` | Löscht Session, Registry-Eintrag und Credentials |
| `getAllSession()` | Listet aktuell online laufende Sessions |
| `getSession(id)` | Liefert den aktiven Socket einer Session |
| `getSessionInfo(id)` | Liefert detaillierte Session-Metadaten |
| `getSessionStatus(id)` | Liefert nur den Lifecycle-Status |
| `getAllManagedSessions()` | Listet alle bekannten Sessions, auch offline |
| `loadSessionsFromStorage()` | Stellt autostartbare Sessions nach Neustart wieder her |
| `sendMessage(sessionId, jid, content, options)` | Sendet Nachrichten über eine Session |

### Unterstützte Content-Typen

- `{ text: string }`
- `{ image: { url: string }, caption?: string }`
- `{ video: { url: string }, caption?: string, gifPlayback?: boolean }`
- `{ audio: Stream, mimetype: string, ptt?: boolean }`
- `{ document: { url: string, filename?: string }, mimetype: string }`
- `{ poll: { name: string, values: string[], selectableCount: number } }`
- `{ react: { text: string, key: MessageKey } }`
- `{ delete: MessageKey }`
- `{ pin: { type: number, time: number, key: MessageKey } }`
- `{ contacts: { displayName: string, contacts: Array } }`
- `{ location: { degreesLatitude: number, degreesLongitude: number } }`
- `{ forward: Message }`

---

## ⚠️ Wichtige Hinweise

> Diese Library ist ausschließlich für `@neelegirly/baileys` gedacht.

- ✖️ Kein Spam oder Missbrauch
- ✖️ Keine unerlaubte Überwachung oder Stalkerware
- ✔️ Session-Dateien und `creds.json` immer privat halten
- ✔️ Für frische Pairing-Boots muss eine `phoneNumber` gesetzt sein
- ✔️ `pauseSession()`/`stopSession()` behalten Credentials, `deleteSession()` räumt komplett auf

---

## 📝 Release Notes `1.8.5`

- Stack-Dependency auf `@neelegirly/baileys 2.2.20` angehoben
- Damit wird `@neelegirly/libsignal 1.0.29` mit WhiskeySockets-TypeScript-Definitionen und ProtocolAddress-Typen genutzt
- Keine Änderungen am stabilen WhatsApp-Web-/Private-Chat-/Lifecycle-Verhalten

## 📝 Frühere Release Notes `1.8.4`

- `messages.upsert` und `messages.update` liefern jetzt vollständige Batches an deine Bot-Logik weiter
- Mehrere Callback-Listener koexistieren sauber, statt sich gegenseitig zu überschreiben
- Besonders wichtig für Bots mit Placeholder-/Retry-/Stub-Handling und PM2-/Multi-Session-Runtimes

## 📝 Frühere Release Notes `1.8.2`

- 💖 Echter Session-Lifecycle statt nur „an oder aus“
- 🧠 Persistente Registry für PM2- und Restart-freundliches Verhalten
- 📂 Neuer Default-Root `sessions_neelegirly` mit Legacy-Migration aus `wa_credentials`
- 🗂️ Default-Credential-Suffix auf `_neelegirly` korrigiert
- 🔁 Legacy-Credential-Ordner `_credentials_neelegirly` und `_credentials` bleiben kompatibel und werden migriert
- 🔔 Update-Notify jetzt wrapper- und baileys-aware
- ✨ README auf neuen Runtime-Stand, Storage-Flow und API-Surface gebracht

---

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-neelegirly-pink?style=for-the-badge&logo=github)](https://github.com/neelegirly)
[![npm](https://img.shields.io/npm/v/%40neelegirly%2Fwa-api?style=for-the-badge&color=ff69b4&logo=npm)](https://www.npmjs.com/package/@neelegirly/wa-api)

**© 2026 – @neelegirly/wa-api**

</div>
