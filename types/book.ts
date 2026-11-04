export interface Book {
    id: string;
    title: string;
    author: string;
    genre?: string;
    coverUri?: string;  // Local file URI or URL
    fileUri: string;    // Local file path to book content
    fileName?: string;  // Original file name
    totalPages?: number;
    currentPage?: number;
    epubLocator?: string;       // JSON stringified Locator for EPUB
    status?: 'reading' | 'completed' | 'paused';
    addedDate?: string; // YYYY-MM-DD format
    createdAt?: number;  // Timestamp
    updatedAt?: number;
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
