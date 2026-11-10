import { authApi } from './authApi';
import { authEvents } from './authEvents';
import { tokenStore } from './tokenStore';
import { ApiUser } from './types';

/** Code sign-in: email a code, exchange it for tokens, and end the session on sign-out. */
export const authService = {
    /** The user from the last session on this device, without calling the server. */
    async currentUser(): Promise<ApiUser | null> {
        return (await tokenStore.getSession())?.user ?? null;
    },

    requestCode(email: string): Promise<void> {
        return authApi.requestCode(email.trim());
    },

    async signIn(email: string, code: string): Promise<ApiUser> {
        const tokens = await authApi.verifyCode(email.trim(), code.trim());
        await tokenStore.save(tokens);
        return tokens.user;
    },

    async signOut(): Promise<void> {
        const session = await tokenStore.getSession();
        if (session) {
            // Best effort: the local session ends even if the server cannot be reached.
            await authApi.logout(session.refreshToken).catch(() => undefined);
        }
        await tokenStore.clear();
        authEvents.emitSignedOut();
    },
};
