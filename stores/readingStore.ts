import { booksStorage, sessionsStorage, statsStorage } from '@/services';
import { syncEngine } from '@/services/sync';
import { ReadingSession, ReadingStats } from '@/types';
import { getTodayDate, getTotalHours, newId, shiftDate } from '@/utils';
import { create } from 'zustand';

// Sessions shorter than this are treated as an accidental open/close and ignored.
const MIN_SESSION_MS = 10_000;

interface ReadingStore {
    stats: ReadingStats;
    currentSession: ReadingSession | null;
    loading: boolean;

    // Actions
    loadStats: () => Promise<void>;
    startSession: (bookId: string, pageStart: number) => void;
    endSession: (pageEnd: number) => Promise<void>;
    saveStats: (stats: ReadingStats) => Promise<void>;
    calculateStats: () => Promise<ReadingStats>;
}

export const useReadingStore = create<ReadingStore>((set, get) => ({
    stats: {
        totalHours: 0,
        booksRead: 0,
        booksStarted: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null,
    },
    currentSession: null,
    loading: false,

    loadStats: async () => {
        set({ loading: true });
        try {
            // Recompute rather than trusting the stored value: the streak depends on
            // today's date, so a stored number goes stale as soon as a day is missed.
            const stats = await get().calculateStats();
            await statsStorage.save(stats);
            set({ stats });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            set({ loading: false });
        }
    },

    startSession: (bookId, pageStart) => {
        const session: ReadingSession = {
            id: newId(),
            bookId,
            startTime: Date.now(),
            duration: 0,
            pageStart,
            pageEnd: pageStart,
            date: getTodayDate(),
        };
        set({ currentSession: session });
    },

    endSession: async (pageEnd) => {
        const session = get().currentSession;
        if (!session) return;

        const endTime = Date.now();
        const elapsedMs = endTime - session.startTime;
        // Minutes with one decimal, so short real sessions still count toward the streak.
        const duration = Math.round(elapsedMs / 6000) / 10;

        if (elapsedMs >= MIN_SESSION_MS) {
            const completedSession: ReadingSession = {
                ...session,
                endTime,
                duration,
                pageEnd,
            };

            try {
                await sessionsStorage.save(completedSession);

                // Update stats
                const stats = await get().calculateStats();
                await statsStorage.save(stats);

                set({ stats, currentSession: null });
                syncEngine.schedule();
            } catch (error) {
                console.error('Error ending session:', error);
                throw error;
            }
        } else {
            set({ currentSession: null });
        }
    },

    saveStats: async (stats) => {
        try {
            await statsStorage.save(stats);
            set({ stats });
        } catch (error) {
            console.error('Error saving stats:', error);
            throw error;
        }
    },

    calculateStats: async () => {
        try {
            const sessions = await sessionsStorage.getAll();

            let totalMinutes = 0;
            const readDates = new Set<string>();

            Object.entries(sessions).forEach(([date, daySessions]) => {
                daySessions.forEach((session) => {
                    totalMinutes += session.duration;
                });
                if (daySessions.length > 0) {
                    readDates.add(date);
                }
            });

            const sortedDates = Array.from(readDates).sort().reverse();
            const today = getTodayDate();

            // Current streak: consecutive days ending today, or ending yesterday
            // (the streak is still alive until the day is missed).
            let currentStreak = 0;
            const yesterday = shiftDate(today, -1);
            if (sortedDates.length > 0 && (sortedDates[0] === today || sortedDates[0] === yesterday)) {
                let expected = sortedDates[0];
                for (const date of sortedDates) {
                    if (date !== expected) break;
                    currentStreak++;
                    expected = shiftDate(expected, -1);
                }
            }

            // Find longest streak
            let longestStreak = 0;
            let tempStreak = 0;

            for (let i = 0; i < sortedDates.length; i++) {
                if (i === 0) {
                    tempStreak = 1;
                } else {
                    const previousExpected = shiftDate(sortedDates[i - 1], -1);

                    if (sortedDates[i] === previousExpected) {
                        tempStreak++;
                    } else {
                        longestStreak = Math.max(longestStreak, tempStreak);
                        tempStreak = 1;
                    }
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak);

            const totalHours = getTotalHours(totalMinutes);
            const lastReadDate = sortedDates.length > 0 ? sortedDates[0] : null;

            const books = Object.values(await booksStorage.getAll());
            const booksRead = books.filter(b => b.status === 'completed').length;
            const booksStarted = books.filter(
                b => b.status === 'completed' || (b.currentPage ?? 0) > 0,
            ).length;

            const stats: ReadingStats = {
                totalHours,
                booksRead,
                booksStarted,
                currentStreak,
                longestStreak: Math.max(longestStreak, currentStreak),
                lastReadDate,
            };

            return stats;
        } catch (error) {
            console.error('Error calculating stats:', error);
            return get().stats;
        }
    },
}));
