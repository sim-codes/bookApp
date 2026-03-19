import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import React from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface JumpToPageModalProps {
    visible: boolean;
    currentPage: number;
    maxPage: number;
    onClose: () => void;
    onJump: (pageNum: number) => void;
}

export function JumpToPageModal({
    visible,
    currentPage,
    maxPage,
    onClose,
    onJump,
}: JumpToPageModalProps) {
    const [input, setInput] = React.useState('');

    const handleJump = () => {
        const pageNum = parseInt(input);
        if (input && pageNum > 0 && pageNum <= maxPage) {
            onJump(pageNum);
            setInput('');
        }
    };

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Jump to Page</Text>
                    <Text style={styles.modalMessage}>
                        Enter a page number (1-{maxPage})
                    </Text>

                    <TextInput
                        style={styles.pageInput}
                        placeholder="Enter page number"
                        placeholderTextColor={Colors.textLight}
                        keyboardType="number-pad"
                        value={input}
                        onChangeText={setInput}
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonCancel]}
                            onPress={() => {
                                setInput('');
                                onClose();
                            }}
                        >
                            <Text style={styles.modalButtonCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonConfirm]}
                            onPress={handleJump}
                        >
                            <Text style={styles.modalButtonText}>Jump</Text>
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
    pageInput: {
        borderWidth: 1,
        borderColor: Colors.lightGray,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        ...TextStyles.body,
        color: Colors.textDark,
    },
});
