import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmationDialogProps {
    visible: boolean;
    title: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmationDialog({
    visible,
    title,
    message,
    onCancel,
    onConfirm,
    confirmText = 'Save',
    cancelText = 'Discard',
}: ConfirmationDialogProps) {
    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalMessage}>{message}</Text>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonCancel]}
                            onPress={onCancel}
                        >
                            <Text style={styles.modalButtonCancelText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonConfirm]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.modalButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        width: '80%',
        gap: Spacing.md,
    },
    modalTitle: {
        ...TextStyles.h3,
        color: Colors.textDark,
    },
    modalMessage: {
        ...TextStyles.body,
        color: Colors.textLight,
    },
    modalActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        backgroundColor: Colors.lightGray,
    },
    modalButtonCancelText: {
        ...TextStyles.body,
        color: Colors.textDark,
        fontWeight: '600',
    },
    modalButtonConfirm: {
        backgroundColor: Colors.primary,
    },
    modalButtonText: {
        ...TextStyles.body,
        color: Colors.white,
        fontWeight: '600',
    },
});
