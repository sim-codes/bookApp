import { SyncStatus, syncEngine } from '@/services/sync';
import { useSyncExternalStore } from 'react';

/** The current sync state, updating the component as syncs start and finish. */
export function useSyncStatus(): SyncStatus {
    return useSyncExternalStore(syncEngine.onStatusChange, syncEngine.getStatus);
}
