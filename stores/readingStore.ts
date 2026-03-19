import { sessionsStorage, statsStorage } from '@/services';
import { ReadingSession, ReadingStats } from '@/types';
import { generateId, getTodayDate, getTotalHours } from '@/utils';
import { create } from 'zustand';

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
            const stats = await statsStorage.get();
            set({ stats });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            set({ loading: false });
        }
    },

    startSession: (bookId, pageStart) => {
        const session: ReadingSession = {
            id: generateId(),
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
        const duration = Math.floor((endTime - session.startTime) / 60000); // Convert to minutes

        if (duration > 0) {
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

            // Calculate streak
            let currentStreak = 0;
            if (sortedDates.length === 0) {
                currentStreak = 0;
            } else if (sortedDates[0] === today) {
                // Started reading today
                for (let i = 0; i < sortedDates.length; i++) {
                    const expectedDate = new Date(today);
                    expectedDate.setDate(expectedDate.getDate() - i);
                    const expectedDateStr = expectedDate.toISOString().split('T')[0];

                    if (sortedDates[i] === expectedDateStr) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }

            // Find longest streak
            let longestStreak = 0;
            let tempStreak = 0;

            for (let i = 0; i < sortedDates.length; i++) {
                if (i === 0) {
                    tempStreak = 1;
                } else {
                    const currentDate = new Date(sortedDates[i - 1]);
                    currentDate.setDate(currentDate.getDate() - 1);
                    const previousExpected = currentDate.toISOString().split('T')[0];

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

            const stats: ReadingStats = {
                totalHours,
                booksRead: 0, // Will be calculated from completed books
                booksStarted: 0,
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
