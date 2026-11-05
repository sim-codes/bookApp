import { BorderRadius, Colors, Spacing, TextStyles, Typography } from '@/constants';
import { BookAccess, BookVisibility } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export interface SharingValue {
    visibility: BookVisibility;
    access: BookAccess;
    rightsConfirmed: boolean;
}

/** Returns why the sharing choices can't be saved, or null when they can. */
export function sharingError({ visibility, access, rightsConfirmed }: SharingValue): string | null {
    if (visibility === 'public' && access === 'free' && !rightsConfirmed) {
        return 'Confirm you have the right to share this book for free';
    }
    return null;
}

interface SharingFieldsProps {
    value: SharingValue;
    onChange: (value: SharingValue) => void;
}

/** Whether a book is shared with other readers, and whether they can read it for free. */
export function SharingFields({ value, onChange }: SharingFieldsProps) {
    const isPublic = value.visibility === 'public';

    return (
        <View style={styles.section}>
            <View style={styles.switchRow}>
                <View style={styles.switchText}>
                    <Text style={styles.label}>Share with other readers</Text>
                    <Text style={styles.hint}>
                        Others see the cover, title and author. Your reading progress stays private.
                    </Text>
                </View>
                <Switch
                    value={isPublic}
                    onValueChange={on => onChange({ ...value, visibility: on ? 'public' : 'private' })}
                    trackColor={{ true: Colors.primary, false: Colors.mediumGray }}
                    thumbColor={Colors.white}
                    accessibilityLabel="Share with other readers"
                />
            </View>

            {isPublic && (
                <>
                    <View style={styles.accessRow}>
                        {(['paid', 'free'] as BookAccess[]).map(option => {
                            const selected = value.access === option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.accessButton, selected && styles.accessButtonSelected]}
                                    onPress={() => onChange({ ...value, access: option })}
                                    accessibilityState={{ selected }}
                                >
                                    <Text style={[styles.accessText, selected && styles.accessTextSelected]}>
                                        {option === 'free' ? 'Free to read' : 'Paid book'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {value.access === 'paid' ? (
                        <Text style={styles.hint}>
                            Others can preview it and save it to read later, but can&apos;t download your file.
                        </Text>
                    ) : (
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
                                licensed, so others may read it for free.
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
    accessRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    accessButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.mediumGray,
        alignItems: 'center',
    },
    accessButtonSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    accessText: {
        ...TextStyles.body,
        fontFamily: Typography.fontFamily.semibold,
        color: Colors.textDark,
    },
    accessTextSelected: {
        color: Colors.white,
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
