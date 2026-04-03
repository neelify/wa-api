"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPairingCode = exports.onMessageUpdate = exports.onConnecting = exports.onDisconnected = exports.onConnected = exports.onQRUpdated = exports.onMessageReceived = exports.loadSessionsFromStorage = exports.getSession = exports.getAllSession = exports.deleteSession = exports.startWhatsapp = exports.startSession = void 0;
const baileys_1 = __importStar(require("@neelify/baileys"));
const pino_1 = __importDefault(require("pino"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const Defaults_1 = require("../Defaults");
const save_media_1 = require("../Utils/save-media");
const Error_1 = require("../Error");
const message_status_1 = require("../Utils/message-status");
const sessions = new Map();
const callback = new Map();
const retryCount = new Map();
let stock;
const readCurrentWaApiVersion = () => {
    var _a, _b;
    try {
        const pkg = require("../../package.json");
        return ((_b = (_a = pkg === null || pkg === void 0 ? void 0 : pkg.version) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "") || "0.0.0";
    }
    catch (_c) {
        return process.env.npm_package_version || "0.0.0";
    }
};
const CURRENT_WA_API_VERSION = readCurrentWaApiVersion();
let waApiUpdateCheckDone = false;
let waApiUpdateInfo = null;
let waApiUpdatePromise = null;
const createSocketAuthState = (state, logger) => ({
    creds: state === null || state === void 0 ? void 0 : state.creds,
    keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
});
const resolveStoredSessionId = (entryName = "") => {
    const raw = String(entryName || "").trim();
    if (!raw)
        return "";
    return raw.endsWith(Defaults_1.CREDENTIALS.SUFFIX)
        ? raw.slice(0, -Defaults_1.CREDENTIALS.SUFFIX.length)
        : raw;
};

const normalizeVersion = (value) => String(value || "").trim().replace(/^v/i, "").split("-")[0];
const compareSemver = (a, b) => {
    const aParts = normalizeVersion(a).split(".").map((part) => parseInt(part, 10) || 0);
    const bParts = normalizeVersion(b).split(".").map((part) => parseInt(part, 10) || 0);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const left = aParts[i] || 0;
        const right = bParts[i] || 0;
        if (left > right)
            return 1;
        if (left < right)
            return -1;
    }
    return 0;
};
const isNewerVersion = (latest, current) => compareSemver(latest, current) > 0;
const requestJson = (url, options = {}) => {
    var _a;
    return new Promise((resolve, reject) => {
        const req = https_1.default.get(url, {
            timeout: Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 5000,
            headers: Object.assign({ "User-Agent": "@neelify/wa-api update-check", "Accept": "application/json" }, ((_a = options.headers) !== null && _a !== void 0 ? _a : {}))
        }, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`update-check-http-${res.statusCode}`));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                }
                catch (error) {
                    reject(error);
                }
            });
        });
        req.on("error", reject);
        req.on("timeout", () => {
            req.destroy(new Error("update-check-timeout"));
        });
    });
};
const fetchLatestWaApiVersion = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const npmInfo = yield requestJson("https://registry.npmjs.org/@neelify/wa-api/latest", { timeoutMs: 5000 });
        const latestFromNpm = normalizeVersion(((_b = (_a = npmInfo === null || npmInfo === void 0 ? void 0 : npmInfo.version) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "") || null);
        if (latestFromNpm) {
            return { latest: latestFromNpm, source: "npm" };
        }
    }
    catch (_e) { }
    try {
        const ghInfo = yield requestJson("https://api.github.com/repos/neelify/wa-api/releases/latest", {
            timeoutMs: 6000,
            headers: { "Accept": "application/vnd.github+json" }
        });
        const latestFromGithub = normalizeVersion(((_d = (_c = ghInfo === null || ghInfo === void 0 ? void 0 : ghInfo.tag_name) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "") || null);
        if (latestFromGithub) {
            return { latest: latestFromGithub, source: "github" };
        }
    }
    catch (_f) { }
    return null;
});
const resolveBaileysVersion = () => {
    var _a;
    try {
        const pkg = require("@neelify/baileys/package.json");
        return ((_a = pkg === null || pkg === void 0 ? void 0 : pkg.version) !== null && _a !== void 0 ? _a : null) || null;
    }
    catch (_error) {
        return null;
    }
};
const applyQrBrandContext = (updateInfo) => {
    process.env.NEELIFY_WRAPPER_PACKAGE = "@neelify/wa-api";
    process.env.NEELIFY_WRAPPER_VERSION = CURRENT_WA_API_VERSION;
    if (updateInfo === null || updateInfo === void 0 ? void 0 : updateInfo.hasUpdate) {
        process.env.NEELIFY_WRAPPER_UPDATE = updateInfo.latest;
    }
    else {
        delete process.env.NEELIFY_WRAPPER_UPDATE;
    }
    const baileysVersion = resolveBaileysVersion();
    if (baileysVersion) {
        process.env.NEELIFY_BAILEYS_VERSION = baileysVersion;
    }
};
const checkWaApiUpdate = () => {
    if (waApiUpdateInfo) {
        return Promise.resolve(waApiUpdateInfo);
    }
    if (waApiUpdatePromise) {
        return waApiUpdatePromise;
    }
    if (waApiUpdateCheckDone) {
        return Promise.resolve(null);
    }
    waApiUpdateCheckDone = true;
    waApiUpdatePromise = fetchLatestWaApiVersion()
        .then((latestInfo) => {
        const latestVersion = latestInfo === null || latestInfo === void 0 ? void 0 : latestInfo.latest;
        const source = (latestInfo === null || latestInfo === void 0 ? void 0 : latestInfo.source) || "npm";
        if (latestVersion && isNewerVersion(latestVersion, CURRENT_WA_API_VERSION)) {
            waApiUpdateInfo = {
                current: CURRENT_WA_API_VERSION,
                latest: latestVersion,
                hasUpdate: true,
                source
            };
            console.log(
                `[wa-api] Neue Version verfuegbar | Installiert: ${waApiUpdateInfo.current} | Neueste: ${waApiUpdateInfo.latest} | Quelle: ${waApiUpdateInfo.source}`
            );
            return waApiUpdateInfo;
        }
        waApiUpdateInfo = {
            current: CURRENT_WA_API_VERSION,
            latest: latestVersion || CURRENT_WA_API_VERSION,
            hasUpdate: false,
            source
        };
        return waApiUpdateInfo;
    })
        .catch(() => null);
    return waApiUpdatePromise;
};
const startSession = (sessionId = "mysession", options = { printQR: true }) => __awaiter(void 0, void 0, void 0, function* () {
    const waApiUpdate = yield checkWaApiUpdate().catch(() => null);
    applyQrBrandContext(waApiUpdate);
    if (isSessionExistAndRunning(sessionId))
        throw new Error_1.WhatsappError(Defaults_1.Messages.sessionAlreadyExist(sessionId));
    const logger = (0, pino_1.default)({ level: "silent" });
    const { version } = yield (0, baileys_1.fetchLatestBaileysVersion)();
    const startSocket = () => __awaiter(void 0, void 0, void 0, function* () {
        const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME, sessionId + Defaults_1.CREDENTIALS.SUFFIX));
        const sock = (0, baileys_1.default)({
            version,
            printQRInTerminal: options.printQR,
            auth: createSocketAuthState(state, logger),
            logger,
            markOnlineOnConnect: false,
            browser: baileys_1.Browsers.ubuntu("Chrome"),
        });
        sessions.set(sessionId, Object.assign({}, sock));
        try {
                
            sock.ev.process((events) => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                if (events["connection.update"]) {
                    const update = events["connection.update"];
                    const { connection, lastDisconnect } = update;
                    if (update.qr) {
                        (_a = callback.get(Defaults_1.CALLBACK_KEY.ON_QR)) === null || _a === void 0 ? void 0 : _a({
                            sessionId,
                            qr: update.qr,
                        });
                    }
                    if (connection == "connecting") {
                        (_b = callback.get(Defaults_1.CALLBACK_KEY.ON_CONNECTING)) === null || _b === void 0 ? void 0 : _b(sessionId);
                    }
                    if (connection === "close") {
                        const code = (_d = (_c = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _c === void 0 ? void 0 : _c.output) === null || _d === void 0 ? void 0 : _d.statusCode;
                        let retryAttempt = (_e = retryCount.get(sessionId)) !== null && _e !== void 0 ? _e : 0;
                        let shouldRetry;
                        if (code != baileys_1.DisconnectReason.loggedOut && retryAttempt < 10) {
                            shouldRetry = true;
                        }
                        if (shouldRetry) {
                            retryAttempt++;
                        }
                        if (shouldRetry) {
                            retryCount.set(sessionId, retryAttempt);
                            startSocket();
                        }
                        else {
                            //retryCount.delete(sessionId);
                            (0, exports.deleteSession)(sessionId);
                            (_f = callback.get(Defaults_1.CALLBACK_KEY.ON_DISCONNECTED)) === null || _f === void 0 ? void 0 : _f(sessionId);
                        }
                    }
                    if (connection == "open") {
                        retryCount.delete(sessionId);
                        (_g = callback.get(Defaults_1.CALLBACK_KEY.ON_CONNECTED)) === null || _g === void 0 ? void 0 : _g(sessionId);
                    }
                }
                if (events["creds.update"]) {
                    yield saveCreds();
                }
                if (events["messages.update"]) {
                    const msg = events["messages.update"][0];
                    const data = Object.assign({ sessionId: sessionId, messageStatus: (0, message_status_1.parseMessageStatusCodeToReadable)(msg.update.status) }, msg);
                    (_h = callback.get(Defaults_1.CALLBACK_KEY.ON_MESSAGE_UPDATED)) === null || _h === void 0 ? void 0 : _h(sessionId, data);
                }
                if (events["messages.upsert"]) {
                    const msg = (_j = events["messages.upsert"]
                        .messages) === null || _j === void 0 ? void 0 : _j[0];
                    msg.sessionId = sessionId;
                    msg.saveImage = (path) => (0, save_media_1.saveImageHandler)(msg, path);
                    msg.saveVideo = (path) => (0, save_media_1.saveVideoHandler)(msg, path);
                    msg.saveDocument = (path) => (0, save_media_1.saveDocumentHandler)(msg, path);
                    (_k = callback.get(Defaults_1.CALLBACK_KEY.ON_MESSAGE_RECEIVED)) === null || _k === void 0 ? void 0 : _k(Object.assign({}, msg));
                }
            }));
            return sock;
        }
        catch (error) {
            // console.log("SOCKET ERROR", error);
            return sock;
        }
    });
    return startSocket();
});
const onimaii = (sessionId = "mysession", connect) => __awaiter(void 0, void 0, void 0, function* () {
            const waApiUpdate = yield checkWaApiUpdate().catch(() => null);
            applyQrBrandContext(waApiUpdate);
            if (isSessionExistAndRunning(sessionId))
                throw new Error_1.WhatsappError(Defaults_1.Messages.sessionAlreadyExist(sessionId));
            const logger = (0, pino_1.default)({ level: "silent" });
            const { version } = yield (0, baileys_1.fetchLatestBaileysVersion)();
                const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME, sessionId + Defaults_1.CREDENTIALS.SUFFIX));
                const sock = (0, connect)({
                    version,
                    printQRInTerminal: true,
                    auth: createSocketAuthState(state, logger),
                    logger,
                    markOnlineOnConnect: false,
                    browser: baileys_1.Browsers.ubuntu("Chrome"),
                });
            })
            exports.onimaii = onimaii;
