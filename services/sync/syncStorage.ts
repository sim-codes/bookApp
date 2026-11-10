import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    ACCOUNT: '@bookapp/sync/account',
    BOOKS: '@bookapp/sync/books',
    SYNCED_SESSIONS: '@bookapp/sync/sessions',
    PENDING_DELETES: '@bookapp/sync/deletes',
    READING_CURSOR: '@bookapp/sync/readingCursor',
    LAST_SYNCED_AT: '@bookapp/sync/lastSyncedAt',
};

/** What the server already has for one book, used to decide what still needs sending. */
export interface BookSyncState {
    onServer?: boolean;
    detailsSyncedAt?: number;
    progressSyncedAt?: number;
    fileUploaded?: boolean;
    uploadedCoverUri?: string;
}

export type BookSyncStates = Record<string, BookSyncState>;

// Same reason as the library storage: each write is a read-modify-write of one JSON value.
let writeChain: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = writeChain.then(task, task);
    writeChain = run.catch(() => undefined);
    return run;
}

async function read<T>(key: string, fallback: T): Promise<T> {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
}

function update<T>(key: string, fallback: T, change: (value: T) => T): Promise<T> {
    return serialize(async () => {
        const next = change(await read(key, fallback));
        await AsyncStorage.setItem(key, JSON.stringify(next));
        return next;
    });
}

/** Bookkeeping for sync, kept apart from the library so it can be reset without touching books. */
export const syncStorage = {
    getAccount: () => AsyncStorage.getItem(KEYS.ACCOUNT),
    setAccount: (userId: string) => AsyncStorage.setItem(KEYS.ACCOUNT, userId),

    getBookStates: () => read<BookSyncStates>(KEYS.BOOKS, {}),
    updateBookState: (bookId: string, change: Partial<BookSyncState>) =>
        update<BookSyncStates>(KEYS.BOOKS, {}, states => ({ ...states, [bookId]: { ...states[bookId], ...change } })),
    removeBookState: (bookId: string) =>
        update<BookSyncStates>(KEYS.BOOKS, {}, ({ [bookId]: _removed, ...rest }) => rest),

    getSyncedSessionIds: async () => new Set(await read<string[]>(KEYS.SYNCED_SESSIONS, [])),
    markSessionsSynced: (ids: string[]) =>
        update<string[]>(KEYS.SYNCED_SESSIONS, [], synced => Array.from(new Set([...synced, ...ids]))),

    getPendingDeletes: () => read<string[]>(KEYS.PENDING_DELETES, []),
    addPendingDelete: (bookId: string) =>
        update<string[]>(KEYS.PENDING_DELETES, [], ids => (ids.includes(bookId) ? ids : [...ids, bookId])),
    removePendingDelete: (bookId: string) =>
        update<string[]>(KEYS.PENDING_DELETES, [], ids => ids.filter(id => id !== bookId)),

    getReadingCursor: () => AsyncStorage.getItem(KEYS.READING_CURSOR),
    setReadingCursor: (cursor: string) => AsyncStorage.setItem(KEYS.READING_CURSOR, cursor),

    getLastSyncedAt: async () => Number(await AsyncStorage.getItem(KEYS.LAST_SYNCED_AT)) || null,
    setLastSyncedAt: (time: number) => AsyncStorage.setItem(KEYS.LAST_SYNCED_AT, String(time)),

    clear: () => AsyncStorage.multiRemove(Object.values(KEYS)),
};
