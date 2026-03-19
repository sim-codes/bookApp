import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, BookProgress, LocalLibrary } from '../types/book';
import { DailySessions, ReadingSession, ReadingStats } from '../types/reading';

const KEYS = {
    BOOKS: '@bookapp/books',
    BOOK_PROGRESS: '@bookapp/progress',
    READING_SESSIONS: '@bookapp/sessions',
    USER_ID: '@bookapp/userid',
    READING_STATS: '@bookapp/stats',
};

// ============ BOOKS ============
export const booksStorage = {
    async getAll(): Promise<LocalLibrary> {
        try {
            const data = await AsyncStorage.getItem(KEYS.BOOKS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting books:', error);
            return {};
        }
    },

    async get(bookId: string): Promise<Book | null> {
        try {
            const books = await this.getAll();
            return books[bookId] || null;
        } catch (error) {
            console.error('Error getting book:', error);
            return null;
        }
    },

    async save(book: Book): Promise<void> {
        try {
            const books = await this.getAll();
            books[book.id] = book;
            await AsyncStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
        } catch (error) {
            console.error('Error saving book:', error);
            throw error;
        }
    },

    async delete(bookId: string): Promise<void> {
        try {
            const books = await this.getAll();
            delete books[bookId];
            await AsyncStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
        } catch (error) {
            console.error('Error deleting book:', error);
            throw error;
        }
    },

    async clear(): Promise<void> {
        try {
            await AsyncStorage.removeItem(KEYS.BOOKS);
        } catch (error) {
            console.error('Error clearing books:', error);
            throw error;
        }
    },
};

// ============ READING PROGRESS ============
export const progressStorage = {
    async getAll(): Promise<{ [bookId: string]: BookProgress }> {
        try {
            const data = await AsyncStorage.getItem(KEYS.BOOK_PROGRESS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting progress:', error);
            return {};
        }
    },

    async get(bookId: string): Promise<BookProgress | null> {
        try {
            const all = await this.getAll();
            return all[bookId] || null;
        } catch (error) {
            console.error('Error getting book progress:', error);
            return null;
        }
    },

    async save(bookId: string, progress: BookProgress): Promise<void> {
        try {
            const all = await this.getAll();
            all[bookId] = progress;
            await AsyncStorage.setItem(KEYS.BOOK_PROGRESS, JSON.stringify(all));
        } catch (error) {
            console.error('Error saving progress:', error);
            throw error;
        }
    },

    async delete(bookId: string): Promise<void> {
        try {
            const all = await this.getAll();
            delete all[bookId];
            await AsyncStorage.setItem(KEYS.BOOK_PROGRESS, JSON.stringify(all));
        } catch (error) {
            console.error('Error deleting progress:', error);
            throw error;
        }
    },
};

// ============ READING SESSIONS ============
export const sessionsStorage = {
    async getAll(): Promise<DailySessions> {
        try {
            const data = await AsyncStorage.getItem(KEYS.READING_SESSIONS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting sessions:', error);
            return {};
        }
    },

    async getByDate(date: string): Promise<ReadingSession[]> {
        try {
            const all = await this.getAll();
            return all[date] || [];
        } catch (error) {
            console.error('Error getting sessions by date:', error);
            return [];
        }
    },

    async save(session: ReadingSession): Promise<void> {
        try {
            const all = await this.getAll();
            const date = session.date;

            if (!all[date]) {
                all[date] = [];
            }

            all[date].push(session);
            await AsyncStorage.setItem(KEYS.READING_SESSIONS, JSON.stringify(all));
        } catch (error) {
            console.error('Error saving session:', error);
            throw error;
        }
    },

    async clear(): Promise<void> {
        try {
            await AsyncStorage.removeItem(KEYS.READING_SESSIONS);
        } catch (error) {
            console.error('Error clearing sessions:', error);
            throw error;
        }
    },
};

// ============ READING STATS ============
export const statsStorage = {
    async get(): Promise<ReadingStats> {
        try {
            const data = await AsyncStorage.getItem(KEYS.READING_STATS);
            return data
                ? JSON.parse(data)
                : {
                    totalHours: 0,
                    booksRead: 0,
                    booksStarted: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastReadDate: null,
                };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalHours: 0,
                booksRead: 0,
                booksStarted: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastReadDate: null,
            };
        }
    },

    async save(stats: ReadingStats): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.READING_STATS, JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving stats:', error);
            throw error;
        }
    },

    async clear(): Promise<void> {
        try {
            await AsyncStorage.removeItem(KEYS.READING_STATS);
        } catch (error) {
            console.error('Error clearing stats:', error);
            throw error;
        }
    },
};

// ============ USER ID ============
export const userStorage = {
    async getId(): Promise<string> {
        try {
            let userId = await AsyncStorage.getItem(KEYS.USER_ID);
            if (!userId) {
                userId = generateUserId();
                await AsyncStorage.setItem(KEYS.USER_ID, userId);
            }
            return userId;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return generateUserId();
        }
    },

    async clear(): Promise<void> {
        try {
            await AsyncStorage.removeItem(KEYS.USER_ID);
        } catch (error) {
            console.error('Error clearing user ID:', error);
            throw error;
        }
    },
};

function generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ UTILITY ============
export async function clearAllData(): Promise<void> {
    try {
        await Promise.all([
            booksStorage.clear(),
            progressStorage.delete,
            sessionsStorage.clear(),
            statsStorage.clear(),
        ]);
    } catch (error) {
        console.error('Error clearing all data:', error);
        throw error;
    }
}
