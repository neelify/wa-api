<div align="center">

# 💌 @neelify/wa-api 💌

### *Multi-Session WhatsApp – einfach & stabil*  
### *QR · Pairing · Auto-Reconnect · Smart Queue Ready*

[![Version](https://img.shields.io/badge/Version-1.7.6-ff69b4?style=for-the-badge&logo=github)](https://github.com/neelify/wa-api)
[![Baileys](https://img.shields.io/badge/@neelify/baileys-2.2.7-9b59b6?style=for-the-badge)](https://www.npmjs.com/package/@neelify/baileys)
[![Baileys API](https://img.shields.io/badge/Baileys_API-1.7.2-9b59b6?style=for-the-badge)](https://github.com/WhiskeySockets/Baileys)
[![npm](https://img.shields.io/npm/v/@neelify/wa-api?style=for-the-badge&color=ff69b4&logo=npm)](https://www.npmjs.com/package/@neelify/wa-api)
[![Downloads](https://img.shields.io/npm/dw/@neelify/wa-api?style=for-the-badge&color=ff69b4&logo=npm)](https://www.npmjs.com/package/@neelify/wa-api)
[![License](https://img.shields.io/github/license/neelify/wa-api?style=for-the-badge&color=ff69b4)](LICENSE)

---

<p align="center">
  <img src="https://files.catbox.moe/phppor.JPG" width="720" alt="Neele WA-API Header" />
</p>

<p align="center"><sub>2026 Glow-Up Edition - stable multi-session API - neelify namespace</sub></p>

| 📦 Paket | 🎯 Baileys | ✨ Highlights |
|----------|------------|----------------|
| **@neelify/wa-api v1.7.6** | **@neelify/baileys 2.2.7** | Multi-Session · QR · Pairing · Update-Check von npm |

**✨ v1.7.6** · README Glow-Up · Kompatibel mit **@neelify/baileys 2.2.7** & **Baileys API 1.7.2** · Update-Prüfung via npm-Registry

[**Installation**](#-installation) · [**Quickstart**](#-quickstart-guide) · [**Features**](#-features) · [**API**](#-vollständige-api-referenz) · [**Support**](#-support--community)

</div>

---

## 📋 Inhaltsverzeichnis

- [✨ Was ist @neelify/wa-api?](#-was-ist-neelifywa-api)
- [🚀 Installation](#-installation)
- [📖 Quickstart Guide](#-quickstart-guide)
- [✨ Features](#-features)
- [📲 Session Management](#-session-management)
- [💬 Nachrichten senden](#-nachrichten-senden)
- [🎧 Event Listener](#-event-listener)
- [🔧 Erweiterte Funktionen](#-erweiterte-funktionen)
- [📚 Vollständige API-Referenz](#-vollständige-api-referenz)
- [⚠️ Wichtige Hinweise](#️-wichtige-hinweise)
- [💬 Support & Community](#-support--community)

---

## ✨ Was ist @neelify/wa-api?

<div align="center">

### 🎯 **Die perfekte Lösung für Multi-Session WhatsApp Bots** 🎯

</div>

| Feature | Beschreibung | Status |
|---------|-------------|--------|
| 🔀 **Multi-Session** | Mehrere WhatsApp-Sessions gleichzeitig | ✅ |
| 💎 **Universal API** | Einfache `sendMessage` für alle Typen | ✅ |
| ⚡ **RelayMessage** | Direkte Nachrichten-Weiterleitung | ✅ |
| 🔄 **Auto-Reconnect** | Automatisches Wiederverbinden | ✅ |
| 📱 **QR-Code** | Schöne QR-Code-Anzeige | ✅ |
| 🔔 **Auto-Updates** | Automatische Update-Prüfung (nur einmal) | ✅ |
| 🧩 **LID-Support** | Vollständige LID-Kompatibilität | ✅ |
| 🎨 **Einfach** | Simple API für Anfänger | ✅ |
| 🚀 **Smart Queue** | Nutzt Baileys Smart Message Queue | ✅ |

> ⚠️ **Wichtig**: Diese Library funktioniert **ausschließlich** mit **@neelify/baileys** (empfohlen **v2.2.7**, Baileys API **1.7.2**)!

---

## 🚀 Installation

### 📦 Mit npm

```bash
npm install @neelify/wa-api@latest
```

### 📦 Mit yarn

```bash
yarn add @neelify/wa-api@latest
```

### 📥 Import

```javascript
// CommonJS
const onimai = require('@neelify/wa-api');

// ES Module
import * as onimai from '@neelify/wa-api';
```

---

## 📖 Quickstart Guide

### 🎯 **Für Anfänger: Dein erster Multi-Session Bot**

```javascript
const onimai = require('@neelify/wa-api');

// 1️⃣ Session starten (mit QR-Code)
async function start() {
  // Session starten
  await onimai.startSession('meine-session', {
    printQR: true // QR-Code anzeigen
  });
  
  console.log('✅ Session gestartet!');
}

// 2️⃣ Nachrichten empfangen
onimai.onMessageReceived(async (msg) => {
  const { sessionId, key, message } = msg;
  const from = key.remoteJid;
  const text = message?.conversation || message?.extendedTextMessage?.text || '';
  
  // Echo-Bot
  if (text.toLowerCase() === 'hallo') {
    await onimai.sendMessage(sessionId, from, {
      text: '🌸 Hallo! Ich bin ein Onimai-Bot! ✨'
    });
  }
});

// 3️⃣ Verbindungs-Status
onimai.onConnected((sessionId) => {
  console.log(`✅ Session ${sessionId} ist verbunden!`);
});

onimai.onDisconnected((sessionId) => {
  console.log(`❌ Session ${sessionId} wurde getrennt`);
});

// Bot starten
start().catch(console.error);
```

### 🎨 **Was passiert hier?**

1. **`startSession`**: Startet eine neue WhatsApp-Session mit QR-Code
2. **`onMessageReceived`**: Event-Handler für neue Nachrichten
3. **`sendMessage`**: Sendet Nachrichten an einen Chat
4. **`onConnected`/`onDisconnected`**: Events für Verbindungsstatus

---

## ✨ Features

### 🔥 **Hauptfeatures**

- ✅ **Multi-Session Support** - Mehrere Sessions gleichzeitig verwalten
- ✅ **Universal sendMessage** - Einfache API für alle Nachrichtentypen
- ✅ **Auto-Reconnect** - Automatisches Wiederverbinden bei Verbindungsabbruch
- ✅ **QR-Code Display** - Schöne QR-Code-Anzeige im Terminal
- ✅ **Auto-Update-Check** - Automatische Prüfung auf neue Versionen (nur einmal pro Prozess)
- ✅ **LID-Kompatibel** - Vollständige Linked ID Unterstützung
- ✅ **Session-Management** - Einfaches Starten, Stoppen und Verwalten
- ✅ **Event-System** - Umfangreiches Event-System für alle Events
- ✅ **Smart Queue Ready** - Kompatibel mit Baileys Smart Message Queue

---

## 📲 Session Management

### 🚀 **Session starten**

```javascript
// Mit QR-Code (Standard)
await onimai.startSession('session1', {
  printQR: true // QR-Code im Terminal anzeigen
});

// Mit Pairing-Code (ohne QR-Code)
await onimai.startSessionWithPairingCode('session2', {
  phoneNumber: '491234567890' // Ohne +, mit Ländercode
});
```

### 📋 **Sessions verwalten**

```javascript
// Alle Sessions auflisten
const allSessions = onimai.getAllSession();
console.log('Aktive Sessions:', allSessions);
// Output: ['session1', 'session2', 'session3']

// Eine Session abrufen
const session = onimai.getSession('session1');
if (session) {
  console.log('Session gefunden!');
}

// Session löschen
await onimai.deleteSession('session1');
```

### 💾 **Sessions aus Storage laden**

```javascript
// Alle gespeicherten Sessions automatisch laden
const loadedSessions = await onimai.loadSessionsFromStorage();
console.log('Geladene Sessions:', loadedSessions);
// Output: ['session1', 'session2']
```

---

## 💬 Nachrichten senden

### 📨 **Grundlegende Verwendung**

```javascript
await onimai.sendMessage(sessionId, jidOrPhone, content, options);
```

**Parameter:**
- `sessionId` - Die Session-ID (z.B. 'session1')
- `jidOrPhone` - WhatsApp-ID oder Telefonnummer (z.B. '491234567890@s.whatsapp.net' oder '491234567890')
- `content` - Der Nachrichteninhalt (siehe Beispiele unten)
- `options` - Optionale Parameter (z.B. `{ quoted: message }`)

### 📝 **Nachrichtentypen**

#### 1. **Text-Nachricht**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  text: 'Hallo! 🌸'
});
```

#### 2. **Bild mit Caption**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  image: { url: './bild.jpg' },
  caption: 'Schönes Bild! ✨'
});
```

#### 3. **Video**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  video: { url: './video.mp4' },
  caption: 'Mein Video! 🎬'
});
```

#### 4. **GIF (als Video)**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  video: { url: './animation.mp4' },
  gifPlayback: true, // Wichtig für GIFs!
  caption: 'Kawaii GIF! ✨'
});
```

#### 5. **Audio/Sprachnachricht**

```javascript
const fs = require('fs');

await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  audio: fs.createReadStream('./audio.ogg'),
  mimetype: 'audio/ogg',
  ptt: true // Push-to-Talk (Sprachnachricht)
});
```

#### 6. **Dokument**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  document: { 
    url: './dokument.pdf',
    filename: 'Wichtiges Dokument.pdf'
  },
  mimetype: 'application/pdf'
});
```

#### 7. **Umfrage (Poll)**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  poll: {
    name: 'Was ist deine Lieblingsfarbe?',
    values: ['Rot', 'Blau', 'Grün', 'Gelb'],
    selectableCount: 1 // Anzahl der auswählbaren Optionen
  }
});
```

#### 8. **Reaktion**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  react: {
    text: '❤️', // Emoji
    key: message.key // Key der Nachricht
  }
});

// Reaktion entfernen
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  react: {
    text: '', // Leerer String entfernt Reaktion
    key: message.key
  }
});
```

#### 9. **Nachricht löschen**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  delete: message.key // Für alle löschen
});
```

#### 10. **Nachricht anpinnen**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  pin: {
    type: 1, // 0 = entfernen, 1 = anpinnen
    time: 86400, // Sekunden (24h = 86400)
    key: message.key
  }
});
```

#### 11. **Kontakt teilen**

```javascript
const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Max Mustermann
TEL;type=CELL;type=VOICE;waid=491234567890:+49 123 4567890
END:VCARD`;

await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  contacts: {
    displayName: 'Max Mustermann',
    contacts: [{ vcard }]
  }
});
```

#### 12. **Standort**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  location: {
    degreesLatitude: 52.520008,
    degreesLongitude: 13.404954
  }
});
```

#### 13. **Nachricht weiterleiten**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  forward: originalMessage // Originale Nachricht
});
```

#### 14. **Mit Quote (Antwort)**

```javascript
await onimai.sendMessage(
  'session1', 
  '491234567890@s.whatsapp.net', 
  {
    text: 'Das ist eine Antwort!'
  },
  {
    quoted: originalMessage // Originale Nachricht
  }
);
```

#### 15. **Mit Erwähnung**

```javascript
await onimai.sendMessage('session1', '491234567890@s.whatsapp.net', {
  text: '@491111111111 Hallo!',
  mentions: ['491111111111@s.whatsapp.net']
});
```

---

## 🎧 Event Listener

### 📥 **Nachrichten empfangen**

```javascript
onimai.onMessageReceived(async (msg) => {
  const { 
    sessionId,      // Session-ID
    key,            // Message-Key (id, remoteJid, fromMe)
    message,        // Nachrichteninhalt
    messageTimestamp // Zeitstempel
  } = msg;
  
  const from = key.remoteJid;
  const text = message?.conversation || message?.extendedTextMessage?.text || '';
  
  console.log(`📥 Neue Nachricht von ${from}: ${text}`);
  
  // Medien speichern (wenn vorhanden)
  if (message?.imageMessage) {
    await msg.saveImage('./downloads/');
  }
  if (message?.videoMessage) {
    await msg.saveVideo('./downloads/');
  }
  if (message?.documentMessage) {
    await msg.saveDocument('./downloads/');
  }
});
```

### 🔄 **Nachrichten-Updates**

```javascript
onimai.onMessageUpdate((sessionId, data) => {
  const { 
    update,           // Update-Objekt
    messageStatus     // Lesbarer Status
  } = data;
  
  console.log(`📊 Status Update: ${messageStatus}`);
  // Mögliche Status: 'sent', 'delivered', 'read', 'failed'
});
```

### 🔌 **Verbindungs-Events**

```javascript
// Verbunden
onimai.onConnected((sessionId) => {
  console.log(`✅ Session ${sessionId} ist jetzt verbunden!`);
});

// Verbindung wird hergestellt
onimai.onConnecting((sessionId) => {
  console.log(`🔄 Session ${sessionId} verbindet...`);
});

// Getrennt
onimai.onDisconnected((sessionId) => {
  console.log(`❌ Session ${sessionId} wurde getrennt`);
});
```

### 📱 **QR-Code Updates**

```javascript
onimai.onQRUpdated((info) => {
  const { sessionId, qr } = info;
  console.log(`📱 Neuer QR-Code für Session ${sessionId}:`);
  console.log(qr);
  
  // Du kannst den QR-Code auch in eine Datei speichern oder auf einer Webseite anzeigen
});
```

### 🔑 **Pairing-Code**

```javascript
onimai.onPairingCode((sessionId, code) => {
  console.log(`🔑 Pairing-Code für Session ${sessionId}: ${code}`);
});
```

---

## 🔧 Erweiterte Funktionen

### 💾 **Medien speichern**

```javascript
onimai.onMessageReceived(async (msg) => {
  // Bild speichern
  if (msg.message?.imageMessage) {
    const path = await msg.saveImage('./downloads/');
    console.log('✅ Bild gespeichert:', path);
  }
  
  // Video speichern
  if (msg.message?.videoMessage) {
    const path = await msg.saveVideo('./downloads/');
    console.log('✅ Video gespeichert:', path);
  }
  
  // Dokument speichern
  if (msg.message?.documentMessage) {
    const path = await msg.saveDocument('./downloads/');
    console.log('✅ Dokument gespeichert:', path);
  }
});
```

### 🔄 **Multi-Session Beispiel**

```javascript
// Mehrere Sessions gleichzeitig starten
const sessions = ['session1', 'session2', 'session3'];

for (const sessionId of sessions) {
  await onimai.startSession(sessionId, { printQR: true });
}

// Nachricht an alle Sessions senden
const message = { text: 'Broadcast-Nachricht! 📢' };
const recipients = ['491234567890@s.whatsapp.net'];

for (const sessionId of sessions) {
  for (const recipient of recipients) {
    await onimai.sendMessage(sessionId, recipient, message);
  }
}
```

### 🚀 **Smart Queue Integration**

```javascript
// Nutze die Smart Message Queue von Baileys für zuverlässiges Bulk-Messaging
const baileys = require('@neelify/baileys');
const session = onimai.getSession('session1');

if (session) {
  const queue = baileys.createSmartMessageQueue(session, {
    maxRetries: 5,
    retryDelay: 2000,
    maxConcurrent: 3
  });

  // Viele Nachrichten zur Queue hinzufügen
  const recipients = ['491234567890@s.whatsapp.net', '499876543210@s.whatsapp.net'];
  
  for (const jid of recipients) {
    await queue.add({
      jid,
      message: { text: 'Wichtige Ankündigung! 📢' },
      priority: 'high'
    });
  }
}
```

---

## 📚 Vollständige API-Referenz

### 🔌 **Session-Funktionen**

| Funktion | Beschreibung | Beispiel |
|----------|-------------|----------|
| `startSession(id, options)` | Startet eine Session mit QR-Code | `await onimai.startSession('session1')` |
| `startSessionWithPairingCode(id, options)` | Startet mit Pairing-Code | `await onimai.startSessionWithPairingCode('session2', { phoneNumber: '491234567890' })` |
| `getAllSession()` | Gibt alle aktiven Sessions zurück | `const sessions = onimai.getAllSession()` |
| `getSession(id)` | Gibt eine spezifische Session zurück | `const session = onimai.getSession('session1')` |
| `deleteSession(id)` | Löscht eine Session | `await onimai.deleteSession('session1')` |
| `loadSessionsFromStorage()` | Lädt alle Sessions aus Storage | `const loaded = await onimai.loadSessionsFromStorage()` |

### 💬 **Nachrichten-Funktionen**

| Funktion | Beschreibung |
|----------|-------------|
| `sendMessage(sessionId, jid, content, options)` | Sendet eine Nachricht |

**Content-Typen:**
- `{ text: string }` - Text
- `{ image: { url: string }, caption?: string }` - Bild
- `{ video: { url: string }, caption?: string, gifPlayback?: boolean }` - Video/GIF
- `{ audio: Stream, mimetype: string, ptt?: boolean }` - Audio
- `{ document: { url: string, filename?: string }, mimetype: string }` - Dokument
- `{ poll: { name: string, values: string[], selectableCount: number } }` - Umfrage
- `{ react: { text: string, key: MessageKey } }` - Reaktion
- `{ delete: MessageKey }` - Löschen
- `{ pin: { type: number, time: number, key: MessageKey } }` - Anpinnen
- `{ contacts: { displayName: string, contacts: Array } }` - Kontakt
- `{ location: { degreesLatitude: number, degreesLongitude: number } }` - Standort
- `{ forward: Message }` - Weiterleiten

### 🎧 **Event-Listener**

| Event | Beschreibung | Callback-Parameter |
|-------|-------------|-------------------|
| `onMessageReceived` | Neue Nachricht empfangen | `(msg: Message)` |
| `onMessageUpdate` | Nachrichten-Update | `(sessionId: string, data: UpdateData)` |
| `onConnected` | Session verbunden | `(sessionId: string)` |
| `onConnecting` | Session verbindet | `(sessionId: string)` |
| `onDisconnected` | Session getrennt | `(sessionId: string)` |
| `onQRUpdated` | QR-Code aktualisiert | `(info: { sessionId: string, qr: string })` |
| `onPairingCode` | Pairing-Code erhalten | `(sessionId: string, code: string)` |

---

## ⚠️ Wichtige Hinweise

### 🚨 **Disclaimer**

> ⚠️ **WICHTIG**: Diese Library funktioniert **ausschließlich** mit **@neelify/baileys**!
> 
> - ✖️ **Kein Spam** oder Massennachrichten
> - ✖️ **Kein Missbrauch** für unethische Zwecke
> - ✖️ **Keine Stalkerware** oder automatisierte Überwachung
> - ✔️ **Verantwortungsvoller Gebrauch** wird erwartet

### 🔒 **Sicherheit**

- **Nie** deine Session-Daten öffentlich teilen
- **Immer** `.gitignore` für Credentials-Ordner verwenden
- **Regelmäßig** Backups erstellen
- **Sichere** Passwörter für deine Server verwenden

### 💡 **Best Practices**

1. **Error-Handling**: Immer try-catch für wichtige Operationen
2. **Rate-Limiting**: Nutze Smart Message Queue für Bulk-Messaging
3. **Session-Management**: Sessions ordentlich verwalten und löschen wenn nicht mehr benötigt
4. **Updates**: Regelmäßig auf Updates prüfen (automatisch aktiviert, nur einmal angezeigt)

---

## 🆕 Was ist neu in Version 1.7.6?

### ✨ **Neue Features & Glow-Up**

- 📖 **README Glow-Up** – Version 1.7.6, Badges & Changelog
- ✅ **Kompatibilität** mit **@neelify/baileys 2.2.7** & **Baileys API 1.7.2**
- 🔔 **Update-Check** – Liest Version von **npm-Registry** (registry.npmjs.org), nur 1× pro Prozess
- 📦 **Abhängigkeit** auf `@neelify/baileys@^2.2.7` (empfohlen 2.2.7)
- 🚀 **Smart Queue Ready** · QR · Pairing · Auto-Reconnect
- 💎 **Multi-Device** & Session-Management optimiert

### 🔄 **Verbesserungen**

- Semver-Vergleich für „Update verfügbar“ nur bei wirklich neuerer Version
- Verbesserte Fehlerbehandlung & Stabilität
- Schnellerer Verbindungsaufbau · Bessere LID-Unterstützung

---

## 💬 Support & Community

<div align="center">

### 🌸 **Made with Love by @neelify** 🌸

[![GitHub](https://img.shields.io/badge/GitHub-@neelify-pink?style=for-the-badge&logo=github)](https://github.com/neelify)
[![Email](https://img.shields.io/badge/Email-Support-pink?style=for-the-badge&logo=gmail)](mailto:neelehoven@gmail.com)
[![Docs](https://img.shields.io/badge/Docs-wa--api.org-pink?style=for-the-badge)](https://wa-api.org)

**⭐ Wenn dir dieses Projekt gefällt, gib ihm ein Star auf GitHub! ⭐**

</div>

---

## 📝 Changelog

### Version 1.7.6 (Aktuell) 🎉

- 📖 **README Glow-Up** – Version 1.7.6, Baileys 2.2.7 Badges
- 🔔 Update-Check von **npm-Registry** (registry.npmjs.org), nur 1× pro Prozess
- ✨ Kompatibilität mit **@neelify/baileys 2.2.7** & **Baileys API 1.7.2**
- 📦 Abhängigkeit `@neelify/baileys@^2.2.7`
- 🚀 Smart Queue Ready · Semver-Vergleich für Update-Hinweis
- 💎 Multi-Device & Session-Management optimiert

### Version 1.3.1

- 📖 README Glow-Up · Changelog · Baileys 2.2.7

### Version 1.2.5

- 📖 README Glow-Up · Changelog

### Version 1.2.4

- 📖 README Glow-Up · Changelog

### Version 1.2.3

- 📖 README Glow-Up · Changelog

### Version 1.2.2

- 📖 README Glow-Up · Changelog ergänzt

### Version 1.2.1

- 📖 README Glow-Up · Update-Check von npm-Registry · Baileys 2.2.7 Badges

### Version 1.2.0

- 📖 README Glow-Up · Baileys 2.0.0 Badges
- ✨ Kompatibilität mit @neelify/baileys 2.2.7 & Baileys API 1.7.2
- 🚀 Smart Queue Ready · Auto-Update-Check (1x pro Prozess)

### Version 1.1.1

- 📖 README Glow-Up · Kompatibilität mit @neelify/baileys 1.7.1
- 🚀 Smart Queue Ready, Auto-Update-Check

### Version 1.1.0

- ✨ Kompatibilität mit @neelify/baileys 1.7.0
- 🚀 Smart Queue Ready, Auto-Update-Check

### Version 1.0.10

- ✨ Automatische Update-Prüfung hinzugefügt
- 🎨 Verbesserte QR-Code-Anzeige
- 🔄 Kompatibilität mit @neelify/baileys 1.6.6
- 🚀 Verbesserte Stabilität
- 🐛 Bugfixes für Session-Management

### Version 1.0.9

- 🔔 Update-Benachrichtigung hinzugefügt
- 💎 Optimierungen für Multi-Device

---

<div align="center">

### ✨ *Stay kawaii, stay connected – Onimai forever!* ✨

**🌸 Made with Love & Glitter 🌸**

[⬆️ Nach oben](#-neelifywa-api)

</div>

---

<div align="center">

Copyright 2026 neelify

</div>

---

## 🔔 Update (03.04.2026)

- npm-Release aktualisiert auf `@neelify/wa-api@1.7.7`.
- Wrapper-Kontext für QR-Branding ergänzt, damit `wa-api`- und `baileys`-Versionen korrekt angezeigt werden.
- Update-Check für `wa-api` zentralisiert (npm zuerst, GitHub-Fallback) und fehlertolerant gemacht.
- Inhalt der README wurde auf den vorherigen Stand zurückgesetzt; dieser Abschnitt ist die einzige neue Ergänzung.
