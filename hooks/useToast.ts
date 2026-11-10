import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastType = 'error' | 'success' | 'info';

const VISIBLE_MS = 3000;

/** State for the shared Toast component: call `show` and render `<Toast {...toast} />`. */
export function useToast() {
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const show = useCallback((message: string, type: ToastType = 'info') => {
        clearTimeout(timer.current);
        setToast({ visible: true, message, type });
        timer.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), VISIBLE_MS);
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    return { toast, show };
}
