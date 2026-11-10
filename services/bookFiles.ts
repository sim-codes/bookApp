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

async function download(url: string, dest: string): Promise<string> {
    const result = await FileSystem.downloadAsync(url, dest);
    if (result.status !== 200) {
        await FileSystem.deleteAsync(dest, { idempotent: true });
        throw new Error(`Download failed with status ${result.status}`);
    }
    return result.uri;
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

    /** Download a synced book's file into permanent storage and return its URI. */
    async downloadBook(url: string, bookId: string, fileName: string | undefined): Promise<string> {
        await ensureDir();
        return download(url, `${BOOKS_DIR}${bookId}.${getExtension(fileName ?? '', 'bin')}`);
    },

    /** Download a synced book's cover into permanent storage and return its URI. */
    async downloadCover(url: string, bookId: string): Promise<string> {
        await ensureDir();
        return download(url, `${BOOKS_DIR}${bookId}_cover_${generateId()}.jpg`);
    },

    /** Send a local file's bytes to a presigned upload URL. */
    async upload(url: string, uri: string): Promise<void> {
        const result = await FileSystem.uploadAsync(url, uri, {
            httpMethod: 'PUT',
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        });
        if (result.status < 200 || result.status >= 300) {
            throw new Error(`Upload failed with status ${result.status}`);
        }
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
