import { Colors, Spacing, TextStyles, Typography } from '@/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DeckActionProps {
    icon: ComponentProps<typeof MaterialIcons>['name'];
    label: string;
    onPress: () => void;
    primary?: boolean;
}

function DeckAction({ icon, label, onPress, primary }: DeckActionProps) {
    return (
        <View style={styles.action}>
            <TouchableOpacity
                style={[styles.button, primary ? styles.buttonPrimary : styles.buttonSecondary]}
                onPress={onPress}
                accessibilityLabel={label}
            >
                <MaterialIcons name={icon} size={primary ? 30 : 24} color={primary ? Colors.white : Colors.brown} />
            </TouchableOpacity>
            <Text style={[styles.label, primary && styles.labelPrimary]}>{label}</Text>
        </View>
    );
}

interface DeckActionsProps {
    onSkip: () => void;
    onRead: () => void;
    onAdd: () => void;
    hasBooks: boolean;
}

/** Skip, read and add buttons under the home deck; with no books only Add is shown. */
export function DeckActions({ onSkip, onRead, onAdd, hasBooks }: DeckActionsProps) {
    return (
        <View style={styles.row}>
            {hasBooks && <DeckAction icon="close" label="Skip" onPress={onSkip} />}
            {hasBooks && <DeckAction icon="menu-book" label="Read" onPress={onRead} primary />}
            <DeckAction icon="add" label="Add" onPress={onAdd} primary={!hasBooks} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: Spacing.xl,
    },
    action: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
    },
    buttonSecondary: {
        width: 56,
        height: 56,
        backgroundColor: Colors.white,
        shadowColor: Colors.textDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 4,
    },
    buttonPrimary: {
        width: 68,
        height: 68,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 22,
        elevation: 6,
    },
    label: {
        ...TextStyles.tiny,
        fontFamily: Typography.fontFamily.semibold,
        color: Colors.textLight,
    },
    labelPrimary: {
        color: '#9A3412',
    },
});
