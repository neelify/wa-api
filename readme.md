# @neelegirly/wa-api

`@neelegirly/wa-api` ist ein Multi-Session-Wrapper auf Basis von `@neelify/baileys`.
Das Paket kapselt QR-Login, Pairing-Code-Flow, Session-Verwaltung, Events und Messaging in einer kompakten API.

> Hinweis: Dieses Projekt ist nicht offiziell mit WhatsApp oder Meta verbunden.

## Kompatibilitaet

| Paket | Version |
| --- | --- |
| `@neelegirly/wa-api` | `1.7.15` |
| `@neelify/baileys` | `2.2.16` |
| `@neelify/libsignal` | `1.0.27` |
| `@neelegirly/downloader` | `0.1.63` |

Offiziell supportet ist nur dieser Stack.

## Installation

Solange der Scope nicht direkt aus npm genutzt wird, erfolgt die Installation in diesem Workspace ueber das lokale Tarball:

```bash
npm install @neelegirly/wa-api@file:./.push-temp/wa-api/neelegirly-wa-api-1.7.15.tgz @neelify/baileys@2.2.16 @neelify/libsignal@1.0.27 --save-exact
```

## Quickstart

```js
const wa = require('@neelegirly/wa-api')

async function boot() {
  await wa.startSession('session-main', {
    printQR: true
  })
}

wa.onQRUpdated(({ sessionId, qr }) => {
  console.log(`QR aktualisiert fuer ${sessionId}`)
})

wa.onConnected((sessionId) => {
  console.log(`Session verbunden: ${sessionId}`)
})

wa.onMessageReceived(async (msg) => {
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
  const jid = msg.key?.remoteJid

  if (!jid) return

  if (text.toLowerCase() === 'ping') {
    await wa.sendMessage(msg.sessionId, jid, { text: 'pong' })
  }
})

boot().catch(console.error)
```

## Session-Verhalten

- Credential-Saves werden gebuendelt statt bei jedem einzelnen `creds.update` ungefiltert geschrieben.
- Bei `connection.open` und `connection.close` wird ein Flush erzwungen.
- Demo-/Autostart-Code wurde aus der Dist-Version entfernt.
- Gespeicherte Sessions koennen weiter ueber `loadSessionsFromStorage()` geladen werden.

## API-Ueberblick

- `startSession(sessionId, { printQR })`
- `startSessionWithPairingCode(sessionId, { phoneNumber })`
- `getAllSession()`
- `getSession(sessionId)`
- `deleteSession(sessionId)`
- `loadSessionsFromStorage()`
- `sendMessage(sessionId, jid, content, options)`
- `onMessageReceived(listener)`
- `onMessageUpdate(listener)`
- `onQRUpdated(listener)`
- `onConnected(listener)`
- `onDisconnected(listener)`
- `onConnecting(listener)`
- `onPairingCode(listener)`

## Versionshinweis

- Update-Check nutzt `@neelegirly/wa-api` auf npm und `neelegirly/wa-api` als GitHub-Fallback.
- `@neelify/baileys` und `@neelify/libsignal` bleiben absichtlich exakt gepinnt.
- Fuer lokale Onimai-Setups ist das Tarball unter `./.push-temp/wa-api/neelegirly-wa-api-1.7.15.tgz` die Referenz.
