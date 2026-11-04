import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface ToastProps {
    visible: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
}

export function Toast({ visible, message, type }: ToastProps) {
    if (!visible) return null;

    return (
        <View
            style={[
                styles.toast,
                type === 'error' && styles.toastError,
                type === 'success' && styles.toastSuccess,
            ]}
        >
            <MaterialIcons
                name={
                    type === 'error'
                        ? 'error'
                        : type === 'success'
                            ? 'check-circle'
                            : 'info'
                }
                size={20}
                color={Colors.white}
            />
            <Text style={styles.toastText}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        zIndex: 1000,
    },
    toastError: {
        backgroundColor: '#FF4444',
    },
    toastSuccess: {
        backgroundColor: '#4CAF50',
    },
    toastText: {
        ...TextStyles.body,
        color: Colors.white,
        fontWeight: '600',
    },
});
