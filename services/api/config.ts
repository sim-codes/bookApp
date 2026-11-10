// Set EXPO_PUBLIC_API_BASE_URL in .env to point the app at a server. In development it defaults to
// localhost (use `adb reverse tcp:5155 tcp:5155` on Android); in a release build without it the app runs offline only.
const DEV_DEFAULT_BASE_URL = 'http://localhost:5155';

export const apiConfig = {
    baseUrl: (process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? DEV_DEFAULT_BASE_URL : '')).replace(/\/+$/, ''),
    timeoutMs: 15_000,
};

/** True when a server address is configured; without one, everything stays on the device. */
export function isApiConfigured(): boolean {
    return apiConfig.baseUrl.length > 0;
}
