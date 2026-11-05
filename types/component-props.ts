import { StyleProp, ViewStyle } from 'react-native';

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
