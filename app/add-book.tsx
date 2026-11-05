import { BookDetailsFields, CoverAction, CoverEditor, SharingFields, SharingValue, sharingError } from '@/components/book';
import { Toast } from '@/components/reader/Toast';
import { BorderRadius, Colors, FEATURES, Spacing, TextStyles, Typography } from '@/constants';
import { bookFiles, extractBookMetadata } from '@/services';
import { useBooksStore } from '@/stores';
import { Book } from '@/types';
import { generateId, getTodayDate } from '@/utils';
import { pickCoverImage } from '@/utils/pickCoverImage';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ToastConfig {
    visible: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
}

export default function AddBookScreen() {
    const router = useRouter();
    const { addBook } = useBooksStore();

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [sharing, setSharing] = useState<SharingValue>({ visibility: 'private', access: 'paid', rightsConfirmed: false });
    const [fileCoverUri, setFileCoverUri] = useState<string | null>(null);
    const [customCoverUri, setCustomCoverUri] = useState<string | null>(null);
    const [fileUri, setFileUri] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [isReadingFile, setIsReadingFile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<ToastConfig>({
        visible: false,
        message: '',
        type: 'info',
    });

    // Fields the user has typed in keep their value when a different file is picked.
    const editedFields = useRef({ title: false, author: false, genre: false });

    const coverUri = customCoverUri ?? fileCoverUri;

    const showToast = (message: string, type: ToastConfig['type'] = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    const getFileType = (fileName: string): 'pdf' | 'txt' | 'epub' | 'unknown' => {
        const ext = fileName.toLowerCase().split('.').pop() || '';
        if (ext === 'pdf') return 'pdf';
        if (ext === 'txt') return 'txt';
        if (ext === 'epub') return 'epub';
        return 'unknown';
    };

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain', 'application/epub+zip'],
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const asset = result.assets[0];
            const name = asset.name || 'book-file';
            if (getFileType(name) === 'unknown') {
                showToast('Please select a PDF, TXT, or EPUB file', 'error');
                return;
            }

            setFileUri(asset.uri);
            setFileName(name);
            setIsReadingFile(true);

            const metadata = await extractBookMetadata(asset.uri, name);
            if (!editedFields.current.title) setTitle(metadata.title);
            if (!editedFields.current.author) setAuthor(metadata.author ?? '');
            if (!editedFields.current.genre) setSelectedGenre(metadata.genre ?? '');
            setFileCoverUri(metadata.coverUri ?? null);
        } catch {
            showToast('Failed to pick file', 'error');
        } finally {
            setIsReadingFile(false);
        }
    };

    const changeCover = async () => {
        try {
            const uri = await pickCoverImage();
            if (uri) setCustomCoverUri(uri);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to pick image', 'error');
        }
    };

    const coverActions: CoverAction[] = [{ label: 'Change cover', icon: 'image', onPress: changeCover }];
    if (customCoverUri) {
        coverActions.push({
            label: fileCoverUri ? "Use book's cover" : 'Remove',
            icon: 'undo',
            onPress: () => setCustomCoverUri(null),
        });
    }

    const handleAddBook = async () => {
        if (!fileUri) {
            showToast('Please select a book file (PDF, TXT, or EPUB)', 'error');
            return;
        }

        if (!title.trim()) {
            showToast('Please enter a book title', 'error');
            return;
        }

        const sharingProblem = sharingError(sharing);
        if (sharingProblem) {
            showToast(sharingProblem, 'error');
            return;
        }

        setIsLoading(true);

        const bookId = generateId();
        let storedFileUri: string | undefined;
        let storedCoverUri: string | undefined;

        try {
            // Picker URIs live in the cache directory and can be purged by the OS,
            // so copy the book (and cover) into permanent app storage first.
            storedFileUri = await bookFiles.persistBook(fileUri, fileName, bookId);
            storedCoverUri = coverUri ? await bookFiles.persistCover(coverUri, bookId) : undefined;

            const newBook: Book = {
                id: bookId,
                title: title.trim(),
                author: author.trim() || 'Unknown Author',
                genre: selectedGenre || 'Unknown',
                coverUri: storedCoverUri,
                fileUri: storedFileUri,
                fileName,
                // Real page count is only known once the book is opened, so the
                // reader fills it in then; until then progress shows as 0.
                totalPages: undefined,
                currentPage: 0,
                status: 'reading',
                visibility: sharing.visibility,
                access: sharing.visibility === 'public' ? sharing.access : undefined,
                addedDate: getTodayDate(),
            };

            await addBook(newBook);
            showToast(`"${newBook.title}" added to your library!`, 'success');
            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (error) {
            // Don't leave orphaned copies behind if saving failed part-way.
            await bookFiles.remove(storedFileUri, storedCoverUri);
            showToast('Failed to add book. Please try again.', 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Book</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* File Picker */}
                <View style={styles.section}>
                    <Text style={styles.label}>Book File (PDF, TXT, or EPUB) *</Text>
                    <TouchableOpacity style={styles.filePicker} onPress={pickFile} disabled={isReadingFile}>
                        {isReadingFile ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : (
                            <MaterialIcons
                                name={fileUri ? 'check-circle' : 'file-upload'}
                                size={24}
                                color={fileUri ? Colors.primary : Colors.mediumGray}
                            />
                        )}
                        <View style={styles.filePickerText}>
                            <Text style={styles.filePickerLabel}>
                                {isReadingFile ? 'Reading book details…' : fileUri ? 'File Selected' : 'Select Book File'}
                            </Text>
                            {fileName ? (
                                <Text style={styles.filePickerSubtitle} numberOfLines={1}>
                                    {fileName}
                                </Text>
                            ) : (
                                <Text style={styles.filePickerSubtitle}>
                                    We&apos;ll fill in the details and cover for you
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <CoverEditor coverUri={coverUri} title={title} author={author} actions={coverActions} />
                </View>

                <BookDetailsFields
                    title={title}
                    author={author}
                    genre={selectedGenre}
                    onTitleChange={text => {
                        editedFields.current.title = true;
                        setTitle(text);
                    }}
                    onAuthorChange={text => {
                        editedFields.current.author = true;
                        setAuthor(text);
                    }}
                    onGenreChange={genre => {
                        editedFields.current.genre = true;
                        setSelectedGenre(genre);
                    }}
                />

                {FEATURES.communityLibrary && <SharingFields value={sharing} onChange={setSharing} />}

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, (isLoading || isReadingFile) && styles.saveButtonDisabled]}
                    onPress={handleAddBook}
                    disabled={isLoading || isReadingFile}
                >
                    {isLoading ? (
                        <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                        <>
                            <MaterialIcons name="add" size={24} color={Colors.white} />
                            <Text style={styles.saveButtonText}>Add to Library</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.spacer} />
            </ScrollView>

            {/* Toast Notification */}
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
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
    label: {
        ...TextStyles.body,
        color: Colors.textDark,
        fontFamily: Typography.fontFamily.semibold,
        marginBottom: Spacing.md,
    },
    filePicker: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        borderColor: Colors.lightGray,
        borderStyle: 'dashed',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    filePickerText: {
        flex: 1,
    },
    filePickerLabel: {
        ...TextStyles.body,
        color: Colors.textDark,
        fontFamily: Typography.fontFamily.semibold,
    },
    filePickerSubtitle: {
        ...TextStyles.caption,
        color: Colors.textLight,
        marginTop: Spacing.xs,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        ...TextStyles.h4,
        color: Colors.white,
    },
    spacer: {
        height: Spacing.xl,
    },
});