exports.startSession = startSession;
const startSessionWithPairingCode = (sessionId = "mysession", options = { phoneNumber },key) => __awaiter(void 0, void 0, void 0, function* () {
   const waApiUpdate = yield checkWaApiUpdate().catch(() => null);
   applyQrBrandContext(waApiUpdate);
   if (isSessionExistAndRunning(sessionId))throw new Error_1.WhatsappError(Defaults_1.Messages.sessionAlreadyExist(sessionId));
    const logger = (0, pino_1.default)({ level: "silent" });
            const { version } = yield (0, baileys_1.fetchLatestBaileysVersion)();
              const startSocket = () => __awaiter(void 0, void 0, void 0, function* () {
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
   const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME, sessionId + Defaults_1.CREDENTIALS.SUFFIX));
   
          const sock = (0, baileys_1.default)({
              version,
              printQRInTerminal: false,
              auth: createSocketAuthState(state, logger),
              logger,
              markOnlineOnConnect: false,
              browser: baileys_1.Browsers.ubuntu("Chrome"),
          });
     sessions.set(sessionId, { ...sock });
    try {
       if (!sock.authState.creds.registered) {
         console.log("first time pairing");
         setTimeout(async () => {
           const code = await sock.requestPairingCode(options.phoneNumber,key);
           console.log(code);
                 
           callback.get(Defaults_1.CALLBACK_KEY.ON_PAIRING_CODE)?.(sessionId, code);
        }, 5000);
       }
       sock.ev.process(async (events) => {
        if (events["connection.update"]) {
           const update = events["connection.update"];
          const { connection, lastDisconnect } = update;
          
                              if (connection == "connecting") {
                        (_b = callback.get(Defaults_1.CALLBACK_KEY.ON_CONNECTING)) === null || _b === void 0 ? void 0 : _b(sessionId);
                    }
           if (connection === "close") {
              const code = (_d = (_c = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _c === void 0 ? void 0 : _c.output) === null || _d === void 0 ? void 0 : _d.statusCode;
                        let retryAttempt = (_e = retryCount.get(sessionId)) !== null && _e !== void 0 ? _e : 0;
                        let shouldRetry;
                        if (code != baileys_1.DisconnectReason.loggedOut && retryAttempt < 10) {
                            shouldRetry = true;
                        }
                        if (shouldRetry) {
                            retryAttempt++;
                        }
                        if (shouldRetry) {
                            retryCount.set(sessionId, retryAttempt);
                            startSocket();
                        }
                        else {
                            retryCount.delete(sessionId);
                            (0, exports.deleteSession)(sessionId);
                            (_f = callback.get(Defaults_1.CALLBACK_KEY.ON_DISCONNECTED)) === null || _f === void 0 ? void 0 : _f(sessionId);
                        }
      }
      if (connection == "open") {
        retryCount.delete(sessionId);
        callback.get(Defaults_1.CALLBACK_KEY.ON_CONNECTED)?.(sessionId);
      }
    }
    if (events["creds.update"]) {
      await saveCreds();
    }
     if (events["messages.update"]) {
                    const msg = events["messages.update"][0];
                    const data = Object.assign({ sessionId: sessionId, messageStatus: (0, message_status_1.parseMessageStatusCodeToReadable)(msg.update.status) }, msg);
                    (_h = callback.get(Defaults_1.CALLBACK_KEY.ON_MESSAGE_UPDATED)) === null || _h === void 0 ? void 0 : _h(sessionId, data);
                }
                if (events["messages.upsert"]) {
                    const msg = (_j = events["messages.upsert"]
                        .messages) === null || _j === void 0 ? void 0 : _j[0];
                    msg.sessionId = sessionId;
                    msg.saveImage = (path) => (0, save_media_1.saveImageHandler)(msg, path);
                    msg.saveVideo = (path) => (0, save_media_1.saveVideoHandler)(msg, path);
                    msg.saveDocument = (path) => (0, save_media_1.saveDocumentHandler)(msg, path);
                    (_k = callback.get(Defaults_1.CALLBACK_KEY.ON_MESSAGE_RECEIVED)) === null || _k === void 0 ? void 0 : _k(Object.assign({}, msg));
                }
      });
            return sock;
       }
        catch (error) {
            // console.log("SOCKET ERROR", error);
            return sock;
        }
    });
    return startSocket();
});
/**
 * @deprecated Use startSession method instead
 */
