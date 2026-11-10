import { Book, ReadingSession } from '@/types';
import { planBookPush, toCreateRequest } from '../bookSync';
import { toProgressRequest, toSessionUpload } from '../readingSync';

const book: Book = {
    id: '6f1c2f0e-0000-4000-8000-000000000001',
    title: 'Dune',
    author: 'Frank Herbert',
    fileUri: 'file:///docs/books/6f1c2f0e.epub',
    coverUri: 'file:///docs/books/6f1c2f0e_cover_1.jpg',
    detailsUpdatedAt: 2_000,
    progressUpdatedAt: 3_000,
};

describe('planBookPush', () => {
    it('creates a new book and uploads its file and cover', () => {
        expect(planBookPush(book)).toEqual({ create: true, updateDetails: false, uploadFile: true, uploadCover: true });
    });

    it('sends nothing when the server is up to date', () => {
        const state = { onServer: true, detailsSyncedAt: 2_000, fileUploaded: true, uploadedCoverUri: book.coverUri };
        expect(planBookPush(book, state)).toEqual({ create: false, updateDetails: false, uploadFile: false, uploadCover: false });
    });

    it('updates details edited since the last send and uploads a replaced cover', () => {
        const state = { onServer: true, detailsSyncedAt: 1_000, fileUploaded: true, uploadedCoverUri: 'file:///docs/books/old.jpg' };
        expect(planBookPush(book, state)).toMatchObject({ updateDetails: true, uploadCover: true, uploadFile: false });
    });

    it('does not upload a cover the app did not store itself', () => {
        expect(planBookPush({ ...book, coverUri: 'https://example.com/cover.jpg' }).uploadCover).toBe(false);
    });
});

describe('toCreateRequest', () => {
    it('sends the local id and never marks a private book as shareable', () => {
        const request = toCreateRequest({ ...book, isPublic: false, isShareable: true });
        expect(request).toMatchObject({ id: book.id, isPublic: false, isShareable: false });
    });

    it('fills in a title and author the server requires', () => {
        expect(toCreateRequest({ ...book, title: '  ', author: '' })).toMatchObject({ title: 'Untitled', author: 'Unknown Author' });
    });
});

describe('reading payloads', () => {
    it('sends progress with the device change time and a default status', () => {
        expect(toProgressRequest({ ...book, currentPage: 12.6, totalPages: 300 })).toEqual({
            status: 'reading',
            currentPage: 13,
            totalPages: 300,
            epubLocator: undefined,
            updatedAt: new Date(3_000).toISOString(),
        });
    });

    it('rounds session minutes and pages to the whole numbers the server stores', () => {
        const session: ReadingSession = {
            id: '6f1c2f0e-0000-4000-8000-0000000000aa',
            bookId: book.id,
            startTime: Date.UTC(2026, 10, 10, 8, 0),
            endTime: Date.UTC(2026, 10, 10, 8, 12),
            duration: 12.4,
            pageStart: 3,
            pageEnd: 9.7,
            date: '2026-11-10',
        };

        expect(toSessionUpload(session)).toEqual({
            id: session.id,
            bookId: book.id,
            startedAt: '2026-11-10T08:00:00.000Z',
            endedAt: '2026-11-10T08:12:00.000Z',
            durationMinutes: 12,
            pageStart: 3,
            pageEnd: 10,
            date: '2026-11-10',
        });
    });
});
