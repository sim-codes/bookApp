import { ApiError } from './apiError';
import { authEvents } from './authEvents';
import { apiConfig, isApiConfigured } from './config';
import { tokenStore } from './tokenStore';
import { AuthTokens } from './types';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
    body?: unknown;
    /** Send the access token; true unless the endpoint is public. */
    auth?: boolean;
    idempotencyKey?: string;
    timeoutMs?: number;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Calls the API and returns the parsed JSON body. Expired access tokens are refreshed once and the
 * request retried; failures throw an ApiError carrying the server's error code.
 */
export async function apiRequest<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
    if (!isApiConfigured()) {
        throw new ApiError(0, 'No server is configured.', 'not_configured');
    }

    const auth = options.auth ?? true;
    if (auth && !tokenStore.getAccessToken() && !(await refreshSession())) {
        throw new ApiError(401, 'Sign in to continue.', 'auth.signed_out');
    }

    let response = await send(method, path, options, auth);
    if (response.status === 401 && auth && (await refreshSession())) {
        response = await send(method, path, options, auth);
    }

    if (!response.ok) {
        throw await ApiError.fromResponse(response);
    }

    const text = response.status === 204 ? '' : await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Swaps the stored refresh token for new tokens. Concurrent callers share one refresh, because the
 * server revokes a refresh token on use and a second attempt with it would end the session.
 */
export function refreshSession(): Promise<boolean> {
    refreshInFlight ??= (async () => {
        const session = await tokenStore.getSession();
        if (!session) {
            return false;
        }

        const response = await send('POST', '/auth/refresh', { body: { refreshToken: session.refreshToken } }, false);
        if (response.ok) {
            await tokenStore.save((await response.json()) as AuthTokens);
            return true;
        }

        // Only a definite rejection ends the session; being offline must not sign the user out.
        if (response.status === 400 || response.status === 401) {
            await tokenStore.clear();
            authEvents.emitSignedOut();
        }
        return false;
    })().finally(() => {
        refreshInFlight = null;
    });

    return refreshInFlight;
}

async function send(method: Method, path: string, options: RequestOptions, withAuth: boolean): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    if (withAuth) {
        const token = tokenStore.getAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? apiConfig.timeoutMs);
    try {
        return await fetch(`${apiConfig.baseUrl}${path}`, {
            method,
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
            signal: controller.signal,
        });
    } catch (error) {
        throw ApiError.network(error);
    } finally {
        clearTimeout(timeout);
    }
}
