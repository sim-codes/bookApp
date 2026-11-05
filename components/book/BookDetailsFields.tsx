import { BorderRadius, Colors, GENRES, Spacing, TextStyles } from '@/constants';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface BookDetailsFieldsProps {
    title: string;
    author: string;
    genre: string;
    onTitleChange: (title: string) => void;
    onAuthorChange: (author: string) => void;
    onGenreChange: (genre: string) => void;
}

/** Title, author and genre inputs shared by the add and edit book screens. */
export function BookDetailsFields({
    title,
    author,
    genre,
    onTitleChange,
    onAuthorChange,
    onGenreChange,
}: BookDetailsFieldsProps) {
    return (
        <>
            <View style={styles.section}>
                <Text style={styles.label}>Book Title *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter book title"
                    placeholderTextColor={Colors.mediumGray}
                    value={title}
                    onChangeText={onTitleChange}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Author</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter author name"
                    placeholderTextColor={Colors.mediumGray}
                    value={author}
                    onChangeText={onAuthorChange}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Genre</Text>
                <View style={styles.genreGrid}>
                    {GENRES.map(item => (
                        <TouchableOpacity
                            key={item}
                            style={[styles.genreButton, genre === item && styles.genreButtonActive]}
                            onPress={() => onGenreChange(item)}
                        >
                            <Text style={[styles.genreButtonText, genre === item && styles.genreButtonTextActive]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: Spacing.xl,
    },
    label: {
        ...TextStyles.body,
        color: Colors.textDark,
        fontWeight: '600',
        marginBottom: Spacing.md,
    },
    input: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.mediumGray,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: 16,
        color: Colors.textDark,
    },
    genreGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    genreButton: {
        flex: 1,
        minWidth: '45%',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.mediumGray,
        alignItems: 'center',
    },
    genreButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    genreButtonText: {
        ...TextStyles.body,
        color: Colors.textDark,
        fontWeight: '600',
    },
    genreButtonTextActive: {
        color: Colors.white,
    },
});
