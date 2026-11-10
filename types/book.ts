export type ReadingStatus = 'reading' | 'completed' | 'paused';

export interface Book {
    id: string;         // UUID, shared with the server once the book is synced
    title: string;
    author: string;
    genre?: string;
    coverUri?: string;  // Local file URI or URL
    fileUri: string;    // Local file path to book content
    fileName?: string;  // Original file name
    totalPages?: number;
    currentPage?: number;
    epubLocator?: string;       // JSON stringified Locator for EPUB
    status?: ReadingStatus;
    isPublic?: boolean;         // Other readers can see it
    isShareable?: boolean;      // Other readers can add it to their library and download it; requires isPublic
    addedDate?: string; // YYYY-MM-DD format
    createdAt?: number;  // Timestamp
    updatedAt?: number;
    detailsUpdatedAt?: number;  // Last local change to title, author, genre, cover or sharing
    progressUpdatedAt?: number; // Last local change to page, locator or status
}

export interface BookProgress {
    bookId: string;
    currentPage: number;
    totalPages: number;
    lastReadAt: number;
}

export interface LocalLibrary {
    [bookId: string]: Book;
}
