import { ApiUser, authEvents, authService } from '@/services/api';
import { syncEngine } from '@/services/sync';
import { create } from 'zustand';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthStore {
    status: AuthStatus;
    user: ApiUser | null;

    restore: () => Promise<void>;
    requestCode: (email: string) => Promise<void>;
    verifyCode: (email: string, code: string) => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    status: 'loading',
    user: null,

    restore: async () => {
        const user = await authService.currentUser();
        set({ user, status: user ? 'signedIn' : 'signedOut' });
    },

    requestCode: (email) => authService.requestCode(email),

    verifyCode: async (email, code) => {
        const user = await authService.signIn(email, code);
        await syncEngine.useAccount(user.id);
        set({ user, status: 'signedIn' });
        void syncEngine.run();
    },

    signOut: () => authService.signOut(),
}));

// Covers both an explicit sign-out and the server rejecting the refresh token.
authEvents.onSignedOut(() => useAuthStore.setState({ user: null, status: 'signedOut' }));
