import { ApiError, isApiConfigured, tokenStore } from '@/services/api';
import { booksStorage } from '../localStorage';
import { pullBooks, pushBook, pushDeletes } from './bookSync';
import { pullProgress, pushProgress, pushSessions } from './readingSync';
import { syncStorage } from './syncStorage';
import { SyncStatus } from './types';

const DEFAULT_DELAY_MS = 2_000;

let status: SyncStatus = { state: 'idle', lastSyncedAt: null };
let running: Promise<void> | null = null;
let runAgain = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const statusListeners = new Set<(status: SyncStatus) => void>();
const changeListeners = new Set<() => void>();

function setStatus(next: Partial<SyncStatus>): void {
    status = { ...status, ...next };
    statusListeners.forEach(listener => listener(status));
}

/**
 * Keeps this device's library and the server in step. Local changes go up first, then changes from
 * other devices come down. Every step is safe to repeat, so a run cut short by going offline simply
 * continues next time.
 */
export const syncEngine = {
    getStatus: (): SyncStatus => status,

    onStatusChange(listener: (status: SyncStatus) => void): () => void {
        statusListeners.add(listener);
        return () => statusListeners.delete(listener);
    },

    /** Called after a sync brought down changes, so screens can reload from storage. */
    onDataChanged(listener: () => void): () => void {
        changeListeners.add(listener);
        return () => changeListeners.delete(listener);
    },

    /** Runs a sync shortly; repeated calls during a burst of edits collapse into one run. */
    schedule(delayMs = DEFAULT_DELAY_MS): void {
        clearTimeout(timer);
        timer = setTimeout(() => void syncEngine.run(), delayMs);
    },

    run(): Promise<void> {
        if (running) {
            runAgain = true;
            return running;
        }
        running = runOnce().finally(() => {
            running = null;
            if (runAgain) {
                runAgain = false;
                syncEngine.schedule(0);
            }
        });
        return running;
    },

    /** Remembers to delete a book from the server if it was ever sent there. */
    async recordDeletion(bookId: string): Promise<void> {
        const state = (await syncStorage.getBookStates())[bookId];
        if (state?.onServer) {
            await syncStorage.addPendingDelete(bookId);
        } else {
            await syncStorage.removeBookState(bookId);
        }
    },

    /** Starts sync bookkeeping over when a different account signs in on this device. */
    async useAccount(userId: string): Promise<void> {
        if ((await syncStorage.getAccount()) !== userId) {
            await syncStorage.clear();
            await syncStorage.setAccount(userId);
        }
    },

    reset: () => syncStorage.clear(),
};

// A book the server refuses outright must not hold up the rest; being offline still stops the run.
async function skipIfRejected<T>(bookId: string, step: () => Promise<T>): Promise<T | undefined> {
    try {
        return await step();
    } catch (error) {
        if (error instanceof ApiError && !error.isRetryable && error.status !== 401) {
            console.warn(`Sync skipped book ${bookId}:`, error.code ?? error.message);
            return undefined;
        }
        throw error;
    }
}

async function runOnce(): Promise<void> {
    if (!isApiConfigured() || !(await tokenStore.getSession())) {
        setStatus({ state: 'disabled' });
        return;
    }

    setStatus({ state: 'syncing', lastSyncedAt: status.lastSyncedAt ?? (await syncStorage.getLastSyncedAt()) });
    try {
        await pushDeletes();

        let library = await booksStorage.getAll();
        let states = await syncStorage.getBookStates();
        let changed = false;
        for (const book of Object.values(library)) {
            await skipIfRejected(book.id, () => pushBook(book, states[book.id]));
        }

        states = await syncStorage.getBookStates();
        for (const book of Object.values(library)) {
            changed = (await skipIfRejected(book.id, () => pushProgress(book, states[book.id]))) || changed;
        }
        await pushSessions(library, states);

        changed = (await pullBooks(library, states)) || changed;
        library = await booksStorage.getAll();
        changed = (await pullProgress(library)) || changed;

        const now = Date.now();
        await syncStorage.setLastSyncedAt(now);
        setStatus({ state: 'idle', lastSyncedAt: now });
        if (changed) changeListeners.forEach(listener => listener());
    } catch (error) {
        const offline = !(error instanceof ApiError) || error.isNetwork;
        setStatus({ state: offline ? 'offline' : 'error' });
        if (!offline) console.warn('Sync failed:', error);
    }
}
