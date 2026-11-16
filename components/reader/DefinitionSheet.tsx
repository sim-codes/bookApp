import { BorderRadius, Colors, Spacing, TextStyles, Typography } from '@/constants';
import { dictionary, type LookupResult } from '@/services/dictionary';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_SENSES = 3;

interface DefinitionSheetProps {
    selection: string | null;
    onClose: () => void;
}

type SheetState =
    | { status: 'loading' }
    | { status: 'done'; result: LookupResult }
    | { status: 'failed' };

export function DefinitionSheet({ selection, onClose }: DefinitionSheetProps) {
    const insets = useSafeAreaInsets();
    const [lookup, setLookup] = useState<{ selection: string; state: SheetState } | null>(null);
    const state: SheetState = lookup && lookup.selection === selection ? lookup.state : { status: 'loading' };

    useEffect(() => {
        if (!selection) return;
        let cancelled = false;
        dictionary
            .lookup(selection)
            .then(result => !cancelled && setLookup({ selection, state: { status: 'done', result } }))
            .catch(() => !cancelled && setLookup({ selection, state: { status: 'failed' } }));
        return () => {
            cancelled = true;
        };
    }, [selection]);

    return (
        <Modal transparent animationType="slide" visible={!!selection} onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
                <View style={styles.handle} />
                <View style={styles.header}>
                    <MaterialIcons name="menu-book" size={20} color={Colors.primary} />
                    <Text style={styles.headerTitle}>Dictionary</Text>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close">
                        <MaterialIcons name="close" size={20} color={Colors.textDark} />
                    </TouchableOpacity>
                </View>

                {state.status === 'loading' ? (
                    <ActivityIndicator style={styles.status} color={Colors.primary} />
                ) : state.status === 'failed' ? (
                    <Text style={styles.message}>Couldn&apos;t open the dictionary. Please try again.</Text>
                ) : state.result.words.length === 0 ? (
                    <Text style={styles.message}>
                        No definition found for “{state.result.query}”.
                    </Text>
                ) : (
                    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                        {state.result.words.map(word => (
                            <View key={word.word} style={styles.word}>
                                <Text style={styles.wordTitle}>{word.word}</Text>
                                {word.entries.map(entry => (
                                    <View key={entry.partOfSpeech} style={styles.entry}>
                                        <Text style={styles.partOfSpeech}>{entry.partOfSpeech}</Text>
                                        {entry.senses.slice(0, MAX_SENSES).map((sense, index) => (
                                            <View key={index} style={styles.sense}>
                                                <Text style={styles.senseNumber}>{index + 1}.</Text>
                                                <View style={styles.senseBody}>
                                                    <Text style={styles.definition}>{sense.definition}</Text>
                                                    {sense.example ? (
                                                        <Text style={styles.example}>“{sense.example}”</Text>
                                                    ) : null}
                                                    {sense.synonyms.length ? (
                                                        <Text style={styles.synonyms}>
                                                            Similar: {sense.synonyms.join(', ')}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    sheet: {
        maxHeight: '60%',
        backgroundColor: Colors.white,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.mediumGray,
        marginBottom: Spacing.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingBottom: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.mediumGray,
    },
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontFamily: Typography.fontFamily.semibold,
        color: Colors.textDark,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.lightGray,
        alignItems: 'center',
        justifyContent: 'center',
    },
    status: {
        paddingVertical: Spacing.xxl,
    },
    message: {
        ...TextStyles.body,
        color: Colors.textLight,
        textAlign: 'center',
        paddingVertical: Spacing.xxl,
    },
    body: {
        flexGrow: 0,
    },
    bodyContent: {
        paddingTop: Spacing.md,
        gap: Spacing.lg,
    },
    word: {
        gap: Spacing.sm,
    },
    wordTitle: {
        fontSize: 22,
        fontFamily: Typography.fontFamily.semibold,
        color: Colors.textDark,
    },
    entry: {
        gap: Spacing.sm,
    },
    partOfSpeech: {
        fontSize: 13,
        fontFamily: Typography.fontFamily.regular,
        fontStyle: 'italic',
        color: Colors.primary,
    },
    sense: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    senseNumber: {
        ...TextStyles.body,
        color: Colors.textLight,
        width: 18,
    },
    senseBody: {
        flex: 1,
        gap: 2,
    },
    definition: {
        ...TextStyles.body,
        color: Colors.textDark,
        lineHeight: 22,
    },
    example: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
        fontStyle: 'italic',
        color: Colors.textLight,
        lineHeight: 20,
    },
    synonyms: {
        fontSize: 13,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.darkGray,
        lineHeight: 18,
    },
});
