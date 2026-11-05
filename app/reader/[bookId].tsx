import { EpubNavigationBar, ReadiumReader, ReadiumReaderHandle } from '@/components/reader/ReadiumReader';
import { JumpToPageModal } from '@/components/reader/JumpToPageModal';
import { PdfNavigation } from '@/components/reader/PdfNavigation';
import { ReaderHeader } from '@/components/reader/ReaderHeader';
import { Toast } from '@/components/reader/Toast';
import { TxtNavigation } from '@/components/reader/TxtNavigation';
import { Colors, Spacing, TextStyles } from '@/constants';
import { booksStorage } from '@/services';
import { useBooksStore, useReadingStore } from '@/stores';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    AppState,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FileType = 'txt' | 'pdf' | 'epub' | 'unknown';

interface ToastConfig {
    visible: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
}

const splitIntoPages = (content: string): string[] => {
    const charsPerPage = 1500;
    const pageArray: string[] = [];
    for (let i = 0; i < content.length; i += charsPerPage) {
        pageArray.push(content.substring(i, i + charsPerPage));
    }
    return pageArray.length > 0 ? pageArray : [''];
};

export default function ReaderScreen() {
    const router = useRouter();
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const { books, updateBook } = useBooksStore();
    const { startSession, endSession } = useReadingStore();

    const [pages, setPages] = useState<string[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pageTransitioning, setPageTransitioning] = useState(false);
    const [fileType, setFileType] = useState<FileType>('unknown');
    const [readiumUri, setReadiumUri] = useState<string>('');
    const [bookTitle, setBookTitle] = useState('');
    const [isPdfHorizontal, setIsPdfHorizontal] = useState(false);
    const [toast, setToast] = useState<ToastConfig>({ visible: false, message: '', type: 'info' });
    const [showJumpToPageModal, setShowJumpToPageModal] = useState(false);

    // EPUB/PDF position — lifted from ReadiumReader via onPositionChange
    const [readiumPosition, setReadiumPosition] = useState(0);
    const [readiumTotalPositions, setReadiumTotalPositions] = useState(0);
    // Saved locator string passed down as initialLocator
    const [savedLocator, setSavedLocator] = useState<string | null>(null);
    // 1-based page to open a PDF at when it has no saved locator yet
    const [initialPdfPosition, setInitialPdfPosition] = useState<number | undefined>(undefined);
    // Ref to ReadiumReader — the navigation bars call imperative methods on it directly
    const readiumRef = useRef<ReadiumReaderHandle>(null);

    const navigationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const book = bookId ? books?.[bookId] : null;
    const isReadium = fileType === 'pdf' || fileType === 'epub';

    const getFileType = (filePath: string): FileType => {
        const ext = filePath.toLowerCase().split('.').pop() || '';
        if (ext === 'pdf') return 'pdf';
        if (ext === 'epub') return 'epub';
        if (ext === 'txt') return 'txt';
        return 'unknown';
    };

    const showToast = (message: string, type: ToastConfig['type'] = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    useEffect(() => {
        const loadBookContent = async () => {
            try {
                setLoading(true);

                // Read the book once on open. This effect must NOT depend on `book`:
                // every progress save updates the store, which would re-run this
                // effect, flash the loading screen and remount the PDF/EPUB view.
                let currentBook = bookId ? useBooksStore.getState().books[bookId] : null;
                if (!currentBook && bookId) {
                    currentBook = await booksStorage.get(bookId);
                }

                if (!currentBook?.fileUri) {
                    showToast('Book file not found', 'error');
                    setTimeout(() => router.back(), 2000);
                    return;
                }

                setBookTitle(currentBook.title || 'Book');

                const type = getFileType(currentBook.fileUri);
                setFileType(type);

                if (type === 'txt') {
                    const content = await FileSystem.readAsStringAsync(currentBook.fileUri);
                    const bookPages = splitIntoPages(content);
                    setPages(bookPages);
                    // Persist the real page count as soon as it's known.
                    updateBook(currentBook.id, { totalPages: bookPages.length }).catch(console.error);
                    const lastPage = currentBook.currentPage || 0;
                    setCurrentPageIndex(Math.min(lastPage, bookPages.length - 1));
                } else if (type === 'pdf' || type === 'epub') {
                    setSavedLocator(currentBook.epubLocator ?? null);
                    if (type === 'pdf' && !currentBook.epubLocator) {
                        // PDFs saved before the Readium reader stored a 0-based page index.
                        setInitialPdfPosition((currentBook.currentPage || 0) + 1);
                    }
                    setReadiumUri(currentBook.fileUri);
                } else {
                    showToast('Unsupported file format', 'error');
                    setPages(['Unsupported file format']);
                }
            } catch (error) {
                console.error('Error reading book:', error);
                showToast(
                    `Failed to load book: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    'error',
                );
                setPages(['Error loading content']);
            } finally {
                setLoading(false);
            }
        };

        loadBookContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookId]);

    useEffect(() => {
        return () => {
            if (navigationDebounceRef.current) clearTimeout(navigationDebounceRef.current);
        };
    }, []);

    // Latest reading position, read by session callbacks that outlive the render
    // they were created in (AppState listener and unmount cleanup).
    const positionRef = useRef({ isReadium: false, isPdf: false, position: 0, total: 0 });
    useEffect(() => {
        positionRef.current = {
            isReadium,
            isPdf: fileType === 'pdf',
            position: isReadium ? readiumPosition : currentPageIndex,
            total: isReadium ? readiumTotalPositions : pages.length,
        };
    });

    const bookLoaded = fileType !== 'unknown' && !loading && !!bookId;

    // Sessions run while the reader is open and in the foreground; they are saved
    // when the reader closes or the app goes to the background.
    useEffect(() => {
        if (!bookLoaded) return;

        const beginSession = () => {
            const { isReadium: readium, position } = positionRef.current;
            const savedPosition = useBooksStore.getState().books[bookId]?.currentPage ?? 0;
            startSession(bookId, readium ? position || savedPosition : position);
        };

        const finishSession = async () => {
            const { isReadium: readium, isPdf, position, total } = positionRef.current;
            try {
                await endSession(position);
                // A total of 0 means "not loaded yet", which must never count as completed.
                // TXT pages count from 0, and Readium never reports a PDF's last page.
                const isCompleted = readium && !isPdf
                    ? total > 0 && position >= total
                    : total > 0 && position >= total - 1;
                await updateBook(bookId, {
                    currentPage: position,
                    totalPages: total,
                    status: isCompleted ? 'completed' : 'reading',
                });
            } catch (error) {
                console.error('Error saving reading session:', error);
            }
        };

        beginSession();
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'background') finishSession();
            else if (state === 'active' && !useReadingStore.getState().currentSession) beginSession();
        });

        return () => {
            subscription.remove();
            finishSession();
        };
    }, [bookLoaded, bookId, startSession, endSession, updateBook]);

    const handlePreviousPage = async () => {
        if (currentPageIndex > 0 && !pageTransitioning) {
            if (navigationDebounceRef.current) clearTimeout(navigationDebounceRef.current);
            setPageTransitioning(true);
            const newIndex = currentPageIndex - 1;

            navigationDebounceRef.current = setTimeout(async () => {
                setCurrentPageIndex(newIndex);
                if (bookId) {
                    try {
                        await updateBook(bookId, { currentPage: newIndex, totalPages: pages.length || 1 });
                    } catch (error) {
                        console.error('Error updating page:', error);
                    }
                }
                setPageTransitioning(false);
            }, 100);
        }
    };

    const handleNextPage = async () => {
        if (currentPageIndex < pages.length - 1 && !pageTransitioning) {
            if (navigationDebounceRef.current) clearTimeout(navigationDebounceRef.current);
            setPageTransitioning(true);
            const newIndex = currentPageIndex + 1;

            navigationDebounceRef.current = setTimeout(async () => {
                setCurrentPageIndex(newIndex);
                if (bookId) {
                    try {
                        const isCompleted = newIndex >= pages.length - 1;
                        await updateBook(bookId, {
                            currentPage: newIndex,
                            totalPages: pages.length,
                            status: isCompleted ? 'completed' : 'reading',
                        });
                    } catch (error) {
                        console.error('Error updating page:', error);
                    }
                }
                setPageTransitioning(false);
            }, 100);
        }
    };

    const handleBackPress = () => router.back();

    // ─── Progress ─────────────────────────────────────────────────────────────

    const progress = isReadium
        ? readiumTotalPositions > 0 ? (readiumPosition / readiumTotalPositions) * 100 : 0
        : pages.length > 0 ? ((currentPageIndex + 1) / pages.length) * 100 : 0;

    // ─── Loading / error states ───────────────────────────────────────────────

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

    if (!book || (pages.length === 0 && !readiumUri)) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.backRow}>
                    <TouchableOpacity onPress={handleBackPress}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.content}>
                    <Text style={styles.errorText}>Unable to load book</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Main render ──────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ReaderHeader
                title={bookTitle || 'Book'}
                currentPage={isReadium ? readiumPosition : currentPageIndex + 1}
                totalPages={isReadium ? readiumTotalPositions : pages.length}
                epubCurrentPosition={fileType === 'epub' ? readiumPosition : undefined}
                epubTotalPositions={fileType === 'epub' ? readiumTotalPositions : undefined}
                fileType={fileType as 'txt' | 'pdf' | 'epub'}
                onBackPress={handleBackPress}
            />

            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>

            {/* Content area */}
            <View style={styles.contentAreaWrapper}>
                {fileType === 'txt' ? (
                    <ScrollView
                        style={styles.contentArea}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                        key={`page-${currentPageIndex}`}
                        scrollEventThrottle={16}
                        scrollEnabled={!pageTransitioning}
                    >
                        <Text style={styles.pageText} key={`text-${currentPageIndex}`}>
                            {pages[currentPageIndex] || 'Page not found'}
                        </Text>
                    </ScrollView>
                ) : fileType === 'pdf' || fileType === 'epub' ? (
                    <ReadiumReader
                        ref={readiumRef}
                        fileUri={readiumUri}
                        bookId={bookId!}
                        format={fileType}
                        initialLocator={savedLocator}
                        initialPosition={initialPdfPosition}
                        scrollAxis={isPdfHorizontal ? 'horizontal' : 'vertical'}
                        onPositionChange={(current, total) => {
                            setReadiumPosition(current);
                            setReadiumTotalPositions(total);
                        }}
                        onToast={showToast}
                    />
                ) : (
                    <View style={styles.contentArea}>
                        <View style={styles.placeholderContent}>
                            <MaterialIcons name="error-outline" size={64} color={Colors.mediumGray} />
                            <Text style={styles.placeholderText}>Unsupported Format</Text>
                            <Text style={styles.placeholderSubtext}>This file format is not supported</Text>
                        </View>
                    </View>
                )}

                {/* TXT page-turn overlay */}
                {pageTransitioning && fileType === 'txt' && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                )}
            </View>

            {/* Footer — format-specific nav */}
            {fileType !== 'unknown' && (
                <View style={styles.footer}>
                    {fileType === 'txt' && (
                        <TxtNavigation
                            currentPage={currentPageIndex}
                            totalPages={pages.length}
                            isTransitioning={pageTransitioning}
                            onPreviousPage={handlePreviousPage}
                            onNextPage={handleNextPage}
                        />
                    )}

                    {fileType === 'pdf' && (
                        <PdfNavigation
                            isHorizontal={isPdfHorizontal}
                            onToggleOrientation={() => setIsPdfHorizontal(!isPdfHorizontal)}
                            onJumpToPage={() => setShowJumpToPageModal(true)}
                        />
                    )}

                    {fileType === 'epub' && (
                        <EpubNavigationBar readerRef={readiumRef} />
                    )}
                </View>
            )}

            <Toast visible={toast.visible} message={toast.message} type={toast.type} />

            <JumpToPageModal
                visible={showJumpToPageModal}
                currentPage={Math.max(0, readiumPosition - 1)}
                maxPage={readiumTotalPositions}
                onClose={() => setShowJumpToPageModal(false)}
                onJump={(pageNum) => {
                    readiumRef.current?.goToPosition(pageNum);
                    setShowJumpToPageModal(false);
                    showToast(`Jumped to page ${pageNum}`, 'success');
                }}
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    contentAreaWrapper: {
        flex: 1,
        position: 'relative',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
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
    backRow: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        gap: Spacing.md,
    },
});
