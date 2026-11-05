import { BorderRadius, Colors, Spacing, TextStyles, Typography } from '@/constants';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type LibraryScope = 'mine' | 'everyone';

const OPTIONS: { value: LibraryScope; label: string }[] = [
    { value: 'mine', label: 'Mine' },
    { value: 'everyone', label: 'Everyone' },
];

interface LibraryToggleProps {
    value: LibraryScope;
    onChange: (value: LibraryScope) => void;
}

/** Switches the home deck between the user's own books and books shared by other readers. */
export function LibraryToggle({ value, onChange }: LibraryToggleProps) {
    return (
        <View style={styles.track} accessibilityRole="tablist">
            {OPTIONS.map(option => {
                const selected = option.value === value;
                return (
                    <TouchableOpacity
                        key={option.value}
                        style={[styles.segment, selected && styles.segmentSelected]}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected }}
                    >
                        <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        flexDirection: 'row',
        padding: Spacing.xs,
        gap: Spacing.xs,
        borderRadius: BorderRadius.full,
        backgroundColor: '#F1E7DD',
    },
    segment: {
        flex: 1,
        height: 40,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentSelected: {
        backgroundColor: Colors.white,
        shadowColor: Colors.textDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
    },
    label: {
        ...TextStyles.body,
        fontFamily: Typography.fontFamily.semibold,
        color: Colors.textLight,
    },
    labelSelected: {
        color: Colors.textDark,
    },
});
