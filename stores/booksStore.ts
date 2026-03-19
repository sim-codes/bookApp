import { booksStorage, progressStorage } from '@/services';
import { Book, LocalLibrary } from '@/types';
import { generateId } from '@/utils';
import { create } from 'zustand';

interface BooksStore {
    books: LocalLibrary;
    selectedBookId: string | null;
    loading: boolean;

    // Actions
    loadBooks: () => Promise<void>;
    addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Book>;
    updateBook: (bookId: string, updates: Partial<Book>) => Promise<void>;
    deleteBook: (bookId: string) => Promise<void>;
    selectBook: (bookId: string) => void;
    deselectBook: () => void;
    getSelectedBook: () => Book | null;
}

export const useBooksStore = create<BooksStore>((set, get) => ({
    books: {},
    selectedBookId: null,
    loading: false,

    loadBooks: async () => {
        set({ loading: true });
        try {
            const books = await booksStorage.getAll();
            set({ books });
        } catch (error) {
            console.error('Error loading books:', error);
        } finally {
            set({ loading: false });
        }
    },

    addBook: async (bookData) => {
        const newBook: Book = {
            id: generateId(),
            ...bookData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        try {
            await booksStorage.save(newBook);
            set((state) => ({
                books: {
                    ...state.books,
                    [newBook.id]: newBook,
                },
            }));
            return newBook;
        } catch (error) {
            console.error('Error adding book:', error);
            throw error;
        }
    },

    deleteBook: async (bookId) => {
        try {
            await booksStorage.delete(bookId);
            await progressStorage.delete(bookId);
            set((state) => {
                const newBooks = { ...state.books };
                delete newBooks[bookId];
                return { books: newBooks };
            });
        } catch (error) {
            console.error('Error deleting book:', error);
            throw error;
        }
    },

    updateBook: async (bookId, updates) => {
        try {
            const existingBook = get().books[bookId];
            if (!existingBook) throw new Error('Book not found');

            const updatedBook: Book = {
                ...existingBook,
                ...updates,
                updatedAt: Date.now(),
            };

            await booksStorage.save(updatedBook);
            set((state) => ({
                books: {
                    ...state.books,
                    [bookId]: updatedBook,
                },
            }));
        } catch (error) {
            console.error('Error updating book:', error);
            throw error;
        }
    },

    selectBook: (bookId) => {
        set({ selectedBookId: bookId });
    },

    deselectBook: () => {
        set({ selectedBookId: null });
    },

    getSelectedBook: () => {
        const state = get();
        return state.selectedBookId ? state.books[state.selectedBookId] || null : null;
    },
}));
