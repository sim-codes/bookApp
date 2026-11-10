import { ApiError } from '../apiError';
import { authEvents } from '../authEvents';
import { apiRequest } from '../httpClient';
import { tokenStore } from '../tokenStore';
import { AuthTokens } from '../types';

const user = { id: 'u1', email: 'reader@example.com', displayName: 'reader', createdAt: '2026-11-10T00:00:00Z' };

function tokens(accessToken: string, accessExpiresInMs: number): AuthTokens {
    return {
        accessToken,
        accessTokenExpiresAt: new Date(Date.now() + accessExpiresInMs).toISOString(),
        refreshToken: `refresh-for-${accessToken}`,
        refreshTokenExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        user,
    };
}

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();

beforeEach(async () => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    await tokenStore.clear();
});

describe('apiRequest', () => {
    it('refreshes an expired token once for concurrent requests and retries both', async () => {
        await tokenStore.save(tokens('expired', -60_000));
        fetchMock.mockImplementation(async (url, init) => {
            if (url.endsWith('/auth/refresh')) return json(200, tokens('fresh', 900_000));
            const auth = (init.headers as Record<string, string>).Authorization;
            return auth === 'Bearer fresh' ? json(200, { ok: true }) : json(401, {});
        });

        const results = await Promise.all([apiRequest('GET', '/me'), apiRequest('GET', '/me/books')]);

        expect(results).toEqual([{ ok: true }, { ok: true }]);
        expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
    });

    it('signs the reader out when the server rejects the refresh token', async () => {
        await tokenStore.save(tokens('expired', -60_000));
        const signedOut = jest.fn();
        const unsubscribe = authEvents.onSignedOut(signedOut);
        fetchMock.mockResolvedValue(json(401, { code: 'auth.invalid_refresh_token' }));

        await expect(apiRequest('GET', '/me')).rejects.toMatchObject({ status: 401 });

        expect(signedOut).toHaveBeenCalledTimes(1);
        expect(await tokenStore.getSession()).toBeNull();
        unsubscribe();
    });

    it('stays signed in when the server cannot be reached', async () => {
        await tokenStore.save(tokens('expired', -60_000));
        fetchMock.mockRejectedValue(new TypeError('Network request failed'));

        const error = await apiRequest('GET', '/me').catch(e => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).isNetwork).toBe(true);
        expect(await tokenStore.getSession()).not.toBeNull();
    });

    it('turns a ProblemDetails response into an ApiError with the server code', async () => {
        await tokenStore.save(tokens('valid', 900_000));
        fetchMock.mockResolvedValue(json(422, { title: 'A book must be public…', code: 'book.shareable_requires_public' }));

        const error = (await apiRequest('POST', '/books', { body: {} }).catch(e => e)) as ApiError;

        expect(error.status).toBe(422);
        expect(error.code).toBe('book.shareable_requires_public');
        expect(error.isRetryable).toBe(false);
    });

    it('sends the idempotency key header when given one', async () => {
        await tokenStore.save(tokens('valid', 900_000));
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

        await apiRequest('PUT', '/books/b1/like', { idempotencyKey: 'key-1' });

        expect((fetchMock.mock.calls[0][1].headers as Record<string, string>)['Idempotency-Key']).toBe('key-1');
    });
});
