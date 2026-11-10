import { apiRequest } from './httpClient';
import { ApiReadingState, ReadingSessionUpload, ReadingSessionsResult, ReadingStateChanges, ReadingStateRequest } from './types';

export const readingApi = {
    /** The server keeps whichever update has the newest updatedAt and returns what it kept. */
    saveState: (bookId: string, state: ReadingStateRequest) =>
        apiRequest<ApiReadingState>('PUT', `/me/reading-state/${bookId}`, { body: state }),

    changesSince: (cursor?: string | null, limit = 50) =>
        apiRequest<ReadingStateChanges>('GET', `/me/reading-state?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),

    /** Safe to resend: sessions are keyed by their id. */
    uploadSessions: (sessions: ReadingSessionUpload[]) =>
        apiRequest<ReadingSessionsResult>('POST', '/me/reading-sessions', { body: { sessions } }),
};
