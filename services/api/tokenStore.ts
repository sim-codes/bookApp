import * as SecureStore from 'expo-secure-store';
import { ApiUser, AuthTokens } from './types';

const SESSION_KEY = 'spinematch.session';

// Refresh a little before expiry so a request never goes out with a token that dies in flight.
const EXPIRY_MARGIN_MS = 30_000;

export interface StoredSession {
    refreshToken: string;
    refreshTokenExpiresAt: string;
    user: ApiUser;
}

let accessToken: { value: string; expiresAt: number } | null = null;
let session: StoredSession | null | undefined;

/** Holds the access token in memory and the refresh token in the device's secure storage. */
export const tokenStore = {
    /** The current access token, or null when it is missing or about to expire. */
    getAccessToken(): string | null {
        return accessToken && accessToken.expiresAt - EXPIRY_MARGIN_MS > Date.now() ? accessToken.value : null;
    },

    async getSession(): Promise<StoredSession | null> {
        if (session === undefined) {
            const raw = await SecureStore.getItemAsync(SESSION_KEY);
            session = raw ? (JSON.parse(raw) as StoredSession) : null;
        }
        return session;
    },

    async save(tokens: AuthTokens): Promise<void> {
        accessToken = { value: tokens.accessToken, expiresAt: Date.parse(tokens.accessTokenExpiresAt) };
        session = { refreshToken: tokens.refreshToken, refreshTokenExpiresAt: tokens.refreshTokenExpiresAt, user: tokens.user };
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    },

    async clear(): Promise<void> {
        accessToken = null;
        session = null;
        await SecureStore.deleteItemAsync(SESSION_KEY);
    },
};
