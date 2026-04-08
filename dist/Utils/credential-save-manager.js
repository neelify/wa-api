"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCredentialSaveManager = void 0;
const noop = () => { };
const normalizeLogger = (logger = console) => ({
    info: typeof (logger === null || logger === void 0 ? void 0 : logger.info) === "function" ? logger.info.bind(logger) : noop,
    warn: typeof (logger === null || logger === void 0 ? void 0 : logger.warn) === "function" ? logger.warn.bind(logger) : noop,
    error: typeof (logger === null || logger === void 0 ? void 0 : logger.error) === "function" ? logger.error.bind(logger) : noop,
});
const createCredentialSaveManager = (saveCreds, options = {}) => {
    if (typeof saveCreds !== "function") {
        throw new TypeError("saveCreds must be a function");
    }
    const logger = normalizeLogger(options.logger);
    const label = String(options.label || "wa-api");
    const debounceMs = Math.max(0, Number(options.debounceMs !== null && options.debounceMs !== void 0 ? options.debounceMs : 300));
    const maxDelayMs = Math.max(debounceMs, Number(options.maxDelayMs !== null && options.maxDelayMs !== void 0 ? options.maxDelayMs : 1500));
    let timer = null;
    let pending = false;
    let firstQueuedAt = 0;
    let queuedUpdates = 0;
    let pendingWaiters = [];
    let chain = Promise.resolve();
    const settleWaiters = (waiters, result) => {
        for (const waiter of waiters) {
            try {
                waiter.resolve(result);
            }
            catch (_a) { }
        }
    };
    const flushNow = (reason = "manual-flush") => {
        if (!pending) {
            return chain;
        }
        pending = false;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        const waiters = pendingWaiters;
        pendingWaiters = [];
        const coalescedUpdates = queuedUpdates;
        const queuedForMs = firstQueuedAt ? Date.now() - firstQueuedAt : 0;
        queuedUpdates = 0;
        firstQueuedAt = 0;
        chain = chain.then(async () => {
            try {
                await saveCreds();
                if (coalescedUpdates > 1 || reason !== "creds.update") {
                    logger.info(`[session-save:${label}] ${coalescedUpdates} Update(s) gebündelt, ${queuedForMs}ms Wartedauer, Grund: ${reason}`);
                }
                settleWaiters(waiters, { ok: true, updates: coalescedUpdates, queuedForMs });
            }
            catch (error) {
                logger.error(`[session-save:${label}] Speichern fehlgeschlagen`, error);
                settleWaiters(waiters, { ok: false, error, updates: coalescedUpdates, queuedForMs });
            }
        });
        return chain;
    };
    const schedule = (reason = "creds.update") => {
        pending = true;
        queuedUpdates += 1;
        if (!firstQueuedAt) {
            firstQueuedAt = Date.now();
        }
        const elapsedMs = Date.now() - firstQueuedAt;
        const waitMs = elapsedMs >= maxDelayMs ? 0 : debounceMs;
        if (timer) {
            clearTimeout(timer);
        }
        return new Promise((resolve) => {
            pendingWaiters.push({ resolve });
            timer = setTimeout(() => {
                timer = null;
                flushNow(reason);
            }, waitMs);
        });
    };
    const handler = () => schedule("creds.update");
    handler.flush = (reason = "manual-flush") => flushNow(reason);
    handler.pending = () => pending || Boolean(timer);
    return handler;
};
exports.createCredentialSaveManager = createCredentialSaveManager;
