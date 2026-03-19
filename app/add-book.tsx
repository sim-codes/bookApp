import { BorderRadius, Colors, Spacing, TextStyles } from '@/constants';
import { useBooksStore } from '@/stores';
import { Book } from '@/types';
import { generateId } from '@/utils';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'Other'];

export default function AddBookScreen() {
    const router = useRouter();
    const { addBook } = useBooksStore();

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [coverUri, setCoverUri] = useState<string | null>(null);
    const [fileUri, setFileUri] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBasicMode, setIsBasicMode] = useState(true);

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain'],
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setFileUri(asset.uri);
                setFileName(asset.name || 'book-file');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick file');
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaType.Images,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setCoverUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleAddBook = async () => {
        // Validation - only title and file are required
        if (!title.trim()) {
            Alert.alert('Missing Title', 'Please enter a book title');
            return;
        }

        if (!fileUri) {
            Alert.alert('Missing Book File', 'Please select a book file (PDF or TXT)');
            return;
        }

        setIsLoading(true);

        try {
            const newBook: Book = {
                id: generateId(),
                title: title.trim(),
                author: author.trim() || 'Unknown Author',
                genre: selectedGenre || 'Unknown',
                coverUri: coverUri || undefined,
                fileUri,
                fileName,
                totalPages: Math.floor(Math.random() * 400) + 50,
                currentPage: 0,
                status: 'reading',
                addedDate: new Date().toISOString().split('T')[0],
            };

            await addBook(newBook);
            Alert.alert('Success', `"${newBook.title}" added to your library!`, [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to add book. Please try again.');
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

            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
                <TouchableOpacity
                    style={[styles.modeButton, isBasicMode && styles.modeButtonActive]}
                    onPress={() => setIsBasicMode(true)}
                >
                    <Text style={[styles.modeButtonText, isBasicMode && styles.modeButtonTextActive]}>
                        Basic
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, !isBasicMode && styles.modeButtonActive]}
                    onPress={() => setIsBasicMode(false)}
                >
                    <Text style={[styles.modeButtonText, !isBasicMode && styles.modeButtonTextActive]}>
                        Full
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Cover Image Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Book Cover (Optional)</Text>
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.7}>
                        {coverUri && coverUri !== '' ? (
                            <Image
                                key={coverUri}
                                source={{ uri: coverUri }}
                                style={styles.coverImage}
                                onError={() => console.log('Image load error')}
                            />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <MaterialIcons name="image-not-supported" size={48} color={Colors.mediumGray} />
                                <Text style={styles.imageText}>Tap to add cover</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Title Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>Book Title *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter book title"
                        placeholderTextColor={Colors.mediumGray}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Full Mode - Show Author and Genre */}
                {!isBasicMode && (
                    <>
                        {/* Author Input */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Author</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter author name"
                                placeholderTextColor={Colors.mediumGray}
                                value={author}
                                onChangeText={setAuthor}
                            />
                        </View>

                        {/* Genre Selection */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Genre</Text>
                            <View style={styles.genreGrid}>
                                {GENRES.map((genre) => (
                                    <TouchableOpacity
                                        key={genre}
                                        style={[
                                            styles.genreButton,
                                            selectedGenre === genre && styles.genreButtonActive,
                                        ]}
                                        onPress={() => setSelectedGenre(genre)}
                                    >
                                        <Text
                                            style={[
                                                styles.genreButtonText,
                                                selectedGenre === genre && styles.genreButtonTextActive,
                                            ]}
                                        >
                                            {genre}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {/* File Picker */}
                <View style={styles.section}>
                    <Text style={styles.label}>Book File (PDF or TXT) *</Text>
                    <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
                        <MaterialIcons
                            name={fileUri ? 'check-circle' : 'file-upload'}
                            size={24}
                            color={fileUri ? Colors.primary : Colors.mediumGray}
                        />
                        <View style={styles.filePickerText}>
                            <Text style={styles.filePickerLabel}>
                                {fileUri ? 'File Selected' : 'Select Book File'}
                            </Text>
                            {fileName && (
                                <Text style={styles.filePickerSubtitle} numberOfLines={1}>
                                    {fileName}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleAddBook}
                    disabled={isLoading}
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
    sectionLabel: {
        ...TextStyles.h4,
        color: Colors.textDark,
        marginBottom: Spacing.md,
    },
    label: {
        ...TextStyles.body,
        color: Colors.textDark,
        fontWeight: '600',
        marginBottom: Spacing.md,
    },
    input: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.mediumGray,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: 16,
        color: Colors.textDark,
    },
    imagePicker: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.lightGray,
        borderStyle: 'dashed',
    },
    coverImage: {
        width: '100%',
        height: 240,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    imageText: {
        ...TextStyles.bodySmall,
        color: Colors.darkGray,
        marginTop: Spacing.md,
    },
    genreGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    genreButton: {
        flex: 1,
        minWidth: '45%',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.mediumGray,
        alignItems: 'center',
    },
    genreButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    genreButtonText: {
        ...TextStyles.body,
        color: Colors.textDark,
        fontWeight: '600',
    },
    genreButtonTextActive: {
        color: Colors.white,
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
        fontWeight: '600',
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
        fontWeight: '700',
    },
    spacer: {
        height: Spacing.xl,
    },
    modeToggle: {
        marginTop: Spacing.sm,
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
        justifyContent: 'center',
    },
    modeButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.full,
        borderWidth: 2,
        borderColor: Colors.mediumGray,
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    modeButtonText: {
        ...TextStyles.bodySmall,
        color: Colors.textDark,
        fontWeight: '600',
    },
    modeButtonTextActive: {
        color: Colors.white,
    },
});
