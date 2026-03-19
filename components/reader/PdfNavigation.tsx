import { BorderRadius, Colors, Spacing } from '@/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface PdfNavigationProps {
    isHorizontal: boolean;
    onToggleOrientation: () => void;
    onJumpToPage: () => void;
}

export function PdfNavigation({
    isHorizontal,
    onToggleOrientation,
    onJumpToPage,
}: PdfNavigationProps) {
    return (
        <View style={styles.pdfNavigation}>
            <TouchableOpacity
                style={[styles.navButton, styles.toggleButton]}
                onPress={onToggleOrientation}
            >
                <MaterialIcons
                    name={isHorizontal ? 'view-day' : 'view-week'}
                    size={20}
                    color={Colors.primary}
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.navButton, styles.toggleButton]}
                onPress={onJumpToPage}
            >
                <MaterialIcons name="input" size={20} color={Colors.primary} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    pdfNavigation: {
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
    toggleButton: {
        flex: 0.8,
    },
});
