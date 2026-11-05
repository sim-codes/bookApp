import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { useBooksStore } from '@/stores';
import { MaterialIcons } from '@expo/vector-icons';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { Link, Locator, Preferences, PublicationReadyEvent, ReadiumViewRef } from 'react-native-readium';
import { ReadiumView } from 'react-native-readium';

// ─── Imperative handle ────────────────────────────────────────────────────────

export interface ReadiumReaderHandle {
    goForward: () => void;
    goBackward: () => void;
    goToPosition: (position: number) => void;
    openToc: () => void;
    increaseFontSize: () => void;
    decreaseFontSize: () => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReadiumReaderProps {
    fileUri: string;
    bookId: string;
    format: 'epub' | 'pdf';
    initialLocator: string | null;
    initialPosition?: number;
    scrollAxis?: 'horizontal' | 'vertical';
    onPositionChange: (current: number, total: number) => void;
    onToast: (message: string, type: 'error' | 'success' | 'info') => void;
}

// Readium's PDF adapter reports every page one too high, so page 1 arrives as position 2.
const pdfPageFromReported = (reported: number): number => Math.max(1, reported - 1);

// ─── Component ────────────────────────────────────────────────────────────────

export const ReadiumReader = forwardRef<ReadiumReaderHandle, ReadiumReaderProps>(function ReadiumReader(
    { fileUri, bookId, format, initialLocator, initialPosition, scrollAxis = 'vertical', onPositionChange, onToast },
    ref,
) {
    const { updateBook } = useBooksStore();

    const [locator, setLocator] = useState<Locator | null>(() => {
        if (!initialLocator) return null;
        try {
            const parsed = JSON.parse(initialLocator);
            // Older entries may hold an empty '{}' locator, which can't be navigated to.
            return parsed?.href ? parsed : null;
        } catch {
            return null;
        }
    });
    const [totalPositions, setTotalPositions] = useState(0);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [fontSize, setFontSize] = useState(1);
    const [tableOfContents, setTableOfContents] = useState<Link[]>([]);
    const [showTocModal, setShowTocModal] = useState(false);

    const readiumRef = useRef<ReadiumViewRef>(null);
    const positionsRef = useRef<Locator[]>([]);
    const locatorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [drawerAnim] = useState(() => new Animated.Value(-350));

    const preferences: Preferences =
        format === 'pdf' ? { scroll: true, scrollAxis } : { fontSize };

    const goToPosition = useCallback((position: number) => {
        const positions = positionsRef.current;
        const page = Math.min(Math.max(1, Math.round(position)), positions.length);
        if (page < 1) return;

        if (format !== 'pdf') {
            readiumRef.current?.goTo(positions[page - 1]);
        } else if (page < positions.length) {
            readiumRef.current?.goTo(positions[page]);
        } else {
            // There is no locator past the last one, so land on the page before and step forward.
            readiumRef.current?.goTo(positions[page - 1]);
            setTimeout(() => readiumRef.current?.goForward(), 300);
        }
    }, [format]);

    // Expose actions to parent via ref — no state updates in parent render
    useImperativeHandle(ref, () => ({
        goForward: () => readiumRef.current?.goForward(),
        goBackward: () => readiumRef.current?.goBackward(),
        goToPosition,
        openToc: () => setShowTocModal(true),
        increaseFontSize: () => setFontSize(prev => Math.min(2, prev + 0.25)),
        decreaseFontSize: () => setFontSize(prev => Math.max(0.75, prev - 0.25)),
    }), [goToPosition]);

    // Keep the latest callback in a ref so the parent can pass an inline function
    // without re-triggering the position effect on every render.
    const onPositionChangeRef = useRef(onPositionChange);
    useEffect(() => {
        onPositionChangeRef.current = onPositionChange;
    });

    useEffect(() => {
        onPositionChangeRef.current(currentPosition, totalPositions);
    }, [currentPosition, totalPositions]);

    useEffect(() => {
        Animated.timing(drawerAnim, {
            toValue: showTocModal ? 0 : -350,
            duration: showTocModal ? 280 : 250,
            useNativeDriver: true,
        }).start();
    }, [showTocModal, drawerAnim]);

    // The latest locator not yet written to storage, saved immediately if the reader closes.
    const pendingLocatorRef = useRef<Locator | null>(null);

    const saveLocator = useCallback(() => {
        const pending = pendingLocatorRef.current;
        if (!pending) return;
        pendingLocatorRef.current = null;
        updateBook(bookId, { epubLocator: JSON.stringify(pending) }).catch(console.error);
    }, [bookId, updateBook]);

    useEffect(() => {
        return () => {
            if (locatorDebounceRef.current) clearTimeout(locatorDebounceRef.current);
            saveLocator();
        };
    }, [saveLocator]);

    const handleLocationChange = (locator: Locator) => {
        const reported = locator?.locations?.position ?? 0;
        setCurrentPosition(format === 'pdf' ? pdfPageFromReported(reported) : reported);
        setLocator(locator);
        pendingLocatorRef.current = locator;
        if (locatorDebounceRef.current) clearTimeout(locatorDebounceRef.current);
        locatorDebounceRef.current = setTimeout(saveLocator, 500);
    };

    const handlePublicationReady = (event: PublicationReadyEvent) => {
        positionsRef.current = event.positions ?? [];
        const total = positionsRef.current.length;
        setTotalPositions(total);
        setTableOfContents(event.tableOfContents ?? []);

        if (format === 'pdf') {
            const savedPosition = locator?.locations?.position;
            const page = savedPosition ? pdfPageFromReported(savedPosition) : initialPosition ?? 1;
            if (page > 1) setTimeout(() => goToPosition(page), 500);
        } else if (locator && readiumRef.current?.goTo) {
            setTimeout(() => readiumRef.current?.goTo(locator!), 500);
        }
    };

    const handleTocSelect = (href: string) => {
        readiumRef.current?.goTo({ href, type: 'application/xhtml+xml' });
        setShowTocModal(false);
        onToast('Navigated to chapter', 'success');
    };

    return (
        <>
            <ReadiumView
                ref={readiumRef}
                file={{ url: fileUri }}
                preferences={preferences}
                onLocationChange={handleLocationChange}
                onPublicationReady={handlePublicationReady}
                style={styles.readiumView}
            />

            {showTocModal && (
                <View style={styles.drawerOverlay}>
                    <Animated.View
                        style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}
                    >
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

                        {tableOfContents.length > 0 && (
                            <View style={styles.tocMeta}>
                                <Text style={styles.tocMetaText}>
                                    {tableOfContents.length}{' '}
                                    {tableOfContents.length === 1 ? 'chapter' : 'chapters'}
                                </Text>
                            </View>
                        )}

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
                                        onSelect={handleTocSelect}
                                    />
                                ))
                            ) : (
                                <View style={styles.tocEmptyContainer}>
                                    <MaterialIcons name="chrome-reader-mode" size={48} color={Colors.mediumGray} />
                                    <Text style={styles.tocEmptyTitle}>No chapters found</Text>
                                    <Text style={styles.tocEmptyText}>
                                        This book doesn&apos;t have a table of contents
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </Animated.View>

                    <TouchableOpacity
                        style={styles.drawerBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowTocModal(false)}
                    />
                </View>
            )}
        </>
    );
});

