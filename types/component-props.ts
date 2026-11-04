import { StyleProp, ViewStyle } from 'react-native';

export interface StreakDisplayProps {
    streak: number;
    lastReadDate?: string | null;
}

export interface BookCardProps {
    title: string;
    author: string;
    coverUri?: string;
    progress?: number;
    rotation?: number;
    onSwipeRight?: () => void;
    onSwipeLeft?: () => void;
    onSwipeUp?: () => void;
    style?: StyleProp<ViewStyle>;
}

export interface MenuItem {
    id: string;
    label: string;
    icon: string;
    onPress: () => void;
}

export interface FloatingMenuProps {
    items: MenuItem[];
    open?: boolean;
    onToggle?: (open: boolean) => void;
}
