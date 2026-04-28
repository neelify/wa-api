"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCredentialFile = exports.resolveCredentialDirectory = exports.migrateLegacyCredentialDirectory = exports.listStoredSessionIds = exports.listCredentialDirectoryEntries = exports.isCredentialDirectoryEntry = exports.extractSessionIdFromCredentialEntry = exports.buildCredentialDirectoryName = exports.getCredentialRootDirectories = exports.getLegacyCredentialsDirs = exports.getCredentialSuffixes = exports.getLegacyCredentialSuffix = exports.getCredentialSuffix = exports.getCredentialsDir = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const Defaults_1 = require("../Defaults");
const DEFAULT_CREDENTIALS_DIR_NAME = "Neelegirly_Sessions";
const LEGACY_CREDENTIALS_DIR_NAMES = ["sessions_neelegirly", "wa_credentials"];
const PREVIOUS_NEELEGIRLY_CREDENTIAL_SUFFIX = "_credentials_neelegirly";
const normalizeDir = (dirPath = "") => {
    const raw = String(dirPath || "").trim();
    return raw ? (0, path_1.resolve)(raw) : "";
};
const getCredentialsDir = () => normalizeDir(String(Defaults_1.CREDENTIALS.DIR_NAME || DEFAULT_CREDENTIALS_DIR_NAME)) || (0, path_1.resolve)(DEFAULT_CREDENTIALS_DIR_NAME);
exports.getCredentialsDir = getCredentialsDir;
const getCredentialSuffix = () => String(Defaults_1.CREDENTIALS.SUFFIX || "_neelegirly");
exports.getCredentialSuffix = getCredentialSuffix;
const getLegacyCredentialSuffix = () => "_credentials";
exports.getLegacyCredentialSuffix = getLegacyCredentialSuffix;
const getCredentialSuffixes = () => Array.from(new Set([(0, exports.getCredentialSuffix)(), PREVIOUS_NEELEGIRLY_CREDENTIAL_SUFFIX, (0, exports.getLegacyCredentialSuffix)()]
    .map((value) => String(value || "").trim())
    .filter(Boolean)))
    .sort((left, right) => right.length - left.length);
