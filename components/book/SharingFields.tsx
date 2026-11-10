import { BorderRadius, Colors, Spacing, TextStyles, Typography } from '@/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export interface SharingValue {
    isPublic: boolean;
    isShareable: boolean;
    rightsConfirmed: boolean;
}

/** Returns why the sharing choices can't be saved, or null when they can. */
export function sharingError({ isPublic, isShareable, rightsConfirmed }: SharingValue): string | null {
    if (isPublic && isShareable && !rightsConfirmed) {
        return 'Confirm you have the right to let others read this book';
    }
    return null;
}

/** The flags to save: a book can only be shareable while it is visible to others. */
export function sharingFlags({ isPublic, isShareable }: SharingValue): { isPublic: boolean; isShareable: boolean } {
    return { isPublic, isShareable: isPublic && isShareable };
}

interface SharingFieldsProps {
    value: SharingValue;
    onChange: (value: SharingValue) => void;
}

/** Whether other readers can see a book, and whether they can add it to their own library. */
export function SharingFields({ value, onChange }: SharingFieldsProps) {
    return (
        <View style={styles.section}>
            <View style={styles.switchRow}>
                <View style={styles.switchText}>
                    <Text style={styles.label}>Visible to other readers</Text>
                    <Text style={styles.hint}>
                        Others see the cover, title and author. Your reading progress stays private.
                    </Text>
                </View>
                <Switch
                    value={value.isPublic}
                    onValueChange={on => onChange({ ...value, isPublic: on, isShareable: on && value.isShareable })}
                    trackColor={{ true: Colors.primary, false: Colors.mediumGray }}
                    thumbColor={Colors.white}
                    accessibilityLabel="Visible to other readers"
                />
            </View>

            {value.isPublic && (
                <>
                    <View style={styles.switchRow}>
                        <View style={styles.switchText}>
                            <Text style={styles.label}>Let others add it to their library</Text>
                            <Text style={styles.hint}>
                                Readers can save a copy of your file and read it in the app.
                            </Text>
                        </View>
                        <Switch
                            value={value.isShareable}
                            onValueChange={on => onChange({ ...value, isShareable: on })}
                            trackColor={{ true: Colors.primary, false: Colors.mediumGray }}
                            thumbColor={Colors.white}
                            accessibilityLabel="Let others add it to their library"
                        />
                    </View>

                    {value.isShareable && (
                        <TouchableOpacity
                            style={styles.confirmRow}
                            onPress={() => onChange({ ...value, rightsConfirmed: !value.rightsConfirmed })}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: value.rightsConfirmed }}
                        >
                            <MaterialIcons
                                name={value.rightsConfirmed ? 'check-box' : 'check-box-outline-blank'}
                                size={22}
                                color={value.rightsConfirmed ? Colors.primary : Colors.darkGray}
                            />
                            <Text style={styles.confirmText}>
                                I have the right to share this file. It&apos;s in the public domain or openly
                                licensed, so others may read it.
                            </Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: Spacing.xl,
        padding: Spacing.lg,
        gap: Spacing.md,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    switchText: {
        flex: 1,
        gap: 2,
    },
    label: {
        ...TextStyles.body,
        fontFamily: Typography.fontFamily.semibold,
        color: Colors.textDark,
    },
    hint: {
        ...TextStyles.caption,
        color: Colors.textLight,
    },
    confirmRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    confirmText: {
        ...TextStyles.bodySmall,
        flex: 1,
        color: Colors.textDark,
    },
});