// ─── Navigation Bar ───────────────────────────────────────────────────────────

interface EpubNavigationBarProps {
    readerRef: React.RefObject<ReadiumReaderHandle | null>;
}

export function EpubNavigationBar({ readerRef }: EpubNavigationBarProps) {
    return (
        <View style={styles.epubNavigation}>
            <TouchableOpacity style={styles.epubNavBtn} onPress={() => readerRef.current?.openToc()}>
                <MaterialIcons name="menu-book" size={20} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.epubNavBtn} onPress={() => readerRef.current?.decreaseFontSize()}>
                <Text style={styles.fontSizeLabel}>A−</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.epubNavBtn} onPress={() => readerRef.current?.increaseFontSize()}>
                <Text style={[styles.fontSizeLabel, styles.fontSizeLabelLg]}>A+</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.epubNavBtn} onPress={() => readerRef.current?.goBackward()}>
                <MaterialIcons name="arrow-back-ios" size={20} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.epubNavBtn} onPress={() => readerRef.current?.goForward()}>
                <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.primary} />
            </TouchableOpacity>
        </View>
    );
}

// ─── TOC Item ─────────────────────────────────────────────────────────────────

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
                style={[styles.tocItem, depth === 0 && styles.tocItemTop, { paddingLeft: 20 + depth * 16 }]}
                activeOpacity={0.65}
                onPress={() => hasChildren ? setExpanded(prev => !prev) : onSelect(item.href)}
            >
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

                {hasChildren ? (
                    <MaterialIcons
                        name={expanded ? 'expand-less' : 'expand-more'}
                        size={20}
                        color={Colors.primary}
                        style={styles.tocChevron}
                    />
                ) : (
                    <MaterialIcons name="chevron-right" size={18} color={Colors.mediumGray} style={styles.tocChevron} />
                )}
            </TouchableOpacity>

            {expanded && item.children?.map((child, idx) => (
                <TOCItem key={idx} item={child} onSelect={onSelect} depth={depth + 1} index={idx} />
            ))}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    readiumView: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.lightGray,
    },
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
    drawerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
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
    tocList: {
        flex: 1,
    },
    tocListContent: {
        paddingBottom: 24,
    },
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
        backgroundColor: Colors.primary + '15',
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
