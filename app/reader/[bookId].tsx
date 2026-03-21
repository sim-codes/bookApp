import { ConfirmationDialog } from '@/components/reader/ConfirmationDialog';
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
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import PdfReader from 'react-native-pdf';
import type { Link, Locator, PublicationReadyEvent, ReadiumViewRef } from 'react-native-readium';
import { ReadiumView } from 'react-native-readium';
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
    const [toast, setToast] = useState<ToastConfig>({
        visible: false,
        message: '',
        type: 'info',
    });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
    const [showJumpToPageModal, setShowJumpToPageModal] = useState(false);

    // Refs for PDF management — imperative control, no prop feedback loop
    const pdfReaderRef = useRef<any>(null);
    const navigationDebounceRef = useRef<number | null>(null);
    const pdfPageChangeDebounceRef = useRef<number | null>(null);
    const lastPdfPageRef = useRef(0);
    const savedInitialPageRef = useRef(0);
    const pdfLoadedRef = useRef(false);

    const readiumRef = useRef<ReadiumViewRef>(null);
    const [epubLocator, setEpubLocator] = useState<Locator | null>(null);
    const [epubTotalPositions, setEpubTotalPositions] = useState(0);
    const [epubCurrentPosition, setEpubCurrentPosition] = useState(0);
    const epubLocatorDebounceRef = useRef<number | null>(null);
    const [epubFontSize, setEpubFontSize] = useState(1);
    const [tableOfContents, setTableOfContents] = useState<Link[]>([]);
    const [showTocModal, setShowTocModal] = useState(false);
    const drawerAnim = useRef(new Animated.Value(-350)).current;

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
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
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
                    console.log('Book not in store, loading from storage:', bookId);
                    currentBook = await booksStorage.get(bookId);
                }

                if (!currentBook?.fileUri) {
                    console.log('Book or fileUri not found:', { currentBook, bookId });
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
                    const savedLocatorStr = currentBook.epubLocator;
                    if (savedLocatorStr) {
                        try {
                            setEpubLocator(JSON.parse(savedLocatorStr));
                        } catch {
                            setEpubLocator(null);
                        }
                    }
                    setPdfUri(currentBook.fileUri);
                } else {
                    showToast('Unsupported file format', 'error');
                    setPages(['Unsupported file format']);
                }
            } catch (error) {
                console.error('Error reading book:', error);
                showToast(`Failed to load book: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                setPages(['Error loading content']);
            } finally {
                setLoading(false);
            }
        };

        loadBookContent();
    }, [bookId, book]);

    // Animate drawer open/close — slides from left
    useEffect(() => {
        if (showTocModal) {
            Animated.timing(drawerAnim, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(drawerAnim, {
                toValue: -350,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [showTocModal, drawerAnim]);

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
                    const isCompleted = fileType === 'pdf'
                        ? currentPageIndex >= pdfPageCount - 1
                        : currentPageIndex >= pages.length - 1;

                    await updateBook(bookId, {
                        currentPage: fileType === 'epub' ? 0 : currentPageIndex,
                        epubLocator: fileType === 'epub' ? JSON.stringify(epubLocator) : undefined,
                        totalPages: fileType === 'pdf' ? pdfPageCount : pages.length,
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
        setTimeout(() => {
            router.back();
        }, 500);
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
                        await updateBook(bookId, {
                            currentPage: newIndex,
                            totalPages: pages.length || 1,
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
        const pageChange = Math.abs(newPageIndex - lastPdfPageRef.current);

        if (pageChange > 0) {
            lastPdfPageRef.current = newPageIndex;
            setCurrentPageIndex(newPageIndex);

            pdfPageChangeDebounceRef.current = setTimeout(() => {
                if (bookId) {
                    updateBook(bookId, {
                        currentPage: newPageIndex,
                        totalPages: pdfPageCount || 1,
                    }).catch((error) => {
                        console.error('Error updating PDF page:', error);
                    });
                }
            }, 300);
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

    const jumpToPdfPage = (pageNum: number) => {
        if (pdfReaderRef.current?.setPage) {
            pdfReaderRef.current.setPage(pageNum);
        }
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
                <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.lightGray, flexDirection: 'row', alignItems: 'center' }}>
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

    const progress = fileType === 'pdf'
        ? pdfPageCount > 0 ? ((currentPageIndex + 1) / pdfPageCount) * 100 : 0
        : fileType === 'epub'
        ? epubTotalPositions > 0 ? (epubCurrentPosition / epubTotalPositions) * 100 : 0
        : pages.length > 0 ? ((currentPageIndex + 1) / pages.length) * 100 : 0;

    const currentPage = pages[currentPageIndex] || '';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ReaderHeader
                title={bookTitle || 'Book'}
                currentPage={currentPageIndex + 1}
                totalPages={fileType === 'pdf' ? pdfPageCount : fileType === 'epub' ? epubTotalPositions : pages.length}
                epubCurrentPosition={fileType === 'epub' ? epubCurrentPosition : undefined}
                epubTotalPositions={fileType === 'epub' ? epubTotalPositions : undefined}
                fileType={fileType as 'txt' | 'pdf' | 'epub'}
                onBackPress={handleBackPress}
            />

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>

            {/* Content Area */}
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
                            {currentPage || 'Page not found'}
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
                        onError={(error) => {
                            console.error('PDF rendering error:', error);
                            showToast('Error loading PDF', 'error');
                        }}
                        enablePaging={true}
                        horizontal={isPdfHorizontal}
                    />
                ) : fileType === 'epub' ? (
                    <ReadiumView
                        ref={readiumRef}
                        file={{ url: pdfUri }}
                        preferences={{ fontSize: epubFontSize }}
                        onLocationChange={(locator) => {
                            const pos = locator?.locations?.position ?? 0;
                            setEpubCurrentPosition(pos);

                            if (epubLocatorDebounceRef.current) {
                                clearTimeout(epubLocatorDebounceRef.current);
                            }
                            epubLocatorDebounceRef.current = setTimeout(() => {
                                if (bookId) {
                                    updateBook(bookId, {
                                        epubLocator: JSON.stringify(locator),
                                    }).catch(console.error);
                                }
                            }, 500);
                        }}
                        onPublicationReady={(event: PublicationReadyEvent) => {
                            setEpubTotalPositions(event.positions?.length ?? 0);
                            setTableOfContents(event.tableOfContents ?? []);
                            if (epubLocator && readiumRef.current?.goTo) {
                                setTimeout(() => {
                                    readiumRef.current?.goTo(epubLocator);
                                }, 500);
                            }
                        }}
                        style={styles.pdfViewer}
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

                {/* Loading Overlay — TXT transitions only */}
                {pageTransitioning && fileType === 'txt' && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                )}

                {/* ─── Table of Contents Drawer ───────────────────────────────────────
                    Layout: [drawer][backdrop] in a row.
                    Drawer is FIRST so it appears on the LEFT side of the screen.
                    drawerAnim starts at -350 (off-screen left) and animates to 0.
                ──────────────────────────────────────────────────────────────────── */}
                {showTocModal && (
                    <View style={styles.drawerOverlay}>
                        {/* Drawer on the LEFT */}
                        <Animated.View
                            style={[
                                styles.drawer,
                                { transform: [{ translateX: drawerAnim }] },
                            ]}
                        >
                            {/* Header */}
                            <View style={styles.tocHeader}>
                                <View style={styles.tocHeaderLeft}>
                                    <MaterialIcons name="menu-book" size={22} color={Colors.primary} />
                                    <Text style={styles.tocTitle}>Contents</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.tocCloseBtn}
                                    onPress={() => setShowTocModal(false)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <MaterialIcons name="close" size={20} color={Colors.primary} />
                                </TouchableOpacity>
                            </View>

                            {/* Chapter count badge */}
                            {tableOfContents.length > 0 && (
                                <View style={styles.tocMeta}>
                                    <Text style={styles.tocMetaText}>
                                        {tableOfContents.length} {tableOfContents.length === 1 ? 'chapter' : 'chapters'}
                                    </Text>
                                </View>
                            )}

                            {/* TOC list */}
                            <ScrollView
                                style={styles.tocList}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.tocListContent}
                            >
                                {tableOfContents.length > 0 ? (
                                    tableOfContents.map((item, index) => (
                                        <TOCItem
                                            key={index}
                                            item={item}
                                            index={index}
                                            onSelect={(href) => {
                                                const locator: Locator = {
                                                    href,
                                                    type: 'application/xhtml+xml',
                                                };
                                                readiumRef.current?.goTo(locator);
                                                setShowTocModal(false);
                                                showToast('Navigated to chapter', 'success');
                                            }}
                                        />
                                    ))
                                ) : (
                                    <View style={styles.tocEmptyContainer}>
                                        <MaterialIcons name="chrome-reader-mode" size={48} color={Colors.mediumGray} />
                                        <Text style={styles.tocEmptyTitle}>No chapters found</Text>
                                        <Text style={styles.tocEmptyText}>
                                            This book doesn't have a table of contents
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        </Animated.View>

                        {/* Backdrop on the RIGHT — tapping closes the drawer */}
                        <TouchableOpacity
                            style={styles.drawerBackdrop}
                            activeOpacity={1}
                            onPress={() => setShowTocModal(false)}
                        />
                    </View>
                )}
            </View>

            {/* Navigation Footer */}
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
                    <View style={styles.epubNavigation}>
                        {/* TOC button */}
                        <TouchableOpacity
                            style={styles.epubNavBtn}
                            onPress={() => setShowTocModal(true)}
                        >
                            <MaterialIcons name="menu-book" size={20} color={Colors.primary} />
                        </TouchableOpacity>

                        {/* Font size decrease */}
                        <TouchableOpacity
                            style={styles.epubNavBtn}
                            onPress={() => setEpubFontSize(prev => Math.max(0.75, prev - 0.25))}
                        >
                            <Text style={styles.fontSizeLabel}>A−</Text>
                        </TouchableOpacity>

                        {/* Font size increase */}
                        <TouchableOpacity
                            style={styles.epubNavBtn}
                            onPress={() => setEpubFontSize(prev => Math.min(2, prev + 0.25))}
                        >
                            <Text style={[styles.fontSizeLabel, styles.fontSizeLabelLg]}>A+</Text>
                        </TouchableOpacity>

                        {/* Previous page */}
                        <TouchableOpacity
                            style={styles.epubNavBtn}
                            onPress={() => readiumRef.current?.goBackward()}
                        >
                            <MaterialIcons name="arrow-back-ios" size={20} color={Colors.primary} />
                        </TouchableOpacity>

                        {/* Next page */}
                        <TouchableOpacity
                            style={styles.epubNavBtn}
                            onPress={() => readiumRef.current?.goForward()}
                        >
                            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
            />

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

// ─── TOC Item Component ────────────────────────────────────────────────────────

function TOCItem({
    item,
    onSelect,
    depth = 0,
    index = 0,
}: {
    item: Link;
    onSelect: (href: string) => void;
    depth?: number;
    index?: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = (item.children?.length ?? 0) > 0;

    return (
        <View>
            <TouchableOpacity
                style={[
                    styles.tocItem,
                    depth === 0 && styles.tocItemTop,
                    { paddingLeft: 20 + depth * 16 },
                ]}
                activeOpacity={0.65}
                onPress={() => {
                    if (hasChildren) {
                        setExpanded(!expanded);
                    } else {
                        onSelect(item.href);
                    }
                }}
            >
                {/* Chapter number badge for top-level items */}
                {depth === 0 && (
                    <View style={styles.tocChapterBadge}>
                        <Text style={styles.tocChapterNum}>{index + 1}</Text>
                    </View>
                )}

                <Text
                    style={[
                        styles.tocItemText,
                        depth === 0 && styles.tocItemTextTop,
                        depth > 0 && styles.tocItemTextSub,
                    ]}
                    numberOfLines={2}
                >
                    {item.title || 'Untitled'}
                </Text>

                {hasChildren && (
                    <MaterialIcons
                        name={expanded ? 'expand-less' : 'expand-more'}
                        size={20}
                        color={Colors.primary}
                        style={styles.tocChevron}
                    />
                )}

                {!hasChildren && (
                    <MaterialIcons
                        name="chevron-right"
                        size={18}
                        color={Colors.mediumGray}
                        style={styles.tocChevron}
                    />
                )}
            </TouchableOpacity>

            {expanded &&
                item.children?.map((child, idx) => (
                    <TOCItem
                        key={idx}
                        item={child}
                        onSelect={onSelect}
                        depth={depth + 1}
                        index={idx}
                    />
                ))}
        </View>
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

    // ── EPUB navigation bar ──────────────────────────────────────────────────
    epubNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    epubNavBtn: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    fontSizeLabel: {
        fontSize: 15,
        color: Colors.primary,
        fontWeight: '700',
    },
    fontSizeLabelLg: {
        fontSize: 17,
    },

    // ── Drawer overlay ───────────────────────────────────────────────────────
    drawerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',   // [drawer | backdrop]
        zIndex: 1000,
    },
    drawerBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    drawer: {
        width: 310,
        backgroundColor: Colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
    },

    // ── TOC header ───────────────────────────────────────────────────────────
    tocHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.lightGray,
    },
    tocHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    tocTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textDark,
        letterSpacing: 0.2,
    },
    tocCloseBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.lightGray,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── TOC meta (chapter count) ─────────────────────────────────────────────
    tocMeta: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.lightGray,
    },
    tocMetaText: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },

    // ── TOC list ─────────────────────────────────────────────────────────────
    tocList: {
        flex: 1,
    },
    tocListContent: {
        paddingBottom: 24,
    },

    // ── TOC items ────────────────────────────────────────────────────────────
    tocItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingRight: 16,
        gap: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.lightGray,
    },
    tocItemTop: {
        paddingVertical: 15,
    },
    tocChapterBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary + '15', // primary at ~8% opacity
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    tocChapterNum: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
    },
    tocItemText: {
        ...TextStyles.body,
        color: Colors.textDark,
        flex: 1,
        lineHeight: 20,
    },
    tocItemTextTop: {
        fontSize: 15,
        fontWeight: '500',
    },
    tocItemTextSub: {
        fontSize: 14,
        color: Colors.textLight,
    },
    tocChevron: {
        flexShrink: 0,
    },

    // ── TOC empty state ──────────────────────────────────────────────────────
    tocEmptyContainer: {
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: 24,
        gap: 12,
    },
    tocEmptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textDark,
    },
    tocEmptyText: {
        ...TextStyles.body,
        color: Colors.textLight,
        textAlign: 'center',
        lineHeight: 20,
    },
});
