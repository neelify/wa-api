export interface ResolveCredentialDirectoryOptions {
    create?: boolean;
    migrateLegacy?: boolean;
    preferLegacy?: boolean;
    keepLegacy?: boolean;
}
export declare const getCredentialsDir: () => string;
export declare const getCredentialSuffix: () => string;
export declare const getLegacyCredentialSuffix: () => string;
export declare const getCredentialSuffixes: () => string[];
export declare const getLegacyCredentialsDirs: () => string[];
export declare const getCredentialRootDirectories: () => string[];
export declare const buildCredentialDirectoryName: (sessionId: string, suffix?: string) => string;
export declare const extractSessionIdFromCredentialEntry: (entryName?: string) => string;
export declare const isCredentialDirectoryEntry: (entryName?: string) => boolean;
export declare const listCredentialDirectoryEntries: (dirPath?: string) => string[];
export declare const listStoredSessionIds: (dirPath?: string | string[]) => string[];
export declare const migrateLegacyCredentialDirectory: (sessionId: string, options?: ResolveCredentialDirectoryOptions) => string;
export declare const resolveCredentialDirectory: (sessionId: string, options?: ResolveCredentialDirectoryOptions) => string;
export declare const resolveCredentialFile: (sessionId: string, fileName?: string, options?: ResolveCredentialDirectoryOptions) => string;