exports.startSessionWithPairingCode = startSessionWithPairingCode
exports.startWhatsapp = exports.startSession;
const deleteSession = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = (0, exports.getSession)(sessionId);
    try {
        yield (session === null || session === void 0 ? void 0 : session.logout());
    }
    catch (error) { }
    session === null || session === void 0 ? void 0 : session.end(undefined);
    sessions.delete(sessionId);
    const dir = path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME, sessionId + Defaults_1.CREDENTIALS.SUFFIX);
    if (fs_1.default.existsSync(dir)) {
        fs_1.default.rmSync(dir, { force: true, recursive: true });
    }
});
exports.deleteSession = deleteSession;
const getAllSession = () => Array.from(sessions.keys());
exports.getAllSession = getAllSession;
const getSession = (key) => sessions.get(key);
exports.getSession = getSession;
const isSessionExistAndRunning = (sessionId) => {
    if (fs_1.default.existsSync(path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME)) &&
        fs_1.default.existsSync(path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME, sessionId + Defaults_1.CREDENTIALS.SUFFIX)) &&
        fs_1.default.readdirSync(path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME, sessionId + Defaults_1.CREDENTIALS.SUFFIX)).length &&
        (0, exports.getSession)(sessionId)) {
        return true;
    }
    return false;
};
const shouldLoadSession = (sessionId) => {
    if (fs_1.default.existsSync(path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME)) &&
        fs_1.default.existsSync(path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME, sessionId + Defaults_1.CREDENTIALS.SUFFIX)) &&
        fs_1.default.readdirSync(path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME, sessionId + Defaults_1.CREDENTIALS.SUFFIX)).length &&
        !(0, exports.getSession)(sessionId)) {
        return true;
    }
    return false;
};
const getAllSessionData = () => {
    // Angenommen, getAllSession gibt eine Liste aller aktiven Sessions zurück
    let allSessions = getAllSession();
    let allSessionData = {};

    for(let i = 0; i < allSessions.length; i++) {
        let sessionName = allSessions[i];
        allSessionData[sessionName] = getSession(sessionName);
    }

    return allSessionData;
}
exports.getAllSessionData = getAllSessionData;

