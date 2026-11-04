export interface ReadingSession {
    id: string;
    bookId: string;
    startTime: number;     // Timestamp
    endTime?: number;      // Timestamp
    duration: number;      // In minutes
    pageStart: number;
    pageEnd: number;
    date: string;          // YYYY-MM-DD format for streaks
}

export interface DailySessions {
    [date: string]: ReadingSession[]; // YYYY-MM-DD: sessions
}

export interface ReadingStats {
    totalHours: number;
    booksRead: number;
    booksStarted: number;
    currentStreak: number;
    longestStreak: number;
    lastReadDate: string | null;
}
