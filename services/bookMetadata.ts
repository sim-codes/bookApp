import { GENRES } from '@/constants';
import { base64ToBytes } from '@/utils';
import * as FileSystem from 'expo-file-system/legacy';
import PdfThumbnail from 'react-native-pdf-thumbnail';
import { bookFiles } from './bookFiles';
import { readEpubMetadata } from './epubMetadata';
import { readPdfMetadata } from './pdfMetadata';

export interface BookMetadata {
    title: string;
    author?: string;
    genre?: string;
    coverUri?: string;
}

// The whole file is read into memory to parse it, so very large files are skipped.
const MAX_EPUB_BYTES = 100 * 1024 * 1024;
const MAX_PDF_BYTES = 50 * 1024 * 1024;

// Checked in order: "Non-Fiction" and "Science Fiction" must win over plain "Fiction".
const GENRE_KEYWORDS: [genre: string, keywords: string[]][] = [
    ['Non-Fiction', ['non-fiction', 'nonfiction']],
    ['Sci-Fi', ['science fiction', 'sci-fi', 'scifi']],
    ['Biography', ['biography', 'autobiography', 'memoir']],
    ['Mystery', ['mystery', 'detective', 'crime', 'thriller']],
    ['Romance', ['romance']],
    ['Fantasy', ['fantasy']],
    ['Fiction', ['fiction', 'novel']],
];

const titleFromFileName = (fileName: string): string =>
    fileName
        .replace(/\.[^.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const matchGenre = (subjects: string[]): string | undefined => {
    const text = subjects.join(' | ').toLowerCase();
    const match = GENRE_KEYWORDS.find(([, keywords]) => keywords.some(keyword => text.includes(keyword)));
    return match && GENRES.includes(match[0]) ? match[0] : undefined;
};

const readBytes = async (fileUri: string, maxBytes: number): Promise<Uint8Array | undefined> => {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists || (info.size ?? 0) > maxBytes) return undefined;
    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    return base64ToBytes(base64);
};

const readEpub = async (fileUri: string, fallback: BookMetadata): Promise<BookMetadata> => {
    const bytes = await readBytes(fileUri, MAX_EPUB_BYTES);
    if (!bytes) return fallback;
    const epub = readEpubMetadata(bytes);

    return {
        title: epub.title || fallback.title,
        author: epub.author,
        genre: matchGenre(epub.subjects),
        coverUri: epub.cover ? await bookFiles.saveTempCover(epub.cover.bytes, epub.cover.extension) : undefined,
    };
};

const renderFirstPage = async (fileUri: string): Promise<string | undefined> => {
    try {
        const { uri } = await PdfThumbnail.generate(fileUri, 0, { quality: 85, maxWidth: 600, maxHeight: 900 });
        return uri;
    } catch (error) {
        console.warn('Could not render PDF cover:', error);
        return undefined;
    }
};

const readPdfDetails = async (fileUri: string, fallback: BookMetadata): Promise<BookMetadata> => {
    try {
        const bytes = await readBytes(fileUri, MAX_PDF_BYTES);
        if (!bytes) return fallback;
        const pdf = await readPdfMetadata(bytes);
        return { title: pdf.title || fallback.title, author: pdf.author, genre: matchGenre(pdf.subjects) };
    } catch (error) {
        console.warn('Could not read PDF details:', error);
        return fallback;
    }
};

const readPdf = async (fileUri: string, fallback: BookMetadata): Promise<BookMetadata> => {
    const [details, coverUri] = await Promise.all([readPdfDetails(fileUri, fallback), renderFirstPage(fileUri)]);
    return { ...details, coverUri };
};

/** Read whatever title, author, genre and cover a picked book file carries, falling back to its file name. */
export async function extractBookMetadata(fileUri: string, fileName: string): Promise<BookMetadata> {
    const fallback: BookMetadata = { title: titleFromFileName(fileName) };
    try {
        const name = fileName.toLowerCase();
        if (name.endsWith('.epub')) return await readEpub(fileUri, fallback);
        if (name.endsWith('.pdf')) return await readPdf(fileUri, fallback);
    } catch (error) {
        console.error('Error reading book metadata:', error);
    }
    return fallback;
}
