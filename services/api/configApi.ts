import { apiRequest } from './httpClient';
import { ClientConfig } from './types';

export const configApi = {
    get: () => apiRequest<ClientConfig>('GET', '/config', { auth: false, timeoutMs: 5_000 }),
};
