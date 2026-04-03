# @neelify/wa-api

`@neelify/wa-api` ist ein Multi-Session-Wrapper auf Basis von `@neelify/baileys`.
Das Paket kapselt Session-Start, Session-Verwaltung, Events und Message-Utilities in einer kompakteren API.

> Hinweis: Dieses Projekt ist nicht offiziell mit WhatsApp oder Meta verbunden.

## Kernfunktionen

- Multi-Session-Verwaltung fuer mehrere Nummern/Sessions
- QR-Login-Flow ueber `@neelify/baileys`
- Pairing-Code-Flow fuer devicegebundene Kopplung
- Event-Hooks fuer Verbindung, QR, Nachrichten und Status
- Wrapper-Branding-Kontext fuer QR-Ausgaben inkl. Versionsinfos
- Update-Pruefung fuer `@neelify/wa-api` (npm + GitHub-Fallback)

## Versionsabgleich

| Paket | Version |
| --- | --- |
| `@neelify/wa-api` | `1.7.7` |
| `@neelify/baileys` | `2.2.9` |
| `@neelify/libsignal` | `1.0.21` |

Empfehlung: `@neelify/wa-api` und `@neelify/baileys` immer gemeinsam aktuell halten.

## Installation

```bash
npm install @neelify/wa-api @neelify/baileys
```

## Quickstart

```js
const wa = require('@neelify/wa-api')

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

## Session-Handling (Kurzueberblick)

- `startSession(sessionId, { printQR })`: startet/initialisiert eine Session.
- `getAllSession()`: liefert alle aktiven Session-IDs.
- `getSession(sessionId)`: liefert eine konkrete Socket-Instanz.
- `deleteSession(sessionId)`: beendet Session und entfernt lokale Credentials.
- `loadSessionsFromStorage()`: laedt gespeicherte Sessions aus dem Credentials-Ordner.

## QR-Branding und Versionen

QR-Ausgaben werden ueber den Baileys-QR-Pfad gerendert. `wa-api` setzt dafuer einen Wrapper-Kontext,
damit im QR-Banner sowohl die Basis (`@neelify/baileys`) als auch Wrapper-Version (`@neelify/wa-api`) sichtbar sind.

## Update-Check

`@neelify/wa-api` prueft beim Session-Start zentral auf Updates:

- zuerst npm Registry (`registry.npmjs.org`)
- danach optional GitHub Releases (`neelify/wa-api`) als Fallback
- mit Timeout/Fallback und ohne Crash bei Netzwerkfehlern

Bei verfuegbarem Update wird eine kompakte Meldung mit installierter Version, neuester Version und Quelle ausgegeben.

## Was ausgebessert wurde

- README aufgeraeumt und doppelte/uneinheitliche Passagen entfernt.
- Veraltete oder inkonsistente Versionsangaben (`@neelify/baileys`) korrigiert.
- Beispiele auf den aktuellen Namespace `@neelify/...` vereinheitlicht.

## Was veraendert wurde

- Dokumentation klar als Wrapper-Schicht fuer `@neelify/baileys` positioniert.
- Session-Handling und Event-Nutzung in kompakter Struktur neu gegliedert.
- Kompatibilitaetsmatrix fuer `wa-api`, `baileys` und `libsignal` hinzugefuegt.

## Was neu ist

- Wrapper-Brand-Kontext fuer QR-Ausgabe mit dynamischer Versionsanzeige.
- Zentraler Update-Check mit npm-Prioritaet und GitHub-Fallback.
- Knappe, publish-taugliche README-Struktur fuer Wartung und Release-Prozess.
