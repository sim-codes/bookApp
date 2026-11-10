import { ApiBook, ApiError, booksApi, CreateBookRequest, UpdateBookRequest } from '@/services/api';
import { Book, LocalLibrary } from '@/types';
import { bookFiles } from '../bookFiles';
import { booksStorage } from '../localStorage';
import { BookSyncState, BookSyncStates, syncStorage } from './syncStorage';

export interface BookPushPlan {
    create: boolean;
    updateDetails: boolean;
    uploadFile: boolean;
    uploadCover: boolean;
}

/** Works out what the server is missing for one book, from local change times and what was last sent. */
export function planBookPush(book: Book, state: BookSyncState = {}): BookPushPlan {
    const onServer = !!state.onServer;
    return {
        create: !onServer,
        updateDetails: onServer && (book.detailsUpdatedAt ?? 0) > (state.detailsSyncedAt ?? 0),
        uploadFile: !state.fileUploaded && bookFiles.isPersisted(book.fileUri),
        uploadCover: bookFiles.isPersisted(book.coverUri) && state.uploadedCoverUri !== book.coverUri,
    };
}

export function toCreateRequest(book: Book): CreateBookRequest {
    return {
        id: book.id,
        ...toUpdateRequest(book),
        title: book.title.trim() || 'Untitled',
        author: book.author.trim() || 'Unknown Author',
        fileName: book.fileName,
        isPublic: !!book.isPublic,
        isShareable: !!book.isPublic && !!book.isShareable,
    };
}

function toUpdateRequest(book: Book): Required<Omit<UpdateBookRequest, 'genre'>> & { genre?: string } {
    return {
        title: book.title.trim() || 'Untitled',
        author: book.author.trim() || 'Unknown Author',
        genre: book.genre || undefined,
        isPublic: !!book.isPublic,
        isShareable: !!book.isPublic && !!book.isShareable,
    };
}

/** Creates or updates the book on the server and uploads its file and cover if they have not been sent. */
export async function pushBook(book: Book, state: BookSyncState | undefined): Promise<void> {
    const plan = planBookPush(book, state);
    const detailsAt = book.detailsUpdatedAt ?? book.createdAt ?? Date.now();

    if (plan.create) {
        await booksApi.create(toCreateRequest(book));
        await syncStorage.updateBookState(book.id, { onServer: true, detailsSyncedAt: detailsAt });
    } else if (plan.updateDetails) {
        await booksApi.update(book.id, toUpdateRequest(book));
        await syncStorage.updateBookState(book.id, { detailsSyncedAt: detailsAt });
    }

    if (!plan.uploadFile && !plan.uploadCover) {
        return;
    }

    const urls = await booksApi.uploadUrls(book.id, { file: plan.uploadFile, cover: plan.uploadCover });
    if (plan.uploadFile && urls.fileUploadUrl) {
        await bookFiles.upload(urls.fileUploadUrl, book.fileUri);
        await syncStorage.updateBookState(book.id, { fileUploaded: true });
    }
    if (plan.uploadCover && urls.coverUploadUrl && book.coverUri) {
        await bookFiles.upload(urls.coverUploadUrl, book.coverUri);
        await syncStorage.updateBookState(book.id, { uploadedCoverUri: book.coverUri });
    }
}

/** Sends deletions made on this device; a book the server no longer has counts as done. */
export async function pushDeletes(): Promise<void> {
    for (const bookId of await syncStorage.getPendingDeletes()) {
        try {
            await booksApi.remove(bookId);
        } catch (error) {
            if (!(error instanceof ApiError && error.status === 404)) throw error;
        }
        await syncStorage.removePendingDelete(bookId);
        await syncStorage.removeBookState(bookId);
    }
}

/**
 * Brings down books added on another device and detail edits made elsewhere. Returns true when the
 * local library changed. Books are never removed here, so a partial listing cannot delete anything.
 */
export async function pullBooks(local: LocalLibrary, states: BookSyncStates): Promise<boolean> {
    const pendingDeletes = new Set(await syncStorage.getPendingDeletes());
    let changed = false;
    let cursor: string | null = null;

    do {
        const page = await booksApi.listMine(cursor);
        for (const remote of page.items) {
            if (pendingDeletes.has(remote.id)) continue;
            const existing = local[remote.id];
            const updated = existing
                ? await applyRemoteDetails(existing, remote, states[remote.id])
                : await importBook(remote);
            changed ||= updated;
        }
        cursor = page.nextCursor;
    } while (cursor);

    return changed;
}

async function importBook(remote: ApiBook): Promise<boolean> {
    if (!remote.hasFile) {
        return false;
    }

    const { url } = await booksApi.downloadUrl(remote.id);
    const fileUri = await bookFiles.downloadBook(url, remote.id, remote.fileName ?? undefined);
    const coverUri = remote.coverUrl
        ? await bookFiles.downloadCover(remote.coverUrl, remote.id).catch(() => undefined)
        : undefined;
    const updatedAt = Date.parse(remote.updatedAt);

    await booksStorage.save({
        id: remote.id,
        title: remote.title,
        author: remote.author,
        genre: remote.genre ?? undefined,
        fileName: remote.fileName ?? undefined,
        fileUri,
        coverUri,
        currentPage: 0,
        status: 'reading',
        isPublic: remote.isPublic,
        isShareable: remote.isShareable,
        addedDate: remote.createdAt.slice(0, 10),
        createdAt: Date.parse(remote.createdAt),
        updatedAt,
        detailsUpdatedAt: updatedAt,
    });
    await syncStorage.updateBookState(remote.id, {
        onServer: true,
        detailsSyncedAt: updatedAt,
        fileUploaded: true,
        uploadedCoverUri: coverUri,
    });
    return true;
}

async function applyRemoteDetails(local: Book, remote: ApiBook, state: BookSyncState | undefined): Promise<boolean> {
    const remoteAt = Date.parse(remote.updatedAt);
    const syncedAt = state?.detailsSyncedAt ?? 0;
    const editedHere = (local.detailsUpdatedAt ?? 0) > syncedAt;
    const differs =
        local.title !== remote.title ||
        local.author !== remote.author ||
        (local.genre ?? null) !== remote.genre ||
        !!local.isPublic !== remote.isPublic ||
        !!local.isShareable !== remote.isShareable;

    if (!state?.onServer) {
        await syncStorage.updateBookState(local.id, { onServer: true, fileUploaded: remote.hasFile });
    }

    // Unsent local edits win; they go up on the next push.
    if (editedHere || !differs || remoteAt <= syncedAt) {
        return false;
    }

    await booksStorage.update(local.id, {
        title: remote.title,
        author: remote.author,
        genre: remote.genre ?? undefined,
        isPublic: remote.isPublic,
        isShareable: remote.isShareable,
        detailsUpdatedAt: remoteAt,
    });
    await syncStorage.updateBookState(local.id, { detailsSyncedAt: remoteAt });
    return true;
}
