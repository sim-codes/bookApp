/**
 * Convert text to title case
 */
export function toTitleCase(text: string): string {
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format a Date as YYYY-MM-DD in the device's LOCAL time zone.
 * (toISOString() is UTC, which puts the day boundary at the wrong hour for
 * anyone not on UTC, e.g. 1am in Lagos.)
 */
export function formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Shift a YYYY-MM-DD string by a number of days (negative = earlier),
 * using local calendar arithmetic.
 */
export function shiftDate(dateString: string, days: number): string {
    const [y, m, d] = dateString.split('-').map(Number);
    return formatLocalDate(new Date(y, m - 1, d + days));
}

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
export function getTodayDate(): string {
    return formatLocalDate(new Date());
}

/**
 * Get yesterday's date in YYYY-MM-DD format (local time)
 */
export function getYesterdayDate(): string {
    return shiftDate(getTodayDate(), -1);
}

/**
 * Get date N days ago (local time)
 */
export function getDateNDaysAgo(days: number): string {
    return shiftDate(getTodayDate(), -days);
}

/**
 * Format date to readable format: "Thursday 19th, March 2026"
 */
export function formatDateReadable(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    // Get ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
    const ordinal = (n: number) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${dayName} ${ordinal(dayNum)}, ${monthName} ${year}`;
}

/**
 * Calculate hours and minutes from minutes
 */
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

/**
 * Format total minutes to total hours (decimal)
 */
export function getTotalHours(totalMinutes: number): number {
    return Math.round((totalMinutes / 60) * 10) / 10;
}

/**
 * Calculate reading streaks
 */
export function calculateStreak(lastReadDate: string | null, today: string): number {
    if (!lastReadDate) return 0;

    const last = new Date(lastReadDate);
    const todayDate = new Date(today);

    let streak = 1;
    let currentDate = new Date(todayDate);

    // Go backwards from today
    while (true) {
        currentDate.setDate(currentDate.getDate() - 1);
        const dateStr = formatLocalDate(currentDate);

        if (dateStr === lastReadDate) {
            // Check if there's a continuous chain
            lastReadDate = dateStr;
            streak++;
        } else {
            break;
        }
    }

    return streak;
}
