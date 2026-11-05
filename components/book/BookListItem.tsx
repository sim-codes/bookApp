import { BorderRadius, Colors, Spacing, TextStyles, Typography } from '@/constants';
import { Book } from '@/types';
import { bookProgress, toTitleCase } from '@/utils';
import { MaterialIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GeneratedCover } from '../GeneratedCover';

interface BookListItemProps {
    book: Book;
    onPress: () => void;
}

/** One book in a list: cover thumbnail, title, author and reading progress. */
export function BookListItem({ book, onPress }: BookListItemProps) {
    const progress = Math.round(bookProgress(book));
    const status = book.status === 'completed' ? 'Finished' : progress > 0 ? `${progress}% read` : 'Not started';

    return (
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
            <View style={styles.thumbnail}>
                {book.coverUri ? (
                    <Image source={{ uri: book.coverUri }} style={styles.thumbnailImage} />
                ) : (
                    <GeneratedCover title={book.title} size="small" />
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>
                    {toTitleCase(book.title)}
                </Text>
                <Text style={styles.author} numberOfLines={1}>
                    {book.author}
                </Text>
                <Text style={styles.progress}>{status}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={Colors.darkGray} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    thumbnail: {
        width: 56,
        aspectRatio: 0.7,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
        backgroundColor: Colors.lightGray,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    info: {
        flex: 1,
        gap: 2,
    },
    title: {
        ...TextStyles.body,
        color: Colors.textDark,
        fontFamily: Typography.fontFamily.semibold,
    },
    author: {
        ...TextStyles.bodySmall,
        color: Colors.textLight,
    },
    progress: {
        ...TextStyles.caption,
        color: Colors.secondary,
    },
});
