import { BookListItem } from '@/components/book';
import { Colors, Spacing, TextStyles, Typography } from '@/constants';
import { useBooksStore } from '@/stores';
import { sortBooksByActivity } from '@/utils';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Fragment, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PREVIEW_COUNT = 5;

export default function ProfileScreen() {
    const router = useRouter();
    const books = useBooksStore(state => state.books);
    const bookList = useMemo(() => sortBooksByActivity(Object.values(books)), [books]);
    const preview = bookList.slice(0, PREVIEW_COUNT);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={() => router.push('/settings')} accessibilityLabel="Settings">
                    <MaterialIcons name="settings" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        My Books{bookList.length > 0 ? ` (${bookList.length})` : ''}
                    </Text>
                    {bookList.length > PREVIEW_COUNT && (
                        <TouchableOpacity onPress={() => router.push('/my-books')}>
                            <Text style={styles.link}>See all</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {preview.length > 0 ? (
                    preview.map((book, index) => (
                        <Fragment key={book.id}>
                            {index > 0 && <View style={styles.separator} />}
                            <BookListItem book={book} onPress={() => router.push(`/edit-book/${book.id}`)} />
                        </Fragment>
                    ))
                ) : (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Books you add will appear here.</Text>
                        <TouchableOpacity onPress={() => router.push('/add-book')}>
                            <Text style={styles.link}>Add a book</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    headerTitle: {
        ...TextStyles.h3,
        color: Colors.textDark,
    },
    content: {
        padding: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        ...TextStyles.h4,
        color: Colors.textDark,
    },
    separator: {
        height: 1,
        backgroundColor: Colors.lightGray,
    },
    empty: {
        alignItems: 'center',
        paddingTop: Spacing.lg,
        gap: Spacing.md,
    },
    emptyText: {
        ...TextStyles.body,
        color: Colors.textLight,
    },
    link: {
        ...TextStyles.body,
        color: Colors.primary,
        fontFamily: Typography.fontFamily.semibold,
    },
});
