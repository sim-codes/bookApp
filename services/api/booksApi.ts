import { apiRequest } from './httpClient';
import { ApiBook, CreateBookRequest, CursorPage, DownloadUrl, UpdateBookRequest, UploadUrls } from './types';

export const booksApi = {
    /** Safe to retry: the app's own id is sent, and resending it returns the existing book. */
    create: (book: CreateBookRequest) => apiRequest<ApiBook>('POST', '/books', { body: book }),

    update: (bookId: string, changes: UpdateBookRequest) =>
        apiRequest<ApiBook>('PATCH', `/books/${bookId}`, { body: changes }),

    remove: (bookId: string) => apiRequest<void>('DELETE', `/books/${bookId}`),

    uploadUrls: (bookId: string, files: { file: boolean; cover: boolean }) =>
        apiRequest<UploadUrls>('POST', `/books/${bookId}/upload-urls`, { body: files }),

    downloadUrl: (bookId: string) => apiRequest<DownloadUrl>('GET', `/books/${bookId}/download-url`),

    listMine: (cursor?: string | null, limit = 50) =>
        apiRequest<CursorPage<ApiBook>>('GET', `/me/books?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
};
