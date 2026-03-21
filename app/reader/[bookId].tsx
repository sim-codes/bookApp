import { ConfirmationDialog } from '@/components/reader/ConfirmationDialog';
import { EpubNavigationBar, EpubReader, EpubReaderHandle } from '@/components/reader/EpubReader';
import { JumpToPageModal } from '@/components/reader/JumpToPageModal';
import { PdfNavigation } from '@/components/reader/PdfNavigation';
import { ReaderHeader } from '@/components/reader/ReaderHeader';
import { Toast } from '@/components/reader/Toast';
import { TxtNavigation } from '@/components/reader/TxtNavigation';
import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { booksStorage } from '@/services';
import { useBooksStore, useReadingStore } from '@/stores';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PdfReader from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';

type FileType = 'txt' | 'pdf' | 'epub' | 'unknown';

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
    const [pageTransitioning, setPageTransitioning] = useState(false);
    const [isReading, setIsReading] = useState(false);
    const [fileType, setFileType] = useState<FileType>('unknown');
    const [pdfPageCount, setPdfPageCount] = useState(0);
    const [pdfUri, setPdfUri] = useState<string>('');
    const [bookTitle, setBookTitle] = useState('');
    const [isPdfHorizontal, setIsPdfHorizontal] = useState(false);
    const [toast, setToast] = useState<ToastConfig>({ visible: false, message: '', type: 'info' });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
    const [showJumpToPageModal, setShowJumpToPageModal] = useState(false);

    // EPUB position — lifted from EpubReader via onPositionChange
    const [epubCurrentPosition, setEpubCurrentPosition] = useState(0);
    const [epubTotalPositions, setEpubTotalPositions] = useState(0);
    // Saved locator string passed down as initialLocator
    const [savedEpubLocator, setSavedEpubLocator] = useState<string | null>(null);
    // Ref to EpubReader — EpubNavigationBar calls imperative methods on it directly
    const epubRef = useRef<EpubReaderHandle>(null);

    // PDF refs
    const pdfReaderRef = useRef<any>(null);
    const navigationDebounceRef = useRef<number | null>(null);
    const pdfPageChangeDebounceRef = useRef<number | null>(null);
    const lastPdfPageRef = useRef(0);
    const savedInitialPageRef = useRef(0);
    const pdfLoadedRef = useRef(false);

    const book = bookId ? books?.[bookId] : null;

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

    const showConfirm = (message: string, onConfirm: () => void) => {
        setConfirmAction(() => onConfirm);
        setShowConfirmDialog(true);
    };

    useEffect(() => {
        const loadBookContent = async () => {
            try {
                setLoading(true);

                let currentBook = book;
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
                    const lastPage = currentBook.currentPage || 0;
                    setCurrentPageIndex(Math.min(lastPage, bookPages.length - 1));
                } else if (type === 'pdf') {
                    const savedPage = currentBook.currentPage || 0;
                    savedInitialPageRef.current = savedPage;
                    lastPdfPageRef.current = savedPage;
                    setCurrentPageIndex(savedPage);
                    setPdfUri(currentBook.fileUri);
                } else if (type === 'epub') {
                    setSavedEpubLocator(currentBook.epubLocator ?? null);
                    setPdfUri(currentBook.fileUri);
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
    }, [bookId, book]);

    useEffect(() => {
        return () => {
            if (navigationDebounceRef.current) clearTimeout(navigationDebounceRef.current);
            if (pdfPageChangeDebounceRef.current) clearTimeout(pdfPageChangeDebounceRef.current);
        };
    }, []);

    useEffect(() => {
        if (fileType !== 'unknown' && !loading && !isReading && bookId) {
            handleStartReading();
        }
    }, [fileType, loading, isReading, bookId]);

    const splitIntoPages = (content: string): string[] => {
        const charsPerPage = 1500;
        const pageArray: string[] = [];
        for (let i = 0; i < content.length; i += charsPerPage) {
            pageArray.push(content.substring(i, i + charsPerPage));
        }
        return pageArray.length > 0 ? pageArray : [''];
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

            if (bookId) {
                try {
                    const isCompleted =
                        fileType === 'pdf'
                            ? currentPageIndex >= pdfPageCount - 1
                            : currentPageIndex >= pages.length - 1;

                    await updateBook(bookId, {
                        currentPage: fileType === 'epub' ? epubCurrentPosition : currentPageIndex,
                        totalPages:  fileType === 'epub' ? epubTotalPositions  : fileType === 'pdf' ? pdfPageCount : pages.length,
                        status: isCompleted ? 'completed' : 'reading',
                    });
                } catch (error) {
                    console.error('Error updating book on session end:', error);
                }
            }
            showToast('Reading session saved', 'success');
        } catch (error) {
            console.error('Error saving session:', error);
            showToast('Failed to save reading session', 'error');
        }
    };

    const handleEndReadingAndClose = async () => {
        await handleEndReading();
        setTimeout(() => router.back(), 500);
    };

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

    const handlePdfPageChange = (page: number) => {
        if (!pdfLoadedRef.current) return;
        if (pdfPageChangeDebounceRef.current) clearTimeout(pdfPageChangeDebounceRef.current);

        const newPageIndex = page - 1;
        if (Math.abs(newPageIndex - lastPdfPageRef.current) > 0) {
            lastPdfPageRef.current = newPageIndex;
            setCurrentPageIndex(newPageIndex);

            pdfPageChangeDebounceRef.current = setTimeout(() => {
                if (bookId) {
                    updateBook(bookId, { currentPage: newPageIndex, totalPages: pdfPageCount || 1 }).catch(
                        error => console.error('Error updating PDF page:', error),
                    );
                }
            }, 300);
        }
    };

    const jumpToPdfPage = (pageNum: number) => {
        if (pdfReaderRef.current?.setPage) pdfReaderRef.current.setPage(pageNum);
        setCurrentPageIndex(pageNum - 1);
        lastPdfPageRef.current = pageNum - 1;
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

    // ─── Progress ─────────────────────────────────────────────────────────────

    const progress =
        fileType === 'pdf'
            ? pdfPageCount > 0 ? ((currentPageIndex + 1) / pdfPageCount) * 100 : 0
            : fileType === 'epub'
            ? epubTotalPositions > 0 ? (epubCurrentPosition / epubTotalPositions) * 100 : 0
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

    if (!book || (pages.length === 0 && !pdfUri)) {
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
                currentPage={currentPageIndex + 1}
                totalPages={
                    fileType === 'pdf' ? pdfPageCount
                    : fileType === 'epub' ? epubTotalPositions
                    : pages.length
                }
                epubCurrentPosition={fileType === 'epub' ? epubCurrentPosition : undefined}
                epubTotalPositions={fileType === 'epub' ? epubTotalPositions : undefined}
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
                ) : fileType === 'pdf' ? (
                    <PdfReader
                        ref={pdfReaderRef}
                        source={{ uri: pdfUri, cache: true }}
                        onLoadComplete={(numberOfPages) => {
                            setPdfPageCount(numberOfPages);
                            const savedPage = savedInitialPageRef.current;
                            if (savedPage > 0 && pdfReaderRef.current?.setPage) {
                                setTimeout(() => {
                                    pdfReaderRef.current?.setPage?.(savedPage + 1);
                                    pdfLoadedRef.current = true;
                                }, 300);
                            } else {
                                pdfLoadedRef.current = true;
                            }
                        }}
                        onPageChanged={handlePdfPageChange}
                        style={styles.pdfViewer}
                        onError={() => showToast('Error loading PDF', 'error')}
                        enablePaging
                        horizontal={isPdfHorizontal}
                    />
                ) : fileType === 'epub' ? (
                    <EpubReader
                        ref={epubRef}
                        fileUri={pdfUri}
                        bookId={bookId!}
                        initialLocator={savedEpubLocator}
                        onPositionChange={(current, total) => {
                            setEpubCurrentPosition(current);
                            setEpubTotalPositions(total);
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

            {/* Footer — session button + format-specific nav */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.sessionButton, isReading && styles.sessionButtonActive]}
                    onPress={isReading ? handleEndReadingAndClose : handleStartReading}
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
                    <EpubNavigationBar epubRef={epubRef} />
                )}
            </View>

            <Toast visible={toast.visible} message={toast.message} type={toast.type} />

            <ConfirmationDialog
                visible={showConfirmDialog}
                title="End Reading?"
                message="Do you want to save your reading session?"
                onCancel={() => {
                    setShowConfirmDialog(false);
                    router.back();
                }}
                onConfirm={() => confirmAction()}
                confirmText="Save"
                cancelText="Discard"
            />

            <JumpToPageModal
                visible={showJumpToPageModal}
                currentPage={currentPageIndex}
                maxPage={pdfPageCount}
                onClose={() => setShowJumpToPageModal(false)}
                onJump={(pageNum) => {
                    jumpToPdfPage(pageNum);
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
});
