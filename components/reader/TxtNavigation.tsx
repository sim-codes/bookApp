import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TxtNavigationProps {
    currentPage: number;
    totalPages: number;
    isTransitioning: boolean;
    onPreviousPage: () => void;
    onNextPage: () => void;
}

export function TxtNavigation({
    currentPage,
    totalPages,
    isTransitioning,
    onPreviousPage,
    onNextPage,
}: TxtNavigationProps) {
    const isPreviousDisabled = currentPage === 0 || isTransitioning;
    const isNextDisabled = currentPage === totalPages - 1 || isTransitioning;

    return (
        <View style={styles.navigation}>
            <TouchableOpacity
                style={[styles.navButton, isPreviousDisabled && styles.navButtonDisabled]}
                onPress={onPreviousPage}
                disabled={isPreviousDisabled}
            >
                <MaterialIcons
                    name="arrow-back-ios"
                    size={20}
                    color={isPreviousDisabled ? Colors.mediumGray : Colors.primary}
                />
            </TouchableOpacity>

            <Text style={styles.pageIndicator}>
                {currentPage + 1}/{totalPages}
            </Text>

            <TouchableOpacity
                style={[styles.navButton, isNextDisabled && styles.navButtonDisabled]}
                onPress={onNextPage}
                disabled={isNextDisabled}
            >
                <MaterialIcons
                    name="arrow-forward-ios"
                    size={20}
                    color={isNextDisabled ? Colors.mediumGray : Colors.primary}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.md,
    },
    navButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
    },
    navButtonDisabled: {
        borderColor: Colors.lightGray,
        opacity: 0.5,
    },
    pageIndicator: {
        ...TextStyles.bodySmall,
        color: Colors.textLight,
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'center',
    },
});
