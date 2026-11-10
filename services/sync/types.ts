export type SyncState = 'idle' | 'syncing' | 'offline' | 'error' | 'disabled';

export interface SyncStatus {
    state: SyncState;
    lastSyncedAt: number | null;
}

/** What the server already has for one book, used to decide what still needs sending. */
export interface BookSyncState {
    onServer?: boolean;
    detailsSyncedAt?: number;
    progressSyncedAt?: number;
    fileUploaded?: boolean;
    uploadedCoverUri?: string;
}

export type BookSyncStates = Record<string, BookSyncState>;

export interface BookPushPlan {
    create: boolean;
    updateDetails: boolean;
    uploadFile: boolean;
    uploadCover: boolean;
}
