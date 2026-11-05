import { BookListItem } from '@/components/book';
import { Colors, Spacing, TextStyles } from '@/constants';
import { useBooksStore } from '@/stores';
import { sortBooksByActivity } from '@/utils';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyBooksScreen() {
    const router = useRouter();
    const books = useBooksStore(state => state.books);
    const bookList = useMemo(() => sortBooksByActivity(Object.values(books)), [books]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Books</Text>
                <TouchableOpacity onPress={() => router.push('/add-book')}>
                    <MaterialIcons name="add" size={26} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={bookList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <BookListItem book={item} onPress={() => router.push(`/edit-book/${item.id}`)} />
                )}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={<Text style={styles.emptyText}>Books you add will appear here.</Text>}
            />
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
    list: {
        padding: Spacing.lg,
    },
    separator: {
        height: 1,
        backgroundColor: Colors.lightGray,
    },
    emptyText: {
        ...TextStyles.body,
        color: Colors.textLight,
        textAlign: 'center',
        paddingTop: Spacing.xl,
    },
});
