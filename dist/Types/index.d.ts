/// <reference types="node" />
import { WAMessageUpdate, proto } from "@neelegirly/baileys/lib";
export interface SendMessageTypes {
    to: string | number;
    text?: string;
    sessionId: string;
    isGroup?: boolean;
    answering?: proto.IWebMessageInfo;
}
export interface SendMediaTypes extends SendMessageTypes {
    media?: string | Buffer;
}
export interface SendTypingTypes extends SendMessageTypes {
    duration: number;
}
export interface SendReadTypes {
    sessionId: string;
    key: proto.IMessageKey;
}
export interface MessageReceived extends proto.IWebMessageInfo {
    /**
     * Your Session ID
     */
    sessionId: string;
    /**
     * @param path save image location path with extension
     * @example "./myimage.jpg"
     */
    saveImage: (path: string) => Promise<void>;
    /**
     * @param path save video location path with extension
     * @example "./myvideo.mp4"
     */
    saveVideo: (path: string) => Promise<void>;
    /**
     * @param path save image location path without extension
     * @example "./mydocument"
     */
    saveDocument: (path: string) => Promise<void>;
}
export interface StartSessionParams {
    /**
     * Print QR Code into Terminal
     */
    printQR?: boolean;
    /**
     * Preferred login flow.
     */
    method?: "qr" | "pairing" | "code";
    /**
     * Optional phone number for pairing-based boots.
     */
    phoneNumber?: string;
    /**
     * Optional forced pairing key.
     */
    pairingKey?: string;
    /**
     * Automatically boot this session again when loading from storage.
     */
    autoStart?: boolean;
    /**
     * Max reconnect attempts for transient disconnects.
     */
    retryLimit?: number;
    /**
     * Optional custom browser triple.
     */
    browser?: [string, string, string];
}
export type MessageUpdated = WAMessageUpdate & {
    sessionId: string;
    messageStatus: "error" | "pending" | "server" | "delivered" | "read" | "played";
};
export type SessionLifecycleStatus = "new" | "starting" | "connecting" | "running" | "paused" | "stopped" | "deleted" | "error";
export interface SessionInfo {
    id: string;
    status: SessionLifecycleStatus;
    desiredState: SessionLifecycleStatus;
    autoStart: boolean;
    printQR: boolean;
    hasCredentials: boolean;
    runtimeOnline: boolean;
    retryCount: number;
    method: "qr" | "pairing";
    credentialDirectory: string;
    credentialDirectoryName: string;
    phoneNumber: string | null;
    pm2Name: string;
    createdAt: number | null;
    updatedAt: number | null;
    lastStartedAt: number | null;
    lastConnectedAt: number | null;
    lastDisconnectedAt: number | null;
    lastPausedAt: number | null;
    lastStoppedAt: number | null;
    lastDeletedAt: number | null;
    lastPairingCodeAt: number | null;
    lastError: string | null;
    lastDisconnectCode: number | null;
}
export interface PackageUpdateInfo {
    packageName: string;
    current: string;
    latest: string;
    hasUpdate: boolean;
    source?: "npm" | "github";
}
export interface UpdateStatusSnapshot {
    checkedAt: number;
    waApi: PackageUpdateInfo | null;
    baileys: PackageUpdateInfo | null;
}
//# sourceMappingURL=index.d.ts.map