type Listener = () => void;

const signedOutListeners = new Set<Listener>();

/** Lets the UI react when the session ends, for example when a refresh token is rejected. */
export const authEvents = {
    onSignedOut(listener: Listener): () => void {
        signedOutListeners.add(listener);
        return () => signedOutListeners.delete(listener);
    },

    emitSignedOut(): void {
        signedOutListeners.forEach(listener => listener());
    },
};
