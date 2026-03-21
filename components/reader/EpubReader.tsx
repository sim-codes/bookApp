import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { useBooksStore } from '@/stores';
import { MaterialIcons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { Link, Locator, PublicationReadyEvent, ReadiumViewRef } from 'react-native-readium';
import { ReadiumView } from 'react-native-readium';

// ─── Imperative handle ────────────────────────────────────────────────────────

export interface EpubReaderHandle {
    goForward: () => void;
    goBackward: () => void;
    openToc: () => void;
    increaseFontSize: () => void;
    decreaseFontSize: () => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface EpubReaderProps {
    fileUri: string;
    bookId: string;
    initialLocator: string | null;
    onPositionChange: (current: number, total: number) => void;
    onToast: (message: string, type: 'error' | 'success' | 'info') => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EpubReader = forwardRef<EpubReaderHandle, EpubReaderProps>(function EpubReader(
    { fileUri, bookId, initialLocator, onPositionChange, onToast },
    ref,
) {
    const { updateBook } = useBooksStore();

    const [epubLocator, setEpubLocator] = useState<Locator | null>(() => {
        if (!initialLocator) return null;
        try { return JSON.parse(initialLocator); } catch { return null; }
    });
    const [epubTotalPositions, setEpubTotalPositions] = useState(0);
    const [epubCurrentPosition, setEpubCurrentPosition] = useState(0);
    const [epubFontSize, setEpubFontSize] = useState(1);
    const [tableOfContents, setTableOfContents] = useState<Link[]>([]);
    const [showTocModal, setShowTocModal] = useState(false);

    const readiumRef = useRef<ReadiumViewRef>(null);
    const epubLocatorDebounceRef = useRef<number | null>(null);
    const drawerAnim = useRef(new Animated.Value(-350)).current;

    // Expose actions to parent via ref — no state updates in parent render
    useImperativeHandle(ref, () => ({
        goForward: () => readiumRef.current?.goForward(),
        goBackward: () => readiumRef.current?.goBackward(),
        openToc: () => setShowTocModal(true),
        increaseFontSize: () => setEpubFontSize(prev => Math.min(2, prev + 0.25)),
        decreaseFontSize: () => setEpubFontSize(prev => Math.max(0.75, prev - 0.25)),
    }), []);

    useEffect(() => {
        onPositionChange(epubCurrentPosition, epubTotalPositions);
    }, [epubCurrentPosition, epubTotalPositions]);

    useEffect(() => {
        Animated.timing(drawerAnim, {
            toValue: showTocModal ? 0 : -350,
            duration: showTocModal ? 280 : 250,
            useNativeDriver: true,
        }).start();
    }, [showTocModal, drawerAnim]);

    useEffect(() => {
        return () => {
            if (epubLocatorDebounceRef.current) clearTimeout(epubLocatorDebounceRef.current);
        };
    }, []);

    const handleLocationChange = (locator: Locator) => {
        const pos = locator?.locations?.position ?? 0;
        setEpubCurrentPosition(pos);
        setEpubLocator(locator);
        if (epubLocatorDebounceRef.current) clearTimeout(epubLocatorDebounceRef.current);
        epubLocatorDebounceRef.current = setTimeout(() => {
            updateBook(bookId, { epubLocator: JSON.stringify(locator) }).catch(console.error);
        }, 500);
    };

    const handlePublicationReady = (event: PublicationReadyEvent) => {
        const total = event.positions?.length ?? 0;
        setEpubTotalPositions(total);
        setTableOfContents(event.tableOfContents ?? []);
        if (epubLocator && readiumRef.current?.goTo) {
            setTimeout(() => readiumRef.current?.goTo(epubLocator!), 500);
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
                preferences={{ fontSize: epubFontSize }}
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
                                        This book doesn't have a table of contents
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
    epubRef: React.RefObject<EpubReaderHandle>;
}

export function EpubNavigationBar({ epubRef }: EpubNavigationBarProps) {
    return (
        <View style={styles.epubNavigation}>
            <TouchableOpacity style={styles.epubNavBtn} onPress={() => epubRef.current?.openToc()}>
                <MaterialIcons name="menu-book" size={20} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.epubNavBtn} onPress={() => epubRef.current?.decreaseFontSize()}>
                <Text style={styles.fontSizeLabel}>A−</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.epubNavBtn} onPress={() => epubRef.current?.increaseFontSize()}>
                <Text style={[styles.fontSizeLabel, styles.fontSizeLabelLg]}>A+</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.epubNavBtn} onPress={() => epubRef.current?.goBackward()}>
                <MaterialIcons name="arrow-back-ios" size={20} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.epubNavBtn} onPress={() => epubRef.current?.goForward()}>
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
