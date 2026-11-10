import { configApi, isApiConfigured } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const CACHE_KEY = '@bookapp/features';

export interface Features {
    communityLibrary: boolean;
}

// Everything is off until the server says otherwise, so the app works fully offline.
const OFF: Features = { communityLibrary: false };

interface FeatureStore extends Features {
    load: () => Promise<void>;
    refresh: () => Promise<void>;
}

export const useFeatureStore = create<FeatureStore>((set) => ({
    ...OFF,

    /** Last known flags from this device, available instantly on launch. */
    load: async () => {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) set(JSON.parse(cached) as Features);
        } catch {
            set(OFF);
        }
    },

    /** Fresh flags from the server; keeps the cached ones when it cannot be reached. */
    refresh: async () => {
        if (!isApiConfigured()) {
            set(OFF);
            return;
        }
        try {
            const { features } = await configApi.get();
            set(features);
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(features));
        } catch {
            // Offline: keep whatever was last known.
        }
    },
}));