async function loadSessionsFromStorage() {
        const dirPath = path_1.default.resolve(Defaults_1.CREDENTIALS.DIR_NAME);
    const loadedSessions = [];
  
    // Ordner anlegen, falls nicht existiert
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
  
    try {
            const entries = await fs_1.default.promises.readdir(dirPath);
  
      for (const entry of entries) {
                const fullPath = path_1.default.join(dirPath, entry);
        let stat;
        try {
                    stat = await fs_1.default.promises.stat(fullPath);
        } catch {
          // Wenn sich die Datei zwischenzeitlich entfernt hat o.Ä., überspringen
          continue;
        }
        if (!stat.isDirectory()) continue;
  
                const sessionId = resolveStoredSessionId(entry);
                if (!sessionId || !shouldLoadSession(sessionId)) continue;
  
        try {
          await startSession(sessionId);
                    if (!loadedSessions.includes(sessionId)) {
                        loadedSessions.push(sessionId);
                    }
        } catch (err) {
          console.error(`Fehler beim Starten der Session "${sessionId}":`, err);
          // weitere Sessions trotzdem laden
        }
      }
  
      return loadedSessions;
    } catch (err) {
      console.error('Fehler beim Lesen des Session-Verzeichnisses:', err);
      throw err; // oder wirf einen eigenen WhatsappError o.Ä.
    }
  }
