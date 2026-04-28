"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPairingCode = exports.onMessageUpdate = exports.onConnecting = exports.onDisconnected = exports.onConnected = exports.onQRUpdated = exports.onMessageReceived = exports.loadSessionsFromStorage = exports.getAllSessionData = exports.getAllManagedSessions = exports.getSessionStatus = exports.getSessionInfo = exports.getSession = exports.getAllSession = exports.deleteSession = exports.resumeSession = exports.stopSession = exports.pauseSession = exports.startSessionWithPairingCode = exports.startWhatsapp = exports.startSession = exports.getUpdateStatus = exports.checkForUpdates = void 0;
const baileys = require("@neelegirly/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");
const Defaults_1 = require("../Defaults");
const save_media_1 = require("../Utils/save-media");
const Error_1 = require("../Error");
const message_status_1 = require("../Utils/message-status");
const credential_save_manager_1 = require("../Utils/credential-save-manager");
const session_paths_1 = require("../Utils/session-paths");
const SESSION_STATUS = Object.freeze({
    NEW: "new",
    STARTING: "starting",
    CONNECTING: "connecting",
    RUNNING: "running",
    PAUSED: "paused",
    STOPPED: "stopped",
    DELETED: "deleted",
    ERROR: "error"
});
const SESSION_REGISTRY_FILE = ".neelegirly-session-registry.json";
const DEFAULT_RETRY_LIMIT = 10;
const RETRY_BASE_DELAY_MS = 1400;
const UPDATE_PANEL_MIN_WIDTH = 72;
const sessions = new Map();
const callback = new Map();
const retryCount = new Map();
const runtimeControls = new Map();
const sessionRegistry = new Map();
let registryLoaded = false;
let updateStatusCache = null;
let updateStatusPromise = null;
let updateSummaryPrinted = false;
const UPDATE_NOTIFY_DISABLED = String(process.env.ONIMAI_HIDE_UPDATE_NOTIFY || "0").trim() === "1";
const UPDATE_NOTIFY_PRIMARY_ONLY = String(process.env.ONIMAI_UPDATE_NOTIFY_PRIMARY_ONLY || "1").trim() !== "0";
const UPDATE_NOTIFY_PRIMARY_SESSION = String(process.env.ONIMAI_PM2_BANNER_SESSION || process.env.ONIMAI_PM2_PRIMARY_SESSION || "Onimai_Neele").trim() || "Onimai_Neele";
const shouldLogUpdateSummary = () => {
    if (UPDATE_NOTIFY_DISABLED) {
        return false;
    }
    const currentPm2SessionId = String(process.env.ONIMAI_PM2_SESSION_ID || "").trim();
    if (!currentPm2SessionId) {
        return true;
    }
    if (!UPDATE_NOTIFY_PRIMARY_ONLY) {
        return true;
    }
    return currentPm2SessionId === UPDATE_NOTIFY_PRIMARY_SESSION;
};
const now = () => Date.now();
const normalizeSessionId = (value) => {
    let current = String(value || "").trim();
    if (!current) {
        return "";
    }
    if (typeof session_paths_1.extractSessionIdFromCredentialEntry !== "function") {
        return current;
    }
    while (current) {
        const next = String((0, session_paths_1.extractSessionIdFromCredentialEntry)(current) || "").trim();
        if (!next || next === current) {
            return current;
        }
        current = next;
    }
    return "";
};
const normalizeStatus = (value, fallback = SESSION_STATUS.NEW) => {
    const raw = String(value || "").trim().toLowerCase();
    return Object.values(SESSION_STATUS).includes(raw) ? raw : fallback;
};
const normalizePositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const toTimestamp = (value) => {
    if (value == null || value === "")
        return null;
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const toNullableNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const formatShortError = (value) => {
    if (!value)
        return null;
    const text = String(value.message || value || "").trim().replace(/\s+/g, " ");
    return text ? text.slice(0, 320) : null;
};
const safeArrayBrowser = (value) => Array.isArray(value) && value.length === 3
    ? value.map((entry) => String(entry || ""))
    : null;
const safePhoneNumber = (value) => {
    const text = String(value || "").trim();
    return text ? text : null;
};
const getCredentialsRoot = () => {
    const dir = (0, session_paths_1.getCredentialsDir)();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
};
const getLegacyRegistryPaths = () => getCredentialRootDirectories()
    .filter((dirPath) => dirPath !== getCredentialsRoot())
    .map((dirPath) => path.resolve(dirPath, SESSION_REGISTRY_FILE));
const getRegistryPath = () => path.resolve(getCredentialsRoot(), SESSION_REGISTRY_FILE);
const stableWriteJson = (filePath, payload) => {
    const tempFile = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2));
    fs.renameSync(tempFile, filePath);
};
const readJsonFile = (filePath) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    catch (_error) {
        return null;
    }
};
const readRegistryEntries = (filePath) => {
    const parsed = readJsonFile(filePath);
    return parsed && typeof parsed.sessions === "object" ? parsed.sessions : {};
};
const readPackageMeta = (candidate, fallback = {}) => {
    try {
        return require(candidate);
    }
    catch (_error) {
        return fallback;
    }
};
const WA_API_META = readPackageMeta("../../package.json", {
    name: "@neelegirly/wa-api",
    version: process.env.npm_package_version || "0.0.0"
});
const CURRENT_WA_API_VERSION = String(WA_API_META.version || process.env.npm_package_version || "0.0.0").trim() || "0.0.0";
const WA_API_PACKAGE_NAME = String(WA_API_META.name || "@neelegirly/wa-api").trim() || "@neelegirly/wa-api";
const resolveBaileysPackageMeta = () => {
    const pkg = readPackageMeta("@neelegirly/baileys/package.json", { name: "@neelegirly/baileys", version: null });
    return {
        packageName: String(pkg.name || "@neelegirly/baileys").trim() || "@neelegirly/baileys",
        version: String(pkg.version || "").trim() || null
    };
};
const getCredentialRootDirectories = () => {
    try {
        const dirs = typeof session_paths_1.getCredentialRootDirectories === "function"
            ? (0, session_paths_1.getCredentialRootDirectories)()
            : [(0, session_paths_1.getCredentialsDir)()];
        return Array.from(new Set((Array.isArray(dirs) ? dirs : [(0, session_paths_1.getCredentialsDir)()])
            .map((dirPath) => path.resolve(String(dirPath || "").trim()))
            .filter(Boolean)));
    }
    catch (_error) {
        return [(0, session_paths_1.getCredentialsDir)()];
    }
};
const buildPm2Name = (sessionId) => normalizeSessionId(sessionId).replace(/\s+/g, "_") || "neelegirly-session";
const normalizePm2Name = (value, fallbackSessionId) => {
    const raw = String(value || "").trim();
    if (!raw) {
        return buildPm2Name(fallbackSessionId);
    }
    const normalized = normalizeSessionId(raw);
    return normalized && normalized !== raw ? buildPm2Name(normalized) : raw;
};
const hasCredentialFiles = (credentialDirectory) => {
    try {
        return fs.existsSync(credentialDirectory)
            && fs.lstatSync(credentialDirectory).isDirectory()
            && fs.readdirSync(credentialDirectory).length > 0;
    }
    catch (_error) {
        return false;
    }
};
const createLogger = () => {
    const factory = typeof pino === "function" ? pino : pino.default;
    return factory({ level: "silent" });
};
const createSocketAuthState = (state, logger) => ({
    creds: state === null || state === void 0 ? void 0 : state.creds,
    keys: (0, baileys.makeCacheableSignalKeyStore)(state.keys, logger)
});
const sanitizeStartMethod = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    return raw === "pairing" || raw === "code" ? "pairing" : "qr";
};
const buildSessionRecord = (sessionId, seed = {}) => {
    const id = normalizeSessionId(sessionId || seed.id);
    if (!id) {
        throw new Error_1.WhatsappError(Defaults_1.Messages.paremetersRequired("sessionId"));
    }
    const credentialDirectory = (0, session_paths_1.resolveCredentialDirectory)(id, { migrateLegacy: true });
    const hasCredentials = hasCredentialFiles(credentialDirectory);
    let status = normalizeStatus(seed.status, hasCredentials ? SESSION_STATUS.STOPPED : SESSION_STATUS.NEW);
    if (status === SESSION_STATUS.DELETED && hasCredentials) {
        status = SESSION_STATUS.STOPPED;
    }
    let desiredState = normalizeStatus(seed.desiredState, hasCredentials ? SESSION_STATUS.RUNNING : SESSION_STATUS.STOPPED);
    if ((status === SESSION_STATUS.PAUSED || status === SESSION_STATUS.STOPPED) && seed.desiredState == null) {
        desiredState = status;
    }
    if (status === SESSION_STATUS.DELETED) {
        desiredState = SESSION_STATUS.DELETED;
    }
    return {
        id,
        status,
        desiredState,
        autoStart: seed.autoStart !== false,
        printQR: Boolean(seed.printQR),
        method: sanitizeStartMethod(seed.method || (seed.phoneNumber ? "pairing" : "qr")),
        credentialDirectory,
        credentialDirectoryName: path.basename(credentialDirectory),
        hasCredentials,
        phoneNumber: safePhoneNumber(seed.phoneNumber),
        pm2Name: normalizePm2Name(seed.pm2Name, id),
        createdAt: toTimestamp(seed.createdAt) || now(),
        updatedAt: toTimestamp(seed.updatedAt) || now(),
        lastStartedAt: toTimestamp(seed.lastStartedAt),
        lastConnectedAt: toTimestamp(seed.lastConnectedAt),
        lastDisconnectedAt: toTimestamp(seed.lastDisconnectedAt),
        lastPausedAt: toTimestamp(seed.lastPausedAt),
        lastStoppedAt: toTimestamp(seed.lastStoppedAt),
        lastDeletedAt: toTimestamp(seed.lastDeletedAt),
        lastPairingCodeAt: toTimestamp(seed.lastPairingCodeAt),
        lastError: formatShortError(seed.lastError),
        lastDisconnectCode: toNullableNumber(seed.lastDisconnectCode),
        runtimeOnline: false,
        retryCount: normalizePositiveNumber(seed.retryCount, 0),
        retryLimit: normalizePositiveNumber(seed.retryLimit, DEFAULT_RETRY_LIMIT),
        browser: safeArrayBrowser(seed.browser)
    };
};
const serializeRecord = (record) => ({
    id: record.id,
    status: record.status,
    desiredState: record.desiredState,
    autoStart: record.autoStart,
    printQR: record.printQR,
    method: record.method,
    phoneNumber: record.phoneNumber,
    pm2Name: record.pm2Name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastStartedAt: record.lastStartedAt,
    lastConnectedAt: record.lastConnectedAt,
    lastDisconnectedAt: record.lastDisconnectedAt,
    lastPausedAt: record.lastPausedAt,
    lastStoppedAt: record.lastStoppedAt,
    lastDeletedAt: record.lastDeletedAt,
    lastPairingCodeAt: record.lastPairingCodeAt,
    lastError: record.lastError,
    lastDisconnectCode: record.lastDisconnectCode,
    retryCount: record.retryCount,
    retryLimit: record.retryLimit,
    browser: record.browser
});
const persistRegistry = () => {
    if (!registryLoaded) {
        return;
    }
    const entries = {};
    for (const [sessionId, record] of Array.from(sessionRegistry.entries()).sort((left, right) => left[0].localeCompare(right[0]))) {
        entries[sessionId] = serializeRecord(record);
    }
    stableWriteJson(getRegistryPath(), {
        version: 2,
        updatedAt: new Date().toISOString(),
        sessions: entries
    });
};
const ensureRegistryLoaded = () => {
    if (registryLoaded) {
        return;
    }
    registryLoaded = true;
    const registryPaths = Array.from(new Set([...getLegacyRegistryPaths(), getRegistryPath()]));
    for (const registryPath of registryPaths) {
        const entries = readRegistryEntries(registryPath);
        for (const [sessionId, record] of Object.entries(entries || {})) {
            try {
                const normalizedId = normalizeSessionId(sessionId || (record === null || record === void 0 ? void 0 : record.id));
                if (!normalizedId) {
                    continue;
                }
                const previous = sessionRegistry.get(normalizedId) || {};
                sessionRegistry.set(normalizedId, buildSessionRecord(normalizedId, Object.assign(Object.assign(Object.assign({}, previous), record), { id: normalizedId })));
            }
            catch (_error) { }
        }
    }
    for (const sessionId of (0, session_paths_1.listStoredSessionIds)()) {
        if (!sessionRegistry.has(sessionId)) {
            sessionRegistry.set(sessionId, buildSessionRecord(sessionId, {
                status: SESSION_STATUS.STOPPED,
                desiredState: SESSION_STATUS.RUNNING,
                autoStart: true
            }));
        }
    }
    persistRegistry();
};
const upsertSessionRecord = (sessionId, patch = {}, options = {}) => {
    ensureRegistryLoaded();
    const id = normalizeSessionId(sessionId);
    const existing = sessionRegistry.get(id);
    const next = buildSessionRecord(id, Object.assign(Object.assign({}, existing), patch));
    sessionRegistry.set(id, next);
    if (options.persist !== false) {
        persistRegistry();
    }
    return next;
};
const getStoredSessionRecord = (sessionId) => {
    ensureRegistryLoaded();
    const id = normalizeSessionId(sessionId);
    if (!id) {
        return null;
    }
    const existing = sessionRegistry.get(id);
    if (existing) {
        const refreshed = buildSessionRecord(id, existing);
        sessionRegistry.set(id, refreshed);
        return refreshed;
    }
    const hasCredentials = hasCredentialFiles((0, session_paths_1.resolveCredentialDirectory)(id, { migrateLegacy: true }));
    if (hasCredentials || sessions.has(id)) {
        return upsertSessionRecord(id, {
            status: sessions.has(id) ? SESSION_STATUS.RUNNING : SESSION_STATUS.STOPPED,
            desiredState: SESSION_STATUS.RUNNING
        });
    }
    return null;
};
const removeSessionRecord = (sessionId) => {
    ensureRegistryLoaded();
    sessionRegistry.delete(normalizeSessionId(sessionId));
    persistRegistry();
};
const buildSessionInfo = (record) => {
    if (!record) {
        return null;
    }
    const refreshed = buildSessionRecord(record.id, record);
    refreshed.runtimeOnline = sessions.has(refreshed.id);
    refreshed.retryCount = retryCount.get(refreshed.id) || refreshed.retryCount || 0;
    sessionRegistry.set(refreshed.id, refreshed);
    return {
        id: refreshed.id,
        status: refreshed.status,
        desiredState: refreshed.desiredState,
        autoStart: refreshed.autoStart,
        printQR: refreshed.printQR,
        hasCredentials: refreshed.hasCredentials,
        runtimeOnline: refreshed.runtimeOnline,
        retryCount: refreshed.retryCount,
        method: refreshed.method,
        credentialDirectory: refreshed.credentialDirectory,
        credentialDirectoryName: refreshed.credentialDirectoryName,
        phoneNumber: refreshed.phoneNumber,
        pm2Name: refreshed.pm2Name,
        createdAt: refreshed.createdAt,
        updatedAt: refreshed.updatedAt,
        lastStartedAt: refreshed.lastStartedAt,
        lastConnectedAt: refreshed.lastConnectedAt,
        lastDisconnectedAt: refreshed.lastDisconnectedAt,
        lastPausedAt: refreshed.lastPausedAt,
        lastStoppedAt: refreshed.lastStoppedAt,
        lastDeletedAt: refreshed.lastDeletedAt,
        lastPairingCodeAt: refreshed.lastPairingCodeAt,
        lastError: refreshed.lastError,
        lastDisconnectCode: refreshed.lastDisconnectCode
    };
};
const getCallbackListeners = (key) => {
    const entry = callback.get(key);
    if (typeof entry === "function") {
        return [entry];
    }
    if (Array.isArray(entry)) {
        return entry.filter((listener) => typeof listener === "function");
    }
    return [];
};
const registerCallbackListener = (key, listener) => {
    if (typeof listener !== "function") {
        return;
    }
    const listeners = getCallbackListeners(key);
    if (listeners.includes(listener)) {
        callback.set(key, listeners);
        return;
    }
    listeners.push(listener);
    callback.set(key, listeners);
};
const hasCallbackListeners = (key) => getCallbackListeners(key).length > 0;
const invokeCallback = async (key, ...args) => {
    const listeners = getCallbackListeners(key);
    if (!listeners.length) {
        return;
    }
    for (const listener of listeners) {
        try {
            await Promise.resolve(listener(...args));
        }
        catch (error) {
            console.warn(`[wa-api] callback ${String(key || "unknown")} failed:`, error === null || error === void 0 ? void 0 : error.message || error);
        }
    }
};
const padPanelLine = (value, width) => `│ ${String(value || "").padEnd(width, " ")} │`;
const printPanel = (title, rows = []) => {
    const safeRows = rows.filter(Boolean).map((row) => String(row));
    const width = Math.max(UPDATE_PANEL_MIN_WIDTH, title.length, ...safeRows.map((row) => row.length));
    console.log(`╭${"─".repeat(width + 2)}╮`);
    console.log(padPanelLine(title, width));
    if (safeRows.length) {
        console.log(`├${"─".repeat(width + 2)}┤`);
        for (const row of safeRows) {
            console.log(padPanelLine(row, width));
        }
    }
    console.log(`╰${"─".repeat(width + 2)}╯`);
};
const applyQrBrandContext = (snapshot) => {
    var _a, _b;
    process.env.NEELEGIRLY_WRAPPER_PACKAGE = WA_API_PACKAGE_NAME;
    process.env.NEELEGIRLY_WRAPPER_VERSION = CURRENT_WA_API_VERSION;
    const wrapperLatest = (snapshot === null || snapshot === void 0 ? void 0 : snapshot.waApi) && snapshot.waApi.hasUpdate
        ? ((_b = (_a = snapshot.waApi) === null || _a === void 0 ? void 0 : _a.latest) !== null && _b !== void 0 ? _b : "")
        : "";
    process.env.NEELEGIRLY_WRAPPER_LATEST = wrapperLatest;
    process.env.NEELEGIRLY_WRAPPER_UPDATE = wrapperLatest;
    process.env.NEELEGIRLY_WRAPPER_UPDATE_STATE = snapshot === null || snapshot === void 0 ? void 0 : snapshot.waApi ? (snapshot.waApi.hasUpdate ? "update-available" : "up-to-date") : "unknown";
    const baileysMeta = resolveBaileysPackageMeta();
    process.env.NEELEGIRLY_BAILEYS_VERSION = baileysMeta.version || "";
    process.env.NEELEGIRLY_BAILEYS_LATEST = (snapshot === null || snapshot === void 0 ? void 0 : snapshot.baileys) ? snapshot.baileys.latest : (baileysMeta.version || "");
    process.env.NEELEGIRLY_BAILEYS_UPDATE_STATE = snapshot === null || snapshot === void 0 ? void 0 : snapshot.baileys ? (snapshot.baileys.hasUpdate ? "update-available" : "up-to-date") : "unknown";
};
const summarizeUpdate = (label, info) => {
    if (!info) {
        return `⚪ ${label}: Update-Status derzeit nicht erreichbar`;
    }
    const state = info.hasUpdate ? "🆕 Update verfügbar" : "✅ Up to date";
    return `${state} · ${label} · installiert ${info.current} · latest ${info.latest}`;
};
const resolveOwnPackageUpdate = async () => {
    if (typeof baileys.checkNpmVersion !== "function") {
        return null;
    }
    const info = await baileys.checkNpmVersion(WA_API_PACKAGE_NAME, CURRENT_WA_API_VERSION, {
        githubRepo: "neelegirly/wa-api",
        timeoutMs: 5000
    });
    return info
        ? {
            packageName: WA_API_PACKAGE_NAME,
            current: info.current,
            latest: info.latest,
            hasUpdate: info.hasUpdate,
            source: info.source
        }
        : null;
};
const resolveBaileysPackageUpdate = async () => {
    const meta = resolveBaileysPackageMeta();
    if (!meta.version || typeof baileys.checkNpmVersion !== "function") {
        return meta.version
            ? {
                packageName: meta.packageName,
                current: meta.version,
                latest: meta.version,
                hasUpdate: false
            }
            : null;
    }
    const info = await baileys.checkNpmVersion(meta.packageName, meta.version, {
        githubRepo: "neelegirly/baileys",
        timeoutMs: 5000
    });
    return info
        ? {
            packageName: meta.packageName,
            current: info.current,
            latest: info.latest,
            hasUpdate: info.hasUpdate,
            source: info.source
        }
        : {
            packageName: meta.packageName,
            current: meta.version,
            latest: meta.version,
            hasUpdate: false
        };
};
const checkForUpdates = async ({ force = false } = {}) => {
    if (force) {
        updateStatusCache = null;
        updateStatusPromise = null;
        updateSummaryPrinted = false;
    }
    if (updateStatusCache) {
        return updateStatusCache;
    }
    if (updateStatusPromise) {
        return updateStatusPromise;
    }
    updateStatusPromise = Promise.all([resolveOwnPackageUpdate(), resolveBaileysPackageUpdate()])
        .then(([waApi, baileysInfo]) => {
        updateStatusCache = {
            checkedAt: now(),
            waApi,
            baileys: baileysInfo
        };
        applyQrBrandContext(updateStatusCache);
        return updateStatusCache;
    })
        .catch(() => {
        updateStatusCache = {
            checkedAt: now(),
            waApi: null,
            baileys: null
        };
        applyQrBrandContext(updateStatusCache);
        return updateStatusCache;
    })
        .finally(() => {
        updateStatusPromise = null;
    });
    return updateStatusPromise;
};
exports.checkForUpdates = checkForUpdates;
const getUpdateStatus = () => updateStatusCache;
exports.getUpdateStatus = getUpdateStatus;
const logUpdateSummaryOnce = async () => {
    if (updateSummaryPrinted) {
        return;
    }
    if (!shouldLogUpdateSummary()) {
        updateSummaryPrinted = true;
        return;
    }
    updateSummaryPrinted = true;
    const snapshot = await (0, exports.checkForUpdates)().catch(() => null);
    if (!snapshot) {
        return;
    }
    printPanel("🌸 Neelegirly Update Notify", [
        summarizeUpdate(WA_API_PACKAGE_NAME, snapshot.waApi),
        summarizeUpdate("@neelegirly/baileys", snapshot.baileys)
    ]);
};
const normalizeStartOptions = (record, options = {}) => ({
    printQR: typeof options.printQR === "boolean" ? options.printQR : Boolean(record === null || record === void 0 ? void 0 : record.printQR),
    autoStart: typeof options.autoStart === "boolean" ? options.autoStart : !(record && record.autoStart === false),
    retryLimit: normalizePositiveNumber(options.retryLimit, normalizePositiveNumber(record === null || record === void 0 ? void 0 : record.retryLimit, DEFAULT_RETRY_LIMIT)),
    phoneNumber: safePhoneNumber(options.phoneNumber || (record === null || record === void 0 ? void 0 : record.phoneNumber)),
    pairingKey: safePhoneNumber(options.pairingKey),
    browser: safeArrayBrowser(options.browser || (record === null || record === void 0 ? void 0 : record.browser)),
    method: sanitizeStartMethod(options.method || (record === null || record === void 0 ? void 0 : record.method))
});
const removeCredentialArtifacts = (sessionId) => {
    const id = normalizeSessionId(sessionId);
    if (!id) {
        return;
    }
    const credentialDirs = getCredentialRootDirectories()
        .flatMap((rootDir) => (0, session_paths_1.getCredentialSuffixes)()
        .map((suffix) => path.resolve(rootDir, (0, session_paths_1.buildCredentialDirectoryName)(id, suffix))));
    for (const dirPath of Array.from(new Set(credentialDirs))) {
        try {
            if (fs.existsSync(dirPath)) {
                fs.rmSync(dirPath, { recursive: true, force: true });
            }
        }
        catch (_error) { }
    }
};
const clearRetryTimer = (control) => {
    if (control && control.retryTimer) {
        clearTimeout(control.retryTimer);
        control.retryTimer = null;
    }
};
const detachRuntimeState = (sessionId, control) => {
    clearRetryTimer(control);
    runtimeControls.delete(sessionId);
    sessions.delete(sessionId);
};
const updateLifecycleRecord = (sessionId, patch = {}, options = {}) => {
    const record = upsertSessionRecord(sessionId, Object.assign({ updatedAt: now() }, patch), options);
    return buildSessionInfo(record);
};
const decorateIncomingMessage = (message, sessionId) => {
    if (!message) {
        return null;
    }
    message.sessionId = sessionId;
    message.saveImage = (targetPath) => (0, save_media_1.saveImageHandler)(message, targetPath);
    message.saveVideo = (targetPath) => (0, save_media_1.saveVideoHandler)(message, targetPath);
    message.saveDocument = (targetPath) => (0, save_media_1.saveDocumentHandler)(message, targetPath);
    return message;
};
const scheduleRetry = (sessionId, control) => {
    clearRetryTimer(control);
    const attempts = retryCount.get(sessionId) || 0;
    const delayMs = Math.min(8000, RETRY_BASE_DELAY_MS * Math.max(1, attempts));
    control.retryTimer = setTimeout(() => {
        control.retryTimer = null;
        const latest = getStoredSessionRecord(sessionId);
        if (!(latest === null || latest === void 0 ? void 0 : latest.desiredState) || latest.desiredState !== SESSION_STATUS.RUNNING) {
            return;
        }
        openSessionRuntime(sessionId, control.startOptions, control.method, { isRetry: true }).catch((error) => {
            updateLifecycleRecord(sessionId, {
                status: SESSION_STATUS.ERROR,
                desiredState: SESSION_STATUS.RUNNING,
                lastError: formatShortError(error)
            });
        });
    }, delayMs);
};
const finalizeManualClose = (sessionId, control, targetStatus, code) => {
    const timestamp = now();
    detachRuntimeState(sessionId, control);
    retryCount.delete(sessionId);
    if (targetStatus === SESSION_STATUS.DELETED) {
        return;
    }
    const patch = {
        status: targetStatus,
        desiredState: targetStatus,
        runtimeOnline: false,
        lastDisconnectedAt: timestamp,
        lastDisconnectCode: toNullableNumber(code),
        retryCount: 0
    };
    if (targetStatus === SESSION_STATUS.PAUSED) {
        patch.lastPausedAt = timestamp;
    }
    if (targetStatus === SESSION_STATUS.STOPPED) {
        patch.lastStoppedAt = timestamp;
    }
    updateLifecycleRecord(sessionId, patch);
};
const attachSocketEventProcessor = (sessionId, sock, control) => {
    const managedSaveCreds = control.managedSaveCreds;
    sock.ev.process(async (events) => {
        var _a, _b;
        if (events["connection.update"]) {
            const update = events["connection.update"];
            const connection = update.connection;
            const disconnectCode = (_b = (_a = update.lastDisconnect) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.output;
            const statusCode = toNullableNumber(disconnectCode === null || disconnectCode === void 0 ? void 0 : disconnectCode.statusCode);
            if (update.qr) {
                updateLifecycleRecord(sessionId, {
                    status: SESSION_STATUS.STARTING,
                    desiredState: SESSION_STATUS.RUNNING,
                    printQR: control.startOptions.printQR
                });
                await invokeCallback(Defaults_1.CALLBACK_KEY.ON_QR, { sessionId, qr: update.qr });
            }
            if (connection === "connecting") {
                updateLifecycleRecord(sessionId, {
                    status: SESSION_STATUS.CONNECTING,
                    desiredState: SESSION_STATUS.RUNNING,
                    runtimeOnline: false
                });
                await invokeCallback(Defaults_1.CALLBACK_KEY.ON_CONNECTING, sessionId);
            }
            if (connection === "open") {
                await managedSaveCreds.flush("connection-open");
                retryCount.delete(sessionId);
                updateLifecycleRecord(sessionId, {
                    status: SESSION_STATUS.RUNNING,
                    desiredState: SESSION_STATUS.RUNNING,
                    runtimeOnline: true,
                    retryCount: 0,
                    lastConnectedAt: now(),
                    lastError: null,
                    lastDisconnectCode: null
                });
                await invokeCallback(Defaults_1.CALLBACK_KEY.ON_CONNECTED, sessionId);
            }
            if (connection === "close") {
                await managedSaveCreds.flush("connection-close");
                const manualTarget = normalizeStatus(control.desiredState, SESSION_STATUS.RUNNING);
                if (manualTarget !== SESSION_STATUS.RUNNING) {
                    finalizeManualClose(sessionId, control, manualTarget, statusCode);
                    if (manualTarget !== SESSION_STATUS.DELETED) {
                        await invokeCallback(Defaults_1.CALLBACK_KEY.ON_DISCONNECTED, sessionId);
                    }
                    return;
                }
                detachRuntimeState(sessionId, control);
                const attempts = retryCount.get(sessionId) || 0;
                const canRetry = statusCode !== baileys.DisconnectReason.loggedOut && attempts < normalizePositiveNumber(control.startOptions.retryLimit, DEFAULT_RETRY_LIMIT);
                const lastError = formatShortError((update.lastDisconnect === null || update.lastDisconnect === void 0 ? void 0 : update.lastDisconnect.error) || `disconnect-${statusCode || "unknown"}`);
                if (canRetry) {
                    retryCount.set(sessionId, attempts + 1);
                    updateLifecycleRecord(sessionId, {
                        status: SESSION_STATUS.CONNECTING,
                        desiredState: SESSION_STATUS.RUNNING,
                        runtimeOnline: false,
                        retryCount: attempts + 1,
                        lastDisconnectedAt: now(),
                        lastDisconnectCode: statusCode,
                        lastError
                    });
                    scheduleRetry(sessionId, control);
                    return;
                }
                retryCount.delete(sessionId);
                if (statusCode === baileys.DisconnectReason.loggedOut) {
                    removeCredentialArtifacts(sessionId);
                    updateLifecycleRecord(sessionId, {
                        status: SESSION_STATUS.DELETED,
                        desiredState: SESSION_STATUS.DELETED,
                        runtimeOnline: false,
                        lastDeletedAt: now(),
                        lastDisconnectedAt: now(),
                        lastDisconnectCode: statusCode,
                        lastError
                    });
                    removeSessionRecord(sessionId);
                }
                else {
                    updateLifecycleRecord(sessionId, {
                        status: SESSION_STATUS.ERROR,
                        desiredState: SESSION_STATUS.RUNNING,
                        runtimeOnline: false,
                        retryCount: 0,
                        lastDisconnectedAt: now(),
                        lastDisconnectCode: statusCode,
                        lastError
                    });
                }
                await invokeCallback(Defaults_1.CALLBACK_KEY.ON_DISCONNECTED, sessionId);
            }
        }
        if (events["creds.update"]) {
            await managedSaveCreds();
        }
        if (events["messages.update"]) {
            const updates = Array.isArray(events["messages.update"]) ? events["messages.update"] : [];
            for (const message of updates) {
                if (!message) {
                    continue;
                }
                await invokeCallback(Defaults_1.CALLBACK_KEY.ON_MESSAGE_UPDATED, sessionId, Object.assign({ sessionId, messageStatus: (0, message_status_1.parseMessageStatusCodeToReadable)(message === null || message === void 0 ? void 0 : message.update.status) }, message));
            }
        }
        if (events["messages.upsert"]) {
            const upsertMessages = Array.isArray(events["messages.upsert"].messages) ? events["messages.upsert"].messages : [];
            for (const rawMessage of upsertMessages) {
                const message = decorateIncomingMessage(rawMessage, sessionId);
                if (!message) {
                    continue;
                }
                message.upsertType = String((events["messages.upsert"] === null || events["messages.upsert"] === void 0 ? void 0 : events["messages.upsert"].type) || "");
                await invokeCallback(Defaults_1.CALLBACK_KEY.ON_MESSAGE_RECEIVED, Object.assign({}, message));
            }
        }
    });
};
const openSessionRuntime = async (sessionId, options = {}, mode = "qr", runtimeOptions = {}) => {
    const id = normalizeSessionId(sessionId);
    if (!id) {
        throw new Error_1.WhatsappError(Defaults_1.Messages.paremetersRequired("sessionId"));
    }
    await logUpdateSummaryOnce();
    if (sessions.has(id)) {
        throw new Error_1.WhatsappError(Defaults_1.Messages.sessionAlreadyExist(id));
    }
    const currentRecord = getStoredSessionRecord(id);
    const startOptions = normalizeStartOptions(currentRecord, options);
    const logger = createLogger();
    const credentialDirectory = (0, session_paths_1.resolveCredentialDirectory)(id, { create: true, migrateLegacy: true });
    const authState = await baileys.useMultiFileAuthState(credentialDirectory);
    if (mode === "pairing" && !authState.state.creds.registered && !startOptions.phoneNumber) {
        if (!hasCredentialFiles(credentialDirectory)) {
            try {
                fs.rmSync(credentialDirectory, { recursive: true, force: true });
            }
            catch (_error) { }
        }
        throw new Error_1.WhatsappError(Defaults_1.Messages.paremetersRequired("phoneNumber"));
    }
    const managedSaveCreds = (0, credential_save_manager_1.createCredentialSaveManager)(authState.saveCreds, { label: id, logger });
    const latestVersion = await baileys.fetchLatestBaileysVersion();
    const shouldPrintQrInTerminal = mode !== "pairing"
        && Boolean(startOptions.printQR)
        && !hasCallbackListeners(Defaults_1.CALLBACK_KEY.ON_QR);
    const sock = baileys.default({
        version: latestVersion.version,
        printQRInTerminal: shouldPrintQrInTerminal,
        auth: createSocketAuthState(authState.state, logger),
        logger,
        markOnlineOnConnect: false,
        browser: startOptions.browser || baileys.Browsers.ubuntu("Chrome")
    });
    const control = {
        sessionId: id,
        desiredState: SESSION_STATUS.RUNNING,
        method: mode,
        startOptions,
        managedSaveCreds,
        logger,
        retryTimer: null
    };
    runtimeControls.set(id, control);
    sessions.set(id, sock);
    retryCount.set(id, runtimeOptions.isRetry === true ? (retryCount.get(id) || 0) : 0);
    updateLifecycleRecord(id, {
        status: SESSION_STATUS.STARTING,
        desiredState: SESSION_STATUS.RUNNING,
        autoStart: startOptions.autoStart,
        printQR: startOptions.printQR,
        method: mode,
        browser: startOptions.browser,
        phoneNumber: startOptions.phoneNumber,
        retryLimit: startOptions.retryLimit,
        runtimeOnline: false,
        retryCount: retryCount.get(id) || 0,
        lastStartedAt: now(),
        lastError: null
    });
    attachSocketEventProcessor(id, sock, control);
    if (mode === "pairing" && startOptions.phoneNumber && !authState.state.creds.registered) {
        setTimeout(async () => {
            if (control.desiredState !== SESSION_STATUS.RUNNING) {
                return;
            }
            try {
                const code = await sock.requestPairingCode(startOptions.phoneNumber, startOptions.pairingKey);
                updateLifecycleRecord(id, {
                    lastPairingCodeAt: now(),
                    phoneNumber: startOptions.phoneNumber,
                    method: "pairing"
                });
                await invokeCallback(Defaults_1.CALLBACK_KEY.ON_PAIRING_CODE, id, code);
            }
            catch (error) {
                updateLifecycleRecord(id, {
                    status: SESSION_STATUS.ERROR,
                    desiredState: SESSION_STATUS.RUNNING,
                    lastError: formatShortError(error)
                });
            }
        }, 1500);
    }
    return sock;
};
const startSession = async (sessionId = "mysession", options = { printQR: true }) => openSessionRuntime(sessionId, options || {}, sanitizeStartMethod(options === null || options === void 0 ? void 0 : options.method));
exports.startSession = startSession;
exports.startWhatsapp = exports.startSession;
const startSessionWithPairingCode = async (sessionId = "mysession", options = {}) => openSessionRuntime(sessionId, Object.assign(Object.assign({}, options), { method: "pairing" }), "pairing");
exports.startSessionWithPairingCode = startSessionWithPairingCode;
const pauseSession = async (sessionId) => {
    const id = normalizeSessionId(sessionId);
    if (!id) {
        throw new Error_1.WhatsappError(Defaults_1.Messages.paremetersRequired("sessionId"));
    }
    const record = getStoredSessionRecord(id);
    const control = runtimeControls.get(id);
    const sock = sessions.get(id);
    if (!record && !sock) {
        throw new Error_1.WhatsappError(Defaults_1.Messages.sessionNotFound(id));
    }
    if (control) {
        control.desiredState = SESSION_STATUS.PAUSED;
        clearRetryTimer(control);
        await (control.managedSaveCreds === null || control.managedSaveCreds === void 0 ? void 0 : control.managedSaveCreds.flush("manual-pause"));
    }
    if (sock) {
        try {
            sock.end(undefined);
        }
        catch (_error) { }
        try {
            sock.ws && sock.ws.close && sock.ws.close();
        }
        catch (_error) { }
    }
    updateLifecycleRecord(id, {
        status: SESSION_STATUS.PAUSED,
        desiredState: SESSION_STATUS.PAUSED,
        runtimeOnline: false,
        lastPausedAt: now(),
        retryCount: 0,
        lastError: null
    });
    detachRuntimeState(id, control);
    retryCount.delete(id);
    return (0, exports.getSessionInfo)(id);
};
exports.pauseSession = pauseSession;
const stopSession = async (sessionId) => {
    const id = normalizeSessionId(sessionId);
    if (!id) {
        throw new Error_1.WhatsappError(Defaults_1.Messages.paremetersRequired("sessionId"));
    }
    const record = getStoredSessionRecord(id);
    const control = runtimeControls.get(id);
    const sock = sessions.get(id);
    if (!record && !sock) {
        throw new Error_1.WhatsappError(Defaults_1.Messages.sessionNotFound(id));
    }
    if (control) {
        control.desiredState = SESSION_STATUS.STOPPED;
        clearRetryTimer(control);
        await (control.managedSaveCreds === null || control.managedSaveCreds === void 0 ? void 0 : control.managedSaveCreds.flush("manual-stop"));
    }
    if (sock) {
        try {
            sock.end(undefined);
        }
        catch (_error) { }
        try {
            sock.ws && sock.ws.close && sock.ws.close();
        }
        catch (_error) { }
    }
    updateLifecycleRecord(id, {
        status: SESSION_STATUS.STOPPED,
        desiredState: SESSION_STATUS.STOPPED,
        runtimeOnline: false,
        lastStoppedAt: now(),
        retryCount: 0,
        lastError: null
    });
    detachRuntimeState(id, control);
    retryCount.delete(id);
    return (0, exports.getSessionInfo)(id);
};
exports.stopSession = stopSession;
const resumeSession = async (sessionId, options = {}) => {
    const id = normalizeSessionId(sessionId);
    if (!id) {
        throw new Error_1.WhatsappError(Defaults_1.Messages.paremetersRequired("sessionId"));
    }
    const record = getStoredSessionRecord(id);
    if (!(record === null || record === void 0 ? void 0 : record.hasCredentials) && !sessions.has(id)) {
        throw new Error_1.WhatsappError(Defaults_1.Messages.sessionNotFound(id));
    }
    if (sessions.has(id)) {
        return sessions.get(id);
    }
    const mode = sanitizeStartMethod((options === null || options === void 0 ? void 0 : options.method) || (record === null || record === void 0 ? void 0 : record.method));
    return openSessionRuntime(id, Object.assign(Object.assign({}, record), options), mode);
};
exports.resumeSession = resumeSession;
const deleteSession = async (sessionId) => {
    const id = normalizeSessionId(sessionId);
    if (!id) {
        throw new Error_1.WhatsappError(Defaults_1.Messages.paremetersRequired("sessionId"));
    }
    const control = runtimeControls.get(id);
    const sock = sessions.get(id);
    if (control) {
        control.desiredState = SESSION_STATUS.DELETED;
        clearRetryTimer(control);
        await (control.managedSaveCreds === null || control.managedSaveCreds === void 0 ? void 0 : control.managedSaveCreds.flush("manual-delete"));
    }
    if (sock) {
        try {
            await (sock.logout === null || sock.logout === void 0 ? void 0 : sock.logout());
        }
        catch (_error) { }
        try {
            sock.end(undefined);
        }
        catch (_error) { }
        try {
            sock.ws && sock.ws.close && sock.ws.close();
        }
        catch (_error) { }
    }
    detachRuntimeState(id, control);
    retryCount.delete(id);
    removeCredentialArtifacts(id);
    removeSessionRecord(id);
};
exports.deleteSession = deleteSession;
const getAllSession = () => Array.from(sessions.keys());
exports.getAllSession = getAllSession;
const getSession = (key) => sessions.get(normalizeSessionId(key));
exports.getSession = getSession;
const getSessionInfo = (sessionId) => {
    const record = getStoredSessionRecord(sessionId);
    return buildSessionInfo(record);
};
exports.getSessionInfo = getSessionInfo;
const getSessionStatus = (sessionId) => {
    var _a;
    return (_a = (0, exports.getSessionInfo)(sessionId)) === null || _a === void 0 ? void 0 : _a.status;
};
exports.getSessionStatus = getSessionStatus;
const getAllManagedSessions = () => {
    ensureRegistryLoaded();
    const ids = new Set([...sessionRegistry.keys(), ...(0, session_paths_1.listStoredSessionIds)(), ...sessions.keys()]);
    const deduped = new Map();
    for (const sessionId of Array.from(ids)) {
        const sessionInfo = (0, exports.getSessionInfo)(sessionId);
        if (!sessionInfo || !sessionInfo.id) {
            continue;
        }
        deduped.set(sessionInfo.id, sessionInfo);
    }
    return Array.from(deduped.values())
        .sort((left, right) => String(left.id || "").localeCompare(String(right.id || "")));
};
exports.getAllManagedSessions = getAllManagedSessions;
const getAllSessionData = () => {
    const result = {};
    for (const sessionId of (0, exports.getAllSession)()) {
        result[sessionId] = (0, exports.getSession)(sessionId);
    }
    return result;
};
exports.getAllSessionData = getAllSessionData;
async function loadSessionsFromStorage() {
    ensureRegistryLoaded();
    const startedSessions = [];
    for (const sessionInfo of (0, exports.getAllManagedSessions)()) {
        if (!sessionInfo) {
            continue;
        }
        if (sessionInfo.autoStart === false) {
            continue;
        }
        if (sessionInfo.desiredState !== SESSION_STATUS.RUNNING) {
            continue;
        }
        if (sessions.has(sessionInfo.id)) {
            startedSessions.push(sessionInfo.id);
            continue;
        }
        try {
            await (0, exports.resumeSession)(sessionInfo.id, { printQR: sessionInfo.hasCredentials ? false : sessionInfo.printQR });
            startedSessions.push(sessionInfo.id);
        }
        catch (error) {
            updateLifecycleRecord(sessionInfo.id, {
                status: SESSION_STATUS.ERROR,
                lastError: formatShortError(error)
            });
        }
    }
    return startedSessions;
}
exports.loadSessionsFromStorage = loadSessionsFromStorage;
const onMessageReceived = (listener) => {
    registerCallbackListener(Defaults_1.CALLBACK_KEY.ON_MESSAGE_RECEIVED, listener);
};
exports.onMessageReceived = onMessageReceived;
const onQRUpdated = (listener) => {
    registerCallbackListener(Defaults_1.CALLBACK_KEY.ON_QR, listener);
};
exports.onQRUpdated = onQRUpdated;
const onConnected = (listener) => {
    registerCallbackListener(Defaults_1.CALLBACK_KEY.ON_CONNECTED, listener);
};
exports.onConnected = onConnected;
const onDisconnected = (listener) => {
    registerCallbackListener(Defaults_1.CALLBACK_KEY.ON_DISCONNECTED, listener);
};
exports.onDisconnected = onDisconnected;
const onConnecting = (listener) => {
    registerCallbackListener(Defaults_1.CALLBACK_KEY.ON_CONNECTING, listener);
};
exports.onConnecting = onConnecting;
const onMessageUpdate = (listener) => {
    registerCallbackListener(Defaults_1.CALLBACK_KEY.ON_MESSAGE_UPDATED, listener);
};
exports.onMessageUpdate = onMessageUpdate;
const onPairingCode = (listener) => {
    registerCallbackListener(Defaults_1.CALLBACK_KEY.ON_PAIRING_CODE, listener);
};
exports.onPairingCode = onPairingCode;
