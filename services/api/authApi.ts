import { apiRequest } from './httpClient';
import { ApiUser, AuthTokens } from './types';

export const authApi = {
    requestCode: (email: string) =>
        apiRequest<void>('POST', '/auth/code/request', { body: { email }, auth: false }),

    verifyCode: (email: string, code: string) =>
        apiRequest<AuthTokens>('POST', '/auth/code/verify', { body: { email, code }, auth: false }),

    logout: (refreshToken: string) =>
        apiRequest<void>('POST', '/auth/logout', { body: { refreshToken }, auth: false }),

    me: () => apiRequest<ApiUser>('GET', '/me'),
};
