import { create } from 'zustand';

interface UIStore {
    menuOpen: boolean;
    toggleMenu: () => void;
    closeMenu: () => void;
    openMenu: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    menuOpen: false,

    toggleMenu: () => {
        set((state) => ({ menuOpen: !state.menuOpen }));
    },

    closeMenu: () => {
        set({ menuOpen: false });
    },

    openMenu: () => {
        set({ menuOpen: true });
    },
}));
