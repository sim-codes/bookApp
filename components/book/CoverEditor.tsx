import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { MaterialIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GeneratedCover } from '../GeneratedCover';

export interface CoverAction {
    label: string;
    icon: ComponentProps<typeof MaterialIcons>['name'];
    onPress: () => void;
}

interface CoverEditorProps {
    coverUri: string | null;
    title: string;
    author: string;
    actions: CoverAction[];
}

/** Shows a book's cover, or a generated one when it has none, with buttons to change it. */
export function CoverEditor({ coverUri, title, author, actions }: CoverEditorProps) {
    return (
        <View>
            <Text style={styles.label}>Cover</Text>
            <View style={styles.preview}>
                {coverUri ? (
                    <Image key={coverUri} source={{ uri: coverUri }} style={styles.image} />
                ) : (
                    <GeneratedCover title={title || 'Your Book'} author={author} />
                )}
            </View>
            <View style={styles.actions}>
                {actions.map(action => (
                    <TouchableOpacity key={action.label} style={styles.button} onPress={action.onPress}>
                        <MaterialIcons name={action.icon} size={18} color={Colors.primary} />
                        <Text style={styles.buttonText}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    label: {
        ...TextStyles.body,
        color: Colors.textDark,
        fontWeight: '600',
        marginBottom: Spacing.md,
    },
    preview: {
        alignSelf: 'center',
        width: 180,
        aspectRatio: 0.7,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        backgroundColor: Colors.white,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: Spacing.lg,
        marginTop: Spacing.md,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
    },
    buttonText: {
        ...TextStyles.bodySmall,
        color: Colors.primary,
        fontWeight: '600',
    },
});
