import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { useBooksStore, useReadingStore } from '@/stores';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PdfReader from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';

type FileType = 'txt' | 'pdf' | 'unknown';

interface ToastConfig {
    visible: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
}

export default function ReaderScreen() {
    const router = useRouter();
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const { books, updateBook } = useBooksStore();
    const { startSession, endSession } = useReadingStore();

    const [pages, setPages] = useState<string[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isReading, setIsReading] = useState(false);
    const [fileType, setFileType] = useState<FileType>('unknown');
    const [pdfPageCount, setPdfPageCount] = useState(0);
    const [pdfUri, setPdfUri] = useState<string>('');
    const pdfReaderRef = useRef(null);
    const [toast, setToast] = useState<ToastConfig>({
        visible: false,
        message: '',
        type: 'info',
    });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => { });

    const book = bookId ? books?.[bookId] : null;

    // Detect file type from extension
    const getFileType = (filePath: string): FileType => {
        const ext = filePath.toLowerCase().split('.').pop() || '';
        if (ext === 'pdf') return 'pdf';
        if (ext === 'txt') return 'txt';
        return 'unknown';
    };

    // Show toast notification
    const showToast = (message: string, type: ToastConfig['type'] = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => {
            setToast({ ...toast, visible: false });
        }, 3000);
    };

    // Show confirmation dialog
    const showConfirm = (message: string, onConfirm: () => void) => {
        setConfirmAction(() => onConfirm);
        setShowConfirmDialog(true);
    };

    // Load book content on mount
    useEffect(() => {
        const loadBookContent = async () => {
            if (!book?.fileUri) {
                showToast('Book file not found', 'error');
                setTimeout(() => router.back(), 2000);
                return;
            }

            try {
                setLoading(true);
                const type = getFileType(book.fileUri);
                setFileType(type);

                if (type === 'txt') {
                    const content = await FileSystem.readAsStringAsync(book.fileUri);
                    const bookPages = splitIntoPages(content);
                    setPages(bookPages);

                    const lastPage = book.currentPage || 0;
                    setCurrentPageIndex(Math.min(lastPage, bookPages.length - 1));
                } else if (type === 'pdf') {
                    // For PDF, just set the URI for react-native-pdf to handle
                    setPdfUri(book.fileUri);
                    setCurrentPageIndex(book.currentPage || 0);
                } else {
                    showToast('Unsupported file format', 'error');
                    setPages(['Unsupported file format']);
                }
            } catch (error) {
                console.error('Error reading book:', error);
                showToast('Failed to load book content', 'error');
                setPages(['Error loading content']);
            } finally {
                setLoading(false);
            }
        };

        loadBookContent();
    }, [book?.fileUri, bookId]);

    // Split content into pages
    const splitIntoPages = (content: string): string[] => {
        const charsPerPage = 2000;
        const pageArray: string[] = [];

        for (let i = 0; i < content.length; i += charsPerPage) {
            pageArray.push(content.substring(i, i + charsPerPage));
        }

        return pageArray.length > 0 ? pageArray : [content];
    };

    const handleStartReading = () => {
        startSession(bookId!, currentPageIndex);
        setIsReading(true);
        showToast('Reading session started', 'success');
    };

    const handleEndReading = async () => {
        try {
            await endSession(currentPageIndex);
            setIsReading(false);

            if (book && bookId) {
                const isCompleted = currentPageIndex >= pages.length - 1;
                await updateBook(bookId, {
                    currentPage: currentPageIndex,
                    totalPages: pages.length,
                    status: isCompleted ? 'completed' : 'reading',
                });
            }
            showToast('Reading session saved', 'success');
        } catch (error) {
            console.error('Error saving session:', error);
            showToast('Failed to save reading session', 'error');
        }
    };

    const handlePreviousPage = async () => {
        if (currentPageIndex > 0) {
            const newIndex = currentPageIndex - 1;
            setCurrentPageIndex(newIndex);

            if (book && bookId) {
                await updateBook(bookId, {
                    currentPage: newIndex,
                    totalPages: pages.length,
                });
            }
        }
    };

    const handleNextPage = async () => {
        if (currentPageIndex < pages.length - 1) {
            const newIndex = currentPageIndex + 1;
            setCurrentPageIndex(newIndex);

            if (book && bookId) {
                const isCompleted = newIndex >= pages.length - 1;
                await updateBook(bookId, {
                    currentPage: newIndex,
                    totalPages: pages.length,
                    status: isCompleted ? 'completed' : 'reading',
                });
            }
        }
    };

    const handleBackPress = () => {
        if (isReading) {
            showConfirm('Save your reading session?', async () => {
                await handleEndReading();
                setShowConfirmDialog(false);
                router.back();
            });
        } else {
            router.back();
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading book...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!book || pages.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBackPress}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Reader</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.content}>
                    <Text style={styles.errorText}>Unable to load book</Text>
                </View>
            </SafeAreaView>
        );
    }

    const progress = ((currentPageIndex + 1) / pages.length) * 100;
    const currentPage = pages[currentPageIndex];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackPress}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {book.title}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {fileType === 'pdf' ? 'PDF' : 'Page'} {currentPageIndex + 1} of{' '}
                        {fileType === 'pdf' ? pdfPageCount : pages.length}
                    </Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>

            {/* Content Area */}
            {fileType === 'txt' ? (
                <ScrollView
                    style={styles.contentArea}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.pageText}>{currentPage}</Text>
                </ScrollView>
            ) : fileType === 'pdf' ? (
                <PdfReader
                    ref={pdfReaderRef}
                    source={{ uri: pdfUri }}
                    onLoadComplete={(numberOfPages) => {
                        setPdfPageCount(numberOfPages);
                    }}
                    page={currentPageIndex + 1}
                    onPageChanged={(page) => {
                        setCurrentPageIndex(page - 1);
                    }}
                    style={styles.pdfViewer}
                    activityIndicator={<ActivityIndicator size="large" color={Colors.primary} />}
                    onError={(error) => {
                        console.error('PDF rendering error:', error);
                        showToast('Error loading PDF', 'error');
                    }}
                    enablePaging={true}
                    horizontal={false}
                />
            ) : (
                <View style={styles.contentArea}>
                    <View style={styles.placeholderContent}>
                        <MaterialIcons name="error-outline" size={64} color={Colors.mediumGray} />
                        <Text style={styles.placeholderText}>Unsupported Format</Text>
                        <Text style={styles.placeholderSubtext}>
                            This file format is not supported
                        </Text>
                    </View>
                </View>
            )}

            {/* Navigation Footer */}
            <View style={styles.footer}>
                {/* Reading Session Button */}
                <TouchableOpacity
                    style={[styles.sessionButton, isReading && styles.sessionButtonActive]}
                    onPress={isReading ? handleEndReading : handleStartReading}
                >
                    <MaterialIcons
                        name={isReading ? 'stop-circle' : 'play-circle'}
                        size={20}
                        color={Colors.white}
                    />
                    <Text style={styles.sessionButtonText}>
                        {isReading ? 'End Reading' : 'Start Reading'}
                    </Text>
                </TouchableOpacity>

                {/* Page Navigation */}
                {fileType === 'txt' && (
                    <View style={styles.navigation}>
                        <TouchableOpacity
                            style={[
                                styles.navButton,
                                currentPageIndex === 0 && styles.navButtonDisabled,
                            ]}
                            onPress={handlePreviousPage}
                            disabled={currentPageIndex === 0}
                        >
                            <MaterialIcons
                                name="arrow-back-ios"
                                size={20}
                                color={
                                    currentPageIndex === 0 ? Colors.mediumGray : Colors.primary
                                }
                            />
                        </TouchableOpacity>

                        <Text style={styles.pageIndicator}>
                            {currentPageIndex + 1}/{pages.length}
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.navButton,
                                currentPageIndex === pages.length - 1 && styles.navButtonDisabled,
                            ]}
                            onPress={handleNextPage}
                            disabled={currentPageIndex === pages.length - 1}
                        >
                            <MaterialIcons
                                name="arrow-forward-ios"
                                size={20}
                                color={
                                    currentPageIndex === pages.length - 1
                                        ? Colors.mediumGray
                                        : Colors.primary
                                }
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Toast Notification */}
            {toast.visible && (
                <View
                    style={[
                        styles.toast,
                        toast.type === 'error' && styles.toastError,
                        toast.type === 'success' && styles.toastSuccess,
                    ]}
                >
                    <MaterialIcons
                        name={
                            toast.type === 'error'
                                ? 'error'
                                : toast.type === 'success'
                                    ? 'check-circle'
                                    : 'info'
                        }
                        size={20}
                        color={Colors.white}
                    />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </View>
            )}

            {/* Confirmation Dialog Modal */}
            <Modal
                transparent
                animationType="fade"
                visible={showConfirmDialog}
                onRequestClose={() => setShowConfirmDialog(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>End Reading?</Text>
                        <Text style={styles.modalMessage}>
                            Do you want to save your reading session?
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => {
                                    setShowConfirmDialog(false);
                                    router.back();
                                }}
                            >
                                <Text style={styles.modalButtonCancelText}>Discard</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonConfirm]}
                                onPress={() => confirmAction()}
                            >
                                <Text style={styles.modalButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    loadingText: {
        ...TextStyles.body,
        color: Colors.textLight,
        marginTop: Spacing.md,
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
    headerContent: {
        flex: 1,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    headerTitle: {
        ...TextStyles.h4,
        color: Colors.textDark,
    },
    headerSubtitle: {
        ...TextStyles.caption,
        color: Colors.textLight,
    },
    progressBarContainer: {
        height: 3,
        backgroundColor: Colors.lightGray,
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.primary,
    },
    contentArea: {
        flex: 1,
    },
    pdfViewer: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.lightGray,
    },
    contentContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xl,
    },
    pageText: {
        ...TextStyles.body,
        color: Colors.textDark,
        lineHeight: 28,
        letterSpacing: 0.5,
    },
    placeholderContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    placeholderText: {
        ...TextStyles.h3,
        color: Colors.textDark,
        textAlign: 'center',
    },
    placeholderSubtext: {
        ...TextStyles.body,
        color: Colors.textLight,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        ...TextStyles.body,
        color: Colors.textLight,
    },
    footer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        gap: Spacing.md,
    },
    sessionButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    sessionButtonActive: {
        backgroundColor: '#FF4444',
    },
    sessionButtonText: {
        ...TextStyles.body,
        color: Colors.white,
        fontWeight: '600',
    },
    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.md,
    },
    navButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
    },
    navButtonDisabled: {
        borderColor: Colors.lightGray,
        opacity: 0.5,
    },
    pageIndicator: {
        ...TextStyles.bodySmall,
        color: Colors.textLight,
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'center',
    },
    toast: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    toastError: {
        backgroundColor: '#FF4444',
    },
    toastSuccess: {
        backgroundColor: '#4CAF50',
    },
    toastText: {
        ...TextStyles.body,
        color: Colors.white,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        width: '80%',
        gap: Spacing.md,
    },
    modalTitle: {
        ...TextStyles.h3,
        color: Colors.textDark,
    },
    modalMessage: {
        ...TextStyles.body,
        color: Colors.textLight,
    },
    modalActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        backgroundColor: Colors.lightGray,
    },
    modalButtonCancelText: {
        ...TextStyles.body,
        color: Colors.textDark,
        fontWeight: '600',
    },
    modalButtonConfirm: {
        backgroundColor: Colors.primary,
    },
    modalButtonText: {
        ...TextStyles.body,
        color: Colors.white,
        fontWeight: '600',
    },
});
