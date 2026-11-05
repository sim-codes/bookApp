import type { Book } from '@/types';

const lastActivity = (book: Book): number => book.updatedAt ?? book.createdAt ?? 0;

/** Returns the books ordered by most recent activity first. */
export function sortBooksByActivity(books: Book[]): Book[] {
    return [...books].sort((a, b) => lastActivity(b) - lastActivity(a));
}

/** Returns reading progress as a percentage between 0 and 100. */
export function bookProgress(book: Book | undefined): number {
    if (!book?.totalPages || !book?.currentPage) return 0;
    return Math.min((book.currentPage / book.totalPages) * 100, 100);
}
