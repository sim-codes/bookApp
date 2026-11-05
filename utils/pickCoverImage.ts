import * as ImagePicker from 'expo-image-picker';

/** Lets the user pick a cover image through the system photo picker; resolves to its URI, or null if cancelled. */
export async function pickCoverImage(): Promise<string | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
    });

    return !result.canceled && result.assets?.length ? result.assets[0].uri : null;
}
