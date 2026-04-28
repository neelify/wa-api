import { WASocket } from "@neelegirly/baileys/lib";
import type { MessageReceived, MessageUpdated, SessionInfo, StartSessionParams, UpdateStatusSnapshot } from "../Types";
export declare const checkForUpdates: (options?: {
    force?: boolean;
}) => Promise<UpdateStatusSnapshot>;
export declare const getUpdateStatus: () => UpdateStatusSnapshot | null;
export declare const startSession: (sessionId?: string, options?: StartSessionParams) => Promise<WASocket>;
/**
 * @deprecated Use startSession method instead
 */
export declare const startWhatsapp: (sessionId?: string, options?: StartSessionParams) => Promise<WASocket>;
export declare const startSessionWithPairingCode: (sessionId?: string, options?: StartSessionParams) => Promise<WASocket>;
export declare const pauseSession: (sessionId: string) => Promise<SessionInfo | null>;
export declare const stopSession: (sessionId: string) => Promise<SessionInfo | null>;
export declare const resumeSession: (sessionId: string, options?: StartSessionParams) => Promise<WASocket>;
export declare const deleteSession: (sessionId: string) => Promise<void>;
export declare const getAllSession: () => string[];
export declare const getSession: (key: string) => WASocket | undefined;
export declare const getSessionInfo: (sessionId: string) => SessionInfo | null;
export declare const getSessionStatus: (sessionId: string) => SessionInfo["status"] | undefined;
export declare const getAllManagedSessions: () => SessionInfo[];
export declare const getAllSessionData: () => Record<string, WASocket | undefined>;
export declare const loadSessionsFromStorage: () => Promise<string[]>;
export declare const onMessageReceived: (listener: (msg: MessageReceived) => any) => void;
export declare const onQRUpdated: (listener: ({ sessionId, qr }: {
    sessionId: string;
    qr: string;
}) => any) => void;
export declare const onConnected: (listener: (sessionId: string) => any) => void;
export declare const onDisconnected: (listener: (sessionId: string) => any) => void;
export declare const onConnecting: (listener: (sessionId: string) => any) => void;
export declare const onMessageUpdate: (listener: (sessionId: string, data: MessageUpdated) => any) => void;
export declare const onPairingCode: (listener: (sessionId: string, code: string) => any) => void;
