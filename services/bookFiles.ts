import { bytesToBase64, generateId } from '@/utils';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Pickers (document / image) hand back URIs inside the app's cache directory,
 * which the OS may purge at any time. Anything the library needs to keep must
 * be copied into the document directory first.
 */
const BOOKS_DIR = `${FileSystem.documentDirectory}books/`;

const getExtension = (nameOrUri: string, fallback: string): string => {
    const clean = nameOrUri.split('?')[0];
    const ext = clean.includes('.') ? clean.split('.').pop() : undefined;
    return ext && /^[a-z0-9]{1,5}$/i.test(ext) ? ext.toLowerCase() : fallback;
};

async function ensureDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(BOOKS_DIR);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(BOOKS_DIR, { intermediates: true });
    }
}

export const bookFiles = {
    /** True if the URI already lives in the permanent books directory. */
    isPersisted(uri?: string): boolean {
        return !!uri && uri.startsWith(BOOKS_DIR);
    },

    /** Copy a picked book file into permanent storage and return its new URI. */
    async persistBook(sourceUri: string, fileName: string, bookId: string): Promise<string> {
        await ensureDir();
        const dest = `${BOOKS_DIR}${bookId}.${getExtension(fileName, 'bin')}`;
        await FileSystem.copyAsync({ from: sourceUri, to: dest });
        return dest;
    },

    /** Copy a picked cover image into permanent storage and return its new URI. */
    async persistCover(sourceUri: string, bookId: string): Promise<string> {
        await ensureDir();
        // A fresh name per cover, so a replacement never collides with the old file or a cached image.
        const dest = `${BOOKS_DIR}${bookId}_cover_${generateId()}.${getExtension(sourceUri, 'jpg')}`;
        await FileSystem.copyAsync({ from: sourceUri, to: dest });
        return dest;
    },

    /** Write cover image bytes to a temporary cache file and return its URI. */
    async saveTempCover(bytes: Uint8Array, extension: string): Promise<string> {
        const uri = `${FileSystem.cacheDirectory}cover_${generateId()}.${getExtension(`x.${extension}`, 'jpg')}`;
        await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), {
            encoding: FileSystem.EncodingType.Base64,
        });
        return uri;
    },

    /** Best-effort delete of files we own; ignores URIs outside the books directory. */
    async remove(...uris: (string | undefined)[]): Promise<void> {
        await Promise.all(
            uris
                .filter((uri): uri is string => bookFiles.isPersisted(uri))
                .map(uri => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => { })),
        );
    },
};