exports.getCredentialSuffixes = getCredentialSuffixes;
const getLegacyCredentialsDirs = () => {
    const currentDir = (0, exports.getCredentialsDir)();
    return Array.from(new Set(LEGACY_CREDENTIALS_DIR_NAMES
        .map((dirPath) => normalizeDir(dirPath))
        .filter((dirPath) => dirPath && dirPath !== currentDir)));
};
exports.getLegacyCredentialsDirs = getLegacyCredentialsDirs;
const getCredentialRootDirectories = () => Array.from(new Set([(0, exports.getCredentialsDir)(), ...(0, exports.getLegacyCredentialsDirs)()].filter(Boolean)));
exports.getCredentialRootDirectories = getCredentialRootDirectories;
const buildCredentialDirectoryName = (sessionId, suffix = (0, exports.getCredentialSuffix)()) => `${String(sessionId || "").trim()}${suffix}`;
exports.buildCredentialDirectoryName = buildCredentialDirectoryName;
const buildCurrentCredentialDirectory = (sessionId) => (0, path_1.resolve)((0, exports.getCredentialsDir)(), (0, exports.buildCredentialDirectoryName)(sessionId, (0, exports.getCredentialSuffix)()));
const getCompatibilityCredentialDirectories = (sessionId) => {
    const normalizedId = String(sessionId || "").trim();
    if (!normalizedId) {
        return [];
    }
    const currentDir = buildCurrentCredentialDirectory(normalizedId);
    return Array.from(new Set((0, exports.getCredentialRootDirectories)()
        .flatMap((dirPath) => (0, exports.getCredentialSuffixes)().map((suffix) => (0, path_1.resolve)(dirPath, (0, exports.buildCredentialDirectoryName)(normalizedId, suffix))))
        .filter((candidate) => candidate !== currentDir)));
};
const extractSessionIdFromCredentialEntry = (entryName = "") => {
    const raw = String(entryName || "").trim();
    if (!raw)
        return "";
    let current = raw;
    let changed = true;
    while (current && changed) {
        changed = false;
        for (const suffix of (0, exports.getCredentialSuffixes)()) {
            if (current.endsWith(suffix)) {
                current = current.slice(0, -suffix.length);
                changed = true;
                break;
            }
        }
    }
    return current;
};
exports.extractSessionIdFromCredentialEntry = extractSessionIdFromCredentialEntry;
const isCredentialDirectoryEntry = (entryName = "") => {
    const raw = String(entryName || "").trim();
    if (!raw)
        return false;
    return (0, exports.getCredentialSuffixes)().some((suffix) => raw.endsWith(suffix));
};
exports.isCredentialDirectoryEntry = isCredentialDirectoryEntry;
const listCredentialDirectoryEntries = (dirPath = (0, exports.getCredentialsDir)()) => {
    const resolvedDirPath = normalizeDir(dirPath);
    if (!resolvedDirPath || !(0, fs_1.existsSync)(resolvedDirPath)) {
        return [];
    }
    return (0, fs_1.readdirSync)(resolvedDirPath)
        .filter((entryName) => (0, exports.isCredentialDirectoryEntry)(entryName))
        .filter((entryName) => {
        try {
            const resolvedEntry = (0, path_1.join)(resolvedDirPath, entryName);
            return (0, fs_1.lstatSync)(resolvedEntry).isDirectory() && (0, fs_1.readdirSync)(resolvedEntry).length > 0;
        }
        catch (_error) {
            return false;
        }
    });
};
exports.listCredentialDirectoryEntries = listCredentialDirectoryEntries;
const listStoredSessionIds = (dirPath) => {
    const rootDirectories = typeof dirPath === "undefined"
        ? (0, exports.getCredentialRootDirectories)()
        : Array.isArray(dirPath)
            ? dirPath
            : (dirPath ? [dirPath] : (0, exports.getCredentialRootDirectories)());
    return Array.from(new Set(rootDirectories
        .map((rootDir) => normalizeDir(rootDir))
        .filter(Boolean)
        .flatMap((rootDir) => (0, exports.listCredentialDirectoryEntries)(rootDir)
        .map((entryName) => (0, exports.extractSessionIdFromCredentialEntry)(entryName))
        .filter(Boolean))))
        .sort((left, right) => String(left || "").localeCompare(String(right || "")));
};
exports.listStoredSessionIds = listStoredSessionIds;
const copyDirectory = (fromDir, toDir) => {
    if (typeof fs_1.cpSync === "function") {
        (0, fs_1.cpSync)(fromDir, toDir, { recursive: true });
        return;
    }
    (0, fs_1.mkdirSync)(toDir, { recursive: true });
    for (const entryName of (0, fs_1.readdirSync)(fromDir)) {
        const sourcePath = (0, path_1.join)(fromDir, entryName);
        const targetPath = (0, path_1.join)(toDir, entryName);
        const stats = (0, fs_1.lstatSync)(sourcePath);
        if (stats.isDirectory()) {
            copyDirectory(sourcePath, targetPath);
            continue;
        }
        (0, fs_1.copyFileSync)(sourcePath, targetPath);
    }
};
const migrateLegacyCredentialDirectory = (sessionId, options = {}) => {
    const normalizedId = String(sessionId || "").trim();
    if (!normalizedId) {
        throw new Error("sessionId is required to resolve credentials");
    }
    const baseDir = (0, exports.getCredentialsDir)();
    const currentDir = buildCurrentCredentialDirectory(normalizedId);
    if ((0, fs_1.existsSync)(currentDir)) {
        return currentDir;
    }
    const existingLegacyDir = getCompatibilityCredentialDirectories(normalizedId)
        .find((candidate) => (0, fs_1.existsSync)(candidate));
    if (!existingLegacyDir) {
        return currentDir;
    }
    (0, fs_1.mkdirSync)(baseDir, { recursive: true });
    try {
        (0, fs_1.renameSync)(existingLegacyDir, currentDir);
        return currentDir;
    }
    catch (_error) {
        copyDirectory(existingLegacyDir, currentDir);
        if (options.keepLegacy !== true) {
            (0, fs_1.rmSync)(existingLegacyDir, { recursive: true, force: true });
        }
        return (0, fs_1.existsSync)(currentDir) ? currentDir : existingLegacyDir;
    }
};
exports.migrateLegacyCredentialDirectory = migrateLegacyCredentialDirectory;
const resolveCredentialDirectory = (sessionId, options = {}) => {
    const normalizedId = String(sessionId || "").trim();
    if (!normalizedId) {
        throw new Error("sessionId is required to resolve credentials");
    }
    const currentDir = buildCurrentCredentialDirectory(normalizedId);
    const existingLegacyDir = getCompatibilityCredentialDirectories(normalizedId)
        .find((candidate) => (0, fs_1.existsSync)(candidate));
    if (options.preferLegacy === true && existingLegacyDir) {
        return existingLegacyDir;
    }
    if ((0, fs_1.existsSync)(currentDir)) {
        return currentDir;
    }
    if (existingLegacyDir) {
        return options.migrateLegacy === false
            ? existingLegacyDir
            : (0, exports.migrateLegacyCredentialDirectory)(normalizedId, options);
    }
    if (options.create === true) {
        (0, fs_1.mkdirSync)(currentDir, { recursive: true });
    }
    return currentDir;
};
exports.resolveCredentialDirectory = resolveCredentialDirectory;
const resolveCredentialFile = (sessionId, fileName = "creds.json", options = {}) => (0, path_1.join)((0, exports.resolveCredentialDirectory)(sessionId, options), String(fileName || "creds.json"));
exports.resolveCredentialFile = resolveCredentialFile;
