import { ConfirmationDialog } from '@/components';
import { BookDetailsFields, CoverAction, CoverEditor } from '@/components/book';
import { Toast } from '@/components/reader/Toast';
import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { bookFiles, extractBookMetadata } from '@/services';
import { useBooksStore } from '@/stores';
import { pickCoverImage } from '@/utils/pickCoverImage';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ToastConfig {
    visible: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
}

export default function EditBookScreen() {
    const router = useRouter();
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const book = useBooksStore(state => (bookId ? state.books[bookId] : undefined));
    const { updateBook, deleteBook } = useBooksStore();

    const [title, setTitle] = useState(book?.title ?? '');
    const [author, setAuthor] = useState(book?.author === 'Unknown Author' ? '' : book?.author ?? '');
    const [genre, setGenre] = useState(book?.genre === 'Unknown' ? '' : book?.genre ?? '');
    // undefined: keep the current cover; null: remove it; string: replace it with this image.
    const [newCoverUri, setNewCoverUri] = useState<string | null | undefined>(undefined);
    const [isBusy, setIsBusy] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [toast, setToast] = useState<ToastConfig>({ visible: false, message: '', type: 'info' });

    const coverUri = newCoverUri !== undefined ? newCoverUri : book?.coverUri ?? null;

    const showToast = (message: string, type: ToastConfig['type'] = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    if (!book) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.missing}>
                    <Text style={styles.missingText}>This book is no longer in your library.</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.link}>Go back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const changeCover = async () => {
        try {
            const uri = await pickCoverImage();
            if (uri) setNewCoverUri(uri);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to pick image', 'error');
        }
    };

    const getBookCover = async () => {
        setIsBusy(true);
        try {
            const metadata = await extractBookMetadata(book.fileUri, book.fileName || book.fileUri);
            if (metadata.coverUri) {
                setNewCoverUri(metadata.coverUri);
            } else {
                showToast("This book doesn't include a cover", 'info');
            }
        } finally {
            setIsBusy(false);
        }
    };

    const coverActions: CoverAction[] = [
        { label: 'Change cover', icon: 'image', onPress: changeCover },
        { label: "Get book's cover", icon: 'auto-stories', onPress: getBookCover },
    ];
    if (coverUri) {
        coverActions.push({ label: 'Remove', icon: 'hide-image', onPress: () => setNewCoverUri(null) });
    }

    const handleSave = async () => {
        if (!title.trim()) {
            showToast('Please enter a book title', 'error');
            return;
        }

        setIsBusy(true);
        let storedCoverUri: string | undefined;
        try {
            if (newCoverUri) storedCoverUri = await bookFiles.persistCover(newCoverUri, book.id);

            await updateBook(book.id, {
                title: title.trim(),
                author: author.trim() || 'Unknown Author',
                genre: genre || 'Unknown',
                ...(newCoverUri !== undefined && { coverUri: storedCoverUri }),
            });

            if (newCoverUri !== undefined) await bookFiles.remove(book.coverUri);
            router.back();
        } catch (error) {
            await bookFiles.remove(storedCoverUri);
            showToast('Failed to save changes. Please try again.', 'error');
            console.error(error);
        } finally {
            setIsBusy(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteDialog(false);
        try {
            await deleteBook(book.id);
            router.back();
        } catch (error) {
            showToast('Failed to delete book. Please try again.', 'error');
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Book</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <CoverEditor coverUri={coverUri} title={title} author={author} actions={coverActions} />
                </View>

                <BookDetailsFields
                    title={title}
                    author={author}
                    genre={genre}
                    onTitleChange={setTitle}
                    onAuthorChange={setAuthor}
                    onGenreChange={setGenre}
                />

                <TouchableOpacity
                    style={[styles.saveButton, isBusy && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={isBusy}
                >
                    {isBusy ? (
                        <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteDialog(true)} disabled={isBusy}>
                    <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
                    <Text style={styles.deleteButtonText}>Delete Book</Text>
                </TouchableOpacity>

                <View style={styles.spacer} />
            </ScrollView>

            <Toast visible={toast.visible} message={toast.message} type={toast.type} />

            <ConfirmationDialog
                visible={showDeleteDialog}
                title="Delete this book?"
                message={`"${book.title}" and its file will be removed from this device.`}
                onCancel={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                confirmText="Delete"
                destructive
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.lightGray,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.mediumGray,
    },
    headerTitle: {
        ...TextStyles.h3,
        color: Colors.textDark,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        ...TextStyles.h4,
        color: Colors.white,
        fontWeight: '700',
    },
    deleteButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        marginTop: Spacing.md,
    },
    deleteButtonText: {
        ...TextStyles.body,
        color: Colors.error,
        fontWeight: '600',
    },
    missing: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    missingText: {
        ...TextStyles.body,
        color: Colors.textLight,
    },
    link: {
        ...TextStyles.body,
        color: Colors.primary,
        fontWeight: '600',
    },
    spacer: {
        height: Spacing.xl,
    },
});
