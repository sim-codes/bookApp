import { ApiReadingState, readingApi, ReadingSessionUpload, ReadingStateRequest } from '@/services/api';
import { Book, LocalLibrary, ReadingSession } from '@/types';
import { booksStorage, sessionsStorage } from '../localStorage';
import { BookSyncState, BookSyncStates, syncStorage } from './syncStorage';

const SESSION_BATCH_SIZE = 100;
const MAX_SESSION_MINUTES = 24 * 60;

export function toProgressRequest(book: Book): ReadingStateRequest {
    return {
        status: book.status ?? 'reading',
        currentPage: Math.max(0, Math.round(book.currentPage ?? 0)),
        totalPages: book.totalPages ? Math.round(book.totalPages) : undefined,
        epubLocator: book.epubLocator,
        updatedAt: new Date(book.progressUpdatedAt ?? Date.now()).toISOString(),
    };
}

// The server stores whole minutes and pages; the device keeps tenths of a minute.
export function toSessionUpload(session: ReadingSession): ReadingSessionUpload {
    return {
        id: session.id,
        bookId: session.bookId,
        startedAt: new Date(session.startTime).toISOString(),
        endedAt: session.endTime ? new Date(session.endTime).toISOString() : undefined,
        durationMinutes: Math.min(MAX_SESSION_MINUTES, Math.max(0, Math.round(session.duration))),
        pageStart: Math.max(0, Math.round(session.pageStart)),
        pageEnd: Math.max(0, Math.round(session.pageEnd)),
        date: session.date,
    };
}

/** Sends this device's progress if it changed since the last send, and takes the server's if it is newer. */
export async function pushProgress(book: Book, state: BookSyncState | undefined): Promise<boolean> {
    if (!state?.onServer || (book.progressUpdatedAt ?? 0) <= (state.progressSyncedAt ?? 0)) {
        return false;
    }

    const kept = await readingApi.saveState(book.id, toProgressRequest(book));
    await syncStorage.updateBookState(book.id, { progressSyncedAt: book.progressUpdatedAt });
    return applyRemoteProgress(book, kept);
}

/** Uploads sessions the server has not seen, for books it already has. */
export async function pushSessions(local: LocalLibrary, states: BookSyncStates): Promise<void> {
    const synced = await syncStorage.getSyncedSessionIds();
    const pending = Object.values(await sessionsStorage.getAll()).flat().filter(s => !synced.has(s.id));

    // Sessions for books deleted from this device can never be accepted, so stop retrying them.
    const orphaned = pending.filter(s => !local[s.bookId]).map(s => s.id);
    if (orphaned.length > 0) {
        await syncStorage.markSessionsSynced(orphaned);
    }

    const ready = pending.filter(s => local[s.bookId] && states[s.bookId]?.onServer);
    for (let i = 0; i < ready.length; i += SESSION_BATCH_SIZE) {
        const batch = ready.slice(i, i + SESSION_BATCH_SIZE);
        await readingApi.uploadSessions(batch.map(toSessionUpload));
        await syncStorage.markSessionsSynced(batch.map(s => s.id));
    }
}

/** Applies progress saved on other devices since the last pull. Returns true when anything changed. */
export async function pullProgress(local: LocalLibrary): Promise<boolean> {
    let cursor = await syncStorage.getReadingCursor();
    let changed = false;

    for (;;) {
        const page = await readingApi.changesSince(cursor);
        for (const remote of page.items) {
            const book = local[remote.bookId];
            if (book && (await applyRemoteProgress(book, remote))) changed = true;
        }
        if (page.cursor) {
            cursor = page.cursor;
            await syncStorage.setReadingCursor(cursor);
        }
        if (!page.hasMore) return changed;
    }
}

async function applyRemoteProgress(book: Book, remote: ApiReadingState): Promise<boolean> {
    const remoteAt = Date.parse(remote.updatedAt);
    if (remoteAt <= (book.progressUpdatedAt ?? 0)) {
        return false;
    }

    await booksStorage.update(book.id, {
        status: remote.status,
        currentPage: remote.currentPage,
        totalPages: remote.totalPages ?? book.totalPages,
        epubLocator: remote.epubLocator ?? undefined,
        progressUpdatedAt: remoteAt,
    });
    await syncStorage.updateBookState(book.id, { progressSyncedAt: remoteAt });
    return true;
}
