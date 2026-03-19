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
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
}

/**
 * Get date N days ago
 */
export function getDateNDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
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
        const dateStr = currentDate.toISOString().split('T')[0];

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