exports.loadSessionsFromStorage = loadSessionsFromStorage;
const onMessageReceived = (listener) => {
    callback.set(Defaults_1.CALLBACK_KEY.ON_MESSAGE_RECEIVED, listener);
};

const sock = (conn) => {
    onMessageReceived(async(msg) =>{
        let {sessionId}  = msg;
let sock1 = getSesseion(sessionId)
conn = sock1
    })
  };
exports.sock = sock;
exports.onMessageReceived = onMessageReceived;
const onQRUpdated = (listener) => {
    callback.set(Defaults_1.CALLBACK_KEY.ON_QR, listener);
};
exports.onQRUpdated = onQRUpdated;
const onConnected = (listener) => {
    callback.set(Defaults_1.CALLBACK_KEY.ON_CONNECTED, listener);
};
exports.onConnected = onConnected;
const onDisconnected = (listener) => {
    callback.set(Defaults_1.CALLBACK_KEY.ON_DISCONNECTED, listener);
};
exports.onDisconnected = onDisconnected;
const onConnecting = (listener) => {
    callback.set(Defaults_1.CALLBACK_KEY.ON_CONNECTING, listener);
};
exports.onConnecting = onConnecting;
const onMessageUpdate = (listener) => {
    callback.set(Defaults_1.CALLBACK_KEY.ON_MESSAGE_UPDATED, listener);
};
exports.onMessageUpdate = onMessageUpdate;
const onPairingCode = (listener) => {
    callback.set(Defaults_1.CALLBACK_KEY.ON_PAIRING_CODE, listener);
};
exports.onPairingCode = onPairingCode;
