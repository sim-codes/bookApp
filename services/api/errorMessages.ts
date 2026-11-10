import { ApiError } from './apiError';

// Server error codes the app explains in its own words; anything else falls back by status.
const MESSAGES: Record<string, string> = {
    'auth.invalid_code': 'That code is wrong or has expired. Check your email or ask for a new one.',
    'auth.too_many_codes': 'Too many codes requested. Wait a few minutes and try again.',
    'auth.invalid_refresh_token': 'Your session has ended. Please sign in again.',
};

/** A short message for a failed request that can be shown to the reader as is. */
export function errorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return 'Something went wrong. Please try again.';
    }
    if (error.code && MESSAGES[error.code]) {
        return MESSAGES[error.code];
    }
    if (error.isNetwork) {
        return "You're offline. Check your connection and try again.";
    }
    if (error.status === 400) {
        return 'Please check what you entered and try again.';
    }
    if (error.status === 429) {
        return 'Too many attempts. Wait a minute and try again.';
    }
    return 'Something went wrong on our side. Please try again.';
}
