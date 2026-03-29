"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.relayMessage = exports.sendMessage = void 0;
const Defaults_1 = require("../Defaults");
const Socket_1 = require("../Socket");
const Utils_1 = require("../Utils");
const create_delay_1 = require("../Utils/create-delay");
const is_exist_1 = require("../Utils/is-exist");
const mime_1 = __importDefault(require("mime"));
const Error_1 = require("../Error");
const qrcode = require("qrcode")

const sessionCache = new Map();

function getCachedSession(sessionId) {
  let session = sessionCache.get(sessionId);
  if (!session) {
    session = Socket_1.getSession(sessionId);
    if (!session) throw new Error_1.WhatsappError(Defaults_1.Messages.sessionNotFound(sessionId));
    sessionCache.set(sessionId, session);
  }
  return session;
}

/**
 * Universal sendMessage wrapper for all Baileys message types in JavaScript.
 *
 * @param {string} sessionId   Your multi-session identifier
 * @param {string} jid         Destination JID (user or group) or phone number
 * @param {object} content     AnyMessageContent payload
 * @param {object} [options]   MiscMessageGenerationOptions (quoted, mentions, etc.)
 * @returns {Promise<any>}
 */
async function sendMessage(sessionId, jid, content, options) {
  const session = getCachedSession(sessionId);

  // Convert phone number to JID if needed
  const destJid = jid.includes("@") ? jid : phoneToJid({ to: jid });

  try {
    return await session.sendMessage(destJid, content, options || {});
  } catch (err) {
    // Wrap Baileys errors into WhatsappError for consistency
    throw new Error_1.WhatsappError(
      `Failed to send message to ${destJid}: ${err.message}`,
      { cause: err }
    );
  }
}

exports.sendMessage = sendMessage;
/**
 * Universal sendMessage wrapper for all Baileys message types in JavaScript.
 *
 * @param {string} sessionId   Your multi-session identifier
 * @param {string} jid         Destination JID (user or group) or phone number
 * @param {object} content     AnyMessageContent payload
 * @param {object} [options]   MiscMessageGenerationOptions (quoted, mentions, etc.)
 * @returns {Promise<any>}
 */
async function sendStatusMentions(sessionId, content, options) {
  const session = getCachedSession(sessionId);

  try {
    return await session.sendStatusMentions( content, options || {});
  } catch (err) {
    // Wrap Baileys errors into WhatsappError for consistency
    throw new Error_1.WhatsappError(
      `Failed to send message: ${err.message}`,
      { cause: err }
    );
  }
}

exports.sendStatusMentions = sendStatusMentions;
/**
 * Low-level relayMessage-Wrapper für Baileys.
 *
 * @param {string} sessionId - Deine Session-ID
 * @param {string} jid       - Ziel-JID oder Telefonnummer
 * @param {object} content   - das rohe Message-Node-Objekt
 * @param {object} options   - zusätzliche Relay-Optionen wie messageId, participant, additionalNodes, etc.
 *
 * @returns {Promise<string>} die gesendete Nachricht-ID
 */
async function relayMessage(sessionId, jid, content, options = {}) {
  const session = getCachedSession(sessionId);
  if (!session) throw new WhatsappError(`Session ${sessionId} nicht gefunden`);

  const destJid = jid.includes("@") ? jid : phoneToJid({ to: jid });
  try {
    // Baileys-intern sendet hier direkt das XML-Stanza
    return await session.relayMessage(destJid, content, options);
  } catch (err) {
    throw new Error_1.WhatsappError(`Relay an ${destJid} fehlgeschlagen: ${err.message}`, { cause: err });
  }
}
exports.relayMessage = relayMessage;