import { syncEngine } from '@/services/sync';
import { useAuthStore, useBooksStore, useFeatureStore, useReadingStore } from '@/stores';
import { useEffect } from 'react';
import { AppState } from 'react-native';

/**
 * Starts the account and sync lifecycle once, at the app root: restores the session, loads feature
 * flags, and syncs on launch and whenever the app comes back to the foreground.
 */
export function useAppSync(): void {
    useEffect(() => {
        const { restore } = useAuthStore.getState();
        const { load, refresh } = useFeatureStore.getState();

        void Promise.all([restore(), load()]).then(() => {
            void refresh();
            void syncEngine.run();
        });

        const appState = AppState.addEventListener('change', state => {
            if (state === 'active') {
                void refresh();
                void syncEngine.run();
            }
        });

        // Changes pulled from other devices land in storage; reload so screens show them.
        const dataChanged = syncEngine.onDataChanged(() => {
            void useBooksStore.getState().loadBooks();
            void useReadingStore.getState().loadStats();
        });

        return () => {
            appState.remove();
            dataChanged();
        };
    }, []);
}
